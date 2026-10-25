import {
  IntervaloDatas,
  PeriodoRelatorioTipo,
  ResumoPeriodoKPIs,
  deYmd,
  paraYmd,
} from '@/lib/relatoriosUtils'
import { MetaVendas, PeriodoMetaTipo } from '@/types/app'

export type RitmoStatus = 'no_ritmo' | 'a_frente' | 'atrasado' | 'concluido' | 'nao_aplicavel'

export interface ItemProgressoMeta {
  tipo: 'receita' | 'lucro' | 'quantidade'
  titulo: string
  meta: number
  realizado: number
  percentual: number // 0 a 100+ (ex: 85.5)
  atingida: boolean
  diferenca: number // realizado - meta (negativo se falta, positivo se superou)
  textoAmigavel: string
  // Ritmo e projeção linear
  projecaoLinear?: number // valor projetado até o fim do período
  ritmoStatus: RitmoStatus
  ritmoTexto: string
}

export interface AnaliseMetaPeriodo {
  metaOrigem?: MetaVendas
  tipoPeriodoAplicado: PeriodoMetaTipo
  periodoFinalizado: boolean
  diasTotaisPeriodo: number
  diasDecorridos: number
  fracaoTempoDecorrido: number // 0 a 1
  itens: ItemProgressoMeta[]
  temAlgumaMetaDefinida: boolean
}

/**
 * Seleciona a meta mais apropriada para o período de visualização ativo.
 * - '7d': usa meta 'semanal' se houver, ou proporcionaliza / usa a mensal.
 * - 'hoje': usa a semanal ou diária proporcional.
 * - 'mes_atual', 'mes_anterior': usa meta 'mensal' prioritariamente.
 * - 'ano_atual', 'ano_anterior': calcula proporcional anual a partir da mensal (* 12).
 * - 'personalizado': seleciona por duração do intervalo.
 */
