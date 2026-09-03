import { useColorScheme } from 'nativewind';

export interface FinanceColors {
  primaria: string;
  verde: string;
  vermelho: string;
  alerta: string;
  info: string;
  fundo: string;
  card: string;
  texto: string;
  mutado: string;
}

// Espelho manual das CSS vars em `global.css` — NativeWind não expõe CSS vars
// para código JS/RN puro (ex: `color=` de ícones, `placeholderTextColor=`).
// Ao mudar um valor aqui, mude também em global.css (e vice-versa).
export const financeColors: Record<'light' | 'dark', FinanceColors> = {
  light: {
    primaria: '#2563eb',
    verde: '#00B074',
    vermelho: '#FF4C4C',
    alerta: '#FFB020',
    info: '#3b82f6',
    fundo: '#F8F9FA',
    card: '#FFFFFF',
    texto: '#1A1A1A',
    mutado: '#71717A',
  },
  dark: {
    primaria: '#3b82f6',
    verde: '#00B074',
    vermelho: '#FF4C4C',
    alerta: '#FFB020',
    info: '#60a5fa',
    fundo: '#0f172a',
    card: '#1e293b',
    texto: '#f8fafc',
    mutado: '#94a3b8',
  },
};

export function useThemeColors(): FinanceColors {
  const { colorScheme } = useColorScheme();
  return financeColors[colorScheme ?? 'light'];
}
