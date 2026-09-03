import React, { useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { MotiView } from 'moti';
import { useCategorias, useDeletarCategoria, ICategoria } from '../../hooks/useCategorias';
import { Button, Card, Modal, Input, IconButton, EmptyState, Skeleton, ConfirmDialog } from '@/shared/components/ui';
import { Plus, Trash2, Edit2, Tag } from 'lucide-react-native';
import { useCriarCategoria } from '../../hooks/useCategorias';
import { toastService } from '@/shared/services/toast.service';

export function CategoriasPage() {
  const { data: categorias, isLoading, isError } = useCategorias();
  const { mutate: deletar, isPending: isDeletando } = useDeletarCategoria();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoriaParaExcluir, setCategoriaParaExcluir] = useState<string | null>(null);

  const handleConfirmDelete = () => {
    if (!categoriaParaExcluir) return;
    deletar(categoriaParaExcluir, { onSettled: () => setCategoriaParaExcluir(null) });
  };

  const renderItem = ({ item, index }: { item: ICategoria; index: number }) => (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 220, delay: Math.min(index, 8) * 40 }}
    >
      <Card className="mb-3 flex-row justify-between items-center">
        <View className="flex-row items-center gap-3">
          <View className="w-4 h-4 rounded-full" style={{ backgroundColor: item.cor }} />
          <View>
            <Text className="text-lg font-semibold text-slate-800 dark:text-white">{item.nome}</Text>
            <Text className={item.tipo === 'RECEITA' ? 'text-finance-verde' : 'text-finance-vermelho'}>
              {item.tipo === 'RECEITA' ? 'Receita' : 'Despesa'}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-2">
          <IconButton icon={Edit2} shape="square" size="sm" />
          <IconButton icon={Trash2} shape="square" variant="danger" size="sm" onPress={() => setCategoriaParaExcluir(item.id)} />
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
        title="Deletar Categoria"
        description="Deseja realmente deletar esta categoria? Essa ação não pode ser desfeita."
        confirmLabel="Deletar"
        destructive
        isLoading={isDeletando}
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
