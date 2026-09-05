import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api-client/api';
import { ICategoria } from '@/modules/categorias';

export interface ITransacao {
  id: string;
  descricao: string;
  valor: number; // Em centavos
  tipo: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA';
  status: 'PENDENTE' | 'PAGA' | 'VENCIDA';
  dataVencimento: string; // ISO date
  dataPagamento?: string; // ISO date
  categoriaId: string;
  categoria?: ICategoria;
  contaId: string;
  conta?: { nome: string };
  contaDestinoId?: string;
  contaDestino?: { nome: string };
}

export interface IResumoMensal {
  totalReceitasPrevistas: number;
  totalDespesasPrevistas: number;
  totalReceitasPagas: number;
  totalDespesasPagas: number;
  saldoPrevisto: number;
  saldoRealizado: number;
  gastosPorCategoria: {
    categoria: string;
    valorPrevisto: number;
    valorRealizado: number;
    cor: string | null;
  }[];
}

export interface IProjecaoFluxoCaixa {
  saldoInicial: number;
  pontos: { data: string; saldo: number }[];
}

export const transacoesKeys = {
  all: ['transacoes'] as const,
  lists: () => [...transacoesKeys.all, 'list'] as const,
  list: (filtros: any) => [...transacoesKeys.lists(), filtros] as const,
  resumo: (mes: number, ano: number) => [...transacoesKeys.all, 'resumo', { mes, ano }] as const,
  projecao: (meses: number) => [...transacoesKeys.all, 'projecao', meses] as const,
};

export function useTransacoes(filtros?: { dataInicio?: string; dataFim?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: transacoesKeys.list(filtros),
    queryFn: async () => {
      // Endpoint de transacoes agora retorna { data: [], meta: {} }
      const { data } = await api.get<{ data: ITransacao[], meta: any }>('/transacoes', { params: filtros });
      return data;
    },
  });
}

export function useResumoMensal(mes: number, ano: number) {
  return useQuery({
    queryKey: transacoesKeys.resumo(mes, ano),
    queryFn: async () => {
      const { data } = await api.get<IResumoMensal>('/transacoes/resumo-mensal', { params: { mes, ano } });
      return data;
    },
  });
}

export function useProjecaoFluxoCaixa(meses: number = 3) {
  return useQuery({
    queryKey: transacoesKeys.projecao(meses),
    queryFn: async () => {
      const { data } = await api.get<IProjecaoFluxoCaixa>('/transacoes/projecao-fluxo-caixa', { params: { meses } });
      return data;
    },
  });
}

export function useDeletarTransacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/transacoes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transacoesKeys.all });
    },
  });
}

export interface INovaTransacao {
  descricao: string;
  valor: number;
  tipo: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA';
  dataVencimento: string;
  dataPagamento?: string;
  categoriaId?: string;
  contaId: string;
  contaDestinoId?: string;
  status: 'PENDENTE' | 'PAGA' | 'VENCIDA';
}

export function useCriarTransacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nova: INovaTransacao) => {
      const { data } = await api.post('/transacoes', nova);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transacoesKeys.all });
    }
  });
}
