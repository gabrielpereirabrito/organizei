import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useCategorias, useDeletarCategoria, useInativarCategoria, ICategoria } from '../../hooks/useCategorias';
import { Button, Card, Modal, Input, IconButton, EmptyState, Skeleton, ConfirmDialog } from '@/shared/components/ui';
import { Plus, Trash2, ChevronRight, Tag } from 'lucide-react-native';
import { useCriarCategoria } from '../../hooks/useCategorias';
import { toastService } from '@/shared/services/toast.service';

export function CategoriasPage() {
  const router = useRouter();
  const { data: categorias, isLoading, isError } = useCategorias();
  const { mutate: deletar, isPending: isDeletando } = useDeletarCategoria();
  const { mutate: inativar } = useInativarCategoria();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoriaParaExcluir, setCategoriaParaExcluir] = useState<ICategoria | null>(null);
  const [categoriaParaInativar, setCategoriaParaInativar] = useState<ICategoria | null>(null);

  const handleConfirmDelete = () => {
    if (!categoriaParaExcluir) return;
    const alvo = categoriaParaExcluir;

    deletar(alvo.id, {
      onSuccess: () => {
        setCategoriaParaExcluir(null);
        toastService.success('Pronto', 'Categoria excluída.');
      },
      onError: (err: any) => {
        setCategoriaParaExcluir(null);
        // 409: há subcategorias, transações, metas ou recorrências vinculadas.
        // Excluir apagaria histórico, então oferecemos inativar.
        if (err?.response?.status === 409) {
          setCategoriaParaInativar(alvo);
          return;
        }
        toastService.error('Erro', err?.response?.data?.message ?? 'Não foi possível excluir.');
      },
    });
  };

  const renderItem = ({ item, index }: { item: ICategoria; index: number }) => (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 220, delay: Math.min(index, 8) * 40 }}
    >
      <Card className="mb-3 flex-row justify-between items-center">
        {/* O card inteiro leva ao detalhe, onde ficam a edição da categoria e o
            gerenciamento das subcategorias. */}
        <TouchableOpacity
          className="flex-row items-center gap-3 flex-1"
          onPress={() => router.push(`/(app)/categorias/${item.id}`)}
        >
          <View className="w-4 h-4 rounded-full" style={{ backgroundColor: item.cor }} />
          <View className="flex-1">
            <Text className="text-lg font-semibold text-slate-800 dark:text-white">{item.nome}</Text>
            <View className="flex-row items-center gap-2">
              <Text className={item.tipo === 'RECEITA' ? 'text-finance-verde' : 'text-finance-vermelho'}>
                {item.tipo === 'RECEITA' ? 'Receita' : 'Despesa'}
              </Text>
              {!!item.subcategorias?.length && (
                <Text className="text-finance-mutado">
                  · {item.subcategorias.length} subcategoria{item.subcategorias.length > 1 ? 's' : ''}
                </Text>
              )}
            </View>
          </View>
          <ChevronRight size={18} color="#94a3b8" />
        </TouchableOpacity>

        <View className="flex-row gap-2 ml-2">
          <IconButton icon={Trash2} shape="square" variant="danger" size="sm" onPress={() => setCategoriaParaExcluir(item)} />
        </View>
      </Card>
    </MotiView>
  );

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900 p-6">
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-3xl font-bold text-slate-900 dark:text-white">Categorias</Text>
        <Button size="sm" onPress={() => setIsModalOpen(true)}>
          <Plus size={20} color="#fff" />
          <Text className="text-white font-medium ml-2">Nova Categoria</Text>
        </Button>
      </View>

      {isLoading ? (
        <View>
          <Skeleton className="h-16 rounded-2xl mb-3" />
          <Skeleton className="h-16 rounded-2xl mb-3" />
          <Skeleton className="h-16 rounded-2xl mb-3" />
        </View>
      ) : isError ? (
        <EmptyState title="Erro ao carregar categorias" />
      ) : (
        <FlatList
          data={categorias}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState icon={Tag} title="Nenhuma categoria cadastrada" description="Crie categorias para organizar suas transações." />
          }
        />
      )}

      {/* Modal de Criação Básico (placeholder lógico) */}
      <Modal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nova Categoria"
      >
        <NovaCategoriaForm onClose={() => setIsModalOpen(false)} />
      </Modal>

      <ConfirmDialog
        visible={!!categoriaParaExcluir}
        onClose={() => setCategoriaParaExcluir(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Categoria"
        description={`Deseja realmente excluir "${categoriaParaExcluir?.nome}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        destructive
        isLoading={isDeletando}
      />

      <ConfirmDialog
        visible={!!categoriaParaInativar}
        onClose={() => setCategoriaParaInativar(null)}
        onConfirm={() => {
          if (!categoriaParaInativar) return;
          inativar(categoriaParaInativar.id);
          setCategoriaParaInativar(null);
        }}
        title="Categoria em uso"
        description={`"${categoriaParaInativar?.nome}" possui subcategorias ou lançamentos vinculados e não pode ser excluída sem apagar histórico. Deseja inativá-la? Ela deixa de aparecer no formulário de transações, mas os lançamentos antigos continuam intactos.`}
        confirmLabel="Inativar"
      />
    </View>
  );
}

function NovaCategoriaForm({ onClose }: { onClose: () => void }) {
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState('#3b82f6');
  const [tipo, setTipo] = useState<'RECEITA'|'DESPESA'>('DESPESA');
  const { mutate: criar, isPending } = useCriarCategoria();

  function handleSubmit() {
    if (!nome) return toastService.error('Campo obrigatório', 'Preencha o nome da categoria.');
    criar({ nome, cor, tipo }, {
      onSuccess: () => onClose(),
      onError: (err: any) => toastService.error('Erro ao criar categoria', err.response?.data?.message || 'Tente novamente.')
    });
  }

  return (
    <View className="gap-4">
      <Input label="Nome" value={nome} onChangeText={setNome} placeholder="Ex: Alimentação" />

      <View className="flex-row gap-4">
        <Button
          variant={tipo === 'RECEITA' ? 'primary' : 'secondary'}
          className="flex-1"
          onPress={() => setTipo('RECEITA')}
        >
          Receita
        </Button>
        <Button
          variant={tipo === 'DESPESA' ? 'danger' : 'secondary'}
          className="flex-1"
          onPress={() => setTipo('DESPESA')}
        >
          Despesa
        </Button>
      </View>

      <Button isLoading={isPending} onPress={handleSubmit} className="mt-4">
        Salvar Categoria
      </Button>
    </View>
  );
}
