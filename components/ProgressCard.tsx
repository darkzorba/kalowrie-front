import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Progress from 'react-native-progress';
import { useTheme } from '../contexts/ThemeContext';

interface ProgressCardProps {
    label: string;
    consumed: number;
    goal: number;
    color: string;
    unit: string;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({ label, consumed, goal, color, unit }) => {
    const { colors } = useTheme();
    const progress = goal > 0 ? consumed / goal : 0;
    const isCompleted = progress >= 1;

    const getMacroIcon = (macroLabel: string) => {
        switch (macroLabel.toLowerCase()) {
            case 'protein':
            case 'proteína':
                return 'nutrition-outline';
            case 'carbs':
            case 'carboidratos':
                return 'leaf-outline';
            case 'fat':
            case 'gordura':
                return 'water-outline';
            default:
                return 'fitness-outline';
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.card }]}>
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                    <Ionicons name={getMacroIcon(label)} size={20} color={color} />
                </View>
                <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
            </View>
            
            <View style={styles.progressContainer}>
                <Progress.Circle
                    size={70}
                    progress={progress}
                    color={isCompleted ? '#10B981' : color}
                    unfilledColor={colors.inputBackground}
                    borderColor={colors.card}
                    thickness={6}
                    strokeCap="round"
                    showsText={false}
                />
                {isCompleted && (
                    <View style={[styles.completedIcon, { backgroundColor: '#10B981' }]}>
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    </View>
                )}
            </View>

            <View style={styles.valuesContainer}>
                <Text style={[styles.consumedValue, { color: colors.text }]}>
                    {Math.round(consumed)}
                </Text>
                <Text style={[styles.goalValue, { color: colors.placeholderText }]}>
                    / {Math.round(goal)} {unit}
                </Text>
            </View>
            
            <Text style={[styles.percentage, { color: isCompleted ? '#10B981' : color }]}>
                {Math.round(progress * 100)}%
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        margin: 6,
        minWidth: '40%',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
    },
    progressContainer: {
        position: 'relative',
        marginBottom: 12,
    },
    completedIcon: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -12,
        marginLeft: -12,
    },
    valuesContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 4,
    },
    consumedValue: {
        fontSize: 18,
        fontWeight: '700',
    },
    goalValue: {
        fontSize: 14,
        fontWeight: '500',
    },
    percentage: {
        fontSize: 14,
        fontWeight: '600',
    },
});
