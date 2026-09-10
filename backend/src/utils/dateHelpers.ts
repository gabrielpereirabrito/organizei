import { FrequenciaRecorrencia, TipoIntervalo } from '@prisma/client'

/**
 * Soma meses preservando o dia do mês e, quando esse dia não existe no mês de
 * destino, grudando no último dia dele: 31/01 + 1 mês → 28/02 (e não 03/03).
 *
 * `setMonth` sozinho transborda — pedir "31 de fevereiro" devolve 03 de março.
 * Numa recorrência isso não é só um dia errado: uma conta que vence todo dia 31
 * gerava 31/01 → 03/03 → 31/03 → 01/05, pulando fevereiro e abril inteiros.
 *
 * O dia é sempre recalculado a partir de `dataBase`, nunca do resultado
 * anterior, então o grude num mês curto não contamina os meses seguintes:
 * 31/01 + 1 mês → 28/02, mas 31/01 + 2 meses → 31/03.
 */
export function adicionarMeses(dataBase: Date, meses: number): Date {
  const resultado = new Date(dataBase)
  const diaDesejado = resultado.getDate()

  // Passar pelo dia 1 antes de trocar o mês impede que o próprio `setMonth`
  // transborde enquanto o dia antigo ainda está aplicado.
  resultado.setDate(1)
  resultado.setMonth(resultado.getMonth() + meses)

  // Dia 0 do mês seguinte = último dia do mês atual.
  const ultimoDiaDoMes = new Date(resultado.getFullYear(), resultado.getMonth() + 1, 0).getDate()
  resultado.setDate(Math.min(diaDesejado, ultimoDiaDoMes))

  return resultado
}

export function incrementarData(
  dataBase: Date,
  frequencia: FrequenciaRecorrencia,
  iteracao: number,
  intervaloValor?: number | null,
  intervaloTipo?: TipoIntervalo | null
): Date {
  let novaData = new Date(dataBase)
  if (frequencia === 'MENSAL') {
    novaData = adicionarMeses(dataBase, iteracao)
  } else if (frequencia === 'SEMANAL') {
    novaData.setDate(novaData.getDate() + iteracao * 7)
  } else if (frequencia === 'ANUAL') {
    // 12 meses em vez de `setFullYear` para clampar 29/02 em ano não bissexto.
    novaData = adicionarMeses(dataBase, iteracao * 12)
  } else if (frequencia === 'PERSONALIZADA' && intervaloValor && intervaloTipo) {
    if (intervaloTipo === 'DIAS') {
      novaData.setDate(novaData.getDate() + iteracao * intervaloValor)
    } else if (intervaloTipo === 'SEMANAS') {
      novaData.setDate(novaData.getDate() + iteracao * (intervaloValor * 7))
    } else if (intervaloTipo === 'MESES') {
      novaData = adicionarMeses(dataBase, iteracao * intervaloValor)
    } else if (intervaloTipo === 'ANOS') {
      novaData = adicionarMeses(dataBase, iteracao * intervaloValor * 12)
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

export function calcularInstanciasRecorrencia(
  dataInicio: Date,
  dataLimite: Date,
  frequencia: FrequenciaRecorrencia,
  intervaloValor?: number | null,
  intervaloTipo?: TipoIntervalo | null
): Date[] {
  const datas: Date[] = []
  let iteracao = 0
  
  while (true) {
    const dataGerada = incrementarData(dataInicio, frequencia, iteracao, intervaloValor, intervaloTipo)
    
    if (dataGerada > dataLimite) {
      break
    }
    
    datas.push(dataGerada)
    iteracao++

    // Prevenção contra loops infinitos em caso de parâmetros anômalos
    if (iteracao > 1000) {
      console.warn('[dateHelpers] Loop de recorrência interrompido para evitar loop infinito (iteracao > 1000).')
      break
    }
  }
  
  return datas
}
