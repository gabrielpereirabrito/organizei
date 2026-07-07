# ADR 0003: Padrão de Armazenamento e Trafego de Valores Monetários

## Status
Aprovado

## Contexto
O JavaScript e o PostgreSQL lidam de formas específicas com tipos de ponto flutuante (`Float`, `Double`, `Real`), o que frequentemente gera pequenos erros crônicos de arredondamento em operações matemáticas (ex: `0.1 + 0.2 = 0.30000000000000004`). Em sistemas financeiros, isso invalida saldos e relatórios.

## Decisão
Fica estritamente determinado que:
1.  **Valores em Centavos:** Todo e qualquer valor monetário (como saldos e transações) será tratado e persistido como um número inteiro (`Int`) representando os valores **em centavos**. (Exemplo: R$ 42,50 será enviado e salvo como `4250`).
2.  **Validação:** O framework de validação Zod (no back e front) rejeitará formatos decimais brutos nas requisições.
3.  **Tratamento Visual:** O frontend será o único responsável por formatar esse inteiro em formato de moeda local (ex: utilizando `Intl.NumberFormat`) apenas no momento de exibir na tela.

## Consequências
*   **Positivas:** Eliminação completa de erros de precisão matemática e facilidade em realizar queries de soma (`SUM`) diretamente no banco de dados.
*   **Negativas/Riscos:** Requer atenção redobrada no desenvolvimento do front para multiplicar por 100 antes de enviar os dados e dividir por 100 ao exibir os dados.