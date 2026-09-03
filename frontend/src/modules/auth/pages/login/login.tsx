import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/shared/api-client/api';
import { useAuthStore } from '../../stores/auth.store';
import { toastService } from '@/shared/services/toast.service';
import { ThemeToggle, Checkbox, Input, Button, IconButton } from '@/shared/components/ui';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Fingerprint } from 'lucide-react-native';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [savedCredentialsExist, setSavedCredentialsExist] = useState(false);

  const router = useRouter();
  const setAuth = useAuthStore(state => state.setAuth);

  useEffect(() => {
    checkSavedCredentialsAndBiometrics();
  }, []);

  async function checkSavedCredentialsAndBiometrics() {
    try {
      const savedEmail = await SecureStore.getItemAsync('saved_email');
      const savedPassword = await SecureStore.getItemAsync('saved_password');

      if (savedEmail && savedPassword) {
        setEmail(savedEmail);
        setSenha(savedPassword);
        setRememberMe(true);
        setSavedCredentialsExist(true);

        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (compatible && enrolled) {
          setHasBiometrics(true);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar credenciais salvas:', error);
    }
  }

  async function handleBiometricLogin() {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Entrar com Biometria',
        cancelLabel: 'Cancelar',
        fallbackLabel: 'Usar Senha',
      });

      if (result.success) {
        handleLogin(); 
      }
    } catch (error) {
      console.error('Erro na biometria:', error);
    }
  }

  async function handleLogin() {
    if (!email || !senha) return toastService.error('Campos obrigatórios', 'Preencha seu e-mail e senha.');
    setIsLoading(true);
    toastService.info('Entrando...', 'Verificando credenciais');
    try {
      const { data } = await api.post('/auth/login', { email, senha });
      await setAuth(data.usuario, data.token, data.refreshToken);

      if (rememberMe) {
        await SecureStore.setItemAsync('saved_email', email);
        await SecureStore.setItemAsync('saved_password', senha);
      } else {
        await SecureStore.deleteItemAsync('saved_email');
        await SecureStore.deleteItemAsync('saved_password');
      }

      toastService.success('Bem-vindo(a) de volta!', 'Login efetuado com sucesso.');
      router.replace('/(app)');
    } catch (error: any) {
      toastService.error('Erro no login', error.response?.data?.message || 'Verifique suas credenciais.');
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
        <Text className="text-3xl font-bold mb-8 text-finance-texto dark:text-white">Login</Text>
        
        <View className="gap-4">
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

          <Checkbox
            checked={rememberMe}
            onChange={setRememberMe}
            label="Lembrar-me"
            className="mt-1"
          />

          <View className="flex-row gap-3 mt-4">
            <Button
              onPress={handleLogin}
              isLoading={isLoading}
              disabled={!email || !senha}
              className="flex-1"
            >
              Entrar
            </Button>

            {hasBiometrics && savedCredentialsExist && (
              <IconButton
                icon={Fingerprint}
                shape="square"
                variant="primary"
                onPress={handleBiometricLogin}
                disabled={isLoading}
                className="w-14 h-12"
              />
            )}
          </View>

          <TouchableOpacity onPress={() => router.push('/(auth)/cadastro')} className="mt-4">
            <Text className="text-finance-primaria text-center font-medium">Não possui conta? Cadastre-se</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
