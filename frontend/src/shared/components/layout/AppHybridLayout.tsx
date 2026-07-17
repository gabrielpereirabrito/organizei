import React from 'react';
import { Platform, View, Text, TouchableOpacity } from 'react-native';
import { Tabs, Slot, useRouter } from 'expo-router';

export function AppHybridLayout() {
  if (Platform.OS === 'web') {
    return <WebSidebarLayout />;
  }

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#2563eb' }}>
      <Tabs.Screen name="index" options={{ title: 'Overview' }} />
      <Tabs.Screen name="transacoes" options={{ title: 'Extrato' }} />
      <Tabs.Screen name="categorias" options={{ title: 'Categorias' }} />
    </Tabs>
  );
}

function WebSidebarLayout() {
  const router = useRouter();
  
  return (
    <View className="flex-1 flex-row bg-slate-50 dark:bg-slate-900">
      {/* Sidebar Simples */}
      <View className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-6">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-10">organizei</Text>
        <View className="gap-4">
          <TouchableOpacity onPress={() => router.push('/(app)')} className="py-2">
            <Text className="text-slate-700 dark:text-slate-300 font-medium text-lg">Visão Geral</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(app)/transacoes')} className="py-2">
            <Text className="text-slate-700 dark:text-slate-300 font-medium text-lg">Extrato</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(app)/categorias')} className="py-2">
            <Text className="text-slate-700 dark:text-slate-300 font-medium text-lg">Categorias</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Conteúdo Principal */}
      <View className="flex-1 p-8">
        <Slot />
      </View>
    </View>
  );
}
