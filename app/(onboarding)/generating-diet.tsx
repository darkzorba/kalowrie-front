import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { StyledText } from '../../components/StyledText';
import { StyledButton } from '../../components/StyledButton';
import apiService from '../../services/apiService';

const FRUITS = ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍑', '🍍', '🥝'];
const MESSAGES = [
    'Gathering fresh ingredients...',
    'Consulting with our AI nutritionists...',
    'Crafting the perfect meal plan...',
    'Balancing macronutrients...',
    'Adding a dash of flavor...',
    'Finalizing your personalized diet...'
];

export default function GeneratingDietScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { colors } = useTheme();
    const { completeOnboarding } = useAuth();

    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const [currentFruitIndex, setCurrentFruitIndex] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const hasRequested = useRef(false);
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    // Animation for the fruit loader
    useEffect(() => {
        if (!isLoading) return;

        const fruitInterval = setInterval(() => {
            Animated.sequence([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.5,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setCurrentFruitIndex(prevIndex => (prevIndex + 1) % FRUITS.length);
                Animated.sequence([
                    Animated.timing(scaleAnim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]).start();
            });
        }, 1200);

        return () => clearInterval(fruitInterval);
    }, [isLoading]);

    // Animation for the text messages
    useEffect(() => {
        if (!isLoading) return;

        const messageInterval = setInterval(() => {
            setCurrentMessageIndex(prevIndex => (prevIndex + 1) % MESSAGES.length);
        }, 3000);

        return () => clearInterval(messageInterval);
    }, [isLoading]);

    // Effect to trigger the API request only once
    useEffect(() => {
        if (hasRequested.current) return;
        hasRequested.current = true;

        const generateDiet = async () => {
            if (!params.dietRequestBody || typeof params.dietRequestBody !== 'string') {
                setError("Could not retrieve your details. Please go back and try again.");
                setIsLoading(false);
                return;
            }

            try {
                const dietRequestBody = JSON.parse(params.dietRequestBody);
                const dietResponse = await apiService('/ai/get/diet', 'POST', dietRequestBody);

                console.log('Diet plan received:', dietResponse);
                // await AsyncStorage.setItem('dietPlan', JSON.stringify(dietResponse));

                await completeOnboarding();
                router.replace('/(app)/home');
            } catch (e: any) {
                const errorMessage = e.data?.message || e.message || 'An error occurred while generating your diet.';
                setError(errorMessage);
                setIsLoading(false);
            }
        };

        generateDiet();
    }, [params]);

    return (
        <View style={[styles.container, { backgroundColor: colors.appBackground }]}>
            <View style={styles.content}>
                {isLoading && (
                    <>
                        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
                            <StyledText style={styles.fruitLoader}>
                                {FRUITS[currentFruitIndex]}
                            </StyledText>
                        </Animated.View>
                        <StyledText type="title" style={[styles.title, { color: colors.text }]}>
                            Generating Your Diet
                        </StyledText>
                        <StyledText style={[styles.message, { color: colors.text }]}>
                            {MESSAGES[currentMessageIndex]}
                        </StyledText>
                    </>
                )}
                {error && (
                    <>
                        <StyledText style={styles.fruitLoader}>😕</StyledText>
                        <StyledText type="title" style={[styles.title, { color: colors.text, marginBottom: 10 }]}>
                            Oops!
                        </StyledText>
                        <StyledText style={[styles.message, { color: colors.text, marginBottom: 20 }]}>
                            {error}
                        </StyledText>
                        <StyledButton title="Go Back" onPress={() => router.back()} />
                    </>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    fruitLoader: {
        fontSize: 80,
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    message: {
        fontSize: 18,
        textAlign: 'center',
        height: 50, // Reserve space to prevent layout shifts
        paddingHorizontal: 10,
    },
});
