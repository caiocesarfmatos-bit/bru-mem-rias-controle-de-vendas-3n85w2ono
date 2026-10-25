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
      let itens: (ItemPedido & { tipo_item?: string; modelo_item?: string; foto_item?: string })[] =
        []
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
          tipo_item: i.getString('tipo_item'),
          modelo_item: i.getString('modelo_item'),
          foto_item: i.getString('foto_item'),
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
        prazo_entrega_dias: r.getInt('prazo_entrega_dias'),
        data_limite_entrega: r.getString('data_limite_entrega'),
        endereco_entrega_texto: r.getString('endereco_entrega_texto'),
        foto_referencia: r.getString('foto_referencia'),
        itens: itens as any,
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
    tipoItem?: string
    modeloItem?: string
    fotoItem?: string
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
  snapshotFrete?: any
  observacao?: string
  prazoEntregaDias?: number
  dataLimiteEntrega?: string
  enderecoEntregaTexto?: string
  fotoReferencia?: string
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

  // Monta snapshot de frete na observação oficial se informado
  let obsFinal = dados.observacao ? dados.observacao.trim() : ''
  if (dados.snapshotFrete) {
    const s = dados.snapshotFrete
    const tagFrete = `[FRETE: ${s.nome_opcao || s.modalidade} | R$ ${((s.preco_centavos || 0) / 100).toFixed(2)} | CEP: ${s.cep_destino || '-'} | Prazo: ${s.prazo_dias_estimado || 0}d${s.is_excecao_manual ? ` | EXCEÇÃO MANUAL: ${s.justificativa_excecao || 'Justificado'}` : ''}]`
    obsFinal = obsFinal ? `${obsFinal} • ${tagFrete}` : tagFrete
  }

  // 1. Criar cabeçalho do pedido (inicialmente rascunho)
  const pedidoRec = await pb.collection('pedidos_venda').create({
    numero_sequencial: proximoSeq,
    cliente: dados.clienteId,
    data_emissao: hojeIso,
    vendedor_responsavel: userId,
    status: 'rascunho',
    subtotal_centavos: Math.round(subtotal),
    desconto_centavos: Math.round(descontoGeral),
    acrescimo_centavos: Math.round(acrescimo),
    total_centavos: Math.round(total),
    observacao: obsFinal,
    prazo_entrega_dias: dados.prazoEntregaDias || 0,
    data_limite_entrega: dados.dataLimiteEntrega || null,
    endereco_entrega_texto: dados.enderecoEntregaTexto || '',
    foto_referencia: dados.fotoReferencia || '',
    usuario: userId,
  })

  // 2. Gravar itens do pedido com tipo e modelo (R12)
  for (const item of dados.itens) {
    const totItem = item.quantidade * item.precoUnitarioCentavos - (item.descontoCentavos || 0)
    await pb.collection('itens_pedido').create({
      pedido: pedidoRec.id,
      produto: item.produtoId,
      local_estoque: item.localEstoqueId,
      quantidade: Math.round(item.quantidade),
      preco_unitario_praticado_centavos: Math.round(item.precoUnitarioCentavos),
      custo_unitario_momento_centavos: Math.round(item.custoUnitarioCentavos),
      desconto_item_centavos: Math.round(item.descontoCentavos || 0),
      total_item_centavos: Math.round(totItem),
      tipo_item: item.tipoItem || '',
      modelo_item: item.modeloItem || '',
      foto_item: item.fotoItem || '',
    })
  }

  // 3. Gravar pagamentos do pedido (R11)
  for (const p of dados.pagamentos) {
    await pb.collection('pagamentos_pedido').create({
      pedido: pedidoRec.id,
      forma_pagamento: p.formaPagamento,
      valor_centavos: Math.round(p.valorCentavos),
      quantidade_parcelas: Math.max(1, Math.round(p.parcelas || 1)),
      identificador_transacao: p.identificadorTransacao ? p.identificadorTransacao.trim() : '',
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
