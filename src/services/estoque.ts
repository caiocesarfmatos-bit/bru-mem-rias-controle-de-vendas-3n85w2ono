// src/services/estoque.ts
import pb from '@/lib/pocketbase/client'
import { MovimentoEstoque } from '@/types/sistema'

export async function listarMovimentosEstoque(produtoId?: string): Promise<MovimentoEstoque[]> {
  try {
    const filter = produtoId ? `produto = '${produtoId}'` : ''
    const records = await pb.collection('movimento_estoque').getFullList({
      filter: filter,
      sort: '-data_hora',
    })
    return records.map((r) => ({
      id: r.id,
      produto: r.getString('produto'),
      local: r.getString('local'),
      tipo: r.getString('tipo') as any,
      quantidade: r.getInt('quantidade'),
      custo_unitario_centavos: r.getInt('custo_unitario_centavos'),
      lote: r.getString('lote'),
      data_validade: r.getString('data_validade'),
      documento_origem_tipo: r.getString('documento_origem_tipo'),
      documento_origem_id: r.getString('documento_origem_id'),
      movimento_origem_estorno: r.getString('movimento_origem_estorno'),
      usuario: r.getString('usuario'),
      data_hora: r.getString('data_hora'),
      observacao: r.getString('observacao'),
    }))
  } catch (err) {
    console.error('Erro ao listar movimentos de estoque:', err)
    return []
  }
}

export async function lancarAjusteEstoque(dados: {
  produtoId: string
  localId: string
  quantidadeComSinal: number
  custoUnitarioCentavos: number
  justificativa: string
}): Promise<MovimentoEstoque> {
  if (!dados.justificativa || dados.justificativa.trim().length < 5) {
    throw new Error(
      'R1: Ajuste manual de estoque exige justificativa detalhada (mínimo 5 caracteres).',
    )
  }
  if (!pb.authStore.model?.id) {
    throw new Error('R1/R14: Usuário não autenticado.')
  }

  const rec = await pb.collection('movimento_estoque').create({
    produto: dados.produtoId,
    local: dados.localId,
    tipo: 'ajuste',
    quantidade: dados.quantidadeComSinal,
    custo_unitario_centavos: dados.custoUnitarioCentavos || 0,
    usuario: pb.authStore.model.id,
    data_hora: new Date().toISOString(),
    observacao: dados.justificativa.trim(),
  })

  return {
    id: rec.id,
    produto: rec.produto,
    local: rec.local,
    tipo: 'ajuste',
    quantidade: rec.quantidade,
    custo_unitario_centavos: rec.custo_unitario_centavos,
    usuario: rec.usuario,
    data_hora: rec.data_hora,
    observacao: rec.observacao,
  }
}
