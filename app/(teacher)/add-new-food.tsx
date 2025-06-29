import KeyboardAvoidingWrapper from '@/components/KeyboardAvoidingWrapper';
import { StyledButton } from '@/components/StyledButton';
import { StyledPicker } from '@/components/StyledPicker';
import { StyledText } from '@/components/StyledText';
import { StyledTextInput } from '@/components/StyledTextInput';
import { useLocalization } from '@/contexts/LocalizationContext';
import { useTheme } from '@/contexts/ThemeContext';
import apiService from '@/services/apiService';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, View } from 'react-native';

interface Category {
    id: number;
    name: string;
}

interface CategoryApiResponse {
    status: boolean;
    categories_list: Category[];
}

interface AddFoodApiResponse {
    status: boolean;
    message: string;
    foodId: number;
}

export default function AddNewFoodScreen() {
    const { colors } = useTheme();
    const { t } = useLocalization();
    const router = useRouter();

    const [foodName, setFoodName] = useState('');
    const [category, setCategory] = useState<number | undefined>(undefined);
    const [quantity, setQuantity] = useState('');
    const [calories, setCalories] = useState('');
    const [proteinsG, setProteinsG] = useState('');
    const [carbsG, setCarbsG] = useState('');
    const [fatsG, setFatsG] = useState('');
    const [hasWeightPerUnit, setHasWeightPerUnit] = useState(false);
    const [gramsPerUnit, setGramsPerUnit] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [categories, setCategories] = useState<{label: string, value: number}[]>([]);
    const [isFetchingCategories, setIsFetchingCategories] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await apiService<CategoryApiResponse>('/food/categories/all', 'GET');
                if (response.status) {
                    const categoryOptions = response.categories_list.map(cat => ({
                        label: cat.name,
                        value: cat.id,
                    }));
                    setCategories(categoryOptions);
                }
            } catch (error) {

            } finally {
                setIsFetchingCategories(false);
            }
        };
        fetchCategories();
    }, []);

    const handleSaveFood = async () => {
        setIsLoading(true);
        try {
            const newFoodData = {
                food_name: foodName,
                category_id: category,
                quantity: parseInt(quantity, 10) || 0,
                calories: parseFloat(calories) || 0,
                proteins_g: parseFloat(proteinsG) || 0,
                carbs_g: parseFloat(carbsG) || 0,
                fats_g: parseFloat(fatsG) || 0,
                ...(hasWeightPerUnit && { grams_per_unit: parseInt(gramsPerUnit, 10) || 0 }),
            };

            const response = await apiService<AddFoodApiResponse>('/food/add', 'POST', newFoodData);

            if (response.status) {
                router.push({
                    pathname: '/(teacher)/add-student',
                });
            } else {
                throw new Error(response.message || "Failed to save the new food.");
            }

        } catch (error: any) {
            const errorMessage = error.data?.message || error.message || "Failed to save the new food.";
            Alert.alert(t('error'), errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingWrapper style={{ flex: 1, backgroundColor: colors.appBackground }}>
            <ScrollView contentContainerStyle={styles.container}>
                <StyledTextInput label={t('foodName')} value={foodName} onChangeText={setFoodName} />
                <StyledPicker
                    label={t('categoryName')}
                    items={categories}
                    selectedValue={category}
                    onValueChange={(value) => setCategory(value as number)}
                    placeholder={isFetchingCategories ? t('loadingCategories') : t('selectCategory')}
                />
                <StyledTextInput label={t('quantityInGrams')} placeholder={t('quantityExample')} value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
                <StyledTextInput label={`${t('calories')} (kcal)`} value={calories} onChangeText={setCalories} keyboardType="numeric" />
                <StyledTextInput label={`${t('protein')} (g)`} value={proteinsG} onChangeText={setProteinsG} keyboardType="numeric" />
                <StyledTextInput label={`${t('carbs')} (g)`} value={carbsG} onChangeText={setCarbsG} keyboardType="numeric" />
                <StyledTextInput label={`${t('fat')} (g)`} value={fatsG} onChangeText={setFatsG} keyboardType="numeric" />

                <View style={styles.switchContainer}>
                    <StyledText style={{color: colors.text, fontSize: 16}}>{t('hasWeightPerUnit')}</StyledText>
                    <Switch
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor={hasWeightPerUnit ? colors.secondary : colors.card}
                        onValueChange={setHasWeightPerUnit}
                        value={hasWeightPerUnit}
                    />
                </View>

                {hasWeightPerUnit && (
                    <StyledTextInput
                        label={t('gramsPerUnit')}
                        placeholder={t('gramsPerUnitExample')}
                        value={gramsPerUnit}
                        onChangeText={setGramsPerUnit}
                        keyboardType="numeric"
                    />
                )}

                <StyledButton
                    title={t('addNewFood')}
                    onPress={handleSaveFood}
                    loading={isLoading}
                    disabled={isLoading}
                    style={{ marginTop: 20 }}
                />
            </ScrollView>
        </KeyboardAvoidingWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 20,
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15,
        marginBottom: 10,
        paddingVertical: 10,
    },
});
