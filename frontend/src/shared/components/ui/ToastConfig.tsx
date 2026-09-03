import React from 'react';
import { View, Text } from 'react-native';
import Toast, { ToastConfig, ToastConfigParams } from 'react-native-toast-message';
import { CheckCircle2, XCircle, AlertCircle, type LucideIcon } from 'lucide-react-native';
import { MotiView } from 'moti';
import { useThemeColors } from '@/shared/theme/colors';

interface BaseToastProps extends ToastConfigParams<any> {
  icon: LucideIcon;
  iconColor: string;
  borderClass: string;
}

const BaseToast = ({ text1, text2, icon: Icon, iconColor, borderClass }: BaseToastProps) => (
  <MotiView
    from={{ opacity: 0, translateY: -20, scale: 0.9 }}
    animate={{ opacity: 1, translateY: 0, scale: 1 }}
    transition={{ type: 'timing', duration: 250 }}
    className={`flex-row items-center w-[90%] p-4 rounded-2xl border-l-4 bg-white dark:bg-slate-800 shadow-lg ${borderClass} mb-4`}
  >
    <Icon size={24} color={iconColor} />
    <View className="ml-3 flex-1">
      {text1 && <Text className="text-finance-texto dark:text-white font-bold text-base">{text1}</Text>}
      {text2 && <Text className="text-finance-mutado dark:text-slate-300 text-sm mt-1">{text2}</Text>}
    </View>
  </MotiView>
);

function useToastConfig(): ToastConfig {
  const colors = useThemeColors();

  return {
    success: (props: ToastConfigParams<any>) => (
      <BaseToast {...props} icon={CheckCircle2} iconColor={colors.verde} borderClass="border-finance-verde" />
    ),
    error: (props: ToastConfigParams<any>) => (
      <BaseToast {...props} icon={XCircle} iconColor={colors.vermelho} borderClass="border-finance-vermelho" />
    ),
    info: (props: ToastConfigParams<any>) => (
      <BaseToast {...props} icon={AlertCircle} iconColor={colors.info} borderClass="border-finance-info" />
    ),
  };
}

// react-native-toast-message consome um objeto estático de render props, não um hook.
// `ToastHost` existe só pra poder chamar `useThemeColors()` (reativo ao tema) e
// repassar as cores resolvidas para o `config` do <Toast />.
export function ToastHost() {
  const config = useToastConfig();
  return <Toast config={config} position="top" topOffset={60} />;
}
