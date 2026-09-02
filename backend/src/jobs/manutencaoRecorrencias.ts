import { prisma } from '../lib/prisma'
import { calcularInstanciasRecorrencia } from '../utils/dateHelpers'

export async function renovarRecorrencias() {
  console.log('🔄 [Cron] Iniciando renovação de recorrências ativas...')
  try {
    const now = new Date()
    const horizonteLimite = new Date()
    horizonteLimite.setMonth(horizonteLimite.getMonth() + 12)

    // Busca recorrências ativas (sem dataFim ou com dataFim > now)
    const recorrenciasAtivas = await prisma.recorrencia.findMany({
      where: {
        OR: [
          { dataFim: null },
          { dataFim: { gt: now } }
        ]
      },
      include: {
        transacoes: {
          orderBy: { dataVencimento: 'desc' },
          take: 1
        }
      }
    })

    let totalCriadas = 0

    for (const recorrencia of recorrenciasAtivas) {
      const ultimaDataGerada = recorrencia.transacoes.length > 0 
        ? recorrencia.transacoes[0].dataVencimento 
        : new Date(recorrencia.dataInicio.getTime() - 1000)
      
      const limiteIndividual = recorrencia.dataFim && recorrencia.dataFim < horizonteLimite 
        ? recorrencia.dataFim 
        : horizonteLimite;

      if (ultimaDataGerada >= limiteIndividual) {
        continue // Já está abastecida até o limite
      }

      const todasDatas = calcularInstanciasRecorrencia(
        recorrencia.dataInicio, 
        limiteIndividual, 
        recorrencia.frequencia, 
        recorrencia.intervaloValor, 
        recorrencia.intervaloTipo
      )

      // Pega apenas as datas que ainda não foram geradas
      const datasNovas = todasDatas.filter(d => d.getTime() > ultimaDataGerada.getTime())

      if (datasNovas.length > 0) {
        const transacoesAGerar = datasNovas.map(data => ({
          descricao: recorrencia.descricao,
          valor: recorrencia.valor,
          tipo: recorrencia.tipo,
          status: 'PENDENTE' as const,
          dataVencimento: data,
          usuarioId: recorrencia.usuarioId,
          contaId: recorrencia.contaId,
          categoriaId: recorrencia.categoriaId,
          recorrenciaId: recorrencia.id,
        }))

        await prisma.transacao.createMany({
          data: transacoesAGerar
        })

        totalCriadas += datasNovas.length
      }
    }

    console.log(`✅ [Cron] ${totalCriadas} transações futuras geradas para manter o horizonte de 12 meses.`)
  } catch (error) {
    console.error('❌ [Cron] Erro ao renovar recorrências:', error)
  }
}
