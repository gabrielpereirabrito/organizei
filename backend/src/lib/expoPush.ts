// API do Expo Push: POST JSON simples, sem necessidade de SDK dedicado.
// https://docs.expo.dev/push-notifications/sending-notifications/#send-push-notifications-using-a-post-request
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
const TAMANHO_LOTE = 100

interface IMensagemPush {
  to: string
  title: string
  body: string
  data?: Record<string, unknown>
}

export async function enviarPushNotifications(mensagens: IMensagemPush[]) {
  if (mensagens.length === 0) return

  const lotes: IMensagemPush[][] = []
  for (let i = 0; i < mensagens.length; i += TAMANHO_LOTE) {
    lotes.push(mensagens.slice(i, i + TAMANHO_LOTE))
  }

  for (const lote of lotes) {
    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lote),
      })

      if (!response.ok) {
        console.error(`❌ [ExpoPush] Falha ao enviar lote: HTTP ${response.status}`)
      }
    } catch (error) {
      // Um push falho não pode derrubar o cron que o disparou.
      console.error('❌ [ExpoPush] Erro ao enviar notificações:', error)
    }
  }
}
