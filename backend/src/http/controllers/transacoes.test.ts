import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AppError } from '@/utils/AppError'
import { criarPrismaFake, type PrismaFake } from '@/test/fakePrisma'
import { criarRequest, criarReply, comoReply, capturarErro } from '@/test/fakeHttp'

// O client real abre um Pool de Postgres no import; aqui ele é substituído pelo
// fake em memória. O getter é necessário porque cada teste monta um fake novo.
const estado = vi.hoisted(() => ({ prisma: null as unknown }))
vi.mock('@/lib/prisma', () => ({
  get prisma() {
    return estado.prisma
  },
}))

import { criarTransacao, editarTransacao, deletarTransacao } from './transacoes'

const USUARIO = 'aaaaaaaa-0000-4000-8000-000000000001'
const OUTRO_USUARIO = 'bbbbbbbb-0000-4000-8000-000000000002'
const CONTA_A = '11111111-0000-4000-8000-000000000001'
const CONTA_B = '22222222-0000-4000-8000-000000000002'
const CONTA_ALHEIA = '33333333-0000-4000-8000-000000000003'
const CATEGORIA = '44444444-0000-4000-8000-000000000004'
const CATEGORIA_ALHEIA = '55555555-0000-4000-8000-000000000005'
const TRANSACAO = '66666666-0000-4000-8000-000000000006'

const VENCIMENTO = new Date(2026, 2, 10)

let prisma: PrismaFake

/** Saldos iniciais: A = R$ 1.000,00 e B = R$ 500,00 (em centavos). */
const SALDO_A_INICIAL = 100_000
const SALDO_B_INICIAL = 50_000

beforeEach(() => {
  prisma = criarPrismaFake({
    contas: [
      { id: CONTA_A, usuarioId: USUARIO, nome: 'Conta A', saldoAtual: SALDO_A_INICIAL, ativa: true },
      { id: CONTA_B, usuarioId: USUARIO, nome: 'Conta B', saldoAtual: SALDO_B_INICIAL, ativa: true },
      { id: CONTA_ALHEIA, usuarioId: OUTRO_USUARIO, nome: 'Conta de outro', saldoAtual: 700_00, ativa: true },
    ],
    categorias: [
      { id: CATEGORIA, usuarioId: USUARIO, nome: 'Mercado', tipo: 'DESPESA', cor: '#000' },
      { id: CATEGORIA_ALHEIA, usuarioId: OUTRO_USUARIO, nome: 'Alheia', tipo: 'DESPESA', cor: '#111' },
    ],
  })
  estado.prisma = prisma
})

const saldo = (contaId: string) => prisma._db.contas.get(contaId)!.saldoAtual

/** Soma de todas as contas do usuário — deve ser invariante em transferências. */
const patrimonio = () => saldo(CONTA_A) + saldo(CONTA_B)

async function criar(body: Record<string, unknown>, usuarioId = USUARIO) {
  const reply = criarReply()
  await criarTransacao(criarRequest({ usuarioId, body }), comoReply(reply))
  return reply
}

async function editar(id: string, body: Record<string, unknown>, usuarioId = USUARIO) {
  const reply = criarReply()
  await editarTransacao(criarRequest({ usuarioId, body, params: { id } }), comoReply(reply))
  return reply
}

async function deletar(id: string, usuarioId = USUARIO) {
  const reply = criarReply()
  await deletarTransacao(criarRequest({ usuarioId, params: { id } }), comoReply(reply))
  return reply
}

/** Transação já existente no "banco", para os testes de edição/exclusão. */
function semear(dados: Partial<Parameters<typeof prisma._db.transacoes.set>[1]> = {}) {
  const transacao = {
    id: TRANSACAO,
    descricao: 'Compra',
    valor: 10_000,
    tipo: 'DESPESA' as const,
    status: 'PAGA' as const,
    dataVencimento: VENCIMENTO,
    dataPagamento: VENCIMENTO,
    usuarioId: USUARIO,
    contaId: CONTA_A,
    contaDestinoId: null,
    categoriaId: CATEGORIA,
    recorrenciaId: null,
    ...dados,
  }
  prisma._db.transacoes.set(transacao.id, transacao)

  // Saldo coerente com a transação semeada: se ela já está PAGA, seu efeito já
  // deveria estar refletido no saldo da conta.
  if (transacao.status === 'PAGA') {
    const conta = prisma._db.contas.get(transacao.contaId)!
    if (transacao.tipo === 'RECEITA') conta.saldoAtual += transacao.valor
    else conta.saldoAtual -= transacao.valor

    if (transacao.tipo === 'TRANSFERENCIA' && transacao.contaDestinoId) {
      prisma._db.contas.get(transacao.contaDestinoId)!.saldoAtual += transacao.valor
    }
  }
  return transacao
}

