import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { useLocalization } from '../contexts/LocalizationContext';
import { useTheme } from '../contexts/ThemeContext';
import apiService from '../services/apiService';
import { StyledText } from './StyledText';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 40;
const AUTO_PLAY_INTERVAL = 5000;

interface WorkoutExercise {
    exercise_image: string;
    exercise_name: string;
    sets: Array<{
        reps_done: number;
        rir: number;
        set_number: number;
        weight: number;
    }>;
}

interface RecentWorkout {
    exercises: WorkoutExercise[];
    workout_date: string;
    workout_name: string;
    workout_duration?: number;
}

interface RecentWorkoutsResponse {
    status: boolean;
    last_workouts_list: RecentWorkout[];
}

export const RecentWorkoutsCard = () => {
    const { colors } = useTheme();
    const { t } = useLocalization();
    const [workouts, setWorkouts] = useState<RecentWorkout[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isUserInteracting, setIsUserInteracting] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const autoPlayTimerRef = useRef<number | null>(null);
    const scrollX = useRef(new Animated.Value(0)).current;


    useEffect(() => {
        const fetchRecentWorkouts = async () => {
            try {
                setIsLoading(true);
                const response = await apiService<RecentWorkoutsResponse>('/user/workout/last', 'GET');
                if (response.status && response.last_workouts_list) {
                    setWorkouts(response.last_workouts_list);
                }
            } catch (error) {
                console.log('Erro ao carregar treinos recentes:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRecentWorkouts();
    }, []);


    useEffect(() => {
        if (workouts.length <= 1 || isUserInteracting) {
            if (autoPlayTimerRef.current) {
                clearTimeout(autoPlayTimerRef.current);
                autoPlayTimerRef.current = null;
            }
            return;
        }

        const startAutoPlay = () => {
            autoPlayTimerRef.current = setTimeout(() => {
                const nextIndex = (currentIndex + 1) % workouts.length;
                setCurrentIndex(nextIndex);
                flatListRef.current?.scrollToIndex({
                    index: nextIndex,
                    animated: true
                });
            }, AUTO_PLAY_INTERVAL);
        };

        startAutoPlay();

        return () => {
            if (autoPlayTimerRef.current) {
                clearTimeout(autoPlayTimerRef.current);
            }
        };
    }, [currentIndex, workouts.length, isUserInteracting]);


    const formatDate = useCallback((dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return t('today');
        } else if (date.toDateString() === yesterday.toDateString()) {
            return t('yesterday');
        } else {
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short'
            });
        }
    }, []);


    const formatDuration = useCallback((minutes?: number) => {
        if (!minutes) return '';
        if (minutes < 60) return `${minutes}min`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
    }, []);


    const formatNumber = useCallback((num: number) => {
        return Number.isInteger(num) ? Math.floor(num) : num.toFixed(1);
    }, []);


    const formatExerciseDetails = useCallback((exercise: WorkoutExercise) => {
        if (!exercise.sets || exercise.sets.length === 0) {
            return { weight: 'N/A', sets: 'N/A', rir: 'N/A' };
        }

        const firstSet = exercise.sets[0];
        const weight = firstSet.weight || 0;
        const reps = firstSet.reps_done || 0;
        const setCount = exercise.sets.length;
        const rir = firstSet.rir || 0;

        return {
            weight: `${formatNumber(weight)}kg`,
            sets: `${setCount}x${formatNumber(reps)}`,
            rir: `RIR ${formatNumber(rir)}`
        };
    }, [formatNumber]);


    const renderWorkoutCard = useCallback(({ item, index }: { item: RecentWorkout; index: number }) => {
        const displayExercises = item.exercises.slice(0, 2);
        const remainingExercises = item.exercises.length - 2;
        const totalSets = item.exercises.reduce((total, ex) => total + ex.sets.length, 0);

        return (
            <View style={[styles.workoutCard, { width: CARD_WIDTH }]}>
                <TouchableOpacity 
                    style={[
                        styles.cardContent,
                        { backgroundColor: colors.card }
                    ]}
                    activeOpacity={0.95}
                    onPressIn={() => setIsUserInteracting(true)}
                    onPressOut={() => setIsUserInteracting(false)}
                >

                    <View style={styles.cardHeader}>
                        <View style={styles.headerLeft}>
                            <StyledText style={[styles.workoutTitle, { color: colors.text }]}>
                                {item.workout_name}
                            </StyledText>
                            <View style={styles.headerMeta}>
                                <StyledText style={[styles.workoutDate, { color: colors.placeholderText }]}>
                                    {formatDate(item.workout_date)}
                                </StyledText>
                                {item.workout_duration && (
                                    <>
                                        <View style={[styles.metaDot, { backgroundColor: colors.placeholderText }]} />
                                        <StyledText style={[styles.workoutDuration, { color: colors.placeholderText }]}>
                                            {formatDuration(item.workout_duration)}
                                        </StyledText>
                                    </>
                                )}
                            </View>
                        </View>
                    </View>


                    <View style={[styles.divider, { backgroundColor: colors.border }]} />


                    <View style={styles.exercisesContainer}>
                        {displayExercises.map((exercise, exerciseIndex) => {
                            const details = formatExerciseDetails(exercise);
                            return (
                                <View key={exerciseIndex} style={styles.exerciseItem}>
                                    <View style={styles.exerciseImageContainer}>
                                        <Image
                                            source={{ 
                                                uri: exercise.exercise_image || 'https://via.placeholder.com/36x36'
                                            }}
                                            style={styles.exerciseImage}
                                            defaultSource={{ uri: 'https://via.placeholder.com/36x36' }}
                                        />
                                    </View>
                                    <View style={styles.exerciseContent}>
                                        <StyledText 
                                            style={[styles.exerciseName, { color: colors.text }]}
                                            numberOfLines={1}
                                        >
                                            {exercise.exercise_name}
                                        </StyledText>
                                        <View style={styles.exerciseDetails}>
                                            <View style={styles.detailItem}>
                                                <Ionicons name="barbell-outline" size={12} color={colors.placeholderText} />
                                                <StyledText style={[styles.detailText, { color: colors.placeholderText }]}>
                                                    {details.weight}
                                                </StyledText>
                                            </View>
                                            <View style={styles.detailItem}>
                                                <Ionicons name="repeat-outline" size={12} color={colors.placeholderText} />
                                                <StyledText style={[styles.detailText, { color: colors.placeholderText }]}>
                                                    {details.sets}
                                                </StyledText>
                                            </View>
                                            <View style={styles.detailItem}>
                                                <Ionicons name="timer-outline" size={12} color={colors.placeholderText} />
                                                <StyledText style={[styles.detailText, { color: colors.placeholderText }]}>
                                                    {details.rir}
                                                </StyledText>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}


                        {remainingExercises > 0 && (
                            <View style={styles.moreExercisesContainer}>
                                <StyledText style={[styles.moreExercisesText, { color: colors.primary }]}>
                                    +{remainingExercises} exercícios
                                </StyledText>
                            </View>
                        )}
                    </View>


                    <View style={[styles.divider, { backgroundColor: colors.border }]} />


                    <View style={styles.footer}>
                        <View style={styles.footerStats}>
                            <View style={styles.statItem}>
                                <Ionicons name="fitness-outline" size={16} color={colors.primary} />
                                                        <StyledText style={[styles.statText, { color: colors.placeholderText }]}>
                            {item.exercises.length} {t('exercises')}
                        </StyledText>
                            </View>
                            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                            <View style={styles.statItem}>
                                <Ionicons name="layers-outline" size={16} color={colors.primary} />
                                                            <StyledText style={[styles.statText, { color: colors.placeholderText }]}>
                                {totalSets} {t('series')}
                            </StyledText>
                            </View>
                        </View>
                        
                        <TouchableOpacity style={styles.detailsButton}>
                                                    <StyledText style={[styles.detailsButtonText, { color: colors.primary }]}>
                            {t('viewDetails')}
                        </StyledText>
                            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </View>
        );
    }, [colors, formatDate, formatDuration, formatExerciseDetails]);


    const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }, []);

    const viewabilityConfig = useMemo(() => ({
        itemVisiblePercentThreshold: 50
    }), []);




    const renderPaginationDots = () => {
        if (workouts.length <= 1) return null;

        return (
            <View style={styles.paginationContainer}>
                {workouts.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.paginationDot,
                            {
                                backgroundColor: index === currentIndex ? colors.primary : colors.border,
                                width: index === currentIndex ? 20 : 6,
                                height: 6
                            }
                        ]}
                    />
                ))}
            </View>
        );
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <StyledText style={[styles.sectionTitle, { color: colors.text }]}>
                    Treinos nos últimos 7 dias
                </StyledText>
                <View style={[styles.loadingCard, { backgroundColor: colors.card }]}>
                    <View style={styles.loadingContent}>
                        <View style={[styles.loadingShimmer, { backgroundColor: colors.inputBackground }]} />
                        <View style={[styles.loadingShimmer, { backgroundColor: colors.inputBackground, width: '60%' }]} />
                        <View style={[styles.loadingShimmer, { backgroundColor: colors.inputBackground, width: '40%' }]} />
                    </View>
                </View>
            </View>
        );
    }

    if (workouts.length === 0) {
        return (
            <View style={styles.container}>
                <StyledText style={[styles.sectionTitle, { color: colors.text }]}>
                    Treinos nos últimos 7 dias
                </StyledText>
                <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
                    <Ionicons name="fitness-outline" size={32} color={colors.placeholderText} />
                    <StyledText style={[styles.emptyText, { color: colors.placeholderText }]}>
                        {t('noWorkoutsLast7Days')}
                    </StyledText>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StyledText style={[styles.sectionTitle, { color: colors.text }]}>
                {t('recentWorkouts')}
            </StyledText>
            
            <View style={styles.carouselWrapper}>
                <FlatList
                    ref={flatListRef}
                    data={workouts}
                    renderItem={renderWorkoutCard}
                    keyExtractor={(item, index) => `${item.workout_name}-${index}`}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.carouselContainer}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    snapToInterval={CARD_WIDTH}
                    decelerationRate="fast"
                    snapToAlignment="center"
                    pagingEnabled={true}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                        { useNativeDriver: false }
                    )}
                    scrollEventThrottle={16}
                    onTouchStart={() => setIsUserInteracting(true)}
                    onTouchEnd={() => setIsUserInteracting(false)}
                    onMomentumScrollBegin={() => setIsUserInteracting(true)}
                    onMomentumScrollEnd={() => setIsUserInteracting(false)}
                />
            </View>


            {renderPaginationDots()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    carouselWrapper: {
        alignItems: 'center',
        position: 'relative',
    },
    carouselContainer: {
        alignItems: 'center',
    },
    workoutCard: {
        alignItems: 'center',
    },
    cardContent: {
        borderRadius: 16,
        padding: 18,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        minHeight: 240,
        width: '100%',
    },

    cardHeader: {
        marginBottom: 14,
    },
    headerLeft: {
        flex: 1,
    },
    workoutTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 6,
        lineHeight: 22,
    },
    headerMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    workoutDate: {
        fontSize: 14,
        fontWeight: '500',
    },
    workoutDuration: {
        fontSize: 14,
        fontWeight: '500',
    },
    metaDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
    },
    divider: {
        height: 1,
        marginVertical: 14,
    },
    exercisesContainer: {
        gap: 14,
        marginBottom: 14,
    },
    exerciseItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    exerciseImageContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: '#F0F0F0',
        flexShrink: 0,
    },
    exerciseImage: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    exerciseContent: {
        flex: 1,
        gap: 5,
    },
    exerciseName: {
        fontSize: 15,
        fontWeight: '600',
        lineHeight: 19,
    },
    exerciseDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    detailText: {
        fontSize: 12,
        fontWeight: '500',
    },
    moreExercisesContainer: {
        marginTop: 6,
        paddingLeft: 46,
    },
    moreExercisesText: {
        fontSize: 13,
        fontWeight: '600',
        fontStyle: 'italic',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerStats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    statText: {
        fontSize: 12,
        fontWeight: '500',
    },
    statDivider: {
        width: 1,
        height: 14,
    },
    detailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    detailsButtonText: {
        fontSize: 12,
        fontWeight: '600',
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        marginTop: 16,
        paddingHorizontal: 20,
    },
    paginationDot: {
        borderRadius: 3,
    },
    loadingCard: {
        borderRadius: 16,
        padding: 18,
        marginHorizontal: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        minHeight: 200,
    },
    loadingContent: {
        gap: 14,
    },
    loadingShimmer: {
        height: 18,
        borderRadius: 9,
        width: '100%',
    },
    emptyCard: {
        borderRadius: 16,
        padding: 32,
        marginHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        minHeight: 200,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 12,
        fontWeight: '500',
    },
}); 