export function selecionarMetaParaPeriodo(
  metas: MetaVendas[],
  periodoTipo: PeriodoRelatorioTipo,
  intervalo: IntervaloDatas,
): { metaCalculada: MetaVendas | null; tipoBase: PeriodoMetaTipo } {
  if (!metas || metas.length === 0) {
    return { metaCalculada: null, tipoBase: 'mensal' }
  }

  const metaMensal = metas.find((m) => m.periodType === 'mensal')
  const metaSemanal = metas.find((m) => m.periodType === 'semanal')

  // Se período for 7d ou hoje, preferir semanal
  if (periodoTipo === '7d' || periodoTipo === 'hoje') {
    if (metaSemanal) {
      if (periodoTipo === 'hoje') {
        // Meta de hoje = meta semanal / 7
        return {
          metaCalculada: {
            id: 'meta-hoje-proporcional',
            periodType: 'semanal',
            metaReceita: metaSemanal.metaReceita ? metaSemanal.metaReceita / 7 : undefined,
            metaLucro: metaSemanal.metaLucro ? metaSemanal.metaLucro / 7 : undefined,
            metaQuantidade: metaSemanal.metaQuantidade
              ? Math.max(1, Math.round(metaSemanal.metaQuantidade / 7))
              : undefined,
            criadoEm: metaSemanal.criadoEm,
          },
          tipoBase: 'semanal',
        }
      }
      return { metaCalculada: metaSemanal, tipoBase: 'semanal' }
    }
    // Se não tem semanal mas tem mensal, adapta a mensal para 7 dias (~1/4 do mês)
    if (metaMensal) {
      const fatorSemana = 7 / 30
      return {
        metaCalculada: {
          id: 'meta-semanal-derivada',
          periodType: 'semanal',
          metaReceita: metaMensal.metaReceita ? metaMensal.metaReceita * fatorSemana : undefined,
          metaLucro: metaMensal.metaLucro ? metaMensal.metaLucro * fatorSemana : undefined,
          metaQuantidade: metaMensal.metaQuantidade
            ? Math.max(1, Math.round(metaMensal.metaQuantidade * fatorSemana))
            : undefined,
          criadoEm: metaMensal.criadoEm,
        },
        tipoBase: 'semanal',
      }
    }
  }

  // Períodos anuais
  if (periodoTipo === 'ano_atual' || periodoTipo === 'ano_anterior') {
    const base = metaMensal || metaSemanal
    if (base) {
      const fator = metaMensal ? 12 : 52
      return {
        metaCalculada: {
          id: 'meta-anual-derivada',
          periodType: 'mensal',
          metaReceita: base.metaReceita ? base.metaReceita * fator : undefined,
          metaLucro: base.metaLucro ? base.metaLucro * fator : undefined,
          metaQuantidade: base.metaQuantidade ? Math.round(base.metaQuantidade * fator) : undefined,
          criadoEm: base.criadoEm,
        },
        tipoBase: 'mensal',
      }
    }
  }

  // Períodos personalizados: se intervalo for <= 10 dias, prefere semanal proporcional
  if (periodoTipo === 'personalizado') {
    const dIni = deYmd(intervalo.inicio)
    const dFim = deYmd(intervalo.fim)
    const dias = Math.max(
      1,
      Math.round((dFim.getTime() - dIni.getTime()) / (1000 * 60 * 60 * 24)) + 1,
    )
    if (dias <= 10 && metaSemanal) {
      const fator = dias / 7
      return {
        metaCalculada: {
          id: 'meta-custom-semanal',
          periodType: 'semanal',
          metaReceita: metaSemanal.metaReceita ? metaSemanal.metaReceita * fator : undefined,
          metaLucro: metaSemanal.metaLucro ? metaSemanal.metaLucro * fator : undefined,
          metaQuantidade: metaSemanal.metaQuantidade
            ? Math.round(metaSemanal.metaQuantidade * fator)
            : undefined,
          criadoEm: metaSemanal.criadoEm,
        },
        tipoBase: 'semanal',
      }
    }
    // Proporcional da mensal para N dias
    const base = metaMensal || metaSemanal
    if (base) {
      const diasBase = base.periodType === 'mensal' ? 30 : 7
      const fator = dias / diasBase
      return {
        metaCalculada: {
          id: 'meta-custom-proporcional',
          periodType: base.periodType,
          metaReceita: base.metaReceita ? base.metaReceita * fator : undefined,
          metaLucro: base.metaLucro ? base.metaLucro * fator : undefined,
          metaQuantidade: base.metaQuantidade ? Math.round(base.metaQuantidade * fator) : undefined,
          criadoEm: base.criadoEm,
        },
        tipoBase: base.periodType,
      }
    }
  }

  // Padrão: mensal (ex: 'mes_atual', 'mes_anterior' ou default)
  if (metaMensal) {
    return { metaCalculada: metaMensal, tipoBase: 'mensal' }
  }
  if (metaSemanal) {
    // Escala semanal para mensal (~4.3 semanas)
    return {
      metaCalculada: {
        id: 'meta-mensal-derivada',
        periodType: 'mensal',
        metaReceita: metaSemanal.metaReceita ? metaSemanal.metaReceita * (30 / 7) : undefined,
        metaLucro: metaSemanal.metaLucro ? metaSemanal.metaLucro * (30 / 7) : undefined,
        metaQuantidade: metaSemanal.metaQuantidade
          ? Math.round(metaSemanal.metaQuantidade * (30 / 7))
          : undefined,
        criadoEm: metaSemanal.criadoEm,
      },
      tipoBase: 'mensal',
    }
  }

  return { metaCalculada: metas[0] || null, tipoBase: metas[0]?.periodType || 'mensal' }
}

/**
 * Calcula o progresso, ritmo e projeção linear de cada meta comparado aos KPIs consolidados
 */
