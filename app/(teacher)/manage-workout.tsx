import { useLocalization } from '@/contexts/LocalizationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useWorkoutForm } from '@/contexts/WorkoutFormContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import KeyboardAvoidingWrapper from '@/components/KeyboardAvoidingWrapper';
import { StyledButton } from '@/components/StyledButton';
import { StyledText } from '@/components/StyledText';
import { StyledTextInput } from '@/components/StyledTextInput';
import apiService from '@/services/apiService';


interface Exercise {
    id: number;
    exerciseId: string | null;
    minReps: string;
    maxReps: string;
    sets: string;
    notes: string;
    order: number;
    we_id?: number | null;
}

interface Workout {
    id: number;
    name: string;
    dayOfWeek: string;
    exercises: Exercise[];
}

interface WorkoutPlan {
    workouts: Workout[];
}

interface ApiExercise {
    id: number;
    name: string;
    exercise_type: string;
    muscle_group: string;
    exercise_equipment: string;
    exercise_image: string;
}

interface ExerciseOption {
    label: string;
    value: string;
    exercise: ApiExercise;
}

interface ExercisesApiResponse {
    status: boolean;
    exercises_list: ApiExercise[];
}

interface ApiExerciseData {
    exercise_id: number;
    exercise_name: string;
    min_reps: number;
    max_reps: number;
    sets: number;
    observations?: string;
    order: number;
}

interface ApiWorkoutData {
    name: string;
    day_of_week: string;
    exercises: ApiExerciseData[];
}

interface ApiWorkoutPlanData {
    workouts: ApiWorkoutData[];
}

interface ApiWorkoutItem {
    id: number;
    workout_name: string;
    week_day: string;
    exercises_list: ApiExerciseData[];
}

interface ApiWorkoutResponse {
    status: boolean;
    workouts_list: ApiWorkoutItem[];
}


