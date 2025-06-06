import React, { useEffect } from 'react';
import { SplashScreen, Stack, useRouter } from 'expo-router';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

SplashScreen.preventAutoHideAsync();

const InitialLayout = () => {
    const { initialLoading, user, isOnboarded } = useAuth();
    const { colors, isDark } = useTheme();
    const router = useRouter();

    useEffect(() => {
        if (initialLoading) {
            return; // Wait until the auth state is loaded
        }

        if (!user) {
            // If the user is not signed in, redirect to the login screen.
            router.replace('/(auth)/login');
        } else if (user && !isOnboarded) {
            // If the user is signed in but not onboarded (is_first_access: true),
            // redirect to the onboarding flow.
            router.replace('/(onboarding)/user-details');
        } else if (user && isOnboarded) {
            // If the user is signed in and onboarded, redirect to the main app.
            router.replace('/(app)/home');
        }
    }, [user, isOnboarded, initialLoading]);

    useEffect(() => {
        if (!initialLoading) {
            SplashScreen.hideAsync();
        }
    }, [initialLoading]);

    // While the useEffect is determining the route, we can show a loader
    // or just let the native splash screen stay visible.
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
            <Stack screenOptions={{ headerShown: false }}>
                {/* The screens are defined here, but the useEffect will navigate to the correct one. */}
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(onboarding)" />
                <Stack.Screen name="(app)" />
            </Stack>
        </>
    );
};

const RootLayoutNav = () => {
    return (
        <ThemeProvider>
            <AuthProvider>
                <InitialLayout />
            </AuthProvider>
        </ThemeProvider>
    );
};

const styles = StyleSheet.create({
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default RootLayoutNav;
