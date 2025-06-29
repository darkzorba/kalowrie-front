import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TeacherTabLayout() {
    const { colors } = useTheme();

    return (
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
                name="dashboard"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="apps-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="manage-students"
                options={{
                    title: 'Students',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="people-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="add-student"
                options={{
                    href: null
                }}
            />
            <Tabs.Screen
                name="add-new-food"
                options={{
                    href: null
                }}
            />
            <Tabs.Screen
                name="student-details"
                options={{
                    href: null
                }}
            />
            <Tabs.Screen
                name="manage-diet"
                options={{
                    href: null
                }}
            />
            <Tabs.Screen
                name="manage-workout"
                options={{
                    href: null
                }}
            />
        </Tabs>
    );
}
