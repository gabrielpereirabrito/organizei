import { FastifyInstance } from 'fastify'
import { cadastro, login } from './controllers/auth'

export async function appRoutes(app: FastifyInstance) {
  app.post('/auth/cadastro', cadastro)
  app.post('/auth/login', login)
}
