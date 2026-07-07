import fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { ZodError } from 'zod'
import { appRoutes } from './http/routes'

export const app = fastify()

// Configuração do CORS para permitir que o Expo (Mobile e Web) se conecte
app.register(cors, {
  origin: true, // Em produção na Render, você pode restringir para o seu domínio
})

// Configuração do JWT Auth
app.register(jwt, {
  secret: process.env.JWT_SECRET || 'super-secret-key-dev',
})

// Registro das rotas da API
app.register(appRoutes)

// Tratamento Global de Erros (Zod e Genéricos)
app.setErrorHandler((error, _request, reply) => {
  if (error instanceof ZodError) {
    return reply
      .status(400)
      .send({ message: 'Erro de validação.', issues: error.format() })
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(error)
  } else {
    // TODO: Aqui você pode logar em alguma ferramenta externa se quiser no futuro
  }

  return reply.status(500).send({ message: 'Internal server error.' })
})