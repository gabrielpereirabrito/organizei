import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api-client/api';
import { transacoesKeys } from '@/modules/transacoes/hooks/useTransacoes';

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
      // Excluir uma conta apaga em cascata as transações dela (schema.prisma),
      // então o extrato e o dashboard também ficam desatualizados.
      queryClient.invalidateQueries({ queryKey: transacoesKeys.all });
    },
  });
}

/**
 * Ativa ou inativa uma conta. `ativa` é o estado DESEJADO, não o atual.
 *
 * Inativar é o caminho padrão para tirar uma conta de circulação: o backend
 * recusa (409) excluir contas com histórico, justamente para não apagar o
 * extrato vinculado em cascata.
 */
export function useAlternarStatusConta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ativa }: { id: string; ativa: boolean }) => {
      const acao = ativa ? 'ativar' : 'inativar';
      const { data } = await api.patch<IConta>(`/contas/${id}/${acao}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contasKeys.all });
      // O saldo inicial da projeção de fluxo de caixa soma apenas contas ativas
      // (`projecaoFluxoCaixa` no backend), então o gráfico precisa ser refeito.
      queryClient.invalidateQueries({ queryKey: transacoesKeys.all });
    },
  });
}
