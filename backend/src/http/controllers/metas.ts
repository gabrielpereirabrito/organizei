import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { AppError } from '@/utils/AppError'
import { checkOwnership } from '@/utils/checkOwnership'

const criarMetaBodySchema = z.object({
  limite: z.number().positive(),
  mes: z.number().min(1).max(12),
  ano: z.number().min(2000),
  categoriaId: z.string().uuid(),
  // Se preenchido, o limite vale so para a subcategoria (ex: R$ 300 de iFood).
  subcategoriaId: z.string().uuid().optional(),
})

const listarMetasQuerySchema = z.object({
  mes: z.coerce.number().min(1).max(12),
  ano: z.coerce.number().min(2000),
})

const atualizarMetaBodySchema = z.object({
  limite: z.number().positive(),
})

export async function criarMeta(request: FastifyRequest, reply: FastifyReply) {
  const { limite, mes, ano, categoriaId, subcategoriaId } = criarMetaBodySchema.parse(
    request.body,
  )
  const usuarioId = request.user.sub

  const categoria = await prisma.categoria.findUnique({ where: { id: categoriaId } })
  checkOwnership(categoria, usuarioId, 'Categoria')

  if (subcategoriaId) {
    const subcategoria = await prisma.subcategoria.findUnique({
      where: { id: subcategoriaId },
    })
    checkOwnership(subcategoria, usuarioId, 'Subcategoria')

    if (subcategoria.categoriaId !== categoriaId) {
      throw new AppError('A subcategoria não pertence à categoria escolhida', 400)
    }
  }

  // Verifica se já existe meta para esta categoria/subcategoria no mês/ano.
  // Usamos `findFirst` em vez do @@unique porque no Postgres NULL e distinto de
  // NULL em indice unico: a constraint nao barra duas metas de categoria.
  const metaExistente = await prisma.metaCategoria.findFirst({
    where: {
      usuarioId,
      categoriaId,
      subcategoriaId: subcategoriaId ?? null,
      mes,
      ano,
    },
  })

  if (metaExistente) {
    return reply.status(409).send({
      message: subcategoriaId
        ? 'Já existe uma meta para esta subcategoria neste período.'
        : 'Já existe uma meta para esta categoria neste período.',
    })
  }

  const meta = await prisma.metaCategoria.create({
    data: {
      limite,
      mes,
      ano,
      categoriaId,
      subcategoriaId,
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
        select: { nome: true, cor: true, icone: true },
      },
      subcategoria: {
        select: { nome: true, cor: true, icone: true },
      },
    },
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
        in: metas.map((m) => m.categoriaId),
      },
    },
  })

  // Dois agregados: a meta de categoria soma TUDO da categoria (inclusive o que
  // tem subcategoria), enquanto a meta de subcategoria soma so a sua fatia.
  const gastosPorCategoria: Record<string, number> = {}
  const gastosPorSubcategoria: Record<string, number> = {}

  for (const transacao of transacoes) {
    gastosPorCategoria[transacao.categoriaId] =
      (gastosPorCategoria[transacao.categoriaId] || 0) + transacao.valor

    if (transacao.subcategoriaId) {
      gastosPorSubcategoria[transacao.subcategoriaId] =
        (gastosPorSubcategoria[transacao.subcategoriaId] || 0) + transacao.valor
    }
  }

  // Monta o retorno com o valor gasto e o restante
  const metasComProgresso = metas.map((meta) => {
    const gasto = meta.subcategoriaId
      ? gastosPorSubcategoria[meta.subcategoriaId] || 0
      : gastosPorCategoria[meta.categoriaId] || 0

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
    data: { limite },
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
