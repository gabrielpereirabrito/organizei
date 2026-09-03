import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { loadPrivacyState } from '@/shared/stores/privacy.store';
import { loadThemeState, useThemeStore } from '@/shared/stores/theme.store';
import { loadAuthState } from '@/modules/auth/stores/auth.store';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/shared/components/ui/ToastConfig';
import { useColorScheme } from 'nativewind';
import { Appearance } from 'react-native';
import '../global.css';

const queryClient = new QueryClient();

export default function RootLayout() {
  const { theme } = useThemeStore();
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    loadPrivacyState();
    loadThemeState();
    loadAuthState();
  }, []);

  useEffect(() => {
    let resolvedTheme: 'light' | 'dark' = 'light';
    if (theme === 'system') {
      resolvedTheme = Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
    } else {
      resolvedTheme = theme as 'light' | 'dark';
    }
    setColorScheme(resolvedTheme);
  }, [theme, setColorScheme]);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme: osScheme }) => {
      if (theme === 'system') {
        setColorScheme(osScheme === 'dark' ? 'dark' : 'light');
      }
    });
    return () => sub.remove();
  }, [theme, setColorScheme]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Slot />
        <Toast config={toastConfig} />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
