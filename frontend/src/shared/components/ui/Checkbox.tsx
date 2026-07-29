import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export function Checkbox({ checked, onChange, label, className }: CheckboxProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onChange(!checked)}
      className={twMerge('flex-row items-center', className)}
    >
      <View
        className={clsx(
          'w-6 h-6 rounded-md border-2 items-center justify-center mr-3',
          checked
            ? 'bg-finance-primaria border-finance-primaria dark:bg-finance-primaria dark:border-finance-primaria'
            : 'border-slate-300 dark:border-slate-600 bg-transparent'
        )}
      >
        {checked && <Check size={16} color="#ffffff" strokeWidth={3} />}
      </View>
      {label && (
        <Text className="text-slate-700 dark:text-slate-300 font-medium">
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}
