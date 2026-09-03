import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/shared/api-client/api';
import { useAuthStore } from '../../stores/auth.store';
import { toastService } from '@/shared/services/toast.service';
import { Input, Button, ThemeToggle } from '@/shared/components/ui';

export function CadastroPage() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore(state => state.setAuth);

  async function handleCadastro() {
    if (!nome || !email || !senha) return toastService.error('Campos obrigatórios', 'Preencha todos os campos.');
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/cadastro', { nome, email, senha });
      await setAuth(data.usuario, data.token, data.refreshToken);
      toastService.success('Conta criada!', 'Bem-vindo(a) ao Organizei.');
      router.replace('/(app)');
    } catch (error: any) {
      toastService.error('Erro no cadastro', error.response?.data?.message || 'Não foi possível criar sua conta.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View className="flex-1 px-6 bg-finance-fundo dark:bg-slate-900 justify-center">
      <View className="absolute top-16 right-6">
        <ThemeToggle />
      </View>

      <View className="justify-center">
        <Text className="text-3xl font-bold mb-8 text-finance-texto dark:text-white">Criar Conta</Text>

        <View className="gap-4">
          <Input
            placeholder="Nome completo"
            value={nome}
            onChangeText={setNome}
          />
          <Input
            placeholder="E-mail"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Input
            placeholder="Senha"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
          />

          <Button
            onPress={handleCadastro}
            isLoading={isLoading}
            disabled={!nome || !email || !senha}
            className="mt-4"
          >
            Cadastrar
          </Button>

          <TouchableOpacity onPress={() => router.back()} className="mt-4">
            <Text className="text-finance-mutado dark:text-slate-400 text-center font-medium">Já possui conta? Voltar ao Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
