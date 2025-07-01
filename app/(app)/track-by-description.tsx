import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import KeyboardAvoidingWrapper from '../../components/KeyboardAvoidingWrapper';
import { StyledButton } from '../../components/StyledButton';
import { StyledPicker } from '../../components/StyledPicker';
import { StyledText } from '../../components/StyledText';
import { StyledTextInput } from '../../components/StyledTextInput';
import { useAuth } from '../../contexts/AuthContext';
import { useLocalization } from '../../contexts/LocalizationContext';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/apiService';

interface IngredientInput { id: number; name: string; quantity: string; default_unit: string; }
interface CalculatedIngredient { name: string; total_carbs: number; total_proteins: number; total_fats: number; total_kcals: number; quantity: number; default_uni: string; }
interface CalculatedMeal { name: string; total_carbs: number; total_proteins: number; total_fats: number; total_kcals: number; amount: string; ingredients: CalculatedIngredient[]; }
interface MacrosApiResponse { macros_dict: CalculatedMeal; }

const MacroDisplay = ({ label, value, color, textColor }: { label: string; value: number; color: string; textColor: string }) => (
    <View style={styles.macroDisplay}>
        <View style={[styles.macroDot, { backgroundColor: color }]} />
        <Text style={[styles.macroText, { color: textColor }]} numberOfLines={1} ellipsizeMode="tail">
            {label}: {Math.round(value)}g
        </Text>
    </View>
);

const BouncingFruit = ({ yAnim, emoji }: { yAnim: Animated.Value, emoji: string }) => (
    <Animated.Text style={[styles.fruitLoader, { transform: [{ translateY: yAnim }] }]}>{emoji}</Animated.Text>
);

