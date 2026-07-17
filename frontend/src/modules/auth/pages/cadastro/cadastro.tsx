import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/shared/api-client/api';
import { useAuthStore } from '../../stores/auth.store';

export function CadastroPage() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore(state => state.setAuth);

  async function handleCadastro() {
    if (!nome || !email || !senha) return Alert.alert('Erro', 'Preencha todos os campos');
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/cadastro', { nome, email, senha });
      await setAuth(data.usuario, data.token);
      router.replace('/(app)');
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.message || 'Erro ao realizar cadastro');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View className="flex-1 justify-center px-6 bg-white dark:bg-slate-900">
      <Text className="text-3xl font-bold mb-8 text-slate-900 dark:text-white">Criar Conta</Text>
      
      <View className="gap-4">
        <TextInput 
          className="border border-slate-300 dark:border-slate-700 rounded-lg p-4 text-slate-900 dark:text-white"
          placeholder="Nome completo"
          placeholderTextColor="#94a3b8"
          value={nome}
          onChangeText={setNome}
        />
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
          onPress={handleCadastro}
          disabled={isLoading}
        >
          <Text className="text-white font-semibold text-lg">
            {isLoading ? 'Cadastrando...' : 'Cadastrar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-slate-500 text-center font-medium">Já possui conta? Voltar ao Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
