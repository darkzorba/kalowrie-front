import { StyledButton } from '@/components/StyledButton';
import { StyledText } from '@/components/StyledText';
import { useLocalization } from '@/contexts/LocalizationContext';
import { useTheme } from '@/contexts/ThemeContext';
import apiService from '@/services/apiService';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, LayoutAnimation, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, UIManager, View } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}


interface StudentDetails {
    first_name: string;
    last_name: string;
    birth_date: string;
    gender: string;
    height: string | number;
    weight: string | number;
    age: string | number;
    email: string;
}

interface StudentDetailsApiResponse {
    status: boolean;
    student_dict: StudentDetails;
}

interface Substitute { name: string; total_proteins: number; total_fats: number; total_carbs: number; quantity: number; unit: string; }
interface Ingredient { name: string; total_proteins: number; total_fats: number; total_carbs: number; total_calories: number; quantity: number; unit: string; substitutes: Substitute[]; }
interface Meal { name: string; time: string; total_proteins: number; total_carbs: number; total_fats: number; total_calories: number; ingredients: Ingredient[]; }
interface DietData { total_kcals: number; proteins_g: number; carbs_g: number; fats_g: number; meals: Meal[]; }

interface DietApiResponse {
    status: boolean;
    diet_id?: number;
    diet_dict?: string;
}


interface TrainingExercise {
    exercise_name: string;
    sets: number;
    min_reps: number;
    max_reps: number;
    observations: string | null;
}

interface TrainingWorkout {
    id: number;
    workout_name: string;
    week_day: string;
    exercises_list: TrainingExercise[];
}

interface TrainingData {
    workouts_list: TrainingWorkout[];
}

interface TrainingApiResponse {
    status: boolean;
    workouts_list: TrainingWorkout[];
}



const MacroPill = ({ label, value, unit, color, colors }: { label: string, value: number, unit: string, color: string, colors: any }) => (
    <View style={[styles(colors).macroPill, { backgroundColor: color }]}>
        <Text style={styles(colors).macroLabel}>{label}</Text>
        <Text style={styles(colors).macroValue}>{Math.round(value)}{unit}</Text>
    </View>
);

const IngredientRow = ({ item, colors, isSubstitute = false }: { item: Substitute | Ingredient, colors: any, isSubstitute?: boolean }) => (
    <View style={isSubstitute ? styles(colors).substituteItem : {}}>
        <View style={styles(colors).foodHeader}>
            <Text style={[styles(colors).foodName, { color: colors.text }]}>{isSubstitute && '↳ '} {item.name}</Text>
            <Text style={[styles(colors).foodAmount, { color: colors.placeholderText }]}>{item.quantity}{item.unit}</Text>
        </View>
        <View style={styles(colors).foodMacros}>
            <Text style={[styles(colors).foodMacroText, {color: colors.text}]}>P: {item.total_proteins}g</Text>
            <Text style={[styles(colors).foodMacroText, {color: colors.text}]}>C: {item.total_carbs}g</Text>
            <Text style={[styles(colors).foodMacroText, {color: colors.text}]}>F: {item.total_fats}g</Text>
        </View>
    </View>
);

