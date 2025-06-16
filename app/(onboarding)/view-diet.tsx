import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLocalization } from '../../contexts/LocalizationContext';
import { StyledText } from '../../components/StyledText';
import { StyledButton } from '../../components/StyledButton';
import apiService from '../../services/apiService';
import { Ionicons } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}


interface Substitute { name: string; total_proteins: number; total_fats: number; total_carbs: number; quantity: number; unit: string; }
interface Ingredient { name: string; total_proteins: number; total_fats: number; total_carbs: number; total_calories: number; quantity: number; unit: string; substitutes: Substitute[]; }
interface Meal { name: string; time: string; total_proteins: number; total_carbs: number; total_fats: number; total_calories: number; ingredients: Ingredient[]; }
interface DietData { total_kcals: number; proteins_g: number; carbs_g: number; fats_g: number; meals: Meal[]; }
interface SaveDietResponse { diet_id: number; message: string; }


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


export default function ViewDietScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { colors } = useTheme();
    const { completeOnboarding, setDietId } = useAuth();
    const { t } = useLocalization();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    if (!params.dietData || typeof params.dietData !== 'string') {
        return (
            <View style={styles.container}>
                <StyledText>No diet data found. Please go back.</StyledText>
                <StyledButton title="Go Back" onPress={() => router.back()} />
            </View>
        );
    }

    const dietData: DietData = JSON.parse(params.dietData);

    const handleConfirm = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await apiService<SaveDietResponse>('/user/diet/', 'POST', dietData);
            if (response.diet_id) {
                await setDietId(response.diet_id);
            }
            await completeOnboarding();
            router.replace('/(app)/home');
        } catch (e: any) {
            setError(e.data?.message || 'Failed to save diet. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.appBackground }]}>
            <View style={styles.content}>
                <StyledText type="title" style={[styles.mainTitle, { color: colors.text }]}>{t('yourPersonalizedDiet')}</StyledText>

                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <StyledText type="subtitle" style={[styles.cardTitle, { color: colors.text }]}>{t('dailyTotals')}</StyledText>
                    <View style={styles.macrosContainer}>
                        <MacroPill label={t('calories')} value={dietData.total_kcals} unit="kcal" color="#F97316" />
                        <MacroPill label={t('protein')} value={dietData.proteins_g} unit="g" color="#3B82F6" />
                        <MacroPill label={t('carbs')} value={dietData.carbs_g} unit="g" color="#10B981" />
                        <MacroPill label={t('fat')} value={dietData.fats_g} unit="g" color="#EAB308" />
                    </View>
                </View>

                {dietData.meals.map((meal, index) => (
                    <MealCard key={index} meal={meal} colors={colors} t={t} />
                ))}

                {error ? <StyledText type="error" style={styles.errorText}>{error}</StyledText> : null}

                <StyledButton
                    title={t('letsGetStarted')}
                    onPress={handleConfirm}
                    style={styles.confirmButton}
                    loading={isLoading}
                    disabled={isLoading}
                />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 15 },
    mainTitle: { textAlign: 'center', marginBottom: 20 },
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
    confirmButton: { marginTop: 20, marginBottom: 40 },
    errorText: { textAlign: 'center', marginTop: 10 },
});
