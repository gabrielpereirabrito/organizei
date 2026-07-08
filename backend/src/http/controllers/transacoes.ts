import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { TipoTransacao } from '@prisma/client'

const criarTransacaoBodySchema = z.object({
  descricao: z.string().min(1),
  valor: z.number().positive(), // Em centavos, sempre positivo no payload
  tipo: z.nativeEnum(TipoTransacao),
  data: z.coerce.date(), // Converte string ISO-8601 para Date do JS
  contaId: z.string().uuid(),
  categoriaId: z.string().uuid(),
})

const resumoMensalQuerySchema = z.object({
  mes: z.coerce.number().min(1).max(12),
  ano: z.coerce.number().min(2000),
})

export async function criarTransacao(request: FastifyRequest, reply: FastifyReply) {
  const { descricao, valor, tipo, data, contaId, categoriaId } = criarTransacaoBodySchema.parse(request.body)
  const usuarioId = request.user.sub

  // Verifica se a conta e categoria pertencem ao usuário logado
  const [contaExiste, categoriaExiste] = await Promise.all([
    prisma.conta.findUnique({ where: { id: contaId, usuarioId } }),
    prisma.categoria.findUnique({ where: { id: categoriaId, usuarioId } }),
  ])

  if (!contaExiste || !categoriaExiste) {
    return reply.status(404).send({ message: 'Conta ou Categoria não encontrada para este usuário.' })
  }

  // Executa de forma atômica: Cria a transação e atualiza o saldo da conta
  const [transacao] = await prisma.$transaction([
    prisma.transacao.create({
      data: {
        descricao,
        valor,
        tipo,
        data,
        usuarioId,
        contaId,
        categoriaId,
      },
    }),
    prisma.conta.update({
      where: { id: contaId },
      data: {
        saldoAtual: {
          // Se for receita, incrementa. Se for despesa, decrementa o saldo
          [tipo === 'RECEITA' ? 'increment' : 'decrement']: valor,
        },
      },
    }),
  ])

  return reply.status(201).send(transacao)
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
