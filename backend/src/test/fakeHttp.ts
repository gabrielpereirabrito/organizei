import { FastifyReply, FastifyRequest } from 'fastify'

/**
 * Request/reply mínimos para exercitar controllers direto, sem subir o Fastify.
 * Só o que os controllers realmente tocam: `body`, `params`, `query` e `user.sub`.
 */
export function criarRequest(dados: {
  usuarioId: string
  body?: unknown
  params?: unknown
  query?: unknown
}): FastifyRequest {
  return {
    body: dados.body ?? {},
    params: dados.params ?? {},
    query: dados.query ?? {},
    user: { sub: dados.usuarioId },
  } as unknown as FastifyRequest
}

export type ReplyFake = {
  statusCode: number
  payload: unknown
  status(codigo: number): ReplyFake
  send(payload: unknown): ReplyFake
}

export function criarReply(): ReplyFake {
  const reply: ReplyFake = {
    statusCode: 200,
    payload: undefined,
    status(codigo: number) {
      reply.statusCode = codigo
      return reply
    },
    send(payload: unknown) {
      reply.payload = payload
      return reply
    },
  }
  return reply
}

/**
 * O `ReplyFake` implementa só a fatia de `FastifyReply` que os controllers usam;
 * este cast concentra num lugar só a conversão para o tipo que eles esperam.
 */
export const comoReply = (reply: ReplyFake) => reply as unknown as FastifyReply

/**
 * Captura o erro lançado por uma chamada assíncrona. `AppError` não estende
 * `Error`, então os matchers `rejects.toThrow` do Vitest não servem aqui.
 */
export async function capturarErro(executar: () => Promise<unknown>): Promise<unknown> {
  try {
    await executar()
    return null
  } catch (erro) {
    return erro
  }
}
