import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface StyledTextProps extends TextProps {
    type?: 'default' | 'title' | 'subtitle' | 'label' | 'caption' | 'error' | 'link';
    color?: string;
}

export const StyledText: React.FC<StyledTextProps> = ({ style, type = 'default', color, ...rest }) => {
    const { colors } = useTheme();

    const textStyles = [
        styles.default,
        { color: color || colors.text },
        type === 'title' && styles.title,
        type === 'subtitle' && styles.subtitle,
        type === 'label' && styles.label,
        type === 'caption' && styles.caption,
        type === 'error' && [styles.error, { color: colors.primary }],
        type === 'link' && [styles.link, { color: colors.primary }],
        style,
    ];

    return <Text style={textStyles} {...rest} />;
};

const styles = StyleSheet.create({
    default: {
        fontSize: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 20,
        fontWeight: '600',
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
    },
    caption: {
        fontSize: 12,
        color: '#888',
    },
    error: {
        fontSize: 14,
        fontWeight: '500',
    },
    link: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
