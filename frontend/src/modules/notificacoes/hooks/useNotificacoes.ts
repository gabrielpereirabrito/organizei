import { useMutation } from '@tanstack/react-query';
import { api } from '@/shared/api-client/api';

export function useRegistrarPushToken() {
  return useMutation({
    mutationFn: async (pushToken: string) => {
      await api.patch('/usuarios/push-token', { pushToken });
    },
  });
}
