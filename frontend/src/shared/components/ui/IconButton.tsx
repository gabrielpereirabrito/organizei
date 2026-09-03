import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { type LucideIcon } from 'lucide-react-native';
import { cn } from '@/shared/utils/cn';
import { useThemeColors } from '@/shared/theme/colors';

const iconButtonVariants = cva(
  'items-center justify-center disabled:opacity-50',
  {
    variants: {
      shape: {
        circle: 'rounded-full',
        square: 'rounded-lg',
      },
      variant: {
        default: 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
        danger: 'bg-red-50 dark:bg-red-950/30',
        ghost: 'bg-transparent',
        primary: 'bg-finance-primaria/10 border border-finance-primaria/20',
        solid: 'bg-finance-primaria',
      },
      size: {
        sm: 'p-1.5',
        default: 'p-2.5',
      },
    },
    defaultVariants: {
      shape: 'circle',
      variant: 'default',
      size: 'default',
    },
  }
);

const ICON_SIZE = { sm: 16, default: 20 } as const;

export interface IconButtonProps
  extends Omit<TouchableOpacityProps, 'children'>,
    VariantProps<typeof iconButtonVariants> {
  icon: LucideIcon;
}

export function IconButton({ icon: Icon, shape, variant, size, className, ...props }: IconButtonProps) {
  const colors = useThemeColors();
  const iconColor =
    variant === 'danger' ? colors.vermelho
    : variant === 'primary' ? colors.primaria
    : variant === 'solid' ? '#ffffff'
    : colors.mutado;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      className={cn(iconButtonVariants({ shape, variant, size, className }))}
      {...props}
    >
      <Icon size={ICON_SIZE[size ?? 'default']} color={iconColor} />
    </TouchableOpacity>
  );
}
