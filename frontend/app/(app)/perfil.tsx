import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useAuthStore } from '@/modules/auth';
import { ThemeToggle, Button, Input, IconButton, ConfirmDialog } from '@/shared/components/ui';
import { useThemeColors } from '@/shared/theme/colors';
import { LogOut, Camera } from 'lucide-react-native';

export default function Perfil() {
  const { usuario, limparAuth } = useAuthStore();
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [nome, setNome] = useState(usuario?.nome || '');
  const colors = useThemeColors();

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
          <IconButton
            icon={Camera}
            shape="circle"
            variant="solid"
            size="sm"
            className="absolute bottom-0 right-0 border-2 border-finance-fundo dark:border-slate-900"
          />
        </View>

        {!isEditing ? (
          <>
            <Text className="text-2xl font-bold text-finance-texto dark:text-white mb-1">{usuario?.nome || 'Usuário'}</Text>
            <Text className="text-slate-500 dark:text-slate-400">{usuario?.email}</Text>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onPress={() => setIsEditing(true)}
            >
              Editar Perfil
            </Button>
          </>
        ) : (
          <View className="w-full">
            <Input
              label="Nome / Apelido"
              value={nome}
              onChangeText={setNome}
              containerClassName="mb-4"
            />
            <View className="flex-row gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onPress={() => setIsEditing(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onPress={() => {
                  // Aqui futuramente será chamada a API para salvar
                  setIsEditing(false);
                }}
              >
                Salvar
              </Button>
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
            <LogOut size={20} color={colors.vermelho} />
          </View>
          <Text className="font-semibold text-finance-vermelho text-base">Sair da Conta</Text>
        </View>
      </TouchableOpacity>

      <ConfirmDialog
        visible={isLogoutModalVisible}
        onClose={() => setIsLogoutModalVisible(false)}
        onConfirm={handleLogout}
        title="Sair da Conta"
        description="Deseja realmente sair da sua conta? Você precisará fazer login novamente para acessar seus dados."
        confirmLabel="Sim, Sair"
        destructive
      />

      {/* Espaço extra no final da scroll view */}
      <View className="h-10" />
    </ScrollView>
  );
}
