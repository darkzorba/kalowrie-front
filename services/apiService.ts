import { API_BASE_URL } from '../constants/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'authToken';

export const storeToken = async (token: string) => {
    try {
        await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
        console.error('Failed to store token', e);
    }
};

export const getToken = async (): Promise<string | null> => {
    try {
        return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (e) {
        console.error('Failed to get token', e);
        return null;
    }
};

export const removeToken = async () => {
    try {
        await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (e) {
        console.error('Failed to remove token', e);
    }
};

interface ApiErrorData {
    message?: string;
    error?: string;
    errors?: Array<{ msg: string; param?: string }>;
}

class ApiError extends Error {
    status: number;
    data?: ApiErrorData;

    constructor(message: string, status: number, data?: ApiErrorData) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

const request = async <T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any,
    isFormData: boolean = false
): Promise<T> => {
    const headers: HeadersInit = {
        'Accept': 'application/json',
    };

    const token = await getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }


    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    const config: RequestInit = {
        method,
        headers,
    };

    if (body) {
        config.body = isFormData ? body : JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        if (response.status === 204) {
            return {} as T;
        }

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessage = responseData?.message || responseData?.error || `API request failed to ${endpoint}`;
            throw new ApiError(errorMessage, response.status, responseData);
        }
        return responseData as T;
    } catch (error) {
        if (error instanceof ApiError) {
            console.error(`API Error (${error.status}) to ${endpoint}: ${error.message}`, error.data);
            throw error;
        }
        console.error(`Network or other error for ${endpoint}:`, error);
        throw new Error(`Failed to fetch from ${endpoint}. Please check your network connection.`);
    }
};

export default request;
