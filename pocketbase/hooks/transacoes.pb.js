// pocketbase/hooks/transacoes.pb.js
// Endpoints e validações server-side para integridade transacional, imutabilidade e auditoria

// 1. Auditoria e Imutabilidade Server-side
// Garantir R1: nenhum movimento de estoque sem documento ou justificativa com autor
onRecordCreate((e) => {
  const tipo = e.record.getString('tipo')
  const docTipo = e.record.getString('documento_origem_tipo')
  const obs = e.record.getString('observacao')
  const usuario = e.record.getString('usuario')

  if (!usuario) {
    throw new BadRequestError('R1: Movimento de estoque exige usuário autor registrado.')
  }

  if (tipo === 'ajuste') {
    if (!obs || obs.trim().length < 5) {
      throw new BadRequestError(
        'R1: Ajuste manual de estoque exige justificativa detalhada (mínimo 5 caracteres).',
      )
    }
  } else if (!docTipo || docTipo.trim().length === 0) {
    throw new BadRequestError(
      'R1: Movimento de estoque não-ajuste exige documento de origem preenchido.',
    )
  }

  // Registrar auditoria imutável do movimento de estoque
  try {
    const auditCol = $app.findCollectionByNameOrId('logs_auditoria')
    const recAudit = new Record(auditCol)
    recAudit.set('entidade', 'movimento_estoque')
    recAudit.set('identificador_registro', e.record.id || 'novo')
    recAudit.set('campo', 'REGISTRO_COMPLETO')
    recAudit.set(
      'valor_novo',
      JSON.stringify({
        produto: e.record.getString('produto'),
        local: e.record.getString('local'),
        tipo: tipo,
        quantidade: e.record.getInt('quantidade'),
        custo_unitario_centavos: e.record.getInt('custo_unitario_centavos'),
        documento_origem_tipo: docTipo,
        documento_origem_id: e.record.getString('documento_origem_id'),
      }),
    )
    recAudit.set('usuario', usuario)
    recAudit.set('data_hora', new Date().toISOString())
    recAudit.set('origem', 'transacao_hook')
    $app.save(recAudit)
  } catch (err) {
    console.error('Falha ao gravar auditoria do movimento de estoque:', err)
  }

  e.next()
}, 'movimento_estoque')

// R4: Não existe mais de um preço vigente para o mesmo produto na mesma tabela
onRecordCreate((e) => {
  const produto = e.record.getString('produto')
  const tabela = e.record.getString('tabela_preco')
  const fim = e.record.getString('data_fim_vigencia')

  if (!fim || fim.trim() === '') {
    // Busca se já existe outro vigente
    const registros = $app.findRecordsByFilter(
      'precos_produto',
      `produto = '${produto}' && tabela_preco = '${tabela}' && data_fim_vigencia = ''`,
    )
    if (registros && registros.length > 0) {
      throw new BadRequestError(
        'R4: Já existe um preço vigente para este produto nesta tabela. Encerre o vigente anterior antes de cadastrar um novo.',
      )
    }
  }

  e.next()
}, 'precos_produto')

// R12: Todo item de pedido gravado possui preço unitário e custo unitário preenchidos
onRecordCreate((e) => {
  const preco = e.record.getInt('preco_unitario_praticado_centavos')
  const custo = e.record.getInt('custo_unitario_momento_centavos')
  const qtd = e.record.getInt('quantidade')

  if (qtd <= 0) {
    throw new BadRequestError('Quantidade do item de pedido deve ser maior que zero.')
  }
  if (preco <= 0) {
    throw new BadRequestError('R12: Preço unitário praticado deve ser informado e maior que zero.')
  }
  if (custo < 0) {
    throw new BadRequestError('R12: Custo unitário do momento deve ser informado (não negativo).')
  }

  e.next()
}, 'itens_pedido')

// R10: Validações de formato em pessoas (documento)
onRecordCreate((e) => {
  const doc = e.record.getString('documento')
  const tipo = e.record.getString('tipo_pessoa')

  // Remove caracteres não numéricos
  const limpo = doc.replace(/\D/g, '')
  if (tipo === 'FISICA' && limpo.length !== 11) {
    throw new BadRequestError('R10: CPF deve conter exatamente 11 dígitos numéricos.')
  }
  if (tipo === 'JURIDICA' && limpo.length !== 14) {
    throw new BadRequestError('R10: CNPJ deve conter exatamente 14 dígitos numéricos.')
  }
  e.record.set('documento', limpo)

  e.next()
}, 'pessoas')

// R10: Validação de CEP em endereços
onRecordCreate((e) => {
  const cep = e.record.getString('cep')
  const limpo = (cep || '').replace(/\D/g, '')
  if (limpo.length !== 8) {
    throw new BadRequestError('R10: CEP deve conter exatamente 8 dígitos numéricos.')
  }
  e.record.set('cep', limpo)
  e.next()
}, 'enderecos')

