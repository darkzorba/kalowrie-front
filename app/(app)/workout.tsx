import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { StyledText } from '../../components/StyledText';
import { BaseColors } from '../../constants/Colors';
import { useLocalization } from '../../contexts/LocalizationContext';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/apiService';


interface TrainingExercise {
    exercise_name: string;
    sets: number;
    min_reps: number;
    max_reps: number;
    observations: string | null;
    exercise_image?: string;
}

interface TrainingWorkout {
    id: number;
    workout_name: string;
    week_day: string;
    exercises_list: TrainingExercise[];
}

interface TrainingApiResponse {
    status: boolean;
    workouts_list: TrainingWorkout[];
}

export default function WorkoutScreen() {
    const { colors } = useTheme();
    const { t } = useLocalization();
    const router = useRouter();

    const [workoutData, setWorkoutData] = useState<TrainingWorkout[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchWorkoutData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await apiService<TrainingApiResponse>('/user/workout/', 'GET');
            
            if (response.status && response.workouts_list) {
                setWorkoutData(response.workouts_list);
            } else {
                setWorkoutData([]);
            }
        } catch (e: any) {
            const errorMessage = e.data?.message || e.message || "Não foi possível carregar os treinos.";
            setError(errorMessage);
            setWorkoutData([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchWorkoutData();
        }, [fetchWorkoutData])
    );

    const getMuscleGroupIcon = (workoutName: string) => {
        const name = workoutName.toLowerCase();
        if (name.includes('peito') || name.includes('chest')) return 'body-outline';
        if (name.includes('costas') || name.includes('back')) return 'body-outline';
        if (name.includes('pernas') || name.includes('legs')) return 'body-outline';
        if (name.includes('ombro') || name.includes('shoulder')) return 'body-outline';
        if (name.includes('bíceps') || name.includes('biceps')) return 'body-outline';
        if (name.includes('tríceps') || name.includes('triceps')) return 'body-outline';
        return 'fitness-outline';
    };

    const getMuscleGroupColor = (workoutName: string) => {
        const name = workoutName.toLowerCase();
        if (name.includes('peito') || name.includes('chest')) return '#FF6B6B';
        if (name.includes('costas') || name.includes('back')) return '#4ECDC4';
        if (name.includes('pernas') || name.includes('legs')) return '#45B7D1';
        if (name.includes('ombro') || name.includes('shoulder')) return '#96CEB4';
        if (name.includes('bíceps') || name.includes('biceps')) return '#FFEAA7';
        if (name.includes('tríceps') || name.includes('triceps')) return '#DDA0DD';
        return colors.primary;
    };

    const getWeekDayTranslation = (weekDay: string) => {
        switch (weekDay) {
            case 'monday': return t('monday');
            case 'tuesday': return t('tuesday');
            case 'wednesday': return t('wednesday');
            case 'thursday': return t('thursday');
            case 'friday': return t('friday');
            case 'saturday': return t('saturday');
            case 'sunday': return t('sunday');
            default: return weekDay;
        }
    };

    const getTotalExercises = (exercises: TrainingExercise[]) => {
        return exercises.length;
    };

    const getEstimatedDuration = (exercises: TrainingExercise[]) => {

        const totalMinutes = exercises.length * 3.5;
        return `~${Math.round(totalMinutes)} min`;
    };

    const startWorkout = (workout: TrainingWorkout) => {
        router.push({
            pathname: '/(app)/active-workout',
            params: {
                workoutData: JSON.stringify(workout)
            }
        });
    };

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.appBackground }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <StyledText style={[styles.loadingText, { color: colors.placeholderText }]}>
                        Carregando treinos...
                    </StyledText>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.appBackground }]}>
                <View style={styles.centeredMessage}>
                    <Ionicons name="alert-circle-outline" size={48} color={BaseColors.error} />
                    <StyledText style={[styles.errorText, { color: colors.text }]}>{error}</StyledText>
                    <TouchableOpacity 
                        style={[styles.retryButton, { backgroundColor: colors.primary }]}
                        onPress={fetchWorkoutData}
                    >
                        <StyledText style={styles.retryButtonText}>Tentar Novamente</StyledText>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.appBackground }]}>
            <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
                <StyledText type="title" style={[styles.title, { color: colors.text }]}>
                    Meus Treinos
                </StyledText>
                
                <StyledText style={[styles.subtitle, { color: colors.placeholderText }]}>
                    Esta semana
                </StyledText>

                {workoutData.length === 0 ? (
                    <View style={styles.centeredMessage}>
                        <Ionicons name="fitness-outline" size={48} color={colors.placeholderText} />
                        <StyledText style={[styles.noDataText, { color: colors.placeholderText }]}>
                            Nenhum treino encontrado
                        </StyledText>
                        <StyledText style={[styles.noDataSubtext, { color: colors.placeholderText }]}>
                            Entre em contato com seu personal trainer para receber seus treinos
                        </StyledText>
                    </View>
                ) : (
                    <View style={styles.workoutCards}>
                        {workoutData.map((workout) => (
                            <TouchableOpacity
                                key={workout.id}
                                style={[
                                    styles.workoutCard,
                                    { 
                                        backgroundColor: colors.card,
                                        borderLeftColor: getMuscleGroupColor(workout.workout_name),
                                        borderLeftWidth: 4,
                                    }
                                ]}
                                activeOpacity={0.8}
                            >
                                <View style={styles.cardHeader}>
                                    <View style={styles.dayInfo}>
                                        <StyledText style={[styles.dayText, { color: colors.text }]}>
                                            {getWeekDayTranslation(workout.week_day)}
                                        </StyledText>
                                        <StyledText style={[styles.muscleGroup, { color: getMuscleGroupColor(workout.workout_name) }]}>
                                            {workout.workout_name}
                                        </StyledText>
                                    </View>
                                </View>

                                <StyledText style={[styles.workoutName, { color: colors.text }]}>
                                    {workout.workout_name}
                                </StyledText>

                                <View style={styles.workoutDetails}>
                                    <View style={styles.detailItem}>
                                        <Ionicons name="list-outline" size={16} color={colors.placeholderText} />
                                        <StyledText style={[styles.detailText, { color: colors.placeholderText }]}>
                                            {getTotalExercises(workout.exercises_list)} exercícios
                                        </StyledText>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Ionicons name="time-outline" size={16} color={colors.placeholderText} />
                                        <StyledText style={[styles.detailText, { color: colors.placeholderText }]}>
                                            {getEstimatedDuration(workout.exercises_list)}
                                        </StyledText>
                                    </View>
                                </View>


                                <View style={styles.exercisesContainer}>
                                    {workout.exercises_list.slice(0, 3).map((exercise, index) => (
                                        <View key={index} style={styles.exerciseItem}>
                                            <View style={styles.exerciseRow}>
                                                <Image 
                                                    source={{ uri: exercise.exercise_image || 'https://via.placeholder.com/40x40' }}
                                                    style={styles.exerciseImage}
                                                />
                                                <View style={styles.exerciseInfo}>
                                                    <StyledText style={[styles.exerciseName, { color: colors.text }]}>
                                                        {exercise.exercise_name}
                                                    </StyledText>
                                                    <StyledText style={[styles.exerciseDetails, { color: colors.placeholderText }]}>
                                                        {exercise.sets} {t('series')} • {exercise.min_reps}-{exercise.max_reps} {t('reps')}
                                                    </StyledText>
                                                </View>
                                            </View>
                                        </View>
                                    ))}
                                    {workout.exercises_list.length > 3 && (
                                        <StyledText style={[styles.moreExercises, { color: colors.primary }]}>
                                            +{workout.exercises_list.length - 3} mais exercícios
                                        </StyledText>
                                    )}
                                </View>

                                <View style={styles.cardFooter}>
                                    <TouchableOpacity
                                        style={[styles.actionButton, { backgroundColor: colors.primary }]}
                                        onPress={() => startWorkout(workout)}
                                    >
                                        <StyledText style={styles.actionButtonText}>
                                            Iniciar Treino
                                        </StyledText>
                                        <Ionicons name="play" size={16} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 24,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    workoutCards: {
        gap: 16,
    },
    workoutCard: {
        borderRadius: 16,
        padding: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    dayInfo: {
        flex: 1,
    },
    dayText: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    muscleGroup: {
        fontSize: 14,
        fontWeight: '500',
    },
    workoutName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    workoutDetails: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        fontSize: 14,
    },
    exercisesContainer: {
        marginBottom: 16,
        gap: 8,
    },
    exerciseItem: {
        paddingLeft: 8,
    },
    exerciseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    exerciseImage: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#F0F0F0',
    },
    exerciseInfo: {
        flex: 1,
    },
    exerciseName: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 2,
    },
    exerciseDetails: {
        fontSize: 12,
    },
    moreExercises: {
        fontSize: 12,
        fontWeight: '500',
        fontStyle: 'italic',
        marginTop: 4,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    centeredMessage: {
        marginTop: 60,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    errorText: {
        fontSize: 16,
        textAlign: 'center',
    },
    retryButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 16,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    noDataText: {
        fontSize: 16,
        textAlign: 'center',
        fontWeight: '600',
    },
    noDataSubtext: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 4,
    },
}); 