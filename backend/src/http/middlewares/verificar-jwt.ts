import { FastifyReply, FastifyRequest } from 'fastify'

export async function verificarJwt(request: FastifyRequest, reply: FastifyReply) {
  try {
    // O request.jwtVerify() do @fastify/jwt possui fallback automático inteligente.
    // Como configuramos a opção 'cookie' no src/app.ts, ele vai tentar:
    // 1. Extrair do cookie 'token' (Browser/Web)
    // 2. Se o cookie não existir, extrair do header 'Authorization: Bearer <TOKEN>' (Expo/Mobile)
    await request.jwtVerify()
  } catch (err) {
    return reply.status(401).send({ message: 'Não autorizado. Token inválido ou ausente.' })
  }
}