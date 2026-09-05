import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/modules/auth';
import { registrarPushToken, useRegistrarPushToken } from '@/modules/notificacoes';
import { AppHybridLayout } from '@/shared/components/layout/AppHybridLayout';

export default function AppLayout() {
  const token = useAuthStore(state => state.token);
  const isHydrated = useAuthStore(state => state.isHydrated);
  const { mutate: enviarPushToken } = useRegistrarPushToken();

  // Registra o push token sempre que há uma sessão autenticada — tanto logo após o
  // login quanto em todo restart do app com sessão persistida.
  useEffect(() => {
    if (!token) return;

    registrarPushToken().then((pushToken) => {
      if (pushToken) {
        enviarPushToken(pushToken);
      }
    });
  }, [token]);

  // Aguarda a restauração da sessão salva (SecureStore/localStorage) antes de decidir
  // se redireciona para o login — sem isso, um F5 na Web (ou restart no Mobile) chuta
  // um usuário autenticado para fora enquanto o estado ainda não foi carregado.
  if (!isHydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-finance-fundo dark:bg-slate-900">
        <ActivityIndicator />
      </View>
    );
  }

  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  return <AppHybridLayout />;
}
