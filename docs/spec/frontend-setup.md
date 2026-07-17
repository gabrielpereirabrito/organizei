# Spec: Setup do Frontend (organizei-app)

## Objetivo
Estruturar a base do frontend do `organizei-app`, um sistema híbrido (Mobile e Web) de finanças pessoais. O frontend será construído com **React Native, Expo Router e TypeScript**, consumindo um backend já operacional em Fastify + Prisma + Neon.

## Diretrizes Arquiteturais e Regras de Negócio (Contexto dos ADRs)

- **Comportamento Híbrido:** O aplicativo deve rodar nativamente no Mobile (iOS/Android via Expo) e na Web compartilhando a mesma base de código.
- **Autenticação Híbrida (ADR 0004):** 
  - **Web:** O Axios deve gerenciar automaticamente os Cookies HTTP-Only (`withCredentials: true`).
  - **Mobile:** O token JWT deve ser armazenado localmente via `expo-secure-store` e enviado via Header (`Authorization: Bearer <TOKEN>`).
- **Regra dos Centavos (ADR 0003):** Todos os valores monetários trafegam como inteiros (Int). (Ex: R$ 700,00 é tratado como `70000`). O frontend é exclusivamente responsável por dividir por 100 na hora da formatação e exibição na UI.
- **Gerenciamento de Estado:** 
  - **Zustand:** Para estados globais de UI e Sessão (ex: dados do usuário).
  - **TanStack Query (React Query):** Para o estado de servidor (cache, fetches, mutações, loadings).
- **Estilização:** **NativeWind (v4)** atuando como o motor Tailwind CSS unificado para ambas as plataformas.

---

## 📝 Checklist de Implementação (Spec-Driven)

### 📁 Etapa 1: Estrutura de Pastas e Configurações Base
- [x] **1.1.** Criar a árvore de arquivos e diretórios dentro da pasta `frontend/`:
  - `frontend/app/` (Rotas e Layouts do Expo Router)
  - `frontend/src/modules/` (Features e domínios independentes)
  - `frontend/src/shared/` (Código global, hooks compartilhados e utilitários)
- [x] **1.2.** Configurar o Tailwind / NativeWind (v4), incluindo a criação do arquivo `tailwind.config.js` e dos arquivos globais de estilo necessários para rodar nativamente no Mobile e na Web.

### 🔌 Etapa 2: Serviços e Estado Global (Data Layer)
- [x] **2.1.** Criar o arquivo `src/shared/api-client/api.ts` utilizando Axios:
  - Configurar a `baseURL` consumindo as variáveis de ambiente (`EXPO_PUBLIC_API_URL`).
  - Ativar `withCredentials: true`.
  - Adicionar um **interceptor** que detecte a plataforma. Caso **não seja Web**, buscar o token no `expo-secure-store` e injetá-lo no Header `Authorization`.
- [x] **2.2.** Criar a store de autenticação `src/modules/auth/stores/auth.store.ts` com Zustand:
  - Deve gerenciar o objeto `usuario` (id, nome, email) e o `token`.
  - No Mobile, persistir e remover o token de forma segura utilizando `SecureStore.setItemAsync` e `SecureStore.deleteItemAsync`.

### 🏠 Etapa 3: Arquitetura de Rotas (Expo Router Skeleton)
- [x] **3.1.** Criar o Root Layout (`app/_layout.tsx`):
  - Injetar provedores globais indispensáveis, como o `QueryClientProvider` (React Query).
  - Importar e aplicar o tema/estilo global do NativeWind.
- [x] **3.2.** Estruturar o Grupo de Rotas Públicas (`app/(auth)/`):
  - `_layout.tsx`: Configurar um layout do tipo Stack.
  - `login.tsx`: Interface básica de Login com campos de e-mail e senha.
  - `cadastro.tsx`: Interface básica de Registro com campos de nome, e-mail e senha.
- [x] **3.3.** Estruturar o Grupo de Rotas Protegidas (`app/(app)/`):
  - `_layout.tsx`: Layout inteligente.
    - Se for Mobile, renderiza `Tabs` (barra inferior de navegação).
    - Se for Web, renderiza uma Sidebar (menu lateral).
    - Deve checar se o usuário está autenticado no `useAuthStore` (ou via presença de cookie/token). Caso não esteja, redirecionar automaticamente para `(auth)/login`.
  - `index.tsx`: Tela de Dashboard / Overview (vazia, apenas com título para validação de rota).
  - `transacoes.tsx`: Tela de Extrato (vazia).
  - `categorias.tsx`: Tela de Categorias (vazia).

### 🧪 Etapa 4: Integração das Telas de Auth com a API
- [x] **4.1.** Implementar funcionalidade na tela `cadastro.tsx`:
  - Disparar a submissão do formulário realizando um `POST /auth/cadastro`.
  - Em caso de sucesso (HTTP 201), salvar a sessão no `useAuthStore` e redirecionar para a rota protegida `(app)/index`.
- [x] **4.2.** Implementar funcionalidade na tela `login.tsx`:
  - Disparar a submissão do formulário realizando um `POST /auth/login`.
  - Em caso de sucesso (HTTP 200), salvar a sessão no `useAuthStore` e redirecionar para a rota protegida `(app)/index`.
