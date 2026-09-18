import { FastifyReply, FastifyRequest } from 'fastify'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { checkOwnership } from '@/utils/checkOwnership'

const listarSubcategoriasQuerySchema = z.object({
  categoriaId: z.string().uuid().optional(),
  ativa: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
})

const criarSubcategoriaBodySchema = z.object({
  categoriaId: z.string().uuid(),
  nome: z.string().min(1),
  icone: z.string().optional(),
  cor: z.string().optional(),
})

// `categoriaId` fica de fora de proposito: mover uma subcategoria de categoria
// realocaria transacoes ja lancadas. Mesma razao pela qual `tipo` nao e editavel
// em `atualizarCategoria`.
const atualizarSubcategoriaBodySchema = z.object({
  nome: z.string().min(1).optional(),
  icone: z.string().optional(),
  cor: z.string().optional(),
})

export async function listarSubcategorias(request: FastifyRequest, reply: FastifyReply) {
  const { categoriaId, ativa } = listarSubcategoriasQuerySchema.parse(request.query)
  const usuarioId = request.user.sub

  const subcategorias = await prisma.subcategoria.findMany({
    where: {
      usuarioId,
      ...(categoriaId ? { categoriaId } : {}),
      ...(ativa !== undefined ? { ativa } : {}),
    },
    orderBy: { nome: 'asc' },
  })

  return reply.status(200).send(subcategorias)
}

export async function criarSubcategoria(request: FastifyRequest, reply: FastifyReply) {
  const { categoriaId, nome, icone, cor } = criarSubcategoriaBodySchema.parse(
    request.body,
  )
  const usuarioId = request.user.sub

  // O `usuarioId` da subcategoria e SEMPRE derivado da categoria, nunca do corpo:
  // e o que garante que o campo denormalizado nao divirja da categoria mae.
  const categoria = await prisma.categoria.findUnique({ where: { id: categoriaId } })
  checkOwnership(categoria, usuarioId, 'Categoria')

  try {
    const subcategoria = await prisma.subcategoria.create({
      data: {
        nome,
        icone,
        cor,
        categoriaId: categoria.id,
        usuarioId: categoria.usuarioId,
      },
    })

    return reply.status(201).send(subcategoria)
  } catch (error) {
    // P2002 = violacao do @@unique([categoriaId, nome])
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return reply.status(409).send({
        message: 'Já existe uma subcategoria com este nome nesta categoria.',
      })
    }
    throw error
  }
}

export async function buscarSubcategoriaPorId(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const getParamsSchema = z.object({ id: z.string().uuid() })
  const { id } = getParamsSchema.parse(request.params)
  const usuarioId = request.user.sub

  const subcategoria = await prisma.subcategoria.findUnique({ where: { id } })
  checkOwnership(subcategoria, usuarioId, 'Subcategoria')

  return reply.status(200).send(subcategoria)
}

export async function inativarSubcategoria(request: FastifyRequest, reply: FastifyReply) {
  const getParamsSchema = z.object({ id: z.string().uuid() })
  const { id } = getParamsSchema.parse(request.params)
  const usuarioId = request.user.sub

  const subcategoria = await prisma.subcategoria.findUnique({ where: { id } })
  checkOwnership(subcategoria, usuarioId, 'Subcategoria')

  const subcategoriaInativada = await prisma.subcategoria.update({
    where: { id },
    data: { ativa: false },
  })

  return reply.status(200).send(subcategoriaInativada)
}

export async function ativarSubcategoria(request: FastifyRequest, reply: FastifyReply) {
  const getParamsSchema = z.object({ id: z.string().uuid() })
  const { id } = getParamsSchema.parse(request.params)
  const usuarioId = request.user.sub

  const subcategoria = await prisma.subcategoria.findUnique({ where: { id } })
  checkOwnership(subcategoria, usuarioId, 'Subcategoria')

  const subcategoriaAtivada = await prisma.subcategoria.update({
    where: { id },
    data: { ativa: true },
  })

  return reply.status(200).send(subcategoriaAtivada)
}

export async function atualizarSubcategoria(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const getParamsSchema = z.object({ id: z.string().uuid() })
  const { id } = getParamsSchema.parse(request.params)
  const { nome, icone, cor } = atualizarSubcategoriaBodySchema.parse(request.body)
  const usuarioId = request.user.sub

  const subcategoria = await prisma.subcategoria.findUnique({ where: { id } })
  checkOwnership(subcategoria, usuarioId, 'Subcategoria')

  try {
    const subcategoriaAtualizada = await prisma.subcategoria.update({
      where: { id },
      data: { nome, icone, cor },
    })

    return reply.status(200).send(subcategoriaAtualizada)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return reply.status(409).send({
        message: 'Já existe uma subcategoria com este nome nesta categoria.',
      })
    }
    throw error
  }
}

export async function deletarSubcategoria(request: FastifyRequest, reply: FastifyReply) {
  const getParamsSchema = z.object({ id: z.string().uuid() })
  const { id } = getParamsSchema.parse(request.params)
  const usuarioId = request.user.sub

  const subcategoria = await prisma.subcategoria.findUnique({
    where: { id },
    include: {
      _count: {
        select: { transacoes: true, recorrencias: true, metasCategorias: true },
      },
    },
  })

  checkOwnership(subcategoria, usuarioId, 'Subcategoria')

  if (
    subcategoria._count.transacoes > 0 ||
    subcategoria._count.recorrencias > 0 ||
    subcategoria._count.metasCategorias > 0
  ) {
    return reply.status(409).send({
      message:
        'Esta subcategoria possui transações, metas ou recorrências vinculadas. Por favor, inative-a em vez de excluir fisicamente.',
    })
  }

  await prisma.subcategoria.delete({
    where: { id },
  })

  return reply.status(204).send()
}
