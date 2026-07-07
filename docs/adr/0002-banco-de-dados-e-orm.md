# ADR 0002: Escolha do Banco de Dados e ORM para o MVP

## Status
Aprovado

## Contexto
O sistema de finanças pessoais necessita de alta consistência de dados (garantia ACID) para evitar inconsistências em saldos e históricos de transações. Além disso, buscamos custos zero de infraestrutura para o MVP e uma excelente experiência de desenvolvimento com tipagem estática (TypeScript).

## Decisão
Decidimos utilizar o banco de dados **PostgreSQL hospedado no Neon** em conjunto com o **Prisma ORM** no backend Node.js.

## Consequências
*   **Positivas:** 
    *   Total consistência relacional para transações financeiras.
    *   Camada gratuita vitalícia no Neon (dentro do limite de 10GB).
    *   Tipagem automática de ponta a ponta gerada pelo Prisma Client.
    *   Interface visual facilitada através do Prisma Studio durante o desenvolvimento.
*   **Negativas/Riscos:**
    *   A engine do Prisma pode adicionar um leve aumento no tempo de inicialização (*cold start*) na Render gratuita quando o container acordar.