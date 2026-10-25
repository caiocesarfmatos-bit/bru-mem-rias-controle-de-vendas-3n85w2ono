migrate(
  (app) => {
    // 1. Atualizar ou resetar a senha do usuário Administrador principal
    try {
      const adminUser = app.findAuthRecordByEmail('_pb_users_auth_', 'caiocesarfmatos@gmail.com')
      adminUser.setPassword('Skip@Pass123')
      adminUser.setVerified(true)
      adminUser.set('perfil', 'administrador')
      adminUser.set('ativo', true)
      adminUser.set('tentativas_falhas', 0)
      adminUser.set('bloqueado_ate', '')
      app.save(adminUser)
    } catch (_) {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      const newAdmin = new Record(usersCol)
      newAdmin.setEmail('caiocesarfmatos@gmail.com')
      newAdmin.setPassword('Skip@Pass123')
      newAdmin.setVerified(true)
      newAdmin.set('name', 'Administrador Bru Memórias')
      newAdmin.set('perfil', 'administrador')
      newAdmin.set('ativo', true)
      newAdmin.set('tentativas_falhas', 0)
      app.save(newAdmin)
    }

    // 2. Criar coleção para armazenar snapshots dos backups robotizados e manuais
    if (!app.hasTable('backups_sistema')) {
      const colBackups = new Collection({
        name: 'backups_sistema',
        type: 'base',
        listRule: "@request.auth.id != '' && @request.auth.perfil = 'administrador'",
        viewRule: "@request.auth.id != '' && @request.auth.perfil = 'administrador'",
        createRule: null, // Apenas hooks e superuser / server criam registros
        updateRule: null,
        deleteRule: null,
        fields: [
          {
            name: 'tipo',
            type: 'select',
            required: true,
            values: ['automatico', 'manual'],
            maxSelect: 1,
          },
          { name: 'status', type: 'select', required: true, values: ['ok', 'falha'], maxSelect: 1 },
          { name: 'horario_agendado', type: 'text' },
          { name: 'data_hora', type: 'text', required: true },
          { name: 'total_colecoes', type: 'number' },
          { name: 'total_registros', type: 'number' },
          { name: 'tamanho_bytes', type: 'number' },
          { name: 'resumo_contagens', type: 'json' },
          { name: 'detalhe_erro', type: 'text' },
          { name: 'correlation_id', type: 'text' },
          { name: 'dados_json', type: 'json' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_bk_created ON backups_sistema (created DESC)',
          'CREATE INDEX idx_bk_status ON backups_sistema (status)',
        ],
      })
      app.save(colBackups)
    }

    // 3. Criar coleção para armazenar configuração de segurança do código restrito (hash SHA-256)
    // Sem acesso público nem direto por usuários comuns (createRule/updateRule/deleteRule = null)
    if (!app.hasTable('parametros_seguranca')) {
      const colSeg = new Collection({
        name: 'parametros_seguranca',
        type: 'base',
        listRule: null, // Segredos nunca podem ser listados pelo cliente
        viewRule: null,
        createRule: null,
        updateRule: null,
        deleteRule: null,
        fields: [
          { name: 'chave', type: 'text', required: true },
          { name: 'valor_hash', type: 'text', required: true },
          { name: 'descricao', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE UNIQUE INDEX idx_param_seg_chave ON parametros_seguranca (chave)'],
      })
      app.save(colSeg)
    }

    // Inicializar o hash do código restrito do ADM ("501698")
    // SHA-256 de "501698" calculado via $security.sha256("501698")
    try {
      const paramCol = app.findCollectionByNameOrId('parametros_seguranca')
      try {
        app.findFirstRecordByData('parametros_seguranca', 'chave', 'CODIGO_RESTRITO_ADM')
      } catch (_) {
        const hash501698 = $security.sha256('501698')
        const recSeg = new Record(paramCol)
        recSeg.set('chave', 'CODIGO_RESTRITO_ADM')
        recSeg.set('valor_hash', hash501698)
        recSeg.set(
          'descricao',
          'Hash SHA-256 do código de acesso restrito exclusivo do Administrador',
        )
        app.save(recSeg)
      }
    } catch (errSeg) {
      console.error('Erro ao semear parametros_seguranca:', errSeg)
    }
  },
  (app) => {
    try {
      const colBk = app.findCollectionByNameOrId('backups_sistema')
      app.delete(colBk)
    } catch (_) {}
    try {
      const colSeg = app.findCollectionByNameOrId('parametros_seguranca')
      app.delete(colSeg)
    } catch (_) {}
  },
)
