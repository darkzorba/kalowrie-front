import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { StyledTextInput } from '../../components/StyledTextInput';
import { StyledButton } from '../../components/StyledButton';
import { StyledText } from '../../components/StyledText';
import { StyledPicker } from '../../components/StyledPicker';
import { GlobalStyles } from '../../constants/GlobalStyles';
import KeyboardAvoidingWrapper from '../../components/KeyboardAvoidingWrapper';
import AsyncStorage from '@react-native-async-storage/async-storage';

const activityLevels = [
    { label: 'Light (little to no exercise)', value: 'light' },
    { label: 'Moderate (exercise 3-5 days/week)', value: 'moderate' },
    { label: 'High (intense exercise 6-7 days/week)', value: 'high' },
];

const dietTypes = [
    { label: 'Gain Muscle', value: 'mass_gain' },
    { label: 'Fat Loss', value: 'fat_loss' },
    { label: 'Maintenance', value: 'maintenance' },
];

interface UserDetails {
    weight: string;
    height: string;
    age: string;
    gender: string;
}

export default function DietaryPreferencesScreen() {
    const [dietaryRestrictions, setDietaryRestrictions] = useState('');
    const [foodPreferences, setFoodPreferences] = useState('');
    const [eatingRoutine, setEatingRoutine] = useState('');
    const [activityLevel, setActivityLevel] = useState<string | undefined>(undefined);
    const [dietType, setDietType] = useState<string | undefined>(undefined);
    const [error, setError] = useState('');

    const router = useRouter();
    const { colors } = useTheme();

    const insets = useSafeAreaInsets();

    const handleFinish = async () => {
        setError('');
        if (!activityLevel || !dietType) {
            setError('Please fill in all fields.');
            return;
        }

        try {
            const userDetailsString = await AsyncStorage.getItem('userDetails');
            if (!userDetailsString) {
                throw new Error('User details not found. Please go back.');
            }
            const userDetails: UserDetails = JSON.parse(userDetailsString);

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
            console.error("Failed to prepare data for diet generation:", e);
        }
    };

    return (
        <KeyboardAvoidingWrapper style={{ backgroundColor: colors.appBackground, flex: 1 }}>
            <ScrollView

                contentContainerStyle={[
                    GlobalStyles.container,
                    styles.scrollContainer,
                    { paddingTop: insets.top + 20 }
                ]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.headerContainer}>
                    <StyledText type="title" style={[GlobalStyles.title, { color: colors.text }]}>
                        Your Goals
                    </StyledText>
                    <StyledText type="subtitle" style={[styles.subtitle, { color: colors.text }]}>
                        Help us tailor your nutrition plan.
                    </StyledText>
                </View>

                {/* O restante do seu código permanece idêntico */}
                <View style={styles.formControlContainer}>
                    <StyledPicker
                        label="What is your main goal?"
                        items={dietTypes}
                        selectedValue={dietType}
                        onValueChange={(value) => setDietType(value as string)}
                        placeholder="Select your diet type"
                    />
                </View>

                <View style={styles.formControlContainer}>
                    <StyledTextInput
                        label="Dietary Restrictions (e.g., allergies, intolerances)"
                        placeholder="Peanuts, gluten-free, lactose intolerant"
                        value={dietaryRestrictions}
                        onChangeText={setDietaryRestrictions}
                        multiline
                        style={styles.multilineInput}
                    />
                </View>

                <View style={styles.formControlContainer}>
                    <StyledTextInput
                        label="Food Preferences (favorite foods or cuisines)"
                        placeholder="Italian, Mexican, chicken, broccoli"
                        value={foodPreferences}
                        onChangeText={setFoodPreferences}
                        multiline
                        style={styles.multilineInput}
                    />
                </View>

                <View style={styles.formControlContainer}>
                    <StyledTextInput
                        label="Typical Eating Routine"
                        placeholder="e.g., Breakfast at 8 AM, Lunch at 1 PM, Dinner at 7 PM"
                        value={eatingRoutine}
                        onChangeText={setEatingRoutine}
                        multiline
                        style={styles.multilineInput}
                    />
                </View>

                <View style={styles.formControlContainer}>
                    <StyledPicker
                        label="Physical Activity Frequency"
                        items={activityLevels}
                        selectedValue={activityLevel}
                        onValueChange={(value) => setActivityLevel(value as string)}
                        placeholder="Select your activity level"
                    />
                </View>

                {error ? <StyledText type="error" style={GlobalStyles.errorText}>{error}</StyledText> : null}

                <StyledButton
                    title="Generate My Diet"
                    onPress={handleFinish}
                    style={styles.finishButton}
                />
            </ScrollView>
        </KeyboardAvoidingWrapper>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingBottom: 40,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
    },
    formControlContainer: {
        marginBottom: 24,
    },
    multilineInput: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    finishButton: {
        marginTop: 16,
    },
});