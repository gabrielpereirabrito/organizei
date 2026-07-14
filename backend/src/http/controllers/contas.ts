import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// Payload: { nome: "Itaú", tipo: "CORRENTE", saldoInicial: 50000 }
const criarContaBodySchema = z.object({
  nome: z.string().min(1),
  tipo: z.enum(['CORRENTE', 'POUPANCA', 'CARTEIRA', 'INVESTIMENTO']),
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

export async function buscarContaPorId(request: FastifyRequest, reply: FastifyReply) {
  const getParamsSchema = z.object({ id: z.string().uuid() })
  const { id } = getParamsSchema.parse(request.params)
  const usuarioId = request.user.sub

  const conta = await prisma.conta.findUnique({ where: { id } })

  if (!conta || conta.usuarioId !== usuarioId) {
    return reply.status(404).send({ message: 'Conta não encontrada' })
  }

  return reply.status(200).send(conta)
}

export async function atualizarConta(request: FastifyRequest, reply: FastifyReply) {
  const getParamsSchema = z.object({ id: z.string().uuid() })
  const updateBodySchema = z.object({
    nome: z.string().min(1).optional(),
    tipo: z.enum(['CORRENTE', 'POUPANCA', 'CARTEIRA', 'INVESTIMENTO']).optional(),
  })

  const { id } = getParamsSchema.parse(request.params)
  const { nome, tipo } = updateBodySchema.parse(request.body)
  const usuarioId = request.user.sub

  const conta = await prisma.conta.findUnique({ where: { id } })

  if (!conta || conta.usuarioId !== usuarioId) {
    return reply.status(404).send({ message: 'Conta não encontrada' })
  }

  const contaAtualizada = await prisma.conta.update({
    where: { id },
    data: { nome, tipo },
  })

  return reply.status(200).send(contaAtualizada)
}

export async function deletarConta(request: FastifyRequest, reply: FastifyReply) {
  const getParamsSchema = z.object({ id: z.string().uuid() })
  const { id } = getParamsSchema.parse(request.params)
  const usuarioId = request.user.sub

  const conta = await prisma.conta.findUnique({ where: { id } })

  if (!conta || conta.usuarioId !== usuarioId) {
    return reply.status(404).send({ message: 'Conta não encontrada' })
  }

  await prisma.conta.delete({
    where: { id },
  })

  return reply.status(204).send()
}

export async function inativarConta(request: FastifyRequest, reply: FastifyReply) {
  const getParamsSchema = z.object({ id: z.string().uuid() })
  const { id } = getParamsSchema.parse(request.params)
  const usuarioId = request.user.sub

  const conta = await prisma.conta.findUnique({ where: { id } })

  if (!conta || conta.usuarioId !== usuarioId) {
    return reply.status(404).send({ message: 'Conta não encontrada' })
  }

  const contaInativada = await prisma.conta.update({
    where: { id },
    data: { ativa: false },
  })

  return reply.status(200).send(contaInativada)
}

export async function ativarConta(request: FastifyRequest, reply: FastifyReply) {
  const getParamsSchema = z.object({ id: z.string().uuid() })
  const { id } = getParamsSchema.parse(request.params)
  const usuarioId = request.user.sub

  const conta = await prisma.conta.findUnique({ where: { id } })

  if (!conta || conta.usuarioId !== usuarioId) {
    return reply.status(404).send({ message: 'Conta não encontrada' })
  }

  const contaAtivada = await prisma.conta.update({
    where: { id },
    data: { ativa: true },
  })

  return reply.status(200).send(contaAtivada)
}
