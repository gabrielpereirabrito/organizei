import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'


const listarCategoriasQuerySchema = z.object({
  tipo: z.enum(['RECEITA', 'DESPESA', 'TRANSFERENCIA']).optional(),
})

const criarCategoriaBodySchema = z.object({
  nome: z.string().min(1),
  icone: z.string().optional(),
  cor: z.string().optional(),
  tipo: z.enum(['RECEITA', 'DESPESA', 'TRANSFERENCIA']),
})

export async function listarCategorias(request: FastifyRequest, reply: FastifyReply) {
  const { tipo } = listarCategoriasQuerySchema.parse(request.query)
  const usuarioId = request.user.sub

  const categorias = await prisma.categoria.findMany({
    where: { 
      usuarioId,
      ...(tipo ? { tipo } : {}), // Adiciona filtro apenas se 'tipo' for fornecido
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
