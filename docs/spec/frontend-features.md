# Spec: Funcionalidades Core do Frontend (organizei-app)

Esta spec detalha a construção das interfaces, integração com o React Query e a construção do Dashboard, seguindo a Arquitetura Modular e o Design Híbrido (Mobile/Web).

---

## 🎨 Etapa 5: UI System (Componentes Reutilizáveis)
Construção da base visual usando `NativeWind v4` e padrões Clean Code.

- [x] **Componente `Button`**: 
  - Variantes de cor: `primary`, `secondary`, `danger`, `ghost`.
  - Suporte nativo a estado de `isLoading` (spinner) e `disabled`.
- [x] **Componente `Input`**:
  - Suporte a `label`, `error` (mensagem de validação), e máscara/formatação visual.
- [x] **Componente `Modal`**:
  - Base acessível e responsiva para exibir formulários rápidos ou confirmações de deleção.
- [x] **Componente `Card`**:
  - Container estilizado base para exibir estatísticas no dashboard e agrupar listas.

---

## 🔄 Etapa 6: CRUD e Integração de Dados (TanStack Query)
A camada de Server-State será gerenciada pelo React Query.

### 6.1 Categorias
- [x] **Hooks de Dados (`src/modules/categorias/hooks/`)**:
  - `useCategorias`: (GET) Listagem cacheada.
  - `useCriarCategoria`, `useAtualizarCategoria`, `useDeletarCategoria`: (Mutations) com invalidação automática de cache.
- [x] **Tela de Listagem (`categorias-lista.tsx`)**:
  - Exibir a lista de categorias.
  - Indicador visual se a categoria é Receita ou Despesa.
- [x] **Interações (Formulários)**:
  - Integração do Modal para criar e editar categorias.

### 6.2 Transações (Extrato)
- [x] **Hooks de Dados (`src/modules/transacoes/hooks/`)**:
  - `useTransacoes`: (GET) Extrato mensal.
  - Mutações de criação/edição/deleção.
- [x] **Regra dos Centavos (ADR 0003)**:
  - Implementar formatter visual global (`formatarMoeda`) que divide o valor recebido da API por `100` para exibição na UI (R$ 70000 -> R$ 700,00).
- [x] **Tela de Extrato (`extrato.tsx`)**:
  - Filtro básico de mês/ano.
  - Listagem com cores dinâmicas (Verde para Receitas, Vermelho para Despesas).
- [ ] **Interações (Formulários)**:
  - Modal para Lançamento de nova transação. (Pendente formulário completo)

---

## 📊 Etapa 7: Dashboard (Visão Geral)
- [x] **Resumo Financeiro**:
  - Consumir os dados reais da API (`GET /transacoes/resumo-mensal` ou similar).
  - Exibir `Cards` com: **Receitas do Mês**, **Despesas do Mês** e **Saldo Atual**.
- [x] **Estrutura Visual (`overview.tsx`)**:
  - Layout limpo e moderno focando na experiência imediata do usuário ao logar.