// R10: Validação de Contatos (Nome obrigatório se for papel recado)
onRecordCreate((e) => {
  const papel = e.record.getString('papel')
  const nome = e.record.getString('nome_contato')
  if (papel === 'recado' && (!nome || nome.trim().length < 2)) {
    throw new BadRequestError(
      "R10: Contato do papel 'recado' exige nome próprio do destinatário do recado.",
    )
  }
  e.next()
}, 'contatos')

// 2. Rota Transacional Server-Side: Confirmar Pedido de Venda
// POST /backend/v1/transacoes/confirmar-venda
routerAdd('POST', '/backend/v1/transacoes/confirmar-venda', (c) => {
  const correlationId =
    'TX-CONFIRM-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7)
  const auth = c.auth
  if (!auth) {
    return c.json(401, {
      correlationId: correlationId,
      erro: 'R14: Autenticação exigida para confirmar venda.',
    })
  }

  const body = c.requestInfo().body || {}
  const pedidoId = body.pedidoId

  if (!pedidoId) {
    return c.json(400, { correlationId: correlationId, erro: 'ID do pedido não informado.' })
  }

  try {
    $app.runInTransaction((txApp) => {
      // 1. Carrega o pedido
      const pedido = txApp.findRecordById('pedidos_venda', pedidoId)
      if (pedido.getString('status') !== 'rascunho') {
        throw new BadRequestError('Apenas pedidos em rascunho podem ser confirmados.')
      }

      // 2. Carrega itens do pedido
      const itens = txApp.findRecordsByFilter('itens_pedido', `pedido = '${pedidoId}'`)
      if (!itens || itens.length === 0) {
        throw new BadRequestError('O pedido não possui itens cadastrados.')
      }

      // 3. Validação R11: Fechamento exato de pagamentos
      const pagamentos = txApp.findRecordsByFilter('pagamentos_pedido', `pedido = '${pedidoId}'`)
      if (!pagamentos || pagamentos.length === 0) {
        throw new BadRequestError('R11: Nenhuma forma de pagamento vinculada ao pedido.')
      }

      let somaPagamentos = 0
      for (let i = 0; i < pagamentos.length; i++) {
        somaPagamentos += pagamentos[i].getInt('valor_centavos')
      }

      const totalPedido = pedido.getInt('total_centavos')
      if (somaPagamentos !== totalPedido) {
        throw new BadRequestError(
          `R11: A soma dos pagamentos (R$ ${(somaPagamentos / 100).toFixed(2)}) diverge do total do pedido (R$ ${(totalPedido / 100).toFixed(2)}). Tolerância zero.`,
        )
      }

      // 4. Verificação de estoque disponível e baixa de estoque (R7, R9)
      const movEstoqueCol = txApp.findCollectionByNameOrId('movimento_estoque')
      for (let i = 0; i < itens.length; i++) {
        const item = itens[i]
        const prodId = item.getString('produto')
        const localId = item.getString('local_estoque')
        const qtdItem = item.getInt('quantidade')

        // Calcula saldo atual deste produto neste local
        const historico = txApp.findRecordsByFilter(
          'movimento_estoque',
          `produto = '${prodId}' && local = '${localId}'`,
        )
        let saldoAtual = 0
        for (let h = 0; h < historico.length; h++) {
          saldoAtual += historico[h].getInt('quantidade')
        }

        if (saldoAtual < qtdItem) {
          throw new BadRequestError(
            `R7: Saldo insuficiente em estoque para o produto (Saldo: ${saldoAtual}, Solicitado: ${qtdItem}). Bloqueio de estoque negativo ativo.`,
          )
        }

        // Grava movimento de saída imutável
        const recMov = new Record(movEstoqueCol)
        recMov.set('produto', prodId)
        recMov.set('local', localId)
        recMov.set('tipo', 'saida')
        recMov.set('quantidade', -qtdItem)
        recMov.set('custo_unitario_centavos', item.getInt('custo_unitario_momento_centavos'))
        recMov.set('documento_origem_tipo', 'pedido_venda')
        recMov.set('documento_origem_id', pedidoId)
        recMov.set('usuario', auth.id)
        recMov.set('data_hora', new Date().toISOString())
        recMov.set(
          'observacao',
          `Baixa automática referente ao Pedido #${pedido.getInt('numero_sequencial')}`,
        )
        txApp.save(recMov)
      }

      // 5. Geração de Lançamentos Financeiros por pagamento
      const lancFinCol = txApp.findCollectionByNameOrId('lancamentos_financeiros')
      // Pega conta padrão (Caixa ou Banco)
      const contas = txApp.findRecordsByFilter(
        'contas_financeiras',
        "status = 'ativo'",
        'created',
        1,
      )
      const contaId = contas.length > 0 ? contas[0].id : ''
      const catVendas = txApp.findRecordsByFilter(
        'categorias_financeiras',
        "natureza = 'receita'",
        'created',
        1,
      )
      const catId = catVendas.length > 0 ? catVendas[0].id : ''

      const hojeIso = new Date().toISOString()

      for (let p = 0; p < pagamentos.length; p++) {
        const pag = pagamentos[p]
        const recLanc = new Record(lancFinCol)
        recLanc.set('tipo', 'entrada')
        recLanc.set('valor_centavos', pag.getInt('valor_centavos'))
        recLanc.set('moeda', 'BRL')
        recLanc.set('conta_financeira', contaId)
        recLanc.set('categoria_financeira', catId)
        recLanc.set('data_competencia', pedido.getString('data_emissao') || hojeIso)
        recLanc.set('data_vencimento', pag.getString('data_previsao') || hojeIso)

        // Se a forma for PIX, DINHEIRO ou DEBITO, já entra como realizado se aprovado
        const forma = pag.getString('forma_pagamento')
        const statusPag = pag.getString('status')
        if (statusPag === 'aprovado') {
          recLanc.set('data_pagamento', pag.getString('data_efetivacao') || hojeIso)
          recLanc.set('status', 'realizado')
        } else {
          recLanc.set('status', 'previsto')
        }

        recLanc.set('parte_envolvida', pedido.getString('cliente'))
        recLanc.set('documento_origem_tipo', 'pedido_venda')
        recLanc.set('documento_origem_id', pedidoId)
        recLanc.set('forma_pagamento', forma)
        recLanc.set('chave_idempotencia', `LANC-PED-${pedidoId}-${pag.id}`)
        recLanc.set('usuario', auth.id)
        recLanc.set(
          'observacao',
          `Recebimento Pedido #${pedido.getInt('numero_sequencial')} (${forma})`,
        )
        txApp.save(recLanc)
      }

      // 6. Atualiza status do pedido para confirmado
      pedido.set('status', 'confirmado')
      txApp.save(pedido)

      // 7. Auditoria imutável
      const auditCol = txApp.findCollectionByNameOrId('logs_auditoria')
      const recAudit = new Record(auditCol)
      recAudit.set('entidade', 'pedidos_venda')
      recAudit.set('identificador_registro', pedidoId)
      recAudit.set('campo', 'status')
      recAudit.set('valor_anterior', 'rascunho')
      recAudit.set('valor_novo', 'confirmado')
      recAudit.set('usuario', auth.id)
      recAudit.set('data_hora', hojeIso)
      recAudit.set('origem', 'transacao_hook')
      txApp.save(recAudit)
    })

    return c.json(200, {
      correlationId: correlationId,
      sucesso: true,
      mensagem: 'Pedido confirmado com sucesso com baixa em estoque e títulos financeiros gerados.',
    })
  } catch (err) {
    console.error(`[${correlationId}] Erro ao confirmar venda:`, err)
    return c.json(400, {
      correlationId: correlationId,
      erro: err.message || 'Erro transacional ao confirmar pedido.',
    })
  }
})

