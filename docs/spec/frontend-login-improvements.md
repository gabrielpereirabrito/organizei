# Frontend Login Improvements Spec

## 1. Visão Geral
Este documento especifica as melhorias na tela de Login do aplicativo móvel, focando em usabilidade (UX), personalização visual e segurança com conveniência.

## 2. Objetivos
- Permitir que o usuário memorize o seu e-mail e/ou senha para acessos futuros.
- Fornecer acesso rápido por meio de Biometria (Face ID e Touch ID) após o primeiro login bem-sucedido.
- Adicionar um seletor rápido (toggle) de Tema (Dark/Light) na tela de login, defaultando para a preferência do sistema, com transição suave de UI.

## 3. Funcionalidades Detalhadas

### 3.1. Lembrar de Mim
- **UI:** Um `Checkbox` customizado será exibido abaixo do campo de e-mail/senha.
- **Lógica:**
  - Se marcado, após um login de sucesso, o app salvará as credenciais localmente usando o `expo-secure-store`.
  - Ao iniciar o app e a tela de login for carregada, as credenciais salvas serão auto-preenchidas.
  - Se a pessoa realizar um login normal de sucesso sem o checkbox marcado, as credenciais anteriores salvas (se existirem) não serão limpas, a não ser que explícitamente ela desmarque o checkbox. Para garantir segurança, o checkbox pode vir marcado se já existirem credenciais, e se o usuário desmarcar e fizer login, limpamos o storage.

### 3.2. Acesso por Biometria
- **UI:** Exibição de um ícone/botão de biometria ao lado ou no lugar do botão de entrar primário, *caso o usuário tenha salvo as credenciais*.
- **Lógica:**
  - Dependência: `expo-local-authentication`.
  - Verifica suporte a hardware biométrico no dispositivo.
  - Verifica se o usuário tem credenciais salvas no `SecureStore`.
  - Ao abrir a tela de login, se o usuário já tiver escolhido lembrar a senha no passado, o prompt biométrico pode ser invocado automaticamente ou após clique.
  - Se a autenticação biométrica for bem-sucedida, o app recupera as credenciais criptografadas e realiza a requisição de login (`POST /auth/login`) transparente para o backend.

### 3.3. Tema (Dark/Light Mode) Toggle
- **UI:** Um botão circular (ícone de Sol e Lua) posicionado no cabeçalho ou área limpa do Login.
- **Transição:** Utilização da biblioteca `Moti` ou estilização `NativeWind` fluída para que a troca de fundo (cores de fundo e botões) transicione de modo suave (fade-in/out colorido).
- **Lógica:**
  - Modifica a variável global gerenciada pelo `useThemeStore`.
  - O valor default acompanha a preferência nativa do sistema através do estado pré-existente no hook customizado.

## 4. Requisitos de Permissões
Para o ambiente iOS, é fundamental documentar a permissão `NSFaceIDUsageDescription` no `app.json` com a mensagem: `"Este aplicativo usa o Face ID para um login rápido e seguro"`. O Android não exige permissões de runtime extras declaradas além das nativas de fingerprint inseridas automaticamente pela dependência da Expo.
