import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useAuthStore } from '@/modules/auth';
import { ThemeToggle, Modal } from '@/shared/components/ui';
import { User, LogOut, Camera, Save } from 'lucide-react-native';

export default function Perfil() {
  const { usuario, limparAuth } = useAuthStore();
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [nome, setNome] = useState(usuario?.nome || '');

  // Derivar iniciais do nome para o Avatar placeholder
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const names = name.trim().split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    setIsLogoutModalVisible(false);
    limparAuth();
  };

  return (
    <ScrollView className="flex-1 bg-finance-fundo dark:bg-slate-900 px-6 pt-10">
      <Text className="text-3xl font-bold mb-8 text-finance-texto dark:text-white">Perfil</Text>

      {/* Header / Avatar Section */}
      <View className="items-center mb-8">
        <View className="w-24 h-24 rounded-full bg-finance-primaria/20 dark:bg-slate-800 items-center justify-center mb-4 relative">
          <Text className="text-3xl font-bold text-finance-primaria dark:text-white">
            {getInitials(usuario?.nome)}
          </Text>
          <TouchableOpacity className="absolute bottom-0 right-0 bg-finance-primaria p-2 rounded-full border-2 border-finance-fundo dark:border-slate-900">
            <Camera size={14} color="#fff" />
          </TouchableOpacity>
        </View>

        {!isEditing ? (
          <>
            <Text className="text-2xl font-bold text-finance-texto dark:text-white mb-1">{usuario?.nome || 'Usuário'}</Text>
            <Text className="text-slate-500 dark:text-slate-400">{usuario?.email}</Text>
            <TouchableOpacity 
              className="mt-4 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full"
              onPress={() => setIsEditing(true)}
            >
              <Text className="text-finance-primaria dark:text-slate-300 font-medium">Editar Perfil</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View className="w-full">
            <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nome / Apelido</Text>
            <TextInput
              value={nome}
              onChangeText={setNome}
              className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-finance-texto dark:text-white mb-4 bg-white dark:bg-slate-800"
            />
            <View className="flex-row gap-3">
              <TouchableOpacity 
                className="flex-1 bg-slate-200 dark:bg-slate-700 p-3 rounded-lg items-center"
                onPress={() => setIsEditing(false)}
              >
                <Text className="text-slate-700 dark:text-slate-300 font-medium">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="flex-1 bg-finance-primaria p-3 rounded-lg items-center flex-row justify-center"
                onPress={() => {
                  // Aqui futuramente será chamada a API para salvar
                  setIsEditing(false);
                }}
              >
                <Save size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text className="text-white font-medium">Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Preferências */}
      <Text className="text-lg font-bold text-finance-texto dark:text-white mb-4">Preferências</Text>
      <View className="bg-white dark:bg-slate-800 rounded-2xl p-4 mb-8 shadow-sm flex-row items-center justify-between">
        <View>
          <Text className="font-semibold text-finance-texto dark:text-white text-base">Aparência</Text>
          <Text className="text-slate-500 dark:text-slate-400 text-sm">Alternar tema claro/escuro</Text>
        </View>
        {/* Usamos o ThemeToggle sem margem para ele ficar perfeitamente alinhado na linha */}
        <ThemeToggle style={{ marginBottom: 0, alignSelf: 'center' }} />
      </View>

      {/* Conta / Logout */}
      <Text className="text-lg font-bold text-finance-texto dark:text-white mb-4">Conta</Text>
      <TouchableOpacity 
        className="bg-white dark:bg-slate-800 rounded-2xl p-4 flex-row items-center justify-between mb-10 shadow-sm border border-red-100 dark:border-red-900/30"
        onPress={() => setIsLogoutModalVisible(true)}
      >
        <View className="flex-row items-center">
          <View className="bg-red-100 dark:bg-red-900/20 p-2 rounded-lg mr-3">
            <LogOut size={20} color="#ef4444" />
          </View>
          <Text className="font-semibold text-red-500 text-base">Sair da Conta</Text>
        </View>
      </TouchableOpacity>

      {/* Modal de Confirmação de Logout */}
      <Modal
        title="Sair da Conta"
        visible={isLogoutModalVisible}
        onClose={() => setIsLogoutModalVisible(false)}
      >
        <Text className="text-slate-700 dark:text-slate-300 text-base mb-6">
          Deseja realmente sair da sua conta? Você precisará fazer login novamente para acessar seus dados.
        </Text>
        <View className="flex-row gap-3">
          <TouchableOpacity 
            className="flex-1 bg-slate-100 dark:bg-slate-800 p-4 rounded-lg items-center"
            onPress={() => setIsLogoutModalVisible(false)}
          >
            <Text className="text-slate-700 dark:text-slate-300 font-medium">Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="flex-1 bg-red-500 p-4 rounded-lg items-center"
            onPress={handleLogout}
          >
            <Text className="text-white font-medium">Sim, Sair</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Espaço extra no final da scroll view */}
      <View className="h-10" />
    </ScrollView>
  );
}
