import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Image, Platform, Animated } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../contexts/ThemeContext';
import { useLocalization } from '../../contexts/LocalizationContext';
import { StyledText } from '../../components/StyledText';
import { StyledButton } from '../../components/StyledButton';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../../services/apiService';
import { useRouter, useFocusEffect } from 'expo-router';

const TRACKING_MESSAGES_KEYS = [
    'analyzingPhoto',
    'identifyingIngredients',
    'calculatingValues',
    'almostThere',
];

interface CalculatedMeal {
    name: string;
    total_carbs: number;
    total_proteins: number;
    total_fats: number;
    total_kcals: number;
    amount: string;
    ingredients: any[];
}

interface MacrosApiResponse {
    macros_dict: CalculatedMeal;
}

const BouncingFruit = ({ yAnim, emoji }: { yAnim: Animated.Value, emoji: string }) => (
    <Animated.Text style={[styles.fruitLoader, { transform: [{ translateY: yAnim }] }]}> {emoji} </Animated.Text>
);

export default function TrackByPhotoScreen() {
    const { colors } = useTheme();
    const { t } = useLocalization();
    const router = useRouter();
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const yAnim1 = useRef(new Animated.Value(0)).current;
    const yAnim2 = useRef(new Animated.Value(0)).current;
    const yAnim3 = useRef(new Animated.Value(0)).current;

    const resetScreen = () => {
        setImageUri(null);
        setError('');
        setIsLoading(false);
    };

    useFocusEffect(
        useCallback(() => {
            resetScreen();
            return () => {};
        }, [])
    );

    const pickImage = async (useCamera: boolean) => {
        const permission = useCamera
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permission.status !== 'granted') {
            alert(t('photoPermissionRequired'));
            return;
        }

        const result = useCamera
            ? await ImagePicker.launchCameraAsync({ quality: 0.5 })
            : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.5 });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
            setError('');
        }
    };

    const handleSendPhoto = async () => {
        if (!imageUri) return;

        setIsLoading(true);
        try {
            const formData = new FormData();
            if (Platform.OS === 'web') {
                const response = await fetch(imageUri);
                const blob = await response.blob();
                formData.append('food_img', new File([blob], 'meal.jpg', { type: 'image/jpeg' }));
            } else {
                formData.append('food_img', {
                    uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
                    name: 'meal.jpg',
                    type: 'image/jpeg',
                } as any);
            }

            const response = await apiService<MacrosApiResponse>('/ai/track/macros', 'POST', formData, true);
            router.replace({ pathname: '/(app)/track-by-description', params: { calculatedMealData: JSON.stringify(response.macros_dict) } });
        } catch (e: any) {
            setError(e.message || t('failedToCalculate'));
        }
    };

    useEffect(() => {
        if (!isLoading) return;
        const createBounceAnimation = (animValue: Animated.Value) => Animated.sequence([
            Animated.timing(animValue, { toValue: -15, duration: 400, useNativeDriver: true }),
            Animated.timing(animValue, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]);

        const anims = [
            Animated.loop(createBounceAnimation(yAnim1)),
            Animated.loop(createBounceAnimation(yAnim2)),
            Animated.loop(createBounceAnimation(yAnim3)),
        ];

        const timeouts = [
            setTimeout(() => anims[0].start(), 0),
            setTimeout(() => anims[1].start(), 200),
            setTimeout(() => anims[2].start(), 400),
        ];

        const interval = setInterval(() => {
            setCurrentMessageIndex(prev => (prev + 1) % TRACKING_MESSAGES_KEYS.length);
        }, 3000);

        return () => {
            anims.forEach(anim => anim.stop());
            timeouts.forEach(clearTimeout);
            clearInterval(interval);
        };
    }, [isLoading]);

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.appBackground }]}>
                <View style={styles.loaderContainer}>
                    <BouncingFruit yAnim={yAnim1} emoji="📸" />
                    <BouncingFruit yAnim={yAnim2} emoji="🍽️" />
                    <BouncingFruit yAnim={yAnim3} emoji="✨" />
                </View>
                <StyledText type="title" style={[styles.loadingTitle, { color: colors.text }]}>
                    {t('analyzing')}
                </StyledText>
                <StyledText style={[styles.loadingMessage, { color: colors.text }]}>
                    {t(TRACKING_MESSAGES_KEYS[currentMessageIndex])}
                </StyledText>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.appBackground }]}>
            {!imageUri ? (
                <>
                    <Ionicons name="camera-outline" size={80} color={colors.placeholderText} />
                    <StyledText type="title" style={[styles.title, { color: colors.text }]}>{t('trackYourMeal')}</StyledText>
                    <StyledText style={[styles.subtitle, { color: colors.placeholderText }]}>{t('chooseOptionToStart')}</StyledText>
                    <StyledButton title={t('takePhoto')} onPress={() => pickImage(true)} style={styles.button} />
                    <StyledButton title={t('chooseFromLibrary')} onPress={() => pickImage(false)} variant="outlined" style={styles.button} />
                </>
            ) : (
                <>
                    <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                    <StyledText type="title" style={[styles.title, { color: colors.text }]}>{t('confirmYourPhoto')}</StyledText>
                    <StyledText style={[styles.subtitle, { color: colors.placeholderText }]}>{t('readyToAnalyze')}</StyledText>
                    {error ? <StyledText type="error" style={{ marginBottom: 10 }}>{error}</StyledText> : null}
                    <StyledButton title={t('confirmAndAnalyze')} onPress={handleSendPhoto} style={styles.button} />
                    <StyledButton title={t('chooseDifferentPhoto')} onPress={() => setImageUri(null)} variant="text" style={styles.button} />
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        marginTop: 20,
        marginBottom: 10
    },
    subtitle: {
        textAlign: 'center',
        marginBottom: 30
    },
    button: {
        width: '100%',
        maxWidth: 300,
    },
    imagePreview: {
        width: '100%',
        height: 300,
        borderRadius: 20,
        marginBottom: 20,
    },
    loaderContainer: { flexDirection: 'row', marginBottom: 40 },
    fruitLoader: { fontSize: 50, marginHorizontal: 10 },
    loadingTitle: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
    loadingMessage: { fontSize: 18, textAlign: 'center', height: 50, paddingHorizontal: 10 },
});