// 3. Rota Transacional Server-Side: Cancelar Pedido de Venda com Estorno Vinculado
// POST /backend/v1/transacoes/cancelar-venda
routerAdd('POST', '/backend/v1/transacoes/cancelar-venda', (c) => {
  const correlationId = 'TX-CANCEL-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7)
  const auth = c.auth
  if (!auth) {
    return c.json(401, { correlationId: correlationId, erro: 'R14: Autenticação exigida.' })
  }

  // Permissão de perfil para cancelar pedido
  const perfil = auth.getString('perfil')
  if (perfil !== 'administrador' && perfil !== 'gestor') {
    return c.json(403, {
      correlationId: correlationId,
      erro: 'Apenas Administrador ou Gestor podem cancelar pedidos confirmados.',
    })
  }

  const body = c.requestInfo().body || {}
  const pedidoId = body.pedidoId
  const motivo = body.motivo || 'Cancelamento a pedido do cliente'

  if (!pedidoId) {
    return c.json(400, { correlationId: correlationId, erro: 'ID do pedido não informado.' })
  }

  try {
    $app.runInTransaction((txApp) => {
      const pedido = txApp.findRecordById('pedidos_venda', pedidoId)
      const statusAtual = pedido.getString('status')

      if (statusAtual === 'cancelado') {
        throw new BadRequestError('Este pedido já se encontra cancelado.')
      }

      // Localiza movimentos de estoque gerados por este pedido
      const movimentos = txApp.findRecordsByFilter(
        'movimento_estoque',
        `documento_origem_tipo = 'pedido_venda' && documento_origem_id = '${pedidoId}' && tipo = 'saida'`,
      )

      const movCol = txApp.findCollectionByNameOrId('movimento_estoque')
      const agoraIso = new Date().toISOString()

      // Gera movimentos inversos vinculados (devolucao / estorno)
      for (let m = 0; m < movimentos.length; m++) {
        const movOriginal = movimentos[m]
        const qtdEstorno = Math.abs(movOriginal.getInt('quantidade'))

        const recInverso = new Record(movCol)
        recInverso.set('produto', movOriginal.getString('produto'))
        recInverso.set('local', movOriginal.getString('local'))
        recInverso.set('tipo', 'devolucao')
        recInverso.set('quantidade', qtdEstorno) // Devolve para o estoque (+)
        recInverso.set('custo_unitario_centavos', movOriginal.getInt('custo_unitario_centavos'))
        recInverso.set('documento_origem_tipo', 'pedido_venda')
        recInverso.set('documento_origem_id', pedidoId)
        recInverso.set('movimento_origem_estorno', movOriginal.id)
        recInverso.set('usuario', auth.id)
        recInverso.set('data_hora', agoraIso)
        recInverso.set(
          'observacao',
          `Estorno automático referente ao cancelamento do Pedido #${pedido.getInt('numero_sequencial')}: ${motivo}`,
        )
        txApp.save(recInverso)
      }

      // Estorna lançamentos financeiros
      const lancamentos = txApp.findRecordsByFilter(
        'lancamentos_financeiros',
        `documento_origem_tipo = 'pedido_venda' && documento_origem_id = '${pedidoId}'`,
      )

      const lancCol = txApp.findCollectionByNameOrId('lancamentos_financeiros')
      for (let l = 0; l < lancamentos.length; l++) {
        const lancOriginal = lancamentos[l]
        if (lancOriginal.getString('status') === 'realizado') {
          // Lança saída de estorno
          const recInversoFin = new Record(lancCol)
          recInversoFin.set('tipo', 'saida')
          recInversoFin.set('valor_centavos', lancOriginal.getInt('valor_centavos'))
          recInversoFin.set('moeda', 'BRL')
          recInversoFin.set('conta_financeira', lancOriginal.getString('conta_financeira'))
          recInversoFin.set('categoria_financeira', lancOriginal.getString('categoria_financeira'))
          recInversoFin.set('data_competencia', agoraIso)
          recInversoFin.set('data_vencimento', agoraIso)
          recInversoFin.set('data_pagamento', agoraIso)
          recInversoFin.set('status', 'realizado')
          recInversoFin.set('parte_envolvida', lancOriginal.getString('parte_envolvida'))
          recInversoFin.set('documento_origem_tipo', 'pedido_venda')
          recInversoFin.set('documento_origem_id', pedidoId)
          recInversoFin.set('lancamento_origem_estorno', lancOriginal.id)
          recInversoFin.set('chave_idempotencia', `ESTORNO-LANC-${lancOriginal.id}`)
          recInversoFin.set('usuario', auth.id)
          recInversoFin.set(
            'observacao',
            `Estorno financeiro por cancelamento do Pedido #${pedido.getInt('numero_sequencial')}`,
          )
          txApp.save(recInversoFin)
        } else {
          lancOriginal.set('status', 'cancelado')
          txApp.save(lancOriginal)
        }
      }

      // Atualiza pedido para cancelado
      pedido.set('status', 'cancelado')
      pedido.set(
        'observacao',
        (pedido.getString('observacao') || '') + ` | Motivo cancelamento: ${motivo}`,
      )
      txApp.save(pedido)

      // Auditoria
      const auditCol = txApp.findCollectionByNameOrId('logs_auditoria')
      const recAudit = new Record(auditCol)
      recAudit.set('entidade', 'pedidos_venda')
      recAudit.set('identificador_registro', pedidoId)
      recAudit.set('campo', 'status')
      recAudit.set('valor_anterior', statusAtual)
      recAudit.set('valor_novo', 'cancelado')
      recAudit.set('usuario', auth.id)
      recAudit.set('data_hora', agoraIso)
      recAudit.set('origem', 'transacao_hook')
      txApp.save(recAudit)
    })

    return c.json(200, {
      correlationId: correlationId,
      sucesso: true,
      mensagem: 'Pedido cancelado com estorno atômico de estoque e títulos financeiros.',
    })
  } catch (err) {
    console.error(`[${correlationId}] Erro ao cancelar venda:`, err)
    return c.json(400, {
      correlationId: correlationId,
      erro: err.message || 'Erro transacional ao cancelar pedido.',
    })
  }
})
