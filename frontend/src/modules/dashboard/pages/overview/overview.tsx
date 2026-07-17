import React from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useResumoMensal } from '@/modules/transacoes';
import { Card } from '@/shared/components/ui';
import { formatarMoeda } from '@/shared/utils/currency';

export function OverviewPage() {
  const hoje = new Date();
  const { data: resumo, isLoading, isError } = useResumoMensal(hoje.getMonth() + 1, hoje.getFullYear());

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-900">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (isError || !resumo) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-900">
        <Text className="text-red-500 text-lg">Erro ao carregar resumo financeiro.</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-900 p-6">
      <Text className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Visão Geral</Text>
      
      <View className="flex-row flex-wrap justify-between gap-4">
        <Card className="flex-1 min-w-[150px] bg-blue-600 border-0">
          <Text className="text-blue-100 font-medium mb-1">Saldo Atual</Text>
          <Text className="text-2xl font-bold text-white">{formatarMoeda(resumo.saldoRealizado)}</Text>
        </Card>
        
        <Card className="flex-1 min-w-[150px]">
          <Text className="text-slate-500 dark:text-slate-400 font-medium mb-1">Receitas</Text>
          <Text className="text-2xl font-bold text-green-600">{formatarMoeda(resumo.totalReceitasPagas)}</Text>
        </Card>
        
        <Card className="flex-1 min-w-[150px]">
          <Text className="text-slate-500 dark:text-slate-400 font-medium mb-1">Despesas</Text>
          <Text className="text-2xl font-bold text-red-500">{formatarMoeda(resumo.totalDespesasPagas)}</Text>
        </Card>
      </View>

      <Text className="text-xl font-bold text-slate-900 dark:text-white mt-10 mb-4">Despesas por Categoria</Text>
      {resumo.gastosPorCategoria.length > 0 ? (
        resumo.gastosPorCategoria.map((cat, idx) => (
          <Card key={idx} className="mb-3 flex-row justify-between items-center">
            <View className="flex-row items-center gap-3">
              <View className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.cor || '#ccc' }} />
              <Text className="text-lg font-medium text-slate-800 dark:text-white">{cat.categoria}</Text>
            </View>
            <Text className="text-lg font-semibold text-slate-900 dark:text-white">
              {formatarMoeda(cat.valorRealizado)}
            </Text>
          </Card>
        ))
      ) : (
        <Text className="text-slate-500">Nenhuma despesa registrada este mês.</Text>
      )}
    </ScrollView>
  );
}