export default function TrackByDescriptionScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const { user } = useAuth();
    const { t } = useLocalization();
    const params = useLocalSearchParams<{ calculatedMealData?: string }>();
    const insets = useSafeAreaInsets();

    const [mealName, setMealName] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [ingredients, setIngredients] = useState<IngredientInput[]>([{ id: 1, name: '', quantity: '', default_unit: 'gr' }]);
    const [isCalculating, setIsCalculating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [calculatedMeal, setCalculatedMeal] = useState<CalculatedMeal | null>(null);
    const [mealDate, setMealDate] = useState(new Date());
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [isTimePickerVisible, setTimePickerVisibility] = useState(false);

    const CALCULATION_MESSAGES = useMemo(() => [
        t('analyzingIngredients'),
        t('calculatingMacrosMsg'),
        t('crossReferencingData'),
        t('finalizingNumbers')
    ], [t]);

    const unitOptions = useMemo(() => [
        { label: t('grams'), value: 'gr' },
        { label: t('milliliters'), value: 'ml' },
        { label: t('tablespoon'), value: 'tbsp' },
        { label: t('teaspoon'), value: 'tsp' },
        { label: t('cup'), value: 'cup' },
        { label: t('unitLabel'), value: 'unit' },
        { label: t('slice'), value: 'slice' },
    ], [t]);

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
                } catch {
                    resetForm();
                }
            } else {
                resetForm();
            }
        }, [params.calculatedMealData])
    );

    const addIngredient = () => {
        const newId = ingredients.length ? Math.max(...ingredients.map(i => i.id)) + 1 : 1;
        setIngredients([...ingredients, { id: newId, name: '', quantity: '', default_unit: 'gr' }]);
    };

    const removeIngredient = (id: number) => {
        setIngredients(ingredients.filter(i => i.id !== id));
    };

    const handleIngredientChange = (id: number, field: keyof IngredientInput, value: string) => {
        setIngredients(ingredients.map(i => (i.id === id ? { ...i, [field]: value } : i)));
    };

    const calculateMacros = async () => {
        setError('');
        if (!mealName || !totalAmount) {
            setError(t('fillAllFields'));
            return;
        }
        setIsCalculating(true);
        try {
            const list_ingredients = ingredients.map(i => ({ name: i.name, quantity: parseInt(i.quantity, 10) || 0, default_unit: i.default_unit }));
            const body = { name: mealName, amount: totalAmount, list_ingredients };
            const response = await apiService<MacrosApiResponse>('/ai/track/macros', 'POST', body);
            setCalculatedMeal(response.macros_dict);
        } catch (e: any) {
            setError(e.message || t('macroCalculationFailed'));
        } finally {
            setIsCalculating(false);
        }
    };

    const handleSaveMeal = async () => {
        if (!calculatedMeal) return;
        setIsSaving(true);
        try {
            const body = {
                name: calculatedMeal.name,
                meal_time: mealDate.toTimeString().split(' ')[0],
                meal_date: mealDate.toISOString().split('T')[0],
                total_kcals: calculatedMeal.total_kcals,
                total_proteins: calculatedMeal.total_proteins,
                total_carbs: calculatedMeal.total_carbs,
                total_fats: calculatedMeal.total_fats,
                diet_id: user?.dietId,
                list_ingredients: calculatedMeal.ingredients.map(i => ({ name: i.name, quantity: i.quantity, default_unit: i.default_uni }))
            };
            await apiService('/user/diet/meal', 'POST', body);
            Alert.alert(t('success'), t('mealSavedSuccess'), [{ text: t('ok'), onPress: () => router.back() }]);
        } catch (e: any) {
            Alert.alert(t('error'), e.message || t('mealSaveFailed'));
        } finally {
            setIsSaving(false);
            router.replace("/(app)/home");
        }
    };

    if (isCalculating) return <CalculatingMacrosView messages={CALCULATION_MESSAGES} t={t} />;

    if (calculatedMeal) {
        return (
            <ScrollView style={{ flex: 1, backgroundColor: colors.appBackground }} contentContainerStyle={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                <StyledText type="title" style={[styles.summaryTitle, { color: colors.text }]}>{calculatedMeal.name}</StyledText>
                <StyledText style={[styles.summaryAmount, { color: colors.placeholderText }]}>{calculatedMeal.amount}</StyledText>
                <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
                    <StyledText style={[styles.cardTitle, { color: colors.text }]}>{t('totalMacronutrients')}</StyledText>
                    <StyledText style={[styles.totalKcals, { color: colors.text }]}>{Math.round(calculatedMeal.total_kcals)} kcal</StyledText>
                    <View style={styles.macrosContainer}>
                        <MacroDisplay label={t('protein')} value={calculatedMeal.total_proteins} color="#3B82F6" textColor={colors.text} />
                        <MacroDisplay label={t('carbs')} value={calculatedMeal.total_carbs} color="#10B981" textColor={colors.text} />
                        <MacroDisplay label={t('fat')} value={calculatedMeal.total_fats} color="#EAB308" textColor={colors.text} />
                    </View>
                </View>
                <StyledButton title={t('confirmAndSave')} onPress={handleSaveMeal} loading={isSaving} disabled={isSaving} style={{marginTop: 20}} />
                <StyledButton title={t('editMeal')} onPress={resetForm} variant="text" />
            </ScrollView>
        );
    }

    return (
        <KeyboardAvoidingWrapper style={{ flex: 1, backgroundColor: colors.appBackground }}>
            <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom }]}>
                <StyledTextInput label={t('mealName')} placeholder={t('mealNamePlaceholder')} value={mealName} onChangeText={setMealName} containerStyle={{ marginBottom: 10 }} />
                <StyledTextInput label={t('totalAmount')} placeholder={t('totalAmountPlaceholder')} value={totalAmount} onChangeText={setTotalAmount} containerStyle={{ marginBottom: 20 }} />
                {ingredients.map((ingredient, index) => (
                    <View key={ingredient.id} style={[styles.ingredientContainer, { backgroundColor: colors.card }]}>
                        <View style={styles.ingredientHeader}>
                            <StyledText style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>{t('ingredient')} {index + 1}</StyledText>
                            {ingredients.length > 1 && (
                                <TouchableOpacity onPress={() => removeIngredient(ingredient.id)}>
                                    <Ionicons name="trash-outline" size={22} color={colors.error} />
                                </TouchableOpacity>
                            )}
                        </View>
                        <StyledTextInput label={t('ingredient')} placeholder="e.g., Whey Protein" value={ingredient.name} onChangeText={text => handleIngredientChange(ingredient.id, 'name', text)} />
                        <StyledTextInput label={t('quantity')} placeholder="e.g., 30" value={ingredient.quantity} onChangeText={text => handleIngredientChange(ingredient.id, 'quantity', text)} keyboardType="numeric" />
                        <StyledPicker label={t('unit')} items={unitOptions} selectedValue={ingredient.default_unit} onValueChange={value => handleIngredientChange(ingredient.id, 'default_unit', value as string)} />
                    </View>
                ))}
                <StyledButton title={t('addIngredient')} onPress={addIngredient} variant="outlined" icon={<Ionicons name="add-outline" size={20} color={colors.primary} />} style={{ marginBottom: 20 }} />
                {error ? <StyledText type="error" style={styles.errorText}>{error}</StyledText> : null}
                <StyledButton title={t('calculateMacros')} onPress={calculateMacros} />
            </ScrollView>
        </KeyboardAvoidingWrapper>
    );
}

