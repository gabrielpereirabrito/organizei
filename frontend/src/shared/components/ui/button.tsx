import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils/cn';

const buttonVariants = cva(
  "flex-row items-center justify-center rounded-lg px-4 py-3 active:opacity-80 disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-blue-600",
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
        ghost: "text-blue-600 dark:text-blue-400",
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

export function Button({ className, variant, size, isLoading, disabled, children, ...props }: ButtonProps) {
  return (
    <TouchableOpacity
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#fff' : '#2563eb'} />
      ) : (
        <Text className={cn(textVariants({ variant }))}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}
