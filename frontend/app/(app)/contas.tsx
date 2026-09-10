import React, { useRef, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { useContas, useDeletarConta, useAlternarStatusConta, IConta } from '@/modules/contas/hooks/useContas';
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
  const { mutate: alternarStatus, isPending: isAlternando } = useAlternarStatusConta();
  const bottomSheetRef = useRef<BottomSheetRef>(null);

  const [contaParaExcluir, setContaParaExcluir] = useState<IConta | null>(null);
  const [contaParaInativar, setContaParaInativar] = useState<IConta | null>(null);
  // Preenchido quando o diálogo de inativação vem de uma exclusão recusada (409):
  // guarda a mensagem do backend, que traz as contagens de histórico vinculado.
  const [motivoInativacao, setMotivoInativacao] = useState<string | null>(null);

  const { isOculto, togglePrivacy } = usePrivacyStore();

  const handleOpenSheet = () => bottomSheetRef.current?.expand();

  const handleConfirmDelete = () => {
    if (!contaParaExcluir) return;
    const conta = contaParaExcluir;

    deletarConta(conta.id, {
      onSuccess: () => {
        setContaParaExcluir(null);
        toastService.success('Conta excluída', `"${conta.nome}" foi removida.`);
      },
      onError: (error: any) => {
        setContaParaExcluir(null);

        // 409 = a conta tem histórico vinculado e o backend recusa apagá-la em
        // cascata. Em vez de encerrar num toast de erro, oferecemos aqui o
        // caminho que o próprio backend sugere: inativar.
        if (error?.response?.status === 409) {
          setMotivoInativacao(error.response.data?.message ?? null);
          setContaParaInativar(conta);
          return;
        }

        const mensagem = error?.response?.data?.message ?? 'Não foi possível excluir esta conta.';
        toastService.error('Não foi possível excluir', mensagem);
      },
    });
  };

  const handleToggleAtiva = (conta: IConta) => {
    // Inativar tira a conta dos totais e da projeção, então pede confirmação.
    if (conta.ativa) {
      setMotivoInativacao(null);
      setContaParaInativar(conta);
      return;
    }

    // Reativar é inócuo e reversível — vai direto.
    alternarStatus(
      { id: conta.id, ativa: true },
      {
        onSuccess: () => toastService.success('Conta reativada', `"${conta.nome}" voltou para os seus totais.`),
        onError: (error: any) => {
          const mensagem = error?.response?.data?.message ?? 'Não foi possível reativar esta conta.';
          toastService.error('Não foi possível reativar', mensagem);
        },
      }
    );
  };

  const handleConfirmInativar = () => {
    if (!contaParaInativar) return;
    const conta = contaParaInativar;

    alternarStatus(
      { id: conta.id, ativa: false },
      {
        onSuccess: () => {
          setContaParaInativar(null);
          setMotivoInativacao(null);
          toastService.success('Conta inativada', `"${conta.nome}" saiu dos totais, mas o histórico foi preservado.`);
        },
        onError: (error: any) => {
          setContaParaInativar(null);
          setMotivoInativacao(null);
          const mensagem = error?.response?.data?.message ?? 'Não foi possível inativar esta conta.';
          toastService.error('Não foi possível inativar', mensagem);
        },
      }
    );
  };

  const handleFecharInativar = () => {
    setContaParaInativar(null);
    setMotivoInativacao(null);
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
      <ContaCard
        conta={item}
        onDelete={setContaParaExcluir}
        onEdit={handleEdit}
        onToggleAtiva={handleToggleAtiva}
      />
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

      <ConfirmDialog
        visible={!!contaParaInativar}
        onClose={handleFecharInativar}
        onConfirm={handleConfirmInativar}
        title={motivoInativacao ? 'Inativar em vez de excluir?' : 'Inativar Conta?'}
        description={
          motivoInativacao
            ? `${motivoInativacao}\n\nInativar mantém todo o histórico e tira a conta dos seus totais. Você pode reativá-la quando quiser.`
            : 'A conta sai dos seus totais e da projeção de fluxo de caixa, mas o histórico de transações é preservado. Você pode reativá-la quando quiser.'
        }
        confirmLabel="Inativar"
        isLoading={isAlternando}
      />
    </View>
  );
}