const CalculatingMacrosView = ({ messages, t }: { messages: string[], t: (key: string) => string }) => {
    const { colors } = useTheme();
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const yAnim1 = useRef(new Animated.Value(0)).current;
    const yAnim2 = useRef(new Animated.Value(0)).current;
    const yAnim3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const createBounce = (val: Animated.Value) => Animated.sequence([
            Animated.timing(val, { toValue: -15, duration: 400, useNativeDriver: true }),
            Animated.timing(val, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]);

        const loop1 = Animated.loop(createBounce(yAnim1));
        const loop2 = Animated.loop(createBounce(yAnim2));
        const loop3 = Animated.loop(createBounce(yAnim3));

        loop1.start();
        setTimeout(() => loop2.start(), 200);
        setTimeout(() => loop3.start(), 400);

        const interval = setInterval(() => setCurrentMessageIndex(i => (i + 1) % messages.length), 3000);

        return () => {
            loop1.stop();
            loop2.stop();
            loop3.stop();
            clearInterval(interval);
        };
    }, []);

    return (
        <View style={[styles.loadingContainer, { backgroundColor: colors.appBackground }]}>
            <View style={styles.loaderContainer}>
                <BouncingFruit yAnim={yAnim1} emoji="🧀" />
                <BouncingFruit yAnim={yAnim2} emoji="🍗" />
                <BouncingFruit yAnim={yAnim3} emoji="🥦" />
            </View>
            <StyledText type="title" style={[styles.loadingTitle, { color: colors.text }]}>{t('calculating')}</StyledText>
            <StyledText style={[styles.loadingMessage, { color: colors.text }]}>{messages[currentMessageIndex]}</StyledText>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { paddingHorizontal: 20, flexGrow: 1 },
    ingredientContainer: { borderRadius: 15, padding: 15, marginBottom: 20 },
    ingredientHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    errorText: { textAlign: 'center', marginBottom: 10 },
    summaryTitle: { textAlign: 'center', fontSize: 26, fontWeight: 'bold', marginTop: 20 },
    summaryAmount: { textAlign: 'center', marginBottom: 20, fontSize: 16 },
    summaryCard: { borderRadius: 15, padding: 20, alignItems: 'center', marginBottom: 10 },
    cardTitle: { fontSize: 18, fontWeight: '600' },
    totalKcals: { fontSize: 36, fontWeight: 'bold', marginVertical: 10 },
    macrosContainer: { flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap', width: '100%' },
    macroDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        width: '100%',
        marginBottom: 8,
    },    macroDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
    macroText: { fontSize: 14, flexShrink: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loaderContainer: { flexDirection: 'row', marginBottom: 40 },
    fruitLoader: { fontSize: 50, marginHorizontal: 10 },
    loadingTitle: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
    loadingMessage: { fontSize: 18, textAlign: 'center', height: 50, paddingHorizontal: 10 },
});
