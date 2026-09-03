import React, { useState } from 'react';
import { View, Text, Platform, TouchableOpacity } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import { useThemeColors } from '@/shared/theme/colors';

interface DatePickerProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  error?: string;
}

export function DatePicker({ label, value, onChange, error }: DatePickerProps) {
  const [show, setShow] = useState(false);
  const colors = useThemeColors();

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShow(Platform.OS === 'ios'); // No iOS o picker não fecha sozinho
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR');
  };

  if (Platform.OS === 'web') {
    return (
      <View className="mb-4">
        <Text className="text-sm font-medium text-finance-texto dark:text-white mb-2">{label}</Text>
        <div className="flex w-full items-center">
          <input
            type="date"
            value={value.toISOString().split('T')[0]}
            onChange={(e) => {
              if (e.target.value) {
                // Ensure timezone issues don't shift the day backwards
                const [year, month, day] = e.target.value.split('-');
                onChange(new Date(Number(year), Number(month) - 1, Number(day)));
              }
            }}
            className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-finance-texto dark:text-white bg-transparent"
            style={{ 
              colorScheme: 'light dark', // Adapts native date picker icon colors
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
        </div>
        {error && <Text className="text-finance-vermelho text-sm mt-1">{error}</Text>}
      </View>
    );
  }

  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-finance-texto dark:text-white mb-2">{label}</Text>
      
      <TouchableOpacity
        onPress={() => setShow(true)}
        className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-4 bg-transparent flex-row justify-between items-center"
      >
        <Text className="text-finance-texto dark:text-white">{formatDate(value)}</Text>
        <Calendar size={20} color={colors.mutado} />
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={value}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
        />
      )}
      
      {Platform.OS === 'ios' && show && (
        <TouchableOpacity onPress={() => setShow(false)} className="mt-2 bg-finance-primaria p-3 rounded-lg items-center">
          <Text className="text-white font-bold">Confirmar</Text>
        </TouchableOpacity>
      )}

      {error && <Text className="text-finance-vermelho text-sm mt-1">{error}</Text>}
    </View>
  );
}
