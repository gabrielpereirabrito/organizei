import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AppError } from '@/utils/AppError'
import { criarPrismaFake, type PrismaFake } from '@/test/fakePrisma'
import { criarRequest, criarReply, comoReply, capturarErro } from '@/test/fakeHttp'

// Mesmo padrão de transacoes.test.ts: o client real abre um Pool de Postgres no
// import, então aqui ele é trocado pelo fake em memória. O getter é necessário
// porque cada teste monta um fake novo no beforeEach.
const estado = vi.hoisted(() => ({ prisma: null as unknown }))
vi.mock('@/lib/prisma', () => ({
  get prisma() {
    return estado.prisma
  },
}))

import {
  criarSubcategoria,
  listarSubcategorias,
  atualizarSubcategoria,
  inativarSubcategoria,
  ativarSubcategoria,
  deletarSubcategoria,
} from './subcategorias'

const USUARIO = 'aaaaaaaa-0000-4000-8000-000000000001'
const OUTRO_USUARIO = 'bbbbbbbb-0000-4000-8000-000000000002'
const CONTA = '11111111-0000-4000-8000-000000000001'
const CATEGORIA = '44444444-0000-4000-8000-000000000004'
const OUTRA_CATEGORIA = 'aaaaaaaa-0000-4000-8000-00000000000a'
const CATEGORIA_ALHEIA = '55555555-0000-4000-8000-000000000005'
const SUBCATEGORIA = '77777777-0000-4000-8000-000000000007'
const SUBCATEGORIA_ALHEIA = '99999999-0000-4000-8000-000000000009'
const TRANSACAO = '66666666-0000-4000-8000-000000000006'

let prisma: PrismaFake

beforeEach(() => {
  prisma = criarPrismaFake({
    contas: [
      {
        id: CONTA,
        usuarioId: USUARIO,
        nome: 'Conta A',
        saldoAtual: 100_000,
        ativa: true,
      },
    ],
    categorias: [
      {
        id: CATEGORIA,
        usuarioId: USUARIO,
        nome: 'Alimentação',
        tipo: 'DESPESA',
        cor: '#000',
      },
      {
        id: OUTRA_CATEGORIA,
        usuarioId: USUARIO,
        nome: 'Transporte',
        tipo: 'DESPESA',
        cor: '#222',
      },
      {
        id: CATEGORIA_ALHEIA,
        usuarioId: OUTRO_USUARIO,
        nome: 'Alheia',
        tipo: 'DESPESA',
        cor: '#111',
      },
    ],
    subcategorias: [
      {
        id: SUBCATEGORIA,
        usuarioId: USUARIO,
        categoriaId: CATEGORIA,
        nome: 'iFood',
        ativa: true,
      },
      {
        id: SUBCATEGORIA_ALHEIA,
        usuarioId: OUTRO_USUARIO,
        categoriaId: CATEGORIA_ALHEIA,
        nome: 'Alheia',
        ativa: true,
      },
    ],
  })
  estado.prisma = prisma
})

async function criar(body: Record<string, unknown>, usuarioId = USUARIO) {
  const reply = criarReply()
  await criarSubcategoria(criarRequest({ usuarioId, body }), comoReply(reply))
  return reply
}

async function listar(query: Record<string, unknown> = {}, usuarioId = USUARIO) {
  const reply = criarReply()
  await listarSubcategorias(criarRequest({ usuarioId, query }), comoReply(reply))
  return reply
}

async function atualizar(id: string, body: Record<string, unknown>, usuarioId = USUARIO) {
  const reply = criarReply()
  await atualizarSubcategoria(
    criarRequest({ usuarioId, params: { id }, body }),
    comoReply(reply),
  )
  return reply
}

async function deletar(id: string, usuarioId = USUARIO) {
  const reply = criarReply()
  await deletarSubcategoria(criarRequest({ usuarioId, params: { id } }), comoReply(reply))
  return reply
}

describe('criarSubcategoria', () => {
  it('cria herdando o usuarioId da categoria mae', async () => {
    const reply = await criar({ categoriaId: CATEGORIA, nome: 'Mercado' })

    expect(reply.statusCode).toBe(201)
    const criada = reply.payload as { id: string; usuarioId: string; categoriaId: string }
    expect(criada.usuarioId).toBe(USUARIO)
    expect(criada.categoriaId).toBe(CATEGORIA)
  })

  it('rejeita criar dentro de categoria de outro usuario', async () => {
    const erro = await capturarErro(() =>
      criar({ categoriaId: CATEGORIA_ALHEIA, nome: 'Invasão' }),
    )

    expect(erro).toBeInstanceOf(AppError)
    expect((erro as AppError).statusCode).toBe(404)
    expect(prisma._db.subcategorias.size).toBe(2)
  })

  it('responde 409 quando o nome ja existe na mesma categoria', async () => {
    const reply = await criar({ categoriaId: CATEGORIA, nome: 'iFood' })

    expect(reply.statusCode).toBe(409)
  })

  it('permite o mesmo nome em categorias diferentes', async () => {
    const reply = await criar({ categoriaId: OUTRA_CATEGORIA, nome: 'iFood' })

    expect(reply.statusCode).toBe(201)
  })
})

