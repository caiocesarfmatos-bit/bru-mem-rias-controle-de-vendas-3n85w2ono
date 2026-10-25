// src/services/usuarios.ts
import pb from '@/lib/pocketbase/client'
import { UsuarioSistema, PerfilUsuario } from '@/types/sistema'

export async function listarUsuarios(): Promise<UsuarioSistema[]> {
  try {
    const records = await pb.collection('users').getFullList({ sort: 'name' })
    return records.map((r) => {
      const emailLimpo =
        typeof r.email === 'function'
          ? ''
          : String(r.email || '')
              .trim()
              .toLowerCase()
      const nameLimpo = typeof r.name === 'function' ? '' : String(r.name || r.email || '')
      const idLimpo = typeof r.id === 'function' ? '' : String(r.id || '')
      const perfilLimpo = (typeof r.perfil === 'string' ? r.perfil : 'consulta') as PerfilUsuario

      return {
        id: idLimpo,
        email: emailLimpo,
        name: nameLimpo,
        perfil: perfilLimpo,
        ativo: r.ativo !== false,
        bloqueado_ate: r.bloqueado_ate,
        tentativas_falhas: r.tentativas_falhas || 0,
        created: r.created,
        updated: r.updated,
      }
    })
  } catch (err) {
    console.error('Erro ao listar usuários:', err)
    return []
  }
}

export async function criarUsuarioComCodigoRestrito(dados: {
  email: string
  name: string
  perfil: PerfilUsuario
  passwordInicial: string
  codigoRestrito: string
}): Promise<UsuarioSistema> {
  // A validação do código restrito e criação de conta ocorre 100% no servidor (PocketBase pb_hook)
  // com hash SHA-256 e comparação em tempo constante.
  const res = await pb.send('/backend/v1/sistema/usuarios/criar-com-codigo', {
    method: 'POST',
    body: {
      email: dados.email,
      name: dados.name,
      perfil: dados.perfil,
      senha: dados.passwordInicial,
      codigoRestrito: dados.codigoRestrito,
    },
  })

  if (!res || !res.sucesso) {
    throw new Error(res?.erro || 'Falha ao cadastrar usuário com código restrito.')
  }

  const u = res.usuario || {}
  const usuarioHigienizado: UsuarioSistema = {
    id: typeof u.id === 'function' ? '' : String(u.id || ''),
    email:
      typeof u.email === 'function'
        ? ''
        : String(u.email || '')
            .trim()
            .toLowerCase(),
    name: typeof u.name === 'function' ? '' : String(u.name || u.email || ''),
    perfil: (typeof u.perfil === 'string' ? u.perfil : 'vendedor') as PerfilUsuario,
    ativo: u.ativo !== false,
    created: typeof u.created === 'string' ? u.created : new Date().toISOString(),
    updated: typeof u.updated === 'string' ? u.updated : new Date().toISOString(),
  }

  return usuarioHigienizado
}

export async function alterarCodigoRestritoServidor(dados: {
  codigoAtual: string
  novoCodigo: string
}): Promise<{ sucesso: boolean; mensagem?: string }> {
  const res = await pb.send('/backend/v1/sistema/usuarios/alterar-codigo-restrito', {
    method: 'POST',
    body: {
      codigoAtual: dados.codigoAtual,
      novoCodigo: dados.novoCodigo,
    },
  })
  return res
}
