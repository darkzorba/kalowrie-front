import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, SafeAreaView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface ActionOption {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
}

interface ActionSheetProps {
    isVisible: boolean;
    onClose: () => void;
    options: ActionOption[];
}

export const ActionSheet: React.FC<ActionSheetProps> = ({ isVisible, onClose, options }) => {
    const { colors } = useTheme();

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={onClose}>
                <SafeAreaView style={[styles.modalContent, { backgroundColor: colors.card }]}>
                    {options.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.optionButton,
                                index < options.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }
                            ]}
                            onPress={() => {
                                onClose();
                                option.onPress();
                            }}
                        >
                            <Ionicons name={option.icon} size={24} color={colors.text} />
                            <Text style={[styles.optionLabel, { color: colors.text }]}>{option.label}</Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                        style={[styles.cancelButton, { backgroundColor: colors.inputBackground }]}
                        onPress={onClose}
                    >
                        <Text style={[styles.cancelLabel, { color: colors.text }]}>Cancel</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        marginHorizontal: 10,
        marginBottom: 20,
        borderRadius: 15,
        overflow: 'hidden',
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
    },
    optionLabel: {
        fontSize: 18,
        marginLeft: 15,
    },
    cancelButton: {
        marginTop: 10,
        padding: 20,
        alignItems: 'center',
    },
    cancelLabel: {
        fontSize: 18,
        fontWeight: '600',
    }
});
