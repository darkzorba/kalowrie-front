import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import Colors from '../constants/Colors'

interface StyledButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'filled' | 'outlined' | 'text';
    color?: 'primary' | 'secondary' | string;
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    icon?: React.ReactNode;
}

export const StyledButton: React.FC<StyledButtonProps> = ({
                                                              title,
                                                              onPress,
                                                              variant = 'filled',
                                                              color = 'primary',
                                                              loading = false,
                                                              disabled = false,
                                                              style,
                                                              textStyle,
                                                              icon,
                                                          }) => {
    const { colors, isDark } = useTheme();

    const getBackgroundColor = () => {
        if (disabled) return colors.disabled;
        if (variant === 'filled') {
            return color === 'primary' ? colors.primary : color === 'secondary' ? colors.secondary : color;
        }
        return 'transparent';
    };

    const getTextColor = () => {
        if (variant === 'filled') {
            return Colors.common.white;
        }
        return color === 'primary' ? colors.primary : color === 'secondary' ? colors.text : color || colors.text;
    };

    const getBorderColor = () => {
        if (variant === 'outlined') {
            return color === 'primary' ? colors.primary : color === 'secondary' ? colors.text : color || colors.text;
        }
        return 'transparent';
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                {
                    backgroundColor: getBackgroundColor(),
                    borderColor: getBorderColor(),
                    borderWidth: variant === 'outlined' ? 2 : 0,
                },
                disabled && styles.disabled,
                style,
            ]}
            onPress={onPress}
            disabled={disabled || loading}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'filled' ? Colors.common.white : colors.primary} />
            ) : (
                <>
                    {icon && <>{icon}</>}
                    <Text style={[styles.text, { color: getTextColor() }, textStyle]}>{title}</Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginVertical: 10,
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        marginLeft: 5,
    },
    disabled: {
        opacity: 0.6,
    },
});
