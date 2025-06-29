import { useLocalization } from '@/contexts/LocalizationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useWorkoutForm } from '@/contexts/WorkoutFormContext';
import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import KeyboardAvoidingWrapper from '@/components/KeyboardAvoidingWrapper';
import { StyledButton } from '@/components/StyledButton';
import { StyledPicker } from '@/components/StyledPicker';
import { StyledText } from '@/components/StyledText';
import { StyledTextInput } from '@/components/StyledTextInput';
import apiService from '@/services/apiService';


interface MuscularGroup {
    id: number;
    name: string;
}

interface ExerciseType {
    id: number;
    name: string;
}

interface ExerciseEquipment {
    id: number;
    name: string;
}

interface MuscularGroupsResponse {
    status: boolean;
    muscular_groups: MuscularGroup[];
}

interface ExerciseTypesResponse {
    status: boolean;
    exercise_types: ExerciseType[];
}

interface ExerciseEquipmentsResponse {
    status: boolean;
    exercise_equipments: ExerciseEquipment[];
}


export default function AddNewExerciseScreen() {
    const { colors } = useTheme();
    const { t } = useLocalization();
    const router = useRouter();
    const { hasPreservedState, clearPreservedState, studentId } = useWorkoutForm();

    const [name, setName] = useState('');
    const [selectedMuscularGroup, setSelectedMuscularGroup] = useState<string>('');
    const [selectedExerciseType, setSelectedExerciseType] = useState<string>('');
    const [selectedEquipment, setSelectedEquipment] = useState<string>('');
    const [videoFile, setVideoFile] = useState<any>(null);
    const [photoFile, setPhotoFile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(true);

    const [muscularGroups, setMuscularGroups] = useState<MuscularGroup[]>([]);
    const [exerciseTypes, setExerciseTypes] = useState<ExerciseType[]>([]);
    const [exerciseEquipments, setExerciseEquipments] = useState<ExerciseEquipment[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setIsDataLoading(true);
            try {

                const muscularGroupsResponse = await apiService<MuscularGroupsResponse>('/exercise/muscular-groups', 'GET');
                if (muscularGroupsResponse.status && Array.isArray(muscularGroupsResponse.muscular_groups)) {
                    setMuscularGroups(muscularGroupsResponse.muscular_groups);
                }


                const exerciseTypesResponse = await apiService<ExerciseTypesResponse>('/exercise/types', 'GET');
                if (exerciseTypesResponse.status && Array.isArray(exerciseTypesResponse.exercise_types)) {
                    setExerciseTypes(exerciseTypesResponse.exercise_types);
                }


                const exerciseEquipmentsResponse = await apiService<ExerciseEquipmentsResponse>('/exercise/equipments', 'GET');
                if (exerciseEquipmentsResponse.status && Array.isArray(exerciseEquipmentsResponse.exercise_equipments)) {
                    setExerciseEquipments(exerciseEquipmentsResponse.exercise_equipments);
                }
            } catch (error) {

                Alert.alert(t('error'), t('failedToFetchData'));
            } finally {
                setIsDataLoading(false);
            }
        };

        fetchData();
    }, [t]);


    useEffect(() => {
        setName('');
        setSelectedMuscularGroup('');
        setSelectedExerciseType('');
        setSelectedEquipment('');
        setVideoFile(null);
        setPhotoFile(null);
    }, []);


    useEffect(() => {
        return () => {

            clearPreservedState();
            

            setName('');
            setSelectedMuscularGroup('');
            setSelectedExerciseType('');
            setSelectedEquipment('');
            setVideoFile(null);
            setPhotoFile(null);
        };
    }, []);

    const pickVideo = async () => {
        try {

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                setVideoFile(result.assets[0]);
            }
        } catch (error) {

            Alert.alert(t('error'), 'Falha ao selecionar arquivo de vídeo.');
        }
    };

    const pickPhoto = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                setPhotoFile(result.assets[0]);
            }
        } catch (error) {

            Alert.alert(t('error'), 'Falha ao selecionar foto.');
        }
    };

    const removeVideo = () => {
        setVideoFile(null);
    };

    const removePhoto = () => {
        setPhotoFile(null);
    };

    const handleSaveExercise = async () => {
        if (!name.trim()) {
            Alert.alert(t('error'), 'Nome do exercício é obrigatório.');
            return;
        }

        if (!selectedMuscularGroup) {
            Alert.alert(t('error'), 'Grupo muscular é obrigatório.');
            return;
        }

        if (!selectedExerciseType) {
            Alert.alert(t('error'), 'Tipo de exercício é obrigatório.');
            return;
        }

        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append('name', name.trim());
            formData.append('muscular_group_id', selectedMuscularGroup);
            formData.append('exercise_type_id', selectedExerciseType);
            
            if (selectedEquipment) {
                formData.append('exercise_equipment_id', selectedEquipment);
            }


            if (videoFile) {
                if (Platform.OS === 'web') {
                    const response = await fetch(videoFile.uri);
                    const blob = await response.blob();
                    formData.append('exercise_video', new File([blob], 'video.mp4', { type: 'video/mp4' }));
                } else {
                    formData.append('exercise_video', {
                        uri: Platform.OS === 'android' ? videoFile.uri : videoFile.uri.replace('file://', ''),
                        name: 'video.mp4',
                        type: 'video/mp4',
                    } as any);
                }
            }


            if (photoFile) {
                if (Platform.OS === 'web') {
                    const response = await fetch(photoFile.uri);
                    const blob = await response.blob();
                    formData.append('exercise_photo', new File([blob], 'photo.jpg', { type: 'image/jpeg' }));
                } else {
                    formData.append('exercise_photo', {
                        uri: Platform.OS === 'android' ? photoFile.uri : photoFile.uri.replace('file://', ''),
                        name: 'photo.jpg',
                        type: 'image/jpeg',
                    } as any);
                }
            }

            const response = await apiService('/exercise/', 'POST', formData, true);
            
            if (response && typeof response === 'object' && 'status' in response && response.status) {

                if (hasPreservedState) {

                    if (studentId) {
                        router.push(`/(teacher)/manage-workout?studentId=${studentId}`);
                    } else {
                        router.push('/(teacher)/manage-workout');
                    }
                } else {

                    router.push('/(teacher)/dashboard');
                }
            } else {
                throw new Error('Falha ao salvar exercício.');
            }
        } catch (error: any) {
            const errorMessage = error?.data?.message || error.message || 'Erro inesperado ocorreu.';
            Alert.alert(t('error'), errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const muscularGroupOptions = muscularGroups.map(group => ({
        label: group.name,
        value: String(group.id)
    }));

    const exerciseTypeOptions = exerciseTypes.map(type => ({
        label: type.name,
        value: String(type.id)
    }));

    const equipmentOptions = exerciseEquipments.map(equipment => ({
        label: equipment.name,
        value: String(equipment.id)
    }));

    if (isDataLoading) {
        return (
            <SafeAreaView style={{flex: 1, backgroundColor: colors.appBackground, justifyContent: 'center', alignItems: 'center'}}>
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{flex: 1, backgroundColor: colors.appBackground}}>
            <KeyboardAvoidingWrapper>
                <ScrollView contentContainerStyle={styles.container}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                        <TouchableOpacity 
                            onPress={() => {

                                clearPreservedState();
                                setName('');
                                setSelectedMuscularGroup('');
                                setSelectedExerciseType('');
                                setSelectedEquipment('');
                                setVideoFile(null);
                                setPhotoFile(null);
                                router.back();
                            }} 
                            style={{ marginRight: 10 }}
                        >
                            <Ionicons name="arrow-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <StyledText type="title" style={{ color: colors.text }}>{t('addNewExercise')}</StyledText>
                    </View>

                    <View style={[styles.formContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <StyledText type="subtitle" style={{ color: colors.text, textAlign: 'center', marginBottom: 20 }}>{t('exerciseDetails')}</StyledText>

                        <StyledTextInput
                            label={t('exerciseName')}
                            value={name}
                            onChangeText={setName}
                            placeholder={t('exerciseNamePlaceholder')}
                        />

                        <StyledPicker
                            label={t('muscularGroup')}
                            items={muscularGroupOptions}
                            selectedValue={selectedMuscularGroup}
                            onValueChange={(value) => setSelectedMuscularGroup(String(value))}
                            placeholder={t('selectMuscularGroup')}
                        />

                        <StyledPicker
                            label={t('exerciseType')}
                            items={exerciseTypeOptions}
                            selectedValue={selectedExerciseType}
                            onValueChange={(value) => setSelectedExerciseType(String(value))}
                            placeholder={t('selectExerciseType')}
                        />

                        <StyledPicker
                            label={t('exerciseEquipment')}
                            items={equipmentOptions}
                            selectedValue={selectedEquipment}
                            onValueChange={(value) => setSelectedEquipment(String(value))}
                            placeholder={t('selectEquipment')}
                        />

                        <View style={styles.fileSection}>
                            <StyledText style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 10 }}>
                                {t('video')} (Opcional)
                            </StyledText>
                            
                            {videoFile ? (
                                <View style={[styles.previewContainer, { borderColor: colors.border }]}>
                                    <Video
                                        source={{ uri: videoFile.uri }}
                                        style={styles.videoPreview}
                                        useNativeControls
                                        resizeMode={ResizeMode.CONTAIN}
                                        isLooping={false}
                                    />
                                    <View style={styles.previewActions}>
                                        <TouchableOpacity 
                                            style={[styles.actionButton, { backgroundColor: colors.primary }]}
                                            onPress={pickVideo}
                                        >
                                            <Ionicons name="refresh" size={20} color="white" />
                                            <Text style={styles.actionButtonText}>Trocar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={[styles.actionButton, { backgroundColor: '#ff4444' }]}
                                            onPress={removeVideo}
                                        >
                                            <Ionicons name="trash" size={20} color="white" />
                                            <Text style={styles.actionButtonText}>Remover</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity 
                                    style={[styles.fileButton, { borderColor: colors.border, backgroundColor: colors.inputBackground }]} 
                                    onPress={pickVideo}
                                >
                                    <Ionicons name="videocam-outline" size={24} color={colors.primary} />
                                    <Text style={[styles.fileButtonText, { color: colors.text }]}>
                                        Selecionar Arquivo de Vídeo
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={styles.fileSection}>
                            <StyledText style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 10 }}>
                                {t('photo')} (Opcional)
                            </StyledText>
                            
                            {photoFile ? (
                                <View style={[styles.previewContainer, { borderColor: colors.border }]}>
                                    <Image
                                        source={{ uri: photoFile.uri }}
                                        style={styles.imagePreview}
                                        resizeMode="cover"
                                    />
                                    <View style={styles.previewActions}>
                                        <TouchableOpacity 
                                            style={[styles.actionButton, { backgroundColor: colors.primary }]}
                                            onPress={pickPhoto}
                                        >
                                            <Ionicons name="refresh" size={20} color="white" />
                                            <Text style={styles.actionButtonText}>Trocar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={[styles.actionButton, { backgroundColor: '#ff4444' }]}
                                            onPress={removePhoto}
                                        >
                                            <Ionicons name="trash" size={20} color="white" />
                                            <Text style={styles.actionButtonText}>Remover</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity 
                                    style={[styles.fileButton, { borderColor: colors.border, backgroundColor: colors.inputBackground }]} 
                                    onPress={pickPhoto}
                                >
                                    <Ionicons name="camera-outline" size={24} color={colors.primary} />
                                    <Text style={[styles.fileButtonText, { color: colors.text }]}>
                                        Selecionar Foto
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <StyledButton 
                        title={t('saveExercise')} 
                        onPress={handleSaveExercise} 
                        loading={isLoading} 
                        disabled={isLoading} 
                        style={{ marginTop: 20 }} 
                    />
                </ScrollView>
            </KeyboardAvoidingWrapper>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { 
        paddingHorizontal: 20, 
        paddingBottom: 40 
    },
    formContainer: { 
        marginTop: 15, 
        padding: 20, 
        borderRadius: 15, 
        borderWidth: 1 
    },
    fileSection: {
        marginTop: 20,
    },
    fileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    fileButtonText: {
        marginLeft: 10,
        fontSize: 16,
        flex: 1,
    },
    previewContainer: {
        borderWidth: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    videoPreview: {
        width: '100%',
        height: 200,
        backgroundColor: '#000',
    },
    imagePreview: {
        width: '100%',
        height: 200,
        backgroundColor: '#f0f0f0',
    },
    previewActions: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
        marginRight: 10,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 5,
    },
}); 