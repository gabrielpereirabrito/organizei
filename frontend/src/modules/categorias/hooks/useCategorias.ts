import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api-client/api';
import { transacoesKeys } from '@/modules/transacoes/hooks/useTransacoes';
import { subcategoriasKeys, type ISubcategoria } from './useSubcategorias';

export interface ICategoria {
  id: string;
  nome: string;
  cor: string;
  icone?: string | null;
  // O backend aceita e devolve os três: TRANSFERENCIA é a categoria-sistema
  // usada nas transferências entre contas.
  tipo: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA';
  ativa: boolean;
  usuarioId: string;
  criadoEm: string;
  // `GET /categorias` já traz as subcategorias ativas embutidas, então o
  // formulário de transação monta os chips sem uma segunda requisição.
  subcategorias?: ISubcategoria[];
}

export const categoriasKeys = {
  all: ['categorias'] as const,
  lists: () => [...categoriasKeys.all, 'list'] as const,
};

/**
 * Invalida tudo que depende de categoria.
 *
 * Renomear, inativar ou excluir uma categoria muda o que o extrato e o
 * dashboard exibem (ambos trazem nome e cor da categoria embutidos na
 * resposta), então invalidar só a lista de categorias deixaria essas telas
 * com dados velhos. Mesmo raciocínio de `useDeletarConta`.
 */
function useInvalidarCategorias() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: categoriasKeys.all });
    queryClient.invalidateQueries({ queryKey: subcategoriasKeys.all });
    queryClient.invalidateQueries({ queryKey: transacoesKeys.all });
  };
}

export function useCategorias() {
  return useQuery({
    queryKey: categoriasKeys.lists(),
    queryFn: async () => {
      const { data } = await api.get<ICategoria[]>('/categorias');
      return data;
    },
  });
}

export function useCriarCategoria() {
  const invalidar = useInvalidarCategorias();

  return useMutation({
    mutationFn: async (novaCategoria: {
      nome: string;
      cor: string;
      icone?: string;
      tipo: 'RECEITA' | 'DESPESA';
    }) => {
      const { data } = await api.post('/categorias', novaCategoria);
      return data;
    },
    onSuccess: invalidar,
  });
}

export function useAtualizarCategoria() {
  const invalidar = useInvalidarCategorias();

  return useMutation({
    mutationFn: async ({
      id,
      ...updateData
    }: {
      id: string;
      nome?: string;
      cor?: string;
      icone?: string;
    }) => {
      const { data } = await api.put(`/categorias/${id}`, updateData);
      return data;
    },
    onSuccess: invalidar,
  });
}

export function useDeletarCategoria() {
  const invalidar = useInvalidarCategorias();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/categorias/${id}`);
    },
    onSuccess: invalidar,
  });
}

export function useInativarCategoria() {
  const invalidar = useInvalidarCategorias();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/categorias/${id}/inativar`);
    },
    onSuccess: invalidar,
  });
}

export function useAtivarCategoria() {
  const invalidar = useInvalidarCategorias();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/categorias/${id}/ativar`);
    },
    onSuccess: invalidar,
  });
}
