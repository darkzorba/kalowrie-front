import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { StyledText } from '../../components/StyledText';
import { GlobalStyles } from '../../constants/GlobalStyles';
import { useAuth } from '../../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserDetails {
    weight?: string;
    height?: string;
    age?: string;
    gender?: string;
}

interface DietaryPreferences {
    dietaryRestrictions?: string;
    foodPreferences?: string;
    eatingRoutine?: string;
    activityLevel?: string;
}


export default function HomeScreen() {
    const { colors } = useTheme();
    const { user } = useAuth();
    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
    const [dietaryPrefs, setDietaryPrefs] = useState<DietaryPreferences | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const detailsStr = await AsyncStorage.getItem('userDetails');
                if (detailsStr) setUserDetails(JSON.parse(detailsStr));

                const prefsStr = await AsyncStorage.getItem('dietaryPreferences');
                if (prefsStr) setDietaryPrefs(JSON.parse(prefsStr));
            } catch (e) {
                console.error("Failed to load data for home screen", e);
            }
        };
        loadData();
    }, []);

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.appBackground }]}>
            <View style={styles.contentContainer}>
                <StyledText type="title" style={[GlobalStyles.title, styles.greeting, { color: colors.text }]}>
                    Welcome, {user?.email || 'User'}!
                </StyledText>
                <StyledText type="subtitle" style={[styles.subtitle, { color: colors.text }]}>
                    This is your personalized nutrition dashboard.
                </StyledText>

                <View style={[styles.card, {backgroundColor: colors.card}]}>
                    <StyledText type="subtitle" style={[styles.cardTitle, {color: colors.text}]}>Your Profile</StyledText>
                    {userDetails ? (
                        <>
                            <StyledText style={styles.cardText}>Weight: {userDetails.weight} kg</StyledText>
                            <StyledText style={styles.cardText}>Height: {userDetails.height} cm</StyledText>
                            <StyledText style={styles.cardText}>Age: {userDetails.age} years</StyledText>
                            <StyledText style={styles.cardText}>Gender: {userDetails.gender}</StyledText>
                        </>
                    ) : <StyledText style={styles.cardText}>Loading profile...</StyledText>}
                </View>

                <View style={[styles.card, {backgroundColor: colors.card}]}>
                    <StyledText type="subtitle" style={[styles.cardTitle, {color: colors.text}]}>Nutrition Preferences</StyledText>
                    {dietaryPrefs ? (
                        <>
                            <StyledText style={styles.cardText}>Restrictions: {dietaryPrefs.dietaryRestrictions || 'None'}</StyledText>
                            <StyledText style={styles.cardText}>Preferences: {dietaryPrefs.foodPreferences || 'None'}</StyledText>
                            <StyledText style={styles.cardText}>Routine: {dietaryPrefs.eatingRoutine || 'Not set'}</StyledText>
                            <StyledText style={styles.cardText}>Activity: {dietaryPrefs.activityLevel}</StyledText>
                        </>
                    ) : <StyledText style={styles.cardText}>Loading preferences...</StyledText>}
                </View>

                <StyledText style={[styles.placeholder, {color: colors.placeholderText}]}>
                    Future content like meal plans, progress tracking, and recipes will appear here.
                </StyledText>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
    },
    greeting: {
        marginBottom: 10,
        textAlign: 'left',
    },
    subtitle: {
        fontSize: 18,
        marginBottom: 30,
        textAlign: 'left',
    },
    card: {
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 20,
        marginBottom: 10,
    },
    cardText: {
        fontSize: 16,
        marginBottom: 5,
        lineHeight: 22,
    },
    placeholder: {
        textAlign: 'center',
        marginTop: 30,
        fontSize: 16,
    }
});
