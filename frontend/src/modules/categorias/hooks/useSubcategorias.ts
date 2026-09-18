import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api-client/api';
import { transacoesKeys } from '@/modules/transacoes/hooks/useTransacoes';
import { categoriasKeys } from './useCategorias';

export interface ISubcategoria {
  id: string;
  nome: string;
  icone?: string | null;
  cor?: string | null;
  ativa: boolean;
  categoriaId: string;
  usuarioId: string;
  criadoEm: string;
}

export const subcategoriasKeys = {
  all: ['subcategorias'] as const,
  list: (categoriaId?: string) => [...subcategoriasKeys.all, 'list', categoriaId ?? 'todas'] as const,
};

/** Ver a explicação em `useInvalidarCategorias` — as duas listas andam juntas. */
function useInvalidarSubcategorias() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: subcategoriasKeys.all });
    queryClient.invalidateQueries({ queryKey: categoriasKeys.all });
    queryClient.invalidateQueries({ queryKey: transacoesKeys.all });
  };
}

/**
 * Lista as subcategorias, opcionalmente de uma única categoria.
 *
 * Traz ativas E inativas — é a fonte da tela de gerenciamento. O formulário de
 * transação não usa este hook: ele lê `categoria.subcategorias`, que o
 * `GET /categorias` já devolve filtrado por `ativa: true`.
 */
export function useSubcategorias(categoriaId?: string) {
  return useQuery({
    queryKey: subcategoriasKeys.list(categoriaId),
    queryFn: async () => {
      const { data } = await api.get<ISubcategoria[]>('/subcategorias', {
        params: categoriaId ? { categoriaId } : undefined,
      });
      return data;
    },
  });
}

export function useCriarSubcategoria() {
  const invalidar = useInvalidarSubcategorias();

  return useMutation({
    mutationFn: async (novaSubcategoria: {
      categoriaId: string;
      nome: string;
      icone?: string;
      cor?: string;
    }) => {
      const { data } = await api.post<ISubcategoria>('/subcategorias', novaSubcategoria);
      return data;
    },
    onSuccess: invalidar,
  });
}

export function useAtualizarSubcategoria() {
  const invalidar = useInvalidarSubcategorias();

  return useMutation({
    // `categoriaId` não entra: o backend não permite mover uma subcategoria de
    // categoria, porque isso realocaria transações já lançadas.
    mutationFn: async ({
      id,
      ...updateData
    }: {
      id: string;
      nome?: string;
      icone?: string;
      cor?: string;
    }) => {
      const { data } = await api.put<ISubcategoria>(`/subcategorias/${id}`, updateData);
      return data;
    },
    onSuccess: invalidar,
  });
}

export function useDeletarSubcategoria() {
  const invalidar = useInvalidarSubcategorias();

  return useMutation({
    // Devolve 409 quando há transações, metas ou recorrências vinculadas — a
    // tela trata esse caso oferecendo inativar.
    mutationFn: async (id: string) => {
      await api.delete(`/subcategorias/${id}`);
    },
    onSuccess: invalidar,
  });
}

/** `ativa` é o estado DESEJADO, não o atual. */
export function useAlternarAtivaSubcategoria() {
  const invalidar = useInvalidarSubcategorias();

  return useMutation({
    mutationFn: async ({ id, ativa }: { id: string; ativa: boolean }) => {
      await api.patch(`/subcategorias/${id}/${ativa ? 'ativar' : 'inativar'}`);
    },
    onSuccess: invalidar,
  });
}
