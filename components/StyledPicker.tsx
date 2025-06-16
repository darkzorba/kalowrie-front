import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { StyledText } from './StyledText';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors'

interface PickerItem {
    label: string;
    value: string | number;
}

interface StyledPickerProps {
    label?: string;
    items: PickerItem[];
    selectedValue: string | number | undefined;
    onValueChange: (value: string | number) => void;
    placeholder?: string;
    error?: string;
    containerStyle?: object;
}

export const StyledPicker: React.FC<StyledPickerProps> = ({
                                                              label,
                                                              items,
                                                              selectedValue,
                                                              onValueChange,
                                                              placeholder = "Select an option...",
                                                              error,
                                                              containerStyle,
                                                          }) => {
    const { colors, isDark } = useTheme();
    const [modalVisible, setModalVisible] = useState(false);

    const selectedItem = items.find(item => item.value === selectedValue);

    return (
        <View style={[styles.container, containerStyle]}>
            {label && <StyledText type="label" style={[styles.label, { color: colors.text }]}>{label}</StyledText>}
            <TouchableOpacity
                style={[
                    styles.pickerButton,
                    {
                        backgroundColor: colors.inputBackground,
                        borderColor: error ? colors.primary : colors.border
                    },
                ]}
                onPress={() => setModalVisible(true)}
            >
                <StyledText style={{ color: selectedItem ? colors.text : colors.placeholderText, flexShrink:1}}
                ellipsizeMode="tail"
                numberOfLines={2}
                >
                    {selectedItem ? selectedItem.label : placeholder}
                </StyledText>
                <Ionicons
                    name="chevron-down"
                    size={20}
                    color={colors.text}
                />
            </TouchableOpacity>
            {error && <StyledText type="error" style={styles.errorText}>{error}</StyledText>}

            <Modal
                transparent={true}
                visible={modalVisible}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <SafeAreaView style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <FlatList
                            data={items}
                            keyExtractor={(item) => item.value.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.modalItem, { borderBottomColor: colors.border }]}
                                    onPress={() => {
                                        onValueChange(item.value);
                                        setModalVisible(false);
                                    }}
                                >
                                    <StyledText style={{ color: colors.text }}>{item.label}</StyledText>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity
                            style={[styles.closeButton, { backgroundColor: colors.primary }]}
                            onPress={() => setModalVisible(false)}
                        >
                            <StyledText style={{ color: Colors.common.white, fontWeight: 'bold' }}>Close</StyledText>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
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
    pickerButton: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    errorText: {
        marginTop: 5,
        fontSize: 13,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 10,
        maxHeight: '50%',
    },
    modalItem: {
        padding: 15,
        borderBottomWidth: 1,
    },
    closeButton: {
        padding: 15,
        alignItems: 'center',
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        marginTop: 5,
    },
});
