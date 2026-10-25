// pocketbase/hooks/transacoes.pb.js
// Endpoints e validações server-side para integridade transacional, imutabilidade, auditoria,
// rotina de backup robotizado (10h, 17h, 23h Brasília) e código restrito de acesso do ADM.

// =========================================================================
// 1. CRON JOBS — BACKUP AUTOMÁTICO E ROBOTIZADO (10h, 17h, 23h Brasília)
// =========================================================================
// Horário oficial de Brasília (America/Sao_Paulo) é UTC-3 permanente.
// 10:00 Brasília = 13:00 UTC -> cron "0 13 * * *"
// 17:00 Brasília = 20:00 UTC -> cron "0 20 * * *"
// 23:00 Brasília = 02:00 UTC (dia seguinte) -> cron "0 2 * * *"

cronAdd('backup_auto_10h_brasilia', '0 13 * * *', () => {
  const colecoes = [
    'tabela_valores',
    'pessoas',
    'papel_cliente',
    'papel_fornecedor',
    'contatos',
    'enderecos',
    'redes_sociais',
    'categorias_produto',
    'produtos',
    'tabelas_preco',
    'precos_produto',
    'produto_fornecedor',
    'locais_estoque',
    'movimento_estoque',
    'pedidos_venda',
    'itens_pedido',
    'pagamentos_pedido',
    'contas_financeiras',
    'categorias_financeiras',
    'lancamentos_financeiros',
    'logs_auditoria',
  ]
  const correlationId = 'BK-AUTO-10H-' + Date.now()
  const agoraIso = new Date().toISOString()
  const snapshot = {}
  const contagens = {}
  let totalRegistros = 0
  let statusFinal = 'ok'
  let detalheErro = ''

  for (let i = 0; i < colecoes.length; i++) {
    const nomeCol = colecoes[i]
    try {
      const registros = $app.findRecordsByFilter(nomeCol, 'id != ""', 'created', 10000, 0)
      const serializados = []
      for (let r = 0; r < registros.length; r++) {
        serializados.push(registros[r].publicExport())
      }
      snapshot[nomeCol] = serializados
      contagens[nomeCol] = serializados.length
      totalRegistros += serializados.length
    } catch (errCol) {
      statusFinal = 'falha'
      detalheErro += `Falha ${nomeCol}: ${errCol.message || String(errCol)}; `
      snapshot[nomeCol] = []
      contagens[nomeCol] = 0
    }
  }

  const tamanhoBytes = JSON.stringify(snapshot).length

  try {
    const bkCol = $app.findCollectionByNameOrId('backups_sistema')
    const recBk = new Record(bkCol)
    recBk.set('tipo', 'automatico')
    recBk.set('status', statusFinal)
    recBk.set('horario_agendado', '10:00 (Brasília)')
    recBk.set('data_hora', agoraIso)
    recBk.set('total_colecoes', colecoes.length)
    recBk.set('total_registros', totalRegistros)
    recBk.set('tamanho_bytes', tamanhoBytes)
    recBk.set('resumo_contagens', contagens)
    recBk.set('detalhe_erro', detalheErro)
    recBk.set('correlation_id', correlationId)
    recBk.set('dados_json', snapshot)
    $app.save(recBk)
  } catch (errSave) {
    console.error('Falha ao salvar backup 10h:', errSave)
  }

  try {
    const auditCol = $app.findCollectionByNameOrId('logs_auditoria')
    const recAudit = new Record(auditCol)
    recAudit.set('entidade', 'SISTEMA')
    recAudit.set('identificador_registro', correlationId)
    recAudit.set('campo', 'BACKUP_SNAPSHOT')
    recAudit.set('valor_anterior', '')
    recAudit.set(
      'valor_novo',
      JSON.stringify({
        evento: 'BACKUP_ROBOTIZADO_AGENDADO',
        tipo: 'automatico',
        status: statusFinal,
        horario_agendado: '10:00 (Brasília)',
        total_colecoes: colecoes.length,
        total_registros: totalRegistros,
        tamanho_bytes: tamanhoBytes,
        resumo_contagens: contagens,
        detalhe_erro: detalheErro,
        data_hora: agoraIso,
      }),
    )
    recAudit.set('usuario', 'robot_cron_10h')
    recAudit.set('data_hora', agoraIso)
    recAudit.set('origem', 'cron_job')
    $app.save(recAudit)
  } catch (_) {}
})

