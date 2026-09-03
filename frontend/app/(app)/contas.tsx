import React, { useRef, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { useContas, useDeletarConta, IConta } from '@/modules/contas/hooks/useContas';
import { NovaContaSheet, BottomSheetRef } from '@/modules/contas/components/NovaContaSheet';
import { ContaCard } from '@/modules/contas/components/ContaCard';
import { Button, ThemeToggle, IconButton, Skeleton, EmptyState, ConfirmDialog } from '@/shared/components/ui';
import { Plus, Eye, EyeOff, Wallet } from 'lucide-react-native';
import { usePrivacyStore } from '@/shared/stores/privacy.store';
import { toastService } from '@/shared/services/toast.service';
import { MotiView } from 'moti';

export default function ContasPage() {
  const { data, isLoading, isError } = useContas();
  const { mutate: deletarConta, isPending: isDeletando } = useDeletarConta();
  const bottomSheetRef = useRef<BottomSheetRef>(null);
  const [contaParaExcluir, setContaParaExcluir] = useState<string | null>(null);

  const { isOculto, togglePrivacy } = usePrivacyStore();

  const handleOpenSheet = () => bottomSheetRef.current?.expand();

  const handleConfirmDelete = () => {
    if (!contaParaExcluir) return;
    deletarConta(contaParaExcluir, {
      onSuccess: () => setContaParaExcluir(null),
      onError: (error: any) => {
        setContaParaExcluir(null);
        const mensagem = error?.response?.data?.message ?? 'Não foi possível excluir esta conta.';
        toastService.error('Não foi possível excluir', mensagem);
      },
    });
  };

  const handleEdit = (conta: IConta) => {
    toastService.info('Em breve', 'A edição de contas será implementada em breve.');
  };

  const renderItem = ({ item, index }: { item: IConta, index: number }) => (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 220, delay: Math.min(index, 8) * 40 }}
    >
      <ContaCard conta={item} onDelete={setContaParaExcluir} onEdit={handleEdit} />
    </MotiView>
  );

  return (
    <View className="flex-1 bg-finance-fundo dark:bg-slate-900 p-6">
      <View className="flex-row justify-between items-center mb-6 mt-4">
        <View className="flex-row items-center gap-3">
          <Text className="text-3xl font-bold text-finance-texto dark:text-white">Contas</Text>
          <ThemeToggle style={{ marginBottom: 0 }} />
          <IconButton icon={isOculto ? EyeOff : Eye} onPress={togglePrivacy} />
        </View>
        <Button size="sm" onPress={handleOpenSheet}>
          <Plus size={20} color="#fff" />
          <Text className="text-white font-medium ml-2">Nova</Text>
        </Button>
      </View>

      {isLoading ? (
        <View>
          <Skeleton className="h-28 rounded-2xl mb-3" />
          <Skeleton className="h-28 rounded-2xl mb-3" />
          <Skeleton className="h-28 rounded-2xl mb-3" />
        </View>
      ) : isError ? (
        <EmptyState title="Erro ao carregar as contas" />
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState icon={Wallet} title="Você ainda não possui contas cadastradas" description="Crie sua primeira conta para começar a organizar suas finanças." />
          }
        />
      )}

      <NovaContaSheet ref={bottomSheetRef} />

      <ConfirmDialog
        visible={!!contaParaExcluir}
        onClose={() => setContaParaExcluir(null)}
        onConfirm={handleConfirmDelete}
        title="Deletar Conta?"
        description="Esta ação não pode ser desfeita. Contas com transações ou recorrências vinculadas não podem ser excluídas — apenas inativadas, para preservar o histórico financeiro."
        confirmLabel="Excluir Permanentemente"
        destructive
        isLoading={isDeletando}
      />
    </View>
  );
}
