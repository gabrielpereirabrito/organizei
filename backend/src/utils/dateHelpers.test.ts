import { describe, it, expect, vi, afterEach } from 'vitest'
import { incrementarData, calcularInstanciasRecorrencia } from './dateHelpers'

// Helpers locais: as funções sob teste usam getters/setters de data *local*
// (setMonth/getMonth), então os fixtures também precisam ser construídos em
// horário local para o teste não depender do fuso da máquina.
const data = (ano: number, mes: number, dia: number) => new Date(ano, mes - 1, dia)

const iso = (d: Date) => {
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return d.getFullYear() + '-' + mes + '-' + dia
}

const isos = (ds: Date[]) => ds.map(iso)

afterEach(() => {
  vi.restoreAllMocks()
})

describe('incrementarData', () => {
  it('a iteração 0 sempre devolve a própria data base', () => {
    expect(iso(incrementarData(data(2026, 3, 15), 'MENSAL', 0))).toBe('2026-03-15')
    expect(iso(incrementarData(data(2026, 3, 15), 'SEMANAL', 0))).toBe('2026-03-15')
    expect(iso(incrementarData(data(2026, 3, 15), 'ANUAL', 0))).toBe('2026-03-15')
  })

  it('não muta a data base recebida', () => {
    const base = data(2026, 3, 15)
    incrementarData(base, 'MENSAL', 6)
    expect(iso(base)).toBe('2026-03-15')
  })

  it('calcula cada iteração a partir da data base, não da anterior (sem drift acumulado)', () => {
    const base = data(2026, 1, 15)
    expect(iso(incrementarData(base, 'MENSAL', 12))).toBe('2027-01-15')
  })

  describe('MENSAL', () => {
    it('avança mês a mês preservando o dia', () => {
      const base = data(2026, 1, 10)
      expect(iso(incrementarData(base, 'MENSAL', 1))).toBe('2026-02-10')
      expect(iso(incrementarData(base, 'MENSAL', 13))).toBe('2027-02-10')
    })

    it('gruda no último dia do mês quando o dia não existe no destino', () => {
      const base = data(2026, 1, 31)
      expect(iso(incrementarData(base, 'MENSAL', 1))).toBe('2026-02-28') // fev não tem 31
      expect(iso(incrementarData(base, 'MENSAL', 2))).toBe('2026-03-31')
      expect(iso(incrementarData(base, 'MENSAL', 3))).toBe('2026-04-30') // abr não tem 31
    })

    it('o grude num mês curto não contamina os meses seguintes', () => {
      // O dia é recalculado sempre a partir da data base: passar por fevereiro
      // não faz a recorrência "virar dia 28" dali em diante.
      const base = data(2026, 1, 31)
      const dias = [0, 1, 2, 3, 4, 5].map((i) => incrementarData(base, 'MENSAL', i).getDate())
      expect(dias).toEqual([31, 28, 31, 30, 31, 30])
    })

    it('gruda no dia 29 em fevereiro de ano bissexto', () => {
      expect(iso(incrementarData(data(2024, 1, 31), 'MENSAL', 1))).toBe('2024-02-29')
    })

    it('preserva a hora ao ajustar o dia', () => {
      const base = new Date(2026, 0, 31, 14, 30, 0)
      const resultado = incrementarData(base, 'MENSAL', 1)
      expect(iso(resultado)).toBe('2026-02-28')
      expect(resultado.getHours()).toBe(14)
      expect(resultado.getMinutes()).toBe(30)
    })
  })

  describe('SEMANAL', () => {
    it('avança de 7 em 7 dias', () => {
      const base = data(2026, 3, 5)
      expect(iso(incrementarData(base, 'SEMANAL', 1))).toBe('2026-03-12')
      expect(iso(incrementarData(base, 'SEMANAL', 4))).toBe('2026-04-02')
    })

    it('mantém o dia da semana ao atravessar a virada de ano', () => {
      const base = data(2026, 12, 24)
      const resultado = incrementarData(base, 'SEMANAL', 2)
      expect(iso(resultado)).toBe('2027-01-07')
      expect(resultado.getDay()).toBe(base.getDay())
    })
  })

  describe('ANUAL', () => {
    it('avança de ano em ano', () => {
      expect(iso(incrementarData(data(2026, 6, 20), 'ANUAL', 3))).toBe('2029-06-20')
    })

    // Mesmo grude do caso MENSAL, aplicado a 29/02.
    it('gruda 29/02 em 28/02 num ano não bissexto', () => {
      expect(iso(incrementarData(data(2024, 2, 29), 'ANUAL', 1))).toBe('2025-02-28')
    })

    it('volta para 29/02 no próximo ano bissexto', () => {
      expect(iso(incrementarData(data(2024, 2, 29), 'ANUAL', 4))).toBe('2028-02-29')
    })
  })

  describe('PERSONALIZADA', () => {
    const base = data(2026, 1, 1) // quinta-feira

    it('DIAS soma intervaloValor dias por iteração', () => {
      expect(iso(incrementarData(base, 'PERSONALIZADA', 3, 10, 'DIAS'))).toBe('2026-01-31')
    })

    it('SEMANAS soma intervaloValor * 7 dias por iteração', () => {
      expect(iso(incrementarData(base, 'PERSONALIZADA', 2, 2, 'SEMANAS'))).toBe('2026-01-29')
    })

    it('MESES soma intervaloValor meses por iteração', () => {
      expect(iso(incrementarData(base, 'PERSONALIZADA', 2, 3, 'MESES'))).toBe('2026-07-01')
    })

    it('ANOS soma intervaloValor anos por iteração', () => {
      expect(iso(incrementarData(base, 'PERSONALIZADA', 2, 5, 'ANOS'))).toBe('2036-01-01')
    })

    it('MESES também gruda no último dia do mês de destino', () => {
      const dia31 = data(2026, 1, 31)
      expect(iso(incrementarData(dia31, 'PERSONALIZADA', 1, 1, 'MESES'))).toBe('2026-02-28')
    })

    it('ANOS também gruda 29/02 num ano não bissexto', () => {
      const bissexto = data(2024, 2, 29)
      expect(iso(incrementarData(bissexto, 'PERSONALIZADA', 1, 1, 'ANOS'))).toBe('2025-02-28')
    })

    it('DIAS_UTEIS pula sábados e domingos', () => {
      // Qui 01/01 + 5 dias úteis: sex 02, seg 05, ter 06, qua 07, qui 08
      expect(iso(incrementarData(base, 'PERSONALIZADA', 1, 5, 'DIAS_UTEIS'))).toBe('2026-01-08')
    })

    it('DIAS_UTEIS nunca devolve um fim de semana quando avança', () => {
      for (let i = 1; i <= 20; i++) {
        const resultado = incrementarData(base, 'PERSONALIZADA', i, 1, 'DIAS_UTEIS')
        expect([0, 6]).not.toContain(resultado.getDay())
      }
    })

    // ⚠️ Comportamento ATUAL: na iteração 0 o laço de dias úteis nem roda, então
    // uma recorrência que começa num sábado gera a primeira instância no sábado.
    it('DIAS_UTEIS devolve a data base intacta na iteração 0, mesmo em fim de semana', () => {
      const sabado = data(2026, 3, 14)
      expect(sabado.getDay()).toBe(6)
      expect(iso(incrementarData(sabado, 'PERSONALIZADA', 0, 1, 'DIAS_UTEIS'))).toBe('2026-03-14')
    })

    // ⚠️ Comportamento ATUAL: sem intervaloValor/intervaloTipo (ou com valor 0),
    // nenhum branch casa e a data volta inalterada — a recorrência trava no lugar.
    it('devolve a data base inalterada quando falta intervaloValor ou intervaloTipo', () => {
      expect(iso(incrementarData(base, 'PERSONALIZADA', 5))).toBe('2026-01-01')
      expect(iso(incrementarData(base, 'PERSONALIZADA', 5, 0, 'DIAS'))).toBe('2026-01-01')
      expect(iso(incrementarData(base, 'PERSONALIZADA', 5, 3, null))).toBe('2026-01-01')
    })
  })
})

