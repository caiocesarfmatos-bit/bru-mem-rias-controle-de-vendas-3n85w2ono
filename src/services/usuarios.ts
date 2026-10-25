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

export async function criarUsuarioConvite(dados: {
  email: string
  name: string
  perfil: PerfilUsuario
  passwordInicial: string
}): Promise<UsuarioSistema> {
  const rec = await pb.collection('users').create({
    email: dados.email.trim(),
    name: dados.name.trim(),
    perfil: dados.perfil,
    password: dados.passwordInicial,
    passwordConfirm: dados.passwordInicial,
    ativo: true,
    tentativas_falhas: 0,
  })

  return {
    id: rec.id,
    email: rec.email,
    name: rec.name,
    perfil: rec.perfil,
    ativo: true,
    created: rec.created,
    updated: rec.updated,
  }
}
