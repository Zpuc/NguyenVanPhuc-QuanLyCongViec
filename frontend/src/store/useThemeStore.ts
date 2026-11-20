import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>((set) => {
  const savedTheme = (localStorage.getItem('theme_mode') as ThemeMode) || 'light';
  return {
    themeMode: savedTheme,
    toggleTheme: () =>
      set((state) => {
        const nextMode = state.themeMode === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme_mode', nextMode);
        return { themeMode: nextMode };
      }),
    setThemeMode: (mode: ThemeMode) => {
      localStorage.setItem('theme_mode', mode);
      set({ themeMode: mode });
    },
  };
});