cronAdd('backup_auto_17h_brasilia', '0 20 * * *', () => {
  const colecoes = [
    'tabela_valores',
    'pessoas',
    'papel_cliente',
    'papel_fornecedor',
    'contatos',
    'enderecos',
    'redes_sociais',
    'categorias_produto',
    'produtos',
    'tabelas_preco',
    'precos_produto',
    'produto_fornecedor',
    'locais_estoque',
    'movimento_estoque',
    'pedidos_venda',
    'itens_pedido',
    'pagamentos_pedido',
    'contas_financeiras',
    'categorias_financeiras',
    'lancamentos_financeiros',
    'logs_auditoria',
  ]
  const correlationId = 'BK-AUTO-17H-' + Date.now()
  const agoraIso = new Date().toISOString()
  const snapshot = {}
  const contagens = {}
  let totalRegistros = 0
  let statusFinal = 'ok'
  let detalheErro = ''

  for (let i = 0; i < colecoes.length; i++) {
    const nomeCol = colecoes[i]
    try {
      const registros = $app.findRecordsByFilter(nomeCol, 'id != ""', 'created', 10000, 0)
      const serializados = []
      for (let r = 0; r < registros.length; r++) {
        serializados.push(registros[r].publicExport())
      }
      snapshot[nomeCol] = serializados
      contagens[nomeCol] = serializados.length
      totalRegistros += serializados.length
    } catch (errCol) {
      statusFinal = 'falha'
      detalheErro += `Falha ${nomeCol}: ${errCol.message || String(errCol)}; `
      snapshot[nomeCol] = []
      contagens[nomeCol] = 0
    }
  }

  const tamanhoBytes = JSON.stringify(snapshot).length

  try {
    const bkCol = $app.findCollectionByNameOrId('backups_sistema')
    const recBk = new Record(bkCol)
    recBk.set('tipo', 'automatico')
    recBk.set('status', statusFinal)
    recBk.set('horario_agendado', '17:00 (Brasília)')
    recBk.set('data_hora', agoraIso)
    recBk.set('total_colecoes', colecoes.length)
    recBk.set('total_registros', totalRegistros)
    recBk.set('tamanho_bytes', tamanhoBytes)
    recBk.set('resumo_contagens', contagens)
    recBk.set('detalhe_erro', detalheErro)
    recBk.set('correlation_id', correlationId)
    recBk.set('dados_json', snapshot)
    $app.save(recBk)
  } catch (errSave) {
    console.error('Falha ao salvar backup 17h:', errSave)
  }

  try {
    const auditCol = $app.findCollectionByNameOrId('logs_auditoria')
    const recAudit = new Record(auditCol)
    recAudit.set('entidade', 'SISTEMA')
    recAudit.set('identificador_registro', correlationId)
    recAudit.set('campo', 'BACKUP_SNAPSHOT')
    recAudit.set('valor_anterior', '')
    recAudit.set(
      'valor_novo',
      JSON.stringify({
        evento: 'BACKUP_ROBOTIZADO_AGENDADO',
        tipo: 'automatico',
        status: statusFinal,
        horario_agendado: '17:00 (Brasília)',
        total_colecoes: colecoes.length,
        total_registros: totalRegistros,
        tamanho_bytes: tamanhoBytes,
        resumo_contagens: contagens,
        detalhe_erro: detalheErro,
        data_hora: agoraIso,
      }),
    )
    recAudit.set('usuario', 'robot_cron_17h')
    recAudit.set('data_hora', agoraIso)
    recAudit.set('origem', 'cron_job')
    $app.save(recAudit)
  } catch (_) {}
})

cronAdd('backup_auto_23h_brasilia', '0 2 * * *', () => {
  const colecoes = [
    'tabela_valores',
    'pessoas',
    'papel_cliente',
    'papel_fornecedor',
    'contatos',
    'enderecos',
    'redes_sociais',
    'categorias_produto',
    'produtos',
    'tabelas_preco',
    'precos_produto',
    'produto_fornecedor',
    'locais_estoque',
    'movimento_estoque',
    'pedidos_venda',
    'itens_pedido',
    'pagamentos_pedido',
    'contas_financeiras',
    'categorias_financeiras',
    'lancamentos_financeiros',
    'logs_auditoria',
  ]
  const correlationId = 'BK-AUTO-23H-' + Date.now()
  const agoraIso = new Date().toISOString()
  const snapshot = {}
  const contagens = {}
  let totalRegistros = 0
  let statusFinal = 'ok'
  let detalheErro = ''

  for (let i = 0; i < colecoes.length; i++) {
    const nomeCol = colecoes[i]
    try {
      const registros = $app.findRecordsByFilter(nomeCol, 'id != ""', 'created', 10000, 0)
      const serializados = []
      for (let r = 0; r < registros.length; r++) {
        serializados.push(registros[r].publicExport())
      }
      snapshot[nomeCol] = serializados
      contagens[nomeCol] = serializados.length
      totalRegistros += serializados.length
    } catch (errCol) {
      statusFinal = 'falha'
      detalheErro += `Falha ${nomeCol}: ${errCol.message || String(errCol)}; `
      snapshot[nomeCol] = []
      contagens[nomeCol] = 0
    }
  }

  const tamanhoBytes = JSON.stringify(snapshot).length

  try {
    const bkCol = $app.findCollectionByNameOrId('backups_sistema')
    const recBk = new Record(bkCol)
    recBk.set('tipo', 'automatico')
    recBk.set('status', statusFinal)
    recBk.set('horario_agendado', '23:00 (Brasília)')
    recBk.set('data_hora', agoraIso)
    recBk.set('total_colecoes', colecoes.length)
    recBk.set('total_registros', totalRegistros)
    recBk.set('tamanho_bytes', tamanhoBytes)
    recBk.set('resumo_contagens', contagens)
    recBk.set('detalhe_erro', detalheErro)
    recBk.set('correlation_id', correlationId)
    recBk.set('dados_json', snapshot)
    $app.save(recBk)
  } catch (errSave) {
    console.error('Falha ao salvar backup 23h:', errSave)
  }

  try {
    const auditCol = $app.findCollectionByNameOrId('logs_auditoria')
    const recAudit = new Record(auditCol)
    recAudit.set('entidade', 'SISTEMA')
    recAudit.set('identificador_registro', correlationId)
    recAudit.set('campo', 'BACKUP_SNAPSHOT')
    recAudit.set('valor_anterior', '')
    recAudit.set(
      'valor_novo',
      JSON.stringify({
        evento: 'BACKUP_ROBOTIZADO_AGENDADO',
        tipo: 'automatico',
        status: statusFinal,
        horario_agendado: '23:00 (Brasília)',
        total_colecoes: colecoes.length,
        total_registros: totalRegistros,
        tamanho_bytes: tamanhoBytes,
        resumo_contagens: contagens,
        detalhe_erro: detalheErro,
        data_hora: agoraIso,
      }),
    )
    recAudit.set('usuario', 'robot_cron_23h')
    recAudit.set('data_hora', agoraIso)
    recAudit.set('origem', 'cron_job')
    $app.save(recAudit)
  } catch (_) {}
})

