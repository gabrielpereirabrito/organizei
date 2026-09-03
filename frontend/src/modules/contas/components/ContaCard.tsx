import React from 'react';
import { View, Text } from 'react-native';
import { Card, StatusBadge, IconButton } from '@/shared/components/ui';
import { useFormatarMoeda } from '@/shared/utils/currency';
import { IConta } from '../hooks/useContas';
import { Trash2, Edit2, Wallet, PiggyBank, Landmark, TrendingUp } from 'lucide-react-native';

interface ContaCardProps {
  conta: IConta;
  onEdit?: (conta: IConta) => void;
  onDelete?: (id: string) => void;
}

const getTipoDetails = (tipo: string) => {
  switch (tipo) {
    case 'CORRENTE':
      return { icon: Landmark, color: '#3b82f6', label: 'Corrente' };
    case 'POUPANCA':
      return { icon: PiggyBank, color: '#ec4899', label: 'Poupança' };
    case 'CARTEIRA':
      return { icon: Wallet, color: '#10b981', label: 'Carteira' };
    case 'INVESTIMENTO':
      return { icon: TrendingUp, color: '#8b5cf6', label: 'Investimento' };
    default:
      return { icon: Wallet, color: '#64748b', label: 'Outros' };
  }
};

export function ContaCard({ conta, onEdit, onDelete }: ContaCardProps) {
  const formatarMoeda = useFormatarMoeda();
  const { icon: Icon, color, label } = getTipoDetails(conta.tipo);

  return (
    <Card className="mb-3">
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-row items-center gap-3">
          <View className="p-3 rounded-full bg-slate-100 dark:bg-slate-800" style={{ backgroundColor: `${color}20` }}>
            <Icon size={24} color={color} />
          </View>
          <View>
            <Text className="text-lg font-semibold text-finance-texto dark:text-white">{conta.nome}</Text>
            <StatusBadge label={label} variant="neutral" />
          </View>
        </View>
        <View className="flex-row gap-2">
          {onEdit && (
            <IconButton icon={Edit2} shape="square" variant="ghost" size="sm" onPress={() => onEdit(conta)} />
          )}
          {onDelete && (
            <IconButton icon={Trash2} shape="square" variant="danger" size="sm" onPress={() => onDelete(conta.id)} />
          )}
        </View>
      </View>
      <View className="border-t border-slate-100 dark:border-slate-700 pt-3">
        <Text className="text-sm text-finance-mutado">Saldo Atual</Text>
        <Text className="text-2xl font-bold text-finance-texto dark:text-white">
          {formatarMoeda(conta.saldoAtual)}
        </Text>
      </View>
    </Card>
  );
}
