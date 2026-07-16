import cron from 'node-cron'
import { prisma } from '../lib/prisma'

export function startCronJobs() {
  // Roda todos os dias à meia-noite (00:00)
  cron.schedule('0 0 * * *', async () => {
    console.log('⏳ [Cron] Verificando transações vencidas...')
    try {
      const now = new Date()
      
      const result = await prisma.transacao.updateMany({
        where: {
          status: 'PENDENTE',
          dataVencimento: {
            lt: now, // menor que agora
          },
        },
        data: {
          status: 'VENCIDA',
        },
      })
      
      console.log(`✅ [Cron] ${result.count} transações marcadas como VENCIDA.`)
    } catch (error) {
      console.error('❌ [Cron] Erro ao verificar transações vencidas:', error)
    }
  })
  
  console.log('⏰ Cron jobs registrados com sucesso.')
}