describe('calcularInstanciasRecorrencia', () => {
  describe('limite (dataLimite)', () => {
    it('INCLUI a instância que cai exatamente na dataLimite', () => {
      const datas = calcularInstanciasRecorrencia(data(2026, 1, 1), data(2026, 1, 22), 'SEMANAL')
      expect(isos(datas)).toEqual(['2026-01-01', '2026-01-08', '2026-01-15', '2026-01-22'])
    })

    it('EXCLUI a instância um dia depois da dataLimite', () => {
      const datas = calcularInstanciasRecorrencia(data(2026, 1, 1), data(2026, 1, 21), 'SEMANAL')
      expect(isos(datas)).toEqual(['2026-01-01', '2026-01-08', '2026-01-15'])
    })

    it('compara também a hora, não só o dia', () => {
      const inicio = new Date(2026, 0, 1, 10, 0, 0)
      // Limite no mesmo dia da 2ª instância, porém uma hora antes dela.
      const limite = new Date(2026, 0, 8, 9, 0, 0)
      expect(isos(calcularInstanciasRecorrencia(inicio, limite, 'SEMANAL'))).toEqual(['2026-01-01'])
    })

    it('sempre inclui a data de início quando ela não passa do limite', () => {
      const dia = data(2026, 5, 9)
      expect(isos(calcularInstanciasRecorrencia(dia, dia, 'MENSAL'))).toEqual(['2026-05-09'])
    })

    it('devolve lista vazia quando a data de início já passou do limite', () => {
      const datas = calcularInstanciasRecorrencia(data(2026, 5, 10), data(2026, 5, 9), 'MENSAL')
      expect(datas).toEqual([])
    })
  })

  describe('frequência SEMANAL', () => {
    it('gera uma instância por semana dentro da janela', () => {
      const datas = calcularInstanciasRecorrencia(data(2026, 2, 26), data(2026, 3, 26), 'SEMANAL')
      expect(isos(datas)).toEqual([
        '2026-02-26',
        '2026-03-05',
        '2026-03-12',
        '2026-03-19',
        '2026-03-26',
      ])
    })

    it('gera 53 instâncias numa janela de um ano cheio', () => {
      const datas = calcularInstanciasRecorrencia(data(2026, 1, 1), data(2026, 12, 31), 'SEMANAL')
      expect(datas).toHaveLength(53)
      expect(iso(datas[datas.length - 1])).toBe('2026-12-31')
    })
  })

  describe('frequência MENSAL', () => {
    it('gera 12 instâncias na janela de rolling window de 12 meses', () => {
      const datas = calcularInstanciasRecorrencia(data(2026, 1, 15), data(2026, 12, 31), 'MENSAL')
      expect(datas).toHaveLength(12)
      expect(isos(datas).slice(0, 3)).toEqual(['2026-01-15', '2026-02-15', '2026-03-15'])
      expect(iso(datas[11])).toBe('2026-12-15')
    })

    it('atravessa a virada de ano', () => {
      const datas = calcularInstanciasRecorrencia(data(2026, 11, 5), data(2027, 2, 5), 'MENSAL')
      expect(isos(datas)).toEqual(['2026-11-05', '2026-12-05', '2027-01-05', '2027-02-05'])
    })

    // Regressão do transbordo: antes esta lista era 31/01, 03/03, 31/03, 01/05,
    // 31/05 — fevereiro e abril sumiam e as datas caíam no mês errado.
    it('gera uma instância por mês para uma recorrência no dia 31', () => {
      const datas = calcularInstanciasRecorrencia(data(2026, 1, 31), data(2026, 6, 30), 'MENSAL')
      expect(isos(datas)).toEqual([
        '2026-01-31',
        '2026-02-28',
        '2026-03-31',
        '2026-04-30',
        '2026-05-31',
        '2026-06-30',
      ])
    })

    it('gera exatamente 12 instâncias no rolling window para uma recorrência no dia 31', () => {
      const datas = calcularInstanciasRecorrencia(data(2026, 1, 31), data(2027, 1, 30), 'MENSAL')
      expect(datas).toHaveLength(12)
      // Um mês distinto por instância, sem repetir nem pular.
      expect(new Set(datas.map((d) => d.getMonth())).size).toBe(12)
    })
  })

  describe('frequência ANUAL', () => {
    it('gera uma instância por ano dentro da janela', () => {
      const datas = calcularInstanciasRecorrencia(data(2026, 7, 1), data(2029, 1, 1), 'ANUAL')
      expect(isos(datas)).toEqual(['2026-07-01', '2027-07-01', '2028-07-01'])
    })
  })

  describe('frequência PERSONALIZADA', () => {
    it('respeita intervalo em DIAS', () => {
      const datas = calcularInstanciasRecorrencia(
        data(2026, 1, 1),
        data(2026, 1, 20),
        'PERSONALIZADA',
        5,
        'DIAS'
      )
      expect(isos(datas)).toEqual(['2026-01-01', '2026-01-06', '2026-01-11', '2026-01-16'])
    })

    it('respeita intervalo em DIAS_UTEIS', () => {
      const datas = calcularInstanciasRecorrencia(
        data(2026, 1, 1),
        data(2026, 1, 15),
        'PERSONALIZADA',
        5,
        'DIAS_UTEIS'
      )
      expect(isos(datas)).toEqual(['2026-01-01', '2026-01-08', '2026-01-15'])
    })
  })

  describe('proteção contra loop infinito', () => {
    // ⚠️ Comportamento ATUAL: com PERSONALIZADA sem intervalo, `incrementarData`
    // devolve sempre a mesma data, o laço nunca ultrapassa o limite e só para no
    // teto de 1000 — gerando 1001 datas idênticas.
    it('para em 1001 instâncias quando o intervalo não avança a data', () => {
      const avisar = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const datas = calcularInstanciasRecorrencia(
        data(2026, 1, 1),
        data(2026, 12, 31),
        'PERSONALIZADA'
      )

      expect(datas).toHaveLength(1001)
      expect(new Set(isos(datas)).size).toBe(1) // todas iguais
      expect(avisar).toHaveBeenCalledOnce()
    })

    it('não dispara o aviso numa recorrência que avança normalmente', () => {
      const avisar = vi.spyOn(console, 'warn').mockImplementation(() => {})

      calcularInstanciasRecorrencia(data(2026, 1, 1), data(2026, 12, 31), 'MENSAL')

      expect(avisar).not.toHaveBeenCalled()
    })
  })
})
