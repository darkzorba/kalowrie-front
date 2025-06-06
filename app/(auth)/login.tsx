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

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const router = useRouter();
    const { signIn, isLoading } = useAuth();
    const { colors } = useTheme();

    const handleLogin = async () => {
        setError('');
        if (!email || !password) {
            setError('Please fill in all fields.');
            return;
        }
        try {
            await signIn(email, password);

        } catch (e: any) {
            setError(e.message || 'Failed to login. Please try again.');
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
                    Sign in to continue
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
                        placeholder="Your secure password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    {error ? <StyledText type="error" style={GlobalStyles.errorText}>{error}</StyledText> : null}

                    <StyledButton
                        title="Login"
                        onPress={handleLogin}
                        loading={isLoading}
                        disabled={isLoading}
                        style={styles.actionButton}
                    />

                    <Link href="/(auth)/register" asChild>
                        <TouchableOpacity>
                            <StyledText type="link" style={[GlobalStyles.linkText, { color: colors.primary }]}>
                                Don't have an account? Sign Up
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
