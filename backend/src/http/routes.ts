import { FastifyInstance } from 'fastify'
import { cadastro, login, refresh } from './controllers/auth'
import { verificarJwt } from './middlewares/verificar-jwt'
import { criarConta, listarContas, buscarContaPorId, atualizarConta, deletarConta, inativarConta, ativarConta, obterSaldoTotal } from './controllers/contas'
import { criarCategoria, listarCategorias, buscarCategoriaPorId, inativarCategoria, ativarCategoria, atualizarCategoria } from './controllers/categorias'
import { criarTransacao, listarTransacoes, resumoMensal, editarTransacao, deletarTransacao } from './controllers/transacoes'
import { criarRecorrencia, editarRecorrenciaEmLote, deletarRecorrenciaEmLote, listarRecorrencias, buscarRecorrenciaPorId } from './controllers/recorrencias'
import { criarMeta, listarMetas, atualizarMeta, deletarMeta } from './controllers/metas'

export async function appRoutes(app: FastifyInstance) {
  // Rotas Públicas
  app.post('/auth/cadastro', cadastro)
  app.post('/auth/login', login)
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

    // Categorias
    authedApp.post('/categorias', criarCategoria)
    authedApp.get('/categorias', listarCategorias)
    authedApp.get('/categorias/:id', buscarCategoriaPorId)
    authedApp.patch('/categorias/:id/inativar', inativarCategoria)
    authedApp.patch('/categorias/:id/ativar', ativarCategoria)
    authedApp.put('/categorias/:id', atualizarCategoria)

    // Transações
    authedApp.post('/transacoes', criarTransacao)
    authedApp.get('/transacoes', listarTransacoes)
    authedApp.put('/transacoes/:id', editarTransacao)
    authedApp.delete('/transacoes/:id', deletarTransacao)
    authedApp.get('/transacoes/resumo-mensal', resumoMensal)

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
  })
}
