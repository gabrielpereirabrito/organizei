# Contratos de Interface da API (MVP)

Este documento especifica os payloads de entrada e saída das rotas críticas do sistema. Todos os valores monetários trafegam como inteiros (centavos) e datas em UTC.

## 1. Autenticação

### POST `/auth/cadastro`
Cria um novo usuário no sistema e já realiza o login automático.
*   **Payload de Entrada (JSON):**
    ```json
    {
      "nome": "Seu Nome",
      "email": "usuario@email.com",
      "senha": "string_hash_ou_plana"
    }
    ```
*   **Resposta (HTTP 201):**
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "usuario": {
        "id": "uuid-do-usuario",
        "nome": "Seu Nome",
        "email": "usuario@email.com"
      }
    }
    ```

### POST `/auth/login`
Autentica o usuário existente.
*   **Payload de Entrada (JSON):**
    ```json
    {
      "email": "usuario@email.com",
      "senha": "sua_senha"
    }
    ```
*   **Resposta (HTTP 200):** Mesmo JSON de retorno do cadastro (token + dados do usuário).

---

## 2. Contas e Categorias
*Nota: Todas as rotas abaixo exigem o Header `Authorization: Bearer <JWT_TOKEN>`.*

### GET `/contas`
Lista as contas/carteiras do usuário logado.
*   **Resposta (HTTP 200):**
    ```json
    [
      {
        "id": "uuid-da-conta",
        "nome": "Nubank",
        "tipo": "CORRENTE",
        "saldoAtual": 150000
      }
    ]
    ```

### POST `/contas`
Cria uma nova conta para o usuário logado.
*   **Payload de Entrada (JSON):**
    ```json
    {
      "nome": "Itaú",
      "tipo": "CORRENTE",
      "saldoInicial": 50000
    }
    ```
*   **Resposta (HTTP 201):** Retorna o objeto da conta criado.

### GET `/categorias`
Lista as categorias do usuário logado.
*   **Query Params (Opcional):** `?tipo=DESPESA` ou `?tipo=RECEITA`
*   **Resposta (HTTP 200):**
    ```json
    [
      {
        "id": "uuid-da-categoria",
        "nome": "Alimentação",
        "icone": "fast-food",
        "cor": "#FF5733",
        "tipo": "DESPESA"
      }
    ]
    ```

---

## 3. Transações
*Nota: Todas as rotas abaixo exigem o Header `Authorization: Bearer <JWT_TOKEN>`.*

### POST `/transacoes`
Registra uma nova receita ou despesa e atualiza o saldo da conta vinculada através de uma transação atômica no banco.
*   **Payload de Entrada (JSON):**
    ```json
    {
      "descricao": "Uber para o trabalho",
      "valor": 2250, 
      "tipo": "DESPESA",
      "data": "2026-07-07T14:00:00.000Z",
      "contaId": "uuid-da-conta",
      "categoriaId": "uuid-da-categoria"
    }
    ```
*   **Resposta (HTTP 201):** Retorna o objeto completo criado.

### GET `/transacoes/resumo-mensal`
Busca os dados agregados do mês atual para preencher os gráficos e overviews do dashboard.
*   **Query Params (Opcional):** `?mes=07&ano=2026`
*   **Resposta (HTTP 200):**
    ```json
    {
      "totalReceitas": 550000,
      "totalDespesas": 125000,
      "saldoPeriodo": 425000,
      "gastosPorCategoria": [
        { "categoria": "Alimentação", "valor": 45000, "cor": "#FF5733" },
        { "categoria": "Transporte", "valor": 2250, "cor": "#3357FF" }
      ]
    }
    ```