// =========================================================================
// 2. SEGURANÇA: CÓDIGO RESTRITO DE ACESSO DO ADM (Hash SHA-256 no Servidor)
// =========================================================================

// POST /backend/v1/sistema/usuarios/criar-com-codigo
routerAdd('POST', '/backend/v1/sistema/usuarios/criar-com-codigo', (c) => {
  const correlationId =
    'USR-CREATE-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)
  const auth = c.auth
  if (!auth) {
    try {
      const auditCol = $app.findCollectionByNameOrId('logs_auditoria')
      const rec = new Record(auditCol)
      rec.set('entidade', 'SEGURANCA_CODIGO_REST_ADM')
      rec.set('identificador_registro', 'anonimo')
      rec.set('campo', 'VALIDACAO_CODIGO_RESTRITO')
      rec.set(
        'valor_novo',
        JSON.stringify({ evento: 'CODIGO_RESTRITO_RECUSADO', motivo: 'Não autenticado' }),
      )
      rec.set('usuario', 'anonimo')
      rec.set('data_hora', new Date().toISOString())
      rec.set('origem', 'auth_codigo_restrito_hook')
      $app.save(rec)
    } catch (_) {}
    return c.json(401, { correlationId: correlationId, erro: 'Autenticação exigida.' })
  }

  const perfilCaller = auth.getString('perfil')
  if (perfilCaller !== 'administrador') {
    try {
      const auditCol = $app.findCollectionByNameOrId('logs_auditoria')
      const rec = new Record(auditCol)
      rec.set('entidade', 'SEGURANCA_CODIGO_REST_ADM')
      rec.set('identificador_registro', auth.id)
      rec.set('campo', 'VALIDACAO_CODIGO_RESTRITO')
      rec.set(
        'valor_novo',
        JSON.stringify({ evento: 'CODIGO_RESTRITO_RECUSADO', motivo: 'Usuário não administrador' }),
      )
      rec.set('usuario', auth.id)
      rec.set('data_hora', new Date().toISOString())
      rec.set('origem', 'auth_codigo_restrito_hook')
      $app.save(rec)
    } catch (_) {}
    return c.json(403, {
      correlationId: correlationId,
      erro: 'Apenas Administrador possui autorização para cadastrar colaboradores.',
    })
  }

  const body = c.requestInfo().body || {}
  const codigoRestritoInformado = (body.codigoRestrito || '').toString().trim()
  const email = (body.email || '').toString().trim().toLowerCase()
  const name = (body.name || '').toString().trim()
  const perfilNovo = (body.perfil || 'vendedor').toString().trim()
  const senha = (body.senha || '').toString()

  if (!codigoRestritoInformado) {
    try {
      const auditCol = $app.findCollectionByNameOrId('logs_auditoria')
      const rec = new Record(auditCol)
      rec.set('entidade', 'SEGURANCA_CODIGO_REST_ADM')
      rec.set('identificador_registro', auth.id)
      rec.set('campo', 'VALIDACAO_CODIGO_RESTRITO')
      rec.set(
        'valor_novo',
        JSON.stringify({ evento: 'CODIGO_RESTRITO_RECUSADO', motivo: 'Código não fornecido' }),
      )
      rec.set('usuario', auth.id)
      rec.set('data_hora', new Date().toISOString())
      rec.set('origem', 'auth_codigo_restrito_hook')
      $app.save(rec)
    } catch (_) {}
    return c.json(403, {
      correlationId: correlationId,
      erro: 'Código restrito de acesso do Administrador é obrigatório.',
    })
  }

  let hashEsperado = '3c9e8394083ea25a99c7374f9b2b26c7d65246faba0e594a466f7ef934c686a3'
  try {
    const recSeg = $app.findFirstRecordByData(
      'parametros_seguranca',
      'chave',
      'CODIGO_RESTRITO_ADM',
    )
    hashEsperado = recSeg.getString('valor_hash')
  } catch (_) {}

  const hashInformado = $security.sha256(codigoRestritoInformado)
  let codigoValido = true
  if (hashEsperado.length !== hashInformado.length) {
    codigoValido = false
  } else {
    let diff = 0
    for (let k = 0; k < hashEsperado.length; k++) {
      diff |= hashEsperado.charCodeAt(k) ^ hashInformado.charCodeAt(k)
    }
    codigoValido = diff === 0
  }

  if (!codigoValido) {
    try {
      const auditCol = $app.findCollectionByNameOrId('logs_auditoria')
      const rec = new Record(auditCol)
      rec.set('entidade', 'SEGURANCA_CODIGO_REST_ADM')
      rec.set('identificador_registro', auth.id)
      rec.set('campo', 'VALIDACAO_CODIGO_RESTRITO')
      rec.set(
        'valor_novo',
        JSON.stringify({ evento: 'CODIGO_RESTRITO_RECUSADO', motivo: 'Código incorreto' }),
      )
      rec.set('usuario', auth.id)
      rec.set('data_hora', new Date().toISOString())
      rec.set('origem', 'auth_codigo_restrito_hook')
      $app.save(rec)
    } catch (_) {}
    return c.json(403, {
      correlationId: correlationId,
      erro: 'Código restrito inválido. Acesso ao cadastro negado e registrado na auditoria.',
    })
  }

  // Código aprovado!
  try {
    const auditCol = $app.findCollectionByNameOrId('logs_auditoria')
    const rec = new Record(auditCol)
    rec.set('entidade', 'SEGURANCA_CODIGO_REST_ADM')
    rec.set('identificador_registro', auth.id)
    rec.set('campo', 'VALIDACAO_CODIGO_RESTRITO')
    rec.set(
      'valor_novo',
      JSON.stringify({
        evento: 'CODIGO_RESTRITO_ACEITO',
        detalhe: `Usuário ${email} criado com perfil ${perfilNovo}`,
      }),
    )
    rec.set('usuario', auth.id)
    rec.set('data_hora', new Date().toISOString())
    rec.set('origem', 'auth_codigo_restrito_hook')
    $app.save(rec)
  } catch (_) {}

  if (!email || !name) {
    return c.json(400, { correlationId: correlationId, erro: 'E-mail e Nome são obrigatórios.' })
  }
  if (!senha || senha.length < 8) {
    return c.json(400, {
      correlationId: correlationId,
      erro: 'A senha inicial deve conter no mínimo 8 caracteres.',
    })
  }

  try {
    const usersCol = $app.findCollectionByNameOrId('_pb_users_auth_')
    const novoUser = new Record(usersCol)
    novoUser.setEmail(email)
    novoUser.setPassword(senha)
    novoUser.setVerified(true)
    novoUser.set('name', name)
    novoUser.set('perfil', perfilNovo)
    novoUser.set('ativo', true)
    novoUser.set('tentativas_falhas', 0)
    $app.save(novoUser)

    const idLimpo = String(novoUser.id || novoUser.getString('id') || '')
    const emailLimpo = String(novoUser.getString('email') || email || '')
      .trim()
      .toLowerCase()
    const nameLimpo = String(novoUser.getString('name') || name || '')
    const perfilLimpo = String(novoUser.getString('perfil') || perfilNovo || 'vendedor')
    const ativoLimpo = Boolean(novoUser.getBool('ativo'))
    const createdLimpo = String(novoUser.getString('created') || new Date().toISOString())

    try {
      const auditCol = $app.findCollectionByNameOrId('logs_auditoria')
      const rec = new Record(auditCol)
      rec.set('entidade', 'USUARIOS')
      rec.set('identificador_registro', idLimpo)
      rec.set('campo', 'CRIACAO_USUARIO')
      rec.set(
        'valor_novo',
        JSON.stringify({
          evento: 'USUARIO_CRIADO',
          email: emailLimpo,
          name: nameLimpo,
          perfil: perfilLimpo,
          ativo: ativoLimpo,
        }),
      )
      rec.set('usuario', String(auth.id || 'sistema'))
      rec.set('data_hora', new Date().toISOString())
      rec.set('origem', 'auth_codigo_restrito_hook')
      $app.save(rec)
    } catch (_) {}

    return c.json(200, {
      correlationId: correlationId,
      sucesso: true,
      usuario: {
        id: idLimpo,
        email: emailLimpo,
        name: nameLimpo,
        perfil: perfilLimpo,
        ativo: ativoLimpo,
        created: createdLimpo,
      },
    })
  } catch (errCreate) {
    console.error(`[${correlationId}] Erro ao criar usuário:`, errCreate)
    return c.json(400, {
      correlationId: correlationId,
      erro: errCreate.message || 'Falha ao cadastrar usuário no banco de dados.',
    })
  }
})

