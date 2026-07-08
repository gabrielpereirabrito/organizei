import { FastifyInstance } from 'fastify'
import { cadastro, login } from './controllers/auth'
import { verificarJwt } from './middlewares/verificar-jwt'
import { criarConta, listarContas } from './controllers/contas'
import { criarCategoria, listarCategorias } from './controllers/categorias'
import { criarTransacao, resumoMensal } from './controllers/transacoes'

export async function appRoutes(app: FastifyInstance) {
  // Rotas Públicas
  app.post('/auth/cadastro', cadastro)
  app.post('/auth/login', login)

  // Rotas Autenticadas (Requerem JWT/Cookie)
  app.register(async (authedApp) => {
    authedApp.addHook('onRequest', verificarJwt)

    // Contas
    authedApp.post('/contas', criarConta)
    authedApp.get('/contas', listarContas)

    // Categorias
    authedApp.post('/categorias', criarCategoria)
    authedApp.get('/categorias', listarCategorias)

    // Transações
    authedApp.post('/transacoes', criarTransacao)
    authedApp.get('/transacoes/resumo-mensal', resumoMensal)
  })
}
