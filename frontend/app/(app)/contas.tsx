import React, { useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useContas, useDeletarConta, IConta } from '@/modules/contas/hooks/useContas';
import { NovaContaSheet, BottomSheetRef } from '@/modules/contas/components/NovaContaSheet';
import { ContaCard } from '@/modules/contas/components/ContaCard';
import { Button } from '@/shared/components/ui';
import { Plus, Eye, EyeOff, Moon, Sun } from 'lucide-react-native';
import { usePrivacyStore } from '@/shared/stores/privacy.store';
import { useThemeStore } from '@/shared/stores/theme.store';
import { MotiView } from 'moti';

export default function ContasPage() {
  const { data, isLoading, isError } = useContas();
  const { mutate: deletarConta } = useDeletarConta();
  const bottomSheetRef = useRef<BottomSheetRef>(null);
  
  const { isOculto, togglePrivacy } = usePrivacyStore();
  const { theme, setTheme } = useThemeStore();

  const handleOpenSheet = () => bottomSheetRef.current?.expand();

  const handleDelete = (id: string) => {
    Alert.alert(
      'Deletar Conta?',
      'Se você deletar esta conta, TODAS as transações e históricos atrelados a ela serão apagados para sempre. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir Permanentemente', style: 'destructive', onPress: () => deletarConta(id) }
      ]
    );
  };

  const handleEdit = (conta: IConta) => {
    Alert.alert('Em breve', 'A edição de contas será implementada em breve.');
  };

  const renderItem = ({ item, index }: { item: IConta, index: number }) => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400, delay: index * 100 }}
    >
      <ContaCard conta={item} onDelete={handleDelete} onEdit={handleEdit} />
    </MotiView>
  );

  return (
    <View className="flex-1 bg-finance-fundo dark:bg-slate-900 p-6">
      <View className="flex-row justify-between items-center mb-6 mt-4">
        <View className="flex-row items-center gap-3">
          <Text className="text-3xl font-bold text-finance-texto dark:text-white">Contas</Text>
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

      {isLoading ? (
        <Text className="text-center text-slate-500 mt-10">Carregando contas...</Text>
      ) : isError ? (
        <Text className="text-center text-finance-vermelho mt-10">Erro ao carregar as contas.</Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="text-center text-slate-500 mt-10">Você ainda não possui contas cadastradas.</Text>
          }
        />
      )}

      <NovaContaSheet ref={bottomSheetRef} />
    </View>
  );
}