// =========================================================================
// ROTAS CORREIOS: CONSULTA STATUS E SALVAMENTO DE CREDENCIAIS
// =========================================================================

// GET /backend/v1/sistema/correios-config
routerAdd('GET', '/backend/v1/sistema/correios-config', (c) => {
  const auth = c.auth
  if (!auth) {
    return c.json(401, { erro: 'Autenticação exigida.' })
  }

  let tokenCadastrado = false
  let descricao = 'Cálculo oficial Correios via API contratada'
  try {
    const rec = $app.findFirstRecordByData('parametros_seguranca', 'chave', 'CORREIOS_CONFIG')
    const val = rec.getString('valor_hash')
    if (val && val !== 'PENDENTE_CADASTRO_TOKEN' && val.trim().length > 5) {
      tokenCadastrado = true
    }
    descricao = rec.getString('descricao') || descricao
  } catch (_) {}

  return c.json(200, {
    configurado: tokenCadastrado,
    descricao: descricao,
    modo: tokenCadastrado ? 'OFICIAL_CORREIOS' : 'TABELA_LOCAL_FAIXAS',
    mensagem: tokenCadastrado
      ? 'Credencial ativa no servidor. Cálculo oficial Sedex/PAC habilitado.'
      : 'Credencial não cadastrada. O sistema utiliza a tabela própria de faixas (13 faixas por região/peso) com CEP integrado.',
  })
})

// POST /backend/v1/sistema/correios-config
routerAdd('POST', '/backend/v1/sistema/correios-config', (c) => {
  const auth = c.auth
  if (!auth || auth.getString('perfil') !== 'administrador') {
    return c.json(403, { erro: 'Apenas Administrador pode configurar credenciais dos Correios.' })
  }

  const body = c.requestInfo().body || {}
  const token = (body.token || '').toString().trim()
  const usuarioCorreios = (body.usuarioCorreios || '').toString().trim()

  if (!token && !body.remover) {
    return c.json(400, { erro: 'Token de acesso dos Correios é obrigatório.' })
  }

  try {
    const paramCol = $app.findCollectionByNameOrId('parametros_seguranca')
    let rec
    try {
      rec = $app.findFirstRecordByData('parametros_seguranca', 'chave', 'CORREIOS_CONFIG')
    } catch (_) {
      rec = new Record(paramCol)
      rec.set('chave', 'CORREIOS_CONFIG')
    }

    if (body.remover) {
      rec.set('valor_hash', 'PENDENTE_CADASTRO_TOKEN')
      rec.set(
        'descricao',
        'Configuração oficial de credencial/token dos Correios (Removido pelo Administrador)',
      )
    } else {
      // Salva token seguro no servidor
      rec.set('valor_hash', token)
      rec.set(
        'descricao',
        `Credencial oficial Correios vinculada ao contrato/usuário ${usuarioCorreios || 'Principal'}`,
      )
    }
    $app.save(rec)

    try {
      const auditCol = $app.findCollectionByNameOrId('logs_auditoria')
      const recAudit = new Record(auditCol)
      recAudit.set('entidade', 'PARAMETROS_SEGURANCA')
      recAudit.set('identificador_registro', 'CORREIOS_CONFIG')
      recAudit.set('campo', 'valor_hash')
      recAudit.set('valor_anterior', '***')
      recAudit.set(
        'valor_novo',
        JSON.stringify({
          acao: body.remover ? 'TOKEN_REMOVIDO' : 'TOKEN_ATUALIZADO',
          usuario_responsavel: auth.id,
          data_hora: new Date().toISOString(),
        }),
      )
      recAudit.set('usuario', auth.id)
      recAudit.set('data_hora', new Date().toISOString())
      recAudit.set('origem', 'correios_config_hook')
      $app.save(recAudit)
    } catch (_) {}

    return c.json(200, {
      sucesso: true,
      configurado: !body.remover,
      mensagem: body.remover
        ? 'Credencial dos Correios removida. Sistema retornou ao uso das faixas próprias.'
        : 'Credencial dos Correios salva com sucesso no servidor!',
    })
  } catch (err) {
    return c.json(500, { erro: err.message || 'Falha ao salvar credencial no servidor.' })
  }
})

