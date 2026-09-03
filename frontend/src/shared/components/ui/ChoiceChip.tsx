import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { cn } from '@/shared/utils/cn';

type ChoiceChipVariant = 'neutral' | 'success' | 'danger';

interface ChoiceChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  variant?: ChoiceChipVariant;
  className?: string;
}

const SELECTED_CONTAINER_CLASSES: Record<ChoiceChipVariant, string> = {
  neutral: 'bg-finance-primaria/10 border-finance-primaria',
  success: 'bg-finance-verde/10 border-finance-verde',
  danger: 'bg-finance-vermelho/10 border-finance-vermelho',
};

const SELECTED_TEXT_CLASSES: Record<ChoiceChipVariant, string> = {
  neutral: 'text-finance-primaria',
  success: 'text-finance-verde',
  danger: 'text-finance-vermelho',
};

export function ChoiceChip({ label, selected, onPress, variant = 'neutral', className }: ChoiceChipProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className={cn(
        'px-4 py-2 rounded-full border',
        selected ? SELECTED_CONTAINER_CLASSES[variant] : 'border-slate-300 dark:border-slate-700 bg-transparent',
        className
      )}
    >
      <Text
        className={cn(
          'text-sm font-medium',
          selected ? SELECTED_TEXT_CLASSES[variant] : 'text-slate-600 dark:text-slate-300'
        )}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function ChoiceChipGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return <View className={cn('flex-row flex-wrap gap-2', className)}>{children}</View>;
}
