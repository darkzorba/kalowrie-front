import React from 'react';
import { TextInput, TextInputProps, StyleSheet, View, Text } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { StyledText } from './StyledText';

interface StyledTextInputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: object;
}

export const StyledTextInput: React.FC<StyledTextInputProps> = ({ label, error, style, containerStyle, ...rest }) => {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, containerStyle]}>
            {label && <StyledText type="label" style={[styles.label, { color: colors.text }]}>{label}</StyledText>}
            <TextInput
                style={[
                    styles.input,
                    {
                        backgroundColor: colors.inputBackground,
                        color: colors.text,
                        borderColor: error ? colors.primary : colors.border
                    },
                    style,
                ]}
                placeholderTextColor={colors.placeholderText}
                {...rest}
            />
            {error && <StyledText type="error" style={styles.errorText}>{error}</StyledText>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 15,
        width: '100%',
    },
    label: {
        marginBottom: 8,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 15,
        fontSize: 16,
    },
    errorText: {
        marginTop: 5,
        fontSize: 13,
    },
});