// POST /backend/v1/sistema/usuarios/alterar-codigo-restrito
routerAdd('POST', '/backend/v1/sistema/usuarios/alterar-codigo-restrito', (c) => {
  const correlationId = 'COD-CHG-' + Date.now()
  const auth = c.auth
  if (!auth || auth.getString('perfil') !== 'administrador') {
    return c.json(403, { correlationId: correlationId, erro: 'Acesso restrito ao Administrador.' })
  }

  const body = c.requestInfo().body || {}
  const codigoAtual = (body.codigoAtual || '').toString().trim()
  const novoCodigo = (body.novoCodigo || '').toString().trim()

  if (!codigoAtual || !novoCodigo || novoCodigo.length < 6) {
    return c.json(400, {
      correlationId: correlationId,
      erro: 'Código atual e novo código (mínimo 6 dígitos) são obrigatórios.',
    })
  }

  let hashEsperado = '3c9e8394083ea25a99c7374f9b2b26c7d65246faba0e594a466f7ef934c686a3'
  try {
    const recSeg = $app.findFirstRecordByData(
      'parametros_seguranca',
      'chave',
      'CODIGO_RESTRITO_ADM',
    )
    hashEsperado = recSeg.getString('valor_hash')
  } catch (_) {}

  const hashAtual = $security.sha256(codigoAtual)
  let valido = true
  if (hashEsperado.length !== hashAtual.length) {
    valido = false
  } else {
    let diff = 0
    for (let k = 0; k < hashEsperado.length; k++) {
      diff |= hashEsperado.charCodeAt(k) ^ hashAtual.charCodeAt(k)
    }
    valido = diff === 0
  }

  if (!valido) {
    return c.json(403, { correlationId: correlationId, erro: 'Código atual informado incorreto.' })
  }

  try {
    const paramCol = $app.findCollectionByNameOrId('parametros_seguranca')
    let rec
    try {
      rec = $app.findFirstRecordByData('parametros_seguranca', 'chave', 'CODIGO_RESTRITO_ADM')
    } catch (_) {
      rec = new Record(paramCol)
      rec.set('chave', 'CODIGO_RESTRITO_ADM')
    }
    rec.set('valor_hash', $security.sha256(novoCodigo))
    rec.set('descricao', 'Hash SHA-256 do código de acesso restrito exclusivo do Administrador')
    $app.save(rec)

    return c.json(200, {
      correlationId: correlationId,
      sucesso: true,
      mensagem: 'Código restrito do Administrador atualizado com sucesso no servidor.',
    })
  } catch (err) {
    return c.json(500, { correlationId: correlationId, erro: err.message })
  }
})

