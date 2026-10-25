// src/services/pedidos.ts
import pb from '@/lib/pocketbase/client'
import { PedidoVenda, ItemPedido, PagamentoPedido, FormaPagamentoCodigo } from '@/types/sistema'

export async function listarPedidos(): Promise<PedidoVenda[]> {
  try {
    const records = await pb.collection('pedidos_venda').getFullList({
      sort: '-data_emissao',
      expand: 'cliente,vendedor_responsavel',
    })

    const pedidos: PedidoVenda[] = []
    for (const r of records) {
      // Carregar itens
      let itens: ItemPedido[] = []
      try {
        const itensRec = await pb.collection('itens_pedido').getFullList({
          filter: `pedido = '${r.id}'`,
          expand: 'produto',
        })
        itens = itensRec.map((i) => ({
          id: i.id,
          pedido: r.id,
          produto: i.getString('produto'),
          local_estoque: i.getString('local_estoque'),
          quantidade: i.getInt('quantidade'),
          preco_unitario_praticado_centavos: i.getInt('preco_unitario_praticado_centavos'),
          custo_unitario_momento_centavos: i.getInt('custo_unitario_momento_centavos'),
          desconto_item_centavos: i.getInt('desconto_item_centavos'),
          total_item_centavos: i.getInt('total_item_centavos'),
          produto_expand: i.expand?.produto as any,
        }))
      } catch {
        /* intentionally ignored */
      }

      // Carregar pagamentos
      let pagamentos: PagamentoPedido[] = []
      try {
        const pagsRec = await pb.collection('pagamentos_pedido').getFullList({
          filter: `pedido = '${r.id}'`,
        })
        pagamentos = pagsRec.map((p) => ({
          id: p.id,
          pedido: r.id,
          forma_pagamento: p.getString('forma_pagamento') as FormaPagamentoCodigo,
          valor_centavos: p.getInt('valor_centavos'),
          quantidade_parcelas: p.getInt('quantidade_parcelas'),
          identificador_transacao: p.getString('identificador_transacao'),
          status: p.getString('status') as any,
          data_previsao: p.getString('data_previsao'),
          data_efetivacao: p.getString('data_efetivacao'),
          usuario: p.getString('usuario'),
        }))
      } catch {
        /* intentionally ignored */
      }

      pedidos.push({
        id: r.id,
        numero_sequencial: r.getInt('numero_sequencial'),
        cliente: r.getString('cliente'),
        data_emissao: r.getString('data_emissao'),
        vendedor_responsavel: r.getString('vendedor_responsavel'),
        status: r.getString('status') as any,
        subtotal_centavos: r.getInt('subtotal_centavos'),
        desconto_centavos: r.getInt('desconto_centavos'),
        acrescimo_centavos: r.getInt('acrescimo_centavos'),
        total_centavos: r.getInt('total_centavos'),
        observacao: r.getString('observacao'),
        usuario: r.getString('usuario'),
        itens: itens,
        pagamentos: pagamentos,
        cliente_expand: r.expand?.cliente as any,
      })
    }

    return pedidos
  } catch (err) {
    console.error('Erro ao listar pedidos:', err)
    return []
  }
}

