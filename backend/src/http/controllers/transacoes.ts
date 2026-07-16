import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { checkOwnership } from '@/utils/checkOwnership'

const criarTransacaoBodySchema = z.object({
  descricao: z.string().min(1),
  valor: z.number().positive(), // Em centavos, sempre positivo no payload
  tipo: z.enum(['RECEITA', 'DESPESA', 'TRANSFERENCIA']),
  status: z.enum(['PENDENTE', 'PAGA', 'VENCIDA']).default('PAGA'),
  dataVencimento: z.coerce.date(), // Converte string ISO-8601 para Date do JS
  dataPagamento: z.coerce.date().optional(),
  contaId: z.string().uuid(),
  categoriaId: z.string().uuid(),
})

const editarTransacaoBodySchema = z.object({
  descricao: z.string().min(1).optional(),
  valor: z.number().positive().optional(),
  tipo: z.enum(['RECEITA', 'DESPESA', 'TRANSFERENCIA']).optional(),
  status: z.enum(['PENDENTE', 'PAGA', 'VENCIDA']).optional(),
  dataVencimento: z.coerce.date().optional(),
  dataPagamento: z.coerce.date().optional().nullable(),
  contaId: z.string().uuid().optional(),
  categoriaId: z.string().uuid().optional(),
})

const listarTransacoesQuerySchema = z.object({
  dataInicio: z.coerce.date().optional(),
  dataFim: z.coerce.date().optional(),
  contaId: z.string().uuid().optional(),
  categoriaId: z.string().uuid().optional(),
  status: z.enum(['PENDENTE', 'PAGA', 'VENCIDA']).optional(),
  tipo: z.enum(['RECEITA', 'DESPESA', 'TRANSFERENCIA']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

const resumoMensalQuerySchema = z.object({
  mes: z.coerce.number().min(1).max(12),
  ano: z.coerce.number().min(2000),
})

export async function criarTransacao(request: FastifyRequest, reply: FastifyReply) {
  const { descricao, valor, tipo, status, dataVencimento, dataPagamento, contaId, categoriaId } = criarTransacaoBodySchema.parse(request.body)
  const usuarioId = request.user.sub

  // Verifica se a conta e categoria pertencem ao usuário logado
  const [contaExiste, categoriaExiste] = await Promise.all([
    prisma.conta.findUnique({ where: { id: contaId } }),
    prisma.categoria.findUnique({ where: { id: categoriaId } }),
  ])

  checkOwnership(contaExiste, usuarioId, 'Conta')
  checkOwnership(categoriaExiste, usuarioId, 'Categoria')

  const operations: any[] = []

  const dataPagamentoFinal = status === 'PAGA' ? (dataPagamento || dataVencimento) : null

  operations.push(
    prisma.transacao.create({
      data: {
        descricao,
        valor,
        tipo,
        status,
        dataVencimento,
        dataPagamento: dataPagamentoFinal,
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

  const transacaoAtualizada = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const antiga = await tx.transacao.findUnique({ where: { id } })
    checkOwnership(antiga, usuarioId, 'Transação')

    // Estorna se estava PAGA
    if (antiga.status === 'PAGA') {
      await tx.conta.update({
        where: { id: antiga.contaId },
        data: {
          saldoAtual: { [antiga.tipo === 'RECEITA' ? 'decrement' : 'increment']: antiga.valor }
        }
      })
    }

    const statusNovo = updates.status !== undefined ? updates.status : antiga.status;
    
    // Ajusta dataPagamento baseado no novo status
    if (statusNovo === 'PAGA' && antiga.status !== 'PAGA' && updates.dataPagamento === undefined) {
      updates.dataPagamento = new Date();
    } else if (statusNovo !== 'PAGA') {
      updates.dataPagamento = null;
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
}

export async function deletarTransacao(request: FastifyRequest, reply: FastifyReply) {
  const paramsSchema = z.object({ id: z.string().uuid() })
  const { id } = paramsSchema.parse(request.params)
  const usuarioId = request.user.sub

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const antiga = await tx.transacao.findUnique({ where: { id } })
    checkOwnership(antiga, usuarioId, 'Transação')

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
      dataVencimento: {
        gte: dataInicial,
        lte: dataFinal,
      },
    },
    include: {
      categoria: true, // Necessário para agrupar os gastos por categoria (e pegar a cor)
    },
  })

  let totalReceitasPrevistas = 0
  let totalDespesasPrevistas = 0
  let totalReceitasPagas = 0
  let totalDespesasPagas = 0
  
  const gastosPorCategoriaMap = new Map<string, { valorRealizado: number; valorPrevisto: number; cor: string | null }>()

  for (const t of transacoes) {
    const isPaga = t.status === 'PAGA'
    
    if (t.tipo === 'RECEITA') {
      totalReceitasPrevistas += t.valor
      if (isPaga) totalReceitasPagas += t.valor
    } else {
      totalDespesasPrevistas += t.valor
      if (isPaga) totalDespesasPagas += t.valor

      // Agrupa despesas por categoria
      const catAtual = gastosPorCategoriaMap.get(t.categoria.nome) || { valorRealizado: 0, valorPrevisto: 0, cor: t.categoria.cor }
      gastosPorCategoriaMap.set(t.categoria.nome, {
        valorPrevisto: catAtual.valorPrevisto + t.valor,
        valorRealizado: catAtual.valorRealizado + (isPaga ? t.valor : 0),
        cor: t.categoria.cor,
      })
    }
  }

  // Formata o retorno dos gastos para a API
  const gastosPorCategoria = Array.from(gastosPorCategoriaMap.entries()).map(([categoria, info]) => ({
    categoria,
    valorPrevisto: info.valorPrevisto,
    valorRealizado: info.valorRealizado,
    cor: info.cor,
  }))

  return reply.status(200).send({
    totalReceitasPrevistas,
    totalDespesasPrevistas,
    totalReceitasPagas,
    totalDespesasPagas,
    saldoPrevisto: totalReceitasPrevistas - totalDespesasPrevistas,
    saldoRealizado: totalReceitasPagas - totalDespesasPagas,
    gastosPorCategoria,
  })
}

export async function listarTransacoes(request: FastifyRequest, reply: FastifyReply) {
  const query = listarTransacoesQuerySchema.parse(request.query)
  const usuarioId = request.user.sub

  const { dataInicio, dataFim, contaId, categoriaId, tipo, status, page, limit } = query

  const where: Prisma.TransacaoWhereInput = {
    usuarioId,
    ...(contaId && { contaId }),
    ...(categoriaId && { categoriaId }),
    ...(tipo && { tipo }),
    ...(status && { status }),
    ...(dataInicio || dataFim ? {
      dataVencimento: {
        ...(dataInicio && { gte: dataInicio }),
        ...(dataFim && { lte: dataFim }),
      }
    } : {})
  }

  const [transacoes, total] = await Promise.all([
    prisma.transacao.findMany({
      where,
      orderBy: { dataVencimento: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        categoria: { select: { nome: true, cor: true, icone: true } },
        conta: { select: { nome: true } },
      }
    }),
    prisma.transacao.count({ where })
  ])

  return reply.status(200).send({
    data: transacoes,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  })
}
