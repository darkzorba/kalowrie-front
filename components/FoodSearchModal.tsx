import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, Modal, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';


interface ApiFood {
    name: string;
    quantity: number;
    carbs_g: number;
    proteins_g: number;
    fats_g: number;
    calories: number;
    category_name: string;
}

interface FoodOption {
    label: string;
    value: string;
    food: ApiFood;
}

interface FoodSearchModalProps {
    isVisible: boolean;
    onClose: () => void;
    foods: FoodOption[];
    onSelect: (item: FoodOption) => void;
}

const FoodSearchModal: React.FC<FoodSearchModalProps> = ({ isVisible, onClose, foods, onSelect }) => {
    const { colors } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredFoods = foods.filter(food => {
        if (!searchQuery.trim()) return true;
        
        const queryWords = searchQuery.toLowerCase().trim().split(/\s+/);
        const foodName = (food.label?.toLowerCase() || '');
        const categoryName = (food.food?.category_name?.toLowerCase() || '');
        const searchableText = `${foodName} ${categoryName}`;
        
        return queryWords.every(word => searchableText.includes(word));
    });

    const renderItem = ({ item }: { item: FoodOption }) => (
        <TouchableOpacity onPress={() => onSelect(item)} style={[styles.itemContainer, { borderBottomColor: colors.border }]}>
             <View>
                <Text style={[styles.itemText, { color: colors.text }]}>{item.food?.name || 'Nome não disponível'}</Text>
                <Text style={[styles.itemSubText, { color: colors.placeholderText }]}>
                    {item.food?.category_name || 'Categoria não disponível'} - {Math.round(item.food?.calories || 0)} kcal
                </Text>
            </View>
            <View style={styles.itemMacros}>
                <Text style={[styles.itemMacroText, { color: colors.text }]}>P: {item.food?.proteins_g || 0}g</Text>
                <Text style={[styles.itemMacroText, { color: colors.text }]}>C: {item.food?.carbs_g || 0}g</Text>
                <Text style={[styles.itemMacroText, { color: colors.text }]}>F: {item.food?.fats_g || 0}g</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={isVisible}
            onRequestClose={onClose}
            animationType="slide"
        >
            <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.appBackground }]}>
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Select an Ingredient</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close-circle" size={30} color={colors.text} />
                    </TouchableOpacity>
                </View>
                <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
                    <Ionicons name="search" size={20} color={colors.placeholderText} style={{marginLeft: 10}}/>
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search for a food..."
                        placeholderTextColor={colors.placeholderText}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <FlatList
                    data={filteredFoods}
                    renderItem={renderItem}
                    keyExtractor={item => item.value}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        margin: 15,
        paddingHorizontal: 5,
    },
    searchInput: {
        flex: 1,
        height: 45,
        fontSize: 16,
        marginLeft: 10,
    },
    itemContainer: {
        paddingVertical: 15,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
    },
    itemText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
    itemSubText: {
        fontSize: 12,
        marginTop: 2,
    },
    itemMacros: {
        alignItems: 'flex-end'
    },
    itemMacroText: {
        fontSize: 12,
        fontWeight: '400',
    }
});

export default FoodSearchModal;
