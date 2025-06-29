import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Text } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLocalization } from '../../contexts/LocalizationContext';
import { StyledTextInput } from '../../components/StyledTextInput';
import { StyledButton } from '../../components/StyledButton';
import { StyledText } from '../../components/StyledText';
import { GlobalStyles } from '../../constants/GlobalStyles';
import KeyboardAvoidingWrapper from '../../components/KeyboardAvoidingWrapper';

const actualLogo = require('../../assets/images/logo_new.png');

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [userType, setUserType] = useState<'student' | 'teacher'>('student');
    const [error, setError] = useState('');

    const { signIn, isLoading } = useAuth();
    const { colors } = useTheme();
    const { t, setLanguage, language } = useLocalization();

    const handleLogin = async () => {
        setError('');
        if (!email || !password) {
            setError(t('fillAllFields'));
            return;
        }
        try {
            await signIn(email, password, userType);
        } catch (e: any) {
            setError(e.message || 'Failed to login. Please try again.');
        }
    };

    return (
        <KeyboardAvoidingWrapper style={{backgroundColor: colors.appBackground}}>
            <View style={[GlobalStyles.container, styles.container, { backgroundColor: colors.appBackground }]}>

                <View style={[styles.langSelector, { backgroundColor: colors.inputBackground }]}>
                    <TouchableOpacity onPress={() => setLanguage('en')} style={[styles.langButton, language === 'en' && {backgroundColor: colors.primary}]}>
                        <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>EN</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setLanguage('pt-BR')} style={[styles.langButton, language === 'pt-BR' && {backgroundColor: colors.primary}]}>
                        <Text style={[styles.langText, language === 'pt-BR' && styles.langTextActive]}>PT</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.logoContainer}>
                    <Image source={actualLogo} style={styles.logo} resizeMode="contain" />
                    <StyledText style={[styles.logoText, { color: colors.text }]}>KaLowRie</StyledText>
                </View>

                <View style={[styles.roleSelector, {backgroundColor: colors.inputBackground}]}>
                    <TouchableOpacity
                        style={[styles.roleButton, userType === 'student' && {backgroundColor: colors.primary}]}
                        onPress={() => setUserType('student')}
                    >
                        <Text style={[styles.roleText, userType === 'student' ? styles.roleTextActive : {color: colors.text}]}>{t('student')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.roleButton, userType === 'teacher' && {backgroundColor: colors.primary}]}
                        onPress={() => setUserType('teacher')}
                    >
                        <Text style={[styles.roleText, userType === 'teacher' ? styles.roleTextActive : {color: colors.text}]}>{t('teacher')}</Text>
                    </TouchableOpacity>
                </View>

                <StyledText type="subtitle" style={[styles.subtitle, { color: colors.text }]}>
                    {t('signInToContinue')}
                </StyledText>

                <View style={GlobalStyles.form}>
                    <StyledTextInput
                        label={t('emailAddress')}
                        placeholder={t('emailPlaceholder')}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <StyledTextInput
                        label={t('password')}
                        placeholder={t('passwordPlaceholder')}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    {error ? <StyledText type="error" style={GlobalStyles.errorText}>{error}</StyledText> : null}

                    <StyledButton
                        title={t('login')}
                        onPress={handleLogin}
                        loading={isLoading}
                        disabled={isLoading}
                        style={styles.actionButton}
                    />

                    <Link href="/(auth)/register" asChild>
                        <TouchableOpacity>
                            <StyledText type="link" style={[GlobalStyles.linkText, {color: colors.primary}]}>
                                {t('noAccount')}
                            </StyledText>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </KeyboardAvoidingWrapper>
    );
}

const styles = StyleSheet.create({
    container: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, },
    langSelector: { position: 'absolute', top: 60, right: 20, flexDirection: 'row', borderRadius: 20, padding: 4, },
    langButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, },
    langText: { fontSize: 14, fontWeight: 'bold', },
    langTextActive: { color: '#FFF', },
    logoContainer: { alignItems: 'center', marginBottom: 25, },
    logo: { width: 130, height: 130, },
    logoText: { fontSize: 28, fontWeight: 'bold', marginTop: 8, },
    roleSelector: { flexDirection: 'row', borderRadius: 20, padding: 5, marginBottom: 20, width: '100%', maxWidth: 300 },
    roleButton: { flex: 1, paddingVertical: 10, borderRadius: 15, alignItems: 'center', },
    roleText: { fontSize: 16, fontWeight: 'bold', },
    roleTextActive: { color: 'white', },
    subtitle: { marginBottom: 30, fontSize: 18, textAlign: 'center', },
    actionButton: { marginTop: 10, },
});
