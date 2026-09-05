import React, { forwardRef, useCallback, useMemo, useEffect } from 'react';
import { View, Text } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCriarTransacao } from '../hooks/useTransacoes';
import { useCategorias } from '@/modules/categorias';
import { useContas } from '@/modules/contas/hooks/useContas';
import { CurrencyInput, Button, Input, DatePicker, Checkbox, ChoiceChip, ChoiceChipGroup } from '@/shared/components/ui';
import { useThemeColors } from '@/shared/theme/colors';
import { toastService } from '@/shared/services/toast.service';

const transacaoSchema = z.object({
  descricao: z.string().min(3, 'Descrição muito curta'),
  valor: z.number().min(1, 'Valor obrigatório'),
  tipo: z.enum(['RECEITA', 'DESPESA', 'TRANSFERENCIA']),
  categoriaId: z.string().optional(),
  contaId: z.string().min(1, 'Conta é obrigatória'),
  contaDestinoId: z.string().optional(),
  dataVencimento: z.date(),
  foiPago: z.boolean(),
  dataPagamento: z.date().optional(),
}).superRefine((data, ctx) => {
  if (data.tipo === 'TRANSFERENCIA') {
    if (!data.contaDestinoId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['contaDestinoId'], message: 'Conta destino é obrigatória' });
    } else if (data.contaDestinoId === data.contaId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['contaDestinoId'], message: 'Deve ser diferente da conta de origem' });
    }
  } else if (!data.categoriaId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['categoriaId'], message: 'Categoria é obrigatória' });
  }
});

type FormData = z.infer<typeof transacaoSchema>;

export type BottomSheetRef = BottomSheet;

