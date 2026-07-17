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

export const transacoesKeys = {
  all: ['transacoes'] as const,
  lists: () => [...transacoesKeys.all, 'list'] as const,
  list: (filtros: any) => [...transacoesKeys.lists(), filtros] as const,
  resumo: (mes: number, ano: number) => [...transacoesKeys.all, 'resumo', { mes, ano }] as const,
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
