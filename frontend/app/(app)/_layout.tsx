import { Redirect } from 'expo-router';
import { useAuthStore } from '@/modules/auth';
import { AppHybridLayout } from '@/shared/components/layout/AppHybridLayout';

export default function AppLayout() {
  const token = useAuthStore(state => state.token);

  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  return <AppHybridLayout />;
}
