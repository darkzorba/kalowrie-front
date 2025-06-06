import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { StyledTextInput } from '../../components/StyledTextInput';
import { StyledButton } from '../../components/StyledButton';
import { StyledText } from '../../components/StyledText';
import { GlobalStyles } from '../../constants/GlobalStyles';
import KeyboardAvoidingWrapper from '../../components/KeyboardAvoidingWrapper';

const actualLogo = require('../../assets/images/logo_new.png');

export default function RegisterScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const router = useRouter();
    const { signUp, isLoading } = useAuth();
    const { colors } = useTheme();

    const handleRegister = async () => {
        setError('');
        if (!email || !password || !confirmPassword) {
            setError('Please fill in all fields.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        try {
            await signUp(email, password);
        } catch (e: any) {
            setError(e.message || 'Failed to register. Please try again.');
        }
    };

    return (
        <KeyboardAvoidingWrapper style={{ backgroundColor: colors.appBackground }}>
            <View style={[GlobalStyles.container, styles.container, { backgroundColor: colors.appBackground }]}>
                <View style={styles.logoContainer}>
                    <Image
                        source={actualLogo}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <StyledText style={[styles.logoText, { color: colors.text }]}>
                        KaLowRie
                    </StyledText>
                </View>

                <StyledText type="subtitle" style={[styles.subtitle, { color: colors.text }]}>
                    Create your account
                </StyledText>

                <View style={GlobalStyles.form}>
                    <StyledTextInput
                        label="Email Address"
                        placeholder="you@example.com"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <StyledTextInput
                        label="Password"
                        placeholder="Choose a strong password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                    <StyledTextInput
                        label="Confirm Password"
                        placeholder="Re-enter your password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                    />

                    {error ? <StyledText type="error" style={GlobalStyles.errorText}>{error}</StyledText> : null}

                    <StyledButton
                        title="Create Account"
                        onPress={handleRegister}
                        loading={isLoading}
                        disabled={isLoading}
                        style={styles.actionButton}
                    />

                    <Link href="/(auth)/login" asChild>
                        <TouchableOpacity>
                            <StyledText type="link" style={[GlobalStyles.linkText, { color: colors.primary }]}>
                                Already have an account? Sign In
                            </StyledText>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </KeyboardAvoidingWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 25,
    },
    logo: {
        width: 130,
        height: 130,
    },
    logoText: {
        fontSize: 28,
        fontWeight: 'bold',
        marginTop: 8,
    },
    subtitle: {
        marginBottom: 30,
        fontSize: 18,
        textAlign: 'center',
    },
    actionButton: {
        marginTop: 10,
    }
});
