import React, { useState } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps } from 'react-native';
import { MotiView } from 'moti';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils/cn';
import { useThemeColors } from '@/shared/theme/colors';

const buttonVariants = cva(
  "flex-row items-center justify-center rounded-lg px-4 py-3 disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-finance-primaria",
        secondary: "bg-slate-200 dark:bg-slate-800",
        danger: "bg-red-500",
        ghost: "bg-transparent",
      },
      size: {
        default: "h-12",
        sm: "h-10 px-3",
        lg: "h-14 px-6",
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    }
  }
);

const textVariants = cva(
  "font-semibold text-base",
  {
    variants: {
      variant: {
        primary: "text-white",
        secondary: "text-slate-900 dark:text-slate-100",
        danger: "text-white",
        ghost: "text-finance-primaria",
      }
    },
    defaultVariants: {
      variant: "primary",
    }
  }
);

export interface ButtonProps extends TouchableOpacityProps, VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
  isLoading?: boolean;
}

export function Button({ className, variant, size, isLoading, disabled, children, onPressIn, onPressOut, ...props }: ButtonProps) {
  const [pressed, setPressed] = useState(false);
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={isLoading || disabled}
      onPressIn={(e) => { setPressed(true); onPressIn?.(e); }}
      onPressOut={(e) => { setPressed(false); onPressOut?.(e); }}
      {...props}
    >
      <MotiView
        animate={{ scale: pressed ? 0.96 : 1 }}
        transition={{ type: 'timing', duration: 100 }}
      >
        {isLoading ? (
          <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#fff' : colors.primaria} />
        ) : (
          <Text className={cn(textVariants({ variant }))}>{children}</Text>
        )}
      </MotiView>
    </TouchableOpacity>
  );
}
