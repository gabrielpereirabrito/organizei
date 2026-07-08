import '@fastify/jwt'

declare module '@fastify/jwt' {
  export interface FastifyJWT {
    user: {
      sub: string
    } // Aqui tipamos exatamente o que tem dentro do request.user
  }
}
