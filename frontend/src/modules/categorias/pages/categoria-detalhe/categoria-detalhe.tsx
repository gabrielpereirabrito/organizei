import React, { useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { ArrowLeft, Plus, Trash2, Edit2, EyeOff, Eye, Tag } from 'lucide-react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import {
  Button,
  Card,
  Modal,
  Input,
  IconButton,
  EmptyState,
  Skeleton,
  ConfirmDialog,
} from '@/shared/components/ui';
import { toastService } from '@/shared/services/toast.service';
import { useCategorias, useAtualizarCategoria } from '../../hooks/useCategorias';
import {
  useSubcategorias,
  useDeletarSubcategoria,
  useAlternarAtivaSubcategoria,
  ISubcategoria,
} from '../../hooks/useSubcategorias';
import { NovaSubcategoriaSheet } from '../../components/NovaSubcategoriaSheet';

export function CategoriaDetalhePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // A categoria vem da lista já em cache: evita um GET /categorias/:id só para
  // exibir nome e cor no cabeçalho.
  const { data: categorias } = useCategorias();
  const categoria = categorias?.find(c => c.id === id);

  const { data: subcategorias, isLoading, isError } = useSubcategorias(id);
  const { mutate: deletar, isPending: isDeletando } = useDeletarSubcategoria();
  const { mutate: alternarAtiva } = useAlternarAtivaSubcategoria();

  const sheetRef = useRef<BottomSheet>(null);
  const [emEdicao, setEmEdicao] = useState<ISubcategoria | null>(null);
  const [paraExcluir, setParaExcluir] = useState<ISubcategoria | null>(null);
  const [paraInativar, setParaInativar] = useState<ISubcategoria | null>(null);
  const [isEditandoCategoria, setIsEditandoCategoria] = useState(false);

  const abrirSheet = (subcategoria: ISubcategoria | null) => {
    setEmEdicao(subcategoria);
    sheetRef.current?.expand();
  };

  const handleConfirmDelete = () => {
    if (!paraExcluir) return;
    const alvo = paraExcluir;

    deletar(alvo.id, {
      onSuccess: () => {
        setParaExcluir(null);
        toastService.success('Pronto', 'Subcategoria excluída.');
      },
      onError: (err: any) => {
        setParaExcluir(null);
        // 409: há transações, metas ou recorrências vinculadas. Excluir apagaria
        // histórico, então o caminho oferecido é inativar.
        if (err?.response?.status === 409) {
          setParaInativar(alvo);
          return;
        }
        toastService.error('Erro', err?.response?.data?.message ?? 'Não foi possível excluir.');
      },
    });
  };

  const renderItem = ({ item, index }: { item: ISubcategoria; index: number }) => (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 220, delay: Math.min(index, 8) * 40 }}
    >
      <Card className={`mb-3 flex-row justify-between items-center ${item.ativa ? '' : 'opacity-50'}`}>
        <View className="flex-row items-center gap-3 flex-1">
          <View
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: item.cor ?? categoria?.cor ?? '#94a3b8' }}
          />
          <View className="flex-1">
            <Text className="text-base font-semibold text-slate-800 dark:text-white">{item.nome}</Text>
            {!item.ativa && <Text className="text-xs text-finance-mutado">Inativa</Text>}
          </View>
        </View>

        <View className="flex-row gap-2">
          <IconButton
            icon={item.ativa ? EyeOff : Eye}
            shape="square"
            size="sm"
            onPress={() => alternarAtiva({ id: item.id, ativa: !item.ativa })}
          />
          <IconButton icon={Edit2} shape="square" size="sm" onPress={() => abrirSheet(item)} />
          <IconButton
            icon={Trash2}
            shape="square"
            variant="danger"
            size="sm"
            onPress={() => setParaExcluir(item)}
          />
        </View>
      </Card>
    </MotiView>
  );

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900 p-6">
      <TouchableOpacity className="flex-row items-center gap-2 mb-4" onPress={() => router.back()}>
        <ArrowLeft size={20} color="#64748b" />
        <Text className="text-finance-mutado">Categorias</Text>
      </TouchableOpacity>

      <View className="flex-row justify-between items-start mb-6">
        <View className="flex-row items-center gap-3 flex-1">
          <View className="w-5 h-5 rounded-full" style={{ backgroundColor: categoria?.cor }} />
          <View className="flex-1">
            <Text className="text-3xl font-bold text-slate-900 dark:text-white">
              {categoria?.nome ?? 'Categoria'}
            </Text>
            <Text
              className={categoria?.tipo === 'RECEITA' ? 'text-finance-verde' : 'text-finance-vermelho'}
            >
              {categoria?.tipo === 'RECEITA' ? 'Receita' : 'Despesa'}
            </Text>
          </View>
        </View>

        {categoria && (
          <IconButton icon={Edit2} shape="square" size="sm" onPress={() => setIsEditandoCategoria(true)} />
        )}
      </View>

      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-semibold text-slate-900 dark:text-white">Subcategorias</Text>
        <Button size="sm" onPress={() => abrirSheet(null)}>
          <Plus size={18} color="#fff" />
          <Text className="text-white font-medium ml-2">Nova</Text>
        </Button>
      </View>

      {isLoading ? (
        <View>
          <Skeleton className="h-14 rounded-2xl mb-3" />
          <Skeleton className="h-14 rounded-2xl mb-3" />
        </View>
      ) : isError ? (
        <EmptyState title="Erro ao carregar subcategorias" />
      ) : (
        <FlatList
          data={subcategorias}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon={Tag}
              title="Nenhuma subcategoria"
              description="Crie subcategorias para detalhar seus gastos dentro desta categoria."
            />
          }
        />
      )}

      {categoria && (
        <NovaSubcategoriaSheet
          ref={sheetRef}
          categoriaId={categoria.id}
          categoriaNome={categoria.nome}
          subcategoriaEmEdicao={emEdicao}
          onFechar={() => setEmEdicao(null)}
        />
      )}

      {categoria && (
        <Modal
          visible={isEditandoCategoria}
          onClose={() => setIsEditandoCategoria(false)}
          title="Editar Categoria"
        >
          <EditarCategoriaForm
            categoriaId={categoria.id}
            nomeAtual={categoria.nome}
            onClose={() => setIsEditandoCategoria(false)}
          />
        </Modal>
      )}

      <ConfirmDialog
        visible={!!paraExcluir}
        onClose={() => setParaExcluir(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Subcategoria"
        description={`Deseja realmente excluir "${paraExcluir?.nome}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        destructive
        isLoading={isDeletando}
      />

      <ConfirmDialog
        visible={!!paraInativar}
        onClose={() => setParaInativar(null)}
        onConfirm={() => {
          if (!paraInativar) return;
          alternarAtiva({ id: paraInativar.id, ativa: false });
          setParaInativar(null);
        }}
        title="Subcategoria em uso"
        description={`"${paraInativar?.nome}" possui lançamentos vinculados e não pode ser excluída sem apagar histórico. Deseja inativá-la? Ela deixa de aparecer no formulário de transações, mas os lançamentos antigos continuam intactos.`}
        confirmLabel="Inativar"
      />
    </View>
  );
}

function EditarCategoriaForm({
  categoriaId,
  nomeAtual,
  onClose,
}: {
  categoriaId: string;
  nomeAtual: string;
  onClose: () => void;
}) {
  const [nome, setNome] = useState(nomeAtual);
  const { mutate: atualizar, isPending } = useAtualizarCategoria();

  function handleSubmit() {
    if (!nome) return toastService.error('Campo obrigatório', 'Preencha o nome da categoria.');

    atualizar(
      { id: categoriaId, nome },
      {
        onSuccess: onClose,
        onError: (err: any) =>
          toastService.error('Erro', err?.response?.data?.message ?? 'Tente novamente.'),
      }
    );
  }

  return (
    <View className="gap-4">
      <Input label="Nome" value={nome} onChangeText={setNome} placeholder="Ex: Alimentação" />
      {/* O `tipo` não é editável: mudá-lo reclassificaria transações já lançadas. */}
      <Button isLoading={isPending} onPress={handleSubmit} className="mt-4">
        Salvar
      </Button>
    </View>
  );
}
