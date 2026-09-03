import React from 'react';
import { View, Text } from 'react-native';
import { type LucideIcon } from 'lucide-react-native';
import { useThemeColors } from '@/shared/theme/colors';
import { Button } from './button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  const colors = useThemeColors();

  return (
    <View className="items-center justify-center py-12 px-6">
      {Icon && (
        <View className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mb-4">
          <Icon size={24} color={colors.mutado} />
        </View>
      )}
      <Text className="text-base font-semibold text-finance-texto dark:text-white text-center">{title}</Text>
      {description && (
        <Text className="text-sm text-finance-mutado dark:text-slate-400 text-center mt-1">{description}</Text>
      )}
      {action && (
        <Button variant="secondary" size="sm" onPress={action.onPress} className="mt-4">
          {action.label}
        </Button>
      )}
    </View>
  );
}
