import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useProjecaoFluxoCaixa } from '@/modules/transacoes';
import { Card, Skeleton, EmptyState } from '@/shared/components/ui';
import { useThemeColors } from '@/shared/theme/colors';
import { useFormatarMoeda } from '@/shared/utils/currency';
import { usePrivacyStore } from '@/shared/stores/privacy.store';
import { TrendingUp } from 'lucide-react-native';

const LARGURA_TELA = Dimensions.get('window').width;
const MAX_LABELS_VISIVEIS = 6;

export function ProjecaoFluxoCaixaChart() {
  const { data: projecao, isLoading, isError } = useProjecaoFluxoCaixa(3);
  const colors = useThemeColors();
  const formatarMoeda = useFormatarMoeda();
  const { isOculto } = usePrivacyStore();

  if (isLoading) {
    return <Skeleton className="h-56 rounded-2xl mb-6" />;
  }

  if (isError || !projecao || projecao.pontos.length < 2) {
    return (
      <Card className="mb-6">
        <EmptyState icon={TrendingUp} title="Sem dados suficientes para projetar o fluxo de caixa" />
      </Card>
    );
  }

  const { pontos } = projecao;
  const passoLabel = Math.ceil(pontos.length / MAX_LABELS_VISIVEIS);

  const labels = pontos.map((ponto, index) =>
    index % passoLabel === 0 || index === pontos.length - 1
      ? new Date(ponto.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      : ''
  );
  const valores = pontos.map(ponto => ponto.saldo / 100);

  const saldoFinal = pontos[pontos.length - 1].saldo;

  return (
    <Card className="mb-6">
      <Text className="text-lg font-bold text-finance-texto dark:text-white mb-1">Fluxo de Caixa Projetado</Text>
      <Text className="text-sm text-finance-mutado dark:text-slate-400 mb-4">
        Saldo estimado em 3 meses: {formatarMoeda(saldoFinal)}
      </Text>

      <LineChart
        data={{ labels, datasets: [{ data: valores }] }}
        width={LARGURA_TELA - 32 - 40}
        height={200}
        withDots={false}
        withInnerLines={false}
        yAxisLabel=""
        yAxisSuffix=""
        formatYLabel={y => (isOculto ? '•••' : `${Math.round(Number(y) / 1000)}k`)}
        chartConfig={{
          backgroundGradientFrom: colors.card,
          backgroundGradientTo: colors.card,
          decimalPlaces: 0,
          color: (opacity = 1) => colors.primaria,
          labelColor: (opacity = 1) => colors.mutado,
          propsForBackgroundLines: { stroke: colors.mutado, strokeOpacity: 0.1 },
        }}
        bezier
        style={{ marginLeft: -16, borderRadius: 16 }}
      />
    </Card>
  );
}