// POST /backend/v1/sistema/executar-backup-agora
routerAdd('POST', '/backend/v1/sistema/executar-backup-agora', (c) => {
  const auth = c.auth
  if (!auth || auth.getString('perfil') !== 'administrador') {
    return c.json(403, { erro: 'Apenas Administrador pode executar backup.' })
  }

  const colecoes = [
    'tabela_valores',
    'pessoas',
    'papel_cliente',
    'papel_fornecedor',
    'contatos',
    'enderecos',
    'redes_sociais',
    'categorias_produto',
    'produtos',
    'tabelas_preco',
    'precos_produto',
    'produto_fornecedor',
    'locais_estoque',
    'movimento_estoque',
    'pedidos_venda',
    'itens_pedido',
    'pagamentos_pedido',
    'contas_financeiras',
    'categorias_financeiras',
    'lancamentos_financeiros',
    'logs_auditoria',
  ]
  const correlationId = 'BK-MANUAL-' + Date.now()
  const agoraIso = new Date().toISOString()
  const snapshot = {}
  const contagens = {}
  let totalRegistros = 0
  let statusFinal = 'ok'
  let detalheErro = ''

  for (let i = 0; i < colecoes.length; i++) {
    const nomeCol = colecoes[i]
    try {
      const registros = $app.findRecordsByFilter(nomeCol, 'id != ""', 'created', 10000, 0)
      const serializados = []
      for (let r = 0; r < registros.length; r++) {
        serializados.push(registros[r].publicExport())
      }
      snapshot[nomeCol] = serializados
      contagens[nomeCol] = serializados.length
      totalRegistros += serializados.length
    } catch (errCol) {
      statusFinal = 'falha'
      detalheErro += `Falha ${nomeCol}: ${errCol.message || String(errCol)}; `
      snapshot[nomeCol] = []
      contagens[nomeCol] = 0
    }
  }

  const tamanhoBytes = JSON.stringify(snapshot).length

  try {
    const bkCol = $app.findCollectionByNameOrId('backups_sistema')
    const recBk = new Record(bkCol)
    recBk.set('tipo', 'manual')
    recBk.set('status', statusFinal)
    recBk.set('horario_agendado', 'Manual sob demanda')
    recBk.set('data_hora', agoraIso)
    recBk.set('total_colecoes', colecoes.length)
    recBk.set('total_registros', totalRegistros)
    recBk.set('tamanho_bytes', tamanhoBytes)
    recBk.set('resumo_contagens', contagens)
    recBk.set('detalhe_erro', detalheErro)
    recBk.set('correlation_id', correlationId)
    recBk.set('dados_json', snapshot)
    $app.save(recBk)
  } catch (errSave) {
    console.error('Falha ao salvar backup manual:', errSave)
  }

  try {
    const auditCol = $app.findCollectionByNameOrId('logs_auditoria')
    const recAudit = new Record(auditCol)
    recAudit.set('entidade', 'SISTEMA')
    recAudit.set('identificador_registro', correlationId)
    recAudit.set('campo', 'BACKUP_SNAPSHOT')
    recAudit.set('valor_anterior', '')
    recAudit.set(
      'valor_novo',
      JSON.stringify({
        evento: 'EXPORT_BACKUP_COMPLETO',
        tipo: 'manual',
        status: statusFinal,
        total_colecoes: colecoes.length,
        total_registros: totalRegistros,
        tamanho_bytes: tamanhoBytes,
        resumo_contagens: contagens,
        detalhe_erro: detalheErro,
        data_hora: agoraIso,
      }),
    )
    recAudit.set('usuario', auth.id)
    recAudit.set('data_hora', agoraIso)
    recAudit.set('origem', 'backup_hook')
    $app.save(recAudit)
  } catch (_) {}

  return c.json(200, {
    sucesso: true,
    resultado: {
      correlationId: correlationId,
      status: statusFinal,
      dataHora: agoraIso,
      totalColecoes: colecoes.length,
      totalRegistros: totalRegistros,
      tamanhoBytes: tamanhoBytes,
      resumoContagens: contagens,
      dados: snapshot,
    },
  })
})

// GET /backend/v1/sistema/backup-download/{id}
routerAdd('GET', '/backend/v1/sistema/backup-download/{id}', (c) => {
  const auth = c.auth
  if (!auth || auth.getString('perfil') !== 'administrador') {
    return c.json(403, { erro: 'Apenas Administrador pode baixar backups.' })
  }

  const id = c.request.pathValue('id')
  try {
    const rec = $app.findRecordById('backups_sistema', id)
    const dados = JSON.parse(rec.getString('dados_json'))
    return c.json(200, {
      correlationId: rec.getString('correlation_id'),
      tipo: rec.getString('tipo'),
      status: rec.getString('status'),
      dataHora: rec.getString('data_hora'),
      totalColecoes: rec.getInt('total_colecoes'),
      totalRegistros: rec.getInt('total_registros'),
      dados: dados,
    })
  } catch (err) {
    return c.json(404, { erro: 'Backup não encontrado ou não acessível.' })
  }
})

// =========================================================================
// 3. VALIDAÇÕES E TRANSAÇÕES ORIGINAIS DE REGRAS DE NEGÓCIO (R1 a R14)
// =========================================================================

// R1: movimento_estoque
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

