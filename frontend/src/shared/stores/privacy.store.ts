import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface PrivacyState {
  isOculto: boolean;
  togglePrivacy: () => void;
}

export const usePrivacyStore = create<PrivacyState>((set, get) => ({
  isOculto: false, // Default: visível
  togglePrivacy: () => {
    const newState = !get().isOculto;
    set({ isOculto: newState });
    // Salvar preferência localmente
    if (Platform.OS !== 'web') {
      SecureStore.setItemAsync('privacy_mode', newState ? '1' : '0');
    } else {
      localStorage.setItem('privacy_mode', newState ? '1' : '0');
    }
  },
}));

// Load initial state
export const loadPrivacyState = async () => {
  let isOculto = false;
  try {
    if (Platform.OS !== 'web') {
      const stored = await SecureStore.getItemAsync('privacy_mode');
      isOculto = stored === '1';
    } else {
      const stored = localStorage.getItem('privacy_mode');
      isOculto = stored === '1';
    }
    usePrivacyStore.setState({ isOculto });
  } catch (error) {
    console.error('Failed to load privacy state', error);
  }
};
