import fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { ZodError } from 'zod'
import { appRoutes } from './http/routes'
import fastifyCookie from '@fastify/cookie'
import fastifyHelmet from '@fastify/helmet'
import fastifyRateLimit from '@fastify/rate-limit'
import { env } from './env'

export const app = fastify()

// Configuração do CORS para permitir que o Expo (Mobile e Web) se conecte
app.register(cors, {
  origin: true, // Em produção na Render, você pode restringir para o seu domínio
  credentials: true, // IMPORTANTÍSSIMO para o tráfego de cookies entre frontend web e backend
})

// Configurações de Segurança e Resiliência (ADR 0006)
app.register(fastifyHelmet) // Adiciona headers de segurança HTTP (contra XSS, Sniffing, etc)
app.register(fastifyRateLimit, {
  max: 100, // Máximo de 100 requisições...
  timeWindow: '1 minute', // ...por minuto, por IP. (Impede brute force/DDoS básico)
})

// Registro do plugin de Cookies ANTES do JWT
app.register(fastifyCookie)

// Configuração do JWT Auth com suporte híbrido (Header e Cookie)
app.register(jwt, {
  secret: env.JWT_SECRET,
  cookie: {
    cookieName: 'token', // Nome do cookie que o fastify-jwt vai procurar
    signed: false,
  },
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