describe('criarTransacao', () => {
  it('RECEITA PAGA credita a conta', async () => {
    const reply = await criar({
      descricao: 'Salário',
      valor: 25_000,
      tipo: 'RECEITA',
      status: 'PAGA',
      dataVencimento: VENCIMENTO.toISOString(),
      contaId: CONTA_A,
      categoriaId: CATEGORIA,
    })

    expect(reply.statusCode).toBe(201)
    expect(saldo(CONTA_A)).toBe(SALDO_A_INICIAL + 25_000)
  })

  it('DESPESA PAGA debita a conta', async () => {
    await criar({
      descricao: 'Mercado',
      valor: 8_000,
      tipo: 'DESPESA',
      status: 'PAGA',
      dataVencimento: VENCIMENTO.toISOString(),
      contaId: CONTA_A,
      categoriaId: CATEGORIA,
    })

    expect(saldo(CONTA_A)).toBe(SALDO_A_INICIAL - 8_000)
  })

  it('usa status PAGA por padrão quando o campo é omitido', async () => {
    await criar({
      descricao: 'Padaria',
      valor: 1_500,
      tipo: 'DESPESA',
      dataVencimento: VENCIMENTO.toISOString(),
      contaId: CONTA_A,
      categoriaId: CATEGORIA,
    })

    expect(saldo(CONTA_A)).toBe(SALDO_A_INICIAL - 1_500)
  })

  it('PENDENTE não mexe no saldo e não grava dataPagamento', async () => {
    const reply = await criar({
      descricao: 'Aluguel previsto',
      valor: 120_000,
      tipo: 'DESPESA',
      status: 'PENDENTE',
      dataVencimento: VENCIMENTO.toISOString(),
      contaId: CONTA_A,
      categoriaId: CATEGORIA,
    })

    expect(saldo(CONTA_A)).toBe(SALDO_A_INICIAL)
    expect((reply.payload as { dataPagamento: Date | null }).dataPagamento).toBeNull()
  })

  it('VENCIDA não mexe no saldo', async () => {
    await criar({
      descricao: 'Boleto atrasado',
      valor: 5_000,
      tipo: 'DESPESA',
      status: 'VENCIDA',
      dataVencimento: VENCIMENTO.toISOString(),
      contaId: CONTA_A,
      categoriaId: CATEGORIA,
    })

    expect(saldo(CONTA_A)).toBe(SALDO_A_INICIAL)
  })

  it('PAGA sem dataPagamento explícita assume a data de vencimento', async () => {
    const reply = await criar({
      descricao: 'Conta de luz',
      valor: 3_000,
      tipo: 'DESPESA',
      status: 'PAGA',
      dataVencimento: VENCIMENTO.toISOString(),
      contaId: CONTA_A,
      categoriaId: CATEGORIA,
    })

    const criada = reply.payload as { dataPagamento: Date }
    expect(criada.dataPagamento.getTime()).toBe(VENCIMENTO.getTime())
  })

  describe('TRANSFERENCIA', () => {
    const corpoTransferencia = {
      descricao: 'Transferência A -> B',
      valor: 20_000,
      tipo: 'TRANSFERENCIA',
      status: 'PAGA',
      dataVencimento: VENCIMENTO.toISOString(),
      contaId: CONTA_A,
      contaDestinoId: CONTA_B,
    }

    it('PAGA debita a origem e credita o destino', async () => {
      await criar(corpoTransferencia)

      expect(saldo(CONTA_A)).toBe(SALDO_A_INICIAL - 20_000)
      expect(saldo(CONTA_B)).toBe(SALDO_B_INICIAL + 20_000)
    })

    it('PAGA não altera o patrimônio total', async () => {
      const antes = patrimonio()
      await criar(corpoTransferencia)
      expect(patrimonio()).toBe(antes)
    })

    it('PENDENTE não move nenhum dos dois saldos', async () => {
      await criar({ ...corpoTransferencia, status: 'PENDENTE' })

      expect(saldo(CONTA_A)).toBe(SALDO_A_INICIAL)
      expect(saldo(CONTA_B)).toBe(SALDO_B_INICIAL)
    })

    it('cria (uma única vez) a categoria-sistema de transferência', async () => {
      await criar(corpoTransferencia)
      await criar(corpoTransferencia)

      const categoriasTransferencia = Array.from(prisma._db.categorias.values()).filter(
        (c) => c.tipo === 'TRANSFERENCIA'
      )
      expect(categoriasTransferencia).toHaveLength(1)
    })

    it('rejeita transferência sem conta de destino', async () => {
      const erro = await capturarErro(() =>
        criar({ ...corpoTransferencia, contaDestinoId: undefined })
      )

      expect(erro).toBeTruthy()
      expect(saldo(CONTA_A)).toBe(SALDO_A_INICIAL)
    })

    it('rejeita transferência para a própria conta de origem', async () => {
      const erro = await capturarErro(() =>
        criar({ ...corpoTransferencia, contaDestinoId: CONTA_A })
      )

      expect(erro).toBeTruthy()
      expect(saldo(CONTA_A)).toBe(SALDO_A_INICIAL)
    })

    it('rejeita transferência para conta de outro usuário, sem mover saldo', async () => {
      const erro = await capturarErro(() =>
        criar({ ...corpoTransferencia, contaDestinoId: CONTA_ALHEIA })
      )

      expect(erro).toBeInstanceOf(AppError)
      expect((erro as AppError).statusCode).toBe(404)
      expect(saldo(CONTA_A)).toBe(SALDO_A_INICIAL)
      expect(prisma._db.contas.get(CONTA_ALHEIA)!.saldoAtual).toBe(700_00)
    })
  })

  it('rejeita criação em conta de outro usuário', async () => {
    const erro = await capturarErro(() =>
      criar({
        descricao: 'Invasão',
        valor: 1_000,
        tipo: 'DESPESA',
        status: 'PAGA',
        dataVencimento: VENCIMENTO.toISOString(),
        contaId: CONTA_ALHEIA,
        categoriaId: CATEGORIA,
      })
    )

    expect(erro).toBeInstanceOf(AppError)
    expect((erro as AppError).statusCode).toBe(404)
    expect(prisma._db.contas.get(CONTA_ALHEIA)!.saldoAtual).toBe(700_00)
  })
})

