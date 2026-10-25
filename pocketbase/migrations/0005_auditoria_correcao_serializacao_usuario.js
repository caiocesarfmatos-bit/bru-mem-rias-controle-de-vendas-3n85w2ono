// pocketbase/migrations/0005_auditoria_correcao_serializacao_usuario.js
// Registro na trilha de auditoria da correção da serialização JSON do campo usuario/email
// e garantia de blindagem com tipos string puros contra Go func() string.

migrate(
  (app) => {
    let adminUserId = ''
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'caiocesarfmatos@gmail.com')
      adminUserId = admin.id
    } catch (_) {
      try {
        const users = app.findRecordsByFilter('_pb_users_auth_', 'id != ""', 'created', 1, 0)
        if (users.length > 0) adminUserId = users[0].id
      } catch (_) {}
    }

    try {
      const auditCol = app.findCollectionByNameOrId('logs_auditoria')
      const rec = new Record(auditCol)
      rec.set('entidade', 'SISTEMA_SEGURANCA')
      rec.set('identificador_registro', 'CORRECAO_SERIALIZACAO_USUARIO_EMAIL')
      rec.set('campo', 'usuario/email')
      rec.set('valor_anterior', 'Go func() string (erro de serializacao JSON em resposta)')
      rec.set(
        'valor_novo',
        JSON.stringify({
          evento: 'CORRECAO_IMEDIATA_SERIALIZACAO_JSON',
          motivo: 'Eliminacao de Go func() string no campo usuario/email em endpoints e respostas',
          solucao: 'Uso de getString("email") e conversao estrita String(...) em todos os campos',
          campos_blindados: ['id', 'email', 'name', 'perfil', 'ativo', 'created'],
          status: 'APLICADO_E_CONFERIDO',
          data_hora: new Date().toISOString(),
        }),
      )
      if (adminUserId) {
        rec.set('usuario', adminUserId)
      }
      rec.set('data_hora', new Date().toISOString())
      rec.set('origem', 'migration_0005')
      app.save(rec)
    } catch (err) {
      console.warn('Aviso ao gravar auditoria da migracao 0005:', err)
    }
  },
  (app) => {
    try {
      const recs = app.findRecordsByFilter(
        'logs_auditoria',
        "identificador_registro = 'CORRECAO_SERIALIZACAO_USUARIO_EMAIL'",
      )
      for (let i = 0; i < recs.length; i++) {
        app.delete(recs[i])
      }
    } catch (_) {}
  },
)
