import React from 'react';
import { View, ViewProps } from 'react-native';
import { cn } from '@/shared/utils/cn';

export function Card({ className, ...props }: ViewProps) {
  return (
    <View 
      className={cn(
        "bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm",
        className
      )} 
      {...props} 
    />
  );
}