describe('editarTransacao', () => {
  it('PENDENTE -> PAGA aplica o valor no saldo', async () => {
    semear({ status: 'PENDENTE', dataPagamento: null, valor: 10_000 })

    await editar(TRANSACAO, { status: 'PAGA' })

    expect(saldo(CONTA_A)).toBe(SALDO_A_INICIAL - 10_000)
  })

  it('PENDENTE -> PAGA preenche a dataPagamento', async () => {
    semear({ status: 'PENDENTE', dataPagamento: null })

    const reply = await editar(TRANSACAO, { status: 'PAGA' })

    expect((reply.payload as { dataPagamento: Date | null }).dataPagamento).toBeInstanceOf(Date)
  })

  it('PAGA -> PENDENTE estorna o valor e limpa a dataPagamento', async () => {
    semear({ status: 'PAGA', valor: 10_000 })
    expect(saldo(CONTA_A)).toBe(SALDO_A_INICIAL - 10_000)

    const reply = await editar(TRANSACAO, { status: 'PENDENTE' })

    expect(saldo(CONTA_A)).toBe(SALDO_A_INICIAL)
    expect((reply.payload as { dataPagamento: Date | null }).dataPagamento).toBeNull()
  })

  it('alterar o valor de uma DESPESA já PAGA ajusta apenas a diferença', async () => {
    semear({ status: 'PAGA', tipo: 'DESPESA', valor: 10_000 })

    await editar(TRANSACAO, { valor: 15_000 })

    expect(saldo(CONTA_A)).toBe(SALDO_A_INICIAL - 15_000)
  })

  it('alterar o valor de uma RECEITA já PAGA ajusta apenas a diferença', async () => {
    semear({ status: 'PAGA', tipo: 'RECEITA', valor: 10_000 })
    expect(saldo(CONTA_A)).toBe(SALDO_A_INICIAL + 10_000)

    await editar(TRANSACAO, { valor: 4_000 })

    expect(saldo(CONTA_A)).toBe(SALDO_A_INICIAL + 4_000)
  })

  it('alterar o valor de uma PENDENTE não mexe no saldo', async () => {
    semear({ status: 'PENDENTE', dataPagamento: null, valor: 10_000 })

    await editar(TRANSACAO, { valor: 90_000 })

    expect(saldo(CONTA_A)).toBe(SALDO_A_INICIAL)
  })

  it('trocar RECEITA por DESPESA numa transação PAGA inverte o efeito no saldo', async () => {
    semear({ status: 'PAGA', tipo: 'RECEITA', valor: 10_000 })
    expect(saldo(CONTA_A)).toBe(SALDO_A_INICIAL + 10_000)

    await editar(TRANSACAO, { tipo: 'DESPESA' })

    expect(saldo(CONTA_A)).toBe(SALDO_A_INICIAL - 10_000)
  })

  it('mover uma transação PAGA para outra conta estorna na origem e aplica no destino', async () => {
    semear({ status: 'PAGA', tipo: 'DESPESA', valor: 10_000, contaId: CONTA_A })

    await editar(TRANSACAO, { contaId: CONTA_B })

    expect(saldo(CONTA_A)).toBe(SALDO_A_INICIAL)
    expect(saldo(CONTA_B)).toBe(SALDO_B_INICIAL - 10_000)
  })

  it('alterar o valor de uma TRANSFERENCIA PAGA reajusta as duas contas', async () => {
    semear({
      status: 'PAGA',
      tipo: 'TRANSFERENCIA',
      valor: 20_000,
      contaId: CONTA_A,
      contaDestinoId: CONTA_B,
    })
    expect(saldo(CONTA_A)).toBe(SALDO_A_INICIAL - 20_000)
    expect(saldo(CONTA_B)).toBe(SALDO_B_INICIAL + 20_000)

    await editar(TRANSACAO, { valor: 5_000 })

    expect(saldo(CONTA_A)).toBe(SALDO_A_INICIAL - 5_000)
    expect(saldo(CONTA_B)).toBe(SALDO_B_INICIAL + 5_000)
    expect(patrimonio()).toBe(SALDO_A_INICIAL + SALDO_B_INICIAL)
  })

  it('cancelar uma TRANSFERENCIA PAGA (-> PENDENTE) devolve os dois saldos', async () => {
    semear({
      status: 'PAGA',
      tipo: 'TRANSFERENCIA',
      valor: 20_000,
      contaId: CONTA_A,
      contaDestinoId: CONTA_B,
    })

    await editar(TRANSACAO, { status: 'PENDENTE' })

    expect(saldo(CONTA_A)).toBe(SALDO_A_INICIAL)
    expect(saldo(CONTA_B)).toBe(SALDO_B_INICIAL)
  })

  it('rejeita edição de transação de outro usuário', async () => {
    semear({ status: 'PAGA', valor: 10_000 })
    const saldoAntes = saldo(CONTA_A)

    const erro = await capturarErro(() => editar(TRANSACAO, { valor: 1 }, OUTRO_USUARIO))

    expect(erro).toBeInstanceOf(AppError)
    expect((erro as AppError).statusCode).toBe(404)
    expect(saldo(CONTA_A)).toBe(saldoAntes)
  })

  it('rejeita mover uma transação PAGA para conta de outro usuário', async () => {
    semear({ status: 'PAGA', tipo: 'DESPESA', valor: 10_000, contaId: CONTA_A })

    const erro = await capturarErro(() => editar(TRANSACAO, { contaId: CONTA_ALHEIA }))

    expect(erro).toBeInstanceOf(AppError)
    expect((erro as AppError).statusCode).toBe(404)
    expect(prisma._db.contas.get(CONTA_ALHEIA)!.saldoAtual).toBe(700_00)
  })

  it('rejeita reclassificar para categoria de outro usuário', async () => {
    semear({ status: 'PAGA', tipo: 'DESPESA', valor: 10_000 })

    const erro = await capturarErro(() => editar(TRANSACAO, { categoriaId: CATEGORIA_ALHEIA }))

    expect(erro).toBeInstanceOf(AppError)
    expect((erro as AppError).statusCode).toBe(404)
  })

  it('rejeita virar TRANSFERENCIA reaproveitando uma conta destino alheia já gravada', async () => {
    // Explora em dois passos: o contaDestinoId alheio é gravado enquanto o tipo
    // ainda é DESPESA (onde ele é inerte) e só depois o tipo vira TRANSFERENCIA.
    semear({
      status: 'PAGA',
      tipo: 'DESPESA',
      valor: 10_000,
      contaDestinoId: CONTA_ALHEIA,
    })

    const erro = await capturarErro(() => editar(TRANSACAO, { tipo: 'TRANSFERENCIA' }))

    expect(erro).toBeInstanceOf(AppError)
    expect((erro as AppError).statusCode).toBe(404)
    expect(prisma._db.contas.get(CONTA_ALHEIA)!.saldoAtual).toBe(700_00)
  })

  it('rejeita transformar em TRANSFERENCIA sem informar conta de destino', async () => {
    semear({ status: 'PAGA', tipo: 'DESPESA', valor: 10_000 })

    const erro = await capturarErro(() => editar(TRANSACAO, { tipo: 'TRANSFERENCIA' }))

    expect(erro).toBeInstanceOf(AppError)
    expect((erro as AppError).statusCode).toBe(400)
  })
})

