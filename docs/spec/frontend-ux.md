# Spec: UX, Design System e Próximos Passos (organizei-app)

Este documento centraliza as diretrizes visuais, de experiência do usuário (UX) e o plano de ação para os próximos grandes módulos do aplicativo.

---

## 🎨 1. Diretrizes de Design e Tailwind
A paleta semântica deve guiar toda a comunicação visual da saúde financeira do usuário.

- **Cores Semânticas (`tailwind.config.js`)**:
  - `finance-verde`: `#00B074` (Receitas, saldos positivos)
  - `finance-vermelho`: `#FF4C4C` (Despesas, faturas)
  - `finance-alerta`: `#FFB020` (Metas próximas do limite)
  - `finance-fundo`: `#F8F9FA` (Background geral)
  - `finance-card`: `#FFFFFF` (Superfícies)
  - `finance-texto`: `#1A1A1A` (Tipografia)
  - `finance-mutado`: `#71717A` (Labels secundárias)
- **Boas Práticas**: Usar sintaxe de opacidade (ex: `bg-finance-verde/10`) e `md:`, `lg:` apenas para reestruturação Web.

---

## 🧩 2. Componentização Atômica
Componentes base para manter o código DRY (`src/shared/components/ui/`):

- `[ ]` **`<CurrencyInput />`**: Componente crítico. Intercepta digitação, aplica máscara visual (ex: digitou 1050 -> R$ 10,50), mas envia `1050` (inteiro) para a API (Regra dos Centavos - ADR 0003).
- `[ ]` **`<FinanceCard />`**: Container padrão (`rounded-2xl`, `shadow-sm`, `bg-finance-card`, `p-5`).
- `[ ]` **`<StatusBadge />`**: Badge compacto para exibir status de transações e metas usando as cores semânticas.

---

## 📱 3. Experiência do Usuário (UX) e Animações
O aplicativo deve parecer fluido, nativo e seguro a 60 FPS, utilizando a biblioteca **Moti**.

- `[ ]` **Botão de Ação Rápida (Bottom Sheet)**: O botão de "Adicionar Transação" não abre uma tela inteira, e sim um Modal deslizante (Bottom Sheet) de baixo para cima para reduzir atrito.
- `[ ]` **Ocultabilidade de Dados (Modo Privacidade)**: Estado global no Zustand gerenciado por um ícone 👁️ no Header. Transforma qualquer valor monetário em `•••••`.
- `[ ]` **Animações (Moti)**:
  - Skeleton Loaders nos carregamentos iniciais.
  - *Stagger* (efeito em cascata) no carregamento das listas do Extrato.
  - Modais com transições do tipo mola (*spring*).

---

## 🗺️ 4. Roteiro dos 5 Grandes Módulos (Next Steps)
As funcionalidades pendentes serão moldadas sob estas novas diretrizes de UX:

1. **Formulário de Nova Transação**:
   - Construir usando `<CurrencyInput />`, `<FinanceCard />` e disparar de um Bottom Sheet animado (Moti).
   - Utilizar `react-hook-form` + `zod` para validação de dados antes de submeter à API.
2. **Filtros de Mês no Extrato**:
   - Adicionar o carrossel de navegação de tempo animado no topo da tela `extrato.tsx`.
3. **Módulo de Contas (Carteiras)**:
   - CRUD para cadastrar múltiplas contas bancárias (ex: Nubank, Inter). Integração na criação de transações.
4. **Módulo de Assinaturas (Recorrências)**:
   - Listagem para gerenciar e visualizar os gastos fixos disparados pelo Cronjob do backend.
   - Utilizar as barras de progresso (verde/alerta/vermelha) para exibir o impacto da assinatura na meta mensal.
5. **Dashboard e Gráficos**:
   - Evoluir a tela *Overview* com gráficos dinâmicos (`victory-native` ou similar) das despesas por categoria.
