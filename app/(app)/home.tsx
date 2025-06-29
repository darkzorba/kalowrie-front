import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { ProgressCard } from '../../components/ProgressCard';
import { StyledText } from '../../components/StyledText';
import { BaseColors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { useLocalization } from '../../contexts/LocalizationContext';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/apiService';

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

export default function HomeScreen() {
    const { colors } = useTheme();
    const { user } = useAuth();
    const { t, language } = useLocalization();

    const [progressData, setProgressData] = useState<ProgressData | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCalendarVisible, setCalendarVisible] = useState(false);

    const formatDate = (date: Date) => {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return t('today');
        if (date.toDateString() === yesterday.toDateString()) return t('yesterday');

        return date.toLocaleDateString(language === 'pt-BR' ? 'pt-BR' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatDateForAPI = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

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
        const name = user?.firstName || user?.email || 'User';
        return t('welcome').replace('{name}', name);
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
        textDayFontSize: 16,
        textMonthFontSize: 16,
        textDayHeaderFontSize: 16,
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.appBackground }]}>
            <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>

                <View style={styles.headerSection}>
                    <StyledText type="title" style={[styles.greeting, { color: colors.text }]}>
                        {getGreeting()}
                    </StyledText>
                    
                    <View style={[styles.datePickerContainer, { backgroundColor: colors.card }]}>
                        <TouchableOpacity onPress={() => changeDate(-1)} style={styles.arrowButton}>
                            <Ionicons name="chevron-back" size={24} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setCalendarVisible(true)} style={styles.datePickerButton}>
                            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                            <StyledText style={[styles.dateText, { color: colors.text }]}>{formatDate(selectedDate)}</StyledText>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => changeDate(1)} 
                            style={styles.arrowButton} 
                            disabled={new Date().toDateString() === selectedDate.toDateString()}
                        >
                            <Ionicons 
                                name="chevron-forward" 
                                size={24} 
                                color={new Date().toDateString() === selectedDate.toDateString() ? colors.disabled : colors.primary} 
                            />
                        </TouchableOpacity>
                    </View>
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
                                key={language}
                            />
                        </View>
                    </TouchableOpacity>
                </Modal>

                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <StyledText style={[styles.loadingText, { color: colors.placeholderText }]}>
                            Carregando dados...
                        </StyledText>
                    </View>
                ) : error ? (
                    <View style={styles.centeredMessage}>
                        <Ionicons name="alert-circle-outline" size={48} color={BaseColors.error} />
                        <StyledText type="error" style={styles.errorText}>{error}</StyledText>
                    </View>
                ) : progressData ? (
                    <View style={styles.progressSection}>

                        <View style={[styles.heroCard, { backgroundColor: colors.card }]}>
                            <View style={styles.heroHeader}>
                                <View style={styles.heroTitleContainer}>
                                    <Ionicons name="flame-outline" size={24} color="#F97316" />
                                    <StyledText style={[styles.heroLabel, { color: colors.text }]}>
                                        {t('calories')}
                                    </StyledText>
                                </View>
                                <View style={styles.heroValues}>
                                    <StyledText style={[styles.heroConsumed, { color: colors.text }]}>
                                        {Math.round(progressData.cards_dict.total_kcals)}
                                    </StyledText>
                                    <StyledText style={[styles.heroGoal, { color: colors.placeholderText }]}>
                                        / {Math.round(progressData.cards_dict.kcals_goal)} kcal
                                    </StyledText>
                                </View>
                            </View>
                            <View style={styles.heroProgressContainer}>
                                <View style={[styles.heroProgressBar, { backgroundColor: colors.inputBackground }]}>
                                    <View 
                                        style={[
                                            styles.heroProgressFill, 
                                            { 
                                                backgroundColor: '#F97316',
                                                width: `${Math.min((progressData.cards_dict.total_kcals / progressData.cards_dict.kcals_goal) * 100, 100)}%`
                                            }
                                        ]} 
                                    />
                                </View>
                                <StyledText style={[styles.heroPercentage, { color: '#F97316' }]}>
                                    {Math.round((progressData.cards_dict.total_kcals / progressData.cards_dict.kcals_goal) * 100)}%
                                </StyledText>
                            </View>
                        </View>


                        <View style={styles.macrosSection}>
                            <StyledText style={[styles.sectionTitle, { color: colors.text }]}>
                                Macronutrientes
                            </StyledText>
                            <View style={styles.macrosGrid}>
                                <View style={styles.macroCard}>
                                    <ProgressCard 
                                        label={t('protein')} 
                                        consumed={progressData.cards_dict.total_proteins} 
                                        goal={progressData.cards_dict.proteins_goal} 
                                        color="#3B82F6" 
                                        unit="g" 
                                    />
                                </View>
                                <View style={styles.macroCard}>
                                    <ProgressCard 
                                        label={t('carbs')} 
                                        consumed={progressData.cards_dict.total_carbs} 
                                        goal={progressData.cards_dict.carbs_goal} 
                                        color="#10B981" 
                                        unit="g" 
                                    />
                                </View>
                                <View style={styles.macroCard}>
                                    <ProgressCard 
                                        label={t('fat')} 
                                        consumed={progressData.cards_dict.total_fats} 
                                        goal={progressData.cards_dict.fats_goal} 
                                        color="#EAB308" 
                                        unit="g" 
                                    />
                                </View>
                            </View>
                        </View>
                    </View>
                ) : (
                    <View style={styles.centeredMessage}>
                        <Ionicons name="nutrition-outline" size={48} color={colors.placeholderText} />
                        <StyledText style={[styles.noDataText, { color: colors.placeholderText }]}>
                            {t('noDataForDay')}
                        </StyledText>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { 
        flex: 1 
    },
    contentContainer: { 
        paddingHorizontal: 20, 
        paddingBottom: 20 
    },
    headerSection: {
        marginTop: 16,
        marginBottom: 24,
    },
    greeting: { 
        fontSize: 32, 
        fontWeight: '700', 
        marginBottom: 20,
        lineHeight: 38,
    },
    datePickerContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        borderRadius: 16, 
        paddingHorizontal: 12,
        paddingVertical: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    datePickerButton: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: 12,
        flex: 1,
        justifyContent: 'center',
    },
    arrowButton: { 
        padding: 8 
    },
    dateText: { 
        marginLeft: 8, 
        fontSize: 16, 
        fontWeight: '600' 
    },
    modalOverlay: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'rgba(0,0,0,0.6)' 
    },
    modalContent: { 
        width: '90%', 
        borderRadius: 20,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    loadingContainer: {
        marginTop: 60,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    progressSection: {
        gap: 24,
    },
    heroCard: {
        borderRadius: 20,
        padding: 24,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    heroHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    heroTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    heroLabel: {
        fontSize: 18,
        fontWeight: '600',
    },
    heroValues: {
        alignItems: 'flex-end',
    },
    heroConsumed: {
        fontSize: 32,
        fontWeight: '800',
        lineHeight: 36,
    },
    heroGoal: {
        fontSize: 16,
        fontWeight: '500',
    },
    heroProgressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    heroProgressBar: {
        flex: 1,
        height: 12,
        borderRadius: 6,
        overflow: 'hidden',
    },
    heroProgressFill: {
        height: '100%',
        borderRadius: 6,
    },
    heroPercentage: {
        fontSize: 16,
        fontWeight: '700',
        minWidth: 40,
        textAlign: 'right',
    },
    macrosSection: {
        gap: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 4,
    },
    macrosGrid: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        marginHorizontal: -6 
    },
    macroCard: { 
        width: '50%', 
        paddingHorizontal: 6, 
        marginBottom: 12 
    },
    centeredMessage: { 
        marginTop: 60, 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 16,
    },
    errorText: {
        textAlign: 'center',
        fontSize: 16,
    },
    noDataText: {
        fontSize: 16,
        textAlign: 'center',
    },
});
