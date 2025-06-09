import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Progress from 'react-native-progress';
import { useTheme } from '../contexts/ThemeContext';

interface MainProgressCardProps {
    label: string;
    consumed: number;
    goal: number;
    color: string;
    unit: string;
}

export const MainProgressCard: React.FC<MainProgressCardProps> = ({ label, consumed, goal, color, unit }) => {
    const { colors } = useTheme();
    const progress = goal > 0 ? consumed / goal : 0;

    return (
        <View style={[styles.container, { backgroundColor: colors.card }]}>
            <View style={styles.textContainer}>
                <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
                <Text style={[styles.values, { color: colors.placeholderText }]}>
                    {Math.round(consumed)} / {Math.round(goal)} {unit}
                </Text>
            </View>
            <Progress.Bar
                progress={progress}
                width={null}
                height={10}
                color={color}
                unfilledColor={colors.inputBackground}
                borderColor={colors.card}
                borderRadius={8}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 15,
    },
    textContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 10,
    },
    label: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    values: {
        fontSize: 16,
        fontWeight: '500',
    },
});
