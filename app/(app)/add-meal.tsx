import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Text, Animated } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { StyledText } from '../../components/StyledText';
import { StyledTextInput } from '../../components/StyledTextInput';
import { StyledButton } from '../../components/StyledButton';
import { StyledPicker } from '../../components/StyledPicker';
import { Ionicons } from '@expo/vector-icons';
import KeyboardAvoidingWrapper from '../../components/KeyboardAvoidingWrapper';
import apiService from '../../services/apiService';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import DateTimePickerModal from "react-native-modal-datetime-picker";

import { useSafeAreaInsets } from 'react-native-safe-area-context';


interface IngredientInput {
    id: number;
    name: string;
    quantity: string;
    default_unit: string;
}

interface CalculatedIngredient {
    name: string;
    total_carbs: number;
    total_proteins: number;
    total_fats: number;
    total_kcals: number;
    quantity: number;
    default_uni: string;
}

interface CalculatedMeal {
    name: string;
    total_carbs: number;
    total_proteins: number;
    total_fats: number;
    total_kcals: number;
    amount: string;
    ingredients: CalculatedIngredient[];
}

interface MacrosApiResponse {
    macros_dict: CalculatedMeal;
}


const unitOptions = [
    { label: 'Grams (gr)', value: 'gr' },
    { label: 'Milliliters (ml)', value: 'ml' },
    { label: 'Tablespoon (tbsp)', value: 'tbsp' },
    { label: 'Teaspoon (tsp)', value: 'tsp' },
    { label: 'Cup', value: 'cup' },
    { label: 'Unit', value: 'unit' },
    { label: 'Slice', value: 'slice' },
];

const CALCULATION_MESSAGES = [
    'Analyzing ingredients...',
    'Calculating macronutrients...',
    'Cross-referencing nutritional data...',
    'Finalizing your numbers...'
];


const MacroDisplay = ({ label, value, color, textColor }: { label: string; value: number; color: string; textColor: string }) => (
    <View style={styles.macroDisplay}>
        <View style={[styles.macroDot, { backgroundColor: color }]} />
        <Text style={[styles.macroText, { color: textColor }]}>{label}: {Math.round(value)}g</Text>
    </View>
);

const BouncingFruit = ({ yAnim, emoji }: { yAnim: Animated.Value, emoji: string }) => (
    <Animated.Text style={[styles.fruitLoader, { transform: [{ translateY: yAnim }] }]}>
        {emoji}
    </Animated.Text>
);