export async function criarPedidoCompleto(dados: {
  clienteId: string
  itens: Array<{
    produtoId: string
    localEstoqueId: string
    quantidade: number
    precoUnitarioCentavos: number
    custoUnitarioCentavos: number
    descontoCentavos?: number
  }>
  pagamentos: Array<{
    formaPagamento: FormaPagamentoCodigo
    valorCentavos: number
    parcelas?: number
    identificadorTransacao?: string
    status?: 'pendente' | 'aprovado'
  }>
  descontoGeralCentavos?: number
  acrescimoCentavos?: number
  observacao?: string
  confirmarImediatamente?: boolean
}): Promise<{ pedidoId: string; numeroSequencial: number; status: string }> {
  if (!dados.clienteId) throw new Error('Cliente é obrigatório.')
  if (!dados.itens || dados.itens.length === 0)
    throw new Error('O pedido precisa ter ao menos 1 item.')
  if (!dados.pagamentos || dados.pagamentos.length === 0)
    throw new Error('Ao menos uma forma de pagamento é necessária.')

  // Calcular totais
  let subtotal = 0
  for (const item of dados.itens) {
    if (item.quantidade <= 0) throw new Error('Quantidade do item deve ser maior que zero.')
    if (item.precoUnitarioCentavos <= 0)
      throw new Error('R12: Preço unitário praticado deve ser maior que zero.')
    const totItem = item.quantidade * item.precoUnitarioCentavos - (item.descontoCentavos || 0)
    subtotal += totItem
  }

  const descontoGeral = dados.descontoGeralCentavos || 0
  const acrescimo = dados.acrescimoCentavos || 0
  const total = subtotal - descontoGeral + acrescimo

  // Validação R11: Soma dos pagamentos deve bater exatamente com total
  let somaPags = 0
  for (const p of dados.pagamentos) {
    somaPags += p.valorCentavos
  }

  if (somaPags !== total) {
    throw new Error(
      `R11: Fechamento de pagamento inválido. Soma dos pagamentos: R$ ${(somaPags / 100).toFixed(2)} | Total do pedido: R$ ${(total / 100).toFixed(2)}. Diferença de centavo bloqueia a criação.`,
    )
  }

  // Obter próximo número sequencial
  const ultimos = await pb.collection('pedidos_venda').getList(1, 1, { sort: '-numero_sequencial' })
  const proximoSeq = ultimos.items.length > 0 ? ultimos.items[0].getInt('numero_sequencial') + 1 : 1

  const userId = pb.authStore.model?.id || ''
  const hojeIso = new Date().toISOString()

  // 1. Criar cabeçalho do pedido (inicialmente rascunho)
  const pedidoRec = await pb.collection('pedidos_venda').create({
    numero_sequencial: proximoSeq,
    cliente: dados.clienteId,
    data_emissao: hojeIso,
    vendedor_responsavel: userId,
    status: 'rascunho',
    subtotal_centavos: subtotal,
    desconto_centavos: descontoGeral,
    acrescimo_centavos: acrescimo,
    total_centavos: total,
    observacao: dados.observacao || '',
    usuario: userId,
  })

  // 2. Gravar itens do pedido (R12)
  for (const item of dados.itens) {
    const totItem = item.quantidade * item.precoUnitarioCentavos - (item.descontoCentavos || 0)
    await pb.collection('itens_pedido').create({
      pedido: pedidoRec.id,
      produto: item.produtoId,
      local_estoque: item.localEstoqueId,
      quantidade: item.quantidade,
      preco_unitario_praticado_centavos: item.precoUnitarioCentavos,
      custo_unitario_momento_centavos: item.custoUnitarioCentavos,
      desconto_item_centavos: item.descontoCentavos || 0,
      total_item_centavos: totItem,
    })
  }

  // 3. Gravar pagamentos do pedido (R11)
  for (const p of dados.pagamentos) {
    await pb.collection('pagamentos_pedido').create({
      pedido: pedidoRec.id,
      forma_pagamento: p.formaPagamento,
      valor_centavos: p.valorCentavos,
      quantidade_parcelas: p.parcelas || 1,
      identificador_transacao: p.identificadorTransacao || '',
      status: p.status || 'aprovado',
      data_previsao: hojeIso,
      data_efetivacao: p.status === 'aprovado' ? hojeIso : '',
      usuario: userId,
    })
  }

  // 4. Se solicitado confirmar imediatamente, invocar rota transacional atômica
  if (dados.confirmarImediatamente) {
    const res = await pb.send('/backend/v1/transacoes/confirmar-venda', {
      method: 'POST',
      body: { pedidoId: pedidoRec.id },
    })
    return {
      pedidoId: pedidoRec.id,
      numeroSequencial: proximoSeq,
      status: 'confirmado',
    }
  }

  return {
    pedidoId: pedidoRec.id,
    numeroSequencial: proximoSeq,
    status: 'rascunho',
  }
}

export async function confirmarPedidoVenda(pedidoId: string): Promise<any> {
  return pb.send('/backend/v1/transacoes/confirmar-venda', {
    method: 'POST',
    body: { pedidoId },
  })
}

export async function cancelarPedidoVenda(pedidoId: string, motivo: string): Promise<any> {
  return pb.send('/backend/v1/transacoes/cancelar-venda', {
    method: 'POST',
    body: { pedidoId, motivo },
  })
}
