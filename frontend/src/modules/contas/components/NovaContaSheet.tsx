import React, { forwardRef, useCallback, useMemo } from 'react';
import { View, Text } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCriarConta, TipoConta } from '../hooks/useContas';
import { CurrencyInput, Button, Input, ChoiceChip, ChoiceChipGroup } from '@/shared/components/ui';
import { useThemeColors } from '@/shared/theme/colors';
import { toastService } from '@/shared/services/toast.service';

const contaSchema = z.object({
  nome: z.string().min(3, 'Nome muito curto'),
  tipo: z.enum(['CORRENTE', 'POUPANCA', 'CARTEIRA', 'INVESTIMENTO']),
  saldoInicial: z.number().min(0, 'Saldo não pode ser negativo'),
});

type FormData = z.infer<typeof contaSchema>;

export type BottomSheetRef = BottomSheet;

export const NovaContaSheet = forwardRef<BottomSheetRef, {}>((props, ref) => {
  const { mutateAsync: criarConta } = useCriarConta();
  const colors = useThemeColors();

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(contaSchema),
    defaultValues: {
      nome: '',
      tipo: 'CORRENTE',
      saldoInicial: 0,
    }
  });

  const tipoAtual = watch('tipo');
  const tiposDisponiveis: { value: TipoConta; label: string }[] = [
    { value: 'CORRENTE', label: 'Corrente' },
    { value: 'POUPANCA', label: 'Poupança' },
    { value: 'CARTEIRA', label: 'Carteira' },
    { value: 'INVESTIMENTO', label: 'Investimento' },
  ];

  const snapPoints = useMemo(() => ['70%', '90%'], []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    []
  );

  const onSubmit = async (data: FormData) => {
    try {
      await criarConta(data);
      reset();
      // @ts-ignore
      if (ref && 'current' in ref && ref.current) {
        ref.current.close();
      }
    } catch (e) {
      toastService.error('Erro', 'Não foi possível salvar a conta.');
    }
  };

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: colors.fundo }}
    >
      <BottomSheetScrollView contentContainerStyle={{ padding: 24 }}>
        <Text className="text-2xl font-bold text-finance-texto dark:text-white mb-6">Nova Conta</Text>

        <Controller
          control={control}
          name="nome"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Nome da Conta"
              placeholder="Ex: Nubank, Itaú, Carteira Físca..."
              value={value}
              onChangeText={onChange}
              error={errors.nome?.message}
            />
          )}
        />

        <Text className="text-sm font-medium text-finance-texto dark:text-white mb-2 mt-4">Tipo de Conta</Text>
        <ChoiceChipGroup className="mb-6">
          {tiposDisponiveis.map(tipo => (
            <ChoiceChip
              key={tipo.value}
              label={tipo.label}
              variant="success"
              selected={tipoAtual === tipo.value}
              onPress={() => setValue('tipo', tipo.value)}
            />
          ))}
        </ChoiceChipGroup>

        <Controller
          control={control}
          name="saldoInicial"
          render={({ field: { onChange, value } }) => (
            <CurrencyInput
              label="Saldo Inicial"
              value={value}
              onChangeValue={onChange}
              error={errors.saldoInicial?.message}
            />
          )}
        />

        <Button onPress={handleSubmit(onSubmit)} className="mt-8">
          <Text className="text-white font-bold text-lg">Salvar Conta</Text>
        </Button>
      </BottomSheetScrollView>
    </BottomSheet>
  );
});
