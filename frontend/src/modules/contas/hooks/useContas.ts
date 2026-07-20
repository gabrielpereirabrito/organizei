import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api-client/api';

export type TipoConta = 'CORRENTE' | 'POUPANCA' | 'CARTEIRA' | 'INVESTIMENTO';

export interface IConta {
  id: string;
  nome: string;
  tipo: TipoConta;
  saldoAtual: number; // Em centavos
  ativa: boolean;
}

export const contasKeys = {
  all: ['contas'] as const,
  lists: () => [...contasKeys.all, 'list'] as const,
};

export function useContas() {
  return useQuery({
    queryKey: contasKeys.lists(),
    queryFn: async () => {
      const { data } = await api.get<IConta[]>('/contas');
      return data;
    },
  });
}

export interface INovaConta {
  nome: string;
  tipo: TipoConta;
  saldoInicial: number;
}

export function useCriarConta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nova: INovaConta) => {
      const { data } = await api.post('/contas', nova);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contasKeys.all });
    }
  });
}

export function useDeletarConta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/contas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contasKeys.all });
    },
  });
}
