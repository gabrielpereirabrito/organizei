import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const registrarPushTokenBodySchema = z.object({
  pushToken: z.string().min(1),
})

export async function registrarPushToken(request: FastifyRequest, reply: FastifyReply) {
  const { pushToken } = registrarPushTokenBodySchema.parse(request.body)
  const usuarioId = request.user.sub

  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { pushToken },
  })

  return reply.status(204).send()
}
