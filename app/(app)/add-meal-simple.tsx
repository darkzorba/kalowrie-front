import { useLocalization } from "@/contexts/LocalizationContext";
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import KeyboardAvoidingWrapper from '../../components/KeyboardAvoidingWrapper';
import { StyledButton } from '../../components/StyledButton';
import { StyledPicker } from '../../components/StyledPicker';
import { StyledText } from '../../components/StyledText';
import { StyledTextInput } from '../../components/StyledTextInput';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/apiService';


interface Ingredient {
    id: number;
    foodId: string | null;
    amount: string;
    unit: string;
    macros: TotalMacros;
}

interface ApiFood {
    name: string;
    quantity: number;
    carbs_g: number;
    proteins_g: number;
    fats_g: number;
    calories: number;
    category_name: string;
    grams_per_unit?: number;
}

interface FoodOption {
    label: string;
    value: string;
    food: ApiFood;
}

interface FoodsApiResponse {
    status: boolean;
    foods_list: ApiFood[][];
    status_code: number;
}

interface TotalMacros {
    calories: number;
    proteins: number;
    carbs: number;
    fats: number;
}




const unitConversionFactors: { [key: string]: number } = {
    gr: 1,
    ml: 1,
    tbsp: 15,
    tsp: 5,
    cup: 240,
};


const FoodSearchModal: React.FC<{
    isVisible: boolean;
    onClose: () => void;
    foods: FoodOption[];
    onSelect: (item: FoodOption) => void;
}> = ({ isVisible, onClose, foods, onSelect }) => {
    const { colors } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredFoods = foods.filter(food => {
        if (!searchQuery.trim()) return true;
        
        const queryWords = searchQuery.toLowerCase().trim().split(/\s+/);
        const foodName = (food.label?.toLowerCase() || '');
        const categoryName = (food.food?.category_name?.toLowerCase() || '');
        const searchableText = `${foodName} ${categoryName}`;
        
        return queryWords.every(word => searchableText.includes(word));
    });

    const renderItem = ({ item }: { item: FoodOption }) => (
        <TouchableOpacity onPress={() => onSelect(item)} style={[styles.itemContainer, { borderBottomColor: colors.border }]}>
            <View style={styles.itemInfo}>
                <Text style={[styles.itemText, { color: colors.text }]}>{item.food?.name || 'Nome não disponível'}</Text>
                <Text style={[styles.itemSubText, { color: colors.placeholderText }]}>
                    {item.food?.category_name || 'Categoria não disponível'} - per {item.food?.quantity || 0}g
                </Text>
            </View>
            <View style={styles.itemMacros}>
                <Text style={[styles.itemMacroText, { color: colors.text }]}>P: {item.food?.proteins_g || 0}g</Text>
                <Text style={[styles.itemMacroText, { color: colors.text }]}>C: {item.food?.carbs_g || 0}g</Text>
                <Text style={[styles.itemMacroText, { color: colors.text }]}>F: {item.food?.fats_g || 0}g</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <Modal visible={isVisible} onRequestClose={onClose} animationType="slide">
            <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.appBackground }]}>
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Select an Ingredient</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close-circle" size={30} color={colors.text} />
                    </TouchableOpacity>
                </View>
                <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
                    <Ionicons name="search" size={20} color={colors.placeholderText} style={{marginLeft: 10}}/>
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search for a food..."
                        placeholderTextColor={colors.placeholderText}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <FlatList
                    data={filteredFoods}
                    renderItem={renderItem}
                    keyExtractor={item => item.value}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            </SafeAreaView>
        </Modal>
    );
};


