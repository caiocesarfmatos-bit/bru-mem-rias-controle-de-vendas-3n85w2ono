// pocketbase/migrations/0007_consolidacao_pedidos_producao_correios.js
// Migração para fortalecimento de pedidos (prazo, endereço, foto de referência),
// itens do pedido (tipo e modelo do produto),
// módulo de matéria-prima e produção (insumos, fichas técnicas de rendimento)
// e parâmetros para credencial oficial dos Correios.

migrate(
  (app) => {
    // 1. Ampliar coleção pedidos_venda: prazo_entrega_dias, data_limite_entrega, endereco_entrega_texto, foto_referencia
    const pedidosCol = app.findCollectionByNameOrId('pedidos_venda')
    if (!pedidosCol.fields.getByName('prazo_entrega_dias')) {
      pedidosCol.fields.add(
        new NumberField({
          name: 'prazo_entrega_dias',
          required: false,
        }),
      )
    }
    if (!pedidosCol.fields.getByName('data_limite_entrega')) {
      pedidosCol.fields.add(
        new DateField({
          name: 'data_limite_entrega',
          required: false,
        }),
      )
    }
    if (!pedidosCol.fields.getByName('endereco_entrega_texto')) {
      pedidosCol.fields.add(
        new TextField({
          name: 'endereco_entrega_texto',
          required: false,
        }),
      )
    }
    if (!pedidosCol.fields.getByName('foto_referencia')) {
      pedidosCol.fields.add(
        new TextField({
          name: 'foto_referencia',
          required: false,
        }),
      )
    }
    app.save(pedidosCol)

    // 2. Ampliar itens_pedido: tipo_item e modelo_item
    const itensPedidoCol = app.findCollectionByNameOrId('itens_pedido')
    if (!itensPedidoCol.fields.getByName('tipo_item')) {
      itensPedidoCol.fields.add(
        new TextField({
          name: 'tipo_item',
          required: false,
        }),
      )
    }
    if (!itensPedidoCol.fields.getByName('modelo_item')) {
      itensPedidoCol.fields.add(
        new TextField({
          name: 'modelo_item',
          required: false,
        }),
      )
    }
    if (!itensPedidoCol.fields.getByName('foto_item')) {
      itensPedidoCol.fields.add(
        new TextField({
          name: 'foto_item',
          required: false,
        }),
      )
    }
    app.save(itensPedidoCol)

    // 3. Criar coleção insumos_producao (Matéria-prima de produção)
    let insumosProducao
    try {
      insumosProducao = app.findCollectionByNameOrId('insumos_producao')
    } catch (_) {
      insumosProducao = new Collection({
        name: 'insumos_producao',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.perfil = 'administrador'",
        fields: [
          { name: 'codigo', type: 'text', required: true },
          { name: 'nome', type: 'text', required: true },
          { name: 'categoria', type: 'text' },
          { name: 'unidade_medida', type: 'text', required: true }, // un, folha, metro, g, ml
          { name: 'custo_unitario_centavos', type: 'number', required: true },
          { name: 'estoque_atual', type: 'number', required: true },
          { name: 'estoque_minimo', type: 'number' },
          { name: 'fornecedor_nome', type: 'text' },
          { name: 'observacao', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_insumos_prod_cod ON insumos_producao (codigo)',
          'CREATE INDEX idx_insumos_prod_nome ON insumos_producao (nome)',
        ],
      })
      app.save(insumosProducao)
    }

    const insumosColId = app.findCollectionByNameOrId('insumos_producao').id
    const produtosColId = app.findCollectionByNameOrId('produtos').id

    // 4. Criar coleção fichas_producao (Composição e Rendimento de Insumos por Produto)
    let fichasProducao
    try {
      fichasProducao = app.findCollectionByNameOrId('fichas_producao')
    } catch (_) {
      fichasProducao = new Collection({
        name: 'fichas_producao',
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
            name: 'insumo',
            type: 'relation',
            required: true,
            collectionId: insumosColId,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'quantidade_insumo', type: 'number', required: true }, // ex: 1 folha
          { name: 'rendimento_produtos', type: 'number', required: true }, // ex: rende 12 ímãs
          { name: 'perda_estimada_pct', type: 'number' }, // ex: 5%
          { name: 'instrucoes', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE UNIQUE INDEX idx_ficha_prod_insumo ON fichas_producao (produto, insumo)'],
      })
      app.save(fichasProducao)
    }

    // 5. Insumos Padrão do Ateliê Bru Memórias (papel fotográfico, manta magnética, laminação, embalagem)
    const insumosIniciais = [
      {
        codigo: 'PAP-FOT-GLOSS-A4',
        nome: 'Papel Fotográfico Glossy A4 230g',
        categoria: 'Papéis',
        unidade_medida: 'folha',
        custo_unitario_centavos: 65, // R$ 0,65 por folha A4
        estoque_atual: 500,
        estoque_minimo: 100,
        fornecedor_nome: 'Mantas Brasil Distribuidora',
        observacao: 'Folha A4 rende 12 fotos polaroid 5x5 cm',
      },
      {
        codigo: 'MAN-MAG-03-A4',
        nome: 'Manta Magnética Adesivada 0,3mm A4',
        categoria: 'Mantas',
        unidade_medida: 'folha',
        custo_unitario_centavos: 180, // R$ 1,80 por folha A4
        estoque_atual: 400,
        estoque_minimo: 80,
        fornecedor_nome: 'Mantas Brasil Distribuidora',
        observacao: 'Manta magnética adesivada total 0,3mm espessura',
      },
      {
        codigo: 'FIL-LAM-BOPP-BRILHO',
        nome: 'Película de Laminação Protetora (BOPP Brilho)',
        categoria: 'Acabamento',
        unidade_medida: 'folha',
        custo_unitario_centavos: 25, // R$ 0,25 por folha A4
        estoque_atual: 450,
        estoque_minimo: 90,
        fornecedor_nome: 'Suprimentos Gráficos Brasil',
        observacao: 'Protege contra raios UV, umidade e desbotamento',
      },
      {
        codigo: 'TIN-CORANTE-KIT',
        nome: 'Tinta Fotográfica Corante Alta Fidelidade (Fracionada)',
        categoria: 'Tintas',
        unidade_medida: 'ml',
        custo_unitario_centavos: 10, // R$ 0,10 por ml (~1ml faz 1 folha A4 cheia)
        estoque_atual: 1000,
        estoque_minimo: 200,
        fornecedor_nome: 'Suprimentos Gráficos Brasil',
        observacao: 'Impressão 6 cores resolução fotográfica',
      },
      {
        codigo: 'SAQ-CEL-6X6',
        nome: 'Saquinho Celofane Transparente 6x6 cm + Solapa',
        categoria: 'Embalagem',
        unidade_medida: 'un',
        custo_unitario_centavos: 12, // R$ 0,12 por unidade
        estoque_atual: 1500,
        estoque_minimo: 300,
        fornecedor_nome: 'Embalagens RJ',
        observacao: 'Embalagem individual protetora para entrega ao cliente',
      },
    ]

    const colInsumosRef = app.findCollectionByNameOrId('insumos_producao')
    const idsInsumos = {}
    for (let i = 0; i < insumosIniciais.length; i++) {
      const ins = insumosIniciais[i]
      try {
        const existe = app.findFirstRecordByFilter('insumos_producao', `codigo = '${ins.codigo}'`)
        idsInsumos[ins.codigo] = existe.id
      } catch (_) {
        const rec = new Record(colInsumosRef)
        rec.set('codigo', ins.codigo)
        rec.set('nome', ins.nome)
        rec.set('categoria', ins.categoria)
        rec.set('unidade_medida', ins.unidade_medida)
        rec.set('custo_unitario_centavos', ins.custo_unitario_centavos)
        rec.set('estoque_atual', ins.estoque_atual)
        rec.set('estoque_minimo', ins.estoque_minimo)
        rec.set('fornecedor_nome', ins.fornecedor_nome)
        rec.set('observacao', ins.observacao)
        app.save(rec)
        idsInsumos[ins.codigo] = rec.id
      }
    }

    // 6. Ficha Técnica Padrão vinculada ao Produto Ímã Polaroid 5x5 cm (IMA-POL-5X5)
    try {
      const prodImas = app.findFirstRecordByData('produtos', 'sku', 'IMA-POL-5X5')
      const colFichasRef = app.findCollectionByNameOrId('fichas_producao')

      const fichasPadrao = [
        {
          insumoCodigo: 'PAP-FOT-GLOSS-A4',
          quantidade: 1,
          rendimento: 12, // 1 folha A4 faz 12 ímãs
          perda: 5,
        },
        {
          insumoCodigo: 'MAN-MAG-03-A4',
          quantidade: 1,
          rendimento: 12, // 1 folha manta faz 12 ímãs
          perda: 5,
        },
        {
          insumoCodigo: 'FIL-LAM-BOPP-BRILHO',
          quantidade: 1,
          rendimento: 12, // 1 folha laminação faz 12 ímãs
          perda: 3,
        },
        {
          insumoCodigo: 'TIN-CORANTE-KIT',
          quantidade: 1, // 1 ml tinta por folha
          rendimento: 12, // rende 12 ímãs
          perda: 2,
        },
        {
          insumoCodigo: 'SAQ-CEL-6X6',
          quantidade: 1,
          rendimento: 1, // 1 saquinho por ímã
          perda: 1,
        },
      ]

      for (let j = 0; j < fichasPadrao.length; j++) {
        const itemFicha = fichasPadrao[j]
        const insId = idsInsumos[itemFicha.insumoCodigo]
        if (!insId) continue

        try {
          app.findFirstRecordByFilter(
            'fichas_producao',
            `produto = '${prodImas.id}' && insumo = '${insId}'`,
          )
        } catch (_) {
          const recFicha = new Record(colFichasRef)
          recFicha.set('produto', prodImas.id)
          recFicha.set('insumo', insId)
          recFicha.set('quantidade_insumo', itemFicha.quantidade)
          recFicha.set('rendimento_produtos', itemFicha.rendimento)
          recFicha.set('perda_estimada_pct', itemFicha.perda)
          recFicha.set(
            'instrucoes',
            `Consumo padrão: ${itemFicha.quantidade} para ${itemFicha.rendimento} ímãs 5x5 cm`,
          )
          app.save(recFicha)
        }
      }
    } catch (errProd) {
      console.warn('Aviso ao vincular fichas de producao ao produto padrao:', errProd)
    }

    // 7. Parâmetros de Integração Correios na coleção parametros_seguranca
    const paramSegCol = app.findCollectionByNameOrId('parametros_seguranca')
    try {
      app.findFirstRecordByData('parametros_seguranca', 'chave', 'CORREIOS_CONFIG')
    } catch (_) {
      const recCorreios = new Record(paramSegCol)
      recCorreios.set('chave', 'CORREIOS_CONFIG')
      recCorreios.set('valor_hash', 'PENDENTE_CADASTRO_TOKEN') // Campo obrigatório
      recCorreios.set(
        'descricao',
        'Configuração oficial de credencial/token dos Correios para cálculo Sedex/PAC em tempo real',
      )
      app.save(recCorreios)
    }
  },
  (app) => {
    try {
      const colFichas = app.findCollectionByNameOrId('fichas_producao')
      app.delete(colFichas)
    } catch (_) {}
    try {
      const colInsumos = app.findCollectionByNameOrId('insumos_producao')
      app.delete(colInsumos)
    } catch (_) {}
  },
)
