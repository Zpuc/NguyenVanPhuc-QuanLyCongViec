import { create } from 'zustand';
import type { User } from '../api/auth.api';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    setAuth: (user: User, token: string) => void;
    logout: () => void;
}

const savedToken = localStorage.getItem('access_token');
const savedUser = localStorage.getItem('user_info');

export const useAuthStore = create<AuthState>((set) => ({
    user: savedUser ? JSON.parse(savedUser) : null,
    token: savedToken || null,
    isAuthenticated: !!savedToken,
    setAuth: (user, token) => {
        localStorage.setItem('access_token', token);
        localStorage.setItem('user_info', JSON.stringify(user));

        set({ user, token, isAuthenticated: true });
    },

    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_info');
        set({ user: null, token: null, isAuthenticated: false });
    },
}));
