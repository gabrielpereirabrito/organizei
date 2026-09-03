import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { MotiView } from 'moti';
import { useResumoMensal } from '@/modules/transacoes';
import { Card, ThemeToggle, IconButton, Skeleton, EmptyState } from '@/shared/components/ui';
import { useFormatarMoeda } from '@/shared/utils/currency';
import { usePrivacyStore } from '@/shared/stores/privacy.store';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react-native';

export function OverviewPage() {
  const hoje = new Date();
  const { data: resumo, isLoading, isError } = useResumoMensal(hoje.getMonth() + 1, hoje.getFullYear());
  const formatarMoeda = useFormatarMoeda();
  const { isOculto, togglePrivacy } = usePrivacyStore();

  if (isLoading) {
    return (
      <ScrollView className="flex-1 bg-finance-fundo dark:bg-slate-900 p-6">
        <Skeleton className="h-9 w-48 mb-6" />
        <View className="flex-row flex-wrap justify-between gap-4">
          <Skeleton className="flex-1 min-w-[150px] h-24 rounded-2xl" />
          <Skeleton className="flex-1 min-w-[150px] h-24 rounded-2xl" />
          <Skeleton className="flex-1 min-w-[150px] h-24 rounded-2xl" />
        </View>
        <Skeleton className="h-6 w-56 mt-10 mb-4" />
        <Skeleton className="h-16 rounded-2xl mb-3" />
        <Skeleton className="h-16 rounded-2xl mb-3" />
      </ScrollView>
    );
  }

  if (isError || !resumo) {
    return (
      <View className="flex-1 justify-center bg-finance-fundo dark:bg-slate-900">
        <EmptyState icon={AlertTriangle} title="Erro ao carregar resumo financeiro" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-finance-fundo dark:bg-slate-900 p-6">
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-3xl font-bold text-finance-texto dark:text-white">Visão Geral</Text>
        <View className="flex-row gap-3">
          <ThemeToggle style={{ marginBottom: 0 }} />
          <IconButton icon={isOculto ? EyeOff : Eye} onPress={togglePrivacy} />
        </View>
      </View>

      <View className="flex-row flex-wrap justify-between gap-4">
        <Card className="flex-1 min-w-[150px] bg-finance-primaria border-0">
          <Text className="text-blue-100 font-medium mb-1">Saldo Atual</Text>
          <Text className="text-2xl font-bold text-white">{formatarMoeda(resumo.saldoRealizado)}</Text>
        </Card>

        <Card className="flex-1 min-w-[150px]">
          <Text className="text-finance-mutado dark:text-slate-400 font-medium mb-1">Receitas</Text>
          <Text className="text-2xl font-bold text-finance-verde">{formatarMoeda(resumo.totalReceitasPagas)}</Text>
        </Card>

        <Card className="flex-1 min-w-[150px]">
          <Text className="text-finance-mutado dark:text-slate-400 font-medium mb-1">Despesas</Text>
          <Text className="text-2xl font-bold text-finance-vermelho">{formatarMoeda(resumo.totalDespesasPagas)}</Text>
        </Card>
      </View>

      <Text className="text-xl font-bold text-finance-texto dark:text-white mt-10 mb-4">Despesas por Categoria</Text>
      {resumo.gastosPorCategoria.length > 0 ? (
        resumo.gastosPorCategoria.map((cat, idx) => (
          <MotiView
            key={idx}
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: Math.min(idx, 8) * 40, type: 'timing', duration: 220 }}
          >
            <Card className="mb-3 flex-row justify-between items-center">
              <View className="flex-row items-center gap-3">
                <View className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.cor || '#ccc' }} />
                <Text className="text-lg font-medium text-finance-texto dark:text-white">{cat.categoria}</Text>
              </View>
              <Text className="text-lg font-semibold text-finance-texto dark:text-white">
                {formatarMoeda(cat.valorRealizado)}
              </Text>
            </Card>
          </MotiView>
        ))
      ) : (
        <EmptyState title="Nenhuma despesa registrada este mês" />
      )}
    </ScrollView>
  );
}