export default function AddMealScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const { user } = useAuth();
    const params = useLocalSearchParams<{ calculatedMealData?: string }>();

    const insets = useSafeAreaInsets();

    const [mealName, setMealName] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [ingredients, setIngredients] = useState<IngredientInput[]>([
        { id: 1, name: '', quantity: '', default_unit: 'gr' }
    ]);

    const [isCalculating, setIsCalculating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [calculatedMeal, setCalculatedMeal] = useState<CalculatedMeal | null>(null);
    const [mealDate, setMealDate] = useState(new Date());
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [isTimePickerVisible, setTimePickerVisibility] = useState(false);


    const resetForm = () => {
        setMealName('');
        setTotalAmount('');
        setIngredients([{ id: 1, name: '', quantity: '', default_unit: 'gr' }]);
        setCalculatedMeal(null);
        setMealDate(new Date());
        setError('');
    };

    useFocusEffect(
        useCallback(() => {
            if (params.calculatedMealData) {
                try {
                    const mealData = JSON.parse(params.calculatedMealData);
                    setCalculatedMeal(mealData);
                } catch (e) {
                    console.error("Failed to parse calculated meal data", e);
                    resetForm();
                }
            } else {
                resetForm();
            }
            return () => {};
        }, [params.calculatedMealData])
    );

    const addIngredient = () => {
        const newId = ingredients.length > 0 ? Math.max(...ingredients.map(i => i.id)) + 1 : 1;
        setIngredients([...ingredients, { id: newId, name: '', quantity: '', default_unit: 'gr' }]);
    };

    const removeIngredient = (id: number) => {
        setIngredients(ingredients.filter(ing => ing.id !== id));
    };

    const handleIngredientChange = (id: number, field: 'name' | 'quantity' | 'default_unit', value: string) => {
        setIngredients(
            ingredients.map(ing => (ing.id === id ? { ...ing, [field]: value } : ing))
        );
    };

    const calculateMacros = async () => {
        setError('');
        if (!mealName || !totalAmount) {
            setError('Please fill in the Meal Name and Total Amount.');
            return;
        }

        setIsCalculating(true);
        try {
            const list_ingredients = ingredients.map(ing => ({
                name: ing.name,
                quantity: parseInt(ing.quantity, 10) || 0,
                default_unit: ing.default_unit
            }));

            const requestBody = {
                name: mealName,
                amount: totalAmount,
                list_ingredients: list_ingredients,
            };

            const response = await apiService<MacrosApiResponse>('/ai/track/macros', 'POST', requestBody);
            setCalculatedMeal(response.macros_dict);

        } catch (e: any) {
            const errorMessage = e.data?.message || e.message || "Failed to calculate macros.";
            setError(errorMessage);
        } finally {
            setIsCalculating(false);
        }
    };

    const handleSaveMeal = async () => {
        if (!calculatedMeal) return;

        setIsSaving(true);
        try {
            const requestBody = {
                name: calculatedMeal.name,
                meal_time: mealDate.toTimeString().split(' ')[0],
                meal_date: mealDate.toISOString().split('T')[0],
                total_kcals: calculatedMeal.total_kcals,
                total_proteins: calculatedMeal.total_proteins,
                total_carbs: calculatedMeal.total_carbs,
                total_fats: calculatedMeal.total_fats,
                diet_id: user?.dietId,
                list_ingredients: calculatedMeal.ingredients.map(ing => ({
                    name: ing.name,
                    quantity: ing.quantity,
                    default_unit: ing.default_uni
                }))
            };

            await apiService('/user/diet/meal', 'POST', requestBody);

            Alert.alert('Success', 'Your meal has been saved and tracked!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (e: any) {
            const errorMessage = e.data?.message || e.message || "Failed to save the meal.";
            Alert.alert('Error', errorMessage);
        } finally {
            setIsSaving(false);
            router.replace("/(app)/home")
        }
    };


    if (isCalculating) return <CalculatingMacrosView />;

    if (calculatedMeal) {
        return (
            <ScrollView
                style={{ flex: 1, backgroundColor: colors.appBackground }}

                contentContainerStyle={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
            >
                <StyledText type="title" style={[styles.summaryTitle, { color: colors.text }]}>{calculatedMeal.name}</StyledText>
                <StyledText style={[styles.summaryAmount, { color: colors.placeholderText }]}>{calculatedMeal.amount}</StyledText>

                <View style={[styles.summaryCard, { backgroundColor: colors.card, marginBottom: 10 }]}>
                    <StyledText style={[styles.cardTitle, { color: colors.text }]}>Total Macronutrients</StyledText>
                    <StyledText style={[styles.totalKcals, { color: colors.text }]}>{Math.round(calculatedMeal.total_kcals)} kcal</StyledText>
                    <View style={styles.macrosContainer}>
                        <MacroDisplay label="Protein" value={calculatedMeal.total_proteins} color="#3B82F6" textColor={colors.text} />
                        <MacroDisplay label="Carbs" value={calculatedMeal.total_carbs} color="#10B981" textColor={colors.text} />
                        <MacroDisplay label="Fat" value={calculatedMeal.total_fats} color="#EAB308" textColor={colors.text} />
                    </View>
                </View>

                <View style={[styles.dateTimePickerContainer, { backgroundColor: colors.card }]}>
                    <TouchableOpacity style={styles.dateTimePickerButton} onPress={() => setDatePickerVisibility(true)}>
                        <Ionicons name="calendar-outline" size={20} color={colors.text} />
                        <Text style={[styles.dateTimePickerText, { color: colors.text }]}>{mealDate.toLocaleDateString()}</Text>
                    </TouchableOpacity>
                    <View style={[styles.separator, {backgroundColor: colors.border}]} />
                    <TouchableOpacity style={styles.dateTimePickerButton} onPress={() => setTimePickerVisibility(true)}>
                        <Ionicons name="time-outline" size={20} color={colors.text} />
                        <Text style={[styles.dateTimePickerText, { color: colors.text }]}>{mealDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </TouchableOpacity>
                </View>

                <DateTimePickerModal
                    isVisible={isDatePickerVisible} mode="date"
                    onConfirm={(date) => { setDatePickerVisibility(false); setMealDate(date); }}
                    onCancel={() => setDatePickerVisibility(false)}
                />
                <DateTimePickerModal
                    isVisible={isTimePickerVisible} mode="time"
                    onConfirm={(time) => { setTimePickerVisibility(false); setMealDate(time); }}
                    onCancel={() => setTimePickerVisibility(false)}
                />

                <StyledButton title="Confirm & Save Meal" onPress={handleSaveMeal} loading={isSaving} disabled={isSaving} style={{marginTop: 20}} />
                <StyledButton title="Recalculate" onPress={() => resetForm()} variant="text" />
            </ScrollView>
        );
    }

    return (
        <KeyboardAvoidingWrapper style={{ flex: 1, backgroundColor: colors.appBackground }}>
            <ScrollView

                contentContainerStyle={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom }]}
            >
                <StyledTextInput
                    label="Meal Name"
                    placeholder="e.g., Post-Workout Shake"
                    value={mealName}
                    onChangeText={setMealName}
                    containerStyle={{ marginBottom: 10 }}
                />

                <StyledTextInput
                    label="Total Amount"
                    placeholder="e.g., 220g or 1 bowl"
                    value={totalAmount}
                    onChangeText={setTotalAmount}
                    containerStyle={{ marginBottom: 20 }}
                />

                {ingredients.map((ingredient, index) => (

                    <View key={ingredient.id} style={[styles.ingredientContainer, { backgroundColor: colors.card }]}>
                        <View style={styles.ingredientHeader}>
                            <StyledText style={{fontSize: 16, fontWeight: '600', color: colors.text}}>Ingredient {index + 1}</StyledText>
                            {ingredients.length > 1 && (
                                <TouchableOpacity onPress={() => removeIngredient(ingredient.id)}>
                                    <Ionicons name="trash-outline" size={22} color={colors.error} />
                                </TouchableOpacity>
                            )}
                        </View>
                        <StyledTextInput
                            label="Ingredient Name"
                            placeholder="e.g., Whey Protein"
                            value={ingredient.name}
                            onChangeText={(text) => handleIngredientChange(ingredient.id, 'name', text)}
                        />
                        <StyledTextInput
                            label="Quantity"
                            placeholder="e.g., 30"
                            value={ingredient.quantity}
                            onChangeText={(text) => handleIngredientChange(ingredient.id, 'quantity', text)}
                            keyboardType="numeric"
                        />
                        <StyledPicker
                            label="Default Unit"
                            items={unitOptions}
                            selectedValue={ingredient.default_unit}
                            onValueChange={(value) => handleIngredientChange(ingredient.id, 'default_unit', value as string)}
                        />
                    </View>
                ))}

                <StyledButton
                    title="Add Ingredient"
                    onPress={addIngredient}
                    variant="outlined"
                    icon={<Ionicons name="add-outline" size={20} color={colors.primary} />}
                    style={{marginBottom: 20}}
                />

                {error ? <StyledText type="error" style={styles.errorText}>{error}</StyledText> : null}

                <StyledButton
                    title="Calculate Macronutrients"
                    onPress={calculateMacros}
                />
            </ScrollView>
        </KeyboardAvoidingWrapper>
    );
}


const CalculatingMacrosView = () => {
    const { colors } = useTheme();
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

    const yAnim1 = useRef(new Animated.Value(0)).current;
    const yAnim2 = useRef(new Animated.Value(0)).current;
    const yAnim3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const createBounceAnimation = (animValue: Animated.Value) => Animated.sequence([
            Animated.timing(animValue, { toValue: -15, duration: 400, useNativeDriver: true }),
            Animated.timing(animValue, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]);

        const loop1 = Animated.loop(createBounceAnimation(yAnim1));
        const loop2 = Animated.loop(createBounceAnimation(yAnim2));
        const loop3 = Animated.loop(createBounceAnimation(yAnim3));

        const timeouts = [
            setTimeout(() => loop1.start(), 0),
            setTimeout(() => loop2.start(), 200),
            setTimeout(() => loop3.start(), 400),
        ];

        const messageInterval = setInterval(() => {
            setCurrentMessageIndex(prevIndex => (prevIndex + 1) % CALCULATION_MESSAGES.length);
        }, 3000);

        return () => {
            loop1.stop();
            loop2.stop();
            loop3.stop();
            timeouts.forEach(clearTimeout);
            clearInterval(messageInterval);
        };
    }, []);

    return (
        <View style={[styles.loadingContainer, { backgroundColor: colors.appBackground }]}>
            <View style={styles.loaderContainer}>
                <BouncingFruit yAnim={yAnim1} emoji="🧀" />
                <BouncingFruit yAnim={yAnim2} emoji="🍗" />
                <BouncingFruit yAnim={yAnim3} emoji="🥦" />
            </View>
            <StyledText type="title" style={[styles.loadingTitle, { color: colors.text }]}>
                Calculating...
            </StyledText>
            <StyledText style={[styles.loadingMessage, { color: colors.text }]}>
                {CALCULATION_MESSAGES[currentMessageIndex]}
            </StyledText>
        </View>
    );
};



