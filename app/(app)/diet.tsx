import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { StyledText } from '../../components/StyledText';
import { Accordion } from '../../components/Accordion';
import apiService from '../../services/apiService';

interface Food {
    name: string;
    amount: string;
    prot_amount: number;
    carb_amount: number;
    fat_amount: number;
    other_options: OtherOption[];
}

interface Meal {
    ref_name: string;
    time: string;
    foods: Food[];
}

interface OtherOption {
    name: string;
    amount: string;
    prot_amount: number;
    carb_amount: number;
    fat_amount: number;
}


interface DietData {
    total_kcal: number;
    total_protein: number;
    total_carb: number;
    total_fat: number;
    meals: Meal[];
}

const MacroPill = ({ label, value, unit, color }: { label: string, value: number, unit: string, color:string }) => (
    <View style={[styles.macroPill, { backgroundColor: color }]}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroValue}>{value}{unit}</Text>
    </View>
);

export default function DietScreen() {
    const { colors } = useTheme();
    const [dietData, setDietData] = useState<DietData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDietData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await apiService<{ diet_dict: DietData }>('/user/diet/', 'GET');
                setDietData(response.diet_dict);
            } catch (e: any) {
                setError(e.message || 'Could not load your diet plan.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDietData();
    }, []);


    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.appBackground }]}>
            <View style={styles.contentContainer}>
                <StyledText type="title" style={[styles.title, { color: colors.text }]}>
                    Your Daily Diet Plan
                </StyledText>

                {isLoading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{marginTop: 50}}/>
                ) : error ? (
                    <StyledText type="error" style={{textAlign: 'center'}}>{error}</StyledText>
                ) : dietData ? (
                    <>
                        <View style={[styles.card, { backgroundColor: colors.card }]}>
                            <StyledText type="subtitle" style={[styles.cardTitle, { color: colors.text }]}>Daily Totals</StyledText>
                            <View style={styles.macrosContainer}>
                                <MacroPill label="Calories" value={dietData.total_kcal} unit="kcal" color="#F97316" />
                                <MacroPill label="Protein" value={dietData.total_protein} unit="g" color="#3B82F6" />
                                <MacroPill label="Carbs" value={dietData.total_carb} unit="g" color="#10B981" />
                                <MacroPill label="Fat" value={dietData.total_fat} unit="g" color="#EAB308" />
                            </View>
                        </View>

                        {dietData.meals.sort((a, b) => a.time.localeCompare(b.time)).map((meal, index) => (
                            <Accordion key={index} title={meal.ref_name} headerContent={<Text style={{color: colors.placeholderText}}>{meal.time}</Text>}>
                                {meal.foods.map((food, foodIndex) => (
                                    <View key={foodIndex} style={[styles.foodItem, { borderBottomColor: colors.border, borderBottomWidth: food.other_options.length > 0 ? 1 : 0 }]}>
                                        <StyledText style={[styles.foodName, {color: colors.text}]}>{food.name}</StyledText>
                                        <StyledText style={[styles.foodAmount, {color: colors.placeholderText}]}>{food.amount}</StyledText>

                                        <View style={styles.foodMacros}>
                                            <Text style={[styles.foodMacroText, {color: colors.text}]}>P: {food.prot_amount}g</Text>
                                            <Text style={[styles.foodMacroText, {color: colors.text}]}>C: {food.carb_amount}g</Text>
                                            <Text style={[styles.foodMacroText, {color: colors.text}]}>F: {food.fat_amount}g</Text>
                                        </View>

                                        {Array.isArray(food.other_options) && food.other_options.length > 0 && (
                                            <View style={styles.optionsContainer}>
                                                <StyledText style={[styles.optionsTitle, {color: colors.text}]}>Other Options:</StyledText>
                                                {food.other_options.map((option, optIndex) => (
                                                    <View key={optIndex} style={[styles.optionItem, {borderTopColor: colors.border}]}>
                                                        <StyledText style={[styles.optionName, {color: colors.text}]}>• {option.name}</StyledText>
                                                        <StyledText style={[styles.optionAmount, {color: colors.placeholderText}]}>{option.amount}</StyledText>
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </Accordion>
                        ))}
                    </>
                ) : (
                    <StyledText style={{textAlign: 'center'}}>No diet plan found.</StyledText>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingTop: 60,
    },
    title: {
        textAlign: 'center',
        marginBottom: 30,
    },
    card: {
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
    },
    cardTitle: {
        textAlign: 'center',
        marginBottom: 15,
    },
    macrosContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
    },
    macroPill: {
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 15,
        alignItems: 'center',
        margin: 5,
        minWidth: '40%',
    },
    macroLabel: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    macroValue: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    foodItem: {
        paddingVertical: 10,
        marginBottom: 10,
        borderBottomWidth: 1,
    },
    foodName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    foodAmount: {
        fontSize: 14,
        marginBottom: 8,
    },
    foodMacros: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    foodMacroText: {
        fontSize: 14,
        fontWeight: '500',
    },
    optionsContainer: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderColor: '#e0e0e0'
    },
    optionsTitle: {
        fontWeight: 'bold',
        marginBottom: 10,
        fontSize: 15,
    },
    optionItem: {
        marginLeft: 5,
        marginBottom: 10,
    },
    optionName: {
        fontWeight: '500'
    },
    optionAmount: {
        marginLeft: 8,
        fontSize: 13
    },
});
