import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { StyledText } from '../../components/StyledText';
import { StyledButton } from '../../components/StyledButton';
import { Ionicons } from '@expo/vector-icons';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MenuScreen() {
    const { colors, toggleTheme, isDark } = useTheme();
    const { signOut, user } = useAuth();

    const insets = useSafeAreaInsets();

    const handleSignOut = async () => {
        await signOut();
    };

    return (

        <ScrollView
            style={[styles.container, { backgroundColor: colors.appBackground }]}
            contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 20 }}
        >
            <View style={styles.contentContainer}>
                <StyledText type="title" style={[styles.title, { color: colors.text }]}>
                    Menu
                </StyledText>

                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <View style={styles.profileSection}>
                        <View style={[styles.avatar, {backgroundColor: colors.primary}]}>
                            <StyledText style={styles.avatarText}>
                                {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
                            </StyledText>
                        </View>
                        <View>
                            <StyledText style={[styles.userName, { color: colors.text }]}>
                                {user?.firstName} {user?.lastName}
                            </StyledText>
                            <StyledText style={{ color: colors.placeholderText }}>
                                {user?.email}
                            </StyledText>
                        </View>
                    </View>

                    {/* Menu Items */}
                    <View>
                        <TouchableOpacity style={[styles.menuItem, { borderTopColor: colors.border }]}>
                            <Ionicons name="person-outline" size={24} color={colors.text} />
                            <StyledText style={[styles.menuItemText, { color: colors.text }]}>Account</StyledText>
                        </TouchableOpacity>

                        <View style={[styles.menuItem, { borderTopColor: colors.border }]}>
                            <Ionicons name="color-palette-outline" size={24} color={colors.text} />
                            <StyledText style={[styles.menuItemText, { color: colors.text }]}>
                                Theme
                            </StyledText>
                            <View style={[styles.themeSelectorContainer, { backgroundColor: colors.inputBackground }]}>
                                <TouchableOpacity onPress={!isDark ? () => {} : toggleTheme} style={[styles.themeButton, !isDark && { backgroundColor: colors.primary }]}>
                                    <Ionicons name="sunny-outline" size={22} color={!isDark ? 'white' : colors.text} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={isDark ? () => {} : toggleTheme} style={[styles.themeButton, isDark && { backgroundColor: colors.primary }]}>
                                    <Ionicons name="moon-outline" size={22} color={isDark ? 'white' : colors.text} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>

                <StyledButton
                    title="Sign Out"
                    onPress={handleSignOut}
                    variant='outlined'
                    color={colors.primary}
                    style={{marginTop: 30}}
                />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 20,
    },
    title: {
        textAlign: 'left',
        marginBottom: 20,
        fontSize: 32,
        fontWeight: 'bold',
    },
    card: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarText: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderTopWidth: 1,
    },
    menuItemText: {
        fontSize: 16,
        marginLeft: 15,
    },
    themeSelectorContainer: {
        flexDirection: 'row',
        marginLeft: 'auto',
        borderRadius: 10,
        padding: 2,
    },
    themeButton: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 8,
    }
});