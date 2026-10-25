// pocketbase/migrations/0008_modulo_marketing_completo.js
// Migração para módulo de Marketing do sistema Bru Memórias Personalizados:
// - Novas coleções: personas, leads, lead_interacoes, calendario_editorial
// - Campos de persona em pessoas e leads
// - Semear valores na tabela_valores (canais de marketing, tipos de conteúdo, status do calendário, origens de lead, status do funil, motivos de perda)
// - Semear personas modelo do ateliê Bru Memórias (ex: Mães de Aniversariantes, Noivas / Casamentos, Pequenas Empresas / Brindes)
// - Semear publicações modelo e leads de demonstração funcional

migrate(
  (app) => {
    const usersColId = '_pb_users_auth_'
    const pessoasColId = app.findCollectionByNameOrId('pessoas').id
    const produtosColId = app.findCollectionByNameOrId('produtos').id

    // 1. Coleção: personas
    let colPersonas
    try {
      colPersonas = app.findCollectionByNameOrId('personas')
    } catch (_) {
      colPersonas = new Collection({
        name: 'personas',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.perfil = 'administrador' || @request.auth.perfil = 'gestor'",
        updateRule: "@request.auth.perfil = 'administrador' || @request.auth.perfil = 'gestor'",
        deleteRule: "@request.auth.perfil = 'administrador'",
        fields: [
          { name: 'nome', type: 'text', required: true },
          { name: 'descricao', type: 'text', required: false },
          { name: 'dores_desejos', type: 'text', required: false },
          { name: 'canais_principais', type: 'text', required: false }, // Ex: Instagram, WhatsApp
          { name: 'produtos_interesse', type: 'text', required: false },
          { name: 'faixa_valor_centavos', type: 'number', required: false }, // Faixa de ticket típico
          { name: 'ativo', type: 'bool', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE UNIQUE INDEX idx_personas_nome ON personas (nome)'],
      })
      app.save(colPersonas)
    }

    const personasColId = app.findCollectionByNameOrId('personas').id

    // 2. Adicionar persona na coleção pessoas (opcional para saber a persona do cliente)
    const colPessoas = app.findCollectionByNameOrId('pessoas')
    if (!colPessoas.fields.getByName('persona')) {
      colPessoas.fields.add(
        new RelationField({
          name: 'persona',
          required: false,
          collectionId: personasColId,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
      app.save(colPessoas)
    }

    // 3. Coleção: leads (Funil Comercial)
    // Permissões:
    // listRule: Administrador/Gestor veem tudo; vendedor vê apenas seus leads ou não atribuídos
    // createRule: Todos autenticados podem cadastrar leads
    // updateRule: Administrador/Gestor tudo; vendedor seus próprios leads
    let colLeads
    try {
      colLeads = app.findCollectionByNameOrId('leads')
    } catch (_) {
      colLeads = new Collection({
        name: 'leads',
        type: 'base',
        listRule:
          "@request.auth.id != '' && (@request.auth.perfil = 'administrador' || @request.auth.perfil = 'gestor' || @request.auth.perfil = 'consulta' || vendedor_responsavel = @request.auth.id || vendedor_responsavel = '')",
        viewRule:
          "@request.auth.id != '' && (@request.auth.perfil = 'administrador' || @request.auth.perfil = 'gestor' || @request.auth.perfil = 'consulta' || vendedor_responsavel = @request.auth.id || vendedor_responsavel = '')",
        createRule: "@request.auth.id != ''",
        updateRule:
          "@request.auth.id != '' && (@request.auth.perfil = 'administrador' || @request.auth.perfil = 'gestor' || vendedor_responsavel = @request.auth.id || vendedor_responsavel = '')",
        deleteRule:
          "@request.auth.id != '' && (@request.auth.perfil = 'administrador' || @request.auth.perfil = 'gestor')",
        fields: [
          { name: 'nome', type: 'text', required: true },
          { name: 'telefone_whatsapp', type: 'text', required: true },
          { name: 'email', type: 'text', required: false },
          { name: 'origem', type: 'text', required: true }, // Dominio origem_lead
          { name: 'interesse', type: 'text', required: false },
          { name: 'status_funil', type: 'text', required: true }, // Dominio status_lead_funil
          { name: 'motivo_perda', type: 'text', required: false }, // Dominio motivo_perda_lead
          { name: 'valor_estimado_centavos', type: 'number', required: false },
          {
            name: 'vendedor_responsavel',
            type: 'relation',
            required: false,
            collectionId: usersColId,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'persona',
            type: 'relation',
            required: false,
            collectionId: personasColId,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'cliente_convertido',
            type: 'relation',
            required: false,
            collectionId: pessoasColId,
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'data_conversao', type: 'date', required: false },
          { name: 'data_ultimo_contato', type: 'date', required: false },
          { name: 'observacoes', type: 'text', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_leads_status ON leads (status_funil)',
          'CREATE INDEX idx_leads_origem ON leads (origem)',
          'CREATE INDEX idx_leads_vendedor ON leads (vendedor_responsavel)',
          'CREATE INDEX idx_leads_ultimo_contato ON leads (data_ultimo_contato)',
        ],
      })
      app.save(colLeads)
    }

    const leadsColId = app.findCollectionByNameOrId('leads').id

    // 4. Coleção: lead_interacoes
    let colInteracoes
    try {
      colInteracoes = app.findCollectionByNameOrId('lead_interacoes')
    } catch (_) {
      colInteracoes = new Collection({
        name: 'lead_interacoes',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule:
          "@request.auth.id != '' && (@request.auth.perfil = 'administrador' || @request.auth.perfil = 'gestor' || usuario = @request.auth.id)",
        deleteRule:
          "@request.auth.id != '' && (@request.auth.perfil = 'administrador' || @request.auth.perfil = 'gestor')",
        fields: [
          {
            name: 'lead',
            type: 'relation',
            required: true,
            collectionId: leadsColId,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'data_hora', type: 'date', required: true },
          { name: 'tipo', type: 'text', required: true }, // mensagem_recebida, mensagem_enviada, ligacao, reuniao_visita, outro
          { name: 'anotacao', type: 'text', required: true },
          {
            name: 'usuario',
            type: 'relation',
            required: false,
            collectionId: usersColId,
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_lead_interacoes_lead ON lead_interacoes (lead, data_hora DESC)',
        ],
      })
      app.save(colInteracoes)
    }

    // 5. Coleção: calendario_editorial
    let colCalendario
    try {
      colCalendario = app.findCollectionByNameOrId('calendario_editorial')
    } catch (_) {
      colCalendario = new Collection({
        name: 'calendario_editorial',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule:
          "@request.auth.perfil = 'administrador' || @request.auth.perfil = 'gestor' || @request.auth.perfil = 'vendedor'",
        updateRule:
          "@request.auth.perfil = 'administrador' || @request.auth.perfil = 'gestor' || @request.auth.perfil = 'vendedor'",
        deleteRule: "@request.auth.perfil = 'administrador' || @request.auth.perfil = 'gestor'",
        fields: [
          { name: 'data_prevista', type: 'date', required: true },
          { name: 'canal', type: 'text', required: true }, // Dominio canal_marketing
          { name: 'titulo', type: 'text', required: true },
          { name: 'descricao', type: 'text', required: false },
          { name: 'tipo_conteudo', type: 'text', required: true }, // Dominio tipo_conteudo_editorial
          { name: 'status', type: 'text', required: true }, // Dominio status_publicacao
          { name: 'data_publicacao_real', type: 'date', required: false },
          {
            name: 'autor_publicacao',
            type: 'relation',
            required: false,
            collectionId: usersColId,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'produto_relacionado',
            type: 'relation',
            required: false,
            collectionId: produtosColId,
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'campanha', type: 'text', required: false },
          { name: 'link_publicacao', type: 'text', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_cal_data_prevista ON calendario_editorial (data_prevista)',
          'CREATE INDEX idx_cal_canal ON calendario_editorial (canal)',
          'CREATE INDEX idx_cal_status ON calendario_editorial (status)',
        ],
      })
      app.save(colCalendario)
    }

    // 6. Semear Domínios na Tabela de Valores
    const tabValCol = app.findCollectionByNameOrId('tabela_valores')
    const valoresMarketing = [
      // CANAL DE MARKETING
      { dominio: 'canal_marketing', codigo: 'instagram', rotulo: 'Instagram', ordem: 1 },
      {
        dominio: 'canal_marketing',
        codigo: 'whatsapp_status',
        rotulo: 'WhatsApp Status',
        ordem: 2,
      },
      {
        dominio: 'canal_marketing',
        codigo: 'whatsapp_direto',
        rotulo: 'WhatsApp Direto',
        ordem: 3,
      },
      { dominio: 'canal_marketing', codigo: 'facebook', rotulo: 'Facebook', ordem: 4 },
      { dominio: 'canal_marketing', codigo: 'tiktok', rotulo: 'TikTok', ordem: 5 },
      { dominio: 'canal_marketing', codigo: 'email', rotulo: 'E-mail', ordem: 6 },
      {
        dominio: 'canal_marketing',
        codigo: 'feira_evento',
        rotulo: 'Feira / Evento Presencial',
        ordem: 7,
      },

      // TIPO DE CONTEÚDO EDITORIAL
      { dominio: 'tipo_conteudo_editorial', codigo: 'promocao', rotulo: 'Promoção', ordem: 1 },
      {
        dominio: 'tipo_conteudo_editorial',
        codigo: 'novidade_produto',
        rotulo: 'Novidade de Produto',
        ordem: 2,
      },
      {
        dominio: 'tipo_conteudo_editorial',
        codigo: 'bastidor_atelie',
        rotulo: 'Bastidor do Ateliê',
        ordem: 3,
      },
      {
        dominio: 'tipo_conteudo_editorial',
        codigo: 'depoimento_cliente',
        rotulo: 'Depoimento de Cliente',
        ordem: 4,
      },
      {
        dominio: 'tipo_conteudo_editorial',
        codigo: 'data_comemorativa',
        rotulo: 'Data Comemorativa',
        ordem: 5,
      },
      {
        dominio: 'tipo_conteudo_editorial',
        codigo: 'conteudo_educativo',
        rotulo: 'Conteúdo Educativo',
        ordem: 6,
      },

      // STATUS DE PUBLICAÇÃO
      { dominio: 'status_publicacao', codigo: 'ideia', rotulo: 'Ideia', ordem: 1 },
      { dominio: 'status_publicacao', codigo: 'planejada', rotulo: 'Planejada', ordem: 2 },
      { dominio: 'status_publicacao', codigo: 'producao', rotulo: 'Em Produção', ordem: 3 },
      { dominio: 'status_publicacao', codigo: 'pronta', rotulo: 'Pronta', ordem: 4 },
      { dominio: 'status_publicacao', codigo: 'publicada', rotulo: 'Publicada', ordem: 5 },
      { dominio: 'status_publicacao', codigo: 'cancelada', rotulo: 'Cancelada', ordem: 6 },

      // ORIGEM DO LEAD
      { dominio: 'origem_lead', codigo: 'instagram', rotulo: 'Instagram', ordem: 1 },
      { dominio: 'origem_lead', codigo: 'indicacao', rotulo: 'Indicação de Cliente', ordem: 2 },
      { dominio: 'origem_lead', codigo: 'feira_evento', rotulo: 'Feira / Evento', ordem: 3 },
      { dominio: 'origem_lead', codigo: 'whatsapp', rotulo: 'WhatsApp Direto', ordem: 4 },
      { dominio: 'origem_lead', codigo: 'site_google', rotulo: 'Site / Busca Google', ordem: 5 },
      { dominio: 'origem_lead', codigo: 'outro', rotulo: 'Outro Canal', ordem: 6 },

      // STATUS DO FUNIL DE LEADS
      { dominio: 'status_lead_funil', codigo: 'novo_contato', rotulo: 'Novo Contato', ordem: 1 },
      {
        dominio: 'status_lead_funil',
        codigo: 'atendimento_iniciado',
        rotulo: 'Atendimento Iniciado',
        ordem: 2,
      },
      {
        dominio: 'status_lead_funil',
        codigo: 'orcamento_enviado',
        rotulo: 'Orçamento Enviado',
        ordem: 3,
      },
      { dominio: 'status_lead_funil', codigo: 'negociacao', rotulo: 'Em Negociação', ordem: 4 },
      { dominio: 'status_lead_funil', codigo: 'fechado_ganho', rotulo: 'Fechado Ganho', ordem: 5 },
      {
        dominio: 'status_lead_funil',
        codigo: 'fechado_perdido',
        rotulo: 'Fechado Perdido',
        ordem: 6,
      },
      { dominio: 'status_lead_funil', codigo: 'sem_resposta', rotulo: 'Sem Resposta', ordem: 7 },

      // MOTIVO DE PERDA DE LEAD
      { dominio: 'motivo_perda_lead', codigo: 'preco', rotulo: 'Preço / Orçamento', ordem: 1 },
      { dominio: 'motivo_perda_lead', codigo: 'prazo', rotulo: 'Prazo de Entrega', ordem: 2 },
      { dominio: 'motivo_perda_lead', codigo: 'desistiu', rotulo: 'Desistiu da Compra', ordem: 3 },
      { dominio: 'motivo_perda_lead', codigo: 'sem_resposta', rotulo: 'Sem Resposta', ordem: 4 },
      { dominio: 'motivo_perda_lead', codigo: 'outro', rotulo: 'Outro Motivo', ordem: 5 },

      // TIPO DE INTERAÇÃO COM LEAD
      {
        dominio: 'tipo_interacao_lead',
        codigo: 'mensagem_recebida',
        rotulo: 'Mensagem Recebida',
        ordem: 1,
      },
      {
        dominio: 'tipo_interacao_lead',
        codigo: 'mensagem_enviada',
        rotulo: 'Mensagem Enviada',
        ordem: 2,
      },
      { dominio: 'tipo_interacao_lead', codigo: 'ligacao', rotulo: 'Ligação Telefônica', ordem: 3 },
      {
        dominio: 'tipo_interacao_lead',
        codigo: 'reuniao_visita',
        rotulo: 'Reunião / Atendimento Presencial',
        ordem: 4,
      },
      { dominio: 'tipo_interacao_lead', codigo: 'outro', rotulo: 'Outra Interação', ordem: 5 },
    ]

    for (let k = 0; k < valoresMarketing.length; k++) {
      const v = valoresMarketing[k]
      try {
        app.findFirstRecordByFilter(
          'tabela_valores',
          `dominio = '${v.dominio}' && codigo = '${v.codigo}'`,
        )
      } catch (_) {
        const rec = new Record(tabValCol)
        rec.set('dominio', v.dominio)
        rec.set('codigo', v.codigo)
        rec.set('rotulo', v.rotulo)
        rec.set('ordem', v.ordem)
        rec.set('ativo', true)
        rec.set('regras_json', {})
        app.save(rec)
      }
    }

    // 7. Semear Personas Modelo da Bru Memórias
    const colPersonasRef = app.findCollectionByNameOrId('personas')
    const personasIniciais = [
      {
        nome: 'Mãe do Aniversariante',
        descricao:
          'Mãe organizando a festa infantil do filho(a), buscando lembrancinhas afetivas de alta durabilidade e acabamento fotográfico.',
        dores_desejos:
          'Quer encantar os convidados com fotos reais da criança; teme atraso na entrega ou desbotamento do papel; busca praticidade no pedido.',
        canais_principais: 'Instagram, WhatsApp',
        produtos_interesse:
          'Kit ímãs Polaroid 5x5 cm com embalagem individual solapa personalizada',
        faixa_valor_centavos: 12000, // R$ 120,00 (ex: 30 a 50 ímãs)
      },
      {
        nome: 'Noiva / Lembrança de Casamento',
        descricao:
          'Noiva buscando lembrancinhas sofisticadas com fotos do ensaio pré-wedding ou fotos impressas durante o evento.',
        dores_desejos:
          'Exige acabamento impecável, fidelidade de cores, embalagem delicada e entrega com antecedência garantida ao casamento.',
        canais_principais: 'Instagram, Feiras de Noivas, Indicação de Cerimonialista',
        produtos_interesse:
          'Ímãs 5x5 cm acabamento brilho com moldura polaroid e cartão de agradecimento',
        faixa_valor_centavos: 35000, // R$ 350,00 (lotes maiores 100+ ímãs)
      },
      {
        nome: 'Empreendedora / Brinde Corporativo',
        descricao:
          'Pequenas empresárias, confeiteiras e fotógrafas buscando mimos e brindes de fidelização para seus clientes no Rio de Janeiro.',
        dores_desejos:
          'Precisa de custo unitário competitivo no atacado, rapidez no ateliê e emissão de comprovante/recibo com dados cadastrais.',
        canais_principais: 'WhatsApp Direto, Instagram, Google',
        produtos_interesse: 'Lotes de 50 a 200 ímãs com logomarca e calendário do ateliê',
        faixa_valor_centavos: 25000, // R$ 250,00
      },
    ]

    const idsPersonasMap = {}
    for (let p = 0; p < personasIniciais.length; p++) {
      const per = personasIniciais[p]
      try {
        const achou = app.findFirstRecordByData('personas', 'nome', per.nome)
        idsPersonasMap[per.nome] = achou.id
      } catch (_) {
        const rec = new Record(colPersonasRef)
        rec.set('nome', per.nome)
        rec.set('descricao', per.descricao)
        rec.set('dores_desejos', per.dores_desejos)
        rec.set('canais_principais', per.canais_principais)
        rec.set('produtos_interesse', per.produtos_interesse)
        rec.set('faixa_valor_centavos', per.faixa_valor_centavos)
        rec.set('ativo', true)
        app.save(rec)
        idsPersonasMap[per.nome] = rec.id
      }
    }

    // 8. Semear Publicações no Calendário Editorial
    const colCalRef = app.findCollectionByNameOrId('calendario_editorial')
    let prodImasId = ''
    try {
      prodImasId = app.findFirstRecordByData('produtos', 'sku', 'IMA-POL-5X5').id
    } catch (_) {}

    let adminId = ''
    try {
      adminId = app.findAuthRecordByEmail('_pb_users_auth_', 'caiocesarfmatos@gmail.com').id
    } catch (_) {}

    const hoje = new Date()
    const fmtData = (offsetDias) => {
      const d = new Date(hoje)
      d.setDate(hoje.getDate() + offsetDias)
      return d.toISOString().split('T')[0] + ' 12:00:00.000Z'
    }

    const postsIniciais = [
      {
        titulo: 'Bastidores: Laminação com Película BOPP Brilho',
        descricao:
          'Mostrar nos Stories do Instagram o corte e laminação protetora dos ímãs 5x5 cm que garantem resistência contra raios UV e umidade.',
        canal: 'instagram',
        tipo_conteudo: 'bastidor_atelie',
        status: 'planejada',
        data_prevista: fmtData(1),
        campanha: 'Qualidade do Ateliê',
      },
      {
        titulo: 'Depoimento da Semana: Lembrancinhas do Aniversário de 1 Ano',
        descricao:
          'Publicação com carrossel de fotos reais enviadas pela cliente Mariana, mostrando os ímãs fixados na geladeira da família.',
        canal: 'instagram',
        tipo_conteudo: 'depoimento_cliente',
        status: 'publicada',
        data_prevista: fmtData(-2),
        data_publicacao_real: fmtData(-2),
        campanha: 'Clientes Felizes',
      },
      {
        titulo: 'Status WhatsApp: Lote Especial para Feira da Barra da Tijuca',
        descricao: 'Foto dos saquinhos transparentes com solapa montados para entrega rápida.',
        canal: 'whatsapp_status',
        tipo_conteudo: 'novidade_produto',
        status: 'planejada',
        data_prevista: fmtData(3),
        campanha: 'Feiras RJ',
      },
      {
        titulo: 'Dicas de como escolher as fotos mais nítidas para seus ímãs',
        descricao:
          'Post educativo orientando clientes a enviarem fotos sem compressão do WhatsApp para máxima fidelidade na impressão fotográfica.',
        canal: 'instagram',
        tipo_conteudo: 'conteudo_educativo',
        status: 'ideia',
        data_prevista: fmtData(5),
        campanha: 'Atendimento Educativo',
      },
    ]

    for (let c = 0; c < postsIniciais.length; c++) {
      const post = postsIniciais[c]
      try {
        app.findFirstRecordByData('calendario_editorial', 'titulo', post.titulo)
      } catch (_) {
        const rec = new Record(colCalRef)
        rec.set('titulo', post.titulo)
        rec.set('descricao', post.descricao)
        rec.set('canal', post.canal)
        rec.set('tipo_conteudo', post.tipo_conteudo)
        rec.set('status', post.status)
        rec.set('data_prevista', post.data_prevista)
        if (post.data_publicacao_real) {
          rec.set('data_publicacao_real', post.data_publicacao_real)
        }
        if (prodImasId) rec.set('produto_relacionado', prodImasId)
        if (adminId) rec.set('autor_publicacao', adminId)
        rec.set('campanha', post.campanha)
        app.save(rec)
      }
    }

    // 9. Semear Leads no Funil Comercial
    const colLeadsRef = app.findCollectionByNameOrId('leads')
    const colInteracoesRef = app.findCollectionByNameOrId('lead_interacoes')

    const leadsIniciais = [
      {
        nome: 'Camila Ferreira',
        telefone_whatsapp: '+5521991234567',
        email: 'camila.ferreira@gmail.com',
        origem: 'instagram',
        interesse: '40 ímãs polaroid para aniversário de 2 anos',
        status_funil: 'orcamento_enviado',
        valor_estimado_centavos: 16000,
        personaNome: 'Mãe do Aniversariante',
        data_ultimo_contato: fmtData(-1),
        observacoes: 'Pediu orçamento com entrega no Recreio dos Bandeirantes',
        interacoes: [
          {
            tipo: 'mensagem_recebida',
            anotacao:
              'Perguntou no direct do Instagram sobre valor para 40 unidades e prazo de produção.',
            offsetDias: -2,
          },
          {
            tipo: 'mensagem_enviada',
            anotacao: 'Enviada tabela de preços e prazo de 2 dias úteis via WhatsApp.',
            offsetDias: -1,
          },
        ],
      },
      {
        nome: 'Larissa Moura',
        telefone_whatsapp: '+5521987654321',
        email: 'larissa.noiva@gmail.com',
        origem: 'indicacao',
        interesse: '120 ímãs de lembrança com foto do pré-wedding',
        status_funil: 'negociacao',
        valor_estimado_centavos: 42000,
        personaNome: 'Noiva / Lembrança de Casamento',
        data_ultimo_contato: fmtData(-3),
        observacoes: 'Casamento em dezembro. Quer amostra física do acabamento brilhoso.',
        interacoes: [
          {
            tipo: 'mensagem_recebida',
            anotacao: 'Indicação da fotógrafa Ana Paula para ímãs de casamento.',
            offsetDias: -5,
          },
          {
            tipo: 'ligacao',
            anotacao: 'Alinhamento dos prazos de envio das fotos em alta resolução.',
            offsetDias: -3,
          },
        ],
      },
      {
        nome: 'Rodrigo Vasconcelos',
        telefone_whatsapp: '+5521971112233',
        email: 'rodrigo.v@empresa.com.br',
        origem: 'site_google',
        interesse: '200 ímãs corporativos com logo da clínica',
        status_funil: 'novo_contato',
        valor_estimado_centavos: 70000,
        personaNome: 'Empreendedora / Brinde Corporativo',
        data_ultimo_contato: fmtData(0),
        observacoes: 'Solicitou nota fiscal e prazo para pagamento via Pix PJ.',
        interacoes: [
          {
            tipo: 'mensagem_recebida',
            anotacao: 'Primeiro contato via formulário do WhatsApp perguntando prazo.',
            offsetDias: 0,
          },
        ],
      },
    ]

    for (let l = 0; l < leadsIniciais.length; l++) {
      const ld = leadsIniciais[l]
      let leadGravadoId = ''
      try {
        const achou = app.findFirstRecordByData('leads', 'telefone_whatsapp', ld.telefone_whatsapp)
        leadGravadoId = achou.id
      } catch (_) {
        const rec = new Record(colLeadsRef)
        rec.set('nome', ld.nome)
        rec.set('telefone_whatsapp', ld.telefone_whatsapp)
        rec.set('email', ld.email)
        rec.set('origem', ld.origem)
        rec.set('interesse', ld.interesse)
        rec.set('status_funil', ld.status_funil)
        rec.set('valor_estimado_centavos', ld.valor_estimado_centavos)
        if (adminId) rec.set('vendedor_responsavel', adminId)
        if (idsPersonasMap[ld.personaNome]) {
          rec.set('persona', idsPersonasMap[ld.personaNome])
        }
        rec.set('data_ultimo_contato', ld.data_ultimo_contato)
        rec.set('observacoes', ld.observacoes)
        app.save(rec)
        leadGravadoId = rec.id

        // Salva interações vinculadas
        if (ld.interacoes && ld.interacoes.length > 0) {
          for (let it = 0; it < ld.interacoes.length; it++) {
            const inter = ld.interacoes[it]
            const recIt = new Record(colInteracoesRef)
            recIt.set('lead', leadGravadoId)
            recIt.set('tipo', inter.tipo)
            recIt.set('anotacao', inter.anotacao)
            recIt.set('data_hora', fmtData(inter.offsetDias))
            if (adminId) recIt.set('usuario', adminId)
            app.save(recIt)
          }
        }
      }
    }
  },
  (app) => {
    // Reversão limpa
    try {
      const c1 = app.findCollectionByNameOrId('lead_interacoes')
      app.delete(c1)
    } catch (_) {}
    try {
      const c2 = app.findCollectionByNameOrId('leads')
      app.delete(c2)
    } catch (_) {}
    try {
      const c3 = app.findCollectionByNameOrId('calendario_editorial')
      app.delete(c3)
    } catch (_) {}
    try {
      const c4 = app.findCollectionByNameOrId('personas')
      app.delete(c4)
    } catch (_) {}
  },
)
