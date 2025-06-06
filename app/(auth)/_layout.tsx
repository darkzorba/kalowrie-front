import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {

    return (
        <Stack
            screenOptions={{
                headerShown: false, // This line removes the header
            }}
        >
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
        </Stack>
    );
}

