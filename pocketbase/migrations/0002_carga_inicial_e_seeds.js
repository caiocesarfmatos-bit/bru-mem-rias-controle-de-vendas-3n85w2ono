migrate(
  (app) => {
    // 1. users: atualizar regras de list/view para permitir administradores listarem e gerenciarem usuários
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    usersCol.listRule = "@request.auth.id != ''"
    usersCol.viewRule = "@request.auth.id != ''"
    usersCol.createRule = "@request.auth.perfil = 'administrador'"
    usersCol.updateRule = "@request.auth.id = id || @request.auth.perfil = 'administrador'"
    usersCol.deleteRule = "@request.auth.perfil = 'administrador'"
    app.save(usersCol)

    // 2. Seeding TabelaDeValores (Domínio centralizado)
    const tabValCol = app.findCollectionByNameOrId('tabela_valores')

    const dadosValores = [
      // FORMA DE PAGAMENTO (Lista restritiva exata conforme especificação)
      {
        dominio: 'forma_pagamento',
        codigo: 'PIX',
        rotulo: 'Pix',
        ordem: 1,
        ativo: true,
        regras_json: {
          exige_comprovante: true,
          compensacao_mesmo_dia: true,
          permite_parcelamento: false,
          exige_troco: false,
        },
      },
      {
        dominio: 'forma_pagamento',
        codigo: 'CREDITO',
        rotulo: 'Cartão de Crédito',
        ordem: 2,
        ativo: true,
        regras_json: {
          exige_comprovante: false,
          compensacao_mesmo_dia: false,
          permite_parcelamento: true,
          exige_bandeira: true,
          sujeito_taxa: true,
        },
      },
      {
        dominio: 'forma_pagamento',
        codigo: 'DEBITO',
        rotulo: 'Cartão de Débito',
        ordem: 3,
        ativo: true,
        regras_json: {
          exige_comprovante: false,
          compensacao_mesmo_dia: true,
          permite_parcelamento: false,
          exige_bandeira: true,
        },
      },
      {
        dominio: 'forma_pagamento',
        codigo: 'LINK',
        rotulo: 'Link de Pagamento',
        ordem: 4,
        ativo: true,
        regras_json: {
          exige_identificador_link: true,
          gateway_externo: true,
          status_inicial: 'pendente',
        },
      },
      {
        dominio: 'forma_pagamento',
        codigo: 'DINHEIRO',
        rotulo: 'Dinheiro',
        ordem: 5,
        ativo: true,
        regras_json: {
          exige_comprovante: false,
          compensacao_mesmo_dia: true,
          permite_parcelamento: false,
          permite_troco: true,
          exige_conferencia_caixa: true,
        },
      },

      // PERFIS DE ACESSO
      {
        dominio: 'perfil_usuario',
        codigo: 'administrador',
        rotulo: 'Administrador',
        ordem: 1,
        ativo: true,
        regras_json: { nivel: 100 },
      },
      {
        dominio: 'perfil_usuario',
        codigo: 'gestor',
        rotulo: 'Gestor',
        ordem: 2,
        ativo: true,
        regras_json: { nivel: 80 },
      },
      {
        dominio: 'perfil_usuario',
        codigo: 'vendedor',
        rotulo: 'Vendedor',
        ordem: 3,
        ativo: true,
        regras_json: { nivel: 40 },
      },
      {
        dominio: 'perfil_usuario',
        codigo: 'operador_caixa',
        rotulo: 'Operador de Caixa',
        ordem: 4,
        ativo: true,
        regras_json: { nivel: 30 },
      },
      {
        dominio: 'perfil_usuario',
        codigo: 'estoquista',
        rotulo: 'Estoquista',
        ordem: 5,
        ativo: true,
        regras_json: { nivel: 30 },
      },
      {
        dominio: 'perfil_usuario',
        codigo: 'consulta',
        rotulo: 'Consulta',
        ordem: 6,
        ativo: true,
        regras_json: { nivel: 10 },
      },

      // TIPOS DE PESSOA
      {
        dominio: 'tipo_pessoa',
        codigo: 'FISICA',
        rotulo: 'Pessoa Física',
        ordem: 1,
        ativo: true,
        regras_json: { doc_tamanho: 11 },
      },
      {
        dominio: 'tipo_pessoa',
        codigo: 'JURIDICA',
        rotulo: 'Pessoa Jurídica',
        ordem: 2,
        ativo: true,
        regras_json: { doc_tamanho: 14 },
      },

      // PAPEL DO CONTATO
      {
        dominio: 'papel_contato',
        codigo: 'comercial',
        rotulo: 'Comercial',
        ordem: 1,
        ativo: true,
        regras_json: {},
      },
      {
        dominio: 'papel_contato',
        codigo: 'financeiro',
        rotulo: 'Financeiro',
        ordem: 2,
        ativo: true,
        regras_json: {},
      },
      {
        dominio: 'papel_contato',
        codigo: 'recado',
        rotulo: 'Recado (Exige Nome)',
        ordem: 3,
        ativo: true,
        regras_json: { exige_nome_proprio: true },
      },
      {
        dominio: 'papel_contato',
        codigo: 'entrega',
        rotulo: 'Entrega / Recebimento',
        ordem: 4,
        ativo: true,
        regras_json: {},
      },
      {
        dominio: 'papel_contato',
        codigo: 'outro',
        rotulo: 'Outro',
        ordem: 5,
        ativo: true,
        regras_json: {},
      },

      // STATUS DE PEDIDO
      {
        dominio: 'status_pedido',
        codigo: 'rascunho',
        rotulo: 'Rascunho',
        ordem: 1,
        ativo: true,
        regras_json: { permite_edicao: true },
      },
      {
        dominio: 'status_pedido',
        codigo: 'confirmado',
        rotulo: 'Confirmado',
        ordem: 2,
        ativo: true,
        regras_json: { baixa_estoque: true, gera_financeiro: true },
      },
      {
        dominio: 'status_pedido',
        codigo: 'faturado',
        rotulo: 'Faturado',
        ordem: 3,
        ativo: true,
        regras_json: {},
      },
      {
        dominio: 'status_pedido',
        codigo: 'cancelado',
        rotulo: 'Cancelado',
        ordem: 4,
        ativo: true,
        regras_json: { estorna_estoque: true, estorna_financeiro: true },
      },
      {
        dominio: 'status_pedido',
        codigo: 'devolvido',
        rotulo: 'Devolvido',
        ordem: 5,
        ativo: true,
        regras_json: { recompom_estoque: true },
      },

      // STATUS DE CLIENTE / FORNECEDOR
      {
        dominio: 'status_pessoa',
        codigo: 'ativo',
        rotulo: 'Ativo',
        ordem: 1,
        ativo: true,
        regras_json: {},
      },
      {
        dominio: 'status_pessoa',
        codigo: 'bloqueado',
        rotulo: 'Bloqueado',
        ordem: 2,
        ativo: true,
        regras_json: { impede_venda: true },
      },
      {
        dominio: 'status_pessoa',
        codigo: 'em_avaliacao',
        rotulo: 'Em Avaliação',
        ordem: 3,
        ativo: true,
        regras_json: {},
      },
      {
        dominio: 'status_pessoa',
        codigo: 'inativo',
        rotulo: 'Inativo',
        ordem: 4,
        ativo: true,
        regras_json: {},
      },
    ]

    for (let i = 0; i < dadosValores.length; i++) {
      const item = dadosValores[i]
      try {
        const existing = app.findFirstRecordByFilter(
          'tabela_valores',
          `dominio = '${item.dominio}' && codigo = '${item.codigo}'`,
        )
        if (existing) continue
      } catch (_) {}

      const rec = new Record(tabValCol)
      rec.set('dominio', item.dominio)
      rec.set('codigo', item.codigo)
      rec.set('rotulo', item.rotulo)
      rec.set('ordem', item.ordem)
      rec.set('ativo', item.ativo)
      rec.set('regras_json', item.regras_json)
      app.save(rec)
    }

    // 3. Local de Estoque Padrão semeado
    const locaisCol = app.findCollectionByNameOrId('locais_estoque')
    let localPadraoId = ''
    try {
      const recLocal = app.findFirstRecordByData(
        'locais_estoque',
        'nome',
        'Ateliê Principal Recreio',
      )
      localPadraoId = recLocal.id
    } catch (_) {
      const rec = new Record(locaisCol)
      rec.set('nome', 'Ateliê Principal Recreio')
      rec.set('tipo', 'deposito_principal')
      app.save(rec)
      localPadraoId = rec.id
    }

    // 4. Tabela de Preço Padrão semeada
    const tabelasPrecoCol = app.findCollectionByNameOrId('tabelas_preco')
    let tabelaPadraoId = ''
    try {
      const recTab = app.findFirstRecordByData('tabelas_preco', 'nome', 'Tabela Varejo Oficial')
      tabelaPadraoId = recTab.id
    } catch (_) {
      const rec = new Record(tabelasPrecoCol)
      rec.set('nome', 'Tabela Varejo Oficial')
      rec.set('moeda', 'BRL')
      rec.set('publico_alvo', 'varejo')
      rec.set('status', 'ativo')
      app.save(rec)
      tabelaPadraoId = rec.id
    }

    // 5. Conta Financeira Padrão (Caixa Físico + Banco)
    const contasCol = app.findCollectionByNameOrId('contas_financeiras')
    try {
      app.findFirstRecordByData('contas_financeiras', 'nome', 'Caixa Físico Ateliê')
    } catch (_) {
      const rec = new Record(contasCol)
      rec.set('nome', 'Caixa Físico Ateliê')
      rec.set('tipo', 'caixa_fisico')
      rec.set('saldo_inicial_centavos', 1)
      rec.set('data_saldo_inicial', '2026-01-01 00:00:00.000Z')
      rec.set('status', 'ativo')
      app.save(rec)
    }

    try {
      app.findFirstRecordByData('contas_financeiras', 'nome', 'Conta Corrente Santander')
    } catch (_) {
      const rec = new Record(contasCol)
      rec.set('nome', 'Conta Corrente Santander')
      rec.set('tipo', 'banco')
      rec.set('saldo_inicial_centavos', 1)
      rec.set('data_saldo_inicial', '2026-01-01 00:00:00.000Z')
      rec.set('status', 'ativo')
      app.save(rec)
    }

    // 6. Categorias Financeiras Essenciais
    const catFinCol = app.findCollectionByNameOrId('categorias_financeiras')
    const catsPadrao = [
      { nome: 'Vendas de Ímãs Personalizados', natureza: 'receita' },
      { nome: 'Vendas Corporativas e Eventos', natureza: 'receita' },
      { nome: 'Compra de Insumos (Papel, Manta, Tinta)', natureza: 'despesa' },
      { nome: 'Embalagens e Despacho Postal', natureza: 'despesa' },
      { nome: 'DAS - Simples Nacional', natureza: 'despesa' },
      { nome: 'Despesas Operacionais Fixas', natureza: 'despesa' },
      { nome: 'Transferência Entre Contas', natureza: 'transferencia' },
    ]

    for (let i = 0; i < catsPadrao.length; i++) {
      try {
        app.findFirstRecordByData('categorias_financeiras', 'nome', catsPadrao[i].nome)
      } catch (_) {
        const rec = new Record(catFinCol)
        rec.set('nome', catsPadrao[i].nome)
        rec.set('natureza', catsPadrao[i].natureza)
        app.save(rec)
      }
    }

    // 7. Categorias de Produto
    const catProdCol = app.findCollectionByNameOrId('categorias_produto')
    let catImasId = ''
    try {
      const recCat = app.findFirstRecordByData(
        'categorias_produto',
        'nome',
        'Ímãs Fotográficos Personalizados',
      )
      catImasId = recCat.id
    } catch (_) {
      const rec = new Record(catProdCol)
      rec.set('nome', 'Ímãs Fotográficos Personalizados')
      rec.set('descricao', 'Ímãs fotográficos estilo polaroid 5x5 cm com laminação e corte preciso')
      app.save(rec)
      catImasId = rec.id
    }

    // 8. Seeding Usuário Administrador Inicial (com perfil administrador)
    let adminUserId = ''
    try {
      const adminUser = app.findAuthRecordByEmail('_pb_users_auth_', 'caiocesarfmatos@gmail.com')
      adminUser.set('perfil', 'administrador')
      adminUser.set('ativo', true)
      adminUser.set('tentativas_falhas', 0)
      app.save(adminUser)
      adminUserId = adminUser.id
    } catch (_) {
      const newAdmin = new Record(usersCol)
      newAdmin.setEmail('caiocesarfmatos@gmail.com')
      newAdmin.setPassword('Skip@Pass')
      newAdmin.setVerified(true)
      newAdmin.set('name', 'Administrador Bru Memórias')
      newAdmin.set('perfil', 'administrador')
      newAdmin.set('ativo', true)
      newAdmin.set('tentativas_falhas', 0)
      app.save(newAdmin)
      adminUserId = newAdmin.id
    }

    // 9. Seeding Produto Inicial (Ímã Fotográfico 5x5 cm)
    const produtosCol = app.findCollectionByNameOrId('produtos')
    let produtoImasId = ''
    try {
      const recProd = app.findFirstRecordByData('produtos', 'sku', 'IMA-POL-5X5')
      produtoImasId = recProd.id
    } catch (_) {
      const rec = new Record(produtosCol)
      rec.set('sku', 'IMA-POL-5X5')
      rec.set('nome', 'Ímã Polaroid 5x5 cm')
      rec.set(
        'descricao_curta',
        'Ímã fotográfico premium 5x5 cm com acabamento brilhoso e manta total',
      )
      rec.set('categoria', catImasId)
      rec.set('unidade_compra', 'UN')
      rec.set('unidade_venda', 'UN')
      rec.set('fator_conversao', 1)
      rec.set('estoque_minimo', 50)
      rec.set('controla_lote', false)
      rec.set('status', 'ativo')
      app.save(rec)
      produtoImasId = rec.id
    }

    // 10. Seeding Preço Inicial do Produto na Tabela Padrão
    const precosCol = app.findCollectionByNameOrId('precos_produto')
    try {
      app.findFirstRecordByFilter(
        'precos_produto',
        `produto = '${produtoImasId}' && tabela_preco = '${tabelaPadraoId}' && data_fim_vigencia = ''`,
      )
    } catch (_) {
      const recPreco = new Record(precosCol)
      recPreco.set('produto', produtoImasId)
      recPreco.set('tabela_preco', tabelaPadraoId)
      recPreco.set('valor_centavos', 450) // R$ 4,50
      recPreco.set('preco_minimo_centavos', 350) // R$ 3,50
      recPreco.set('data_inicio_vigencia', '2026-01-01 00:00:00.000Z')
      recPreco.set('usuario_responsavel', adminUserId)
      recPreco.set('motivo_alteracao', 'Carga inicial do preço oficial de catálogo')
      app.save(recPreco)
    }

    // 11. Seeding Estoque Inicial com Documento e Usuário (Conforme R1)
    const movEstoqueCol = app.findCollectionByNameOrId('movimento_estoque')
    try {
      app.findFirstRecordByFilter(
        'movimento_estoque',
        `produto = '${produtoImasId}' && documento_origem_tipo = 'carga_inicial'`,
      )
    } catch (_) {
      const recMov = new Record(movEstoqueCol)
      recMov.set('produto', produtoImasId)
      recMov.set('local', localPadraoId)
      recMov.set('tipo', 'entrada')
      recMov.set('quantidade', 200)
      recMov.set('custo_unitario_centavos', 120) // R$ 1,20 custo
      recMov.set('documento_origem_tipo', 'carga_inicial')
      recMov.set('documento_origem_id', 'INIT-001')
      recMov.set('usuario', adminUserId)
      recMov.set('data_hora', '2026-01-01 00:00:00.000Z')
      recMov.set('observacao', 'Saldo inicial semeado na implantação')
      app.save(recMov)
    }

    // 12. Seeding Fornecedor e Cliente Modelo
    const pessoasCol = app.findCollectionByNameOrId('pessoas')
    let fornecedorId = ''
    try {
      const forn = app.findFirstRecordByData('pessoas', 'documento', '12345678000195')
      fornecedorId = forn.id
    } catch (_) {
      const rec = new Record(pessoasCol)
      rec.set('tipo_pessoa', 'JURIDICA')
      rec.set('documento', '12345678000195')
      rec.set('nome_razao_social', 'Distribuidora Nacional de Papéis e Mantas LTDA')
      rec.set('nome_fantasia', 'Mantas Brasil')
      rec.set('status', 'ativo')
      rec.set('data_cadastro', '2026-01-01 00:00:00.000Z')
      rec.set(
        'observacao_interna',
        'Fornecedor principal de mantas magnéticas e bobinas fotográficas',
      )
      app.save(rec)
      fornecedorId = rec.id

      const papelFornCol = app.findCollectionByNameOrId('papel_fornecedor')
      const recPapel = new Record(papelFornCol)
      recPapel.set('pessoa', fornecedorId)
      recPapel.set('status', 'ativo')
      recPapel.set('prazo_padrao_entrega_dias', 5)
      recPapel.set('condicao_pagamento_padrao', 'Boleto 28 dias')
      app.save(recPapel)
    }

    let clienteId = ''
    try {
      const cli = app.findFirstRecordByData('pessoas', 'documento', '11144477735')
      clienteId = cli.id
    } catch (_) {
      const rec = new Record(pessoasCol)
      rec.set('tipo_pessoa', 'FISICA')
      rec.set('documento', '11144477735')
      rec.set('nome_razao_social', 'Mariana Albuquerque')
      rec.set('status', 'ativo')
      rec.set('data_cadastro', '2026-01-01 00:00:00.000Z')
      rec.set('observacao_interna', 'Cliente frequente de ímãs para eventos familiares')
      app.save(rec)
      clienteId = rec.id

      const papelCliCol = app.findCollectionByNameOrId('papel_cliente')
      const recPapel = new Record(papelCliCol)
      recPapel.set('pessoa', clienteId)
      recPapel.set('status', 'ativo')
      recPapel.set('forma_pagamento_preferencial', 'PIX')
      recPapel.set('vendedor_responsavel', adminUserId)
      app.save(recPapel)

      const contatosCol = app.findCollectionByNameOrId('contatos')
      const recContato = new Record(contatosCol)
      recContato.set('pessoa', clienteId)
      recContato.set('nome_contato', 'Mariana')
      recContato.set('papel', 'comercial')
      recContato.set('whatsapp', '+5521998877665')
      recContato.set('email', 'mariana.albuquerque@email.com')
      recContato.set('is_preferencial', true)
      app.save(recContato)

      const enderecosCol = app.findCollectionByNameOrId('enderecos')
      const recEnd = new Record(enderecosCol)
      recEnd.set('pessoa', clienteId)
      recEnd.set('tipo', 'entrega')
      recEnd.set('cep', '22790700')
      recEnd.set('logradouro', 'Avenida das Américas')
      recEnd.set('numero', '15000')
      recEnd.set('complemento', 'Apto 302')
      recEnd.set('bairro', 'Recreio dos Bandeirantes')
      recEnd.set('cidade', 'Rio de Janeiro')
      recEnd.set('uf', 'RJ')
      recEnd.set('pais', 'Brasil')
      recEnd.set('is_principal', true)
      app.save(recEnd)
    }

    // 13. ProdutoFornecedor N:N modelo
    const prodFornCol = app.findCollectionByNameOrId('produto_fornecedor')
    try {
      app.findFirstRecordByFilter(
        'produto_fornecedor',
        `produto = '${produtoImasId}' && fornecedor = '${fornecedorId}'`,
      )
    } catch (_) {
      const rec = new Record(prodFornCol)
      rec.set('produto', produtoImasId)
      rec.set('fornecedor', fornecedorId)
      rec.set('codigo_item_fornecedor', 'MANTA-03-GLOSS')
      rec.set('custo_acordado_centavos', 115)
      rec.set('prazo_entrega_dias', 4)
      rec.set('quantidade_minima_pedido', 100)
      rec.set('is_preferencial', true)
      app.save(rec)
    }
  },
  (app) => {
    // Rollback não destrutivo de seeds
  },
)