export const NovaTransacaoSheet = forwardRef<BottomSheetRef, {}>((props, ref) => {
  const { data: categoriasData } = useCategorias();
  const { data: contasData } = useContas();
  const { mutateAsync: criarTransacao } = useCriarTransacao();
  const categorias = categoriasData || [];
  const contas = contasData || [];
  const colors = useThemeColors();

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(transacaoSchema),
    defaultValues: {
      descricao: '',
      valor: 0,
      tipo: 'DESPESA',
      categoriaId: '',
      contaId: '',
      contaDestinoId: '',
      dataVencimento: new Date(),
      foiPago: true,
      dataPagamento: new Date(),
    }
  });

  const tipoAtual = watch('tipo');
  const foiPago = watch('foiPago');
  const dataVencimento = watch('dataVencimento');

  // Sincroniza a data de pagamento com a de vencimento se estiver marcado como pago
  useEffect(() => {
    if (foiPago) {
      setValue('dataPagamento', dataVencimento);
    }
  }, [dataVencimento, foiPago, setValue]);

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
      const isTransferencia = data.tipo === 'TRANSFERENCIA';
      await criarTransacao({
        descricao: data.descricao,
        valor: data.valor,
        tipo: data.tipo,
        categoriaId: isTransferencia ? undefined : data.categoriaId,
        contaId: data.contaId,
        contaDestinoId: isTransferencia ? data.contaDestinoId : undefined,
        status: data.foiPago ? 'PAGA' : 'PENDENTE',
        dataVencimento: data.dataVencimento.toISOString(),
        dataPagamento: data.foiPago ? data.dataPagamento?.toISOString() : undefined,
      });
      reset();
      // @ts-ignore
      if (ref && 'current' in ref && ref.current) {
        ref.current.close();
      }
    } catch (e) {
      toastService.error('Erro', 'Não foi possível salvar a transação.');
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
        <Text className="text-2xl font-bold text-finance-texto mb-6">Nova Transação</Text>

        <View className="flex-row gap-4 mb-6">
          <ChoiceChip
            label="RECEITA"
            variant="success"
            selected={tipoAtual === 'RECEITA'}
            onPress={() => setValue('tipo', 'RECEITA')}
            className="flex-1 py-3 items-center"
          />
          <ChoiceChip
            label="DESPESA"
            variant="danger"
            selected={tipoAtual === 'DESPESA'}
            onPress={() => setValue('tipo', 'DESPESA')}
            className="flex-1 py-3 items-center"
          />
          <ChoiceChip
            label="TRANSFERÊNCIA"
            variant="neutral"
            selected={tipoAtual === 'TRANSFERENCIA'}
            onPress={() => setValue('tipo', 'TRANSFERENCIA')}
            className="flex-1 py-3 items-center"
          />
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

        {/* Datas e Pagamento */}
        <Controller
          control={control}
          name="dataVencimento"
          render={({ field: { onChange, value } }) => (
            <DatePicker
              label="Data de Competência (Vencimento)"
              value={value}
              onChange={onChange}
            />
          )}
        />

        <Controller
          control={control}
          name="foiPago"
          render={({ field: { onChange, value } }) => (
            <Checkbox
              checked={value}
              onChange={onChange}
              label={tipoAtual === 'DESPESA' ? 'Já foi pago?' : tipoAtual === 'RECEITA' ? 'Já foi recebido?' : 'Já foi realizada?'}
              className="mb-4"
            />
          )}
        />

        {foiPago && (
          <Controller
            control={control}
            name="dataPagamento"
            render={({ field: { onChange, value } }) => (
              <DatePicker
                label={tipoAtual === 'DESPESA' ? 'Data do Pagamento' : tipoAtual === 'RECEITA' ? 'Data do Recebimento' : 'Data da Transferência'}
                value={value || new Date()}
                onChange={onChange}
              />
            )}
          />
        )}

        {/* Categorias e Contas */}
        {tipoAtual !== 'TRANSFERENCIA' && (
          <>
            <Text className="text-sm font-medium text-finance-texto dark:text-white mb-2 mt-2">Categoria</Text>
            <ChoiceChipGroup className="mb-6">
              {categoriasFiltradas.map(cat => (
                <ChoiceChip
                  key={cat.id}
                  label={cat.nome}
                  selected={watch('categoriaId') === cat.id}
                  onPress={() => setValue('categoriaId', cat.id)}
                />
              ))}
            </ChoiceChipGroup>
            {errors.categoriaId && <Text className="text-finance-vermelho text-sm mb-4">{errors.categoriaId.message}</Text>}
          </>
        )}

        <Text className="text-sm font-medium text-finance-texto dark:text-white mb-2">
          {tipoAtual === 'TRANSFERENCIA' ? 'Conta de Origem' : 'Conta'}
        </Text>
        <ChoiceChipGroup className="mb-6">
          {contas.map(conta => (
            <ChoiceChip
              key={conta.id}
              label={conta.nome}
              variant="success"
              selected={watch('contaId') === conta.id}
              onPress={() => setValue('contaId', conta.id)}
            />
          ))}
        </ChoiceChipGroup>
        {errors.contaId && <Text className="text-finance-vermelho text-sm mb-4">{errors.contaId.message}</Text>}

        {tipoAtual === 'TRANSFERENCIA' && (
          <>
            <Text className="text-sm font-medium text-finance-texto dark:text-white mb-2">Conta de Destino</Text>
            <ChoiceChipGroup className="mb-6">
              {contas.filter(conta => conta.id !== watch('contaId')).map(conta => (
                <ChoiceChip
                  key={conta.id}
                  label={conta.nome}
                  variant="neutral"
                  selected={watch('contaDestinoId') === conta.id}
                  onPress={() => setValue('contaDestinoId', conta.id)}
                />
              ))}
            </ChoiceChipGroup>
            {errors.contaDestinoId && <Text className="text-finance-vermelho text-sm mb-4">{errors.contaDestinoId.message}</Text>}
          </>
        )}

        <Button onPress={handleSubmit(onSubmit)} className="mt-4 mb-10">
          <Text className="text-white font-bold text-lg">Salvar Transação</Text>
        </Button>
      </BottomSheetScrollView>
    </BottomSheet>
  );
});
