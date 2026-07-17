import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export interface IUsuario {
  id: string;
  nome: string;
  email: string;
}

export interface IAuthUiState {
  usuario: IUsuario | null;
  token: string | null;
  setAuth: (usuario: IUsuario, token: string) => Promise<void>;
  limparAuth: () => Promise<void>;
}

export const useAuthStore = create<IAuthUiState>()((set) => ({
  usuario: null,
  token: null,

  setAuth: async (usuario, token) => {
    // Persiste o token de forma nativa e segura se não for Web
    if (Platform.OS !== 'web') {
      try {
        await SecureStore.setItemAsync('token', token);
      } catch (error) {
        console.error('Erro ao salvar token no SecureStore', error);
      }
    }
    set({ usuario, token });
  },

  limparAuth: async () => {
    // Remove o token do mobile no logout
    if (Platform.OS !== 'web') {
      try {
        await SecureStore.deleteItemAsync('token');
      } catch (error) {
        console.error('Erro ao deletar token no SecureStore', error);
      }
    }
    set({ usuario: null, token: null });
  },
}));
