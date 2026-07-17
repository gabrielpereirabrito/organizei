import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { cn } from '@/shared/utils/cn';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export function Input({ label, error, className, containerClassName, ...props }: InputProps) {
  return (
    <View className={cn("w-full gap-1.5", containerClassName)}>
      {label && (
        <Text className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </Text>
      )}
      <TextInput
        className={cn(
          "h-12 px-4 rounded-lg border text-base text-slate-900 dark:text-white bg-white dark:bg-slate-900",
          error 
            ? "border-red-500" 
            : "border-slate-300 dark:border-slate-700 focus:border-blue-500",
          className
        )}
        placeholderTextColor="#94a3b8"
        {...props}
      />
      {error && (
        <Text className="text-sm text-red-500 mt-1">{error}</Text>
      )}
    </View>
  );
}
