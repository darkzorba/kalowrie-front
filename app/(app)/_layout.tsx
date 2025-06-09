import React, { useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { View, StyleSheet, Modal, SafeAreaView, TouchableOpacity, Text } from 'react-native';

export default function AppTabLayout() {
    const { colors } = useTheme();
    const router = useRouter();
    const [isActionSheetVisible, setActionSheetVisible] = useState(false);

    const actionOptions = [
        {
            label: 'Add Meal',
            icon: 'restaurant-outline' as const,
            onPress: () => router.push('/(app)/add-meal')
        },
        {
            label: 'Track By Photo',
            icon: 'camera-outline' as const,
            onPress: () => router.push('/(app)/track-by-photo')
        }
    ];

    return (
        <View style={{ flex: 1 }}>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: colors.primary,
                    tabBarInactiveTintColor: colors.placeholderText,
                    tabBarStyle: {
                        backgroundColor: colors.card,
                        borderTopColor: colors.border,
                        height: 65,
                        paddingTop: 5,
                        paddingBottom: 5,
                    },
                    tabBarLabelStyle: {
                        fontWeight: '600',
                        fontSize: 11,
                    },
                }}
            >
                <Tabs.Screen
                    name="home"
                    options={{
                        title: 'Dashboard',
                        href: '/(app)/home',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="stats-chart" size={size} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="diet"
                    options={{
                        title: 'My Diet',
                        href: '/(app)/diet',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="restaurant" size={size} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="add-placeholder"
                    listeners={{
                        tabPress: (e) => {
                            e.preventDefault();
                            setActionSheetVisible(true);
                        },
                    }}
                    options={{
                        title: 'Add',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="add-circle" size={size} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="menu"
                    options={{
                        title: 'Menu',
                        href: '/(app)/menu',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="menu" size={size} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen name="add-meal" options={{ href: null }} />
                <Tabs.Screen name="track-by-photo" options={{ href: null }} />
            </Tabs>

            <Modal
                animationType="fade"
                transparent={true}
                visible={isActionSheetVisible}
                onRequestClose={() => setActionSheetVisible(false)}
            >
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setActionSheetVisible(false)}>
                    <SafeAreaView style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        {actionOptions.map((option, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.optionButton,
                                    index < actionOptions.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }
                                ]}
                                onPress={() => {
                                    setActionSheetVisible(false);
                                    option.onPress();
                                }}
                            >
                                <Ionicons name={option.icon} size={24} color={colors.text} />
                                <Text style={[styles.optionLabel, { color: colors.text }]}>{option.label}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            style={[styles.cancelButton, { backgroundColor: colors.inputBackground }]}
                            onPress={() => setActionSheetVisible(false)}
                        >
                            <Text style={[styles.cancelLabel, { color: colors.text }]}>Cancel</Text>
                        </TouchableOpacity>
                    </SafeAreaView>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        marginHorizontal: 10,
        marginBottom: 20,
        borderRadius: 15,
        overflow: 'hidden',
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
    },
    optionLabel: {
        fontSize: 18,
        marginLeft: 15,
    },
    cancelButton: {
        marginTop: 10,
        padding: 20,
        alignItems: 'center',
    },
    cancelLabel: {
        fontSize: 18,
        fontWeight: '600',
    }
});
