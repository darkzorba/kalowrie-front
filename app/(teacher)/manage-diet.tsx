import { useLocalization } from '@/contexts/LocalizationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import KeyboardAvoidingWrapper from '@/components/KeyboardAvoidingWrapper';
import { StyledButton } from '@/components/StyledButton';
import { StyledPicker } from '@/components/StyledPicker';
import { StyledText } from '@/components/StyledText';
import { StyledTextInput } from '@/components/StyledTextInput';
import apiService from '@/services/apiService';


interface TotalMacros {
    calories: number;
    proteins: number;
    carbs: number;
    fats: number;
}

interface Food {
    id: number;
    foodId: string | null;
    quantity: string;
    unit: string;
    substitutions: Food[];
}

interface Meal {
    id: number;
    time: string;
    name: string;
    foods: Food[];
}

interface Diet {
    meals: Meal[];
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
}

interface ApiSubstitute { name: string; total_proteins: number; total_fats: number; total_carbs: number; quantity: number; unit: string; }
interface ApiIngredient { name: string; quantity: number; unit: string; substitutes: ApiSubstitute[]; }
interface ApiMeal { name: string; time: string; ingredients: ApiIngredient[]; }
interface ApiDietData { meals: ApiMeal[]; }


const unitConversionFactors: { [key: string]: number } = {
    gr: 1, tbsp: 15, tsp: 5, cup: 240, ml: 1,
};


const calculateMacrosForFood = (foodData: ApiFood, amountStr: string, unit: string): TotalMacros => {
    const inputAmount = parseFloat(amountStr) || 0;
    if (inputAmount === 0) return { calories: 0, proteins: 0, carbs: 0, fats: 0 };

    let amountInGrams = inputAmount;

    if (unit === 'unit' && foodData.grams_per_unit) {
        amountInGrams = inputAmount * foodData.grams_per_unit;
    } else if (unitConversionFactors[unit]) {
        amountInGrams = inputAmount * unitConversionFactors[unit];
    }

    if (foodData.quantity > 0) {
        const ratio = amountInGrams / foodData.quantity;
        return {
            calories: ratio * foodData.calories,
            proteins: ratio * foodData.proteins_g,
            carbs: ratio * foodData.carbs_g,
            fats: ratio * foodData.fats_g,
        };
    }
    return { calories: 0, proteins: 0, carbs: 0, fats: 0 };
};



