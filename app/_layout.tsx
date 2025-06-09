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
            return;
        }

        if (!user) {

            router.replace('/(auth)/login');
        } else if (user && !isOnboarded) {


            router.replace('/(onboarding)/user-details');
        } else if (user && isOnboarded) {

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
