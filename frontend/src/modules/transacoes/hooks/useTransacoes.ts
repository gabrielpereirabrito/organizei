import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api-client/api';
// Import profundo de proposito: pelo barrel viria a pagina de categorias junto,
// e o modulo de categorias ja depende de `transacoesKeys` daqui.
import { ICategoria } from '@/modules/categorias/hooks/useCategorias';
import { ISubcategoria } from '@/modules/categorias/hooks/useSubcategorias';

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
  subcategoriaId?: string | null;
  subcategoria?: ISubcategoria | null;
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
    categoriaId: string;
    categoria: string; // nome da categoria
    cor: string | null;
    valorPrevisto: number;
    valorRealizado: number;
    subcategorias: {
      subcategoriaId: string;
      nome: string;
      cor: string | null;
      valorPrevisto: number;
      valorRealizado: number;
    }[];
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

export interface IFiltrosTransacoes {
  dataInicio?: string;
  dataFim?: string;
  status?: 'PENDENTE' | 'PAGA' | 'VENCIDA';
  categoriaId?: string;
  subcategoriaId?: string;
}

interface IPaginaTransacoes {
  data: ITransacao[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

// useInfiniteQuery: cada mudança de filtro (mês, status) gera uma queryKey nova,
// o que reinicia a paginação para a página 1 automaticamente.
export function useTransacoes(filtros?: IFiltrosTransacoes, limit: number = 20) {
  return useInfiniteQuery({
    queryKey: transacoesKeys.list(filtros),
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get<IPaginaTransacoes>('/transacoes', {
        params: { ...filtros, page: pageParam, limit },
      });
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: lastPage => (lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined),
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
  subcategoriaId?: string;
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
