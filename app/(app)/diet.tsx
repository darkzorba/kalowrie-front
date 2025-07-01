import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, LayoutAnimation, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, UIManager, View } from 'react-native';
import { StyledText } from '../../components/StyledText';
import { useLocalization } from '../../contexts/LocalizationContext';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/apiService';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}


interface Substitute { name: string; total_proteins: number; total_fats: number; total_carbs: number; quantity: number; unit: string; }
interface Ingredient { name: string; total_proteins: number; total_fats: number; total_carbs: number; total_calories: number; quantity: number; unit: string; substitutes: Substitute[]; }
interface Meal { name: string; time: string; total_proteins: number; total_carbs: number; total_fats: number; total_calories: number; ingredients: Ingredient[]; }
interface DietData { total_kcals: number; proteins_g: number; carbs_g: number; fats_g: number; meals: Meal[]; }


const MacroPill = ({ label, value, unit, color }: { label: string, value: number, unit: string, color: string }) => (
    <View style={[styles.macroPill, { backgroundColor: color }]}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroValue}>{Math.round(value)}{unit}</Text>
    </View>
);

const IngredientRow = ({ item, colors, isSubstitute = false }: { item: Substitute | Ingredient, colors: any, isSubstitute?: boolean }) => (
    <View style={isSubstitute ? styles.substituteItem : {}}>
        <View style={styles.foodHeader}>
            <Text style={[styles.foodName, { color: colors.text }]}>{isSubstitute && '↳ '} {item.name}</Text>
            <Text style={[styles.foodAmount, { color: colors.placeholderText }]}>{item.quantity}{item.unit}</Text>
        </View>
        <View style={styles.foodMacros}>
            <Text style={[styles.foodMacroText, {color: colors.text}]}>P: {item.total_proteins}g</Text>
            <Text style={[styles.foodMacroText, {color: colors.text}]}>C: {item.total_carbs}g</Text>
            <Text style={[styles.foodMacroText, {color: colors.text}]}>F: {item.total_fats}g</Text>
        </View>
    </View>
);

const MealCard = ({ meal, colors, t }: { meal: Meal, colors: any, t: (key: string) => string }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsExpanded(!isExpanded);
    };

    return (
        <View style={[styles.mealCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity onPress={toggleExpand} style={styles.mealHeader}>
                <View>
                    <Text style={[styles.mealName, { color: colors.text }]}>{meal.name}</Text>
                    <Text style={[styles.mealTime, { color: colors.primary }]}>{meal.time}</Text>
                </View>
                <View style={styles.mealMacros}>
                    <Text style={[styles.mealKcal, { color: colors.text }]}>{Math.round(meal.total_calories)} kcal</Text>
                    <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={24} color={colors.text} />
                </View>
            </TouchableOpacity>

            {isExpanded && (
                <View style={styles.ingredientsContainer}>
                    {meal.ingredients.map((ingredient, foodIndex) => (
                        <View key={foodIndex} style={[styles.foodItem, { borderBottomColor: colors.border }]}>
                            <IngredientRow item={ingredient} colors={colors} />
                            {Array.isArray(ingredient.substitutes) && ingredient.substitutes.length > 0 && (
                                <View style={styles.optionsContainer}>
                                    <StyledText style={[styles.optionsTitle, {color: colors.text}]}>{t('substitutes')}</StyledText>
                                    {ingredient.substitutes.map((sub, optIndex) => (
                                        <IngredientRow key={optIndex} item={sub} colors={colors} isSubstitute={true} />
                                    ))}
                                </View>
                            )}
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
};


export default function DietScreen() {
    const { colors } = useTheme();
    const { t } = useLocalization();
    const [dietData, setDietData] = useState<DietData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useFocusEffect(
        useCallback(() => {
            const fetchDietData = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const response = await apiService<{diet_dict:DietData}>('/user/diet/', 'GET');
                    setDietData(response.diet_dict);
                } catch (e: any) {
                    setError(e.message || t('couldNotLoadDietPlan'));
                } finally {
                    setIsLoading(false);
                }
            };
            fetchDietData();
        }, [])
    );

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.appBackground }]}>
            <View style={styles.contentContainer}>
                <StyledText type="title" style={[styles.title, { color: colors.text }]}>
                    {t('yourDailyDietPlan')}
                </StyledText>

                {isLoading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{marginTop: 50}}/>
                ) : error ? (
                    <StyledText type="error" style={{textAlign: 'center'}}>{error}</StyledText>
                ) : dietData ? (
                    <>
                        <View style={[styles.card, { backgroundColor: colors.card }]}>
                            <StyledText type="subtitle" style={[styles.cardTitle, { color: colors.text }]}>{t('dailyTotals')}</StyledText>
                            <View style={styles.macrosContainer}>
                                <MacroPill label={t('calories')} value={dietData.total_kcals} unit="kcal" color="#F97316" />
                                <MacroPill label={t('protein')} value={dietData.proteins_g} unit="g" color="#3B82F6" />
                                <MacroPill label={t('carbs')} value={dietData.carbs_g} unit="g" color="#10B981" />
                                <MacroPill label={t('fat')} value={dietData.fats_g} unit="g" color="#EAB308" />
                            </View>
                        </View>

                        {dietData.meals.sort((a, b) => a.time.localeCompare(b.time)).map((meal, index) => (
                            <MealCard key={index} meal={meal} colors={colors} t={t} />
                        ))}
                    </>
                ) : (
                    <StyledText style={{textAlign: 'center'}}>{t('noDietPlanFound')}</StyledText>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    contentContainer: { padding: 20, paddingTop: 60 },
    title: { textAlign: 'center', marginBottom: 30 },
    card: { borderRadius: 15, padding: 20, marginBottom: 20 },
    cardTitle: { textAlign: 'center', marginBottom: 15 },
    macrosContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' },
    macroPill: { borderRadius: 20, paddingVertical: 8, paddingHorizontal: 15, alignItems: 'center', margin: 5, minWidth: '40%' },
    macroLabel: { color: 'white', fontSize: 14, fontWeight: '500' },
    macroValue: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    mealCard: { borderRadius: 15, marginBottom: 15, borderWidth: 1 },
    mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
    mealName: { fontSize: 20, fontWeight: 'bold' },
    mealTime: { fontSize: 14, fontWeight: '500' },
    mealMacros: { alignItems: 'flex-end' },
    mealKcal: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    ingredientsContainer: { paddingTop: 10 },
    foodItem: { paddingHorizontal: 15, paddingBottom: 15, marginBottom: 10, borderBottomWidth: 1 },
    foodHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    foodName: { fontSize: 16, fontWeight: 'bold', flex: 1, flexWrap: 'wrap' },
    foodAmount: { fontSize: 14 },
    foodMacros: { flexDirection: 'row', justifyContent: 'flex-start', gap: 15 },
    foodMacroText: { fontSize: 13, fontWeight: '500' },
    optionsContainer: { marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderColor: '#e0e0e0' },
    optionsTitle: { fontWeight: 'bold', marginBottom: 10, fontSize: 14 },
    substituteItem: { marginLeft: 15, marginBottom: 10 },
});
