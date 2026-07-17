import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

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
