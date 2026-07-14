import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'


const listarCategoriasQuerySchema = z.object({
  tipo: z.enum(['RECEITA', 'DESPESA', 'TRANSFERENCIA']).optional(),
  ativa: z.enum(['true', 'false']).optional().transform((val) => val === 'true' ? true : val === 'false' ? false : undefined),
})

const criarCategoriaBodySchema = z.object({
  nome: z.string().min(1),
  icone: z.string().optional(),
  cor: z.string().optional(),
  tipo: z.enum(['RECEITA', 'DESPESA', 'TRANSFERENCIA']),
})

export async function listarCategorias(request: FastifyRequest, reply: FastifyReply) {
  const { tipo, ativa } = listarCategoriasQuerySchema.parse(request.query)
  const usuarioId = request.user.sub

  const categorias = await prisma.categoria.findMany({
    where: { 
      usuarioId,
      ...(tipo ? { tipo } : {}), // Adiciona filtro apenas se 'tipo' for fornecido
      ...(ativa !== undefined ? { ativa } : {}), // Adiciona filtro apenas se 'ativa' for fornecido
    },
    orderBy: { nome: 'asc' },
  })

  return reply.status(200).send(categorias)
}

export async function criarCategoria(request: FastifyRequest, reply: FastifyReply) {
  const { nome, icone, cor, tipo } = criarCategoriaBodySchema.parse(request.body)
  const usuarioId = request.user.sub

  const categoria = await prisma.categoria.create({
    data: {
      nome,
      icone,
      cor,
      tipo,
      usuarioId,
    },
  })

  return reply.status(201).send(categoria)
}

export async function buscarCategoriaPorId(request: FastifyRequest, reply: FastifyReply) {
  const getParamsSchema = z.object({ id: z.string().uuid() })
  const { id } = getParamsSchema.parse(request.params)
  const usuarioId = request.user.sub

  const categoria = await prisma.categoria.findUnique({ where: { id } })

  if (!categoria || categoria.usuarioId !== usuarioId) {
    return reply.status(404).send({ message: 'Categoria não encontrada' })
  }

  return reply.status(200).send(categoria)
}

export async function inativarCategoria(request: FastifyRequest, reply: FastifyReply) {
  const getParamsSchema = z.object({ id: z.string().uuid() })
  const { id } = getParamsSchema.parse(request.params)
  const usuarioId = request.user.sub

  const categoria = await prisma.categoria.findUnique({ where: { id } })

  if (!categoria || categoria.usuarioId !== usuarioId) {
    return reply.status(404).send({ message: 'Categoria não encontrada' })
  }

  const categoriaInativada = await prisma.categoria.update({
    where: { id },
    data: { ativa: false },
  })

  return reply.status(200).send(categoriaInativada)
}

export async function ativarCategoria(request: FastifyRequest, reply: FastifyReply) {
  const getParamsSchema = z.object({ id: z.string().uuid() })
  const { id } = getParamsSchema.parse(request.params)
  const usuarioId = request.user.sub

  const categoria = await prisma.categoria.findUnique({ where: { id } })

  if (!categoria || categoria.usuarioId !== usuarioId) {
    return reply.status(404).send({ message: 'Categoria não encontrada' })
  }

  const categoriaAtivada = await prisma.categoria.update({
    where: { id },
    data: { ativa: true },
  })

  return reply.status(200).send(categoriaAtivada)
}
