import { FrequenciaRecorrencia, TipoIntervalo } from '@prisma/client'

export function incrementarData(
  dataBase: Date,
  frequencia: FrequenciaRecorrencia,
  iteracao: number,
  intervaloValor?: number | null,
  intervaloTipo?: TipoIntervalo | null
): Date {
  const novaData = new Date(dataBase)
  if (frequencia === 'MENSAL') {
    novaData.setMonth(novaData.getMonth() + iteracao)
  } else if (frequencia === 'SEMANAL') {
    novaData.setDate(novaData.getDate() + iteracao * 7)
  } else if (frequencia === 'ANUAL') {
    novaData.setFullYear(novaData.getFullYear() + iteracao)
  } else if (frequencia === 'PERSONALIZADA' && intervaloValor && intervaloTipo) {
    if (intervaloTipo === 'DIAS') {
      novaData.setDate(novaData.getDate() + iteracao * intervaloValor)
    } else if (intervaloTipo === 'SEMANAS') {
      novaData.setDate(novaData.getDate() + iteracao * (intervaloValor * 7))
    } else if (intervaloTipo === 'MESES') {
      novaData.setMonth(novaData.getMonth() + iteracao * intervaloValor)
    } else if (intervaloTipo === 'ANOS') {
      novaData.setFullYear(novaData.getFullYear() + iteracao * intervaloValor)
    } else if (intervaloTipo === 'DIAS_UTEIS') {
      let diasParaAdicionar = iteracao * intervaloValor
      while (diasParaAdicionar > 0) {
        novaData.setDate(novaData.getDate() + 1)
        const diaDaSemana = novaData.getDay()
        // Pula domingo (0) e sábado (6)
        if (diaDaSemana !== 0 && diaDaSemana !== 6) {
          diasParaAdicionar--
        }
      }
    }
  }
  return novaData
}
