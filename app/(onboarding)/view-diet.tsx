import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { StyledText } from '../../components/StyledText';
import { StyledButton } from '../../components/StyledButton';
import { Accordion } from '../../components/Accordion';
import apiService from '../../services/apiService';

interface OtherOption {
    name: string;
    amount: string;
    prot_amount: number;
    carb_amount: number;
    fat_amount: number;
}

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

interface DietData {
    total_kcal: number;
    total_protein: number;
    total_carb: number;
    total_fat: number;
    meals: Meal[];
}


interface SaveDietResponse {
    diet_id: number;
    message: string;
}

const MacroPill = ({ label, value, unit, color }: { label: string, value: number, unit: string, color: string }) => (
    <View style={[styles.macroPill, { backgroundColor: color }]}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroValue}>{value}{unit}</Text>
    </View>
);

export default function ViewDietScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { colors } = useTheme();
    const { completeOnboarding, setDietId } = useAuth();
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
            const response = await apiService<SaveDietResponse>('/user/diet/', 'POST', { diet_json: dietData });


            if (response.diet_id) {
                await setDietId(response.diet_id);
            }

            await completeOnboarding();
            router.replace('/(app)/home');
        } catch (e: any) {
            const errorMessage = e.data?.message || e.message || 'Failed to save diet. Please try again.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.appBackground }]}>
            <View style={styles.content}>
                <StyledText type="title" style={[styles.mainTitle, { color: colors.text }]}>Your Personalized Diet</StyledText>

                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <StyledText type="subtitle" style={[styles.cardTitle, { color: colors.text }]}>Daily Totals</StyledText>
                    <View style={styles.macrosContainer}>
                        <MacroPill label="Calories" value={dietData.total_kcal} unit="kcal" color="#F97316" />
                        <MacroPill label="Protein" value={dietData.total_protein} unit="g" color="#3B82F6" />
                        <MacroPill label="Carbs" value={dietData.total_carb} unit="g" color="#10B981" />
                        <MacroPill label="Fat" value={dietData.total_fat} unit="g" color="#EAB308" />
                    </View>
                </View>

                {dietData.meals.map((meal, index) => (
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

                {error ? <StyledText type="error" style={styles.errorText}>{error}</StyledText> : null}

                <StyledButton
                    title="Let's Get Started!"
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
    container: {
        flex: 1,
    },
    content: {
        padding: 15,
    },
    mainTitle: {
        textAlign: 'center',
        marginBottom: 20,
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
        paddingBottom: 15,
        marginBottom: 10,
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
    confirmButton: {
        marginTop: 20,
        marginBottom: 40,
    },
    errorText: {
        textAlign: 'center',
        marginTop: 10,
    }
});
