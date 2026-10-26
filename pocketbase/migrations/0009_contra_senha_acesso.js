migrate(
  (app) => {
    // 1. Adicionar campo contra_senha_liberada na coleção de usuários (_pb_users_auth_)
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!usersCol.fields.getByName('contra_senha_liberada')) {
      usersCol.fields.add(
        new BoolField({
          name: 'contra_senha_liberada',
        }),
      )
    }

    // Trava de segurança: usuário não pode alterar contra_senha_liberada diretamente via API
    usersCol.updateRule =
      "(@request.auth.id = id || @request.auth.perfil = 'administrador') && @request.body.contra_senha_liberada:changed = false"
    app.save(usersCol)

    // 2. Garantir que o hash da contra senha de login (501698) esteja cadastrado em parametros_seguranca
    try {
      const paramCol = app.findCollectionByNameOrId('parametros_seguranca')
      try {
        app.findFirstRecordByData('parametros_seguranca', 'chave', 'CONTRA_SENHA_LOGIN')
      } catch (_) {
        const hash501698 = $security.sha256('501698')
        const rec = new Record(paramCol)
        rec.set('chave', 'CONTRA_SENHA_LOGIN')
        rec.set('valor_hash', hash501698)
        rec.set(
          'descricao',
          'Hash SHA-256 da contra senha obrigatória no login (501698) para todos os perfis',
        )
        app.save(rec)
      }
    } catch (errParam) {
      console.error('Aviso ao registrar CONTRA_SENHA_LOGIN:', errParam)
    }
  },
  (app) => {
    try {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      const campo = usersCol.fields.getByName('contra_senha_liberada')
      if (campo) {
        usersCol.fields.remove(campo)
        app.save(usersCol)
      }
    } catch (_) {}
  },
)
