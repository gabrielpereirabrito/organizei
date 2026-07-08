import { TipoTransacao } from '@prisma/client'

export const DEFAULT_CATEGORIES = [
  {
    nome: 'Alimentação',
    icone: 'fast-food-outline', // Ícones do Ionicons compatíveis com Expo
    cor: '#FF5733',
    tipo: TipoTransacao.DESPESA,
  },
  {
    nome: 'Transporte',
    icone: 'car-outline',
    cor: '#3357FF',
    tipo: TipoTransacao.DESPESA,
  },
  {
    nome: 'Salário',
    icone: 'cash-outline',
    cor: '#28A745',
    tipo: TipoTransacao.RECEITA,
  },
  {
    nome: 'Moradia',
    icone: 'home-outline',
    cor: '#800080',
    tipo: TipoTransacao.DESPESA,
  },
  {
    nome: 'Lazer',
    icone: 'game-controller-outline',
    cor: '#FFC107',
    tipo: TipoTransacao.DESPESA,
  },
]
