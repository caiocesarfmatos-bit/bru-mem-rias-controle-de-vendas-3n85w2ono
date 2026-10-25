// src/services/financeiro.ts
import pb from '@/lib/pocketbase/client'
import {
  ContaFinanceira,
  CategoriaFinanceira,
  LancamentoFinanceiro,
  TipoLancamentoFin,
  FormaPagamentoCodigo,
} from '@/types/sistema'

export async function listarContasFinanceiras(): Promise<ContaFinanceira[]> {
  try {
    const records = await pb.collection('contas_financeiras').getFullList({ sort: 'nome' })
    const contas: ContaFinanceira[] = []

    for (const r of records) {
      const saldoInicial = r.getInt('saldo_inicial_centavos')
      // Calcular saldo atual com base nos lançamentos realizados
      let saldo = saldoInicial
      try {
        const lancs = await pb.collection('lancamentos_financeiros').getFullList({
          filter: `conta_financeira = '${r.id}' && status = 'realizado'`,
        })
        for (const l of lancs) {
          const v = l.getInt('valor_centavos')
          if (l.getString('tipo') === 'entrada') saldo += v
          else if (l.getString('tipo') === 'saida') saldo -= v
        }
      } catch {
        /* intentionally ignored */
      }

      contas.push({
        id: r.id,
        nome: r.getString('nome'),
        tipo: r.getString('tipo') as any,
        saldo_inicial_centavos: saldoInicial,
        data_saldo_inicial: r.getString('data_saldo_inicial'),
        status: r.getString('status') as any,
        saldo_atual_centavos: saldo,
      })
    }
    return contas
  } catch (err) {
    console.error('Erro ao listar contas financeiras:', err)
    return []
  }
}

export async function listarCategoriasFinanceiras(): Promise<CategoriaFinanceira[]> {
  try {
    const records = await pb.collection('categorias_financeiras').getFullList({ sort: 'nome' })
    return records.map((r) => ({
      id: r.id,
      nome: r.getString('nome'),
      natureza: r.getString('natureza') as any,
    }))
  } catch (err) {
    console.error('Erro ao listar categorias financeiras:', err)
    return []
  }
}

export async function listarLancamentosFinanceiros(
  visao: 'todos' | 'realizado' | 'projetado' = 'todos',
): Promise<LancamentoFinanceiro[]> {
  try {
    let filter = ''
    if (visao === 'realizado') filter = "status = 'realizado'"
    if (visao === 'projetado') filter = "status = 'previsto'"

    const records = await pb.collection('lancamentos_financeiros').getFullList({
      filter,
      sort: '-data_competencia',
      expand: 'conta_financeira,categoria_financeira,parte_envolvida',
    })

    return records.map((r) => ({
      id: r.id,
      tipo: r.getString('tipo') as TipoLancamentoFin,
      valor_centavos: r.getInt('valor_centavos'),
      moeda: r.getString('moeda'),
      conta_financeira: r.getString('conta_financeira'),
      categoria_financeira: r.getString('categoria_financeira'),
      centro_custo: r.getString('centro_custo'),
      data_competencia: r.getString('data_competencia'),
      data_vencimento: r.getString('data_vencimento'),
      data_pagamento: r.getString('data_pagamento'),
      status: r.getString('status') as any,
      parte_envolvida: r.getString('parte_envolvida'),
      documento_origem_tipo: r.getString('documento_origem_tipo'),
      documento_origem_id: r.getString('documento_origem_id'),
      lancamento_origem_estorno: r.getString('lancamento_origem_estorno'),
      forma_pagamento: r.getString('forma_pagamento') as FormaPagamentoCodigo,
      chave_idempotencia: r.getString('chave_idempotencia'),
      usuario: r.getString('usuario'),
      observacao: r.getString('observacao'),
      conta_expand: r.expand?.conta_financeira as any,
      categoria_expand: r.expand?.categoria_financeira as any,
      parte_expand: r.expand?.parte_envolvida as any,
    }))
  } catch (err) {
    console.error('Erro ao listar lançamentos:', err)
    return []
  }
}

export async function criarLancamentoAvulso(dados: {
  tipo: TipoLancamentoFin
  valorCentavos: number
  contaId: string
  categoriaId: string
  dataCompetencia: string
  dataVencimento: string
  dataPagamento?: string
  status: 'previsto' | 'realizado'
  formaPagamento?: FormaPagamentoCodigo
  observacao?: string
}): Promise<LancamentoFinanceiro> {
  if (dados.valorCentavos <= 0) throw new Error('Valor deve ser maior que zero.')
  if (!dados.dataCompetencia)
    throw new Error('Data de competência é obrigatória (separada do pagamento).')

  const userId = pb.authStore.model?.id || ''
  const rec = await pb.collection('lancamentos_financeiros').create({
    tipo: dados.tipo,
    valor_centavos: Math.round(dados.valorCentavos),
    moeda: 'BRL',
    conta_financeira: dados.contaId,
    categoria_financeira: dados.categoriaId,
    data_competencia: dados.dataCompetencia,
    data_vencimento: dados.dataVencimento,
    data_pagamento: dados.dataPagamento || '',
    status: dados.status,
    documento_origem_tipo: 'avulso',
    forma_pagamento: dados.formaPagamento || 'PIX',
    chave_idempotencia: `AVULSO-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    usuario: userId,
    observacao: dados.observacao ? dados.observacao.trim() : 'Lançamento avulso',
  })

  return {
    id: rec.id,
    tipo: rec.tipo,
    valor_centavos: rec.valor_centavos,
    moeda: rec.moeda,
    conta_financeira: rec.conta_financeira,
    categoria_financeira: rec.categoria_financeira,
    data_competencia: rec.data_competencia,
    data_vencimento: rec.data_vencimento,
    status: rec.status,
    usuario: rec.usuario,
  }
}
