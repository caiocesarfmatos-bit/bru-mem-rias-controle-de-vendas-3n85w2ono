migrate(
  (app) => {
    // 1. users: adicionar perfil, ativo e tentativas_falhas se ainda não existirem
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!usersCol.fields.getByName('perfil')) {
      usersCol.fields.add(
        new SelectField({
          name: 'perfil',
          required: false,
          values: [
            'administrador',
            'gestor',
            'vendedor',
            'operador_caixa',
            'estoquista',
            'consulta',
          ],
          maxSelect: 1,
        }),
      )
    }

    if (!usersCol.fields.getByName('ativo')) {
      usersCol.fields.add(
        new BoolField({
          name: 'ativo',
        }),
      )
    }

    if (!usersCol.fields.getByName('bloqueado_ate')) {
      usersCol.fields.add(
        new DateField({
          name: 'bloqueado_ate',
        }),
      )
    }

    if (!usersCol.fields.getByName('tentativas_falhas')) {
      usersCol.fields.add(
        new NumberField({
          name: 'tentativas_falhas',
        }),
      )
    }

    app.save(usersCol)

    // 2. tabela_valores (Domínio Central de Listas)
    const tabelaValores = new Collection({
      name: 'tabela_valores',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.perfil = 'administrador'",
      updateRule: "@request.auth.perfil = 'administrador'",
      deleteRule: "@request.auth.perfil = 'administrador'",
      fields: [
        { name: 'dominio', type: 'text', required: true },
        { name: 'codigo', type: 'text', required: true },
        { name: 'rotulo', type: 'text', required: true },
        { name: 'ordem', type: 'number' },
        { name: 'ativo', type: 'bool' },
        { name: 'regras_json', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_tabela_valores_dom_cod ON tabela_valores (dominio, codigo)',
        'CREATE INDEX idx_tabela_valores_dominio ON tabela_valores (dominio, ordem ASC)',
      ],
    })
    app.save(tabelaValores)

    // 3. pessoas (Base Unificada de Clientes e Fornecedores)
    const pessoas = new Collection({
      name: 'pessoas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.perfil = 'administrador'",
      fields: [
        {
          name: 'tipo_pessoa',
          type: 'select',
          required: true,
          values: ['FISICA', 'JURIDICA'],
          maxSelect: 1,
        },
        { name: 'documento', type: 'text', required: true },
        { name: 'nome_razao_social', type: 'text', required: true },
        { name: 'nome_fantasia', type: 'text' },
        { name: 'inscricao_estadual', type: 'text' },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['ativo', 'inativo', 'bloqueado'],
          maxSelect: 1,
        },
        { name: 'data_cadastro', type: 'date' },
        { name: 'observacao_interna', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_pessoas_documento ON pessoas (documento)',
        'CREATE INDEX idx_pessoas_nome ON pessoas (nome_razao_social)',
        'CREATE INDEX idx_pessoas_tipo_status ON pessoas (tipo_pessoa, status)',
      ],
    })
    app.save(pessoas)

    const pessoasColId = app.findCollectionByNameOrId('pessoas').id
    const usersColId = '_pb_users_auth_'

    // 4. papel_cliente
    const papelCliente = new Collection({
      name: 'papel_cliente',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.perfil = 'administrador'",
      fields: [
        {
          name: 'pessoa',
          type: 'relation',
          required: true,
          collectionId: pessoasColId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['ativo', 'bloqueado', 'em_avaliacao'],
          maxSelect: 1,
        },
        { name: 'limite_credito_centavos', type: 'number' },
        { name: 'forma_pagamento_preferencial', type: 'text' },
        { name: 'vendedor_responsavel', type: 'relation', collectionId: usersColId, maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_papel_cliente_pessoa ON papel_cliente (pessoa)'],
    })
    app.save(papelCliente)

    // 5. papel_fornecedor
    const papelFornecedor = new Collection({
      name: 'papel_fornecedor',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.perfil = 'administrador'",
      fields: [
        {
          name: 'pessoa',
          type: 'relation',
          required: true,
          collectionId: pessoasColId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['ativo', 'bloqueado', 'em_avaliacao'],
          maxSelect: 1,
        },
        { name: 'prazo_padrao_entrega_dias', type: 'number' },
        { name: 'condicao_pagamento_padrao', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_papel_fornecedor_pessoa ON papel_fornecedor (pessoa)'],
    })
    app.save(papelFornecedor)

    // 6. contatos
    const contatos = new Collection({
      name: 'contatos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'pessoa',
          type: 'relation',
          required: true,
          collectionId: pessoasColId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'nome_contato', type: 'text', required: true },
        {
          name: 'papel',
          type: 'select',
          required: true,
          values: ['comercial', 'financeiro', 'recado', 'entrega', 'outro'],
          maxSelect: 1,
        },
        { name: 'telefone_fixo', type: 'text' },
        { name: 'celular', type: 'text' },
        { name: 'whatsapp', type: 'text' },
        { name: 'email', type: 'text' },
        { name: 'is_preferencial', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_contatos_pessoa ON contatos (pessoa)'],
    })
    app.save(contatos)

    // 7. enderecos
    const enderecos = new Collection({
      name: 'enderecos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'pessoa',
          type: 'relation',
          required: true,
          collectionId: pessoasColId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['fiscal', 'entrega', 'cobranca'],
          maxSelect: 1,
        },
        { name: 'cep', type: 'text', required: true },
        { name: 'logradouro', type: 'text', required: true },
        { name: 'numero', type: 'text', required: true },
        { name: 'complemento', type: 'text' },
        { name: 'bairro', type: 'text', required: true },
        { name: 'cidade', type: 'text', required: true },
        { name: 'uf', type: 'text', required: true },
        { name: 'pais', type: 'text' },
        { name: 'is_principal', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_enderecos_pessoa ON enderecos (pessoa)'],
    })
    app.save(enderecos)

    // 8. redes_sociais
    const redesSociais = new Collection({
      name: 'redes_sociais',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'pessoa',
          type: 'relation',
          required: true,
          collectionId: pessoasColId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'tipo_rede',
          type: 'select',
          required: true,
          values: ['instagram', 'facebook', 'tiktok', 'pinterest', 'linkedin', 'outro'],
          maxSelect: 1,
        },
        { name: 'identificador', type: 'text', required: true },
        { name: 'url_completa', type: 'text', required: true },
        { name: 'is_oficial', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_redes_sociais_pessoa ON redes_sociais (pessoa)'],
    })
    app.save(redesSociais)

    // 9. categorias_produto
    const categoriasProduto = new Collection({
      name: 'categorias_produto',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.perfil = 'administrador'",
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'descricao', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_categorias_produto_nome ON categorias_produto (nome)'],
    })
    app.save(categoriasProduto)

    const categoriasProdColId = app.findCollectionByNameOrId('categorias_produto').id

    // 10. produtos (PROIBIDO preço de venda e PROIBIDO fornecedor aqui)
    const produtos = new Collection({
      name: 'produtos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.perfil = 'administrador'",
      fields: [
        { name: 'sku', type: 'text', required: true },
        { name: 'codigo_barras', type: 'text' },
        { name: 'nome', type: 'text', required: true },
        { name: 'descricao_curta', type: 'text' },
        { name: 'categoria', type: 'relation', collectionId: categoriasProdColId, maxSelect: 1 },
        { name: 'unidade_compra', type: 'text', required: true },
        { name: 'unidade_venda', type: 'text', required: true },
        { name: 'fator_conversao', type: 'number', required: true },
        { name: 'estoque_minimo', type: 'number' },
        { name: 'controla_lote', type: 'bool' },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['ativo', 'inativo', 'descontinuado'],
          maxSelect: 1,
        },
        { name: 'campo_fiscal_ncm', type: 'text' },
        { name: 'campo_fiscal_cfop', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_produtos_sku ON produtos (sku)',
        'CREATE INDEX idx_produtos_nome ON produtos (nome)',
        'CREATE INDEX idx_produtos_categoria ON produtos (categoria)',
      ],
    })
    app.save(produtos)

    const produtosColId = app.findCollectionByNameOrId('produtos').id

    // 11. tabelas_preco
    const tabelasPreco = new Collection({
      name: 'tabelas_preco',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.perfil = 'administrador'",
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'moeda', type: 'text', required: true },
        {
          name: 'publico_alvo',
          type: 'select',
          required: true,
          values: ['varejo', 'atacado', 'contrato'],
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['ativo', 'inativo'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_tabelas_preco_nome ON tabelas_preco (nome)'],
    })
    app.save(tabelasPreco)

    const tabelasPrecoColId = app.findCollectionByNameOrId('tabelas_preco').id

    // 12. precos_produto
    const precosProduto = new Collection({
      name: 'precos_produto',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.perfil = 'administrador'",
      fields: [
        {
          name: 'produto',
          type: 'relation',
          required: true,
          collectionId: produtosColId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'tabela_preco',
          type: 'relation',
          required: true,
          collectionId: tabelasPrecoColId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'valor_centavos', type: 'number', required: true },
        { name: 'preco_minimo_centavos', type: 'number', required: true },
        { name: 'data_inicio_vigencia', type: 'date', required: true },
        { name: 'data_fim_vigencia', type: 'date' },
        {
          name: 'usuario_responsavel',
          type: 'relation',
          required: true,
          collectionId: usersColId,
          maxSelect: 1,
        },
        { name: 'motivo_alteracao', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_precos_prod_tab ON precos_produto (produto, tabela_preco, data_inicio_vigencia DESC)',
      ],
    })
    app.save(precosProduto)

    // 13. produto_fornecedor (N:N)
    const produtoFornecedor = new Collection({
      name: 'produto_fornecedor',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'produto',
          type: 'relation',
          required: true,
          collectionId: produtosColId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'fornecedor',
          type: 'relation',
          required: true,
          collectionId: pessoasColId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'codigo_item_fornecedor', type: 'text' },
        { name: 'custo_acordado_centavos', type: 'number', required: true },
        { name: 'prazo_entrega_dias', type: 'number' },
        { name: 'quantidade_minima_pedido', type: 'number' },
        { name: 'is_preferencial', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_prod_forn_unique ON produto_fornecedor (produto, fornecedor)',
      ],
    })
    app.save(produtoFornecedor)

    // 14. locais_estoque
    const locaisEstoque = new Collection({
      name: 'locais_estoque',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.perfil = 'administrador'",
      updateRule: "@request.auth.perfil = 'administrador'",
      deleteRule: "@request.auth.perfil = 'administrador'",
      fields: [
        { name: 'nome', type: 'text', required: true },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['deposito_principal', 'mostruario', 'defeitos'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_locais_estoque_nome ON locais_estoque (nome)'],
    })
    app.save(locaisEstoque)

    const locaisEstoqueColId = app.findCollectionByNameOrId('locais_estoque').id

    // 15. movimento_estoque (IMUTÁVEL)
    const movimentoEstoque = new Collection({
      name: 'movimento_estoque',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: null, // Proibido update direto
      deleteRule: null, // Proibido delete direto
      fields: [
        {
          name: 'produto',
          type: 'relation',
          required: true,
          collectionId: produtosColId,
          maxSelect: 1,
        },
        {
          name: 'local',
          type: 'relation',
          required: true,
          collectionId: locaisEstoqueColId,
          maxSelect: 1,
        },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['entrada', 'saida', 'ajuste', 'devolucao', 'transferencia', 'perda'],
          maxSelect: 1,
        },
        { name: 'quantidade', type: 'number', required: true },
        { name: 'custo_unitario_centavos', type: 'number', required: true },
        { name: 'lote', type: 'text' },
        { name: 'data_validade', type: 'date' },
        { name: 'documento_origem_tipo', type: 'text' },
        { name: 'documento_origem_id', type: 'text' },
        { name: 'movimento_origem_estorno', type: 'text' },
        {
          name: 'usuario',
          type: 'relation',
          required: true,
          collectionId: usersColId,
          maxSelect: 1,
        },
        { name: 'data_hora', type: 'date', required: true },
        { name: 'observacao', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_mov_est_prod_local ON movimento_estoque (produto, local, data_hora DESC)',
        'CREATE INDEX idx_mov_est_doc_origem ON movimento_estoque (documento_origem_tipo, documento_origem_id)',
      ],
    })
    app.save(movimentoEstoque)

    // 16. pedidos_venda
    const pedidosVenda = new Collection({
      name: 'pedidos_venda',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.perfil = 'administrador'",
      fields: [
        { name: 'numero_sequencial', type: 'number', required: true },
        {
          name: 'cliente',
          type: 'relation',
          required: true,
          collectionId: pessoasColId,
          maxSelect: 1,
        },
        { name: 'data_emissao', type: 'date', required: true },
        {
          name: 'vendedor_responsavel',
          type: 'relation',
          required: true,
          collectionId: usersColId,
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['rascunho', 'confirmado', 'faturado', 'cancelado', 'devolvido'],
          maxSelect: 1,
        },
        { name: 'subtotal_centavos', type: 'number', required: true },
        { name: 'desconto_centavos', type: 'number', required: true },
        { name: 'acrescimo_centavos', type: 'number', required: true },
        { name: 'total_centavos', type: 'number', required: true },
        { name: 'observacao', type: 'text' },
        {
          name: 'usuario',
          type: 'relation',
          required: true,
          collectionId: usersColId,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_pedidos_venda_num ON pedidos_venda (numero_sequencial)',
        'CREATE INDEX idx_pedidos_venda_cliente ON pedidos_venda (cliente, data_emissao DESC)',
        'CREATE INDEX idx_pedidos_venda_status ON pedidos_venda (status)',
      ],
    })
    app.save(pedidosVenda)

    const pedidosVendaColId = app.findCollectionByNameOrId('pedidos_venda').id

    // 17. itens_pedido
    const itensPedido = new Collection({
      name: 'itens_pedido',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'pedido',
          type: 'relation',
          required: true,
          collectionId: pedidosVendaColId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'produto',
          type: 'relation',
          required: true,
          collectionId: produtosColId,
          maxSelect: 1,
        },
        {
          name: 'local_estoque',
          type: 'relation',
          required: true,
          collectionId: locaisEstoqueColId,
          maxSelect: 1,
        },
        { name: 'quantidade', type: 'number', required: true },
        { name: 'preco_unitario_praticado_centavos', type: 'number', required: true },
        { name: 'custo_unitario_momento_centavos', type: 'number', required: true },
        { name: 'desconto_item_centavos', type: 'number' },
        { name: 'total_item_centavos', type: 'number', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_itens_pedido_pedido ON itens_pedido (pedido)',
        'CREATE INDEX idx_itens_pedido_produto ON itens_pedido (produto)',
      ],
    })
    app.save(itensPedido)

    // 18. pagamentos_pedido
    const pagamentosPedido = new Collection({
      name: 'pagamentos_pedido',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'pedido',
          type: 'relation',
          required: true,
          collectionId: pedidosVendaColId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'forma_pagamento',
          type: 'select',
          required: true,
          values: ['PIX', 'CREDITO', 'DEBITO', 'LINK', 'DINHEIRO'],
          maxSelect: 1,
        },
        { name: 'valor_centavos', type: 'number', required: true },
        { name: 'quantidade_parcelas', type: 'number' },
        { name: 'identificador_transacao', type: 'text' },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['pendente', 'aprovado', 'estornado', 'cancelado'],
          maxSelect: 1,
        },
        { name: 'data_previsao', type: 'date', required: true },
        { name: 'data_efetivacao', type: 'date' },
        {
          name: 'usuario',
          type: 'relation',
          required: true,
          collectionId: usersColId,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_pag_ped_pedido ON pagamentos_pedido (pedido)',
        'CREATE INDEX idx_pag_ped_forma_status ON pagamentos_pedido (forma_pagamento, status)',
      ],
    })
    app.save(pagamentosPedido)

    // 19. contas_financeiras
    const contasFinanceiras = new Collection({
      name: 'contas_financeiras',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.perfil = 'administrador'",
      updateRule: "@request.auth.perfil = 'administrador'",
      deleteRule: "@request.auth.perfil = 'administrador'",
      fields: [
        { name: 'nome', type: 'text', required: true },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['caixa_fisico', 'banco'],
          maxSelect: 1,
        },
        { name: 'saldo_inicial_centavos', type: 'number', required: true },
        { name: 'data_saldo_inicial', type: 'date', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['ativo', 'inativo'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_contas_fin_nome ON contas_financeiras (nome)'],
    })
    app.save(contasFinanceiras)

    const contasFinColId = app.findCollectionByNameOrId('contas_financeiras').id

    // 20. categorias_financeiras
    const categoriasFinanceiras = new Collection({
      name: 'categorias_financeiras',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.perfil = 'administrador' || @request.auth.perfil = 'gestor'",
      updateRule: "@request.auth.perfil = 'administrador' || @request.auth.perfil = 'gestor'",
      deleteRule: "@request.auth.perfil = 'administrador'",
      fields: [
        { name: 'nome', type: 'text', required: true },
        {
          name: 'natureza',
          type: 'select',
          required: true,
          values: ['receita', 'despesa', 'transferencia'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_cat_fin_nome ON categorias_financeiras (nome)'],
    })
    app.save(categoriasFinanceiras)

    const catFinColId = app.findCollectionByNameOrId('categorias_financeiras').id

    // 21. lancamentos_financeiros
    const lancamentosFinanceiros = new Collection({
      name: 'lancamentos_financeiros',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: null, // Proibido deletar
      fields: [
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['entrada', 'saida', 'transferencia'],
          maxSelect: 1,
        },
        { name: 'valor_centavos', type: 'number', required: true },
        { name: 'moeda', type: 'text', required: true },
        {
          name: 'conta_financeira',
          type: 'relation',
          required: true,
          collectionId: contasFinColId,
          maxSelect: 1,
        },
        {
          name: 'categoria_financeira',
          type: 'relation',
          required: true,
          collectionId: catFinColId,
          maxSelect: 1,
        },
        { name: 'centro_custo', type: 'text' },
        { name: 'data_competencia', type: 'date', required: true },
        { name: 'data_vencimento', type: 'date', required: true },
        { name: 'data_pagamento', type: 'date' },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['previsto', 'realizado', 'cancelado'],
          maxSelect: 1,
        },
        { name: 'parte_envolvida', type: 'relation', collectionId: pessoasColId, maxSelect: 1 },
        { name: 'documento_origem_tipo', type: 'text' },
        { name: 'documento_origem_id', type: 'text' },
        { name: 'lancamento_origem_estorno', type: 'text' },
        {
          name: 'forma_pagamento',
          type: 'select',
          values: ['PIX', 'CREDITO', 'DEBITO', 'LINK', 'DINHEIRO'],
          maxSelect: 1,
        },
        { name: 'chave_idempotencia', type: 'text' },
        {
          name: 'usuario',
          type: 'relation',
          required: true,
          collectionId: usersColId,
          maxSelect: 1,
        },
        { name: 'observacao', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_lanc_fin_idemp ON lancamentos_financeiros (chave_idempotencia) WHERE chave_idempotencia != ''",
        'CREATE INDEX idx_lanc_fin_competencia ON lancamentos_financeiros (data_competencia DESC)',
        'CREATE INDEX idx_lanc_fin_pagamento ON lancamentos_financeiros (data_pagamento DESC)',
        'CREATE INDEX idx_lanc_fin_status ON lancamentos_financeiros (status)',
      ],
    })
    app.save(lancamentosFinanceiros)

    // 22. logs_auditoria (IMUTÁVEL)
    const logsAuditoria = new Collection({
      name: 'logs_auditoria',
      type: 'base',
      listRule: "@request.auth.perfil = 'administrador' || @request.auth.perfil = 'gestor'",
      viewRule: "@request.auth.perfil = 'administrador' || @request.auth.perfil = 'gestor'",
      createRule: "@request.auth.id != ''",
      updateRule: null, // Imutável
      deleteRule: null, // Imutável
      fields: [
        { name: 'entidade', type: 'text', required: true },
        { name: 'identificador_registro', type: 'text', required: true },
        { name: 'campo', type: 'text' },
        { name: 'valor_anterior', type: 'text' },
        { name: 'valor_novo', type: 'text' },
        { name: 'usuario', type: 'relation', collectionId: usersColId, maxSelect: 1 },
        { name: 'data_hora', type: 'date', required: true },
        { name: 'origem', type: 'text', required: true },
        { name: 'endereco_ip', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_logs_audit_ent_id ON logs_auditoria (entidade, identificador_registro)',
        'CREATE INDEX idx_logs_audit_data ON logs_auditoria (data_hora DESC)',
      ],
    })
    app.save(logsAuditoria)
  },
  (app) => {
    const toDelete = [
      'logs_auditoria',
      'lancamentos_financeiros',
      'categorias_financeiras',
      'contas_financeiras',
      'pagamentos_pedido',
      'itens_pedido',
      'pedidos_venda',
      'movimento_estoque',
      'locais_estoque',
      'produto_fornecedor',
      'precos_produto',
      'tabelas_preco',
      'produtos',
      'categorias_produto',
      'redes_sociais',
      'enderecos',
      'contatos',
      'papel_fornecedor',
      'papel_cliente',
      'pessoas',
      'tabela_valores',
    ]
    for (let i = 0; i < toDelete.length; i++) {
      try {
        const col = app.findCollectionByNameOrId(toDelete[i])
        app.delete(col)
      } catch (_) {}
    }
  },
)
