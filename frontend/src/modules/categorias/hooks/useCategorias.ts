import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api-client/api';

export interface ICategoria {
  id: string;
  nome: string;
  cor: string;
  tipo: 'RECEITA' | 'DESPESA';
  ativo: boolean;
  usuarioId: string;
  criadoEm: string;
}

export const categoriasKeys = {
  all: ['categorias'] as const,
  lists: () => [...categoriasKeys.all, 'list'] as const,
};

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
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (novaCategoria: { nome: string; cor: string; tipo: 'RECEITA' | 'DESPESA' }) => {
      const { data } = await api.post('/categorias', novaCategoria);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriasKeys.lists() });
    },
  });
}

export function useAtualizarCategoria() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string; nome: string; cor: string }) => {
      const { data } = await api.put(`/categorias/${id}`, updateData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriasKeys.lists() });
    },
  });
}

export function useDeletarCategoria() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/categorias/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriasKeys.lists() });
    },
  });
}

export function useInativarCategoria() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/categorias/${id}/inativar`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriasKeys.lists() });
    },
  });
}
