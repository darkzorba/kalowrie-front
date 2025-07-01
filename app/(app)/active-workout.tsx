import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { StyledText } from '../../components/StyledText';
import { BaseColors } from '../../constants/Colors';
import { useLocalization } from '../../contexts/LocalizationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useWorkoutForm } from '../../contexts/WorkoutFormContext';
import { createWorkoutSession, finishWorkoutSession, getPreviousWorkoutSession } from '../../services/apiService';


interface WorkoutSet {
    id: string;
    weight: string;
    reps: string;
    rir: string;
    completed: boolean;
    previousWeight?: string;
    previousReps?: string;
    previousRir?: string;
}

interface SessionExercise {
    id: string;
    name: string;
    sets: WorkoutSet[];
    notes: string;
    restTime: number;
    isResting: boolean;
    restStartTime?: Date;
    targetMinReps: number;
    targetMaxReps: number;
    targetSets: number;
    exercise_image?: string;
    observations?: string | null;
}

interface WorkoutSession {
    id: string;
    name: string;
    exercises: SessionExercise[];
    startTime: Date;
    isActive: boolean;
}


interface CreateSessionResponse {
    status: string;
    session_id?: string;
}

interface PreviousSet {
    set_number: number;
    reps_done: number;
    reps_in_reserve: number;
    weight: number;
}

interface PreviousExerciseData {
    exercise_id: number;
    sets: PreviousSet[];
}

interface PreviousSessionResponse {
    status: string;
    previous_session_list: PreviousExerciseData[];
}

