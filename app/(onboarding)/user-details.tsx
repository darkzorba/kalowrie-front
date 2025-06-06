import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { StyledTextInput } from '../../components/StyledTextInput';
import { StyledButton } from '../../components/StyledButton';
import { StyledText } from '../../components/StyledText';
import { StyledPicker } from '../../components/StyledPicker';
import { GlobalStyles } from '../../constants/GlobalStyles';
import KeyboardAvoidingWrapper from '../../components/KeyboardAvoidingWrapper';
import AsyncStorage from '@react-native-async-storage/async-storage';

const genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
    { label: 'Prefer not to say', value: 'prefer_not_to_say' },
];

export default function UserDetailsScreen() {
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState<string | undefined>(undefined);
    const [error, setError] = useState('');

    const router = useRouter();
    const { colors } = useTheme();

    const handleNext = async () => {
        setError('');
        if (!weight || !height || !age || !gender) {
            setError('Please fill in all fields.');
            return;
        }
        if (isNaN(parseFloat(weight)) || parseFloat(weight) <=0){
            setError('Please enter a valid weight.');
            return;
        }
        if (isNaN(parseFloat(height)) || parseFloat(height) <=0){
            setError('Please enter a valid height.');
            return;
        }
        if (isNaN(parseInt(age)) || parseInt(age) <=0 || parseInt(age) > 120){
            setError('Please enter a valid age.');
            return;
        }

        try {
            const userDetails = { weight, height, age, gender };
            await AsyncStorage.setItem('userDetails', JSON.stringify(userDetails));
            router.push('/(onboarding)/dietary-preferences');
        } catch(e) {
            setError('Failed to save details. Please try again.');
            console.error("Failed to save user details", e);
        }
    };

    return (
        <KeyboardAvoidingWrapper style={{backgroundColor: colors.appBackground}}>
            <View style={[GlobalStyles.container, { backgroundColor: colors.appBackground }]}>
                <StyledText type="title" style={[GlobalStyles.title, styles.title, { color: colors.text }]}>
                    Tell Us About Yourself
                </StyledText>
                <StyledText type="subtitle" style={[styles.subtitle,{ color: colors.text }]}>
                    This helps us personalize your experience.
                </StyledText>

                <StyledTextInput
                    label="Weight (kg)"
                    placeholder="e.g., 70"
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                />
                <StyledTextInput
                    label="Height (cm)"
                    placeholder="e.g., 175"
                    value={height}
                    onChangeText={setHeight}
                    keyboardType="numeric"
                />
                <StyledTextInput
                    label="Age (years)"
                    placeholder="e.g., 30"
                    value={age}
                    onChangeText={setAge}
                    keyboardType="numeric"
                />
                <StyledPicker
                    label="Gender"
                    items={genderOptions}
                    selectedValue={gender}
                    onValueChange={(value) => setGender(value as string)}
                    placeholder="Select your gender"
                />

                {error ? <StyledText type="error" style={GlobalStyles.errorText}>{error}</StyledText> : null}

                <StyledButton
                    title="Next"
                    onPress={handleNext}
                    style={styles.nextButton}
                />
            </View>
        </KeyboardAvoidingWrapper>
    );
}

const styles = StyleSheet.create({
    title: {
        marginBottom: 5,
    },
    subtitle: {
        marginBottom: 25,
        fontSize: 16,
    },
    nextButton: {
        marginTop: 20,
    }
});
