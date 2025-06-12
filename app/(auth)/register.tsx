import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Platform, Text, Modal, Pressable } from 'react-native';
import { Link } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';

import { StyledTextInput } from '../../components/StyledTextInput';
import { StyledButton } from '../../components/StyledButton';
import { StyledText } from '../../components/StyledText';
import { GlobalStyles } from '../../constants/GlobalStyles';
import KeyboardAvoidingWrapper from '../../components/KeyboardAvoidingWrapper';

const actualLogo = require('../../assets/images/logo_new.png');

interface IRegisterForm {
    firstName: string;
    lastName: string;
    birthDate: string;
    email: string;
    password: string;
}

const validateEmail = (email: string): { isValid: boolean, message: string } => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { isValid: false, message: 'Please enter a valid email address.' };
    }
    return { isValid: true, message: '' };
};

const validatePassword = (password: string): { isValid: boolean, message: string } => {
    if (password.length < 8) {
        return { isValid: false, message: 'Password must be at least 8 characters long.' };
    }
    if (!/[A-Z]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one uppercase letter.' };
    }
    if (!/\d/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one number.' };
    }
    if (!/[@$!%*?&]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one special character (@$!%*?&).' };
    }
    return { isValid: true, message: '' };
};

const validateAge = (birthDate: string): { isValid: boolean, message: string } => {
    const birth = new Date(birthDate);
    const today = new Date();

    let age = today.getFullYear() - birth.getFullYear();
    const monthDifference = today.getMonth() - birth.getMonth();

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    if (age < 16) {
        return { isValid: false, message: 'You must be at least 16 years old to register.' };
    }

    return { isValid: true, message: '' };
};

export default function RegisterScreen() {
    const [formData, setFormData] = useState<IRegisterForm>({
        firstName: '',
        lastName: '',
        birthDate: '',
        email: '',
        password: '',
    });
    const [date, setDate] = useState(new Date(2000, 0, 1));
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const { signUp, isLoading } = useAuth();
    const { colors } = useTheme();

    const handleInputChange = useCallback((name: keyof IRegisterForm, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        const currentDate = selectedDate || date;
        if (Platform.OS === 'android' && event.type === 'set') {
            setDate(currentDate);
            confirmDate(currentDate);
        } else if (Platform.OS === 'ios'){
            setDate(currentDate);
        }
    };

    const confirmDate = (dateToConfirm: Date) => {
        const formattedDate = dateToConfirm.toISOString().split('T')[0];
        handleInputChange('birthDate', formattedDate);
        setShowDatePicker(false);
    };

    const handleRegister = async () => {
        setError('');
        const { firstName, lastName, birthDate, email, password } = formData;

        if (!firstName || !lastName || !birthDate || !email || !password || !confirmPassword) {
            setError('Please fill in all fields.');
            return;
        }

        const emailValidation = validateEmail(email);
        if(!emailValidation.isValid) {
            setError(emailValidation.message);
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            setError(passwordValidation.message);
            return;
        }

        const ageValidation = validateAge(birthDate);
        if (!ageValidation.isValid) {
            setError(ageValidation.message);
            return;
        }

        try {
            await signUp(formData);
        } catch (e: any) {
            setError(e.message || 'Failed to register. Please try again.');
        }
    };

    const isIOS = Platform.OS === 'ios';

    return (
        <KeyboardAvoidingWrapper style={{ backgroundColor: colors.appBackground }}>
            <View style={[GlobalStyles.container, styles.container, { backgroundColor: colors.appBackground }]}>
                <View style={styles.logoContainer}>
                    <Image source={actualLogo} style={styles.logo} resizeMode="contain" />
                    <StyledText style={[styles.logoText, { color: colors.text }]}>KaLowRie</StyledText>
                </View>

                <StyledText type="subtitle" style={[styles.subtitle, { color: colors.text }]}>Create your account</StyledText>

                <View style={GlobalStyles.form}>
                    <StyledTextInput label="First Name" placeholder="John" value={formData.firstName} onChangeText={(value) => handleInputChange('firstName', value)} />
                    <StyledTextInput label="Last Name" placeholder="Doe" value={formData.lastName} onChangeText={(value) => handleInputChange('lastName', value)} />

                    <View style={styles.inputGroup}>
                        <StyledText style={[GlobalStyles.labelText, { color: colors.text }]}>Birth Date</StyledText>
                        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.dateInputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                            <Text style={[styles.dateInputText, { color: formData.birthDate ? colors.text : colors.placeholder }]}>
                                {formData.birthDate || 'Select your birth date'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {isIOS && showDatePicker && (
                        <Modal
                            transparent={true}
                            visible={showDatePicker}
                            animationType="slide"
                            onRequestClose={() => setShowDatePicker(false)}
                        >
                            <Pressable style={styles.modalBackdrop} onPress={() => setShowDatePicker(false)}>
                                <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
                                    <DateTimePicker
                                        testID="dateTimePicker"
                                        value={date}
                                        mode="date"
                                        display="spinner"
                                        onChange={onDateChange}
                                        maximumDate={new Date()}
                                        textColor={colors.text}
                                    />
                                    <StyledButton
                                        title="Confirm"
                                        onPress={() => confirmDate(date)}
                                        style={styles.confirmButton}
                                    />
                                </View>
                            </Pressable>
                        </Modal>
                    )}

                    {!isIOS && showDatePicker && (
                        <DateTimePicker
                            testID="dateTimePicker"
                            value={date}
                            mode="date"
                            display="default"
                            onChange={onDateChange}
                            maximumDate={new Date()}
                        />
                    )}

                    <StyledTextInput label="Email Address" placeholder="you@example.com" value={formData.email} onChangeText={(value) => handleInputChange('email', value)} keyboardType="email-address" autoCapitalize="none" />
                    <StyledTextInput label="Password" placeholder="Choose a strong password" value={formData.password} onChangeText={(value) => handleInputChange('password', value)} secureTextEntry />
                    <StyledTextInput label="Confirm Password" placeholder="Re-enter your password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

                    {error ? <StyledText type="error" style={GlobalStyles.errorText}>{error}</StyledText> : null}

                    <StyledButton title="Create Account" onPress={handleRegister} loading={isLoading} disabled={isLoading} style={styles.actionButton} />

                    <Link href="/(auth)/login" asChild>
                        <TouchableOpacity>
                            <StyledText type="link" style={[GlobalStyles.linkText, { color: colors.primary }]}>Already have an account? Sign In</StyledText>
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
    },
    inputGroup: {
        width: '100%',
        marginBottom: 15,
    },
    dateInputContainer: {
        height: 50,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        justifyContent: 'center',
    },
    dateInputText: {
        fontSize: 16,
    },
    modalBackdrop: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    confirmButton: {
        marginTop: 15,
    }
});