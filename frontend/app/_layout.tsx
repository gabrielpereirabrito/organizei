import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { loadPrivacyState } from '@/shared/stores/privacy.store';
import { loadThemeState } from '@/shared/stores/theme.store';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/shared/components/ui/ToastConfig';
import '../global.css';

const queryClient = new QueryClient();

export default function RootLayout() {
  useEffect(() => {
    loadPrivacyState();
    loadThemeState();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Slot />
        <Toast config={toastConfig} />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
