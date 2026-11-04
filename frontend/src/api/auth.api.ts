import axiosClient from './axiosClient';

export interface User {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
    systemRole: string;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface RegisterDto {
    email: string;
    password: string;
    fullName: string;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
}

export const authApi = {

    login: (data: LoginDto): Promise<AuthResponse> => {
        return axiosClient.post('/auth/login', data);
    },

    register: (data: RegisterDto): Promise<AuthResponse> => {
        return axiosClient.post('/auth/register', data);
    },

    getProfile: (): Promise<User> => {
        return axiosClient.get('/auth/me');
    },
};
