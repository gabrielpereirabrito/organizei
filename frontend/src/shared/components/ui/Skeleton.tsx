import React from 'react';
import { MotiView } from 'moti';
import { cn } from '@/shared/utils/cn';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <MotiView
      from={{ opacity: 0.4 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 700, loop: true }}
      className={cn('bg-slate-200 dark:bg-slate-700 rounded-md', className)}
    />
  );
}