export default function ManageWorkoutScreen() {
    const { colors } = useTheme();
    const { t } = useLocalization();
    const router = useRouter();
    const params = useLocalSearchParams();
    const { studentId, existingWorkout, workoutId } = params;


    const {
        workoutPlan,
        isEditMode,
        editingWorkoutId,
        studentId: contextStudentId,
        setWorkoutPlan,
        setIsEditMode,
        setEditingWorkoutId,
        setStudentId,
        preserveFormState,
        restoreFormState,
        clearPreservedState
    } = useWorkoutForm();

    const [isLoading, setIsLoading] = useState(false);
    const [isExercisesLoading, setIsExercisesLoading] = useState(true);
    const [availableExercises, setAvailableExercises] = useState<ExerciseOption[]>([]);
    const [isExerciseModalVisible, setExerciseModalVisible] = useState(false);
    const [activeExerciseSetter, setActiveExerciseSetter] = useState<{ set: (value: string) => void } | null>(null);


    const currentStudentId = contextStudentId || studentId;


    const dayOfWeekOptions = [
        { label: t('monday'), value: 'monday' },
        { label: t('tuesday'), value: 'tuesday' },
        { label: t('wednesday'), value: 'wednesday' },
        { label: t('thursday'), value: 'thursday' },
        { label: t('friday'), value: 'friday' },
        { label: t('saturday'), value: 'saturday' },
        { label: t('sunday'), value: 'sunday' },
    ];

    useEffect(() => {
        const fetchAndPrepareData = async () => {
            setIsExercisesLoading(true);
            try {

                if (studentId && !contextStudentId) {
                    setStudentId(studentId as string);
                }


                const exercisesResponse = await apiService<ExercisesApiResponse>('/exercise/all', 'GET');
                let allExercises: ExerciseOption[] = [];
                if (exercisesResponse.status && Array.isArray(exercisesResponse.exercises_list)) {
                    allExercises = exercisesResponse.exercises_list.map((exercise, index) => ({
                        label: exercise.name, 
                        value: String(exercise.id),
                        exercise: exercise,
                    }));
                    setAvailableExercises(allExercises);
                }


                const preservedState = restoreFormState();
                if (preservedState) {

                    setWorkoutPlan(preservedState.plan);
                    setIsEditMode(preservedState.editMode);
                    setEditingWorkoutId(preservedState.workoutId);

                    if (preservedState.student) {
                        setStudentId(preservedState.student);
                    }
                } else {

                    if (existingWorkout) {
                        try {
                            const workoutData = JSON.parse(existingWorkout as string);
                            
                            const transformExistingWorkoutToState = (apiWorkout: any, exercisesList: ExerciseOption[]): Workout => {
                                const exercises: Exercise[] = (apiWorkout.exercises_list || []).map((apiExercise: any, index: number) => {
                                    const matchingExercise = exercisesList.find(e => e.exercise.id === apiExercise.id);
                                    
                                    return {
                                        id: index + 1,
                                        exerciseId: matchingExercise ? matchingExercise.value : null,
                                        minReps: String(apiExercise.min_reps || 0),
                                        maxReps: String(apiExercise.max_reps || 0),
                                        sets: String(apiExercise.sets || 0),
                                        notes: apiExercise.observations || '',
                                        order: index + 1,
                                        we_id: apiExercise.we_id || null,
                                    };
                                });

                                return {
                                    id: apiWorkout.id,
                                    name: apiWorkout.workout_name || '',
                                    dayOfWeek: apiWorkout.week_day || '',
                                    exercises: exercises,
                                };
                            };

                            const transformedWorkout = transformExistingWorkoutToState(workoutData, allExercises);
                            setWorkoutPlan({ workouts: [transformedWorkout] });
                            setIsEditMode(true);
                            setEditingWorkoutId(workoutData.id);
                        } catch (parseError) {

                            setWorkoutPlan({ workouts: [] });
                            setIsEditMode(false);
                            setEditingWorkoutId(null);
                        }
                    } else {

                        setWorkoutPlan({ workouts: [{ id: Date.now(), name: '', dayOfWeek: '', exercises: [] }] });
                        setIsEditMode(false);
                        setEditingWorkoutId(null);
                    }
                }
            } catch (e) {

                Alert.alert("Erro", "Não foi possível carregar os dados necessários.");
                setIsEditMode(false);
                setEditingWorkoutId(null);
            } finally {
                setIsExercisesLoading(false);
            }
        };

        fetchAndPrepareData();
    }, [studentId, existingWorkout, t]);


    useEffect(() => {
        return () => {


        };
    }, []);

    const handleWorkoutPlanUpdate = useCallback(<K extends keyof WorkoutPlan>(field: K, value: WorkoutPlan[K]) => 
        setWorkoutPlan((prev: WorkoutPlan) => ({ ...prev, [field]: value })), [setWorkoutPlan]);
    
    const handleWorkoutUpdate = useCallback((workoutId: number, field: keyof Workout, value: any) => 
        setWorkoutPlan((prev: WorkoutPlan) => ({ 
            ...prev, 
            workouts: prev.workouts.map((w: Workout) => w.id === workoutId ? { ...w, [field]: value } : w) 
        })), [setWorkoutPlan]);
    
    const handleExerciseUpdate = useCallback((workoutId: number, exerciseId: number, field: keyof Exercise, value: any) => 
        setWorkoutPlan((prev: WorkoutPlan) => ({ 
            ...prev, 
            workouts: prev.workouts.map((w: Workout) => w.id === workoutId ? { 
                ...w, 
                exercises: w.exercises.map((e: Exercise) => e.id === exerciseId ? { ...e, [field]: value } : e) 
            } : w) 
        })), [setWorkoutPlan]);

    const addWorkout = useCallback(() => {
        if (isEditMode) {

            Alert.alert('Erro', 'Não é possível adicionar novos treinos no modo de edição');
            return;
        }
        const newWorkout = { id: Date.now(), name: '', dayOfWeek: '', exercises: [] };
        handleWorkoutPlanUpdate('workouts', [...(workoutPlan.workouts || []), newWorkout]);
    }, [workoutPlan.workouts, isEditMode]);

    const addExercise = useCallback((workoutId: number) => {
        const workout = workoutPlan.workouts?.find(w => w.id === workoutId);
        if (workout) {
            const newOrder = (workout.exercises || []).length + 1;
            const newExercise = { 
                id: Date.now(), 
                exerciseId: null, 
                minReps: '', 
                maxReps: '', 
                sets: '', 
                notes: '', 
                order: newOrder,
                ...(isEditMode && { we_id: null })
            };
            handleWorkoutUpdate(workoutId, 'exercises', [...(workout.exercises || []), newExercise]);
        }
    }, [workoutPlan.workouts, isEditMode]);

    const removeWorkout = useCallback((id: number) => {
        if (isEditMode && (workoutPlan.workouts || []).length === 1) {
            Alert.alert('Erro', 'Não é possível deletar o único treino no modo de edição');
            return;
        }
        handleWorkoutPlanUpdate('workouts', (workoutPlan.workouts || []).filter(w => w.id !== id));
    }, [workoutPlan.workouts, isEditMode]);

    const removeExercise = useCallback((workoutId: number, id: number) => {
        const workout = workoutPlan.workouts?.find(w => w.id === workoutId);
        if (workout) {
            const updatedExercises = (workout.exercises || []).filter(e => e.id !== id);

            const reorderedExercises = updatedExercises.map((exercise, index) => ({
                ...exercise,
                order: index + 1
            }));
            handleWorkoutUpdate(workoutId, 'exercises', reorderedExercises);
        }
    }, [workoutPlan.workouts]);

    const closeExerciseModal = useCallback(() => {
        setExerciseModalVisible(false);
        setActiveExerciseSetter(null);
    }, []);

    const openExerciseModal = useCallback((setter: (value: string) => void) => {
        setActiveExerciseSetter({ set: setter });
        setExerciseModalVisible(true);
    }, []);

    const onExerciseSelect = useCallback((item: ExerciseOption) => {
        if (activeExerciseSetter) activeExerciseSetter.set(item.value);
        setExerciseModalVisible(false);
        setActiveExerciseSetter(null);
    }, [activeExerciseSetter]);


    const navigateToAddExercise = useCallback(() => {

        setExerciseModalVisible(false);
        

        preserveFormState(workoutPlan, isEditMode, editingWorkoutId, currentStudentId as string);
        router.push('/(teacher)/add-new-exercise');
    }, [workoutPlan, isEditMode, editingWorkoutId, currentStudentId, preserveFormState, router]);


    const navigateToOtherScreen = useCallback((route: string) => {
        clearPreservedState();
        router.push(route as any);
    }, [clearPreservedState, router]);


    useFocusEffect(
        useCallback(() => {

            const preservedState = restoreFormState();
            if (preservedState) {

                const updateExercises = async () => {
                    try {
                        const exercisesResponse = await apiService<ExercisesApiResponse>('/exercise/all', 'GET');
                        if (exercisesResponse.status && Array.isArray(exercisesResponse.exercises_list)) {
                            const allExercises = exercisesResponse.exercises_list.map((exercise, index) => ({
                                label: exercise.name, 
                                value: String(exercise.id),
                                exercise: exercise,
                            }));
                            setAvailableExercises(allExercises);
                        }
                    } catch (error) {

                    }
                };
                updateExercises();
            }
        }, [])
    );

    const handleSaveWorkout = async () => {
        setIsLoading(true);

        const transformExercise = (exercise: Exercise) => {
            const exerciseDetails = availableExercises.find(e => e.value === exercise.exerciseId);
            const baseExercise = {
                exercise_id: exerciseDetails?.exercise.id || 0,
                min_reps: parseInt(exercise.minReps) || 0,
                max_reps: parseInt(exercise.maxReps) || 0,
                sets: parseInt(exercise.sets) || 0,
                notes: exercise.notes,
                order: exercise.order,
            };
            

            if (isEditMode) {
                return {
                    ...baseExercise,
                    we_id: exercise.we_id || null
                };
            }
            
            return baseExercise;
        };

        try {
            if (isEditMode && editingWorkoutId) {

                const workout = workoutPlan.workouts?.[0];
                if (!workout) {
                    throw new Error('Nenhum treino encontrado para editar');
                }
                const workoutPayload = {
                    workout_id: editingWorkoutId,
                    student_id: parseInt(currentStudentId as string, 10),
                    name: workout.name,
                    day_of_week: workout.dayOfWeek,
                    exercises: (workout.exercises || []).map(transformExercise)
                };

                const response = await apiService('/user/workout/', 'POST', workoutPayload);
                if ((response as any).status) {
                    Alert.alert('Sucesso', 'Treino atualizado com sucesso!');
                    router.back();
                } else {
                    throw new Error((response as any)?.message || 'Falha ao atualizar treino.');
                }
            } else {

                if (!workoutPlan.workouts || workoutPlan.workouts.length === 0) {
                    throw new Error('Nenhum treino para salvar');
                }
                const workoutPayload = {
                    student_id: parseInt(currentStudentId as string, 10),
                    workouts: workoutPlan.workouts.map(workout => ({
                        id: workout.id,
                        name: workout.name,
                        day_of_week: workout.dayOfWeek,
                        exercises: (workout.exercises || []).map(transformExercise)
                    }))
                };

                const response = await apiService('/user/workout/save/split', 'POST', workoutPayload);
                if ((response as any).status) {
                    Alert.alert('Sucesso', 'Treino salvo com sucesso!');
                    router.back();
                } else {
                    throw new Error((response as any)?.message || 'Falha ao salvar treino.');
                }
            }
        } catch (error: any) {

            Alert.alert('Erro', error.message || 'Falha ao salvar treino.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isExercisesLoading) {
        return (
            <SafeAreaView style={{flex: 1, backgroundColor: colors.appBackground, justifyContent: 'center', alignItems: 'center'}}>
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={{flex: 1, backgroundColor: colors.appBackground}}>
            <KeyboardAvoidingWrapper>
                <ScrollView contentContainerStyle={styles.container}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                        <TouchableOpacity 
                            onPress={() => {

                                clearPreservedState();
                                router.back();
                            }} 
                            style={{ marginRight: 10 }}
                        >
                            <Ionicons name="arrow-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <StyledText type="title" style={{ color: colors.text }}>
                            {isEditMode ? t('editWorkout') : t('addWorkout')}
                        </StyledText>
                    </View>

                    <View style={[styles.workoutFormContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <StyledText type="subtitle" style={{ color: colors.text, textAlign: 'center', marginBottom: 15 }}>{t('workoutDetails')}</StyledText>

                        {workoutPlan.workouts && workoutPlan.workouts.length > 0 ? (
                            workoutPlan.workouts.map((workout, index) => (
                                <WorkoutItem
                                    key={workout.id}
                                    workout={workout}
                                    index={index}
                                    availableExercises={availableExercises}
                                    dayOfWeekOptions={dayOfWeekOptions}
                                    onWorkoutUpdate={handleWorkoutUpdate}
                                    onExerciseUpdate={handleExerciseUpdate}
                                    onAddExercise={addExercise}
                                    onRemoveWorkout={removeWorkout}
                                    onRemoveExercise={removeExercise}
                                    onOpenExerciseModal={openExerciseModal}
                                    isEditMode={isEditMode}
                                />
                            ))
                        ) : (
                            <StyledText style={{ textAlign: 'center', color: colors.placeholderText, marginVertical: 20 }}>
                                {t('noWorkoutsFound')}
                            </StyledText>
                        )}

                        {!isEditMode && (
                            <StyledButton title={t('addWorkout')} variant="text" onPress={addWorkout} style={{ alignSelf: 'center' }} />
                        )}
                    </View>

                    <StyledButton 
                        title={isEditMode ? t('saveChanges') : t('saveWorkout')} 
                        onPress={handleSaveWorkout} 
                        loading={isLoading} 
                        disabled={isLoading} 
                        style={{ marginTop: 20 }} 
                    />

                </ScrollView>
                <ExerciseSearchModal isVisible={isExerciseModalVisible} onClose={closeExerciseModal} exercises={availableExercises} onSelect={onExerciseSelect} onNavigateToAddExercise={navigateToAddExercise} />
            </KeyboardAvoidingWrapper>
        </SafeAreaView>
    );
}

const WorkoutItem = React.memo(({ workout, index, availableExercises, dayOfWeekOptions, onWorkoutUpdate, onExerciseUpdate, onAddExercise, onRemoveWorkout, onRemoveExercise, onOpenExerciseModal, isEditMode }: any) => {
    const { colors } = useTheme();
    const { t } = useLocalization();

    return (
        <View style={[styles.workoutContainer, { borderColor: colors.border }]}>
            <View style={styles.workoutHeader}>
                <StyledText style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                    {workout.name || `${t('workout')} ${index + 1}`}
                </StyledText>
                <TouchableOpacity onPress={() => onRemoveWorkout(workout.id)}>
                    <Ionicons name="trash-outline" size={22} color={colors.placeholderText} />
                </TouchableOpacity>
            </View>
            <StyledTextInput label={t('workoutName')} value={workout.name} onChangeText={(v: any) => onWorkoutUpdate(workout.id, 'name', v)} placeholder={t('workoutNamePlaceholder')} />
            <TouchableOpacity 
                style={[styles.dayPickerButton, { borderColor: colors.border, backgroundColor: colors.inputBackground }]} 
                onPress={() => {

                    const currentIndex = dayOfWeekOptions.findIndex((option: any) => option.value === workout.dayOfWeek);
                    const nextIndex = (currentIndex + 1) % dayOfWeekOptions.length;
                    onWorkoutUpdate(workout.id, 'dayOfWeek', dayOfWeekOptions[nextIndex].value);
                }}
            >
                <StyledText style={{ color: colors.text }}>
                    {workout.dayOfWeek ? dayOfWeekOptions.find((option: any) => option.value === workout.dayOfWeek)?.label : t('selectDayOfWeek')}
                </StyledText>
                <Ionicons name="chevron-down" size={18} color={colors.placeholderText} />
            </TouchableOpacity>

            {workout.exercises && workout.exercises.length > 0 ? (
                workout.exercises.map((exercise: Exercise) => (
                    <ExerciseRow
                        key={exercise.id}
                        exercise={exercise}
                        workoutId={workout.id}
                        availableExercises={availableExercises}
                        onExerciseUpdate={onExerciseUpdate}
                        onRemoveExercise={onRemoveExercise}
                        onOpenExerciseModal={onOpenExerciseModal}
                    />
                ))
            ) : (
                <StyledText style={{ textAlign: 'center', color: colors.placeholderText, marginVertical: 10 }}>
                    {t('noExercisesAdded')}
                </StyledText>
            )}

            <StyledButton title={t('addExercise')} variant="outlined" onPress={() => onAddExercise(workout.id)} style={{ marginTop: 10 }} />
        </View>
    );
});

const ExerciseRow = React.memo(({ exercise, workoutId, availableExercises, onExerciseUpdate, onRemoveExercise, onOpenExerciseModal }: any) => {
    const { colors } = useTheme();
    const { t } = useLocalization();

    const selectedExercise = useMemo(() => {
        const found = availableExercises.find((e: ExerciseOption) => e.value === exercise.exerciseId);
        return found;
    }, [exercise.exerciseId, availableExercises]);

    return (
        <View style={[styles.exerciseRow, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}>
            <View style={styles.exerciseRowHeader}>
                <View style={styles.orderBadge}>
                    <Text style={[styles.orderText, { color: colors.text }]}>{exercise.order}</Text>
                </View>
                <TouchableOpacity style={[styles.exerciseSelectButton, { flex: 1, borderColor: colors.border }]} onPress={() => onOpenExerciseModal((v: any) => onExerciseUpdate(workoutId, exercise.id, 'exerciseId', v))}>
                    <Text style={[styles.selectedTextStyle, { color: selectedExercise ? colors.text : colors.placeholderText }]} numberOfLines={1}>{selectedExercise?.label || t('selectExercise')}</Text>
                    <Ionicons name="chevron-down" size={18} color={colors.placeholderText} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onRemoveExercise(workoutId, exercise.id)}>
                    <Ionicons name="trash-outline" size={22} color={colors.placeholderText} style={{ marginLeft: 10 }} />
                </TouchableOpacity>
            </View>
            
            {selectedExercise && (
                <View style={styles.exerciseInfo}>
                    <View style={styles.exerciseInfoRow}>
                        {selectedExercise.exercise.exercise_image && (
                            <Image 
                                source={{ uri: selectedExercise.exercise.exercise_image }} 
                                style={styles.exerciseInfoImage}
                                resizeMode="cover"
                            />
                        )}
                        <View style={styles.exerciseInfoTexts}>
                            <Text style={[styles.exerciseInfoText, { color: colors.placeholderText }]}>
                                {selectedExercise.exercise.muscle_group} • {selectedExercise.exercise.exercise_type}
                            </Text>
                            {selectedExercise.exercise.exercise_equipment && (
                                <Text style={[styles.exerciseInfoText, { color: colors.placeholderText }]}>{t('equipment')} {selectedExercise.exercise.exercise_equipment}</Text>
                            )}
                        </View>
                    </View>
                </View>
            )}

            <View style={styles.exerciseInputs}>
                <View style={styles.repsRow}>
                    <StyledTextInput 
                        containerStyle={{ flex: 1, marginRight: 10 }} 
                        label={t('minReps')} 
                        placeholder="8" 
                        value={exercise.minReps} 
                        onChangeText={(v: any) => onExerciseUpdate(workoutId, exercise.id, 'minReps', v)} 
                        keyboardType="numeric" 
                    />
                    <StyledTextInput 
                        containerStyle={{ flex: 1, marginRight: 10 }} 
                        label={t('maxReps')} 
                        placeholder="12" 
                        value={exercise.maxReps} 
                        onChangeText={(v: any) => onExerciseUpdate(workoutId, exercise.id, 'maxReps', v)} 
                        keyboardType="numeric" 
                    />
                    <StyledTextInput 
                        containerStyle={{ flex: 1 }} 
                        label={t('sets')} 
                        placeholder="3" 
                        value={exercise.sets} 
                        onChangeText={(v: any) => onExerciseUpdate(workoutId, exercise.id, 'sets', v)} 
                        keyboardType="numeric" 
                    />
                </View>
                <StyledTextInput 
                    label={t('observations')} 
                    placeholder={t('observationsExample')} 
                    value={exercise.notes} 
                    onChangeText={(v: any) => onExerciseUpdate(workoutId, exercise.id, 'notes', v)} 
                    multiline 
                    numberOfLines={2}
                />
            </View>
        </View>
    );
});

const ExerciseSearchModal: React.FC<{
    isVisible: boolean;
    onClose: () => void;
    exercises: ExerciseOption[];
    onSelect: (item: ExerciseOption) => void;
    onNavigateToAddExercise: () => void;
}> = ({ isVisible, onClose, exercises, onSelect, onNavigateToAddExercise }) => {
    const { colors } = useTheme();
    const { t } = useLocalization();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredExercises = exercises.filter(exercise =>
        (exercise.label?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (exercise.exercise?.muscle_group?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (exercise.exercise?.exercise_type?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }: { item: ExerciseOption }) => (
        <TouchableOpacity onPress={() => onSelect(item)} style={[styles.itemContainer, { borderBottomColor: colors.border }]}>
            {item.exercise.exercise_image && (
                <Image 
                    source={{ uri: item.exercise.exercise_image }} 
                    style={styles.exerciseImage}
                    resizeMode="cover"
                />
            )}
            <View style={styles.itemInfo}>
                <Text style={[styles.itemText, { color: colors.text }]}>{item.exercise.name}</Text>
                <Text style={[styles.itemSubText, { color: colors.placeholderText }]}>
                    {item.exercise.muscle_group} - {item.exercise.exercise_type}
                </Text>
                {item.exercise.exercise_equipment && (
                    <Text style={[styles.itemSubText, { color: colors.placeholderText }]}>
                        Equipamento: {item.exercise.exercise_equipment}
                    </Text>
                )}
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.placeholderText} />
        </TouchableOpacity>
    );

    return (
        <Modal visible={isVisible} onRequestClose={onClose} animationType="slide">
            <SafeAreaView style={[styles.modalContentContainer, { backgroundColor: colors.appBackground }]}>
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>{t('selectExercise')}</Text>
                    <TouchableOpacity onPress={onClose}><Ionicons name="close-circle" size={30} color={colors.text} /></TouchableOpacity>
                </View>
                <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
                    <Ionicons name="search" size={20} color={colors.placeholderText} style={{ marginLeft: 10 }} />
                    <TextInput style={[styles.searchInput, { color: colors.text }]} placeholder={t('searchPlaceholder')} placeholderTextColor={colors.placeholderText} value={searchQuery} onChangeText={setSearchQuery} />
                    <TouchableOpacity 
                        onPress={onNavigateToAddExercise} 
                        style={{ marginLeft: 10 }}
                    >
                        <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                    </TouchableOpacity>
                </View>
                <FlatList data={filteredExercises} renderItem={renderItem} keyExtractor={item => item.value} contentContainerStyle={{ paddingBottom: 20 }} />
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { paddingHorizontal: 20, paddingBottom: 40 },
    workoutFormContainer: { marginTop: 15, padding: 15, borderRadius: 15, borderWidth: 1 },
    workoutContainer: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, },
    workoutHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, },
    exerciseRow: { borderRadius: 10, padding: 10, marginBottom: 10, borderWidth: 1 },
    exerciseRowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    orderBadge: { 
        width: 30, 
        height: 30, 
        borderRadius: 15, 
        backgroundColor: '#007AFF', 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginRight: 10 
    },
    orderText: { 
        fontSize: 12, 
        fontWeight: 'bold', 
        color: 'white' 
    },
    exerciseSelectButton: { 
        height: 50, 
        borderWidth: 1, 
        borderRadius: 12, 
        paddingHorizontal: 15, 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        backgroundColor: 'transparent'
    },
    selectedTextStyle: { fontSize: 16, flex: 1 },
    exerciseInfo: { marginBottom: 10 },
    exerciseInfoRow: { flexDirection: 'row', alignItems: 'center' },
    exerciseInfoImage: { width: 50, height: 50, borderRadius: 10, marginRight: 10 },
    exerciseInfoTexts: { flex: 1 },
    exerciseInfoText: { fontSize: 12, marginBottom: 2 },
    exerciseInputs: { marginTop: 10 },
    repsRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10 },
    modalContentContainer: { flex: 1 },
    itemContainer: { paddingVertical: 15, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 },
    itemInfo: { flex: 1, marginRight: 10 },
    itemText: { fontSize: 16, fontWeight: '500', flexWrap: 'wrap' },
    itemSubText: { fontSize: 12, marginTop: 2 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, margin: 15, paddingHorizontal: 5 },
    searchInput: { flex: 1, height: 45, fontSize: 16, marginLeft: 10 },
    exerciseImage: { width: 50, height: 50, borderRadius: 10, marginRight: 10 },
    dayPickerButton: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'transparent'
    },
}); 