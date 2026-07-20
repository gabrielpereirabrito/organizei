import React from 'react';
import { View, Text } from 'react-native';
import { ToastConfig, ToastProps } from 'react-native-toast-message';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react-native';

const BaseToast = ({ text1, text2, icon: Icon, colorClass, bgClass, borderClass }: any) => (
  <View className={`flex-row items-center w-[90%] p-4 rounded-2xl border-l-4 shadow-sm ${bgClass} ${borderClass} mb-4`}>
    <Icon size={24} className={colorClass} />
    <View className="ml-3 flex-1">
      {text1 && <Text className="text-finance-texto dark:text-white font-bold text-base">{text1}</Text>}
      {text2 && <Text className="text-finance-mutado dark:text-slate-300 text-sm mt-1">{text2}</Text>}
    </View>
  </View>
);

export const toastConfig: ToastConfig = {
  success: (props: ToastProps) => (
    <BaseToast
      {...props}
      icon={(p: any) => <CheckCircle2 {...p} color="#00B074" />}
      bgClass="bg-white dark:bg-slate-800"
      borderClass="border-finance-verde"
    />
  ),
  error: (props: ToastProps) => (
    <BaseToast
      {...props}
      icon={(p: any) => <XCircle {...p} color="#FF4C4C" />}
      bgClass="bg-white dark:bg-slate-800"
      borderClass="border-finance-vermelho"
    />
  ),
  info: (props: ToastProps) => (
    <BaseToast
      {...props}
      icon={(p: any) => <AlertCircle {...p} color="#3b82f6" />}
      bgClass="bg-white dark:bg-slate-800"
      borderClass="border-blue-500"
    />
  ),
};
