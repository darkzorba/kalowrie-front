import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { BaseColors } from '../constants/Colors';
import { useTheme } from '../contexts/ThemeContext';
import { useWorkoutForm } from '../contexts/WorkoutFormContext';
import { StyledText } from './StyledText';

interface MinimizedWorkoutTabProps {
    onContinue?: () => void;
}

export const MinimizedWorkoutTab: React.FC<MinimizedWorkoutTabProps> = ({ onContinue }) => {
    const { colors } = useTheme();
    const { minimizedWorkout, performCompleteDiscard, hideMinimizedWorkout } = useWorkoutForm();
    const router = useRouter();
    const [currentTime, setCurrentTime] = useState<Date>(new Date());


    useEffect(() => {
        if (!minimizedWorkout?.isVisible) {
            return;
        }

        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => {
            clearInterval(timer);

        };
    }, [minimizedWorkout?.isVisible]);


    useEffect(() => {
        return () => {

        };
    }, []);

    if (!minimizedWorkout?.isVisible) {
        return null;
    }

    const formatElapsedTime = (startTime: Date): string => {
        const elapsed = Math.floor((currentTime.getTime() - startTime.getTime()) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        return `${minutes}m ${seconds}s`;
    };

    const handleContinue = () => {

        hideMinimizedWorkout();
        
        if (onContinue) {
            onContinue();
        } else {

            router.push({
                pathname: '/(app)/active-workout',
                params: { workoutData: JSON.stringify(minimizedWorkout.workoutData) }
            });
        }
    };

    const handleDiscard = () => {

        Alert.alert(
            'Descartar Treino',
            'Tem certeza que deseja descartar este treino? Todos os dados serão perdidos.',
            [
                { text: 'Cancelar', style: 'cancel' },
                { 
                    text: 'Descartar', 
                    style: 'destructive',
                    onPress: async () => {
                        await performCompleteDiscard();
                    }
                }
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.content}>
                <View style={styles.leftSection}>
                    <StyledText style={[styles.title, { color: colors.text }]}>
                        Treinamento em Progresso
                    </StyledText>
                    <StyledText style={[styles.timer, { color: colors.primary }]}>
                        {formatElapsedTime(minimizedWorkout.sessionStartTime)}
                    </StyledText>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.continueButton, { backgroundColor: colors.primary }]}
                        onPress={handleContinue}
                    >
                        <Ionicons name="play" size={16} color={BaseColors.white} />
                        <StyledText style={styles.continueText}>Continuar</StyledText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.discardButton, { backgroundColor: BaseColors.error }]}
                        onPress={handleDiscard}
                    >
                        <Ionicons name="close" size={16} color={BaseColors.white} />
                        <StyledText style={styles.discardText}>Descartar</StyledText>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 83,
        left: 0,
        right: 0,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        borderWidth: 1,
        marginHorizontal: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
        zIndex: 1000,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    leftSection: {
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    timer: {
        fontSize: 12,
        fontWeight: '500',
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    continueButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 4,
    },
    continueText: {
        color: BaseColors.white,
        fontSize: 12,
        fontWeight: '600',
    },
    discardButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 4,
    },
    discardText: {
        color: BaseColors.white,
        fontSize: 12,
        fontWeight: '600',
    },
}); 