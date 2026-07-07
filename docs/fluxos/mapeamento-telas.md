# Mapeamento de Telas (Expo Router)

Estrutura de arquivos dentro de `frontend/app/` refletindo a navegação do aplicativo.

## 1. Grupo de Autenticação `(auth)`
Rotas acessíveis apenas para usuários não autenticados.
*   `frontend/app/(auth)/login.tsx` ➔ Tela de Login.
*   `frontend/app/(auth)/cadastro.tsx` ➔ Tela de criação de conta.

## 2. Grupo Principal `(app)`
Rotas protegidas por middleware de autenticação (JWT). Utiliza navegação por abas (**Tabs**) no Mobile e se adapta para visualização Web.

*   `frontend/app/(app)/_layout.tsx` ➔ Define a estrutura de Tabs (Mobile) ou Sidebar (Web).
*   `frontend/app/(app)/index.tsx` ➔ **Dashboard / Home**: Mostra saldo atual das contas, atalho para nova transação e o resumo gráfico do mês.
*   `frontend/app/(app)/extrato.tsx` ➔ **Extrato**: Listagem histórica de transações com filtros por período, tipo (Receita/Despesa) e categoria.
*   `frontend/app/(app)/contas.tsx` ➔ **Minhas Contas**: Gerenciamento de carteiras/bancos (Itaú, Nubank, Dinheiro).
*   `frontend/app/(app)/configuracoes.tsx` ➔ **Configurações**: Perfil, gerenciamento de notificações do Expo e temas.

## 3. Modais Globais
*   `frontend/app/nova-transacao.tsx` ➔ Modal de abertura rápida para cadastrar receita ou despesa de qualquer tela.