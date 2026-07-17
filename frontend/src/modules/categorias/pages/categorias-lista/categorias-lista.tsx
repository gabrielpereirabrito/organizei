import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useCategorias, useDeletarCategoria, ICategoria } from '../../hooks/useCategorias';
import { Button, Card, Modal, Input } from '@/shared/components/ui';
import { Plus, Trash2, Edit2 } from 'lucide-react-native';
import { useCriarCategoria } from '../../hooks/useCategorias';

export function CategoriasPage() {
  const { data: categorias, isLoading, isError } = useCategorias();
  const { mutate: deletar } = useDeletarCategoria();
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  function handleDelete(id: string) {
    Alert.alert('Atenção', 'Deseja realmente deletar esta categoria?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Deletar', style: 'destructive', onPress: () => deletar(id) }
    ]);
  }

  const renderItem = ({ item }: { item: ICategoria }) => (
    <Card className="mb-3 flex-row justify-between items-center">
      <View className="flex-row items-center gap-3">
        <View className="w-4 h-4 rounded-full" style={{ backgroundColor: item.cor }} />
        <View>
          <Text className="text-lg font-semibold text-slate-800 dark:text-white">{item.nome}</Text>
          <Text className={item.tipo === 'RECEITA' ? 'text-green-600' : 'text-red-500'}>
            {item.tipo === 'RECEITA' ? 'Receita' : 'Despesa'}
          </Text>
        </View>
      </View>
      
      <View className="flex-row gap-2">
        <TouchableOpacity className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
          <Edit2 size={18} color="#64748b" />
        </TouchableOpacity>
        <TouchableOpacity 
          className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg"
          onPress={() => handleDelete(item.id)}
        >
          <Trash2 size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900 p-6">
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-3xl font-bold text-slate-900 dark:text-white">Categorias</Text>
        <Button size="sm" onPress={() => setIsModalOpen(true)}>
          <Plus size={20} color="#fff" />
          <Text className="text-white font-medium ml-2">Nova Categoria</Text>
        </Button>
      </View>

      {isLoading ? (
        <Text className="text-center text-slate-500 mt-10">Carregando categorias...</Text>
      ) : isError ? (
        <Text className="text-center text-red-500 mt-10">Erro ao carregar categorias.</Text>
      ) : (
        <FlatList
          data={categorias}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="text-center text-slate-500 mt-10">Nenhuma categoria cadastrada.</Text>
          }
        />
      )}

      {/* Modal de Criação Básico (placeholder lógico) */}
      <Modal 
        visible={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Nova Categoria"
      >
        <NovaCategoriaForm onClose={() => setIsModalOpen(false)} />
      </Modal>
    </View>
  );
}

function NovaCategoriaForm({ onClose }: { onClose: () => void }) {
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState('#3b82f6');
  const [tipo, setTipo] = useState<'RECEITA'|'DESPESA'>('DESPESA');
  const { mutate: criar, isPending } = useCriarCategoria();

  function handleSubmit() {
    if (!nome) return Alert.alert('Erro', 'Preencha o nome');
    criar({ nome, cor, tipo }, {
      onSuccess: () => onClose(),
      onError: (err: any) => Alert.alert('Erro', err.response?.data?.message || 'Erro ao criar')
    });
  }

  return (
    <View className="gap-4">
      <Input label="Nome" value={nome} onChangeText={setNome} placeholder="Ex: Alimentação" />
      
      <View className="flex-row gap-4">
        <Button 
          variant={tipo === 'RECEITA' ? 'primary' : 'secondary'} 
          className="flex-1"
          onPress={() => setTipo('RECEITA')}
        >
          Receita
        </Button>
        <Button 
          variant={tipo === 'DESPESA' ? 'danger' : 'secondary'} 
          className="flex-1"
          onPress={() => setTipo('DESPESA')}
        >
          Despesa
        </Button>
      </View>

      <Button isLoading={isPending} onPress={handleSubmit} className="mt-4">
        Salvar Categoria
      </Button>
    </View>
  );
}
