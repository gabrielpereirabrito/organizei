import cron from 'node-cron'
import { prisma } from '../lib/prisma'
import { renovarRecorrencias } from './manutencaoRecorrencias'
import { enviarPushNotifications } from '../lib/expoPush'

const formatarMoeda = (centavos: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(centavos / 100)

export function startCronJobs() {
  // Roda todos os dias à meia-noite (00:00)
  cron.schedule('0 0 * * *', async () => {
    console.log('⏳ [Cron] Verificando transações vencidas...')
    try {
      const now = new Date()

      const vencidas = await prisma.transacao.findMany({
        where: {
          status: 'PENDENTE',
          dataVencimento: {
            lt: now, // menor que agora
          },
        },
        select: {
          id: true,
          descricao: true,
          valor: true,
          usuarioId: true,
          usuario: { select: { pushToken: true } },
        },
      })

      if (vencidas.length > 0) {
        await prisma.transacao.updateMany({
          where: { id: { in: vencidas.map((t) => t.id) } },
          data: { status: 'VENCIDA' },
        })
      }

      console.log(`✅ [Cron] ${vencidas.length} transações marcadas como VENCIDA.`)

      const porUsuario = new Map<string, { pushToken: string | null; transacoes: typeof vencidas }>()
      for (const transacao of vencidas) {
        const grupo = porUsuario.get(transacao.usuarioId) ?? { pushToken: transacao.usuario.pushToken, transacoes: [] }
        grupo.transacoes.push(transacao)
        porUsuario.set(transacao.usuarioId, grupo)
      }

      const mensagens = Array.from(porUsuario.values())
        .filter((grupo) => !!grupo.pushToken)
        .map((grupo) => {
          if (grupo.transacoes.length === 1) {
            const [transacao] = grupo.transacoes
            return {
              to: grupo.pushToken as string,
              title: 'Transação vencida',
              body: `${transacao.descricao} - ${formatarMoeda(transacao.valor)}`,
            }
          }

          const total = grupo.transacoes.reduce((acc, t) => acc + t.valor, 0)
          return {
            to: grupo.pushToken as string,
            title: `${grupo.transacoes.length} transações vencidas`,
            body: `Total de ${formatarMoeda(total)} em contas vencidas.`,
          }
        })

      await enviarPushNotifications(mensagens)
    } catch (error) {
      console.error('❌ [Cron] Erro ao verificar transações vencidas:', error)
    }
  })

  // Roda todos os dias às 02:00 da manhã
  cron.schedule('0 2 * * *', async () => {
    await renovarRecorrencias()
  })
  
  console.log('⏰ Cron jobs registrados com sucesso.')
}
