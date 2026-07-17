import React from 'react';
import { View, Text } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils/cn';

const badgeVariants = cva(
  'px-2.5 py-1 rounded-full flex-row items-center justify-center',
  {
    variants: {
      variant: {
        success: 'bg-finance-verde/10',
        danger: 'bg-finance-vermelho/10',
        warning: 'bg-finance-alerta/10',
        neutral: 'bg-slate-100 dark:bg-slate-800',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  }
);

const badgeTextVariants = cva(
  'text-xs font-medium',
  {
    variants: {
      variant: {
        success: 'text-finance-verde',
        danger: 'text-finance-vermelho',
        warning: 'text-finance-alerta',
        neutral: 'text-slate-600 dark:text-slate-300',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  }
);

export interface StatusBadgeProps extends VariantProps<typeof badgeVariants> {
  label: string;
  className?: string;
  textClassName?: string;
}

export function StatusBadge({ label, variant, className, textClassName }: StatusBadgeProps) {
  return (
    <View className={cn(badgeVariants({ variant, className }))}>
      <Text className={cn(badgeTextVariants({ variant, className: textClassName }))}>
        {label}
      </Text>
    </View>
  );
}
