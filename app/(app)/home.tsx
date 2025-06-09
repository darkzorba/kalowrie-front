import React, { useState, useMemo, useCallback } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    SafeAreaView
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Calendar, DateData } from 'react-native-calendars';
import { useTheme } from '../../contexts/ThemeContext';
import { StyledText } from '../../components/StyledText';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';
import { ProgressCard } from '../../components/ProgressCard';
import { MainProgressCard } from '../../components/MainProgressCard';
import { Ionicons } from '@expo/vector-icons';

interface ProgressData {
    cards_dict:{
        total_proteins: number;
        total_kcals: number;
        total_carbs: number;
        total_fats: number;
        kcals_goal: number;
        fats_goal: number;
        proteins_goal: number;
        carbs_goal: number;
    }
}

const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

const formatDateForAPI = (date: Date) => {
    return date.toISOString().split('T')[0];
};

export default function HomeScreen() {
    const { colors } = useTheme();
    const { user } = useAuth();

    const [progressData, setProgressData] = useState<ProgressData | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCalendarVisible, setCalendarVisible] = useState(false);

    const selectedDateString = useMemo(() => formatDateForAPI(selectedDate), [selectedDate]);

    useFocusEffect(
        useCallback(() => {
            const fetchProgressData = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const data = await apiService<ProgressData>(`/user/diet/get/cards?date=${selectedDateString}`, 'GET');
                    setProgressData(data);
                } catch (e: any) {
                    const errorMessage = e.data?.message || e.message || "Could not load progress for this date.";
                    setError(errorMessage);
                    setProgressData(null);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchProgressData();
        }, [selectedDateString])
    );

    const onDayPress = (day: DateData) => {

        const timezoneOffset = new Date().getTimezoneOffset() * 60000;
        setSelectedDate(new Date(day.timestamp + timezoneOffset));
        setCalendarVisible(false);
    };

    const changeDate = (amount: number) => {
        setSelectedDate(currentDate => {
            const newDate = new Date(currentDate);
            newDate.setDate(newDate.getDate() + amount);
            return newDate > new Date() ? currentDate : newDate;
        });
    };

    const getGreeting = () => {
        if (user?.firstName) return `Welcome, ${user.firstName}!`;
        return `Welcome, ${user?.email || 'User'}!`;
    };

    const markedDates = {
        [selectedDateString]: {
            selected: true,
            selectedColor: colors.primary,
        }
    };

    const calendarTheme = {
        backgroundColor: colors.card,
        calendarBackground: colors.card,
        textSectionTitleColor: colors.placeholderText,
        selectedDayBackgroundColor: colors.primary,
        selectedDayTextColor: '#ffffff',
        todayTextColor: colors.primary,
        dayTextColor: colors.text,
        textDisabledColor: colors.disabled,
        arrowColor: colors.primary,
        monthTextColor: colors.text,
        textDayFontWeight: '300',
        textMonthFontWeight: 'bold',
        textDayHeaderFontWeight: '300',
        textDayFontSize: 16,
        textMonthFontSize: 16,
        textDayHeaderFontSize: 16,
    };

    return (

        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.appBackground }]}>
            <ScrollView contentContainerStyle={styles.contentContainer}>
                <StyledText type="title" style={[styles.greeting, { color: colors.text }]}>
                    {getGreeting()}
                </StyledText>

                <View style={[styles.datePickerContainer, { backgroundColor: colors.card }]}>
                    <TouchableOpacity onPress={() => changeDate(-1)} style={styles.arrowButton}>
                        <Ionicons name="chevron-back" size={26} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setCalendarVisible(true)} style={styles.datePickerButton}>
                        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                        <StyledText style={[styles.dateText, { color: colors.text }]}>{formatDate(selectedDate)}</StyledText>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => changeDate(1)} style={styles.arrowButton} disabled={new Date().toDateString() === selectedDate.toDateString()}>
                        <Ionicons name="chevron-forward" size={26} color={new Date().toDateString() === selectedDate.toDateString() ? colors.disabled : colors.primary} />
                    </TouchableOpacity>
                </View>

                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={isCalendarVisible}
                    onRequestClose={() => setCalendarVisible(false)}
                >
                    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setCalendarVisible(false)}>
                        <View style={[styles.modalContent, {backgroundColor: colors.card, overflow: 'hidden'}]}>
                            <Calendar
                                current={selectedDateString}
                                onDayPress={onDayPress}
                                markedDates={markedDates}
                                maxDate={formatDateForAPI(new Date())}
                                theme={calendarTheme}
                            />
                        </View>
                    </TouchableOpacity>
                </Modal>

                {isLoading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
                ) : error ? (
                    <View style={styles.centeredMessage}>
                        <StyledText type="error">{error}</StyledText>
                    </View>
                ) : progressData ? (
                    <>
                        <MainProgressCard label="Calories" consumed={progressData.cards_dict.total_kcals} goal={progressData.cards_dict.kcals_goal} color="#F97316" unit="kcal" />

                        {/* 4. Ajuste na estrutura dos cards para um grid correto */}
                        <View style={styles.cardsContainer}>
                            <View style={styles.cardItem}>
                                <ProgressCard label="Protein" consumed={progressData.cards_dict.total_proteins} goal={progressData.cards_dict.proteins_goal} color="#3B82F6" unit="g" />
                            </View>
                            <View style={styles.cardItem}>
                                <ProgressCard label="Carbs" consumed={progressData.cards_dict.total_carbs} goal={progressData.cards_dict.carbs_goal} color="#10B981" unit="g" />
                            </View>
                            <View style={styles.cardItem}>
                                <ProgressCard label="Fat" consumed={progressData.cards_dict.total_fats} goal={progressData.cards_dict.fats_goal} color="#EAB308" unit="g" />
                            </View>
                        </View>
                    </>
                ) : (
                    <View style={styles.centeredMessage}>
                        <StyledText>No data available for this day.</StyledText>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({

    safeArea: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    greeting: {
        fontSize: 28,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 20,
    },
    datePickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 15,
        marginBottom: 24,
        paddingHorizontal: 10,
    },
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
    },
    arrowButton: {
        padding: 10,
    },
    dateText: {
        marginLeft: 10,
        fontSize: 16,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    modalContent: {
        width: '90%',
        borderRadius: 15,
    },

    cardsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -6,
        marginTop: 12,
    },
    cardItem: {
        width: '50%',
        paddingHorizontal: 6,
        marginBottom: 12,
    },
    centeredMessage: {
        marginTop: 50,
        alignItems: 'center',
        justifyContent: 'center',
    }
});