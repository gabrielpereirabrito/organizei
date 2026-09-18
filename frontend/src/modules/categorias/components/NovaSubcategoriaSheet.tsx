import React, { forwardRef, useCallback, useMemo, useEffect } from 'react';
import { View, Text } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCriarSubcategoria, useAtualizarSubcategoria, ISubcategoria } from '../hooks/useSubcategorias';
import { Button, Input } from '@/shared/components/ui';
import { useThemeColors } from '@/shared/theme/colors';
import { toastService } from '@/shared/services/toast.service';

const subcategoriaSchema = z.object({
  nome: z.string().min(2, 'Nome muito curto'),
});

type FormData = z.infer<typeof subcategoriaSchema>;

export type BottomSheetRef = BottomSheet;

type Props = {
  categoriaId: string;
  categoriaNome: string;
  /** Quando presente, o sheet opera em modo edição. */
  subcategoriaEmEdicao?: ISubcategoria | null;
  onFechar?: () => void;
};

export const NovaSubcategoriaSheet = forwardRef<BottomSheetRef, Props>(
  ({ categoriaId, categoriaNome, subcategoriaEmEdicao, onFechar }, ref) => {
    const { mutateAsync: criar } = useCriarSubcategoria();
    const { mutateAsync: atualizar } = useAtualizarSubcategoria();
    const colors = useThemeColors();

    const isEdicao = !!subcategoriaEmEdicao;

    const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
      resolver: zodResolver(subcategoriaSchema),
      defaultValues: { nome: '' },
    });

    // O sheet é montado uma vez e reaproveitado para cada item editado, então o
    // formulário precisa acompanhar qual subcategoria está aberta.
    useEffect(() => {
      reset({ nome: subcategoriaEmEdicao?.nome ?? '' });
    }, [subcategoriaEmEdicao, reset]);

    const snapPoints = useMemo(() => ['45%'], []);

    const renderBackdrop = useCallback(
      (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />,
      []
    );

    const fechar = () => {
      reset({ nome: '' });
      // @ts-ignore
      if (ref && 'current' in ref && ref.current) ref.current.close();
      onFechar?.();
    };

    const onSubmit = async (data: FormData) => {
      try {
        if (isEdicao) {
          await atualizar({ id: subcategoriaEmEdicao!.id, nome: data.nome });
          toastService.success('Pronto', 'Subcategoria atualizada.');
        } else {
          await criar({ categoriaId, nome: data.nome });
          toastService.success('Pronto', 'Subcategoria criada.');
        }
        fechar();
      } catch (e: any) {
        // 409 quando o nome já existe nesta categoria; a mensagem vem do backend.
        const mensagem = e?.response?.data?.message ?? 'Não foi possível salvar a subcategoria.';
        toastService.error('Erro', mensagem);
      }
    };

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
        onClose={onFechar}
        backgroundStyle={{ backgroundColor: colors.fundo }}
      >
        <BottomSheetScrollView contentContainerStyle={{ padding: 24 }}>
          <Text className="text-2xl font-bold text-finance-texto dark:text-white">
            {isEdicao ? 'Editar Subcategoria' : 'Nova Subcategoria'}
          </Text>
          <Text className="text-finance-mutado mb-6">em {categoriaNome}</Text>

          <Controller
            control={control}
            name="nome"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Nome"
                placeholder="Ex: iFood, Mercado, Restaurante..."
                value={value}
                onChangeText={onChange}
                error={errors.nome?.message}
              />
            )}
          />

          <View className="flex-row gap-3 mt-8">
            <Button variant="secondary" className="flex-1" onPress={fechar}>
              <Text className="font-bold">Cancelar</Text>
            </Button>
            <Button className="flex-1" isLoading={isSubmitting} onPress={handleSubmit(onSubmit)}>
              <Text className="text-white font-bold">Salvar</Text>
            </Button>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);
