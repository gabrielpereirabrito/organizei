# ADR 0001: Definição da Stack Tecnológica do MVP

## Status
Aprovado

## Contexto
Precisamos desenvolver um sistema de finanças pessoais focado em uso mobile (iOS e Android), mas com a flexibilidade de ser acessado via navegadores Web caso necessário. O foco do MVP é velocidade de entrega, reuso de código e facilidade de manutenção.

## Decisão
Adotamos as seguintes tecnologias para o ecossistema do aplicativo:
*   **Frontend:** React Native com Expo, utilizando TypeScript e Expo Router (para navegação nativa unificada entre Mobile e Web).
*   **Estilização:** NativeWind (v4) para aplicar Tailwind CSS globalmente.
*   **Gerenciamento de Estado:** Zustand para estados globais leves da UI e TanStack Query (React Query) com Axios para gerenciamento de requisições e cache de dados de servidor.
*   **Backend:** API REST construída em Node.js com TypeScript, hospedada no plano gratuito da Render.
*   **Notificações:** Expo Notifications para envio de alertas e lembretes aos dispositivos móveis.

## Consequências
*   **Positivas:** Compartilhamento massivo de código entre as plataformas, tipagem estática e um fluxo de desenvolvimento moderno focado em performance.
*   **Negativas/Riscos:** A Render possui um comportamento de *cold start* (hibernação após 15 minutos de inatividade) no plano gratuito. A interface do app precisará lidar visualmente com esse tempo de espera na primeira requisição do dia.