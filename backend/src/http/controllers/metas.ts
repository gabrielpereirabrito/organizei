import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { checkOwnership } from '@/utils/checkOwnership'

const criarMetaBodySchema = z.object({
  limite: z.number().positive(),
  mes: z.number().min(1).max(12),
  ano: z.number().min(2000),
  categoriaId: z.string().uuid(),
})

const listarMetasQuerySchema = z.object({
  mes: z.coerce.number().min(1).max(12),
  ano: z.coerce.number().min(2000),
})

const atualizarMetaBodySchema = z.object({
  limite: z.number().positive(),
})

export async function criarMeta(request: FastifyRequest, reply: FastifyReply) {
  const { limite, mes, ano, categoriaId } = criarMetaBodySchema.parse(request.body)
  const usuarioId = request.user.sub

  const categoria = await prisma.categoria.findUnique({ where: { id: categoriaId } })
  checkOwnership(categoria, usuarioId, 'Categoria')

  // Verifica se já existe meta para esta categoria no mês/ano
  const metaExistente = await prisma.metaCategoria.findUnique({
    where: {
      usuarioId_categoriaId_mes_ano: {
        usuarioId,
        categoriaId,
        mes,
        ano,
      }
    }
  })

  if (metaExistente) {
    return reply.status(409).send({ message: 'Já existe uma meta para esta categoria neste período.' })
  }

  const meta = await prisma.metaCategoria.create({
    data: {
      limite,
      mes,
      ano,
      categoriaId,
      usuarioId,
    },
  })

  return reply.status(201).send(meta)
}

export async function listarMetas(request: FastifyRequest, reply: FastifyReply) {
  const { mes, ano } = listarMetasQuerySchema.parse(request.query)
  const usuarioId = request.user.sub

  const metas = await prisma.metaCategoria.findMany({
    where: { usuarioId, mes, ano },
    include: {
      categoria: {
        select: { nome: true, cor: true, icone: true }
      }
    }
  })

  // Calcula o primeiro e o último dia do mês especificado
  const dataInicial = new Date(ano, mes - 1, 1)
  const dataFinal = new Date(ano, mes, 0, 23, 59, 59, 999)

  // Busca os gastos reais das categorias que possuem meta neste mês
  const transacoes = await prisma.transacao.findMany({
    where: {
      usuarioId,
      status: 'PAGA',
      tipo: 'DESPESA',
      dataVencimento: {
        gte: dataInicial,
        lte: dataFinal,
      },
      categoriaId: {
        in: metas.map(m => m.categoriaId)
      }
    },
  })

  // Agrupa gastos por categoriaId
  const gastosPorCategoria = transacoes.reduce((acc, transacao) => {
    acc[transacao.categoriaId] = (acc[transacao.categoriaId] || 0) + transacao.valor
    return acc
  }, {} as Record<string, number>)

  // Monta o retorno com o valor gasto e o restante
  const metasComProgresso = metas.map(meta => {
    const gasto = gastosPorCategoria[meta.categoriaId] || 0
    return {
      ...meta,
      gasto,
      restante: Math.max(0, meta.limite - gasto),
    }
  })

  return reply.status(200).send(metasComProgresso)
}

export async function atualizarMeta(request: FastifyRequest, reply: FastifyReply) {
  const paramsSchema = z.object({ id: z.string().uuid() })
  const { id } = paramsSchema.parse(request.params)
  const { limite } = atualizarMetaBodySchema.parse(request.body)
  const usuarioId = request.user.sub

  const meta = await prisma.metaCategoria.findUnique({ where: { id } })
  checkOwnership(meta, usuarioId, 'Meta')

  const metaAtualizada = await prisma.metaCategoria.update({
    where: { id },
    data: { limite }
  })

  return reply.status(200).send(metaAtualizada)
}

export async function deletarMeta(request: FastifyRequest, reply: FastifyReply) {
  const paramsSchema = z.object({ id: z.string().uuid() })
  const { id } = paramsSchema.parse(request.params)
  const usuarioId = request.user.sub

  const meta = await prisma.metaCategoria.findUnique({ where: { id } })
  checkOwnership(meta, usuarioId, 'Meta')

  await prisma.metaCategoria.delete({ where: { id } })

  return reply.status(204).send()
}
