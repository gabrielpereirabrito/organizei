import React, { useRef, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { useTransacoes, useDeletarTransacao, ITransacao } from '../../hooks/useTransacoes';
import { NovaTransacaoSheet, BottomSheetRef } from '../../components/NovaTransacaoSheet';
import { Card, Button, ThemeToggle, IconButton, Skeleton, EmptyState, ConfirmDialog, StatusBadge, ChoiceChip, ChoiceChipGroup } from '@/shared/components/ui';
import { useFormatarMoeda } from '@/shared/utils/currency';
import { Plus, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight, Receipt } from 'lucide-react-native';
import { usePrivacyStore } from '@/shared/stores/privacy.store';
import { MotiView } from 'moti';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

type StatusFiltro = 'PENDENTE' | 'PAGA' | 'VENCIDA' | undefined;

const STATUS_BADGE: Record<ITransacao['status'], { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  PAGA: { label: 'Paga', variant: 'success' },
  PENDENTE: { label: 'Prevista', variant: 'warning' },
  VENCIDA: { label: 'Vencida', variant: 'danger' },
};

export function TransacoesPage() {
  const [dataFiltro, setDataFiltro] = useState(() => new Date());
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>(undefined);
  const [transacaoParaExcluir, setTransacaoParaExcluir] = useState<string | null>(null);

  const getFiltros = () => {
    const start = new Date(dataFiltro.getFullYear(), dataFiltro.getMonth(), 1);
    const end = new Date(dataFiltro.getFullYear(), dataFiltro.getMonth() + 1, 0, 23, 59, 59);
    return { dataInicio: start.toISOString(), dataFim: end.toISOString(), status: statusFiltro };
  };

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTransacoes(getFiltros());
  const transacoes = data?.pages.flatMap(pagina => pagina.data) ?? [];
  const { mutate: deletar, isPending: isDeletando } = useDeletarTransacao();
  const formatarMoeda = useFormatarMoeda();
  const bottomSheetRef = useRef<BottomSheetRef>(null);
  const { isOculto, togglePrivacy } = usePrivacyStore();

  const handlePrevMonth = () => {
    setDataFiltro(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setDataFiltro(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleOpenSheet = () => bottomSheetRef.current?.expand();

  const handleConfirmDelete = () => {
    if (!transacaoParaExcluir) return;
    deletar(transacaoParaExcluir, { onSettled: () => setTransacaoParaExcluir(null) });
  };

  const renderItem = ({ item, index }: { item: ITransacao, index: number }) => {
    const isReceita = item.tipo === 'RECEITA';
    const isTransferencia = item.tipo === 'TRANSFERENCIA';

    return (
      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 220, delay: Math.min(index, 8) * 40 }}
      >
        <Card className="mb-3">
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-1">
              <Text className="text-lg font-semibold text-finance-texto dark:text-white">{item.descricao}</Text>
              {isTransferencia ? (
                <Text className="text-sm text-finance-mutado mt-1">
                  De {item.conta?.nome ?? '—'} para {item.contaDestino?.nome ?? '—'}
                </Text>
              ) : item.categoria && (
                <View className="flex-row items-center gap-1 mt-1">
                  <View className="w-2 h-2 rounded-full" style={{ backgroundColor: item.categoria.cor }} />
                  <Text className="text-sm text-finance-mutado">{item.categoria.nome}</Text>
                </View>
              )}
            </View>
            <Text className={`text-lg font-bold ${isTransferencia ? 'text-finance-primaria' : isReceita ? 'text-finance-verde' : 'text-finance-vermelho'}`}>
              {isTransferencia ? '⇄' : isReceita ? '+' : '-'} {formatarMoeda(item.valor)}
            </Text>
          </View>
          <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
            <View className="flex-row items-center gap-2">
              <Text className="text-sm text-finance-mutado">
                {new Date(item.dataVencimento).toLocaleDateString('pt-BR')}
              </Text>
              <StatusBadge label={STATUS_BADGE[item.status].label} variant={STATUS_BADGE[item.status].variant} />
            </View>
            <IconButton
              icon={Trash2}
              shape="square"
              variant="danger"
              size="sm"
              onPress={() => setTransacaoParaExcluir(item.id)}
            />
          </View>
        </Card>
      </MotiView>
    );
  };

  return (
    <View className="flex-1 bg-finance-fundo dark:bg-slate-900 p-6">
      <View className="flex-row justify-between items-center mb-6">
        <View className="flex-row items-center gap-3">
          <Text className="text-3xl font-bold text-finance-texto dark:text-white">Extrato</Text>
          <ThemeToggle style={{ marginBottom: 0 }} />
          <IconButton icon={isOculto ? EyeOff : Eye} onPress={togglePrivacy} />
        </View>
        <Button size="sm" onPress={handleOpenSheet}>
          <Plus size={20} color="#fff" />
          <Text className="text-white font-medium ml-2">Nova</Text>
        </Button>
      </View>

      <View className="flex-row justify-between items-center bg-white dark:bg-slate-800 rounded-2xl p-2 mb-4 shadow-sm border border-slate-100 dark:border-slate-700">
        <IconButton icon={ChevronLeft} variant="ghost" onPress={handlePrevMonth} />
        <Text className="text-lg font-bold text-finance-texto dark:text-white capitalize">
          {MESES[dataFiltro.getMonth()]} {dataFiltro.getFullYear()}
        </Text>
        <IconButton icon={ChevronRight} variant="ghost" onPress={handleNextMonth} />
      </View>

      <ChoiceChipGroup className="mb-6">
        <ChoiceChip label="Todas" selected={statusFiltro === undefined} onPress={() => setStatusFiltro(undefined)} />
        <ChoiceChip label="Previstas" selected={statusFiltro === 'PENDENTE'} variant="warning" onPress={() => setStatusFiltro('PENDENTE')} />
        <ChoiceChip label="Pagas" selected={statusFiltro === 'PAGA'} variant="success" onPress={() => setStatusFiltro('PAGA')} />
        <ChoiceChip label="Vencidas" selected={statusFiltro === 'VENCIDA'} variant="danger" onPress={() => setStatusFiltro('VENCIDA')} />
      </ChoiceChipGroup>

      {isLoading ? (
        <View>
          <Skeleton className="h-24 rounded-2xl mb-3" />
          <Skeleton className="h-24 rounded-2xl mb-3" />
          <Skeleton className="h-24 rounded-2xl mb-3" />
        </View>
      ) : isError ? (
        <EmptyState title="Erro ao carregar transações" />
      ) : (
        <FlatList
          data={transacoes}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.3}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          ListEmptyComponent={
            <EmptyState icon={Receipt} title="Nenhuma transação encontrada" description="Adicione sua primeira transação para começar." />
          }
          ListFooterComponent={
            hasNextPage ? (
              <Button variant="ghost" onPress={() => fetchNextPage()} isLoading={isFetchingNextPage} className="mt-2">
                Carregar mais
              </Button>
            ) : null
          }
        />
      )}

      <NovaTransacaoSheet ref={bottomSheetRef} />

      <ConfirmDialog
        visible={!!transacaoParaExcluir}
        onClose={() => setTransacaoParaExcluir(null)}
        onConfirm={handleConfirmDelete}
        title="Deletar Transação"
        description="Deseja realmente deletar esta transação? Essa ação não pode ser desfeita."
        confirmLabel="Deletar"
        destructive
        isLoading={isDeletando}
      />
    </View>
  );
}
