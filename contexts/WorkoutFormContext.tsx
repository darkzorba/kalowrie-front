import React, { createContext, ReactElement, ReactNode, useCallback, useContext, useState } from 'react';
import { Platform } from 'react-native';


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

interface WorkoutFormData {
    id?: string;
    workout_name: string;
    exercises_list: Exercise[];
}

interface MinimizedWorkoutData {
    workoutData: any;
    sessionStartTime: Date;
    isVisible: boolean;
}

interface WorkoutFormContextType {
    workoutPlan: WorkoutPlan;
    isEditMode: boolean;
    editingWorkoutId: number | null;
    studentId: string | null;
    
    setWorkoutPlan: (plan: WorkoutPlan | ((prev: WorkoutPlan) => WorkoutPlan)) => void;
    setIsEditMode: (mode: boolean) => void;
    setEditingWorkoutId: (id: number | null) => void;
    setStudentId: (id: string | null) => void;
    
    preserveFormState: (plan: WorkoutPlan, editMode: boolean, workoutId: number | null, student: string) => void;
    restoreFormState: () => { plan: WorkoutPlan; editMode: boolean; workoutId: number | null; student: string } | null;
    clearPreservedState: () => void;
    
    hasPreservedState: boolean;

    formData: WorkoutFormData;
    setFormData: (data: WorkoutFormData) => void;
    exercises: Exercise[];
    setExercises: (exercises: Exercise[]) => void;
    addExercise: (exercise: Exercise) => void;
    removeExercise: (exerciseId: number) => void;
    updateExercise: (exerciseId: number, updatedExercise: Exercise) => void;
    clearForm: () => void;
    
    minimizedWorkout: MinimizedWorkoutData | null;
    showMinimizedWorkout: (workoutData: any, startTime: Date) => void;
    hideMinimizedWorkout: () => void;
    continueWorkout: () => void;
    discardMinimizedWorkout: () => void;
    performCompleteDiscard: () => Promise<void>;
    
    resetTrigger: number;
    triggerActiveSessionReset: () => void;
    clearResetTrigger: () => void;
}

const WorkoutFormContext = createContext<WorkoutFormContextType | undefined>(undefined);

interface WorkoutFormProviderProps {
    children: ReactNode;
}

export const WorkoutFormProvider = ({ children }: WorkoutFormProviderProps): ReactElement => {
    const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan>({ workouts: [] });
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingWorkoutId, setEditingWorkoutId] = useState<number | null>(null);
    const [studentId, setStudentId] = useState<string | null>(null);
    

    const [preservedState, setPreservedState] = useState<{
        plan: WorkoutPlan;
        editMode: boolean;
        workoutId: number | null;
        student: string;
    } | null>(null);

    const [formData, setFormData] = useState<WorkoutFormData>({
        workout_name: '',
        exercises_list: []
    });
    
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [minimizedWorkout, setMinimizedWorkout] = useState<MinimizedWorkoutData | null>(null);
    const [resetTrigger, setResetTrigger] = useState<number>(0);

    const preserveFormState = useCallback((plan: WorkoutPlan, editMode: boolean, workoutId: number | null, student: string) => {
        setPreservedState({
            plan,
            editMode,
            workoutId,
            student
        });
    }, []);

    const restoreFormState = useCallback(() => {
        if (preservedState) {
            const state = preservedState;
            setPreservedState(null);
            return state;
        }
        return null;
    }, [preservedState]);

    const clearPreservedState = useCallback(() => {
        setPreservedState(null);
    }, []);

    const addExercise = (exercise: Exercise) => {
        const newExercises = [...exercises, exercise];
        setExercises(newExercises);
        setFormData(prev => ({
            ...prev,
            exercises_list: newExercises
        }));
    };

    const removeExercise = (exerciseId: number) => {
        const filteredExercises = exercises.filter(ex => ex.id !== exerciseId);
        setExercises(filteredExercises);
        setFormData(prev => ({
            ...prev,
            exercises_list: filteredExercises
        }));
    };

    const updateExercise = (exerciseId: number, updatedExercise: Exercise) => {
        const updatedExercises = exercises.map(ex => 
            ex.id === exerciseId ? updatedExercise : ex
        );
        setExercises(updatedExercises);
        setFormData(prev => ({
            ...prev,
            exercises_list: updatedExercises
        }));
    };

    const clearForm = () => {
        setFormData({
            workout_name: '',
            exercises_list: []
        });
        setExercises([]);
    };


    const showMinimizedWorkout = (workoutData: any, startTime: Date) => {
        setMinimizedWorkout({
            workoutData,
            sessionStartTime: startTime,
            isVisible: true
        });
    };

    const hideMinimizedWorkout = () => {
        setMinimizedWorkout(null);
    };

    const continueWorkout = () => {


    };

    const discardMinimizedWorkout = () => {

        setMinimizedWorkout(null);
        


    };

    const triggerActiveSessionReset = () => {
        const timestamp = Date.now();
        setResetTrigger(timestamp);

    };

    const clearResetTrigger = () => {
        setResetTrigger(0);
    };

    const performCompleteDiscard = async () => {

        
        try {
            if (minimizedWorkout?.workoutData) {

                const workoutId = minimizedWorkout.workoutData.id || minimizedWorkout.workoutData.workout_id;

                
                if (workoutId) {
                    const SESSION_KEY = 'kalowrie_workout_session';

                    if (Platform.OS !== 'ios') {
                        try {
                            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                            await AsyncStorage.removeItem(`${SESSION_KEY}_${workoutId}`);

                        } catch (storageError) {

                        }
                    } else {

                    }
                }
            }
            

            setMinimizedWorkout(null);

            


            triggerActiveSessionReset();
            

        } catch (error) {


            setMinimizedWorkout(null);
            


            triggerActiveSessionReset();
        }
    };

    return (
        <WorkoutFormContext.Provider value={{
            workoutPlan,
            isEditMode,
            editingWorkoutId,
            studentId,
            setWorkoutPlan,
            setIsEditMode,
            setEditingWorkoutId,
            setStudentId,
            preserveFormState,
            restoreFormState,
            clearPreservedState,
            hasPreservedState: preservedState !== null,
            formData,
            setFormData,
            exercises,
            setExercises,
            addExercise,
            removeExercise,
            updateExercise,
            clearForm,
            minimizedWorkout,
            showMinimizedWorkout,
            hideMinimizedWorkout,
            continueWorkout,
            discardMinimizedWorkout,
            performCompleteDiscard,
            resetTrigger,
            triggerActiveSessionReset,
            clearResetTrigger
        }}>
            {children}
        </WorkoutFormContext.Provider>
    );
};

export const useWorkoutForm = () => {
    const context = useContext(WorkoutFormContext);
    if (context === undefined) {
        throw new Error('useWorkoutForm must be used within a WorkoutFormProvider');
    }
    return context;
}; 