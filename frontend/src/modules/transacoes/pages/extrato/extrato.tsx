import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useTransacoes, useDeletarTransacao, ITransacao } from '../../hooks/useTransacoes';
import { Card, Button } from '@/shared/components/ui';
import { formatarMoeda } from '@/shared/utils/currency';
import { Plus, Trash2 } from 'lucide-react-native';

export function TransacoesPage() {
  const { data, isLoading, isError } = useTransacoes();
  const { mutate: deletar } = useDeletarTransacao();

  function handleDelete(id: string) {
    Alert.alert('Atenção', 'Deseja realmente deletar esta transação?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Deletar', style: 'destructive', onPress: () => deletar(id) }
    ]);
  }

  const renderItem = ({ item }: { item: ITransacao }) => {
    const isReceita = item.tipo === 'RECEITA';
    
    return (
      <Card className="mb-3">
        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-slate-800 dark:text-white">{item.descricao}</Text>
            {item.categoria && (
              <View className="flex-row items-center gap-1 mt-1">
                <View className="w-2 h-2 rounded-full" style={{ backgroundColor: item.categoria.cor }} />
                <Text className="text-sm text-slate-500">{item.categoria.nome}</Text>
              </View>
            )}
          </View>
          <Text className={`text-lg font-bold ${isReceita ? 'text-green-600' : 'text-red-500'}`}>
            {isReceita ? '+' : '-'} {formatarMoeda(item.valor)}
          </Text>
        </View>
        <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
          <Text className="text-sm text-slate-400">
            {new Date(item.dataVencimento).toLocaleDateString('pt-BR')}
          </Text>
          <TouchableOpacity onPress={() => handleDelete(item.id)}>
            <Trash2 size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900 p-6">
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-3xl font-bold text-slate-900 dark:text-white">Extrato</Text>
        <Button size="sm">
          <Plus size={20} color="#fff" />
          <Text className="text-white font-medium ml-2">Nova</Text>
        </Button>
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
    </View>
  );
}
