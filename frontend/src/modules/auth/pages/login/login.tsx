import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/shared/api-client/api';
import { useAuthStore } from '../../stores/auth.store';
import { toastService } from '@/shared/services/toast.service';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore(state => state.setAuth);

  async function handleLogin() {
    if (!email || !senha) return toastService.error('Campos obrigatórios', 'Preencha seu e-mail e senha.');
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, senha });
      await setAuth(data.usuario, data.token);
      toastService.success('Bem-vindo(a) de volta!', 'Login efetuado com sucesso.');
      router.replace('/(app)');
    } catch (error: any) {
      toastService.error('Erro no login', error.response?.data?.message || 'Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View className="flex-1 justify-center px-6 bg-white dark:bg-slate-900">
      <Text className="text-3xl font-bold mb-8 text-slate-900 dark:text-white">Login</Text>
      
      <View className="gap-4">
        <TextInput 
          className="border border-slate-300 dark:border-slate-700 rounded-lg p-4 text-slate-900 dark:text-white"
          placeholder="E-mail"
          placeholderTextColor="#94a3b8"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput 
          className="border border-slate-300 dark:border-slate-700 rounded-lg p-4 text-slate-900 dark:text-white"
          placeholder="Senha"
          placeholderTextColor="#94a3b8"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
        />
        <TouchableOpacity 
          className="bg-blue-600 p-4 rounded-lg items-center mt-4 opacity-90 active:opacity-100"
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text className="text-white font-semibold text-lg">
            {isLoading ? 'Entrando...' : 'Entrar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/cadastro')} className="mt-4">
          <Text className="text-blue-600 text-center font-medium">Não possui conta? Cadastre-se</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
