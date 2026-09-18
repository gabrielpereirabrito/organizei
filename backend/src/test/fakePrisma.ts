/**
 * Prisma falso em memória, usado nos testes de controller.
 *
 * Por que não testar contra o banco real: `DATABASE_URL` aponta para o Postgres
 * gerenciado da aplicação — rodar o ciclo criar/editar/deletar contra ele
 * mexeria em dados de verdade. E por que não um mock com `vi.fn()` puro: o risco
 * que estes testes precisam cobrir é *aritmético* (o saldo acabou certo?), não
 * "a função foi chamada?". Este fake aplica `increment`/`decrement` de fato, então
 * os testes conseguem assertar `saldoAtual` como número.
 *
 * Cobre só o subconjunto do client que os controllers de transação usam.
 */

import { Prisma } from '@prisma/client'

export type ContaFake = {
  id: string
  usuarioId: string
  nome: string
  saldoAtual: number
  ativa: boolean
}

export type CategoriaFake = {
  id: string
  usuarioId: string
  nome: string
  tipo: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA'
  cor: string
}

export type SubcategoriaFake = {
  id: string
  usuarioId: string
  categoriaId: string
  nome: string
  ativa: boolean
}

export type TransacaoFake = {
  id: string
  descricao: string
  valor: number
  tipo: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA'
  status: 'PENDENTE' | 'PAGA' | 'VENCIDA'
  dataVencimento: Date
  dataPagamento: Date | null
  usuarioId: string
  contaId: string
  contaDestinoId: string | null
  categoriaId: string
  subcategoriaId: string | null
  recorrenciaId: string | null
}

type OperacaoNumerica = number | { increment?: number; decrement?: number }

function aplicarOperacaoNumerica(atual: number, operacao: OperacaoNumerica): number {
  if (typeof operacao === 'number') return operacao
  if (operacao.increment !== undefined) return atual + operacao.increment
  if (operacao.decrement !== undefined) return atual - operacao.decrement
  return atual
}

// Devolve uma cópia para que o código sob teste não mute o "banco" por referência
// — no Prisma real cada consulta traz um objeto novo.
const copiar = <T>(registro: T): T => ({ ...registro })

