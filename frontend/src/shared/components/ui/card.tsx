import React from 'react';
import { View, ViewProps } from 'react-native';
import { cn } from '@/shared/utils/cn';

export function Card({ className, ...props }: ViewProps) {
  return (
    <View 
      className={cn(
        "bg-finance-card dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700",
        className
      )} 
      {...props} 
    />
  );
}
