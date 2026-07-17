import { usePrivacyStore } from '../stores/privacy.store';

export function formatarMoeda(valorEmCentavos: number): string {
  const valorDecimal = valorEmCentavos / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valorDecimal);
}

// Hook reativo para uso dentro de componentes React
export function useFormatarMoeda() {
  const isOculto = usePrivacyStore((state) => state.isOculto);

  return (valorEmCentavos: number) => {
    if (isOculto) return '•••••';
    return formatarMoeda(valorEmCentavos);
  };
}
