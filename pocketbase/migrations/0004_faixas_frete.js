migrate(
  (app) => {
    // 1. Criar coleção faixas_frete
    const faixasFrete = new Collection({
      name: 'faixas_frete',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.perfil = 'administrador' || @request.auth.perfil = 'gestor'",
      updateRule: "@request.auth.perfil = 'administrador' || @request.auth.perfil = 'gestor'",
      deleteRule: "@request.auth.perfil = 'administrador'",
      fields: [
        { name: 'nome', type: 'text', required: true },
        {
          name: 'regiao_destino',
          type: 'select',
          required: true,
          values: [
            'RJ_CAPITAL',
            'RJ_INTERIOR',
            'SUDESTE',
            'SUL',
            'CENTRO_OESTE',
            'NORDESTE',
            'NORTE',
            'NACIONAL',
          ],
          maxSelect: 1,
        },
        { name: 'uf_destino', type: 'text' },
        {
          name: 'modalidade',
          type: 'select',
          required: true,
          values: ['RETIRADA_ATELIE', 'MOTOBOY_LOCAL', 'PAC', 'SEDEX', 'TRANSPORTADORA'],
          maxSelect: 1,
        },
        {
          name: 'tipo_faixa',
          type: 'select',
          required: true,
          values: ['peso_gramas', 'valor_pedido_centavos', 'quantidade_itens'],
          maxSelect: 1,
        },
        { name: 'faixa_minima', type: 'number' },
        { name: 'faixa_maxima', type: 'number' },
        { name: 'preco_centavos', type: 'number' },
        { name: 'prazo_dias_estimado', type: 'number' },
        { name: 'ativo', type: 'bool' },
        { name: 'observacao', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_faixas_frete_regiao ON faixas_frete (regiao_destino, ativo)',
        'CREATE INDEX idx_faixas_frete_modalidade ON faixas_frete (modalidade)',
      ],
    })
    app.save(faixasFrete)

    // 2. Adicionar novos domínios à tabela_valores para integridade de catálogo
    const tabValCol = app.findCollectionByNameOrId('tabela_valores')
    const valoresNovos = [
      // Regiões de frete
      {
        dominio: 'regiao_frete',
        codigo: 'RJ_CAPITAL',
        rotulo: 'Rio de Janeiro (Capital)',
        ordem: 1,
        ativo: true,
        regras_json: { ufs: ['RJ'], cidade: 'Rio de Janeiro' },
      },
      {
        dominio: 'regiao_frete',
        codigo: 'RJ_INTERIOR',
        rotulo: 'Rio de Janeiro (Região Metropolitana / Interior)',
        ordem: 2,
        ativo: true,
        regras_json: { ufs: ['RJ'] },
      },
      {
        dominio: 'regiao_frete',
        codigo: 'SUDESTE',
        rotulo: 'Sudeste (SP, MG, ES)',
        ordem: 3,
        ativo: true,
        regras_json: { ufs: ['SP', 'MG', 'ES'] },
      },
      {
        dominio: 'regiao_frete',
        codigo: 'SUL',
        rotulo: 'Sul (PR, SC, RS)',
        ordem: 4,
        ativo: true,
        regras_json: { ufs: ['PR', 'SC', 'RS'] },
      },
      {
        dominio: 'regiao_frete',
        codigo: 'CENTRO_OESTE',
        rotulo: 'Centro-Oeste (DF, GO, MT, MS)',
        ordem: 5,
        ativo: true,
        regras_json: { ufs: ['DF', 'GO', 'MT', 'MS'] },
      },
      {
        dominio: 'regiao_frete',
        codigo: 'NORDESTE',
        rotulo: 'Nordeste (BA, PE, CE, MA, PB, RN, AL, SE, PI)',
        ordem: 6,
        ativo: true,
        regras_json: { ufs: ['BA', 'PE', 'CE', 'MA', 'PB', 'RN', 'AL', 'SE', 'PI'] },
      },
      {
        dominio: 'regiao_frete',
        codigo: 'NORTE',
        rotulo: 'Norte (AM, PA, AC, RO, RR, AP, TO)',
        ordem: 7,
        ativo: true,
        regras_json: { ufs: ['AM', 'PA', 'AC', 'RO', 'RR', 'AP', 'TO'] },
      },
      {
        dominio: 'regiao_frete',
        codigo: 'NACIONAL',
        rotulo: 'Brasil (Todas as Regiões)',
        ordem: 8,
        ativo: true,
        regras_json: { ufs: [] },
      },

      // Modalidades de transporte
      {
        dominio: 'modalidade_frete',
        codigo: 'RETIRADA_ATELIE',
        rotulo: 'Retirada no Ateliê (Recreio dos Bandeirantes)',
        ordem: 1,
        ativo: true,
        regras_json: { custo_zero: true, origem: 'Recreio dos Bandeirantes, RJ' },
      },
      {
        dominio: 'modalidade_frete',
        codigo: 'MOTOBOY_LOCAL',
        rotulo: 'Entrega Expressa Motoboy (Barra/Recreio/Zona Oeste)',
        ordem: 2,
        ativo: true,
        regras_json: { expressa: true },
      },
      {
        dominio: 'modalidade_frete',
        codigo: 'SEDEX',
        rotulo: 'Sedex Postal Expresso',
        ordem: 3,
        ativo: true,
        regras_json: { postal: true, rastreio: true },
      },
      {
        dominio: 'modalidade_frete',
        codigo: 'PAC',
        rotulo: 'PAC Postal Econômico',
        ordem: 4,
        ativo: true,
        regras_json: { postal: true, rastreio: true },
      },
      {
        dominio: 'modalidade_frete',
        codigo: 'TRANSPORTADORA',
        rotulo: 'Transportadora Rodoviária / Aérea',
        ordem: 5,
        ativo: true,
        regras_json: { rastreio: true },
      },
    ]

    for (let i = 0; i < valoresNovos.length; i++) {
      const item = valoresNovos[i]
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

    // 3. Carga inicial de faixas de frete próprias do negócio (Ímãs 5x5 cm saindo do Recreio dos Bandeirantes, RJ)
    const faixasCol = app.findCollectionByNameOrId('faixas_frete')
    const faixasIniciais = [
      // Retirada no Ateliê (Recreio) — Custo R$ 0,00
      {
        nome: 'Retirada no Ateliê (Recreio dos Bandeirantes)',
        regiao_destino: 'RJ_CAPITAL',
        uf_destino: 'RJ',
        modalidade: 'RETIRADA_ATELIE',
        tipo_faixa: 'peso_gramas',
        faixa_minima: 0,
        faixa_maxima: 50000,
        preco_centavos: 0,
        prazo_dias_estimado: 1,
        ativo: true,
        observacao: 'Disponível após aprovação e finalização no ateliê no Recreio.',
      },
      // Motoboy Barra / Recreio / Jacarepaguá
      {
        nome: 'Motoboy Expresso Local (Barra / Recreio)',
        regiao_destino: 'RJ_CAPITAL',
        uf_destino: 'RJ',
        modalidade: 'MOTOBOY_LOCAL',
        tipo_faixa: 'peso_gramas',
        faixa_minima: 0,
        faixa_maxima: 2000,
        preco_centavos: 1800, // R$ 18,00
        prazo_dias_estimado: 1,
        ativo: true,
        observacao: 'Entrega porta a porta agendada na Barra da Tijuca e Recreio.',
      },
      // RJ Capital — Sedex Econômico até 500g (~20 ímãs)
      {
        nome: 'Sedex RJ Capital até 500g',
        regiao_destino: 'RJ_CAPITAL',
        uf_destino: 'RJ',
        modalidade: 'SEDEX',
        tipo_faixa: 'peso_gramas',
        faixa_minima: 0,
        faixa_maxima: 500,
        preco_centavos: 1550, // R$ 15,50
        prazo_dias_estimado: 2,
        ativo: true,
        observacao: 'Envio prioritário para a cidade do Rio de Janeiro.',
      },
      // RJ Capital — Sedex até 1kg (~40 ímãs)
      {
        nome: 'Sedex RJ Capital até 1kg',
        regiao_destino: 'RJ_CAPITAL',
        uf_destino: 'RJ',
        modalidade: 'SEDEX',
        tipo_faixa: 'peso_gramas',
        faixa_minima: 501,
        faixa_maxima: 1000,
        preco_centavos: 1950, // R$ 19,50
        prazo_dias_estimado: 2,
        ativo: true,
        observacao: 'Pacotes médios cidade do Rio de Janeiro.',
      },
      // RJ Interior — PAC Econômico até 1kg
      {
        nome: 'PAC RJ Interior até 1kg',
        regiao_destino: 'RJ_INTERIOR',
        uf_destino: 'RJ',
        modalidade: 'PAC',
        tipo_faixa: 'peso_gramas',
        faixa_minima: 0,
        faixa_maxima: 1000,
        preco_centavos: 2100, // R$ 21,00
        prazo_dias_estimado: 4,
        ativo: true,
        observacao: 'Niterói, Baixada, Região dos Lagos e Serrana.',
      },
      // RJ Interior — Sedex até 1kg
      {
        nome: 'Sedex RJ Interior até 1kg',
        regiao_destino: 'RJ_INTERIOR',
        uf_destino: 'RJ',
        modalidade: 'SEDEX',
        tipo_faixa: 'peso_gramas',
        faixa_minima: 0,
        faixa_maxima: 1000,
        preco_centavos: 2600, // R$ 26,00
        prazo_dias_estimado: 2,
        ativo: true,
        observacao: 'Envio rápido municípios do estado do RJ.',
      },
      // Sudeste (SP, MG, ES) — PAC até 1kg
      {
        nome: 'PAC Sudeste (SP, MG, ES) até 1kg',
        regiao_destino: 'SUDESTE',
        uf_destino: '',
        modalidade: 'PAC',
        tipo_faixa: 'peso_gramas',
        faixa_minima: 0,
        faixa_maxima: 1000,
        preco_centavos: 2500, // R$ 25,00
        prazo_dias_estimado: 6,
        ativo: true,
        observacao: 'São Paulo, Minas Gerais e Espírito Santo.',
      },
      // Sudeste — Sedex até 1kg
      {
        nome: 'Sedex Sudeste até 1kg',
        regiao_destino: 'SUDESTE',
        uf_destino: '',
        modalidade: 'SEDEX',
        tipo_faixa: 'peso_gramas',
        faixa_minima: 0,
        faixa_maxima: 1000,
        preco_centavos: 3400, // R$ 34,00
        prazo_dias_estimado: 3,
        ativo: true,
        observacao: 'Sedex interestadual região Sudeste.',
      },
      // Sul (PR, SC, RS) — PAC até 1kg
      {
        nome: 'PAC Região Sul até 1kg',
        regiao_destino: 'SUL',
        uf_destino: '',
        modalidade: 'PAC',
        tipo_faixa: 'peso_gramas',
        faixa_minima: 0,
        faixa_maxima: 1000,
        preco_centavos: 2900, // R$ 29,00
        prazo_dias_estimado: 7,
        ativo: true,
        observacao: 'Paraná, Santa Catarina e Rio Grande do Sul.',
      },
      // Centro-Oeste — PAC até 1kg
      {
        nome: 'PAC Centro-Oeste até 1kg',
        regiao_destino: 'CENTRO_OESTE',
        uf_destino: '',
        modalidade: 'PAC',
        tipo_faixa: 'peso_gramas',
        faixa_minima: 0,
        faixa_maxima: 1000,
        preco_centavos: 3200, // R$ 32,00
        prazo_dias_estimado: 8,
        ativo: true,
        observacao: 'Distrito Federal, Goiás, Mato Grosso e Mato Grosso do Sul.',
      },
      // Nordeste — PAC até 1kg
      {
        nome: 'PAC Região Nordeste até 1kg',
        regiao_destino: 'NORDESTE',
        uf_destino: '',
        modalidade: 'PAC',
        tipo_faixa: 'peso_gramas',
        faixa_minima: 0,
        faixa_maxima: 1000,
        preco_centavos: 3500, // R$ 35,00
        prazo_dias_estimado: 9,
        ativo: true,
        observacao: 'Capitais e interior dos estados nordestinos.',
      },
      // Norte — PAC até 1kg
      {
        nome: 'PAC Região Norte até 1kg',
        regiao_destino: 'NORTE',
        uf_destino: '',
        modalidade: 'PAC',
        tipo_faixa: 'peso_gramas',
        faixa_minima: 0,
        faixa_maxima: 1000,
        preco_centavos: 4200, // R$ 42,00
        prazo_dias_estimado: 12,
        ativo: true,
        observacao: 'Estados da região Norte.',
      },
      // Faixa de Frete Grátis por Valor — Pedidos acima de R$ 250,00 para RJ Capital
      {
        nome: 'Frete Grátis RJ Capital (Pedidos acima de R$ 250)',
        regiao_destino: 'RJ_CAPITAL',
        uf_destino: 'RJ',
        modalidade: 'SEDEX',
        tipo_faixa: 'valor_pedido_centavos',
        faixa_minima: 25000, // R$ 250,00
        faixa_maxima: 99999999,
        preco_centavos: 0,
        prazo_dias_estimado: 3,
        ativo: true,
        observacao: 'Promoção automática para compras acima de R$ 250 na cidade do Rio de Janeiro.',
      },
    ]

    for (let j = 0; j < faixasIniciais.length; j++) {
      const f = faixasIniciais[j]
      try {
        const existing = app.findFirstRecordByFilter('faixas_frete', `nome = '${f.nome}'`)
        if (existing) continue
      } catch (_) {}

      const recFaixa = new Record(faixasCol)
      recFaixa.set('nome', f.nome)
      recFaixa.set('regiao_destino', f.regiao_destino)
      recFaixa.set('uf_destino', f.uf_destino)
      recFaixa.set('modalidade', f.modalidade)
      recFaixa.set('tipo_faixa', f.tipo_faixa)
      recFaixa.set('faixa_minima', f.faixa_minima)
      recFaixa.set('faixa_maxima', f.faixa_maxima)
      recFaixa.set('preco_centavos', f.preco_centavos)
      recFaixa.set('prazo_dias_estimado', f.prazo_dias_estimado)
      recFaixa.set('ativo', f.ativo)
      recFaixa.set('observacao', f.observacao)
      app.save(recFaixa)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('faixas_frete')
      app.delete(col)
    } catch (_) {}
  },
)
