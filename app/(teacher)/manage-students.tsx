import { StyledButton } from '@/components/StyledButton';
import { StyledText } from '@/components/StyledText';
import { useLocalization } from '@/contexts/LocalizationContext';
import { useTheme } from '@/contexts/ThemeContext';
import apiService from '@/services/apiService';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Student {
    id: string;
    student_name: string;
}

interface StudentsApiResponse {
    status: boolean;
    students_list: Student[];
}

export default function ManageStudentsScreen() {
    const { colors } = useTheme();
    const { t } = useLocalization();
    const router = useRouter();

    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchStudents = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await apiService<StudentsApiResponse>('/team/students/all', 'GET');
            if (response.status && Array.isArray(response.students_list)) {
                setStudents(response.students_list);
            } else {
                Alert.alert(t('error'), t('failedToFetchStudents'));
            }
        } catch (error) {

            Alert.alert(t('error'), t('failedToFetchStudents'));
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    useFocusEffect(
        useCallback(() => {
            fetchStudents();
        }, [fetchStudents])
    );

    const renderStudent = ({ item }: { item: Student }) => (
        <TouchableOpacity
            style={[styles.studentItem, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
            onPress={() => router.push({ pathname: '/(teacher)/student-details', params: { studentId: item.id } })}
        >
            <Text style={{color: colors.text, fontSize: 16}}>{item.student_name}</Text>
            <Ionicons name="chevron-forward" size={22} color={colors.placeholderText} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.appBackground }]}>
            <StyledText type="title" style={[styles.title, { color: colors.text }]}>
                {t('manageStudents')}
            </StyledText>

            <View style={styles.buttonContainer}>
                <StyledButton
                    title={t('addStudent')}
                    onPress={() => router.push('/(teacher)/add-student')}
                    style={{flex: 1, marginRight: 10}}
                    icon={<Ionicons name="add-outline" size={20} color="white" />}
                />
                <StyledButton
                    title={t('deleteStudent')}
                    onPress={() => {}}
                    style={{flex: 1}}
                    variant="outlined"
                    color={colors.error}
                    icon={<Ionicons name="trash-outline" size={20} color={colors.error} />}
                />
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }}/>
            ) : (
                <FlatList
                    data={students}
                    renderItem={renderStudent}
                    keyExtractor={item => item.id.toString()}
                    style={styles.list}
                    ListHeaderComponent={<StyledText style={[styles.listHeader, {color: colors.text}]}>{t('studentList')}</StyledText>}
                    ListEmptyComponent={<StyledText style={{textAlign: 'center', marginTop: 20, color: colors.placeholderText}}>{t('noStudentsFound')}</StyledText>}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    title: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
        textAlign: 'left',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    list: {
        paddingHorizontal: 20,
    },
    listHeader: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
    },
    studentItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        borderBottomWidth: 1,
    }
});
