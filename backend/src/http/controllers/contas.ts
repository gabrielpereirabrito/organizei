import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// Payload: { nome: "Itaú", tipo: "CORRENTE", saldoInicial: 50000 }
const criarContaBodySchema = z.object({
  nome: z.string().min(1),
  tipo: z.string().min(1),
  saldoInicial: z.number().default(0), // Em centavos
})

export async function criarConta(request: FastifyRequest, reply: FastifyReply) {
  const { nome, tipo, saldoInicial } = criarContaBodySchema.parse(request.body)
  const usuarioId = request.user.sub // Injetado pelo middleware verificarJwt

  const conta = await prisma.conta.create({
    data: {
      nome,
      tipo,
      saldoAtual: saldoInicial,
      usuarioId,
    },
  })

  return reply.status(201).send(conta)
}

export async function listarContas(request: FastifyRequest, reply: FastifyReply) {
  const usuarioId = request.user.sub

  const contas = await prisma.conta.findMany({
    where: { usuarioId },
    orderBy: { criadoEm: 'asc' },
  })

  return reply.status(200).send(contas)
}
