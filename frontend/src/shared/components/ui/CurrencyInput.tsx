import React, { useState, useEffect } from 'react';
import { TextInput, View, Text, TextInputProps } from 'react-native';
import { cn } from '@/shared/utils/cn';
import { formatarMoeda } from '@/shared/utils/currency';

interface CurrencyInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  value?: number; // Em centavos
  onChangeValue?: (value: number) => void;
  label?: string;
  error?: string;
}

export function CurrencyInput({ value = 0, onChangeValue, label, error, className, ...props }: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (value === 0) {
      setDisplayValue('');
    } else {
      setDisplayValue(formatarMoeda(value));
    }
  }, [value]);

  const handleChangeText = (text: string) => {
    const numericText = text.replace(/\D/g, '');
    const numberValue = parseInt(numericText, 10);
    
    if (isNaN(numberValue)) {
      if (onChangeValue) onChangeValue(0);
      setDisplayValue('');
    } else {
      if (onChangeValue) onChangeValue(numberValue);
      setDisplayValue(formatarMoeda(numberValue));
    }
  };

  return (
    <View className="mb-4">
      {label && <Text className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">{label}</Text>}
      <TextInput
        value={displayValue}
        onChangeText={handleChangeText}
        keyboardType="numeric"
        placeholderTextColor="#9ca3af"
        className={cn(
          "w-full h-12 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 text-base text-slate-900 dark:text-slate-100",
          error && "border-finance-vermelho focus:border-finance-vermelho",
          className
        )}
        {...props}
      />
      {error && <Text className="text-sm text-finance-vermelho mt-1">{error}</Text>}
    </View>
  );
}
