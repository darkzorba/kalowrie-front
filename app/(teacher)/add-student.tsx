import React, { useState, useMemo, useCallback } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity, Platform, Text, Modal, Pressable, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocalization } from '@/contexts/LocalizationContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { StyledTextInput } from '@/components/StyledTextInput';
import { StyledButton } from '@/components/StyledButton';
import { StyledText } from '@/components/StyledText';
import { GlobalStyles } from '@/constants/GlobalStyles';
import KeyboardAvoidingWrapper from '@/components/KeyboardAvoidingWrapper';
import { StyledPicker } from '@/components/StyledPicker';
import apiService from '@/services/apiService';

export default function AddStudentScreen() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState<string | undefined>(undefined);

    const [date, setDate] = useState(new Date(2000, 0, 1));
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { colors } = useTheme();
    const { t } = useLocalization();
    const router = useRouter();

    const genderOptions = useMemo(() => [
        { label: t('male'), value: 'male' },
        { label: t('female'), value: 'female' },
        { label: t('other'), value: 'other' },
        { label: t('preferNotToSay'), value: 'prefer_not_to_say' },
    ], [t]);

    const onDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || date;
        setShowDatePicker(Platform.OS === 'ios');
        setDate(currentDate);
    };

    const confirmDate = () => {
        setBirthDate(date.toISOString().split('T')[0]);
        setShowDatePicker(false);
    };

    const handleAddStudent = async () => {
        if (!firstName || !lastName || !email || !password) {
            setError(t('fillRequiredFields'));
            return;
        }

        setIsLoading(true);
        setError('');

        const studentData = {
            height: height || null,
            weight: weight || null,
            first_name: firstName,
            last_name: lastName,
            email,
            gender: gender || null,
            age: age || null,
            password,
            birth_date: birthDate || null,
        };

        try {
            const response = await apiService('/team/student', 'POST', studentData);

            if (response?.status) {
                Alert.alert(t('success') || 'Success', t('studentAddedSuccess'));
                router.back();
            } else {
                throw new Error(response?.message || 'Failed to add student.');
            }
        } catch (e: any) {
            const errorMessage = e?.data?.message || e.message || 'An unexpected error occurred.';
            setError(errorMessage);
            Alert.alert('Error', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingWrapper>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 10 }}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <StyledText type="title" style={{ color: colors.text }}>{t('addStudent')}</StyledText>
                </View>

                <StyledTextInput label={t('firstName')} value={firstName} onChangeText={setFirstName} />
                <StyledTextInput label={t('lastName')} value={lastName} onChangeText={setLastName} />

                <View style={styles.inputGroup}>
                    <StyledText type="label" style={[styles.dateLabel, { color: colors.text }]}>{t('birthDate')}</StyledText>
                    <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.dateInputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                        <Ionicons name="calendar-outline" size={20} color={colors.text} />
                        <Text style={[styles.dateInputText, { color: birthDate ? colors.text : colors.placeholderText }]}>
                            {birthDate || t('selectBirthDate')}
                        </Text>
                    </TouchableOpacity>
                </View>

                <StyledTextInput label={t('emailAddress')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                <StyledTextInput label={t('password')} value={password} onChangeText={setPassword} secureTextEntry />

                <View style={styles.row}>
                    <StyledTextInput containerStyle={{ flex: 1, marginRight: 10 }} label={t('weight')} value={weight} onChangeText={setWeight} keyboardType="numeric" />
                    <StyledTextInput containerStyle={{ flex: 1 }} label={t('height')} value={height} onChangeText={setHeight} keyboardType="numeric" />
                </View>

                <View style={styles.row}>
                    <StyledTextInput containerStyle={{ flex: 1, marginRight: 10 }} label={t('age')} value={age} onChangeText={setAge} keyboardType="numeric" />
                    <StyledPicker containerStyle={{ flex: 1.5 }} label={t('gender')} items={genderOptions} selectedValue={gender} onValueChange={(value) => setGender(value as string)} placeholder={t('selectGender')} />
                </View>

                {error ? <StyledText type="error" style={GlobalStyles.errorText}>{error}</StyledText> : null}

                <StyledButton title={t('addStudent')} onPress={handleAddStudent} loading={isLoading} disabled={isLoading} style={{ marginTop: 20 }} />

                <Modal transparent={true} visible={showDatePicker} animationType="slide">
                    <Pressable style={styles.modalBackdrop} onPress={() => setShowDatePicker(false)}>
                        <View style={[styles.datePickerContainer, { backgroundColor: colors.card }]}>
                            <DateTimePicker value={date} mode="date" display="spinner" onChange={onDateChange} maximumDate={new Date()} textColor={colors.text} />
                            <StyledButton title={t('confirm')} onPress={confirmDate} style={styles.confirmButton} />
                        </View>
                    </Pressable>
                </Modal>
            </ScrollView>
        </KeyboardAvoidingWrapper>
    );
}

const styles = StyleSheet.create({
    container: { paddingHorizontal: 20, paddingBottom: 40, backgroundColor: 'transparent' },
    row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    inputGroup: { width: '100%', marginBottom: 15 },
    dateLabel: { marginBottom: 8, fontWeight: '500' },
    dateInputContainer: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center' },
    dateInputText: { fontSize: 16, marginLeft: 10 },
    modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    datePickerContainer: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, },
    confirmButton: { marginTop: 15, },
});
