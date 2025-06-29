import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyledButton } from '../../components/StyledButton';
import { StyledText } from '../../components/StyledText';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function ProfileScreen() {
    const { colors, toggleTheme, isDark } = useTheme();
    const { signOut, user } = useAuth();
    const insets = useSafeAreaInsets();

    const handleSignOut = async () => {
        await signOut();
    };

    const profileOptions = [
        {
            icon: 'person-outline',
            title: 'Dados Pessoais',
            subtitle: 'Editar informações do perfil',
            onPress: () => {}
        },
        {
            icon: 'fitness-outline',
            title: 'Progresso',
            subtitle: 'Histórico de peso e medidas',
            onPress: () => {}
        },
        {
            icon: 'trending-up-outline',
            title: 'Gráficos',
            subtitle: 'Visualizar progresso',
            onPress: () => {}
        },
        {
            icon: 'people-outline',
            title: 'Personal Trainer',
            subtitle: 'Gerenciar conexão',
            onPress: () => {}
        }
    ];

    const settingsOptions = [
        {
            icon: 'notifications-outline',
            title: 'Notificações',
            subtitle: 'Configurar lembretes',
            onPress: () => {}
        },
        {
            icon: 'shield-outline',
            title: 'Privacidade',
            subtitle: 'Configurações de segurança',
            onPress: () => {}
        },
        {
            icon: 'help-circle-outline',
            title: 'Ajuda',
            subtitle: 'FAQ e suporte',
            onPress: () => {}
        }
    ];

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.appBackground }]}
            contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 20 }}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.contentContainer}>
                <StyledText type="title" style={[styles.title, { color: colors.text }]}>
                    Perfil
                </StyledText>


                <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
                    <View style={styles.profileSection}>
                        <View style={[styles.avatar, {backgroundColor: colors.primary}]}>
                            <StyledText style={styles.avatarText}>
                                {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
                            </StyledText>
                        </View>
                        <View style={styles.profileInfo}>
                            <StyledText style={[styles.userName, { color: colors.text }]}>
                                {user?.firstName} {user?.lastName}
                            </StyledText>
                            <StyledText style={[styles.userEmail, { color: colors.placeholderText }]}>
                                {user?.email}
                            </StyledText>
                        </View>
                    </View>
                </View>


                <View style={styles.section}>
                    <StyledText style={[styles.sectionTitle, { color: colors.text }]}>
                        Conta
                    </StyledText>
                    <View style={[styles.optionsCard, { backgroundColor: colors.card }]}>
                        {profileOptions.map((option, index) => (
                            <TouchableOpacity 
                                key={index}
                                style={[
                                    styles.optionItem,
                                    index < profileOptions.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }
                                ]}
                                onPress={option.onPress}
                            >
                                <View style={[styles.optionIcon, { backgroundColor: colors.primary + '20' }]}>
                                    <Ionicons name={option.icon as any} size={20} color={colors.primary} />
                                </View>
                                <View style={styles.optionContent}>
                                    <StyledText style={[styles.optionTitle, { color: colors.text }]}>
                                        {option.title}
                                    </StyledText>
                                    <StyledText style={[styles.optionSubtitle, { color: colors.placeholderText }]}>
                                        {option.subtitle}
                                    </StyledText>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={colors.placeholderText} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>


                <View style={styles.section}>
                    <StyledText style={[styles.sectionTitle, { color: colors.text }]}>
                        Configurações
                    </StyledText>
                    <View style={[styles.optionsCard, { backgroundColor: colors.card }]}>
                        {settingsOptions.map((option, index) => (
                            <TouchableOpacity 
                                key={index}
                                style={[
                                    styles.optionItem,
                                    index < settingsOptions.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }
                                ]}
                                onPress={option.onPress}
                            >
                                <View style={[styles.optionIcon, { backgroundColor: colors.primary + '20' }]}>
                                    <Ionicons name={option.icon as any} size={20} color={colors.primary} />
                                </View>
                                <View style={styles.optionContent}>
                                    <StyledText style={[styles.optionTitle, { color: colors.text }]}>
                                        {option.title}
                                    </StyledText>
                                    <StyledText style={[styles.optionSubtitle, { color: colors.placeholderText }]}>
                                        {option.subtitle}
                                    </StyledText>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={colors.placeholderText} />
                            </TouchableOpacity>
                        ))}
                        

                        <View style={[styles.optionItem, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                            <View style={[styles.optionIcon, { backgroundColor: colors.primary + '20' }]}>
                                <Ionicons name="color-palette-outline" size={20} color={colors.primary} />
                            </View>
                            <View style={styles.optionContent}>
                                <StyledText style={[styles.optionTitle, { color: colors.text }]}>
                                    Tema
                                </StyledText>
                                <StyledText style={[styles.optionSubtitle, { color: colors.placeholderText }]}>
                                    {isDark ? 'Modo escuro' : 'Modo claro'}
                                </StyledText>
                            </View>
                            <View style={[styles.themeSelectorContainer, { backgroundColor: colors.inputBackground }]}>
                                <TouchableOpacity 
                                    onPress={!isDark ? () => {} : toggleTheme} 
                                    style={[styles.themeButton, !isDark && { backgroundColor: colors.primary }]}
                                >
                                    <Ionicons name="sunny-outline" size={18} color={!isDark ? 'white' : colors.text} />
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={isDark ? () => {} : toggleTheme} 
                                    style={[styles.themeButton, isDark && { backgroundColor: colors.primary }]}
                                >
                                    <Ionicons name="moon-outline" size={18} color={isDark ? 'white' : colors.text} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>


                <StyledButton
                    title="Sair da Conta"
                    onPress={handleSignOut}
                    variant='outlined'
                    color={colors.primary}
                    style={styles.signOutButton}
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
        marginBottom: 24,
        fontSize: 32,
        fontWeight: '700',
    },
    profileCard: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    profileInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    optionsCard: {
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    optionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    optionContent: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    optionSubtitle: {
        fontSize: 14,
    },
    themeSelectorContainer: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 2,
    },
    themeButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 10,
    },
    signOutButton: {
        marginTop: 8,
    }
});