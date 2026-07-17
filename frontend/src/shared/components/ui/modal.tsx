import React from 'react';
import { Modal as RNModal, View, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, Text, TouchableOpacity } from 'react-native';
import { cn } from '@/shared/utils/cn';
import { X } from 'lucide-react-native';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ visible, onClose, title, children }: ModalProps) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-center items-center bg-black/50 p-4">
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              className="w-full max-w-lg"
            >
              <View className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-lg w-full">
                <View className="flex-row justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800">
                  <Text className="text-xl font-semibold text-slate-900 dark:text-white">
                    {title}
                  </Text>
                  <TouchableOpacity onPress={onClose} className="p-1 rounded-full bg-slate-100 dark:bg-slate-800">
                    <X size={20} color="#64748b" />
                  </TouchableOpacity>
                </View>
                <View className="p-5">
                  {children}
                </View>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}
