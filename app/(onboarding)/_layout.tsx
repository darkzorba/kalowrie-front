import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useLocalization } from '../../contexts/LocalizationContext';

export default function OnboardingLayout() {
    const { colors, toggleTheme, isDark } = useTheme();
    const { signOut } = useAuth();
    const router = useRouter();
    const { t } = useLocalization();

    const handleSignOut = async () => {
        await signOut();
        router.replace('/(auth)/login');
    };

    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: colors.headerBackground },
                headerTintColor: colors.headerText,
                headerTitleStyle: { fontWeight: 'bold' },
                headerRight: () => (
                    <View style={styles.headerRightContainer}>
                        <TouchableOpacity onPress={toggleTheme} style={styles.themeToggleButton}>
                            <Ionicons
                                name={isDark ? 'sunny-outline' : 'moon-outline'}
                                size={26}
                                color={colors.icon}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
                            <Ionicons name="log-out-outline" size={28} color={colors.icon} />
                        </TouchableOpacity>
                    </View>
                ),
            }}
        >
            <Stack.Screen name="user-details" options={{ title: t('tellUsAboutYourself') }} />
            <Stack.Screen name="dietary-preferences" options={{ title: t('yourGoals') }} />
            <Stack.Screen name="generating-diet" options={{ headerShown: false }} />
            <Stack.Screen name="view-diet" options={{ title: t('yourPersonalizedDiet') }} />
        </Stack>
    );
}

const styles = StyleSheet.create({
    headerRightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 15,
    },
    themeToggleButton: {
        padding: 5,
        marginRight: 15,
    },
    signOutButton: {
        padding: 5,
    }
});
