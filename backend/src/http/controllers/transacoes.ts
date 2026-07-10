import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { Prisma, TipoTransacao, StatusTransacao } from '@prisma/client'

const criarTransacaoBodySchema = z.object({
  descricao: z.string().min(1),
  valor: z.number().positive(), // Em centavos, sempre positivo no payload
  tipo: z.nativeEnum(TipoTransacao),
  status: z.nativeEnum(StatusTransacao).default('PAGA'),
  data: z.coerce.date(), // Converte string ISO-8601 para Date do JS
  contaId: z.string().uuid(),
  categoriaId: z.string().uuid(),
})

const editarTransacaoBodySchema = z.object({
  descricao: z.string().min(1).optional(),
  valor: z.number().positive().optional(),
  tipo: z.nativeEnum(TipoTransacao).optional(),
  status: z.nativeEnum(StatusTransacao).optional(),
  data: z.coerce.date().optional(),
  contaId: z.string().uuid().optional(),
  categoriaId: z.string().uuid().optional(),
})

const resumoMensalQuerySchema = z.object({
  mes: z.coerce.number().min(1).max(12),
  ano: z.coerce.number().min(2000),
})

export async function criarTransacao(request: FastifyRequest, reply: FastifyReply) {
  const { descricao, valor, tipo, status, data, contaId, categoriaId } = criarTransacaoBodySchema.parse(request.body)
  const usuarioId = request.user.sub

  // Verifica se a conta e categoria pertencem ao usuário logado
  const [contaExiste, categoriaExiste] = await Promise.all([
    prisma.conta.findUnique({ where: { id: contaId, usuarioId } }),
    prisma.categoria.findUnique({ where: { id: categoriaId, usuarioId } }),
  ])

  if (!contaExiste || !categoriaExiste) {
    return reply.status(404).send({ message: 'Conta ou Categoria não encontrada para este usuário.' })
  }

  const operations: any[] = []

  operations.push(
    prisma.transacao.create({
      data: {
        descricao,
        valor,
        tipo,
        status,
        data,
        usuarioId,
        contaId,
        categoriaId,
      },
    })
  )

  if (status === 'PAGA') {
    operations.push(
      prisma.conta.update({
        where: { id: contaId },
        data: {
          saldoAtual: {
            [tipo === 'RECEITA' ? 'increment' : 'decrement']: valor,
          },
        },
      })
    )
  }

  const [transacao] = await prisma.$transaction(operations)

  return reply.status(201).send(transacao)
}

export async function editarTransacao(request: FastifyRequest, reply: FastifyReply) {
  const paramsSchema = z.object({ id: z.string().uuid() })
  const { id } = paramsSchema.parse(request.params)
  const updates = editarTransacaoBodySchema.parse(request.body)
  const usuarioId = request.user.sub

  try {
    const transacaoAtualizada = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const antiga = await tx.transacao.findUnique({ where: { id, usuarioId } })
      if (!antiga) throw new Error('NOT_FOUND')

      // Estorna se estava PAGA
      if (antiga.status === 'PAGA') {
        await tx.conta.update({
          where: { id: antiga.contaId },
          data: {
            saldoAtual: { [antiga.tipo === 'RECEITA' ? 'decrement' : 'increment']: antiga.valor }
          }
        })
      }

      const atualizada = await tx.transacao.update({
        where: { id },
        data: updates
      })

      // Aplica novo valor se estiver PAGA
      if (atualizada.status === 'PAGA') {
        await tx.conta.update({
          where: { id: atualizada.contaId },
          data: {
            saldoAtual: { [atualizada.tipo === 'RECEITA' ? 'increment' : 'decrement']: atualizada.valor }
          }
        })
      }

      return atualizada
    })

    return reply.send(transacaoAtualizada)
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return reply.status(404).send({ message: 'Transação não encontrada.' })
    }
    throw error
  }
}

export async function deletarTransacao(request: FastifyRequest, reply: FastifyReply) {
  const paramsSchema = z.object({ id: z.string().uuid() })
  const { id } = paramsSchema.parse(request.params)
  const usuarioId = request.user.sub

  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const antiga = await tx.transacao.findUnique({ where: { id, usuarioId } })
      if (!antiga) throw new Error('NOT_FOUND')

      if (antiga.status === 'PAGA') {
        await tx.conta.update({
          where: { id: antiga.contaId },
          data: {
            saldoAtual: { [antiga.tipo === 'RECEITA' ? 'decrement' : 'increment']: antiga.valor }
          }
        })
      }

      await tx.transacao.delete({ where: { id } })
    })

    return reply.status(204).send()
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return reply.status(404).send({ message: 'Transação não encontrada.' })
    }
    throw error
  }
}

export async function resumoMensal(request: FastifyRequest, reply: FastifyReply) {
  const { mes, ano } = resumoMensalQuerySchema.parse(request.query)
  const usuarioId = request.user.sub

  // Calcula o primeiro e o último dia do mês especificado
  const dataInicial = new Date(ano, mes - 1, 1)
  const dataFinal = new Date(ano, mes, 0, 23, 59, 59, 999)

  const transacoes = await prisma.transacao.findMany({
    where: {
      usuarioId,
      data: {
        gte: dataInicial,
        lte: dataFinal,
      },
    },
    include: {
      categoria: true, // Necessário para agrupar os gastos por categoria (e pegar a cor)
    },
  })

  let totalReceitas = 0
  let totalDespesas = 0
  const gastosPorCategoriaMap = new Map<string, { valor: number; cor: string | null }>()

  for (const t of transacoes) {
    if (t.status !== 'PAGA') continue; // Apenas contas pagas no resumo

    if (t.tipo === 'RECEITA') {
      totalReceitas += t.valor
    } else {
      totalDespesas += t.valor

      // Agrupa despesas por categoria
      const catAtual = gastosPorCategoriaMap.get(t.categoria.nome) || { valor: 0, cor: t.categoria.cor }
      gastosPorCategoriaMap.set(t.categoria.nome, {
        valor: catAtual.valor + t.valor,
        cor: t.categoria.cor,
      })
    }
  }

  // Formata o retorno dos gastos para a API
  const gastosPorCategoria = Array.from(gastosPorCategoriaMap.entries()).map(([categoria, info]) => ({
    categoria,
    valor: info.valor,
    cor: info.cor,
  }))

  return reply.status(200).send({
    totalReceitas,
    totalDespesas,
    saldoPeriodo: totalReceitas - totalDespesas,
    gastosPorCategoria,
  })
}
