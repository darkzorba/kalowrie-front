import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, UIManager, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface AccordionProps {
    title: string;
    children: React.ReactNode;
    headerContent?: React.ReactNode;
}

export const Accordion: React.FC<AccordionProps> = ({ title, children, headerContent }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { colors } = useTheme();

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsExpanded(!isExpanded);
    };

    return (
        <View style={[styles.container, { borderColor: colors.border }]}>
            <TouchableOpacity onPress={toggleExpand} style={[styles.header, { backgroundColor: colors.card }]}>
                <View>
                    <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                    {headerContent}
                </View>
                <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={24} color={colors.text} />
            </TouchableOpacity>
            {isExpanded && (
                <View style={[styles.content, { backgroundColor: colors.inputBackground }]}>
                    {children}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 10,
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
    },
    content: {
        padding: 15,
    },
});
