import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import apiService, { storeToken, getToken, removeToken } from '../services/apiService';

interface User {
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    email: string | null;
    dietId: number | null;
}

interface DecodedToken {
    id: string;
    username: string;
    first_name: string;
    email: string | null;
    diet_id: number | null;
    last_name: string;
    is_first_access: boolean;
    exp: number;
    iat: number;
}

interface AuthResponse {
    access: string;
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
    setDietId: (dietId: number) => Promise<void>;
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
        const decoded: DecodedToken = jwtDecode(authToken);
        const currentUser: User = {
            id: decoded.id,
            username: decoded.username,
            firstName: decoded.first_name,
            lastName: decoded.last_name,
            email: decoded.email,
            dietId: decoded.diet_id
        };
        setUser(currentUser);
        setToken(authToken);
        setIsOnboarded(!decoded.is_first_access);
        await storeToken(authToken);
        await AsyncStorage.setItem('user', JSON.stringify(currentUser));
        await AsyncStorage.setItem('isOnboarded', JSON.stringify(!decoded.is_first_access));
    };


    const setDietId = async (dietId: number) => {
        if (user) {
            const updatedUser = { ...user, dietId: dietId };
            setUser(updatedUser);
            await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        }
    };

    useEffect(() => {
        const loadAuthData = async () => {
            setInitialLoading(true);
            try {
                const storedToken = await getToken();
                if (storedToken) {
                    const decoded: DecodedToken = jwtDecode(storedToken);
                    if (decoded.exp * 1000 > Date.now()) {
                        await processToken(storedToken);
                    } else {
                        await signOut();
                    }
                }
            } catch (e) {
                console.error("Failed to load auth data from storage", e);
                await signOut();
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
        } catch (error: any) {
            const displayMessage = error.data?.message || error.message || "Login failed.";
            throw new Error(displayMessage);
        } finally {
            setIsLoading(false);
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
        } catch (error: any) {
            const displayMessage = error.data?.message || error.message || "Registration failed.";
            throw new Error(displayMessage);
        } finally {
            setIsLoading(false);
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
            setIsOnboarded(true);
            await AsyncStorage.setItem('isOnboarded', JSON.stringify(true));
        } catch (error) {
            console.error("Failed to complete onboarding on the server", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, signIn, signUp, signOut, isOnboarded, completeOnboarding, setDietId, initialLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