export default function ActiveWorkoutScreen() {
    const { colors } = useTheme();
    const { t } = useLocalization();
    const router = useRouter();
    const params = useLocalSearchParams();
    const { workoutData, ts, workoutId, sessionId } = params;
    const { showMinimizedWorkout, hideMinimizedWorkout, resetTrigger, clearResetTrigger } = useWorkoutForm();




    const [session, setSession] = useState<WorkoutSession | null>(null);
    const [currentTime, setCurrentTime] = useState<Date>(new Date());
    const [exerciseNotes, setExerciseNotes] = useState<{[key: string]: string}>({});
    const [restTimers, setRestTimers] = useState<{[key: string]: number}>({});
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
    const [showRestModal, setShowRestModal] = useState(false);
    const [selectedRestExerciseId, setSelectedRestExerciseId] = useState<string>('');
    const [selectedMinutes, setSelectedMinutes] = useState<number>(2);
    const [selectedSeconds, setSelectedSeconds] = useState<number>(0);
    const [activeRestTimer, setActiveRestTimer] = useState<{exerciseId: string, timerId: any} | null>(null);
    const [originalWorkoutData, setOriginalWorkoutData] = useState<any>(null);
    const [apiSessionId, setApiSessionId] = useState<string | null>(null);
    const [debugStatus, setDebugStatus] = useState<string>(t('initializing'));
    const [isInitialized, setIsInitialized] = useState<boolean>(false);


    const initializationRef = useRef<{
        sessionId: string | null;
        inProgress: boolean;
    }>({ sessionId: null, inProgress: false });

    const SESSION_KEY = 'kalowrie_workout_session';
    const [sessionCache, setSessionCache] = useState<{[key: string]: string}>({});


    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);


    useEffect(() => {
        return () => {
            if (activeRestTimer) {
                clearInterval(activeRestTimer.timerId);
            }
        };
    }, [activeRestTimer]);


    useEffect(() => {
        if (resetTrigger && resetTrigger > 0) {

            resetWorkoutSession();
            clearResetTrigger();
        }
    }, [resetTrigger]);


    useEffect(() => {





        if (initializationRef.current.sessionId === sessionId && isInitialized) {

            return;
        }


        if (initializationRef.current.inProgress) {

            return;
        }


        if (!workoutData || !ts || !workoutId || !sessionId) {

            setDebugStatus(t('invalidParametersRedirecting'));
            setTimeout(() => router.back(), 2000);
            return;
        }


        initializationRef.current = { sessionId: sessionId as string, inProgress: true };



        initializeSession();
    }, [workoutData, ts, workoutId, sessionId]);

    const initializeSession = async () => {
        try {
            setDebugStatus(t('analyzingWorkoutData'));



            const workout = JSON.parse(workoutData as string);



            if (!workout || !Array.isArray(workout.exercises_list) || workout.exercises_list.length === 0) {
                throw new Error('Dados do treino são inválidos');
            }

            setDebugStatus(t('creatingLocalSession'));
            setOriginalWorkoutData(workout);


            const sessionExercises: SessionExercise[] = workout.exercises_list.map((exercise: any, index: number) => {
                const setsCount = Number(exercise.sets) || 3;
                const sets: WorkoutSet[] = Array.from({ length: setsCount }, (_, setIndex) => ({
                    id: `${index}-${setIndex}`,
                    weight: '',
                    reps: '',
                    rir: '',
                    completed: false,
                    previousWeight: '',
                    previousReps: '',
                    previousRir: ''
                }));

                return {
                    id: index.toString(),
                    name: exercise.exercise_name || 'Exercício sem nome',
                    sets,
                    notes: '',
                    restTime: 120,
                    isResting: false,
                    targetMinReps: Number(exercise.min_reps) || 8,
                    targetMaxReps: Number(exercise.max_reps) || 12,
                    targetSets: setsCount,
                    exercise_image: exercise.exercise_image || '',
                    observations: exercise.observations ?? null
                };
            });

            const newSession: WorkoutSession = {
                id: sessionId as string,
                name: workout.workout_name || 'Treino sem nome',
                exercises: sessionExercises,
                startTime: new Date(),
                isActive: true
            };


            setSession(newSession);
            setIsInitialized(true);
            setDebugStatus(t('sessionCreatedSuccessfully'));



            loadApiDataInBackground(workout, newSession);

        } catch (error) {

            setDebugStatus(`${t('errorOccurred')}: ${error}`);
            setTimeout(() => router.back(), 3000);
        } finally {
            initializationRef.current.inProgress = false;
        }
    };


    const loadApiDataInBackground = async (workoutData: any, currentSession: WorkoutSession) => {
        try {

            
            const workoutId = workoutData.id || workoutData.workout_id;
            

            await removeStoredSessionId(workoutId.toString());
            


            const sessionResponse = await createWorkoutSession(workoutId) as CreateSessionResponse;
            if (sessionResponse?.session_id) {
                setApiSessionId(sessionResponse.session_id);
                await storeSessionId(workoutId.toString(), sessionResponse.session_id);

            }
            


            const previousData = await getPreviousWorkoutSession(workoutId) as PreviousSessionResponse;
            if (previousData?.status && Array.isArray(previousData.previous_session_list)) {
                const updatedSession = updateSessionWithPreviousData(currentSession, previousData.previous_session_list, workoutData);
                setSession(updatedSession);

            }
            
        } catch (error) {


        }
    };

    const getStoredSessionId = async (workoutId: string): Promise<string | null> => {
        try {
            const cacheKey = `workout_${workoutId}`;
            if (sessionCache[cacheKey]) {
                return sessionCache[cacheKey];
            }

            if (Platform.OS !== 'ios') {
                try {
                    const storedSessionId = await AsyncStorage.getItem(`${SESSION_KEY}_${workoutId}`);
                    if (storedSessionId) {
                        setSessionCache(prev => ({ ...prev, [cacheKey]: storedSessionId }));
                        return storedSessionId;
                    }
                } catch (storageError) {

                }
            }
            return null;
        } catch (error) {

            return null;
        }
    };


    const storeSessionId = async (workoutId: string, sessionId: string): Promise<void> => {
        try {
            const cacheKey = `workout_${workoutId}`;
            setSessionCache(prev => ({ ...prev, [cacheKey]: sessionId }));

            if (Platform.OS !== 'ios') {
                try {
                    await AsyncStorage.setItem(`${SESSION_KEY}_${workoutId}`, sessionId);
                } catch (storageError) {

                }
            }
        } catch (error) {

        }
    };


    const removeStoredSessionId = async (workoutId: string): Promise<void> => {
        try {
            const cacheKey = `workout_${workoutId}`;
            setSessionCache(prev => {
                const newCache = { ...prev };
                delete newCache[cacheKey];
                return newCache;
            });

            if (Platform.OS !== 'ios') {
                try {
                    await AsyncStorage.removeItem(`${SESSION_KEY}_${workoutId}`);
                } catch (storageError) {

                }
            }
        } catch (error) {

        }
    };


    const minutes = Array.from({ length: 11 }, (_, i) => ({ label: `${i}`, value: i }));
    const seconds = Array.from({ length: 60 }, (_, i) => ({ label: `${i.toString().padStart(2, '0')}`, value: i }));

    const formatElapsedTime = (startTime: Date): string => {
        const elapsed = Math.floor((currentTime.getTime() - startTime.getTime()) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        return `${minutes}m ${seconds}s`;
    };

    const formatRestTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const toggleSetCompletion = (exerciseId: string, setId: string) => {
        if (!session) return;

        setSession(prev => {
            if (!prev) return prev;

            const updatedExercises = prev.exercises.map(exercise => {
                if (exercise.id === exerciseId) {
                    const updatedSets = exercise.sets.map(set => {
                        if (set.id === setId) {
                            return { ...set, completed: !set.completed };
                        }
                        return set;
                    });
                    return { ...exercise, sets: updatedSets };
                }
                return exercise;
            });

            return { ...prev, exercises: updatedExercises };
        });
    };

    const updateSetValue = (exerciseId: string, setId: string, field: 'weight' | 'reps' | 'rir', value: string) => {
        if (!session) return;

        setSession(prev => {
            if (!prev) return prev;

            const updatedExercises = prev.exercises.map(exercise => {
                if (exercise.id === exerciseId) {
                    const updatedSets = exercise.sets.map(set => {
                        if (set.id === setId) {
                            return { ...set, [field]: value };
                        }
                        return set;
                    });
                    return { ...exercise, sets: updatedSets };
                }
                return exercise;
            });

            return { ...prev, exercises: updatedExercises };
        });
    };

    const addSet = (exerciseId: string) => {
        if (!session) return;

        setSession(prev => {
            if (!prev) return prev;

            const updatedExercises = prev.exercises.map(exercise => {
                if (exercise.id === exerciseId) {
                    const newSetId = `${exerciseId}-${exercise.sets.length}`;
                    const newSet: WorkoutSet = {
                        id: newSetId,
                        weight: '',
                        reps: '',
                        rir: '',
                        completed: false
                    };
                    return { ...exercise, sets: [...exercise.sets, newSet] };
                }
                return exercise;
            });

            return { ...prev, exercises: updatedExercises };
        });
    };

    const startRestTimer = (exerciseId: string) => {
        const exercise = session?.exercises.find(ex => ex.id === exerciseId);
        if (!exercise) return;


        if (activeRestTimer) {
            clearInterval(activeRestTimer.timerId);
            setRestTimers(prev => ({ ...prev, [activeRestTimer.exerciseId]: exercise.restTime }));
        }

        setRestTimers(prev => ({ ...prev, [exerciseId]: exercise.restTime }));

        const timer = setInterval(() => {
            setRestTimers(prev => {
                const newTime = (prev[exerciseId] || 0) - 1;
                if (newTime <= 0) {
                    clearInterval(timer);
                    setActiveRestTimer(null);

                    Alert.alert(t('restFinished'), t('timeForNextSet'));
                    return { ...prev, [exerciseId]: 0 };
                }
                return { ...prev, [exerciseId]: newTime };
            });
        }, 1000);

        setActiveRestTimer({ exerciseId, timerId: timer });
    };

    const openNotesModal = (exerciseId: string) => {
        setSelectedExerciseId(exerciseId);
        setShowNotesModal(true);
    };

    const saveNotes = () => {
        if (!session || !selectedExerciseId) return;

        setSession(prev => {
            if (!prev) return prev;

            const updatedExercises = prev.exercises.map(exercise => {
                if (exercise.id === selectedExerciseId) {
                    return { ...exercise, notes: exerciseNotes[selectedExerciseId] || '' };
                }
                return exercise;
            });

            return { ...prev, exercises: updatedExercises };
        });

        setShowNotesModal(false);
        setSelectedExerciseId('');
    };

    const openRestModal = (exerciseId: string) => {
        const exercise = session?.exercises.find(ex => ex.id === exerciseId);
        if (exercise) {
            setSelectedRestExerciseId(exerciseId);
            const totalSeconds = exercise.restTime;
            const mins = Math.floor(totalSeconds / 60);
            const secs = totalSeconds % 60;
            setSelectedMinutes(mins);
            setSelectedSeconds(secs);
            setShowRestModal(true);
        }
    };

    const saveRestTime = () => {
        if (!session || !selectedRestExerciseId) return;

        const newRestTimeInSeconds = (selectedMinutes * 60) + selectedSeconds;

        setSession(prev => {
            if (!prev) return prev;

            const updatedExercises = prev.exercises.map(exercise => {
                if (exercise.id === selectedRestExerciseId) {
                    return { ...exercise, restTime: newRestTimeInSeconds };
                }
                return exercise;
            });

            return { ...prev, exercises: updatedExercises };
        });

        setShowRestModal(false);
        setSelectedRestExerciseId('');
    };

    const calculateExerciseTotalKgs = (exercise: SessionExercise): number => {
        return exercise.sets.reduce((total, set) => {
            if (set.completed && set.weight && set.reps) {
                const weight = parseFloat(set.weight) || 0;
                const reps = parseInt(set.reps) || 0;
                return total + (weight * reps);
            }
            return total;
        }, 0);
    };

    const calculateWorkoutTotalKgs = (): number => {
        if (!session) return 0;
        return session.exercises.reduce((total, exercise) => {
            return total + calculateExerciseTotalKgs(exercise);
        }, 0);
    };

    const calculateCompletedSets = (): number => {
        if (!session) return 0;
        return session.exercises.reduce((total, exercise) => {
            return total + exercise.sets.filter(set => set.completed).length;
        }, 0);
    };

    const resetWorkoutSession = () => {
        if (activeRestTimer) {
            clearInterval(activeRestTimer.timerId);
            setActiveRestTimer(null);
        }

        setSession(null);
        setRestTimers({});
        setExerciseNotes({});
        setApiSessionId(null);
        setOriginalWorkoutData(null);
        setSessionCache({});
        setDebugStatus(t('initializing'));
        setIsInitialized(false);


        initializationRef.current = { sessionId: null, inProgress: false };

        setShowNotesModal(false);
        setShowRestModal(false);
        setSelectedExerciseId('');
        setSelectedRestExerciseId('');
    };

    const performDiscardWorkout = async () => {
        try {

            if (originalWorkoutData) {
                const workoutId = originalWorkoutData.id || originalWorkoutData.workout_id;
                await removeStoredSessionId(workoutId.toString());

            }


            hideMinimizedWorkout();
            clearResetTrigger();


            resetWorkoutSession();


            await new Promise(resolve => setTimeout(resolve, 100));


        } catch (error) {


            resetWorkoutSession();
        }
    };

    const discardWorkout =  () => {
        Alert.alert(
            t('discardWorkoutTitle'),
            t('discardWorkoutMessage'),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('discard'),
                    style: 'destructive',
                    onPress: async () => {
                        await performDiscardWorkout();
                        router.replace('/(app)/workout');
                    }

                }
            ]
        )
    };

    const finishWorkout = () => {
        Alert.alert(
            t('finishWorkoutTitle'),
            t('finishWorkoutMessage'),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('finish'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (!session || !originalWorkoutData) return;

                            const workoutTotalKgs = calculateWorkoutTotalKgs();

                            const exercisesList = session.exercises.map((exercise, exerciseIndex) => {
                                const workoutExercise = originalWorkoutData.exercises_list[exerciseIndex];
                                const exerciseId = workoutExercise?.id || workoutExercise?.exercise_id;

                                const exerciseTotalKgs = calculateExerciseTotalKgs(exercise);

                                const sets = exercise.sets
                                    .filter(set => set.completed)
                                    .map((set, setIndex) => ({
                                        set_number: setIndex + 1,
                                        reps: parseInt(set.reps) || 0,
                                        weight: parseFloat(set.weight) || 0,
                                        rir: parseInt(set.rir) || 0,
                                        rest_time: exercise.restTime
                                    }));

                                return {
                                    id: exerciseId,
                                    total_kgs: exerciseTotalKgs,
                                    sets
                                };
                            }).filter(exercise => exercise.sets.length > 0);

                            const sessionData = {
                                workout_id: originalWorkoutData.id || originalWorkoutData.workout_id,
                                session_id: apiSessionId,
                                total_kgs: workoutTotalKgs,
                                is_finished: true,
                                exercises_list: exercisesList
                            };

                            await finishWorkoutSession(sessionData);


                            const workoutId = originalWorkoutData.id || originalWorkoutData.workout_id;
                            await removeStoredSessionId(workoutId.toString());



                            hideMinimizedWorkout();


                            resetWorkoutSession();


                            setTimeout(() => {
                                router.back();
                            }, 100);
                        } catch (error) {

                            Alert.alert(
                                t('errorTitle'),
                                t('couldNotFinishWorkout'),
                                [{ text: t('ok') }]
                            );
                        }
                    }
                }
            ]
        );
    };

    const minimizeWorkout = () => {
        if (session && originalWorkoutData) {
            showMinimizedWorkout(originalWorkoutData, session.startTime);
            router.back();
        }
    };

    const updateSessionWithPreviousData = (currentSession: WorkoutSession, previousSessionList: PreviousExerciseData[], workoutData: any): WorkoutSession => {
        try {
            if (!currentSession || !previousSessionList || !workoutData) {
                return currentSession;
            }

            const previousDataMap = new Map<number, PreviousExerciseData>();
            previousSessionList.forEach(exercise => {
                if (exercise && typeof exercise.exercise_id === 'number') {
                    previousDataMap.set(exercise.exercise_id, exercise);
                }
            });

            const updatedExercises = currentSession.exercises.map((exercise, exerciseIndex) => {
                try {
                    if (!workoutData.exercises_list || !workoutData.exercises_list[exerciseIndex]) {
                        return exercise;
                    }

                    const workoutExercise = workoutData.exercises_list[exerciseIndex];
                    const exerciseId = workoutExercise?.id || workoutExercise?.exercise_id;

                    if (!exerciseId || isNaN(Number(exerciseId))) {
                        return exercise;
                    }

                    const previousExerciseData = previousDataMap.get(Number(exerciseId));

                    if (previousExerciseData && Array.isArray(previousExerciseData.sets)) {
                        const updatedSets = exercise.sets.map((set, setIndex) => {
                            try {
                                const previousSet = previousExerciseData.sets.find(
                                    prevSet => prevSet && prevSet.set_number === setIndex + 1
                                );

                                if (previousSet) {
                                    const updatedSet = {
                                        ...set,
                                        previousWeight: previousSet.weight != null ? String(previousSet.weight) : '',
                                        previousReps: previousSet.reps_done != null ? String(previousSet.reps_done) : '',
                                        previousRir: previousSet.reps_in_reserve != null ? String(previousSet.reps_in_reserve) : ''
                                    };

                                    return updatedSet;
                                }
                                return set;
                            } catch (setError) {
                                return set;
                            }
                        });

                        return { ...exercise, sets: updatedSets };
                    }
                    return exercise;
                } catch (exerciseError) {
                    return exercise;
                }
            });

            return { ...currentSession, exercises: updatedExercises };
        } catch (error) {
            return currentSession;
        }
    };

    if (!session) {
        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.appBackground }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <StyledText style={[styles.loadingText, { color: colors.placeholderText }]}>
                        {debugStatus}
                    </StyledText>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.appBackground }]}>

            <View style={[styles.header, { backgroundColor: colors.card }]}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity
                        style={styles.minimizeButton}
                        onPress={minimizeWorkout}
                    >
                        <Ionicons name="chevron-down" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                <View style={styles.headerCenter}>
                    <TouchableOpacity style={styles.timerButton}>
                        <Ionicons name="timer-outline" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={[styles.finishButton, { backgroundColor: colors.primary }]}
                        onPress={finishWorkout}
                    >
                        <StyledText style={styles.finishButtonText}>{t('complete')}</StyledText>
                    </TouchableOpacity>
                </View>
            </View>


            <View style={[styles.statsSection, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <View style={styles.statItem}>
                    <StyledText style={[styles.statLabel, { color: colors.placeholderText }]}>{t('duration')}</StyledText>
                    <StyledText style={[styles.statValue, { color: colors.primary }]}>
                        {formatElapsedTime(session.startTime)}
                    </StyledText>
                </View>

                <View style={styles.statItem}>
                    <StyledText style={[styles.statLabel, { color: colors.placeholderText }]}>{t('volume')}</StyledText>
                    <StyledText style={[styles.statValue, { color: colors.text }]}>
                        {calculateWorkoutTotalKgs().toFixed(0)} kg
                    </StyledText>
                </View>

                <View style={styles.statItem}>
                    <StyledText style={[styles.statLabel, { color: colors.placeholderText }]}>{t('sets')}</StyledText>
                    <StyledText style={[styles.statValue, { color: colors.text }]}>
                        {calculateCompletedSets()}
                    </StyledText>
                </View>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {session.exercises.map((exercise, exerciseIndex) => (
                    <View key={exercise.id} style={[styles.exerciseCard, { backgroundColor: colors.card }]}>

                        <View style={styles.exerciseHeader}>
                            <View style={styles.exerciseImageContainer}>
                                <Image
                                    source={{ uri: exercise.exercise_image || 'https://via.placeholder.com/60x60' }}
                                    style={styles.exerciseImage}
                                />
                            </View>

                            <View style={styles.exerciseInfo}>
                                <StyledText style={[styles.exerciseName, { color: colors.primary }]}>
                                    {exercise.name}
                                </StyledText>


                                {exercise.observations && (
                                    <View style={styles.observationsContainer}>
                                        <Ionicons name="information-circle-outline" size={14} color={colors.placeholderText} />
                                        <StyledText style={[styles.observationsText, { color: colors.placeholderText }]}>
                                            {exercise.observations}
                                        </StyledText>
                                    </View>
                                )}

                                <TouchableOpacity
                                    style={styles.notesButton}
                                    onPress={() => openNotesModal(exercise.id)}
                                >
                                    <StyledText style={[styles.notesText, { color: colors.placeholderText }]}>
                                        {exercise.notes || t('addNotesHere')}
                                    </StyledText>
                                </TouchableOpacity>


                                <TouchableOpacity
                                    style={styles.restContainer}
                                    onPress={() => openRestModal(exercise.id)}
                                >
                                    <Ionicons name="time-outline" size={16} color={colors.primary} />
                                    <StyledText style={[styles.restText, { color: colors.primary }]}>
                                        {t('restTime')}: {formatRestTime(restTimers[exercise.id] || exercise.restTime)}
                                    </StyledText>
                                    {restTimers[exercise.id] && restTimers[exercise.id] < 30 && (
                                        <Ionicons name="warning" size={16} color={BaseColors.error} />
                                    )}
                                    <Ionicons name="settings-outline" size={14} color={colors.placeholderText} style={{ marginLeft: 4 }} />
                                </TouchableOpacity>
                            </View>
                        </View>


                        <View style={styles.setsTable}>

                            <View style={[styles.tableHeader, { backgroundColor: colors.inputBackground }]}>
                                <StyledText style={[styles.headerCell, { color: colors.text, flex: 0.8 }]}>{t('series').toUpperCase()}</StyledText>
                                <StyledText style={[styles.headerCell, { color: colors.text, flex: 1.2 }]}>ANTERIOR</StyledText>
                                <StyledText style={[styles.headerCell, { color: colors.text, flex: 1 }]}>KG</StyledText>
                                <StyledText style={[styles.headerCell, { color: colors.text, flex: 1 }]}>REPS</StyledText>
                                <StyledText style={[styles.headerCell, { color: colors.text, flex: 0.8 }]}>{t('rir')}</StyledText>
                                <View style={[styles.headerCell, { flex: 0.5 }]} />
                            </View>


                            {exercise.sets.map((set, setIndex) => (
                                <View key={set.id} style={[
                                    styles.tableRow,
                                    {
                                        borderBottomColor: colors.border,
                                        backgroundColor: set.completed ? (colors.text === BaseColors.white ? '#2D5A2D' : '#E8F5E8') : 'transparent'
                                    }
                                ]}>
                                    <StyledText style={[styles.setNumber, { color: colors.text }]}>
                                        {setIndex + 1}
                                    </StyledText>

                                    <StyledText style={[styles.previousData, { color: colors.placeholderText }]}>
                                        {(set.previousWeight !== '' && set.previousWeight !== undefined) &&
                                        (set.previousReps !== '' && set.previousReps !== undefined) ?
                                            `${set.previousWeight}kg x ${set.previousReps}${set.previousRir && set.previousRir !== '' ? ` @${set.previousRir}` : ''}` :
                                            '-'
                                        }
                                    </StyledText>

                                    <TextInput
                                        style={[styles.input, {
                                            backgroundColor: colors.inputBackground,
                                            color: colors.text,
                                            borderColor: colors.border
                                        }]}
                                        value={set.weight}
                                        onChangeText={(value) => updateSetValue(exercise.id, set.id, 'weight', value)}
                                        placeholder="15"
                                        placeholderTextColor={colors.placeholderText}
                                        keyboardType="numeric"
                                    />

                                    <TextInput
                                        style={[styles.input, {
                                            backgroundColor: colors.inputBackground,
                                            color: colors.text,
                                            borderColor: colors.border
                                        }]}
                                        value={set.reps}
                                        onChangeText={(value) => updateSetValue(exercise.id, set.id, 'reps', value)}
                                        placeholder={`${exercise.targetMinReps}-${exercise.targetMaxReps}`}
                                        placeholderTextColor={colors.placeholderText}
                                        keyboardType="numeric"
                                    />

                                    <TextInput
                                        style={[styles.input, {
                                            backgroundColor: colors.inputBackground,
                                            color: colors.text,
                                            borderColor: colors.border,
                                            flex: 0.8
                                        }]}
                                        value={set.rir}
                                        onChangeText={(value) => updateSetValue(exercise.id, set.id, 'rir', value)}
                                        placeholder="0-5"
                                        placeholderTextColor={colors.placeholderText}
                                        keyboardType="numeric"
                                    />

                                    <TouchableOpacity
                                        style={[
                                            styles.checkbox,
                                            {
                                                backgroundColor: set.completed ? colors.primary : 'transparent',
                                                borderColor: colors.primary,
                                                flex: 0.5,
                                                alignSelf: 'center'
                                            }
                                        ]}
                                        onPress={() => {
                                            toggleSetCompletion(exercise.id, set.id);
                                            if (!set.completed) {
                                                startRestTimer(exercise.id);
                                            }
                                        }}
                                    >
                                        {set.completed && (
                                            <Ionicons name="checkmark" size={18} color={BaseColors.white} />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>


                        <TouchableOpacity
                            style={[styles.addSetButton, { borderColor: colors.border }]}
                            onPress={() => addSet(exercise.id)}
                        >
                            <Ionicons name="add" size={20} color={colors.primary} />
                            <StyledText style={[styles.addSetText, { color: colors.primary }]}>
                                {t('addSet')}
                            </StyledText>
                        </TouchableOpacity>
                    </View>
                ))}


                <TouchableOpacity
                    style={[styles.addExerciseButton, { backgroundColor: colors.primary }]}
                    onPress={() => {

                    }}
                >
                    <Ionicons name="add" size={24} color={BaseColors.white} />
                                            <StyledText style={styles.addExerciseText}>{t('addExercise')}</StyledText>
                </TouchableOpacity>
            </ScrollView>


            <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                <TouchableOpacity style={styles.footerButton}>
                    <Ionicons name="settings-outline" size={20} color={colors.text} />
                    <StyledText style={[styles.footerButtonText, { color: colors.text }]}>
                        {t('settings')}
                    </StyledText>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.footerButton}
                    onPress={discardWorkout}
                >
                    <Ionicons name="trash-outline" size={20} color={BaseColors.error} />
                    <StyledText style={[styles.footerButtonText, { color: BaseColors.error }]}>
                        {t('discardWorkout')}
                    </StyledText>
                </TouchableOpacity>
            </View>


            <Modal
                visible={showNotesModal}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.appBackground }]}>
                    <View style={[styles.modalHeader, { backgroundColor: colors.card }]}>
                        <TouchableOpacity onPress={() => setShowNotesModal(false)}>
                            <StyledText style={[styles.modalCancelText, { color: colors.primary }]}>
                                Cancelar
                            </StyledText>
                        </TouchableOpacity>

                        <StyledText style={[styles.modalTitle, { color: colors.text }]}>
                            Notas do Exercício
                        </StyledText>

                        <TouchableOpacity onPress={saveNotes}>
                            <StyledText style={[styles.modalSaveText, { color: colors.primary }]}>
                                Salvar
                            </StyledText>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.modalContent}>
                        <TextInput
                            style={[styles.notesInput, {
                                backgroundColor: colors.inputBackground,
                                color: colors.text,
                                borderColor: colors.border
                            }]}
                            multiline
                            placeholder={t('addObservations')}
                            placeholderTextColor={colors.placeholderText}
                            value={exerciseNotes[selectedExerciseId] || ''}
                            onChangeText={(text) => setExerciseNotes(prev => ({
                                ...prev,
                                [selectedExerciseId]: text
                            }))}
                        />
                    </View>
                </SafeAreaView>
            </Modal>


            <Modal
                visible={showRestModal}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.appBackground }]}>
                    <View style={[styles.modalHeader, { backgroundColor: colors.card }]}>
                        <TouchableOpacity onPress={() => setShowRestModal(false)}>
                            <StyledText style={[styles.modalCancelText, { color: colors.primary }]}>
                                Cancelar
                            </StyledText>
                        </TouchableOpacity>

                        <StyledText style={[styles.modalTitle, { color: colors.text }]}>
                            {t('restTime')}
                        </StyledText>

                        <TouchableOpacity onPress={saveRestTime}>
                            <StyledText style={[styles.modalSaveText, { color: colors.primary }]}>
                                {t('save')}
                            </StyledText>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.modalContent}>
                        <StyledText style={[styles.modalLabel, { color: colors.text }]}>
                            {t('configureRestTime')}
                        </StyledText>

                        <View style={styles.wheelPickerContainer}>
                            <View style={styles.pickerSection}>
                                <StyledText style={[styles.pickerLabel, { color: colors.text }]}>
                                    {t('minutes')}
                                </StyledText>
                                <ScrollView
                                    style={styles.pickerScroll}
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={styles.pickerContent}
                                >
                                    {minutes.map((minute) => (
                                        <TouchableOpacity
                                            key={minute.value}
                                            style={styles.pickerItem}
                                            onPress={() => setSelectedMinutes(minute.value)}
                                        >
                                            <StyledText style={[
                                                styles.pickerItemText,
                                                { color: selectedMinutes === minute.value ? colors.primary : colors.text }
                                            ]}>
                                                {minute.label}
                                            </StyledText>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            <StyledText style={[styles.timeSeparator, { color: colors.text }]}>:</StyledText>

                            <View style={styles.pickerSection}>
                                <StyledText style={[styles.pickerLabel, { color: colors.text }]}>
                                    {t('seconds')}
                                </StyledText>
                                <ScrollView
                                    style={styles.pickerScroll}
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={styles.pickerContent}
                                >
                                    {seconds.slice(0, 60).filter((_, i) => i % 15 === 0).map((second) => (
                                        <TouchableOpacity
                                            key={second.value}
                                            style={styles.pickerItem}
                                            onPress={() => setSelectedSeconds(second.value)}
                                        >
                                            <StyledText style={[
                                                styles.pickerItemText,
                                                { color: selectedSeconds === second.value ? colors.primary : colors.text }
                                            ]}>
                                                {second.label}
                                            </StyledText>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>

                        <View style={styles.previewContainer}>
                            <StyledText style={[styles.previewLabel, { color: colors.placeholderText }]}>
                                {t('selectedTime')}
                            </StyledText>
                            <StyledText style={[styles.previewTime, { color: colors.primary }]}>
                                {selectedMinutes}:{selectedSeconds.toString().padStart(2, '0')}
                            </StyledText>
                        </View>
                    </View>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    headerLeft: {
        flex: 1,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerRight: {
        flex: 1,
        alignItems: 'flex-end',
    },
    timerText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    timerButton: {
        padding: 8,
    },
    finishButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    finishButtonText: {
        color: BaseColors.white,
        fontSize: 16,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 16,
    },
    exerciseCard: {
        marginVertical: 8,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    exerciseHeader: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    exerciseImageContainer: {
        marginRight: 12,
    },
    exerciseImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#F0F0F0',
    },
    exerciseInfo: {
        flex: 1,
    },
    exerciseName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    observationsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        marginVertical: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: 'rgba(144, 164, 174, 0.1)',
        borderRadius: 6,
    },
    observationsText: {
        fontSize: 13,
        flex: 1,
        lineHeight: 18,
    },
    notesButton: {
        marginVertical: 4,
    },
    notesText: {
        fontSize: 14,
        fontStyle: 'italic',
    },
    restContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    restText: {
        fontSize: 14,
        fontWeight: '500',
    },
    setsTable: {
        marginBottom: 16,
    },
    tableHeader: {
        flexDirection: 'row',
        paddingVertical: 8,
        paddingHorizontal: 4,
        borderRadius: 8,
        marginBottom: 8,
        alignItems: 'center',
    },
    headerCell: {
        flex: 1,
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderRadius: 4,
    },
    setNumber: {
        flex: 0.8,
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    previousData: {
        flex: 1.2,
        fontSize: 12,
        textAlign: 'center',
    },
    input: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 8,
        textAlign: 'center',
        fontSize: 16,
        marginHorizontal: 2,
    },
    repsTarget: {
        flex: 1,
        fontSize: 14,
        textAlign: 'center',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderRadius: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addSetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderWidth: 1,
        borderRadius: 8,
        borderStyle: 'dashed',
        gap: 8,
    },
    addSetText: {
        fontSize: 16,
        fontWeight: '500',
    },
    addExerciseButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        marginVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    addExerciseText: {
        color: BaseColors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 16,
        borderTopWidth: 1,
    },
    footerButton: {
        alignItems: 'center',
        gap: 4,
    },
    footerButtonText: {
        fontSize: 12,
        fontWeight: '500',
    },
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    modalCancelText: {
        fontSize: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalSaveText: {
        fontSize: 16,
        fontWeight: '600',
    },
    modalContent: {
        flex: 1,
        padding: 16,
    },
    notesInput: {
        height: 200,
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        textAlignVertical: 'top',
    },
    modalLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 20,
        textAlign: 'center',
    },
    wheelPickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    pickerSection: {
        alignItems: 'center',
        flex: 1,
    },
    pickerLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    pickerScroll: {
        height: 150,
    },
    pickerContent: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    pickerItem: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        alignItems: 'center',
    },
    pickerItemText: {
        fontSize: 18,
        fontWeight: '600',
    },
    timeSeparator: {
        fontSize: 24,
        fontWeight: 'bold',
        marginHorizontal: 16,
    },
    previewContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: 'rgba(144, 164, 174, 0.1)',
        borderRadius: 12,
    },
    previewLabel: {
        fontSize: 16,
    },
    previewTime: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    statsSection: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 16,
        borderBottomWidth: 1,
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    minimizeButton: {
        padding: 8,
    },
});
