import React, { forwardRef, useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Switch, Alert } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCriarTransacao } from '../hooks/useTransacoes';
import { useCategorias } from '@/modules/categorias';
import { useContas } from '@/modules/contas/hooks/useContas';
import { CurrencyInput, Button, Input } from '@/shared/components/ui';
import { formatarMoeda } from '@/shared/utils/currency';

const transacaoSchema = z.object({
  descricao: z.string().min(3, 'Descrição muito curta'),
  valor: z.number().min(1, 'Valor obrigatório'),
  tipo: z.enum(['RECEITA', 'DESPESA']),
  categoriaId: z.string().min(1, 'Categoria é obrigatória'),
  contaId: z.string().min(1, 'Conta é obrigatória'),
});

type FormData = z.infer<typeof transacaoSchema>;

export type BottomSheetRef = BottomSheet;

export const NovaTransacaoSheet = forwardRef<BottomSheetRef, {}>((props, ref) => {
  const { data: categoriasData } = useCategorias();
  const { data: contasData } = useContas();
  const { mutateAsync: criarTransacao } = useCriarTransacao();
  const categorias = categoriasData || [];
  const contas = contasData || [];

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(transacaoSchema),
    defaultValues: {
      descricao: '',
      valor: 0,
      tipo: 'DESPESA',
      categoriaId: '',
      contaId: '',
    }
  });

  const tipoAtual = watch('tipo');

  // Filtra categorias pelo tipo
  const categoriasFiltradas = categorias.filter(c => c.tipo === tipoAtual);

  const snapPoints = useMemo(() => ['70%', '90%'], []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    []
  );

  const onSubmit = async (data: FormData) => {
    try {
      await criarTransacao({
        ...data,
        dataVencimento: new Date().toISOString(), // Mocking date today
        status: 'PAGA', // Default to paid
      });
      reset();
      // @ts-ignore
      if (ref && 'current' in ref && ref.current) {
        ref.current.close();
      }
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar a transação.');
    }
  };

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: '#F8F9FA' }}
    >
      <BottomSheetScrollView contentContainerStyle={{ padding: 24 }}>
        <Text className="text-2xl font-bold text-finance-texto mb-6">Nova Transação</Text>

        {/* Tipo Selector */}
        <View className="flex-row gap-4 mb-6">
          <TouchableOpacity 
            className={`flex-1 p-3 rounded-xl border ${tipoAtual === 'RECEITA' ? 'border-finance-verde bg-finance-verde/10' : 'border-slate-200'}`}
            onPress={() => setValue('tipo', 'RECEITA')}
          >
            <Text className={`text-center font-bold ${tipoAtual === 'RECEITA' ? 'text-finance-verde' : 'text-finance-mutado'}`}>RECEITA</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className={`flex-1 p-3 rounded-xl border ${tipoAtual === 'DESPESA' ? 'border-finance-vermelho bg-finance-vermelho/10' : 'border-slate-200'}`}
            onPress={() => setValue('tipo', 'DESPESA')}
          >
            <Text className={`text-center font-bold ${tipoAtual === 'DESPESA' ? 'text-finance-vermelho' : 'text-finance-mutado'}`}>DESPESA</Text>
          </TouchableOpacity>
        </View>

        <Controller
          control={control}
          name="valor"
          render={({ field: { onChange, value } }) => (
            <CurrencyInput
              label="Valor"
              value={value}
              onChangeValue={onChange}
              error={errors.valor?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="descricao"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Descrição"
              placeholder="Ex: Aluguel, Salário..."
              value={value}
              onChangeText={onChange}
              error={errors.descricao?.message}
            />
          )}
        />

        <Text className="text-sm font-medium text-finance-texto dark:text-white mb-2 mt-2">Categoria</Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {categoriasFiltradas.map(cat => {
            const isSelected = watch('categoriaId') === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setValue('categoriaId', cat.id)}
                className={`px-4 py-2 rounded-full border ${isSelected ? 'border-finance-texto bg-finance-texto dark:bg-slate-700 dark:border-slate-500' : 'border-slate-300 dark:border-slate-600'}`}
              >
                <Text className={isSelected ? 'text-white' : 'text-finance-mutado dark:text-slate-300'}>{cat.nome}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
        {errors.categoriaId && <Text className="text-finance-vermelho text-sm mb-4">{errors.categoriaId.message}</Text>}

        <Text className="text-sm font-medium text-finance-texto dark:text-white mb-2">Conta</Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {contas.map(conta => {
            const isSelected = watch('contaId') === conta.id;
            return (
              <TouchableOpacity
                key={conta.id}
                onPress={() => setValue('contaId', conta.id)}
                className={`px-4 py-2 rounded-full border ${isSelected ? 'border-finance-verde bg-finance-verde/10' : 'border-slate-300 dark:border-slate-600'}`}
              >
                <Text className={isSelected ? 'text-finance-verde font-bold' : 'text-finance-mutado dark:text-slate-300'}>{conta.nome}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
        {errors.contaId && <Text className="text-finance-vermelho text-sm mb-4">{errors.contaId.message}</Text>}

        <Button onPress={handleSubmit(onSubmit)} className="mt-4">
          <Text className="text-white font-bold text-lg">Salvar Transação</Text>
        </Button>
      </BottomSheetScrollView>
    </BottomSheet>
  );
});
