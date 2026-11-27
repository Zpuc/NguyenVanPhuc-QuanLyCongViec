import axiosClient from './axiosClient';
import { resolveMediaUrl } from '../config/env';

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

export interface UpdateProfileDto {
    fullName: string;
}

export interface ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
}

export const formatAvatarUrl = (url?: string | null): string | undefined => {
    return resolveMediaUrl(url);
};

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

    updateProfile: (data: UpdateProfileDto): Promise<User> => {
        return axiosClient.patch('/auth/profile', data);
    },

    uploadAvatar: (file: File): Promise<User> => {
        const formData = new FormData();
        formData.append('avatar', file);
        return axiosClient.patch('/auth/profile/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    changePassword: (data: ChangePasswordDto): Promise<{ message: string }> => {
        return axiosClient.patch('/auth/change-password', data);
    },
};
