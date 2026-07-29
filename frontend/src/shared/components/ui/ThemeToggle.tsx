import React from 'react';
import { TouchableOpacity, ViewStyle } from 'react-native';
import { Moon, Sun } from 'lucide-react-native';
import { useThemeStore } from '@/shared/stores/theme.store';
import { MotiView, AnimatePresence } from 'moti';

interface ThemeToggleProps {
  style?: ViewStyle;
}

export function ThemeToggle({ style }: ThemeToggleProps) {
  const { theme, setTheme } = useThemeStore();
  
  const resolvedTheme = theme === 'system' ? 'light' : theme; 
  // O Moti fará um swap suave do ícone
  const isDark = resolvedTheme === 'dark';

  const toggle = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={toggle}
      style={style}
      className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 self-end mb-4 border border-slate-200 dark:border-slate-700"
    >
      <AnimatePresence exitBeforeEnter>
        {isDark ? (
          <MotiView
            key="moon"
            from={{ opacity: 0, scale: 0.5, rotate: '-90deg' }}
            animate={{ opacity: 1, scale: 1, rotate: '0deg' }}
            exit={{ opacity: 0, scale: 0.5, rotate: '90deg' }}
            transition={{ type: 'timing', duration: 300 }}
          >
            <Moon size={24} color="#f59e0b" />
          </MotiView>
        ) : (
          <MotiView
            key="sun"
            from={{ opacity: 0, scale: 0.5, rotate: '90deg' }}
            animate={{ opacity: 1, scale: 1, rotate: '0deg' }}
            exit={{ opacity: 0, scale: 0.5, rotate: '-90deg' }}
            transition={{ type: 'timing', duration: 300 }}
          >
            <Sun size={24} color="#f59e0b" />
          </MotiView>
        )}
      </AnimatePresence>
    </TouchableOpacity>
  );
}