export function criarPrismaFake(
  estadoInicial: {
    contas?: ContaFake[]
    categorias?: CategoriaFake[]
    subcategorias?: SubcategoriaFake[]
    transacoes?: TransacaoFake[]
  } = {},
) {
  const db = {
    contas: new Map<string, ContaFake>(),
    categorias: new Map<string, CategoriaFake>(),
    subcategorias: new Map<string, SubcategoriaFake>(),
    transacoes: new Map<string, TransacaoFake>(),
  }

  for (const conta of estadoInicial.contas ?? []) db.contas.set(conta.id, { ...conta })
  for (const categoria of estadoInicial.categorias ?? [])
    db.categorias.set(categoria.id, { ...categoria })
  for (const subcategoria of estadoInicial.subcategorias ?? [])
    db.subcategorias.set(subcategoria.id, { ...subcategoria })
  for (const transacao of estadoInicial.transacoes ?? [])
    db.transacoes.set(transacao.id, { ...transacao })

  let proximoId = 1
  const gerarId = () => {
    const sufixo = String(proximoId++).padStart(12, '0')
    return `ffffffff-0000-4000-8000-${sufixo}`
  }

  const prisma = {
    // Acesso direto ao estado, só para as asserções dos testes.
    _db: db,

    conta: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        const conta = db.contas.get(where.id)
        return conta ? copiar(conta) : null
      },
      findMany: async () => Array.from(db.contas.values()).map(copiar),
      update: async ({
        where,
        data,
      }: {
        where: { id: string }
        data: { saldoAtual?: OperacaoNumerica; [campo: string]: unknown }
      }) => {
        const conta = db.contas.get(where.id)
        if (!conta) throw new Error(`[fakePrisma] Conta inexistente: ${where.id}`)

        if (data.saldoAtual !== undefined) {
          conta.saldoAtual = aplicarOperacaoNumerica(conta.saldoAtual, data.saldoAtual)
        }
        for (const [campo, valor] of Object.entries(data)) {
          if (campo !== 'saldoAtual') (conta as Record<string, unknown>)[campo] = valor
        }
        return copiar(conta)
      },
    },

    categoria: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        const categoria = db.categorias.get(where.id)
        return categoria ? copiar(categoria) : null
      },
      findFirst: async ({ where }: { where: { usuarioId: string; tipo: string } }) => {
        const encontrada = Array.from(db.categorias.values()).find(
          (c) => c.usuarioId === where.usuarioId && c.tipo === where.tipo,
        )
        return encontrada ? copiar(encontrada) : null
      },
      create: async ({ data }: { data: Omit<CategoriaFake, 'id'> }) => {
        const categoria: CategoriaFake = { id: gerarId(), ...data }
        db.categorias.set(categoria.id, categoria)
        return copiar(categoria)
      },
    },

    subcategoria: {
      // `include._count` e suportado porque `deletarSubcategoria` depende dele
      // para decidir entre 204 e 409. Recorrencias e metas nao existem no fake,
      // entao contam sempre zero.
      findUnique: async ({
        where,
        include,
      }: {
        where: { id: string }
        include?: { _count?: unknown }
      }) => {
        const subcategoria = db.subcategorias.get(where.id)
        if (!subcategoria) return null

        if (!include?._count) return copiar(subcategoria)

        const transacoes = Array.from(db.transacoes.values()).filter(
          (t) => t.subcategoriaId === where.id,
        ).length

        return {
          ...copiar(subcategoria),
          _count: { transacoes, recorrencias: 0, metasCategorias: 0 },
        }
      },
      findFirst: async ({
        where,
      }: {
        where: { usuarioId?: string; categoriaId?: string; nome?: string }
      }) => {
        const encontrada = Array.from(db.subcategorias.values()).find(
          (s) =>
            (where.usuarioId === undefined || s.usuarioId === where.usuarioId) &&
            (where.categoriaId === undefined || s.categoriaId === where.categoriaId) &&
            (where.nome === undefined || s.nome === where.nome),
        )
        return encontrada ? copiar(encontrada) : null
      },
      findMany: async ({
        where,
      }: {
        where?: { usuarioId?: string; categoriaId?: string; ativa?: boolean }
      } = {}) =>
        Array.from(db.subcategorias.values())
          .filter(
            (s) =>
              (where?.usuarioId === undefined || s.usuarioId === where.usuarioId) &&
              (where?.categoriaId === undefined || s.categoriaId === where.categoriaId) &&
              (where?.ativa === undefined || s.ativa === where.ativa),
          )
          .sort((a, b) => a.nome.localeCompare(b.nome))
          .map(copiar),
      create: async ({ data }: { data: Partial<SubcategoriaFake> }) => {
        const subcategoria = { id: gerarId(), ativa: true, ...data } as SubcategoriaFake

        // Reproduz o @@unique([categoriaId, nome]) para o controller poder ser
        // testado no caminho do 409.
        const duplicada = Array.from(db.subcategorias.values()).some(
          (s) =>
            s.categoriaId === subcategoria.categoriaId && s.nome === subcategoria.nome,
        )
        if (duplicada) {
          // Instancia real: o controller decide o 409 com `instanceof`.
          throw new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
            code: 'P2002',
            clientVersion: 'fake',
          })
        }

        db.subcategorias.set(subcategoria.id, subcategoria)
        return copiar(subcategoria)
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string }
        data: Partial<SubcategoriaFake>
      }) => {
        const subcategoria = db.subcategorias.get(where.id)
        if (!subcategoria)
          throw new Error(`[fakePrisma] Subcategoria inexistente: ${where.id}`)

        for (const [campo, valor] of Object.entries(data)) {
          if (valor !== undefined)
            (subcategoria as Record<string, unknown>)[campo] = valor
        }
        return copiar(subcategoria)
      },
      delete: async ({ where }: { where: { id: string } }) => {
        const subcategoria = db.subcategorias.get(where.id)
        if (!subcategoria)
          throw new Error(`[fakePrisma] Subcategoria inexistente: ${where.id}`)
        db.subcategorias.delete(where.id)
        return copiar(subcategoria)
      },
    },

    transacao: {
      create: async ({ data }: { data: Partial<TransacaoFake> }) => {
        const transacao = {
          id: gerarId(),
          dataPagamento: null,
          contaDestinoId: null,
          subcategoriaId: null,
          recorrenciaId: null,
          ...data,
        } as TransacaoFake
        db.transacoes.set(transacao.id, transacao)
        return copiar(transacao)
      },
      findUnique: async ({ where }: { where: { id: string } }) => {
        const transacao = db.transacoes.get(where.id)
        return transacao ? copiar(transacao) : null
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string }
        data: Partial<TransacaoFake>
      }) => {
        const transacao = db.transacoes.get(where.id)
        if (!transacao) throw new Error(`[fakePrisma] Transação inexistente: ${where.id}`)

        for (const [campo, valor] of Object.entries(data)) {
          if (valor !== undefined) (transacao as Record<string, unknown>)[campo] = valor
        }
        return copiar(transacao)
      },
      delete: async ({ where }: { where: { id: string } }) => {
        const transacao = db.transacoes.get(where.id)
        if (!transacao) throw new Error(`[fakePrisma] Transação inexistente: ${where.id}`)
        db.transacoes.delete(where.id)
        return copiar(transacao)
      },
    },

    // O controller usa as duas formas: array de operações (criarTransacao) e
    // callback interativo (editarTransacao/deletarTransacao).
    $transaction: async (arg: unknown) => {
      if (Array.isArray(arg)) return Promise.all(arg)
      return (arg as (tx: typeof prisma) => Promise<unknown>)(prisma)
    },
  }

  return prisma
}

export type PrismaFake = ReturnType<typeof criarPrismaFake>