const FoodSearchModal: React.FC<{
    isVisible: boolean;
    onClose: () => void;
    foods: FoodOption[];
    onSelect: (item: FoodOption) => void;
}> = ({ isVisible, onClose, foods, onSelect }) => {
    const { colors } = useTheme();
    const { t } = useLocalization();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredFoods = foods.filter(food =>
        (food.label?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (food.food?.category_name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }: { item: FoodOption }) => (
        <TouchableOpacity onPress={() => onSelect(item)} style={[styles.itemContainer, { borderBottomColor: colors.border }]}>
            <View style={styles.itemInfo}>
                <Text style={[styles.itemText, { color: colors.text }]}>{item.food.name}</Text>
                <Text style={[styles.itemSubText, { color: colors.placeholderText }]}>
                    {item.food.category_name} - per {item.food.quantity}g
                </Text>
            </View>
            <View style={styles.itemMacros}>
                <Text style={[styles.itemMacroText, { color: colors.text }]}>P: {item.food.proteins_g}g</Text>
                <Text style={[styles.itemMacroText, { color: colors.text }]}>C: {item.food.carbs_g}g</Text>
                <Text style={[styles.itemMacroText, { color: colors.text }]}>F: {item.food.fats_g}g</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <Modal visible={isVisible} onRequestClose={onClose} animationType="slide">
            <SafeAreaView style={[styles.modalContentContainer, { backgroundColor: colors.appBackground }]}>
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>{t('selectFood')}</Text>
                    <TouchableOpacity onPress={onClose}><Ionicons name="close-circle" size={30} color={colors.text} /></TouchableOpacity>
                </View>
                <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
                    <Ionicons name="search" size={20} color={colors.placeholderText} style={{ marginLeft: 10 }} />
                    <TextInput style={[styles.searchInput, { color: colors.text }]} placeholder="Search..." placeholderTextColor={colors.placeholderText} value={searchQuery} onChangeText={setSearchQuery} />
                </View>
                <FlatList data={filteredFoods} renderItem={renderItem} keyExtractor={item => item.value} contentContainerStyle={{ paddingBottom: 20 }} />
            </SafeAreaView>
        </Modal>
    );
};


export default function ManageDietScreen() {
    const { colors } = useTheme();
    const { t } = useLocalization();
    const router = useRouter();
    const params = useLocalSearchParams();
    const { studentId, existingDiet, dietId } = params;

    const [diet, setDiet] = useState<Diet>({ meals: [] });
    const [totalDietMacros, setTotalDietMacros] = useState<TotalMacros>({ calories: 0, proteins: 0, carbs: 0, fats: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [isFoodsLoading, setIsFoodsLoading] = useState(true);
    const [availableFoods, setAvailableFoods] = useState<FoodOption[]>([]);
    const [isFoodModalVisible, setFoodModalVisible] = useState(false);
    const [activeFoodSetter, setActiveFoodSetter] = useState<{ set: (value: string) => void } | null>(null);

    const unitOptions = useMemo(() => [
        { label: t('grams'), value: 'gr' },
        { label: t('milliliters'), value: 'ml' },
        { label: t('tablespoon'), value: 'tbsp' },
        { label: t('teaspoon'), value: 'tsp' },
        { label: t('cup'), value: 'cup' },
        { label: t('unitLabel'), value: 'unit' },
    ], [t]);

    useEffect(() => {
        const fetchAndPrepareData = async () => {
            setIsFoodsLoading(true);
            try {
                const response = await apiService<FoodsApiResponse>('/food/all', 'GET');
                let allFoods: FoodOption[] = [];
                if (response.status && Array.isArray(response.foods_list)) {
                    allFoods = response.foods_list.flat().map((food, index) => ({
                        label: food.name, value: `${food.name}-${index}`, food: food,
                    }));
                    setAvailableFoods(allFoods);
                }

                if (existingDiet && typeof existingDiet === 'string' && allFoods.length > 0) {
                    const apiDiet: ApiDietData = JSON.parse(existingDiet);

                    const transformApiFoodToState = (apiFood: ApiIngredient | ApiSubstitute): Food | null => {
                        const foodOption = allFoods.find(f => f.food.name === apiFood.name);
                        if (!foodOption) return null;

                        return {
                            id: Date.now() * Math.random(),
                            foodId: foodOption.value,
                            quantity: String(apiFood.quantity),
                            unit: apiFood.unit,
                            substitutions: 'substitutes' in apiFood && Array.isArray(apiFood.substitutes)
                                ? apiFood.substitutes.map(transformApiFoodToState).filter((f): f is Food => f !== null)
                                : [],
                        };
                    };

                    const stateDiet: Diet = {
                        meals: apiDiet.meals.map(apiMeal => ({
                            id: Date.now() * Math.random(),
                            name: apiMeal.name,
                            time: apiMeal.time,
                            foods: apiMeal.ingredients.map(transformApiFoodToState).filter((f): f is Food => f !== null),
                        })),
                    };
                    setDiet(stateDiet);
                } else {
                    setDiet({ meals: [] });
                }
            } catch (e) {

                Alert.alert(t('error'), t('couldNotLoadData'));
            } finally {
                setIsFoodsLoading(false);
            }
        };

        fetchAndPrepareData();
    }, [existingDiet]);

    useEffect(() => {
        let grandTotals: TotalMacros = { calories: 0, proteins: 0, carbs: 0, fats: 0 };

        diet.meals.forEach(meal => {
            meal.foods.forEach(food => {
                const selectedFoodOption = availableFoods.find(f => f.value === food.foodId);
                const foodMacros = selectedFoodOption ? calculateMacrosForFood(selectedFoodOption.food, food.quantity, food.unit) : { calories: 0, proteins: 0, carbs: 0, fats: 0 };
                grandTotals.calories += foodMacros.calories;
                grandTotals.proteins += foodMacros.proteins;
                grandTotals.carbs += foodMacros.carbs;
                grandTotals.fats += foodMacros.fats;
            });
        });

        setTotalDietMacros(grandTotals);
    }, [diet, availableFoods]);

    const handleDietUpdate = useCallback(<K extends keyof Diet>(field: K, value: Diet[K]) => setDiet(prev => ({ ...prev, [field]: value })), []);
    const handleMealUpdate = useCallback((mealId: number, field: keyof Meal, value: any) => setDiet(prev => ({ ...prev, meals: prev.meals.map(m => m.id === mealId ? { ...m, [field]: value } : m) })), []);
    const handleFoodUpdate = useCallback((mealId: number, foodId: number, field: keyof Food, value: any) => setDiet(prev => ({ ...prev, meals: prev.meals.map(m => m.id === mealId ? { ...m, foods: m.foods.map(f => f.id === foodId ? { ...f, [field]: value } : f) } : m) })), []);
    const handleSubstitutionUpdate = useCallback((mealId: number, foodId: number, subId: number, field: keyof Food, value: any) => setDiet(prev => ({ ...prev, meals: prev.meals.map(m => m.id === mealId ? { ...m, foods: m.foods.map(f => f.id === foodId ? { ...f, substitutions: f.substitutions.map(s => s.id === subId ? { ...s, [field]: value } : s) } : f) } : m) })), []);

    const addMeal = useCallback(() => handleDietUpdate('meals', [...diet.meals, { id: Date.now(), time: '', name: '', foods: [] }]), [diet.meals]);
    const addFood = useCallback((mealId: number) => {
        const meal = diet.meals.find(m => m.id === mealId);
        if (meal) handleMealUpdate(mealId, 'foods', [...meal.foods, { id: Date.now(), foodId: null, quantity: '', unit: 'gr', substitutions: [] }]);
    }, [diet.meals]);
    const addSubstitution = useCallback((mealId: number, foodId: number) => {
        const food = diet.meals.find(m => m.id === mealId)?.foods.find(f => f.id === foodId);
        if (food) handleFoodUpdate(mealId, foodId, 'substitutions', [...food.substitutions, { id: Date.now(), foodId: null, quantity: '', unit: 'gr', substitutions: [] }]);
    }, [diet.meals]);

    const removeMeal = useCallback((id: number) => handleDietUpdate('meals', diet.meals.filter(m => m.id !== id)), [diet.meals]);
    const removeFood = useCallback((mealId: number, id: number) => {
        const meal = diet.meals.find(m => m.id === mealId);
        if (meal) handleMealUpdate(mealId, 'foods', meal.foods.filter(f => f.id !== id));
    }, [diet.meals]);
    const removeSubstitution = useCallback((mealId: number, foodId: number, id: number) => {
        const meal = diet.meals.find(m => m.id === mealId);
        const food = meal?.foods.find(f => f.id === foodId);
        if (food) handleFoodUpdate(mealId, foodId, 'substitutions', food.substitutions.filter(s => s.id !== id));
    }, [diet.meals]);

    const openFoodModal = useCallback((setter: (value: string) => void) => {
        setActiveFoodSetter({ set: setter });
        setFoodModalVisible(true);
    }, []);

    const onFoodSelect = useCallback((item: FoodOption) => {
        if (activeFoodSetter) activeFoodSetter.set(item.value);
        setFoodModalVisible(false);
    }, [activeFoodSetter]);

    const handleSaveDiet = async () => {
        setIsLoading(true);

        const transformFood = (food: Food) => {
            const foodDetails = availableFoods.find(f => f.value === food.foodId);
            const foodMacros = foodDetails ? calculateMacrosForFood(foodDetails.food, food.quantity, food.unit) : { calories: 0, proteins: 0, carbs: 0, fats: 0 };
            return {
                name: foodDetails?.food.name || 'Unknown Food',
                total_proteins: Math.round(foodMacros.proteins * 100) / 100,
                total_fats: Math.round(foodMacros.fats * 100) / 100,
                total_carbs: Math.round(foodMacros.carbs * 100) / 100,
                quantity: parseFloat(food.quantity) || 0,
                unit: food.unit,
                substitutes: food.substitutions.map(transformFood)
            };
        };

        const dietPayload: any = {
            total_kcals: Math.round(totalDietMacros.calories * 100) / 100,
            carbs_g: Math.round(totalDietMacros.carbs * 100) / 100,
            proteins_g: Math.round(totalDietMacros.proteins * 100) / 100,
            fats_g: Math.round(totalDietMacros.fats * 100) / 100,
            student_id: parseInt(studentId as string, 10),
            meals: diet.meals.map(meal => {
                const mealMacros = meal.foods.reduce((acc, food) => {
                    const foodDetails = availableFoods.find(f => f.value === food.foodId);
                    const foodMacros = foodDetails ? calculateMacrosForFood(foodDetails.food, food.quantity, food.unit) : { calories: 0, proteins: 0, carbs: 0, fats: 0 };
                    acc.calories += foodMacros.calories;
                    acc.proteins += foodMacros.proteins;
                    acc.carbs += foodMacros.carbs;
                    acc.fats += foodMacros.fats;
                    return acc;
                }, { calories: 0, proteins: 0, carbs: 0, fats: 0 });

                return {
                    name: meal.name,
                    time: meal.time,
                    total_proteins: Math.round(mealMacros.proteins * 100) / 100,
                    total_carbs: Math.round(mealMacros.carbs * 100) / 100,
                    total_fats: Math.round(mealMacros.fats * 100) / 100,
                    total_calories: Math.round(mealMacros.calories * 100) / 100,
                    ingredients: meal.foods.map(transformFood)
                }
            })
        };

        if (dietId) {
            dietPayload.diet_id = parseInt(dietId as string, 10);
        }

        try {
            const response = await apiService('/user/diet/', 'POST', dietPayload);
            if (response.status) {
                Alert.alert(t('success') || 'Success', t('dietSavedSuccess') || 'Diet saved successfully!');
                router.back();
            } else {
                throw new Error(response.message || 'Failed to save diet.');
            }
        } catch (error: any) {
            const errorMessage = error?.data?.message || error.message || 'An unexpected error occurred.';
            Alert.alert('Error', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (isFoodsLoading) {
        return (
            <SafeAreaView style={{flex: 1, backgroundColor: colors.appBackground, justifyContent: 'center', alignItems: 'center'}}>
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={{flex: 1, backgroundColor: colors.appBackground}}>
            <KeyboardAvoidingWrapper>
                <ScrollView contentContainerStyle={styles.container}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 10 }}>
                            <Ionicons name="arrow-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <StyledText type="title" style={{ color: colors.text }}>{existingDiet ? t('editDiet') : t('addDiet')}</StyledText>
                    </View>

                    <View style={[styles.dietFormContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <StyledText type="subtitle" style={{ color: colors.text, textAlign: 'center', marginBottom: 15 }}>{t('dietDetails')}</StyledText>

                        <View style={styles.totalMacrosGrid}>
                            <StyledTextInput containerStyle={styles.macroInput} label={`${t('calories')} (kcal)`} value={String(Math.round(totalDietMacros.calories))} editable={false} />
                            <StyledTextInput containerStyle={styles.macroInput} label={`${t('protein')} (g)`} value={String(Math.round(totalDietMacros.proteins))} editable={false} />
                            <StyledTextInput containerStyle={styles.macroInput} label={`${t('carbs')} (g)`} value={String(Math.round(totalDietMacros.carbs))} editable={false} />
                            <StyledTextInput containerStyle={styles.macroInput} label={`${t('fat')} (g)`} value={String(Math.round(totalDietMacros.fats))} editable={false} />
                        </View>

                        {diet.meals.map((meal, index) => (
                            <MealItem
                                key={meal.id}
                                meal={meal}
                                index={index}
                                availableFoods={availableFoods}
                                unitOptions={unitOptions}
                                onMealUpdate={handleMealUpdate}
                                onFoodUpdate={handleFoodUpdate}
                                onSubUpdate={handleSubstitutionUpdate}
                                onAddFood={addFood}
                                onAddSub={addSubstitution}
                                onRemoveMeal={removeMeal}
                                onRemoveFood={removeFood}
                                onRemoveSub={removeSubstitution}
                                onOpenFoodModal={openFoodModal}
                            />
                        ))}

                        <StyledButton title={t('addMeal')} variant="text" onPress={addMeal} style={{ alignSelf: 'center' }} />
                    </View>

                    <StyledButton title={t('saveDiet')} onPress={handleSaveDiet} loading={isLoading} disabled={isLoading} style={{ marginTop: 20 }} />

                </ScrollView>
                <FoodSearchModal isVisible={isFoodModalVisible} onClose={() => setFoodModalVisible(false)} foods={availableFoods} onSelect={onFoodSelect} />
            </KeyboardAvoidingWrapper>
        </SafeAreaView>
    );
}

const MealItem = React.memo(({ meal, index, availableFoods, unitOptions, onMealUpdate, onFoodUpdate, onSubUpdate, onAddFood, onAddSub, onRemoveMeal, onRemoveFood, onRemoveSub, onOpenFoodModal }: any) => {
    const { colors } = useTheme();
    const { t } = useLocalization();

    const mealMacros = useMemo(() => {
        return meal.foods.reduce((totals: TotalMacros, food: Food) => {
            const selectedFoodOption = availableFoods.find((f: FoodOption) => f.value === food.foodId);
            const foodMacros = selectedFoodOption ? calculateMacrosForFood(selectedFoodOption.food, food.quantity, food.unit) : { calories: 0, proteins: 0, carbs: 0, fats: 0 };
            totals.calories += foodMacros.calories;
            totals.proteins += foodMacros.proteins;
            totals.carbs += foodMacros.carbs;
            totals.fats += foodMacros.fats;
            return totals;
        }, { calories: 0, proteins: 0, carbs: 0, fats: 0 });
    }, [meal.foods, availableFoods]);

    return (
        <View style={[styles.mealContainer, { borderColor: colors.border }]}>
            <View style={styles.mealHeader}>
                <StyledText style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>{t('meal')} {index + 1}</StyledText>
                <TouchableOpacity onPress={() => onRemoveMeal(meal.id)}>
                    <Ionicons name="trash-outline" size={22} color={colors.error} />
                </TouchableOpacity>
            </View>
            <StyledTextInput label={t('time')} value={meal.time} onChangeText={(v: any) => onMealUpdate(meal.id, 'time', v)} placeholder={t('timeExample')} />
            <StyledTextInput label={t('name')} value={meal.name} onChangeText={(v: any) => onMealUpdate(meal.id, 'name', v)} placeholder={t('mealNameExample')} />

            <Text style={[styles.mealMacroSummary, {color: colors.placeholderText}]}>
                {Math.round(mealMacros.calories)} kcal | P:{Math.round(mealMacros.proteins)}g C:{Math.round(mealMacros.carbs)}g F:{Math.round(mealMacros.fats)}g
            </Text>

            {meal.foods.map((food: Food) => (
                <FoodRow
                    key={food.id}
                    food={food}
                    mealId={meal.id}
                    availableFoods={availableFoods}
                    unitOptions={unitOptions}
                    onFoodUpdate={onFoodUpdate}
                    onSubUpdate={onSubUpdate}
                    onAddSub={onAddSub}
                    onRemoveFood={onRemoveFood}
                    onRemoveSub={onRemoveSub}
                    onOpenFoodModal={onOpenFoodModal}
                />
            ))}

            <StyledButton title={t('addFood')} variant="outlined" onPress={() => onAddFood(meal.id)} style={{ marginTop: 10 }} />
        </View>
    );
});


const FoodRow = React.memo(({ food, mealId, availableFoods, unitOptions, onFoodUpdate, onSubUpdate, onAddSub, onRemoveFood, onRemoveSub, onOpenFoodModal, isSubstitution = false }: any) => {
    const { colors } = useTheme();
    const router = useRouter();
    const { t } = useLocalization();

    const selectedFood = useMemo(() => availableFoods.find((f: FoodOption) => f.value === food.foodId), [food.foodId, availableFoods]);
    const foodMacros = useMemo(() => selectedFood ? calculateMacrosForFood(selectedFood.food, food.quantity, food.unit) : { calories: 0, proteins: 0, carbs: 0, fats: 0 }, [selectedFood, food.quantity, food.unit]);

    return (
        <View style={[styles.foodRow, isSubstitution && styles.substitutionRow, { borderColor: colors.border, backgroundColor: isSubstitution ? 'transparent' : colors.inputBackground }]}>
            <View style={styles.foodRowHeader}>
                <TouchableOpacity style={[styles.foodSelectButton, { flex: 1, borderColor: colors.border }]} onPress={() => onOpenFoodModal((v: any) => onFoodUpdate(mealId, food.id, 'foodId', v))}>
                    <Text style={[styles.selectedTextStyle, { color: selectedFood ? colors.text : colors.placeholderText }]} numberOfLines={1}>{selectedFood?.label || t('selectFood')}</Text>
                    <Ionicons name="chevron-down" size={18} color={colors.placeholderText} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/(teacher)/add-new-food')} style={{ marginLeft: 10 }}>
                    <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onRemoveFood(mealId, food.id)}>
                    <Ionicons name="trash-outline" size={22} color={colors.error} style={{ marginLeft: 10 }} />
                </TouchableOpacity>
            </View>
            <View style={styles.amountRow}>
                <StyledTextInput containerStyle={{ flex: 2, marginRight: 10 }} placeholder={t('quantity')} value={food.quantity} onChangeText={(v: any) => onFoodUpdate(mealId, food.id, 'quantity', v)} keyboardType="numeric" />
                <StyledPicker containerStyle={{ flex: 1.5 }} items={unitOptions} selectedValue={food.unit} onValueChange={(v: any) => onFoodUpdate(mealId, food.id, 'unit', v)} />
            </View>

            {foodMacros.calories > 0 && (
                <View style={styles.foodMacroDisplay}>
                    <Text style={[styles.foodMacroText, {color: colors.text}]}>{Math.round(foodMacros.calories)} kcal</Text>
                    <Text style={[styles.foodMacroText, {color: colors.text}]}>
                        P: {Math.round(foodMacros.proteins)}g | C: {Math.round(foodMacros.carbs)}g | F: {Math.round(foodMacros.fats)}g
                    </Text>
                </View>
            )}

            {!isSubstitution && (
                <StyledButton title={t('addSubstitution')} variant="text" onPress={() => onAddSub(mealId, food.id)} style={{marginTop: 5, alignSelf: 'flex-start'}} />
            )}

            {food.substitutions.map((sub: Food) => (
                <FoodRow
                    key={sub.id}
                    food={sub}
                    mealId={mealId}
                    availableFoods={availableFoods}
                    unitOptions={unitOptions}

                    onFoodUpdate={(mId, sId, field, value) => onSubUpdate(mId, food.id, sId, field, value)}
                    onRemoveFood={(mId, sId) => onRemoveSub(mId, food.id, sId)}
                    onSubUpdate={onSubUpdate}
                    onAddSub={() => {}}
                    onRemoveSub={onRemoveSub}
                    onOpenFoodModal={onOpenFoodModal}
                    isSubstitution={true}
                />
            ))}
        </View>
    );
});


const styles = StyleSheet.create({
    container: { paddingHorizontal: 20, paddingBottom: 40 },
    dietFormContainer: { marginTop: 15, padding: 15, borderRadius: 15, borderWidth: 1 },
    mealContainer: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, },
    mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, },
    foodRow: { borderRadius: 10, padding: 10, marginBottom: 10, borderWidth: 1 },
    foodRowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    substitutionRow: { marginLeft: 20, marginTop: 10, borderLeftWidth: 2, paddingLeft: 10, borderWidth: 0, borderStyle: 'dashed' },
    foodSelectButton: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'transparent'},
    amountRow: { flexDirection: 'row', alignItems: 'flex-end' },
    selectedTextStyle: { fontSize: 16, flex: 1 },
    modalContentContainer: { flex: 1 },
    itemContainer: { paddingVertical: 15, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 },
    itemInfo: { flex: 1, marginRight: 10 },
    itemText: { fontSize: 16, fontWeight: '500', flexWrap: 'wrap' },
    itemSubText: { fontSize: 12, marginTop: 2 },
    itemMacros: { alignItems: 'flex-end' },
    itemMacroText: { fontSize: 12, fontWeight: '400' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, margin: 15, paddingHorizontal: 5 },
    searchInput: { flex: 1, height: 45, fontSize: 16, marginLeft: 10 },
    totalMacrosGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    macroInput: { width: '48%', marginBottom: 10 },
    mealMacroSummary: { textAlign: 'right', fontStyle: 'italic', fontSize: 13, marginBottom: 10, fontWeight: '500' },
    foodMacroDisplay: { borderRadius: 8, padding: 8, marginTop: 10, alignItems: 'center' },
    foodMacroText: { fontSize: 12, fontWeight: '500' }
});
