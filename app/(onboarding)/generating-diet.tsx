import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useAuth} from '../../contexts/AuthContext';
import { StyledText } from '../../components/StyledText';
import { StyledButton } from '../../components/StyledButton';
import apiService from '../../services/apiService';


const MESSAGES = [
    'Gathering fresh ingredients...',
    'Consulting with our AI nutritionists...',
    'Crafting the perfect meal plan...',
    'Balancing macronutrients...',
    'Adding a dash of flavor...',
    'Finalizing your personalized diet...'
];

const BouncingFruit = ({ yAnim, emoji }: { yAnim: Animated.Value, emoji: string }) => {
    return (
        <Animated.Text style={[styles.fruitLoader, { transform: [{ translateY: yAnim }] }]}>
            {emoji}
        </Animated.Text>
    );
};

export default function GeneratingDietScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { colors } = useTheme();
    const { completeOnboarding } = useAuth();

    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const hasRequested = useRef(false);
    const yAnim1 = useRef(new Animated.Value(0)).current;
    const yAnim2 = useRef(new Animated.Value(0)).current;
    const yAnim3 = useRef(new Animated.Value(0)).current;
    const yAnim4 = useRef(new Animated.Value(0)).current;
    const yAnim5 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!isLoading) return;

        const createBounceAnimation = (animValue: Animated.Value) => {
            return Animated.sequence([
                Animated.timing(animValue, {
                    toValue: -15,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(animValue, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]);
        };

        const anims = [
            { loop: Animated.loop(createBounceAnimation(yAnim1)), delay: 0 },
            { loop: Animated.loop(createBounceAnimation(yAnim2)), delay: 150 },
            { loop: Animated.loop(createBounceAnimation(yAnim3)), delay: 300 },
            { loop: Animated.loop(createBounceAnimation(yAnim4)), delay: 450 },
            { loop: Animated.loop(createBounceAnimation(yAnim5)), delay: 600 },
        ];

        const timeouts = anims.map(anim => setTimeout(() => anim.loop.start(), anim.delay));

        return () => {
            anims.forEach(anim => anim.loop.stop());
            timeouts.forEach(clearTimeout);
        };
    }, [isLoading]);

    useEffect(() => {
        if (!isLoading) return;

        const messageInterval = setInterval(() => {
            setCurrentMessageIndex(prevIndex => (prevIndex + 1) % MESSAGES.length);
        }, 3000);

        return () => clearInterval(messageInterval);
    }, [isLoading]);

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
                const dietResponse = await apiService('/ai/generate/diet', 'POST', dietRequestBody);

                router.replace({
                    pathname: '/(onboarding)/view-diet',
                    params: { dietData: JSON.stringify(dietResponse.meals_list) }
                });

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
                        <View style={styles.loaderContainer}>
                            <BouncingFruit yAnim={yAnim1} emoji="🍎" />
                            <BouncingFruit yAnim={yAnim2} emoji="🍌" />
                            <BouncingFruit yAnim={yAnim3} emoji="🍓" />
                            <BouncingFruit yAnim={yAnim4} emoji="🥝" />
                            <BouncingFruit yAnim={yAnim5} emoji="🍇" />
                        </View>
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
    loaderContainer: {
        flexDirection: 'row',
        marginBottom: 40,
    },
    fruitLoader: {
        fontSize: 40,
        marginHorizontal: 8,
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
        height: 50,
        paddingHorizontal: 10,
    },
});
