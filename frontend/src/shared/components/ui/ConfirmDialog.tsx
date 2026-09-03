import React from 'react';
import { View, Text } from 'react-native';
import { Modal } from './modal';
import { Button } from './button';

export interface ConfirmDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  /** true para ações destrutivas (excluir), false para confirmações neutras (ex: logout) */
  destructive?: boolean;
  isLoading?: boolean;
}

export function ConfirmDialog({
  visible,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  destructive = false,
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal visible={visible} onClose={onClose} title={title}>
      <Text className="text-sm text-finance-mutado dark:text-slate-300 mb-6">{description}</Text>
      <View className="flex-row gap-3">
        <Button variant="secondary" className="flex-1" onPress={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button
          variant={destructive ? 'danger' : 'primary'}
          className="flex-1"
          onPress={onConfirm}
          isLoading={isLoading}
        >
          {confirmLabel}
        </Button>
      </View>
    </Modal>
  );
}
