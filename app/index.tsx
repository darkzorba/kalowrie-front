import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const IndexScreen = () => {
    const { colors } = useTheme();


    return (
        <View style={[styles.loaderContainer, { backgroundColor: colors.appBackground }]}>
            <ActivityIndicator size="large" color={colors.primary} />
        </View>
    );
};

const styles = StyleSheet.create({
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default IndexScreen;