const styles = StyleSheet.create({

    container: {
        paddingHorizontal: 20,
        flexGrow: 1,
    },
    ingredientContainer: {
        borderRadius: 15,
        padding: 15,
        marginBottom: 20,

    },
    ingredientHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    errorText: {
        textAlign: 'center',
        marginBottom: 10
    },


    summaryTitle: {
        textAlign: 'center',
        fontSize: 26,
        fontWeight: 'bold',
        marginTop: 20,
    },
    summaryAmount: {
        textAlign: 'center',
        marginBottom: 20,
        fontSize: 16,
    },
    summaryCard: {
        borderRadius: 15,
        padding: 20,
        alignItems: 'center'
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600'
    },
    totalKcals: {
        fontSize: 36,
        fontWeight: 'bold',
        marginVertical: 10
    },
    macrosContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%'
    },
    macroDisplay: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    macroDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8
    },
    macroText: {
        fontSize: 16
    },
    dateTimePickerContainer: {
        flexDirection: 'row',
        borderRadius: 15,
        overflow: 'hidden',
        marginTop: 20
    },
    dateTimePickerButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15
    },
    dateTimePickerText: {
        fontSize: 16,
        marginLeft: 10
    },
    separator: {
        width: 1
    },


    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    loaderContainer: {
        flexDirection: 'row',
        marginBottom: 40
    },
    fruitLoader: {
        fontSize: 50,
        marginHorizontal: 10
    },
    loadingTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20
    },
    loadingMessage: {
        fontSize: 18,
        textAlign: 'center',
        height: 50,
        paddingHorizontal: 10
    },
});