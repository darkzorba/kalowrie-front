import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/apiConfig';

const TOKEN_KEY = 'authToken';

export const storeToken = async (token: string) => {
    try {
        await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (e) {

    }
};

export const getToken = async (): Promise<string | null> => {
    try {
        return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (e) {

        return null;
    }
};

export const removeToken = async () => {
    try {
        await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (e) {

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

            throw error;
        }

        throw new Error(`Failed to fetch from ${endpoint}. Please check your network connection.`);
    }
};


export const createWorkoutSession = async (workoutId: number) => {
    return request('/user/workout/session', 'POST', { workout_id: workoutId });
};

export const getPreviousWorkoutSession = async (workoutId: number) => {
    return request(`/user/workout/session/previous?workout_id=${workoutId}`, 'GET');
};

export const finishWorkoutSession = async (sessionData: any) => {
    return request('/user/workout/session', 'POST', sessionData);
};

export default request;
