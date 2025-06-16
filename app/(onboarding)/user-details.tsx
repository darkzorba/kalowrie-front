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

export default function UserDetailsScreen() {
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState<string | undefined>(undefined);
    const [error, setError] = useState('');

    const router = useRouter();
    const { colors } = useTheme();
    const { t } = useLocalization();


    const genderOptions = useMemo(() => [
        { label: t('male'), value: 'male' },
        { label: t('female'), value: 'female' },
        { label: t('other'), value: 'other' },
        { label: t('preferNotToSay'), value: 'prefer_not_to_say' },
    ], [t]);

    const handleNext = async () => {
        setError('');
        if (!weight || !height || !age || !gender) {
            setError(t('fillAllFields'));
            return;
        }

        try {
            const userDetails = { weight, height, age, gender };
            await AsyncStorage.setItem('userDetails', JSON.stringify(userDetails));
            router.push('/(onboarding)/dietary-preferences');
        } catch(e) {
            setError('Failed to save details. Please try again.');
        }
    };

    return (
        <KeyboardAvoidingWrapper style={{backgroundColor: colors.appBackground}}>
            <View style={[GlobalStyles.container, { backgroundColor: colors.appBackground }]}>
                <StyledText type="title" style={[GlobalStyles.title, styles.title, { color: colors.text }]}>
                    {t('tellUsAboutYourself')}
                </StyledText>
                <StyledText type="subtitle" style={[styles.subtitle,{ color: colors.text }]}>
                    {t('helpsUsPersonalize')}
                </StyledText>

                <StyledTextInput
                    label={t('weight')}
                    placeholder="e.g., 70"
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                />
                <StyledTextInput
                    label={t('height')}
                    placeholder="e.g., 175"
                    value={height}
                    onChangeText={setHeight}
                    keyboardType="numeric"
                />
                <StyledTextInput
                    label={t('age')}
                    placeholder="e.g., 30"
                    value={age}
                    onChangeText={setAge}
                    keyboardType="numeric"
                />
                <StyledPicker
                    label={t('gender')}
                    items={genderOptions}
                    selectedValue={gender}
                    onValueChange={(value) => setGender(value as string)}
                    placeholder={t('selectGender')}
                />

                {error ? <StyledText type="error" style={GlobalStyles.errorText}>{error}</StyledText> : null}

                <StyledButton
                    title={t('next')}
                    onPress={handleNext}
                    style={styles.nextButton}
                />
            </View>
        </KeyboardAvoidingWrapper>
    );
}

const styles = StyleSheet.create({
    title: { marginBottom: 5 },
    subtitle: { marginBottom: 25, fontSize: 16 },
    nextButton: { marginTop: 20 },
});