const MealCard = ({ meal, colors, t }: { meal: Meal, colors: any, t: (key: string) => string }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsExpanded(!isExpanded);
    };

    return (
        <View style={[styles(colors).mealCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity onPress={toggleExpand} style={styles(colors).mealHeader}>
                <View>
                    <Text style={[styles(colors).mealName, { color: colors.text }]}>{meal.name}</Text>
                    <Text style={[styles(colors).mealTime, { color: colors.primary }]}>{meal.time}</Text>
                </View>
                <View style={styles(colors).mealMacros}>
                    <Text style={[styles(colors).mealKcal, { color: colors.text }]}>{Math.round(meal.total_calories)} kcal</Text>
                    <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={24} color={colors.text} />
                </View>
            </TouchableOpacity>

            {isExpanded && (
                <View style={styles(colors).ingredientsContainer}>
                    {meal.ingredients.map((ingredient, foodIndex) => (
                        <View key={foodIndex} style={[styles(colors).foodItem, { borderBottomColor: colors.border }]}>
                            <IngredientRow item={ingredient} colors={colors} />
                            {Array.isArray(ingredient.substitutes) && ingredient.substitutes.length > 0 && (
                                <View style={styles(colors).optionsContainer}>
                                    <StyledText style={[styles(colors).optionsTitle, {color: colors.text}]}>{t('substitutes')}</StyledText>
                                    {ingredient.substitutes.map((sub, optIndex) => (
                                        <IngredientRow key={optIndex} item={sub} colors={colors} isSubstitute={true} />
                                    ))}
                                </View>
                            )}
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
};

const DietDisplay = ({ dietData, onEdit, onDelete }: { dietData: DietData, onEdit: () => void, onDelete: () => void }) => {
    const { colors } = useTheme();
    const { t } = useLocalization();
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsExpanded(!isExpanded);
    };

    return (
        <View style={styles(colors).sectionContainer}>
            <View style={[styles(colors).sectionHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="restaurant-outline" size={22} color={colors.text} />
                <StyledText style={[styles(colors).sectionHeaderText, { color: colors.text }]}>{t('studentDiet')}</StyledText>
                <View style={styles(colors).sectionActions}>
                    <TouchableOpacity onPress={toggleExpand} style={styles(colors).sectionActionBtn}>
                        <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={24} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onEdit} style={styles(colors).sectionActionBtn}>
                        <Ionicons name="pencil-outline" size={22} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onDelete} style={styles(colors).sectionActionBtn}>
                        <Ionicons name="trash-outline" size={22} color="#FF3B30" />
                    </TouchableOpacity>
                </View>
            </View>

            {isExpanded && (
                <View style={{marginTop: 15}}>
                    <View style={[styles(colors).card, { backgroundColor: colors.card, padding: 20, borderRadius: 12 }]}>
                        <StyledText type="subtitle" style={[styles(colors).cardTitle, { color: colors.text }]}>{t('dailyTotals')}</StyledText>
                        <View style={styles(colors).macrosContainer}>
                            <MacroPill label={t('calories')} value={dietData.total_kcals} unit="kcal" color="#F97316" colors={colors} />
                            <MacroPill label={t('protein')} value={dietData.proteins_g} unit="g" color="#3B82F6" colors={colors} />
                            <MacroPill label={t('carbs')} value={dietData.carbs_g} unit="g" color="#10B981" colors={colors} />
                            <MacroPill label={t('fat')} value={dietData.fats_g} unit="g" color="#EAB308" colors={colors} />
                        </View>
                    </View>

                    {dietData.meals.sort((a, b) => a.time.localeCompare(b.time)).map((meal, index) => (
                        <MealCard key={index} meal={meal} colors={colors} t={t as (key: string) => string} />
                    ))}
                </View>
            )}
        </View>
    )
}


const TrainingDisplay = ({ trainingData, onEdit, onDelete }: { trainingData: TrainingData, onEdit: () => void, onDelete: () => void }) => {
    const { colors } = useTheme();
    const { t } = useLocalization();
    const router = useRouter();
    const params = useLocalSearchParams();
    const { studentId } = params;
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsExpanded(!isExpanded);
    };

    const handleAddTraining = () => {
        router.push({ 
            pathname: '/(teacher)/manage-workout', 
            params: { studentId: studentId as string }
        });
    };

    const handleDeleteAllWorkouts = () => {
        Alert.alert(t('deleteTraining'), t('confirmDeleteTraining'), [
            { text: t('cancel'), style: "cancel" },
            {
                text: t('delete'), style: "destructive",
                onPress: async () => {
                    try {
                        const workoutIds = trainingData.workouts_list.map(workout => workout.id);
                        await apiService('/workout/split', 'DELETE', { workout_ids: workoutIds });
                        Alert.alert(t('success'), t('trainingDeletedSuccess'));
                        onDelete();
                    } catch (error) { 
                        Alert.alert(t('error'), t('failedToDeleteTraining')); 
                    }
                },
            },
        ]);
    };

    const handleEditWorkout = (workout: TrainingWorkout) => {
        router.push({ 
            pathname: '/(teacher)/manage-workout', 
            params: { 
                studentId: studentId as string,
                existingWorkout: JSON.stringify(workout)
            }
        });
    };

    const handleDeleteWorkout = (workout: TrainingWorkout) => {
        Alert.alert(t('deleteWorkout'), t('confirmDeleteWorkout'), [
            { text: t('cancel'), style: "cancel" },
            {
                text: t('delete'), style: "destructive",
                onPress: async () => {
                    try {
                        await apiService('/workout/', 'DELETE', { workout_id: workout.id });
                        Alert.alert(t('success'), t('workoutDeletedSuccess'));
                        onDelete();
                    } catch (error) { 
                        Alert.alert(t('error'), t('failedToDeleteWorkout')); 
                    }
                },
            },
        ]);
    };

    return (
        <View style={styles(colors).sectionContainer}>
            <View style={[styles(colors).sectionHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="barbell-outline" size={22} color={colors.text} />
                <StyledText style={[styles(colors).sectionHeaderText, { color: colors.text }]}>{t('studentTraining')}</StyledText>
                <View style={styles(colors).sectionActions}>
                    <TouchableOpacity onPress={toggleExpand} style={styles(colors).sectionActionBtn}>
                        <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={24} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleAddTraining} style={styles(colors).sectionActionBtn}>
                        <Ionicons name="add" size={22} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDeleteAllWorkouts} style={styles(colors).sectionActionBtn}>
                        <Ionicons name="trash-outline" size={22} color="#FF3B30" />
                    </TouchableOpacity>
                </View>
            </View>

            {isExpanded && (
                <View style={{marginTop: 15}}>
                    {trainingData.workouts_list.map((workout, index) => (
                        <View key={workout.id} style={[styles(colors).card, {backgroundColor: colors.card, marginBottom: 15, padding: 15, borderRadius: 12}]}>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10}}>
                                <StyledText style={{fontSize: 16, fontWeight: '600', color: colors.text}}>
                                    {workout.workout_name}
                                </StyledText>
                                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                    <StyledText style={{fontSize: 12, color: colors.placeholderText, marginRight: 10}}>
                                        {workout.week_day === 'monday' ? t('monday') :
                                         workout.week_day === 'tuesday' ? t('tuesday') :
                                         workout.week_day === 'wednesday' ? t('wednesday') :
                                         workout.week_day === 'thursday' ? t('thursday') :
                                         workout.week_day === 'friday' ? t('friday') :
                                         workout.week_day === 'saturday' ? t('saturday') :
                                         workout.week_day === 'sunday' ? t('sunday') : workout.week_day}
                                    </StyledText>
                                    <TouchableOpacity 
                                        onPress={() => handleEditWorkout(workout)} 
                                        style={{marginRight: 8}}
                                        accessible={true}
                                        accessibilityLabel={t('editWorkout')}
                                        accessibilityRole="button"
                                    >
                                        <Ionicons name="pencil-outline" size={18} color={colors.primary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        onPress={() => handleDeleteWorkout(workout)}
                                        accessible={true}
                                        accessibilityLabel={t('deleteWorkout')}
                                        accessibilityRole="button"
                                    >
                                        <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View>
                                {workout.exercises_list.map((exercise, exerciseIndex) => (
                                    <View key={exerciseIndex} style={{marginBottom: 8, paddingLeft: 10}}>
                                        <StyledText style={{fontSize: 14, fontWeight: '500', color: colors.text}}>
                                            {exercise.exercise_name}
                                        </StyledText>
                                        <StyledText style={{fontSize: 12, color: colors.placeholderText}}>
                                            {exercise.sets} {t('series')} <StyledText style={{fontSize: 12, color: colors.placeholderText}}>•</StyledText> {exercise.min_reps}-{exercise.max_reps} {t('reps')}
                                        </StyledText>
                                        {exercise.observations && (
                                            <StyledText style={{fontSize: 11, color: colors.placeholderText, fontStyle: 'italic'}}>
                                                {t('observationsLabel')} {exercise.observations}
                                            </StyledText>
                                        )}
                                    </View>
                                ))}
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </View>
    )
}



export default function StudentDetailsScreen() {
    const { colors } = useTheme();
    const { t } = useLocalization();
    const router = useRouter();
    const params = useLocalSearchParams();
    const { studentId } = params;

    const [student, setStudent] = useState<StudentDetails | null>(null);
    const [diet, setDiet] = useState<DietData | null>(null);
    const [dietId, setDietId] = useState<number | null>(null);
    const [training, setTraining] = useState<TrainingData | null>(null);
    const [trainingId, setTrainingId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!studentId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);

        try {
            const studentPromise = apiService<StudentDetailsApiResponse>(`/team/student?student_id=${studentId}`, 'GET');
            const dietPromise = apiService<DietApiResponse>(`/user/diet/?student_id=${studentId}`, 'GET');
            const trainingPromise = apiService<TrainingApiResponse>(`/user/workout/?student_id=${studentId}`, 'GET');
            const [studentResponse, dietResponse, trainingResponse] = await Promise.all([studentPromise, dietPromise, trainingPromise]);

            if (studentResponse.status && studentResponse.student_dict) {
                setStudent(studentResponse.student_dict);
            } else {
                Alert.alert(t('error') || 'Error', t('failedToFetchStudentDetails') || 'Could not fetch student details.');
            }

            if (dietResponse.status && dietResponse.diet_dict) {
                try {
                    const parsedDiet = typeof dietResponse.diet_dict === 'string' 
                        ? JSON.parse(dietResponse.diet_dict) 
                        : dietResponse.diet_dict;
                    setDiet(parsedDiet);
                    if (dietResponse.diet_id) setDietId(dietResponse.diet_id);
                } catch (jsonError) {

                    setDiet(null); setDietId(null);
                }
            } else {
                setDiet(null); setDietId(null);
            }

            if (trainingResponse.status && trainingResponse.workouts_list) {
                try {
                    setTraining({ workouts_list: trainingResponse.workouts_list });
                    if (trainingResponse.workouts_list.length > 0) setTrainingId(trainingResponse.workouts_list[0].id);
                } catch (jsonError) {

                    setTraining(null); setTrainingId(null);
                }
            } else {
                setTraining(null); setTrainingId(null);
            }

        } catch (error) {

            Alert.alert(t('error') || 'Error', t('failedToFetchData') || 'Could not fetch student, diet or training details.');
        } finally {
            setIsLoading(false);
        }
    }, [studentId, t]);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const handleDeleteDiet = () => {
        Alert.alert(t('deleteDiet'), t('confirmDeleteDiet'), [
            { text: t('cancel'), style: "cancel" },
            {
                text: t('delete'), style: "destructive",
                onPress: async () => {
                    if (!dietId) return Alert.alert(t('error') || 'Error', t('cannotDeleteDietNoId'));
                    try {
                        await apiService('/user/diet', 'DELETE', { diet_id: dietId });
                        setDiet(null); setDietId(null);
                        Alert.alert(t('success'), t('dietDeletedSuccess'));
                    } catch (error) { Alert.alert(t('error'), t('failedToDeleteDiet')); }
                },
            },
        ]);
    };

    const handleDeleteTraining = () => {
        Alert.alert(t('deleteTraining'), t('confirmDeleteTraining'), [
            { text: t('cancel'), style: "cancel" },
            {
                text: t('delete'), style: "destructive",
                onPress: async () => {
                    if (!trainingId) return Alert.alert(t('error'), t('cannotDeleteTrainingNoId'));
                    try {
                        await apiService('/user/training', 'DELETE', { training_id: trainingId });
                        setTraining(null); setTrainingId(null);
                        Alert.alert(t('success'), t('trainingDeletedSuccess'));
                    } catch (error) { Alert.alert(t('error'), t('failedToDeleteTraining')); }
                },
            },
        ]);
    };


    if (isLoading) {
        return (
            <SafeAreaView style={[styles(colors).container, {justifyContent: 'center', alignItems: 'center'}]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    if (!student) {
        return (
            <SafeAreaView style={[styles(colors).container, {justifyContent: 'center', alignItems: 'center'}]}>
                <TouchableOpacity onPress={() => router.back()} style={styles(colors).backButtonAbsolute}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <StyledText style={{color: colors.text}}>{t('studentNotFound')}</StyledText>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles(colors).container}>
            <ScrollView 
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles(colors).header}>
                    <TouchableOpacity 
                        onPress={() => router.back()} 
                        style={styles(colors).backButton}
                        accessible={true}
                        accessibilityLabel={t('goBack')}
                        accessibilityRole="button"
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <StyledText type="title" style={{color: colors.text}}>
                        {student.first_name} {student.last_name}
                    </StyledText>
                </View>

                <View style={[styles(colors).detailsContainer, {backgroundColor: colors.card}]}>
                    <View style={styles(colors).detailItem}><StyledText style={[styles(colors).detailLabel, {color: colors.text}]}>{t('emailAddress')}:</StyledText><StyledText style={[styles(colors).detailValue, {color: colors.placeholderText}]}>{student.email}</StyledText></View>
                    <View style={styles(colors).detailItem}><StyledText style={[styles(colors).detailLabel, {color: colors.text}]}>{t('birthDate')}:</StyledText><StyledText style={[styles(colors).detailValue, {color: colors.placeholderText}]}>{student.birth_date}</StyledText></View>
                    <View style={styles(colors).detailItem}><StyledText style={[styles(colors).detailLabel, {color: colors.text}]}>{t('gender')}:</StyledText><StyledText style={[styles(colors).detailValue, {color: colors.placeholderText}]}>{student.gender}</StyledText></View>
                    <View style={styles(colors).detailItem}><StyledText style={[styles(colors).detailLabel, {color: colors.text}]}>{t('age')}:</StyledText><StyledText style={[styles(colors).detailValue, {color: colors.placeholderText}]}>{student.age}</StyledText></View>
                    <View style={styles(colors).detailItem}><StyledText style={[styles(colors).detailLabel, {color: colors.text}]}>{t('height')}:</StyledText><StyledText style={[styles(colors).detailValue, {color: colors.placeholderText}]}>{student.height} cm</StyledText></View>
                    <View style={[styles(colors).detailItem, {borderBottomWidth: 0}]}><StyledText style={[styles(colors).detailLabel, {color: colors.text}]}>{t('weight')}:</StyledText><StyledText style={[styles(colors).detailValue, {color: colors.placeholderText}]}>{student.weight} kg</StyledText></View>
                </View>

                {diet ? (
                    <DietDisplay
                        dietData={diet}
                        onEdit={() => router.push({ pathname: '/(teacher)/manage-diet', params: { studentId: studentId as string, existingDiet: JSON.stringify(diet), dietId: String(dietId) } })}
                        onDelete={handleDeleteDiet}
                    />
                ) : (
                    <View style={styles(colors).buttonContainer}>
                        <StyledButton
                            title={t('addDiet')}
                            onPress={() => router.push({ pathname: '/(teacher)/manage-diet', params: { studentId: studentId } })}
                            icon={<Ionicons name="add" size={20} color="white" />}
                        />
                    </View>
                )}

                {training && training.workouts_list && training.workouts_list.length > 0 ? (
                    <TrainingDisplay
                        trainingData={training}
                        onEdit={() => router.push({ pathname: '/(teacher)/manage-workout', params: { studentId: studentId as string }})}
                        onDelete={handleDeleteTraining}
                    />
                ) : (
                    <View style={styles(colors).buttonContainer}>
                        <StyledButton
                            title={t('addTraining')}
                            onPress={() => router.push({ pathname: '/(teacher)/manage-workout', params: { studentId: studentId } })}
                            icon={<Ionicons name="add" size={20} color="white" />}
                        />
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.appBackground },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
    backButton: { marginRight: 15 },
    backButtonAbsolute: { position: 'absolute', top: 40, left: 20, zIndex: 1 },
    detailsContainer: { borderRadius: 12, padding: 20, marginHorizontal: 20, marginTop: 10 },
    detailItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, paddingBottom: 15, marginBottom: 15, borderColor: colors.border },
    detailLabel: { fontWeight: 'bold', fontSize: 16 },
    detailValue: { fontSize: 16 },
    buttonContainer: { paddingHorizontal: 20, marginTop: 15, marginBottom: 15 },
    sectionContainer: { marginHorizontal: 20, marginTop: 20 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1 },
    sectionHeaderText: { marginLeft: 10, fontSize: 16, fontWeight: '600', flex: 1 },
    sectionActions: { flexDirection: 'row', alignItems: 'center' },
    sectionActionBtn: { paddingHorizontal: 8 },
    card: { borderRadius: 15, padding: 20, marginBottom: 20 },
    cardTitle: { textAlign: 'center', marginBottom: 15 },
    macrosContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' },
    macroPill: { borderRadius: 20, paddingVertical: 8, paddingHorizontal: 15, alignItems: 'center', margin: 5, minWidth: '40%' },
    macroLabel: { color: 'white', fontSize: 14, fontWeight: '500' },
    macroValue: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    mealCard: { borderRadius: 15, marginBottom: 15, borderWidth: 1 },
    mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
    mealName: { fontSize: 20, fontWeight: 'bold' },
    mealTime: { fontSize: 14, fontWeight: '500' },
    mealMacros: { alignItems: 'flex-end' },
    mealKcal: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    ingredientsContainer: { paddingTop: 10 },
    foodItem: { paddingHorizontal: 15, paddingBottom: 15, marginBottom: 10, borderBottomWidth: 1 },
    foodHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    foodName: { fontSize: 16, fontWeight: 'bold', flex: 1, flexWrap: 'wrap' },
    foodAmount: { fontSize: 14 },
    foodMacros: { flexDirection: 'row', justifyContent: 'flex-start', gap: 15 },
    foodMacroText: { fontSize: 13, fontWeight: '500' },
    optionsContainer: { marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderColor: colors.border },
    optionsTitle: { fontWeight: 'bold', marginBottom: 10, fontSize: 14 },
    substituteItem: { marginLeft: 15, marginBottom: 10 },
    exerciseInfoText: { fontSize: 12, color: colors.placeholderText, fontStyle: 'italic' },
});
