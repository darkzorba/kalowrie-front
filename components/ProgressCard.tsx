import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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

    return (
        <View style={[styles.container, { backgroundColor: colors.card }]}>
            <Progress.Circle
                size={80}
                progress={progress}
                color={color}
                unfilledColor={colors.inputBackground}
                borderColor={colors.card}
                thickness={8}
                strokeCap="round"
                showsText={true}
                formatText={() => `${Math.round(progress * 100)}%`}
                textStyle={[styles.progressText, { color: color }]}
            />
            <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
            <Text style={[styles.values, { color: colors.placeholderText }]}>
                {Math.round(consumed)} / {Math.round(goal)} {unit}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        padding: 15,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        margin: 8,
        minWidth: '40%',
    },
    progressText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    label: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 10,
    },
    values: {
        fontSize: 14,
        marginTop: 4,
    },
});
