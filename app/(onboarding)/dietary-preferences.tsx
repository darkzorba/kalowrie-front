import React, { useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useLocalization } from '../../contexts/LocalizationContext';
import { StyledTextInput } from '../../components/StyledTextInput';
import { StyledButton } from '../../components/StyledButton';
import { StyledText } from '../../components/StyledText';
import { StyledPicker } from '../../components/StyledPicker';
import { GlobalStyles } from '../../constants/GlobalStyles';
import KeyboardAvoidingWrapper from '../../components/KeyboardAvoidingWrapper';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DietaryPreferencesScreen() {
    const [dietaryRestrictions, setDietaryRestrictions] = useState('');
    const [foodPreferences, setFoodPreferences] = useState('');
    const [eatingRoutine, setEatingRoutine] = useState('');
    const [activityLevel, setActivityLevel] = useState<string | undefined>(undefined);
    const [dietType, setDietType] = useState<string | undefined>(undefined);
    const [error, setError] = useState('');

    const router = useRouter();
    const { colors } = useTheme();
    const { t } = useLocalization();

    const activityLevels = useMemo(() => [
        { label: t('light'), value: 'light' },
        { label: t('moderate'), value: 'moderate' },
        { label: t('high'), value: 'high' },
    ], [t]);

    const dietTypes = useMemo(() => [
        { label: t('gainMuscle'), value: 'mass_gain' },
        { label: t('fatLoss'), value: 'fat_loss' },
        { label: t('maintenance'), value: 'maintenance' },
    ], [t]);

    const handleFinish = async () => {
        setError('');
        if (!activityLevel || !dietType) {
            setError(t('fillAllFields'));
            return;
        }

        try {
            const userDetailsString = await AsyncStorage.getItem('userDetails');
            if (!userDetailsString) {
                throw new Error('User details not found. Please go back.');
            }
            const userDetails = JSON.parse(userDetailsString);

            const dietRequestBody = {
                height: userDetails.height,
                weight: userDetails.weight,
                age: userDetails.age,
                gender: userDetails.gender,
                dietary_preferences: foodPreferences,
                dietary_restrictions: dietaryRestrictions,
                eating_routine: eatingRoutine,
                activity_frequency: activityLevel,
                diet_type: dietType,
            };

            router.push({
                pathname: '/(onboarding)/generating-diet',
                params: { dietRequestBody: JSON.stringify(dietRequestBody) },
            });

        } catch(e: any) {
            setError(e.message || 'An error occurred preparing your data.');
        }
    };

    return (
        <KeyboardAvoidingWrapper style={{backgroundColor: colors.appBackground}}>
            <View style={[GlobalStyles.container, { backgroundColor: colors.appBackground }]}>
                <StyledText type="title" style={[GlobalStyles.title, styles.title, { color: colors.text }]}>
                    {t('yourGoals')}
                </StyledText>
                <StyledText type="subtitle" style={[styles.subtitle, { color: colors.text }]}>
                    {t('helpUsTailor')}
                </StyledText>

                <StyledPicker
                    label={t('mainGoal')}
                    items={dietTypes}
                    selectedValue={dietType}
                    onValueChange={(value) => setDietType(value as string)}
                    placeholder={t('selectDietType')}
                />

                <StyledTextInput
                    label={t('dietaryRestrictions')}
                    placeholder={t('dietaryRestrictionsPlaceholder')}
                    value={dietaryRestrictions}
                    onChangeText={setDietaryRestrictions}
                />
                <StyledTextInput
                    label={t('foodPreferences')}
                    placeholder={t('foodPreferencesPlaceholder')}
                    value={foodPreferences}
                    onChangeText={setFoodPreferences}
                />
                <StyledTextInput
                    label={t('eatingRoutine')}
                    placeholder={t('eatingRoutinePlaceholder')}
                    value={eatingRoutine}
                    onChangeText={setEatingRoutine}
                />
                <StyledPicker
                    label={t('activityFrequency')}
                    items={activityLevels}
                    selectedValue={activityLevel}
                    onValueChange={(value) => setActivityLevel(value as string)}
                    placeholder={t('selectActivityLevel')}
                />

                {error ? <StyledText type="error" style={GlobalStyles.errorText}>{error}</StyledText> : null}

                <StyledButton
                    title={t('generateMyDiet')}
                    onPress={handleFinish}
                    style={styles.finishButton}
                />
            </View>
        </KeyboardAvoidingWrapper>
    );
}

const styles = StyleSheet.create({
    title: { marginBottom: 5 },
    subtitle: { marginBottom: 25, fontSize: 16 },
    finishButton: { marginTop: 20 },
});
