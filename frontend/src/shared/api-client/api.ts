import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore, atualizarToken, getStoredRefreshToken } from '@/modules/auth/stores/auth.store';

export const api = axios.create({
  // Fallback seguro caso a variável de ambiente não esteja setada
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333',
  // Essencial para receber os Cookies HTTP-Only gerados pela Web
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  // Na Web o navegador envia o cookie automaticamente.
  // No mobile, precisamos injetar o token no header manualmente.
  if (Platform.OS !== 'web') {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Erro ao resgatar o token do SecureStore', error);
    }
  }
  return config;
});

// O access token expira em 15 min (backend `auth.ts`). Sem isto, qualquer sessão ativa
// por mais tempo passa a receber 401 silenciosamente até o usuário deslogar e logar de
// novo — o refresh token que o backend já implementa (`POST /auth/refresh`) ficava sem
// efeito por faltar este último elo no cliente.
let refreshEmAndamento: Promise<string | null> | null = null;

async function renovarSessao(): Promise<string | null> {
  if (!refreshEmAndamento) {
    refreshEmAndamento = (async () => {
      try {
        const headers: Record<string, string> = {};

        // Na Web o refreshToken viaja num cookie httpOnly, enviado automaticamente
        // via withCredentials. Fora da Web não há cookie jar, então usamos o header
        // que o backend também aceita (`request.cookies.refreshToken || headers['x-refresh-token']`).
        if (Platform.OS !== 'web') {
          const refreshToken = await getStoredRefreshToken();
          if (!refreshToken) return null;
          headers['x-refresh-token'] = refreshToken;
        }

        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true, headers }
        );

        await atualizarToken(data.token, data.refreshToken);
        return data.token as string;
      } catch (error) {
        return null;
      } finally {
        refreshEmAndamento = null;
      }
    })();
  }

  return refreshEmAndamento;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isRotaDeAuth = typeof originalRequest?.url === 'string' && originalRequest.url.includes('/auth/');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isRotaDeAuth) {
      originalRequest._retry = true;

      const novoToken = await renovarSessao();

      if (novoToken) {
        if (Platform.OS !== 'web') {
          originalRequest.headers.Authorization = `Bearer ${novoToken}`;
        }
        return api(originalRequest);
      }

      // Refresh token expirado/inválido: encerra a sessão local. O gate de navegação em
      // `(app)/_layout.tsx` reage à mudança de `token` no store e redireciona para o login.
      await useAuthStore.getState().limparAuth();
    }

    return Promise.reject(error);
  }
);
