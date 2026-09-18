import { TipoTransacao } from '@prisma/client'

// Sugestões criadas no cadastro. Não há catálogo global nem flag de "categoria
// de sistema": são cópias por usuário e, a partir daí, registros comuns — o
// usuário edita, inativa, exclui e cria as suas livremente.
export const DEFAULT_CATEGORIES = [
  {
    nome: 'Alimentação',
    icone: 'fast-food-outline', // Ícones do Ionicons compatíveis com Expo
    cor: '#FF5733',
    tipo: TipoTransacao.DESPESA,
    subcategorias: ['Mercado', 'Restaurante', 'Delivery', 'Padaria'],
  },
  {
    nome: 'Transporte',
    icone: 'car-outline',
    cor: '#3357FF',
    tipo: TipoTransacao.DESPESA,
    subcategorias: [
      'Combustível',
      'App de transporte',
      'Transporte público',
      'Estacionamento',
    ],
  },
  {
    nome: 'Salário',
    icone: 'cash-outline',
    cor: '#28A745',
    tipo: TipoTransacao.RECEITA,
    subcategorias: ['Salário fixo', 'Bônus', 'Férias e 13º'],
  },
  {
    nome: 'Moradia',
    icone: 'home-outline',
    cor: '#800080',
    tipo: TipoTransacao.DESPESA,
    subcategorias: ['Aluguel', 'Contas de consumo', 'Internet', 'Manutenção'],
  },
  {
    nome: 'Lazer',
    icone: 'game-controller-outline',
    cor: '#FFC107',
    tipo: TipoTransacao.DESPESA,
    subcategorias: ['Streaming', 'Cinema', 'Viagens', 'Bares'],
  },
]