// R4: precos_produto
onRecordCreate((e) => {
  const produto = e.record.getString('produto')
  const tabela = e.record.getString('tabela_preco')
  const fim = e.record.getString('data_fim_vigencia')

  if (!fim || fim.trim() === '') {
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

// R12: itens_pedido
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

// R10: pessoas
onRecordCreate((e) => {
  const doc = e.record.getString('documento')
  const tipo = e.record.getString('tipo_pessoa')
  const nomeRazao = (e.record.getString('nome_razao_social') || '').trim()

  if (!nomeRazao || nomeRazao.length < 2) {
    throw new BadRequestError('Nome / Razão Social é obrigatório (mínimo 2 caracteres).')
  }

  const limpo = (doc || '').replace(/\D/g, '')
  if (tipo === 'FISICA') {
    if (limpo.length !== 11 || /^(\d)\1{10}$/.test(limpo)) {
      throw new BadRequestError('R10: CPF deve conter 11 dígitos numéricos válidos.')
    }
  } else if (tipo === 'JURIDICA') {
    if (limpo.length !== 14 || /^(\d)\1{13}$/.test(limpo)) {
      throw new BadRequestError('R10: CNPJ deve conter 14 dígitos numéricos válidos.')
    }
  }
  e.record.set('documento', limpo)
  e.record.set('nome_razao_social', nomeRazao)
  e.next()
}, 'pessoas')

onRecordUpdate((e) => {
  const doc = e.record.getString('documento')
  const tipo = e.record.getString('tipo_pessoa')
  const nomeRazao = (e.record.getString('nome_razao_social') || '').trim()

  if (!nomeRazao || nomeRazao.length < 2) {
    throw new BadRequestError('Nome / Razão Social é obrigatório (mínimo 2 caracteres).')
  }

  const limpo = (doc || '').replace(/\D/g, '')
  if (tipo === 'FISICA') {
    if (limpo.length !== 11 || /^(\d)\1{10}$/.test(limpo)) {
      throw new BadRequestError('R10: CPF deve conter 11 dígitos numéricos válidos.')
    }
  } else if (tipo === 'JURIDICA') {
    if (limpo.length !== 14 || /^(\d)\1{13}$/.test(limpo)) {
      throw new BadRequestError('R10: CNPJ deve conter 14 dígitos numéricos válidos.')
    }
  }
  e.record.set('documento', limpo)
  e.record.set('nome_razao_social', nomeRazao)
  e.next()
}, 'pessoas')

// R10: enderecos
onRecordCreate((e) => {
  const cep = e.record.getString('cep')
  const limpo = (cep || '').replace(/\D/g, '')
  if (limpo.length !== 8) {
    throw new BadRequestError('R10: CEP deve conter exatamente 8 dígitos numéricos.')
  }
  e.record.set('cep', limpo)

  const logradouro = (e.record.getString('logradouro') || '').trim()
  if (!logradouro) {
    throw new BadRequestError('Logradouro do endereço é obrigatório.')
  }
  e.record.set('logradouro', logradouro)
  e.next()
}, 'enderecos')

onRecordUpdate((e) => {
  const cep = e.record.getString('cep')
  const limpo = (cep || '').replace(/\D/g, '')
  if (limpo.length !== 8) {
    throw new BadRequestError('R10: CEP deve conter exatamente 8 dígitos numéricos.')
  }
  e.record.set('cep', limpo)

  const logradouro = (e.record.getString('logradouro') || '').trim()
  if (!logradouro) {
    throw new BadRequestError('Logradouro do endereço é obrigatório.')
  }
  e.record.set('logradouro', logradouro)
  e.next()
}, 'enderecos')

// R10: contatos
onRecordCreate((e) => {
  const papel = e.record.getString('papel')
  const nome = (e.record.getString('nome_contato') || '').trim()
  if (papel === 'recado' && (!nome || nome.length < 2)) {
    throw new BadRequestError(
      "R10: Contato do papel 'recado' exige nome próprio do destinatário do recado.",
    )
  }
  if (nome) e.record.set('nome_contato', nome)

  const wpp = e.record.getString('whatsapp')
  if (wpp) {
    const digitos = wpp.replace(/\D/g, '')
    if (digitos) {
      const e164 = digitos.length === 10 || digitos.length === 11 ? '+55' + digitos : '+' + digitos
      e.record.set('whatsapp', e164)
    }
  }
  e.next()
}, 'contatos')

onRecordUpdate((e) => {
  const papel = e.record.getString('papel')
  const nome = (e.record.getString('nome_contato') || '').trim()
  if (papel === 'recado' && (!nome || nome.length < 2)) {
    throw new BadRequestError(
      "R10: Contato do papel 'recado' exige nome próprio do destinatário do recado.",
    )
  }
  if (nome) e.record.set('nome_contato', nome)

  const wpp = e.record.getString('whatsapp')
  if (wpp) {
    const digitos = wpp.replace(/\D/g, '')
    if (digitos) {
      const e164 = digitos.length === 10 || digitos.length === 11 ? '+55' + digitos : '+' + digitos
      e.record.set('whatsapp', e164)
    }
  }
  e.next()
}, 'contatos')

// pagamentos_pedido
onRecordCreate((e) => {
  const forma = e.record.getString('forma_pagamento')
  const permitidas = ['PIX', 'CREDITO', 'DEBITO', 'LINK', 'DINHEIRO']
  if (!permitidas.includes(forma)) {
    throw new BadRequestError(
      "Forma de pagamento '" + forma + "' inválida. Use PIX, CREDITO, DEBITO, LINK ou DINHEIRO.",
    )
  }
  const valor = e.record.getInt('valor_centavos')
  if (valor <= 0) {
    throw new BadRequestError(
      'Valor do pagamento em centavos deve ser estritamente maior que zero.',
    )
  }
  e.next()
}, 'pagamentos_pedido')

onRecordUpdate((e) => {
  const forma = e.record.getString('forma_pagamento')
  const permitidas = ['PIX', 'CREDITO', 'DEBITO', 'LINK', 'DINHEIRO']
  if (!permitidas.includes(forma)) {
    throw new BadRequestError(
      "Forma de pagamento '" + forma + "' inválida. Use PIX, CREDITO, DEBITO, LINK ou DINHEIRO.",
    )
  }
  const valor = e.record.getInt('valor_centavos')
  if (valor <= 0) {
    throw new BadRequestError(
      'Valor do pagamento em centavos deve ser estritamente maior que zero.',
    )
  }
  e.next()
}, 'pagamentos_pedido')

// lancamentos_financeiros
onRecordCreate((e) => {
  const valor = e.record.getInt('valor_centavos')
  if (valor <= 0) {
    throw new BadRequestError('Valor do lançamento financeiro em centavos deve ser maior que zero.')
  }
  const comp = e.record.getString('data_competencia')
  if (!comp) {
    throw new BadRequestError('Data de competência contábil é obrigatória.')
  }
  const venc = e.record.getString('data_vencimento')
  if (!venc) {
    throw new BadRequestError('Data de vencimento do título financeiro é obrigatória.')
  }
  const forma = e.record.getString('forma_pagamento')
  if (forma) {
    const permitidas = ['PIX', 'CREDITO', 'DEBITO', 'LINK', 'DINHEIRO']
    if (!permitidas.includes(forma)) {
      throw new BadRequestError(
        "Forma de pagamento '" + forma + "' não reconhecida na tabela de valores.",
      )
    }
  }
  e.next()
}, 'lancamentos_financeiros')

onRecordUpdate((e) => {
  const valor = e.record.getInt('valor_centavos')
  if (valor <= 0) {
    throw new BadRequestError('Valor do lançamento financeiro em centavos deve ser maior que zero.')
  }
  const comp = e.record.getString('data_competencia')
  if (!comp) {
    throw new BadRequestError('Data de competência contábil é obrigatória.')
  }
  const venc = e.record.getString('data_vencimento')
  if (!venc) {
    throw new BadRequestError('Data de vencimento do título financeiro é obrigatória.')
  }
  const forma = e.record.getString('forma_pagamento')
  if (forma) {
    const permitidas = ['PIX', 'CREDITO', 'DEBITO', 'LINK', 'DINHEIRO']
    if (!permitidas.includes(forma)) {
      throw new BadRequestError(
        "Forma de pagamento '" + forma + "' não reconhecida na tabela de valores.",
      )
    }
  }
  e.next()
}, 'lancamentos_financeiros')

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
      const pedido = txApp.findRecordById('pedidos_venda', pedidoId)
      if (pedido.getString('status') !== 'rascunho') {
        throw new BadRequestError('Apenas pedidos em rascunho podem ser confirmados.')
      }

      const itens = txApp.findRecordsByFilter('itens_pedido', `pedido = '${pedidoId}'`)
      if (!itens || itens.length === 0) {
        throw new BadRequestError('O pedido não possui itens cadastrados.')
      }

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

      const movEstoqueCol = txApp.findCollectionByNameOrId('movimento_estoque')
      for (let i = 0; i < itens.length; i++) {
        const item = itens[i]
        const prodId = item.getString('produto')
        const localId = item.getString('local_estoque')
        const qtdItem = item.getInt('quantidade')

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

      const lancFinCol = txApp.findCollectionByNameOrId('lancamentos_financeiros')
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

      pedido.set('status', 'confirmado')
      txApp.save(pedido)

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

// POST /backend/v1/transacoes/cancelar-venda
routerAdd('POST', '/backend/v1/transacoes/cancelar-venda', (c) => {
  const correlationId = 'TX-CANCEL-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7)
  const auth = c.auth
  if (!auth) {
    return c.json(401, { correlationId: correlationId, erro: 'R14: Autenticação exigida.' })
  }

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

      const movimentos = txApp.findRecordsByFilter(
        'movimento_estoque',
        `documento_origem_tipo = 'pedido_venda' && documento_origem_id = '${pedidoId}' && tipo = 'saida'`,
      )

      const movCol = txApp.findCollectionByNameOrId('movimento_estoque')
      const agoraIso = new Date().toISOString()

      for (let m = 0; m < movimentos.length; m++) {
        const movOriginal = movimentos[m]
        const qtdEstorno = Math.abs(movOriginal.getInt('quantidade'))

        const recInverso = new Record(movCol)
        recInverso.set('produto', movOriginal.getString('produto'))
        recInverso.set('local', movOriginal.getString('local'))
        recInverso.set('tipo', 'devolucao')
        recInverso.set('quantidade', qtdEstorno)
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

      const lancamentos = txApp.findRecordsByFilter(
        'lancamentos_financeiros',
        `documento_origem_tipo = 'pedido_venda' && documento_origem_id = '${pedidoId}'`,
      )

      const lancCol = txApp.findCollectionByNameOrId('lancamentos_financeiros')
      for (let l = 0; l < lancamentos.length; l++) {
        const lancOriginal = lancamentos[l]
        if (lancOriginal.getString('status') === 'realizado') {
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

      pedido.set('status', 'cancelado')
      pedido.set(
        'observacao',
        (pedido.getString('observacao') || '') + ` | Motivo cancelamento: ${motivo}`,
      )
      txApp.save(pedido)

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

// POST /backend/v1/sistema/exportar-backup
routerAdd('POST', '/backend/v1/sistema/exportar-backup', (c) => {
  const auth = c.auth
  if (!auth) {
    return c.json(401, { erro: 'R14: Autenticação exigida para exportar backup.' })
  }

  const perfil = auth.getString('perfil')
  if (perfil !== 'administrador') {
    return c.json(403, {
      erro: 'Apenas Administrador possui permissão para gerar backup integral do sistema.',
    })
  }

  const colecoes = [
    'tabela_valores',
    'pessoas',
    'papel_cliente',
    'papel_fornecedor',
    'contatos',
    'enderecos',
    'redes_sociais',
    'categorias_produto',
    'produtos',
    'tabelas_preco',
    'precos_produto',
    'produto_fornecedor',
    'locais_estoque',
    'movimento_estoque',
    'pedidos_venda',
    'itens_pedido',
    'pagamentos_pedido',
    'contas_financeiras',
    'categorias_financeiras',
    'lancamentos_financeiros',
    'logs_auditoria',
  ]
  const correlationId = 'BK-MANUAL-' + Date.now()
  const agoraIso = new Date().toISOString()
  const snapshot = {}
  const contagens = {}
  let totalRegistros = 0
  let statusFinal = 'ok'
  let detalheErro = ''

  for (let i = 0; i < colecoes.length; i++) {
    const nomeCol = colecoes[i]
    try {
      const registros = $app.findRecordsByFilter(nomeCol, 'id != ""', 'created', 10000, 0)
      const serializados = []
      for (let r = 0; r < registros.length; r++) {
        serializados.push(registros[r].publicExport())
      }
      snapshot[nomeCol] = serializados
      contagens[nomeCol] = serializados.length
      totalRegistros += serializados.length
    } catch (errCol) {
      statusFinal = 'falha'
      detalheErro += `Falha ${nomeCol}: ${errCol.message || String(errCol)}; `
      snapshot[nomeCol] = []
      contagens[nomeCol] = 0
    }
  }

  return c.json(200, {
    correlationId: correlationId,
    versaoSistema: '0.0.20',
    ambiente: 'Skip Cloud PocketBase v0.36',
    geradoEm: agoraIso,
    solicitadoPor: {
      id: String(auth.id || auth.getString('id') || ''),
      email: String(auth.getString('email') || '')
        .trim()
        .toLowerCase(),
      perfil: String(perfil || auth.getString('perfil') || ''),
    },
    resumo: {
      totalColecoes: colecoes.length,
      totalRegistros: totalRegistros,
      contagensPorColecao: contagens,
    },
    dados: snapshot,
  })
})