export default function AddMealSimpleScreen() {
    const { t } = useLocalization();
    const baseUnitOptions = useMemo(() => [
        { label: t('grams'), value: 'gr' },
        { label: t('milliliters'), value: 'ml' },
        { label: t('tablespoon'), value: 'tbsp' },
        { label: t('teaspoon'), value: 'tsp' },
        { label: t('cup'), value: 'cup' },
    ], [t]);
    const { colors } = useTheme();
    const router = useRouter();
    const { user } = useAuth();
    const [mealName, setMealName] = useState('');
    const [mealDate, setMealDate] = useState(new Date());
    const [ingredients, setIngredients] = useState<Ingredient[]>([{ id: 1, foodId: null, amount: '', unit: 'gr', macros: { calories: 0, proteins: 0, carbs: 0, fats: 0 } }]);
    const [availableFoods, setAvailableFoods] = useState<FoodOption[]>([]);
    const [totalMacros, setTotalMacros] = useState<TotalMacros>({ calories: 0, proteins: 0, carbs: 0, fats: 0 });

    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingFoods, setIsFetchingFoods] = useState(true);
    const [isFoodModalVisible, setFoodModalVisible] = useState(false);
    const [activeIngredientId, setActiveIngredientId] = useState<number | null>(null);
    const [error, setError] = useState('');

    const resetForm = useCallback(() => {
        setMealName('');
        setIngredients([{ id: 1, foodId: null, amount: '', unit: 'gr', macros: { calories: 0, proteins: 0, carbs: 0, fats: 0 } }]);
        setTotalMacros({ calories: 0, proteins: 0, carbs: 0, fats: 0 });
        setMealDate(new Date());
        setError('');
        setIsLoading(false);
    }, []);

    useFocusEffect(resetForm);

    useEffect(() => {
        const fetchFoods = async () => {
            setIsFetchingFoods(true);
            try {
                const response = await apiService<FoodsApiResponse>('/food/all', 'GET');
                if (response.status && Array.isArray(response.foods_list)) {
                    const foodOptions = response.foods_list.flat().map((food, index) => ({
                        label: food.name,
                        value: `${food.name}-${index}`,
                        food: food,
                    }));
                    setAvailableFoods(foodOptions);
                } else {
                    throw new Error(t("invalidResponseError"));
                }
            } catch (e: any) {
                setError(e.message || t('couldNotLoadFood'));
            } finally {
                setIsFetchingFoods(false);
            }
        };
        fetchFoods();
    }, []);

    useEffect(() => {
        const updatedIngredients = ingredients.map(ing => {
            if (!ing.foodId || !ing.amount) return { ...ing, macros: { calories: 0, proteins: 0, carbs: 0, fats: 0 } };

            const selectedFoodOption = availableFoods.find(f => f.value === ing.foodId);
            if (!selectedFoodOption) return { ...ing, macros: { calories: 0, proteins: 0, carbs: 0, fats: 0 } };

            const food = selectedFoodOption.food;
            const inputAmount = parseFloat(ing.amount) || 0;
            let amountInGrams = inputAmount;

            if (ing.unit === 'unit' && food.grams_per_unit) {
                amountInGrams = inputAmount * food.grams_per_unit;
            } else if (unitConversionFactors[ing.unit]) {
                amountInGrams = inputAmount * unitConversionFactors[ing.unit];
            }

            if (food.quantity > 0) {
                const calculatedMacros = {
                    calories: (amountInGrams * food.calories) / food.quantity,
                    proteins: (amountInGrams * food.proteins_g) / food.quantity,
                    carbs: (amountInGrams * food.carbs_g) / food.quantity,
                    fats: (amountInGrams * food.fats_g) / food.quantity,
                };
                return { ...ing, macros: calculatedMacros };
            }
            return { ...ing, macros: { calories: 0, proteins: 0, carbs: 0, fats: 0 } };
        });

        const totals = updatedIngredients.reduce((acc, ing) => {
            acc.calories += ing.macros.calories;
            acc.proteins += ing.macros.proteins;
            acc.carbs += ing.macros.carbs;
            acc.fats += ing.macros.fats;
            return acc;
        }, { calories: 0, proteins: 0, carbs: 0, fats: 0 });

        setTotalMacros(totals);
    }, [ingredients, availableFoods]);


    const handleIngredientChange = (id: number, field: keyof Omit<Ingredient, 'macros'>, value: any) => {
        setIngredients(prevIngredients =>
            prevIngredients.map(ing => (ing.id === id ? { ...ing, [field]: value } : ing))
        );
    };

    const onFoodSelect = (item: FoodOption) => {
        if (activeIngredientId !== null) {
            handleIngredientChange(activeIngredientId, 'foodId', item.value);

            const selectedFood = item.food;
            const currentIngredient = ingredients.find(ing => ing.id === activeIngredientId);
            if (currentIngredient && currentIngredient.unit === 'unit' && !selectedFood.grams_per_unit) {
                handleIngredientChange(activeIngredientId, 'unit', 'gr');
            }
        }
        setFoodModalVisible(false);
        setActiveIngredientId(null);
    };

    const getUnitOptionsForIngredient = (foodId: string | null) => {
        if (foodId) {
            const selectedFoodOption = availableFoods.find(f => f.value === foodId);
            if (selectedFoodOption?.food.grams_per_unit) {
                return [...baseUnitOptions, { label: t('unitLabel'), value: 'unit' }];
            }
        }
        return baseUnitOptions;
    };

    const openFoodModal = (ingredientId: number) => {
        setActiveIngredientId(ingredientId);
        setFoodModalVisible(true);
    };

    const addIngredient = () => {
        const newId = ingredients.length > 0 ? Math.max(...ingredients.map(i => i.id)) + 1 : 1;
        setIngredients(prev => [...prev, { id: newId, foodId: null, amount: '', unit: 'gr', macros: { calories: 0, proteins: 0, carbs: 0, fats: 0 } }]);
    };

    const removeIngredient = (id: number) => {
        setIngredients(prev => prev.filter(ing => ing.id !== id));
    };

    const handleSaveMeal = async () => {
        setError('');
        if (!mealName.trim()) {
            setError(t('noMealNameError'));
            return;
        }
        if (!user?.dietId) {
            setError(t('noUserDietError'));
            return;
        }

        setIsLoading(true);
        try {
            const requestBody = {
                name: mealName,
                meal_time: mealDate.toTimeString().split(' ')[0],
                meal_date: mealDate.toISOString().split('T')[0],
                total_kcals: totalMacros.calories,
                total_proteins: totalMacros.proteins,
                total_carbs: totalMacros.carbs,
                total_fats: totalMacros.fats,
                diet_id: user.dietId,
                list_ingredients: ingredients.map(ing => {
                    const selectedFood = availableFoods.find(f => f.value === ing.foodId);
                    return {
                        name: selectedFood ? selectedFood.food.name : '',
                        quantity: parseFloat(ing.amount) || 0,
                        default_unit: ing.unit,
                    };
                }),
            };

            await apiService('/user/diet/meal', 'POST', requestBody);

            Alert.alert(t("success"), t("successSaveMeal"), [
                { text: t("ok"), onPress: () => router.back() }
            ]);
        } catch (e: any) {
            setError(e.message || t('mealSaveFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingWrapper style={{ flex: 1, backgroundColor: colors.appBackground }}>
            <SafeAreaView style={[styles.container]}>
            <ScrollView contentContainerStyle={styles.container}>
                <StyledText type="title" style={{ color: colors.text, marginBottom: 20, textAlign: 'center' }}>
                    {t('addMeal')}
                </StyledText>

                <StyledTextInput
                    label={t("mealName")}
                    placeholder={t("mealNamePlaceholder")}
                    value={mealName}
                    onChangeText={setMealName}
                    containerStyle={{ marginBottom: 15 }}
                />

                <View style={[styles.totalsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.totalsTitle, { color: colors.text }]}>{t('mealTotals')}</Text>
                    <View style={styles.totalsContent}>
                        <Text style={[styles.caloriesText, { color: colors.primary }]}>{Math.round(totalMacros.calories)} kcal</Text>
                        <View style={styles.macrosRow}>
                            <Text style={[styles.totalMacroText, {color: colors.text}]}>P: {Math.round(totalMacros.proteins)}g</Text>
                            <Text style={[styles.totalMacroText, {color: colors.text}]}>C: {Math.round(totalMacros.carbs)}g</Text>
                            <Text style={[styles.totalMacroText, {color: colors.text}]}>F: {Math.round(totalMacros.fats)}g</Text>
                        </View>
                    </View>
                </View>

                <View style={[styles.ingredientsListContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <StyledText style={[styles.ingredientsListTitle, { color: colors.text }]}>{t('ingredients')}</StyledText>

                    {ingredients.map((ingredient) => {
                        const selectedFood = availableFoods.find(f => f.value === ingredient.foodId);
                        const ingredientMacros = ingredient.macros;
                        return (
                            <View key={ingredient.id} style={[styles.ingredientCard, { borderBottomColor: colors.border }]}>
                                <TouchableOpacity style={styles.removeButton} onPress={() => removeIngredient(ingredient.id)}>
                                    <Ionicons name="close-circle" size={24} color={colors.placeholderText} />
                                </TouchableOpacity>

                                <TouchableOpacity style={[styles.foodSelectButton, {backgroundColor: colors.inputBackground, borderColor: colors.border}]} onPress={() => openFoodModal(ingredient.id)}>
                                    <Text style={[styles.selectedTextStyle, {color: selectedFood ? colors.text : colors.placeholderText}]} numberOfLines={1}>
                                        {selectedFood ? selectedFood.label : (isFetchingFoods ? t("loading") : t("selectIngredient"))}
                                    </Text>
                                    <Ionicons name="chevron-down" size={18} color={colors.placeholderText} />
                                </TouchableOpacity>

                                <View style={styles.amountRow}>
                                    <StyledTextInput
                                        containerStyle={{ flex: 2, marginRight: 10 }}
                                        label={t("quantity")}
                                        placeholder="e.g., 100"
                                        value={ingredient.amount}
                                        onChangeText={(text) => handleIngredientChange(ingredient.id, 'amount', text)}
                                        keyboardType="numeric"
                                    />
                                    <StyledPicker
                                        containerStyle={{ flex: 1.5 }}
                                        label={t("unit")}
                                        items={getUnitOptionsForIngredient(ingredient.foodId)}
                                        selectedValue={ingredient.unit}
                                        onValueChange={(value) => handleIngredientChange(ingredient.id, 'unit', value as string)}

                                    />
                                </View>

                                {ingredient.macros.calories > 0 && (
                                    <View style={[styles.ingredientMacrosContainer, {backgroundColor: colors.inputBackground}]}>
                                        <Text style={[styles.ingredientMacroText, { color: colors.primary, fontWeight: 'bold' }]}>{Math.round(ingredient.macros.calories)} kcal</Text>
                                        <Text style={[styles.ingredientMacroText, {color: colors.text}]}>P:{Math.round(ingredient.macros.proteins)}g</Text>
                                        <Text style={[styles.ingredientMacroText, {color: colors.text}]}>C:{Math.round(ingredient.macros.carbs)}g</Text>
                                        <Text style={[styles.ingredientMacroText, {color: colors.text}]}>F:{Math.round(ingredient.macros.fats)}g</Text>
                                    </View>
                                )}

                            </View>
                        );
                    })}

                    <StyledButton
                        title={t("addIngredient")}
                        onPress={addIngredient}
                        variant="text"
                        icon={<Ionicons name="add" size={20} color={colors.primary} />}
                        style={{ alignSelf: 'center', marginTop: 10 }}
                        textStyle={{color: colors.primary}}
                    />
                </View>

                {error ? <StyledText type="error" style={styles.errorText}>{error}</StyledText> : null}

                <StyledButton
                    title={t("confirmAndSave")}
                    onPress={handleSaveMeal}
                    loading={isLoading}
                    disabled={isLoading}
                    style={{ marginTop: 30 }}
                />
            </ScrollView>
            </SafeAreaView>

            <FoodSearchModal
                isVisible={isFoodModalVisible}
                onClose={() => setFoodModalVisible(false)}
                foods={availableFoods}
                onSelect={onFoodSelect}
            />
        </KeyboardAvoidingWrapper>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20 },
    totalsCard: { borderRadius: 15, borderWidth: 1, padding: 15, marginBottom: 20 },
    totalsTitle: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
    totalsContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    caloriesText: { fontSize: 22, fontWeight: 'bold' },
    macrosRow: { alignItems: 'flex-end' },
    totalMacroText: { fontSize: 14 },
    ingredientsListContainer: { borderRadius: 15, borderWidth: 1, padding: 15, marginBottom: 20 },
    ingredientsListTitle: { fontSize: 18, fontWeight: '600', marginBottom: 15 },
    ingredientCard: { padding: 15, marginBottom: 15, borderBottomWidth: 1, backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 10 },
    removeButton: { position: 'absolute', top: 5, right: 5, zIndex: 1, padding: 5 },
    foodSelectButton: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    selectedTextStyle: { fontSize: 16 },
    amountRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 10 },
    ingredientMacrosContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8, borderRadius: 8, marginTop: 15 },
    ingredientMacroText: { fontSize: 13, fontWeight: '500' },
    errorText: { textAlign: 'center', marginTop: 10 },
    modalContainer: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, margin: 15, paddingHorizontal: 5 },
    searchInput: { flex: 1, height: 45, fontSize: 16, marginLeft: 10 },
    itemContainer: { paddingVertical: 15, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 },
    itemInfo: { flex: 1, marginRight: 10 },
    itemText: { fontSize: 16, fontWeight: '500', flexWrap: 'wrap' },
    itemSubText: { fontSize: 12, marginTop: 2 },
    itemMacros: { alignItems: 'flex-end' },
    itemMacroText: { fontSize: 12, fontWeight: '400' },
});
