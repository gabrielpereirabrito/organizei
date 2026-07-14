import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { Prisma, FrequenciaRecorrencia, TipoIntervalo } from '@prisma/client'

const criarRecorrenciaBodySchema = z.object({
  descricao: z.string().min(1),
  valor: z.number().positive(),
  tipo: z.enum(['RECEITA', 'DESPESA', 'TRANSFERENCIA']),
  frequencia: z.enum(['SEMANAL', 'MENSAL', 'ANUAL', 'PERSONALIZADA']),
  intervaloValor: z.number().positive().optional(),
  intervaloTipo: z.enum(['DIAS', 'DIAS_UTEIS', 'SEMANAS', 'MESES', 'ANOS']).optional(),
  dataInicio: z.coerce.date(),
  duracaoMeses: z.number().positive().default(12),
  contaId: z.string().uuid(),
  categoriaId: z.string().uuid(),
}).refine(data => {
  if (data.frequencia === 'PERSONALIZADA') {
    return data.intervaloValor !== undefined && data.intervaloTipo !== undefined;
  }
  return true;
}, { message: "intervaloValor e intervaloTipo são obrigatórios para frequência PERSONALIZADA." })


const editarRecorrenciaLoteBodySchema = z.object({
  descricao: z.string().min(1).optional(),
  valor: z.number().positive().optional(),
  dataCorte: z.coerce.date(),
})

const deletarRecorrenciaLoteBodySchema = z.object({
  dataCorte: z.coerce.date(),
})

// Helper para adicionar meses/semanas/dias
function incrementarData(dataBase: Date, frequencia: FrequenciaRecorrencia, iteracao: number, intervaloValor?: number | null, intervaloTipo?: TipoIntervalo | null): Date {
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

export async function criarRecorrencia(request: FastifyRequest, reply: FastifyReply) {
  const { descricao, valor, tipo, frequencia, intervaloValor, intervaloTipo, dataInicio, duracaoMeses, contaId, categoriaId } = criarRecorrenciaBodySchema.parse(request.body)
  const usuarioId = request.user.sub

  const [contaExiste, categoriaExiste] = await Promise.all([
    prisma.conta.findUnique({ where: { id: contaId, usuarioId } }),
    prisma.categoria.findUnique({ where: { id: categoriaId, usuarioId } }),
  ])

  if (!contaExiste || !categoriaExiste) {
    return reply.status(404).send({ message: 'Conta ou Categoria não encontrada para este usuário.' })
  }

  const dataFim = incrementarData(dataInicio, frequencia, duracaoMeses - 1, intervaloValor, intervaloTipo)

  const recorrencia = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const molde = await tx.recorrencia.create({
      data: {
        descricao,
        valor,
        tipo,
        frequencia,
        intervaloValor,
        intervaloTipo,
        dataInicio,
        dataFim,
        usuarioId,
        contaId,
        categoriaId,
      }
    })

    const transacoesAGerar = []
    for (let i = 0; i < duracaoMeses; i++) {
      transacoesAGerar.push({
        descricao,
        valor,
        tipo,
        status: 'PENDENTE' as const,
        data: incrementarData(dataInicio, frequencia, i, intervaloValor, intervaloTipo),
        usuarioId,
        contaId,
        categoriaId,
        recorrenciaId: molde.id,
      })
    }

    await tx.transacao.createMany({
      data: transacoesAGerar,
    })

    return molde
  })

  return reply.status(201).send(recorrencia)
}

export async function editarRecorrenciaEmLote(request: FastifyRequest, reply: FastifyReply) {
  const paramsSchema = z.object({ id: z.string().uuid() })
  const { id } = paramsSchema.parse(request.params)
  const { descricao, valor, dataCorte } = editarRecorrenciaLoteBodySchema.parse(request.body)
  const usuarioId = request.user.sub

  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const molde = await tx.recorrencia.findUnique({ where: { id, usuarioId } })
      if (!molde) throw new Error('NOT_FOUND')

      await tx.recorrencia.update({
        where: { id },
        data: {
          descricao: descricao ?? molde.descricao,
          valor: valor ?? molde.valor,
        }
      })

      const updates: any = {}
      if (descricao) updates.descricao = descricao
      if (valor) updates.valor = valor

      // Transações que já foram PAGAS (gastas) não devem ter seu valor histórico modificado em lote?
      // Apenas atualizamos transações que ainda estão PENDENTES para evitar bagunçar o extrato.
      // Se quiser alterar tudo >= dataCorte (como a ADR diz), a gente altera tudo. Mas atenção com o saldo.
      // Se alterarmos transações que já foram pagas, o saldo ficará dessincronizado!
      // A solução segura: atualizar o valor apenas de transações PENDENTES a partir daquela data,
      // ou atualizar a descrição de todas as transações a partir daquela data.
      
      if (descricao) {
        await tx.transacao.updateMany({
          where: { recorrenciaId: id, usuarioId, data: { gte: dataCorte } },
          data: { descricao }
        })
      }

      if (valor) {
        await tx.transacao.updateMany({
          where: { recorrenciaId: id, usuarioId, data: { gte: dataCorte }, status: 'PENDENTE' },
          data: { valor }
        })
      }
    })

    return reply.status(204).send()
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return reply.status(404).send({ message: 'Recorrência não encontrada.' })
    }
    throw error
  }
}

export async function deletarRecorrenciaEmLote(request: FastifyRequest, reply: FastifyReply) {
  const paramsSchema = z.object({ id: z.string().uuid() })
  const { id } = paramsSchema.parse(request.params)
  const { dataCorte } = deletarRecorrenciaLoteBodySchema.parse(request.body)
  const usuarioId = request.user.sub

  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const molde = await tx.recorrencia.findUnique({ where: { id, usuarioId } })
      if (!molde) throw new Error('NOT_FOUND')

      await tx.recorrencia.update({
        where: { id },
        data: { dataFim: dataCorte }
      })

      const pagas = await tx.transacao.findMany({
        where: { recorrenciaId: id, usuarioId, data: { gte: dataCorte }, status: 'PAGA' }
      })

      for (const transacao of pagas) {
        await tx.conta.update({
          where: { id: transacao.contaId },
          data: {
            saldoAtual: {
              [transacao.tipo === 'RECEITA' ? 'decrement' : 'increment']: transacao.valor
            }
          }
        })
      }

      await tx.transacao.deleteMany({
        where: { recorrenciaId: id, usuarioId, data: { gte: dataCorte } }
      })
    })

    return reply.status(204).send()
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return reply.status(404).send({ message: 'Recorrência não encontrada.' })
    }
    throw error
  }
}
