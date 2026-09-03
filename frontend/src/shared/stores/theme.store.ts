import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

type ThemeType = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: ThemeType;
  setTheme: (newTheme: ThemeType) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'system', // O padrão decidido foi acompanhar o sistema
  setTheme: (newTheme) => {
    set({ theme: newTheme });
    if (Platform.OS !== 'web') {
      SecureStore.setItemAsync('theme_preference', newTheme);
    } else {
      localStorage.setItem('theme_preference', newTheme);
    }
  },
}));

export const loadThemeState = async () => {
  let savedTheme: ThemeType = 'system';
  try {
    if (Platform.OS !== 'web') {
      const stored = await SecureStore.getItemAsync('theme_preference');
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        savedTheme = stored as ThemeType;
      }
    } else {
      const stored = localStorage.getItem('theme_preference');
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        savedTheme = stored as ThemeType;
      }
    }
  } catch (error) {
    console.error('Failed to load theme state', error);
  }
  useThemeStore.setState({ theme: savedTheme });
};
