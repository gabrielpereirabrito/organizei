import { FastifyInstance } from 'fastify'
import { cadastro, login, refresh } from './controllers/auth'
import { verificarJwt } from './middlewares/verificar-jwt'
import { criarConta, listarContas, buscarContaPorId, atualizarConta, deletarConta, inativarConta, ativarConta, obterSaldoTotal } from './controllers/contas'
import { criarCategoria, listarCategorias, buscarCategoriaPorId, inativarCategoria, ativarCategoria, atualizarCategoria, deletarCategoria } from './controllers/categorias'
import { criarTransacao, listarTransacoes, resumoMensal, editarTransacao, deletarTransacao, projecaoFluxoCaixa } from './controllers/transacoes'
import { criarRecorrencia, editarRecorrenciaEmLote, deletarRecorrenciaEmLote, listarRecorrencias, buscarRecorrenciaPorId } from './controllers/recorrencias'
import { criarMeta, listarMetas, atualizarMeta, deletarMeta } from './controllers/metas'
import { registrarPushToken } from './controllers/usuarios'

// Limite mais estrito que o global (100 req/min) para as rotas de autenticação,
// que são o alvo natural de força bruta (ADR 0006). Sobrescreve por rota o
// `fastifyRateLimit` registrado globalmente em `app.ts`.
const authRateLimit = {
  config: {
    rateLimit: {
      max: 10,
      timeWindow: '1 minute',
    },
  },
}

export async function appRoutes(app: FastifyInstance) {
  // Rotas Públicas
  app.post('/auth/cadastro', authRateLimit, cadastro)
  app.post('/auth/login', authRateLimit, login)
  app.post('/auth/refresh', refresh)

  // Rotas Autenticadas (Requerem JWT/Cookie)
  app.register(async (authedApp) => {
    authedApp.addHook('onRequest', verificarJwt)

    // Contas
    authedApp.post('/contas', criarConta)
    authedApp.get('/contas', listarContas)
    authedApp.get('/contas/saldo-total', obterSaldoTotal)
    authedApp.get('/contas/:id', buscarContaPorId)
    authedApp.put('/contas/:id', atualizarConta)
    authedApp.delete('/contas/:id', deletarConta)
    authedApp.patch('/contas/:id/inativar', inativarConta)
    authedApp.patch('/contas/:id/ativar', ativarConta)

    // Categorias
    authedApp.post('/categorias', criarCategoria)
    authedApp.get('/categorias', listarCategorias)
    authedApp.get('/categorias/:id', buscarCategoriaPorId)
    authedApp.patch('/categorias/:id/inativar', inativarCategoria)
    authedApp.patch('/categorias/:id/ativar', ativarCategoria)
    authedApp.put('/categorias/:id', atualizarCategoria)
    authedApp.delete('/categorias/:id', deletarCategoria)

    // Transações
    authedApp.post('/transacoes', criarTransacao)
    authedApp.get('/transacoes', listarTransacoes)
    authedApp.put('/transacoes/:id', editarTransacao)
    authedApp.delete('/transacoes/:id', deletarTransacao)
    authedApp.get('/transacoes/resumo-mensal', resumoMensal)
    authedApp.get('/transacoes/projecao-fluxo-caixa', projecaoFluxoCaixa)

    // Recorrências
    authedApp.post('/recorrencias', criarRecorrencia)
    authedApp.get('/recorrencias', listarRecorrencias)
    authedApp.get('/recorrencias/:id', buscarRecorrenciaPorId)
    authedApp.put('/recorrencias/:id', editarRecorrenciaEmLote)
    authedApp.delete('/recorrencias/:id', deletarRecorrenciaEmLote)

    // Metas/Orçamentos
    authedApp.post('/metas', criarMeta)
    authedApp.get('/metas', listarMetas)
    authedApp.put('/metas/:id', atualizarMeta)
    authedApp.delete('/metas/:id', deletarMeta)

    // Usuário
    authedApp.patch('/usuarios/push-token', registrarPushToken)
  })
}