describe('deletarTransacao', () => {
  it('excluir DESPESA PAGA devolve o valor ao saldo', async () => {
    semear({ status: 'PAGA', tipo: 'DESPESA', valor: 10_000 })

    const reply = await deletar(TRANSACAO)

    expect(reply.statusCode).toBe(204)
    expect(saldo(CONTA_A)).toBe(SALDO_A_INICIAL)
    expect(prisma._db.transacoes.has(TRANSACAO)).toBe(false)
  })

  it('excluir RECEITA PAGA retira o valor do saldo', async () => {
    semear({ status: 'PAGA', tipo: 'RECEITA', valor: 10_000 })

    await deletar(TRANSACAO)

    expect(saldo(CONTA_A)).toBe(SALDO_A_INICIAL)
  })

  it('excluir transação PENDENTE não mexe no saldo', async () => {
    semear({ status: 'PENDENTE', dataPagamento: null, valor: 10_000 })

    await deletar(TRANSACAO)

    expect(saldo(CONTA_A)).toBe(SALDO_A_INICIAL)
    expect(prisma._db.transacoes.has(TRANSACAO)).toBe(false)
  })

  it('excluir TRANSFERENCIA PAGA reverte as duas contas', async () => {
    semear({
      status: 'PAGA',
      tipo: 'TRANSFERENCIA',
      valor: 20_000,
      contaId: CONTA_A,
      contaDestinoId: CONTA_B,
    })

    await deletar(TRANSACAO)

    expect(saldo(CONTA_A)).toBe(SALDO_A_INICIAL)
    expect(saldo(CONTA_B)).toBe(SALDO_B_INICIAL)
  })

  it('rejeita exclusão de transação de outro usuário e mantém o registro', async () => {
    semear({ status: 'PAGA', valor: 10_000 })
    const saldoAntes = saldo(CONTA_A)

    const erro = await capturarErro(() => deletar(TRANSACAO, OUTRO_USUARIO))

    expect(erro).toBeInstanceOf(AppError)
    expect((erro as AppError).statusCode).toBe(404)
    expect(saldo(CONTA_A)).toBe(saldoAntes)
    expect(prisma._db.transacoes.has(TRANSACAO)).toBe(true)
  })
})

