export function formatarMoeda(valorEmCentavos: number): string {
  const valorDecimal = valorEmCentavos / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valorDecimal);
}
