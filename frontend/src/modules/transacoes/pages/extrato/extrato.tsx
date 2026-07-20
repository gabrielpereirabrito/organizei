import React, { useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useTransacoes, useDeletarTransacao, ITransacao } from '../../hooks/useTransacoes';
import { NovaTransacaoSheet, BottomSheetRef } from '../../components/NovaTransacaoSheet';
import { Card, Button } from '@/shared/components/ui';
import { useFormatarMoeda } from '@/shared/utils/currency';
import { Plus, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight, Moon, Sun } from 'lucide-react-native';
import { usePrivacyStore } from '@/shared/stores/privacy.store';
import { useThemeStore } from '@/shared/stores/theme.store';
import { MotiView } from 'moti';
import { useState } from 'react';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
export function TransacoesPage() {
  const [dataFiltro, setDataFiltro] = useState(() => new Date());
  
  const getFiltros = () => {
    const start = new Date(dataFiltro.getFullYear(), dataFiltro.getMonth(), 1);
    const end = new Date(dataFiltro.getFullYear(), dataFiltro.getMonth() + 1, 0, 23, 59, 59);
    return { dataInicio: start.toISOString(), dataFim: end.toISOString() };
  };

  const { data, isLoading, isError } = useTransacoes(getFiltros());
  const { mutate: deletar } = useDeletarTransacao();
  const formatarMoeda = useFormatarMoeda();
  const bottomSheetRef = useRef<BottomSheetRef>(null);
  const { isOculto, togglePrivacy } = usePrivacyStore();
  const { theme, setTheme } = useThemeStore();

  const handlePrevMonth = () => {
    setDataFiltro(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setDataFiltro(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleOpenSheet = () => bottomSheetRef.current?.expand();

  function handleDelete(id: string) {
    Alert.alert('Atenção', 'Deseja realmente deletar esta transação?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Deletar', style: 'destructive', onPress: () => deletar(id) }
    ]);
  }

  const renderItem = ({ item, index }: { item: ITransacao, index: number }) => {
    const isReceita = item.tipo === 'RECEITA';
    
    return (
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: index * 100 }}
      >
        <Card className="mb-3">
        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-finance-texto dark:text-white">{item.descricao}</Text>
            {item.categoria && (
              <View className="flex-row items-center gap-1 mt-1">
                <View className="w-2 h-2 rounded-full" style={{ backgroundColor: item.categoria.cor }} />
                <Text className="text-sm text-finance-mutado">{item.categoria.nome}</Text>
              </View>
            )}
          </View>
          <Text className={`text-lg font-bold ${isReceita ? 'text-finance-verde' : 'text-finance-vermelho'}`}>
            {isReceita ? '+' : '-'} {formatarMoeda(item.valor)}
          </Text>
        </View>
        <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
          <Text className="text-sm text-finance-mutado">
            {new Date(item.dataVencimento).toLocaleDateString('pt-BR')}
          </Text>
          <TouchableOpacity onPress={() => handleDelete(item.id)}>
            <Trash2 size={18} color="#FF4C4C" />
          </TouchableOpacity>
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
          <TouchableOpacity onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
            {theme === 'dark' ? <Moon size={20} color="#71717A" /> : <Sun size={20} color="#71717A" />}
          </TouchableOpacity>
          <TouchableOpacity onPress={togglePrivacy} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
            {isOculto ? <EyeOff size={20} color="#71717A" /> : <Eye size={20} color="#71717A" />}
          </TouchableOpacity>
        </View>
        <Button size="sm" onPress={handleOpenSheet}>
          <Plus size={20} color="#fff" />
          <Text className="text-white font-medium ml-2">Nova</Text>
        </Button>
      </View>

      <View className="flex-row justify-between items-center bg-white dark:bg-slate-800 rounded-2xl p-2 mb-6 shadow-sm border border-slate-100 dark:border-slate-700">
        <TouchableOpacity onPress={handlePrevMonth} className="p-2">
          <ChevronLeft size={24} color="#71717A" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-finance-texto dark:text-white capitalize">
          {MESES[dataFiltro.getMonth()]} {dataFiltro.getFullYear()}
        </Text>
        <TouchableOpacity onPress={handleNextMonth} className="p-2">
          <ChevronRight size={24} color="#71717A" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <Text className="text-center text-slate-500 mt-10">Carregando transações...</Text>
      ) : isError ? (
        <Text className="text-center text-red-500 mt-10">Erro ao carregar transações.</Text>
      ) : (
        <FlatList
          data={data?.data}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="text-center text-slate-500 mt-10">Nenhuma transação encontrada.</Text>
          }
        />
      )}

      <NovaTransacaoSheet ref={bottomSheetRef} />
    </View>
  );
}
