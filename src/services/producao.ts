// src/services/producao.ts
// Gestão de Matéria-Prima, Insumos, Fichas de Composição e Calculadora de Produção

import pb from '@/lib/pocketbase/client'

export interface InsumoProducao {
  id: string
  codigo: string
  nome: string
  categoria?: string
  unidade_medida: string // folha, un, ml, metro, g
  custo_unitario_centavos: number
  estoque_atual: number
  estoque_minimo?: number
  fornecedor_nome?: string
  observacao?: string
  created?: string
  updated?: string
}

export interface FichaProducao {
  id: string
  produto: string // ID do produto
  insumo: string // ID do insumo
  quantidade_insumo: number // Ex: 1 folha
  rendimento_produtos: number // Ex: rende 12 ímãs
  perda_estimada_pct?: number // Ex: 5%
  instrucoes?: string
  expand?: {
    produto?: { id: string; nome: string; sku: string }
    insumo?: InsumoProducao
  }
}

export interface ItemCalculadoProducao {
  insumoId: string
  insumoNome: string
  insumoCodigo: string
  unidadeMedida: string
  consumoNecessario: number
  consumoComPerda: number
  custoUnitarioCentavos: number
  custoTotalItemCentavos: number
  estoqueAtual: number
  saldoAposProducao: number
  estoqueSuficiente: boolean
}

export interface ResultadoCalculoProducao {
  quantidadeDesejada: number
  produtoId: string
  produtoNome: string
  itens: ItemCalculadoProducao[]
  custoTotalInsumosCentavos: number
  custoUnitarioPorProdutoCentavos: number
  precoVendaUnitarioSugeridoCentavos: number
  margemBrutaUnitarioCentavos: number
  margemBrutaPct: number
  todosInsumosDisponiveis: boolean
}

/**
 * Listar todos os insumos cadastrados
 */
export async function listarInsumosProducao(): Promise<InsumoProducao[]> {
  try {
    const records = await pb.collection('insumos_producao').getFullList<InsumoProducao>({
      sort: 'nome',
    })
    return records
  } catch (err) {
    console.warn('Aviso ao listar insumos de produção:', err)
    return []
  }
}

/**
 * Criar ou atualizar insumo
 */
export async function salvarInsumoProducao(
  dados: Partial<InsumoProducao>,
): Promise<InsumoProducao> {
  if (dados.id) {
    return await pb.collection('insumos_producao').update<InsumoProducao>(dados.id, dados)
  }
  return await pb.collection('insumos_producao').create<InsumoProducao>(dados)
}

/**
 * Listar fichas técnicas com insumo expandido
 */
export async function listarFichasProducao(produtoId?: string): Promise<FichaProducao[]> {
  const filter = produtoId ? `produto = '${produtoId}'` : ''
  try {
    const records = await pb.collection('fichas_producao').getFullList<FichaProducao>({
      filter,
      expand: 'insumo,produto',
      sort: 'created',
    })
    return records
  } catch (err) {
    console.warn('Aviso ao listar fichas técnicas:', err)
    return []
  }
}

/**
 * Salvar item de ficha técnica
 */
export async function salvarFichaProducao(dados: Partial<FichaProducao>): Promise<FichaProducao> {
  if (dados.id) {
    return await pb.collection('fichas_producao').update<FichaProducao>(dados.id, dados)
  }
  return await pb.collection('fichas_producao').create<FichaProducao>(dados)
}

/**
 * CALCULADORA OPERACIONAL DE PRODUÇÃO:
 * "Quero produzir N unidades" -> calcula consumo de cada insumo, custo total, custo unitário e margem.
 */
export function calcularConsumoProducao(
  quantidadeDesejada: number,
  fichas: FichaProducao[],
  insumos: InsumoProducao[],
  precoVendaUnitarioCentavos: number = 450,
): ResultadoCalculoProducao {
  const itens: ItemCalculadoProducao[] = []
  let custoTotalCentavos = 0
  let todosDisponiveis = true

  const mapaInsumos = new Map<string, InsumoProducao>()
  for (const ins of insumos) {
    mapaInsumos.set(ins.id, ins)
  }

  for (const f of fichas) {
    const insumo = f.expand?.insumo || mapaInsumos.get(f.insumo)
    if (!insumo) continue

    const rendimento = f.rendimento_produtos > 0 ? f.rendimento_produtos : 1
    const qtdPorProduto = f.quantidade_insumo / rendimento
    const perdaPct = (f.perda_estimada_pct || 0) / 100

    // Consumo bruto necessário
    const consumoNecessario = quantidadeDesejada * qtdPorProduto
    // Consumo ajustado por fator de perda operacional
    const consumoComPerda = consumoNecessario * (1 + perdaPct)

    // Custo total desse insumo para a batelada
    const custoItemTotal = Math.round(consumoComPerda * insumo.custo_unitario_centavos)
    custoTotalCentavos += custoItemTotal

    const saldoApos = insumo.estoque_atual - consumoComPerda
    const suficiente = saldoApos >= 0
    if (!suficiente) todosDisponiveis = false

    itens.push({
      insumoId: insumo.id,
      insumoNome: insumo.nome,
      insumoCodigo: insumo.codigo,
      unidadeMedida: insumo.unidade_medida,
      consumoNecessario: Number(consumoNecessario.toFixed(2)),
      consumoComPerda: Number(consumoComPerda.toFixed(2)),
      custoUnitarioCentavos: insumo.custo_unitario_centavos,
      custoTotalItemCentavos: custoItemTotal,
      estoqueAtual: insumo.estoque_atual,
      saldoAposProducao: Number(saldoApos.toFixed(2)),
      estoqueSuficiente: suficiente,
    })
  }

  const custoUnitarioCentavos =
    quantidadeDesejada > 0 ? Math.round(custoTotalCentavos / quantidadeDesejada) : 0
  const margemBrutaUnitario = precoVendaUnitarioCentavos - custoUnitarioCentavos
  const margemBrutaPct =
    precoVendaUnitarioCentavos > 0
      ? Number(((margemBrutaUnitario / precoVendaUnitarioCentavos) * 100).toFixed(1))
      : 0

  return {
    quantidadeDesejada,
    produtoId: fichas[0]?.produto || '',
    produtoNome: fichas[0]?.expand?.produto?.nome || 'Ímã Polaroid 5x5 cm',
    itens,
    custoTotalInsumosCentavos: custoTotalCentavos,
    custoUnitarioPorProdutoCentavos: custoUnitarioCentavos,
    precoVendaUnitarioSugeridoCentavos: precoVendaUnitarioCentavos,
    margemBrutaUnitarioCentavos: margemBrutaUnitario,
    margemBrutaPct,
    todosInsumosDisponiveis: todosDisponiveis,
  }
}
