import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export default function AppTabLayout() {
    const { colors } = useTheme();
    const router = useRouter();
    const [isActionSheetVisible, setActionSheetVisible] = useState(false);

    const actionOptions = [
        {
            label: 'Adicionar Refeição',
            icon: 'restaurant-outline' as const,
            onPress: () => router.push('/add-meal-simple')
        },
        {
            label: 'Rastrear por Descrição',
            icon: 'document-text-outline' as const,
            onPress: () => router.push('/track-by-description')
        },
        {
            label: 'Rastrear por Foto',
            icon: 'camera-outline' as const,
            onPress: () => router.push('/track-by-photo')
        },
        {
            label: 'Adicionar Água',
            icon: 'water-outline' as const,
            onPress: () => router.push('/add-meal-simple') // TODO: Implementar tela de água
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
                        height: 70,
                        paddingTop: 8,
                        paddingBottom: 12,
                        paddingHorizontal: 10,
                        elevation: 8,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: -2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                    },
                    tabBarLabelStyle: {
                        fontWeight: '600',
                        fontSize: 12,
                        marginTop: 4,
                    },
                }}
            >
                <Tabs.Screen
                    name="home"
                    options={{
                        title: 'Início',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="home-outline" size={size} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="diet"
                    options={{
                        title: 'Dieta',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="restaurant-outline" size={size} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="workout"
                    options={{
                        title: 'Treino',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="fitness-outline" size={size} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="menu"
                    options={{
                        title: 'Perfil',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="person-outline" size={size} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="add-meal-simple"
                    options={{
                        href: null
                    }}/>
                <Tabs.Screen
                    name="track-by-description"
                    options={{
                        href: null
                    }}/>
                <Tabs.Screen
                    name="track-by-photo"
                    options={{
                        href: null
                    }}
                />
                <Tabs.Screen
                    name="active-workout"
                    options={{
                        href: null
                    }}
                />
            </Tabs>


            <TouchableOpacity
                style={[styles.fab, { backgroundColor: colors.primary }]}
                onPress={() => setActionSheetVisible(true)}
                activeOpacity={0.8}
            >
                <Ionicons name="add" size={28} color="#FFFFFF" />
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={isActionSheetVisible}
                onRequestClose={() => setActionSheetVisible(false)}
            >
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setActionSheetVisible(false)}>
                    <SafeAreaView style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Adicionar</Text>
                            <TouchableOpacity onPress={() => setActionSheetVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.optionsGrid}>
                            {actionOptions.map((option, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.optionCard, { backgroundColor: colors.inputBackground }]}
                                    onPress={() => {
                                        setActionSheetVisible(false);
                                        option.onPress();
                                    }}
                                >
                                    <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                                        <Ionicons name={option.icon} size={24} color={colors.primary} />
                                    </View>
                                    <Text style={[styles.optionLabel, { color: colors.text }]}>{option.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </SafeAreaView>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        bottom: 90,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        paddingBottom: 40,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 20,
        paddingTop: 20,
        justifyContent: 'space-between',
    },
    optionCard: {
        width: '48%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    optionLabel: {
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
});