describe('ciclo completo', () => {
  it('criar -> editar -> excluir devolve o saldo exatamente ao valor inicial', async () => {
    const reply = await criar({
      descricao: 'Ida e volta',
      valor: 7_777,
      tipo: 'DESPESA',
      status: 'PAGA',
      dataVencimento: VENCIMENTO.toISOString(),
      contaId: CONTA_A,
      categoriaId: CATEGORIA,
    })
    const { id } = reply.payload as { id: string }

    await editar(id, { valor: 33_333 })
    await editar(id, { status: 'PENDENTE' })
    await editar(id, { status: 'PAGA' })
    await deletar(id)

    expect(saldo(CONTA_A)).toBe(SALDO_A_INICIAL)
  })

  it('transferência criada e excluída preserva os saldos das duas contas', async () => {
    const reply = await criar({
      descricao: 'Ida e volta entre contas',
      valor: 12_345,
      tipo: 'TRANSFERENCIA',
      status: 'PAGA',
      dataVencimento: VENCIMENTO.toISOString(),
      contaId: CONTA_A,
      contaDestinoId: CONTA_B,
    })
    const { id } = reply.payload as { id: string }

    await deletar(id)

    expect(saldo(CONTA_A)).toBe(SALDO_A_INICIAL)
    expect(saldo(CONTA_B)).toBe(SALDO_B_INICIAL)
  })
})
