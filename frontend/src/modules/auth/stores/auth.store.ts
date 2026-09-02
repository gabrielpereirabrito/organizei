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
  isHydrated: boolean;
  setAuth: (usuario: IUsuario, token: string, refreshToken?: string) => Promise<void>;
  limparAuth: () => Promise<void>;
}

const TOKEN_KEY = 'token';
const USUARIO_KEY = 'usuario';
// O refresh token só é persistido no Mobile: na Web ele já viaja num cookie httpOnly
// (inacessível ao JS) — guardá-lo de novo em localStorage seria expor via XSS algo que
// o backend deliberadamente protegeu.
const REFRESH_TOKEN_KEY = 'refreshToken';

async function persistirSessao(usuario: IUsuario, token: string, refreshToken?: string) {
  try {
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(USUARIO_KEY, JSON.stringify(usuario));
      if (refreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      }
    } else {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
    }
  } catch (error) {
    console.error('Erro ao persistir sessão', error);
  }
}

async function limparSessaoPersistida() {
  try {
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USUARIO_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USUARIO_KEY);
    }
  } catch (error) {
    console.error('Erro ao limpar sessão persistida', error);
  }
}

export const useAuthStore = create<IAuthUiState>()((set) => ({
  usuario: null,
  token: null,
  isHydrated: false,

  setAuth: async (usuario, token, refreshToken) => {
    await persistirSessao(usuario, token, refreshToken);
    set({ usuario, token });
  },

  limparAuth: async () => {
    await limparSessaoPersistida();
    set({ usuario: null, token: null });
  },
}));

// Usado pelo interceptor de resposta do Axios (api.ts) após um refresh bem-sucedido:
// atualiza só o access token (e, no Mobile, o refresh token rotacionado), sem mexer no
// usuário já carregado em memória.
export async function atualizarToken(token: string, refreshToken?: string) {
  try {
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      if (refreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      }
    } else {
      localStorage.setItem(TOKEN_KEY, token);
    }
  } catch (error) {
    console.error('Erro ao atualizar token', error);
  }
  useAuthStore.setState({ token });
}

// Usado pelo interceptor de resposta do Axios (api.ts) para montar o header
// `x-refresh-token` exigido pelo backend fora da Web (que não tem cookie automático).
export async function getStoredRefreshToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Erro ao ler refresh token do SecureStore', error);
    return null;
  }
}

// Restaura a sessão salva (SecureStore no Mobile, localStorage na Web) no boot do app.
// Sem isso, um F5 na Web (ou um restart do app no Mobile) zera o estado em memória do
// Zustand e derruba o usuário para o login mesmo com o cookie/token ainda válido.
export const loadAuthState = async () => {
  let usuario: IUsuario | null = null;
  let token: string | null = null;

  try {
    if (Platform.OS !== 'web') {
      token = await SecureStore.getItemAsync(TOKEN_KEY);
      const usuarioRaw = await SecureStore.getItemAsync(USUARIO_KEY);
      usuario = usuarioRaw ? JSON.parse(usuarioRaw) : null;
    } else {
      token = localStorage.getItem(TOKEN_KEY);
      const usuarioRaw = localStorage.getItem(USUARIO_KEY);
      usuario = usuarioRaw ? JSON.parse(usuarioRaw) : null;
    }
  } catch (error) {
    console.error('Falha ao restaurar sessão', error);
  }

  useAuthStore.setState({ usuario, token, isHydrated: true });
};
