import { MinimizedWorkoutTab } from '@/components/MinimizedWorkoutTab';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LocalizationProvider } from '@/contexts/LocalizationContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { WorkoutFormProvider } from '@/contexts/WorkoutFormContext';
import { SplashScreen, Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

SplashScreen.preventAutoHideAsync();

const InitialLayout = () => {
    const { initialLoading, user, isOnboarded } = useAuth();
    const { colors, isDark } = useTheme();
    const router = useRouter();

    useEffect(() => {
        if (initialLoading) return;

        if (!user) {
            router.replace('/(auth)/login');
        } else if (user.userType === 'teacher') {
            router.replace('/(teacher)/dashboard');
        } else if (user.userType === 'student' && !isOnboarded) {
            router.replace('/(onboarding)/user-details');
        } else {
            router.replace('/(app)/home');
        }
    }, [user, isOnboarded, initialLoading]);

    useEffect(() => {
        if (!initialLoading) {
            SplashScreen.hideAsync();
        }
    }, [initialLoading]);

    if (initialLoading) {
        return (
            <View style={[styles.loaderContainer, { backgroundColor: colors.appBackground }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <Stack>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
                <Stack.Screen name="(app)" options={{ headerShown: false }} />
                <Stack.Screen name="(teacher)" options={{ headerShown: false }} />
            </Stack>
            <MinimizedWorkoutTab />
        </>
    );
};

export default function RootLayoutNav() {
    return (
        <LocalizationProvider>
            <ThemeProvider>
                <AuthProvider>
                    <WorkoutFormProvider>
                        <InitialLayout />
                    </WorkoutFormProvider>
                </AuthProvider>
            </ThemeProvider>
        </LocalizationProvider>
    );
}

const styles = StyleSheet.create({
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