export function calcularProgressoMetas(
  meta: MetaVendas | null,
  kpis: ResumoPeriodoKPIs,
  intervalo: IntervaloDatas,
): AnaliseMetaPeriodo {
  const agora = new Date()
  const hojeYmd = paraYmd(agora)

  const dIni = deYmd(intervalo.inicio)
  const dFim = deYmd(intervalo.fim)
  const dHoje = deYmd(hojeYmd)

  const diasTotaisPeriodo = Math.max(
    1,
    Math.round((dFim.getTime() - dIni.getTime()) / (1000 * 60 * 60 * 24)) + 1,
  )

  // Período já terminou?
  const periodoFinalizado = hojeYmd > intervalo.fim

  // Período totalmente no futuro?
  const periodoNoFuturo = hojeYmd < intervalo.inicio

  let diasDecorridos = diasTotaisPeriodo
  if (periodoFinalizado) {
    diasDecorridos = diasTotaisPeriodo
  } else if (periodoNoFuturo) {
    diasDecorridos = 0
  } else {
    // Intervalo engloba hoje: quantos dias já se passaram desde o início até hoje?
    const diffAteHoje = Math.round((dHoje.getTime() - dIni.getTime()) / (1000 * 60 * 60 * 24)) + 1
    diasDecorridos = Math.min(diasTotaisPeriodo, Math.max(1, diffAteHoje))
  }

  const fracaoTempoDecorrido = Math.min(1, Math.max(0, diasDecorridos / diasTotaisPeriodo))

  const itens: ItemProgressoMeta[] = []

  const formatarDiferencaMoeda = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
      Math.abs(val),
    )
  }

  const calcularItem = (
    tipo: 'receita' | 'lucro' | 'quantidade',
    titulo: string,
    metaValor: number | undefined,
    realizadoValor: number,
  ) => {
    if (metaValor === undefined || metaValor <= 0) return

    const percentual = Number(((realizadoValor / metaValor) * 100).toFixed(1))
    const atingida = realizadoValor >= metaValor
    const diferenca = realizadoValor - metaValor

    let textoAmigavel = ''
    if (atingida) {
      if (diferenca === 0) {
        textoAmigavel = 'Meta batida! 🎉'
      } else {
        const extraStr =
          tipo === 'quantidade'
            ? `${Math.round(diferenca)} ímãs a mais`
            : `${formatarDiferencaMoeda(diferenca)} a mais`
        textoAmigavel = `Meta batida com folga! 🎉 (+${extraStr})`
      }
    } else {
      const faltaStr =
        tipo === 'quantidade'
          ? `${Math.max(1, Math.round(Math.abs(diferenca)))} ímãs`
          : formatarDiferencaMoeda(diferenca)
      textoAmigavel = `Falta ${faltaStr} para bater a meta`
    }

    // Ritmo e Projeção Linear
    let ritmoStatus: RitmoStatus = 'nao_aplicavel'
    let ritmoTexto = ''
    let projecaoLinear: number | undefined = undefined

    if (periodoFinalizado) {
      ritmoStatus = 'concluido'
      if (atingida) {
        ritmoTexto = `Período encerrado • Atingiu ${percentual.toFixed(0)}% da meta`
      } else {
        ritmoTexto = `Período encerrado • Atingiu ${percentual.toFixed(0)}% da meta (não batida)`
      }
    } else if (periodoNoFuturo) {
      ritmoStatus = 'nao_aplicavel'
      ritmoTexto = 'Período futuro ainda não iniciado'
    } else {
      // Período em andamento
      if (atingida) {
        ritmoStatus = 'a_frente'
        ritmoTexto = 'Meta já atingida com antecedência! 🚀'
      } else {
        // Média diária até hoje * total de dias do período
        const mediaDiaria = realizadoValor / Math.max(1, diasDecorridos)
        projecaoLinear = Number(
          (mediaDiaria * diasTotaisPeriodo).toFixed(tipo === 'quantidade' ? 0 : 2),
        )

        // Esperado pelo tempo decorrido
        const esperadoAteAgora = metaValor * fracaoTempoDecorrido
        // Tolerância de 5%
        const margemTolerancia = metaValor * 0.05

        if (realizadoValor >= esperadoAteAgora - margemTolerancia) {
          if (realizadoValor >= esperadoAteAgora + margemTolerancia) {
            ritmoStatus = 'a_frente'
            ritmoTexto = 'À frente do ritmo previsto ⚡'
          } else {
            ritmoStatus = 'no_ritmo'
            ritmoTexto = 'No ritmo esperado para o período 🎯'
          }
        } else {
          ritmoStatus = 'atrasado'
          ritmoTexto = 'Abaixo do ritmo estimado ⏳'
        }
      }
    }

    itens.push({
      tipo,
      titulo,
      meta: metaValor,
      realizado: realizadoValor,
      percentual,
      atingida,
      diferenca,
      textoAmigavel,
      projecaoLinear,
      ritmoStatus,
      ritmoTexto,
    })
  }

  if (meta) {
    calcularItem('receita', 'Meta de Receita', meta.metaReceita, kpis.receitaTotal.atual)
    calcularItem('lucro', 'Meta de Lucro Líquido', meta.metaLucro, kpis.lucroTotal.atual)
    calcularItem(
      'quantidade',
      'Meta de Ímãs Vendidos',
      meta.metaQuantidade,
      kpis.quantidadeTotal.atual,
    )
  }

  return {
    metaOrigem: meta || undefined,
    tipoPeriodoAplicado: meta?.periodType || 'mensal',
    periodoFinalizado,
    diasTotaisPeriodo,
    diasDecorridos,
    fracaoTempoDecorrido,
    itens,
    temAlgumaMetaDefinida: itens.length > 0,
  }
}
