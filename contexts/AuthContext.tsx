import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import apiService, { storeToken, getToken, removeToken } from '../services/apiService';

interface User {
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
}

interface DecodedToken {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    is_first_access: boolean;
    exp: number;
    iat: number;
}

interface AuthResponse {
    access: string;
}

interface UserCreateResponse {
    message: string;
    user: User;
    token?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    signIn: (username?: string, password?: string) => Promise<void>;
    signUp: (username?: string, password?: string) => Promise<void>;
    signOut: () => Promise<void>;
    isOnboarded: boolean;
    completeOnboarding: () => Promise<void>;
    initialLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [isOnboarded, setIsOnboarded] = useState(false);

    const processToken = async (authToken: string) => {
        console.log(authToken);
        const decoded: DecodedToken = jwtDecode(authToken);
        console.log(decoded)
        const currentUser: User = {
            id: decoded.id,
            username: decoded.username,
            firstName: decoded.first_name,
            lastName: decoded.last_name,
        };
        setUser(currentUser);
        setToken(authToken);
        setIsOnboarded(!decoded.is_first_access); // Onboarded if it's NOT the first access
        await storeToken(authToken);
        await AsyncStorage.setItem('user', JSON.stringify(currentUser));
        await AsyncStorage.setItem('isOnboarded', JSON.stringify(!decoded.is_first_access));
    };

    useEffect(() => {
        const loadAuthData = async () => {
            setInitialLoading(true);
            try {
                const storedToken = await getToken();
                if (storedToken) {
                    const decoded: DecodedToken = jwtDecode(storedToken);
                    if (decoded.exp * 1000 > Date.now()) { // Check if token is not expired
                        await processToken(storedToken);
                    } else {
                        await signOut(); // Token is expired, clear session
                    }
                }
            } catch (e) {
                console.error("Failed to load auth data from storage", e);
                await signOut(); // If any error in loading, sign out for safety
            } finally {
                setInitialLoading(false);
            }
        };
        loadAuthData();
    }, []);

    const signIn = async (username?: string, password?: string) => {
        if (!username || !password) throw new Error("username and password are required.");
        setIsLoading(true);
        try {
            const response = await apiService<AuthResponse>('/login', 'POST', { username, password }, false);
            await processToken(response.access);
            setIsLoading(false);
        } catch (error: any) {
            setIsLoading(false);
            const displayMessage = error.data?.message || error.data?.error || error.message || "Login failed.";
            throw new Error(displayMessage);
        }
    };

    const signUp = async (username?: string, password?: string) => {
        if (!username || !password) throw new Error("username and password are required.");
        setIsLoading(true);
        try {
            const response = await apiService<AuthResponse>('/user/create', 'POST', { username, password }, false);
            if (response.access) {
                await processToken(response.access);
            }
            setIsLoading(false);
        } catch (error: any) {
            setIsLoading(false);
            const displayMessage = error.data?.message || error.data?.error || error.message || "Registration failed.";
            throw new Error(displayMessage);
        }
    };

    const signOut = async () => {
        setUser(null);
        setToken(null);
        setIsOnboarded(false);
        await removeToken();
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('isOnboarded');
    };

    const completeOnboarding = async () => {
        try {
            // This endpoint should update the user's 'is_first_access' to false on the backend.
            await apiService('/user/complete-onboarding', 'POST');
            setIsOnboarded(true); // Update state locally
            await AsyncStorage.setItem('isOnboarded', JSON.stringify(true));
        } catch (error) {
            console.error("Failed to complete onboarding on the server", error);
            // Optionally handle the error, e.g., by showing a message to the user
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, signIn, signUp, signOut, isOnboarded, completeOnboarding, initialLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
