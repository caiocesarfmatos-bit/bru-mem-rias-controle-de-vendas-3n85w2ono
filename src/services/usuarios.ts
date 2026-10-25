// src/services/usuarios.ts
import pb from '@/lib/pocketbase/client'
import { UsuarioSistema, PerfilUsuario } from '@/types/sistema'

export async function listarUsuarios(): Promise<UsuarioSistema[]> {
  try {
    const records = await pb.collection('users').getFullList({ sort: 'name' })
    return records.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      perfil: (r.perfil || 'consulta') as PerfilUsuario,
      ativo: r.ativo !== false,
      bloqueado_ate: r.bloqueado_ate,
      tentativas_falhas: r.tentativas_falhas || 0,
      created: r.created,
      updated: r.updated,
    }))
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

  return res.usuario
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
