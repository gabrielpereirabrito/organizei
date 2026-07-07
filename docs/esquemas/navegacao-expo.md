# Estrutura de Navegação - Expo Router

Este documento mapeia a arquitetura de telas do aplicativo (`frontend/app/`), garantindo compatibilidade entre Mobile (iOS/Android) e Web, além de gerenciar o fluxo de autenticação.

## 👥 Fluxos Principais

O app é dividido em dois grupos principais usando Grupos de Rotas do Expo (`(auth)` e `(app)`), o que impede usuários não autenticados de acessarem os dados financeiros.

```text
frontend/app/
├── _layout.tsx              # Provedor global (Zustand Auth, React Query, NativeWind)
├── (auth)/                  # Grupo de rotas públicas (Login/Cadastro)
│   ├── _layout.tsx          # Layout empilhado (Stack) para autenticação
│   ├── login.tsx            # Tela de Login
│   └── cadastro.tsx         # Tela de Registro de Novo Usuário
└── (app)/                   # Grupo de rotas protegidas (Requer JWT)
    ├── _layout.tsx          # Layout de Navegação (Tabs no Mobile / Sidebar na Web)
    ├── index.tsx            # Dashboard / Overview (Gráficos, saldo geral, últimas transações)
    ├── transacoes.tsx       # Extrato completo com filtros por período e categoria
    ├── contas.tsx           # Gerenciamento de Contas/Carteiras
    └── categorias.tsx       # Gerenciamento de Categorias customizadas