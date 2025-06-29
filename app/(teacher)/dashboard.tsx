import { StyledButton } from '@/components/StyledButton';
import { StyledText } from '@/components/StyledText';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalization } from '@/contexts/LocalizationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function TeacherDashboard() {
    const { colors } = useTheme();
    const { t } = useLocalization();
    const { signOut, user } = useAuth();
    const router = useRouter();

    return (
        <View style={[styles.container, { backgroundColor: colors.appBackground }]}>
            <StyledText type="title" style={{color: colors.text}}>
                {t('welcomeTeacher')}
            </StyledText>
            <StyledText style={{color: colors.text, marginTop: 10, textAlign: 'center', marginBottom: 30}}>
                {t('teacherDashboardDescription')}
            </StyledText>
            
            <View style={styles.buttonContainer}>
                <StyledButton 
                    title={t('manageStudents')} 
                    onPress={() => router.push('/(teacher)/manage-students')} 
                    style={{marginBottom: 15}}
                />
                <StyledButton 
                    title={t('manageDiet')} 
                    onPress={() => router.push('/(teacher)/manage-students')} 
                    style={{marginBottom: 15}}
                />
                <StyledButton 
                    title={t('manageWorkout')} 
                    onPress={() => router.push('/(teacher)/manage-students')} 
                    style={{marginBottom: 30}}
                />
            </View>
            
            <StyledButton title={t('logout')} onPress={signOut} style={{marginTop: 30}}/>
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
    buttonContainer: {
        width: '100%',
        maxWidth: 300,
    }
});