describe('listarSubcategorias', () => {
  it('lista apenas as do usuario logado', async () => {
    const reply = await listar()

    const lista = reply.payload as { id: string }[]
    expect(lista).toHaveLength(1)
    expect(lista[0].id).toBe(SUBCATEGORIA)
  })

  it('filtra por categoriaId', async () => {
    await criar({ categoriaId: OUTRA_CATEGORIA, nome: 'Combustível' })

    const reply = await listar({ categoriaId: OUTRA_CATEGORIA })

    const lista = reply.payload as { nome: string }[]
    expect(lista).toHaveLength(1)
    expect(lista[0].nome).toBe('Combustível')
  })

  it('filtra por ativa', async () => {
    await inativarSubcategoria(
      criarRequest({ usuarioId: USUARIO, params: { id: SUBCATEGORIA } }),
      comoReply(criarReply()),
    )

    const ativas = await listar({ ativa: 'true' })
    expect(ativas.payload as unknown[]).toHaveLength(0)

    const inativas = await listar({ ativa: 'false' })
    expect(inativas.payload as unknown[]).toHaveLength(1)
  })
})

describe('atualizarSubcategoria', () => {
  it('renomeia a subcategoria', async () => {
    const reply = await atualizar(SUBCATEGORIA, { nome: 'Delivery' })

    expect(reply.statusCode).toBe(200)
    expect(prisma._db.subcategorias.get(SUBCATEGORIA)!.nome).toBe('Delivery')
  })

  it('rejeita editar subcategoria de outro usuario', async () => {
    const erro = await capturarErro(() =>
      atualizar(SUBCATEGORIA_ALHEIA, { nome: 'Tomada' }),
    )

    expect(erro).toBeInstanceOf(AppError)
    expect((erro as AppError).statusCode).toBe(404)
    expect(prisma._db.subcategorias.get(SUBCATEGORIA_ALHEIA)!.nome).toBe('Alheia')
  })
})

describe('inativar e ativar', () => {
  it('alterna o campo ativa sem excluir o registro', async () => {
    const inativada = criarReply()
    await inativarSubcategoria(
      criarRequest({ usuarioId: USUARIO, params: { id: SUBCATEGORIA } }),
      comoReply(inativada),
    )
    expect(prisma._db.subcategorias.get(SUBCATEGORIA)!.ativa).toBe(false)

    const ativada = criarReply()
    await ativarSubcategoria(
      criarRequest({ usuarioId: USUARIO, params: { id: SUBCATEGORIA } }),
      comoReply(ativada),
    )
    expect(prisma._db.subcategorias.get(SUBCATEGORIA)!.ativa).toBe(true)
  })
})

describe('deletarSubcategoria', () => {
  it('exclui quando nao ha vinculos', async () => {
    const reply = await deletar(SUBCATEGORIA)

    expect(reply.statusCode).toBe(204)
    expect(prisma._db.subcategorias.has(SUBCATEGORIA)).toBe(false)
  })

  it('responde 409 e preserva o registro quando ha transacao vinculada', async () => {
    prisma._db.transacoes.set(TRANSACAO, {
      id: TRANSACAO,
      descricao: 'Jantar',
      valor: 5_000,
      tipo: 'DESPESA',
      status: 'PAGA',
      dataVencimento: new Date(2026, 2, 10),
      dataPagamento: new Date(2026, 2, 10),
      usuarioId: USUARIO,
      contaId: CONTA,
      contaDestinoId: null,
      categoriaId: CATEGORIA,
      subcategoriaId: SUBCATEGORIA,
      recorrenciaId: null,
    })

    const reply = await deletar(SUBCATEGORIA)

    expect(reply.statusCode).toBe(409)
    expect(prisma._db.subcategorias.has(SUBCATEGORIA)).toBe(true)
  })

  it('rejeita excluir subcategoria de outro usuario', async () => {
    const erro = await capturarErro(() => deletar(SUBCATEGORIA_ALHEIA))

    expect(erro).toBeInstanceOf(AppError)
    expect((erro as AppError).statusCode).toBe(404)
    expect(prisma._db.subcategorias.has(SUBCATEGORIA_ALHEIA)).toBe(true)
  })
})
