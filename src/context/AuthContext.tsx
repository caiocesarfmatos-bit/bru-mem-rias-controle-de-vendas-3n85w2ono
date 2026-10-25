import React, { createContext, useContext, useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { UsuarioSistema, PerfilUsuario } from '@/types/sistema'

interface AuthContextType {
  usuario: UsuarioSistema | null
  isAutenticado: boolean
  isLoading: boolean
  login: (email: string, pass: string) => Promise<{ sucesso: boolean; erro?: string }>
  logout: () => void
  temPermissao: (operacao: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Matriz de permissões avaliada client e server
const PERMISSOES_POR_PERFIL: Record<PerfilUsuario, string[]> = {
  administrador: [
    'administrar_usuarios',
    'alterar_preco',
    'conceder_desconto',
    'cadastrar_cliente',
    'cadastrar_fornecedor',
    'lancar_ajuste_estoque',
    'dar_baixa_caixa',
    'cancelar_pedido',
    'cancelar_lancamento',
    'exportar_relatorio',
    'visualizar_auditoria',
  ],
  gestor: [
    'alterar_preco',
    'conceder_desconto',
    'cadastrar_cliente',
    'cadastrar_fornecedor',
    'lancar_ajuste_estoque',
    'dar_baixa_caixa',
    'cancelar_pedido',
    'cancelar_lancamento',
    'exportar_relatorio',
    'visualizar_auditoria',
  ],
  vendedor: ['conceder_desconto', 'cadastrar_cliente'],
  operador_caixa: ['dar_baixa_caixa'],
  estoquista: ['cadastrar_fornecedor', 'lancar_ajuste_estoque'],
  consulta: [],
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<UsuarioSistema | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const extrairUsuarioSeguro = (m: any): UsuarioSistema | null => {
    if (!m) return null
    const emailLimpo =
      typeof m.email === 'function'
        ? ''
        : String(m.email || '')
            .trim()
            .toLowerCase()
    const nameLimpo = typeof m.name === 'function' ? '' : String(m.name || m.email || '')
    const idLimpo = typeof m.id === 'function' ? '' : String(m.id || '')
    const perfilLimpo = (typeof m.perfil === 'string' ? m.perfil : 'administrador') as PerfilUsuario

    return {
      id: idLimpo,
      email: emailLimpo,
      name: nameLimpo || emailLimpo,
      perfil: perfilLimpo,
      ativo: m.ativo !== false,
      created: typeof m.created === 'string' ? m.created : new Date().toISOString(),
      updated: typeof m.updated === 'string' ? m.updated : new Date().toISOString(),
    }
  }

  // Iniciar checando sessão salva no PocketBase
  useEffect(() => {
    if (pb.authStore.isValid && pb.authStore.model) {
      setUsuario(extrairUsuarioSeguro(pb.authStore.model))
    } else {
      setUsuario(null)
    }
    setIsLoading(false)

    // Ouvir alterações do authStore
    const unsubscribe = pb.authStore.onChange(() => {
      if (pb.authStore.isValid && pb.authStore.model) {
        setUsuario(extrairUsuarioSeguro(pb.authStore.model))
      } else {
        setUsuario(null)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const login = async (
    email: string,
    pass: string,
  ): Promise<{ sucesso: boolean; erro?: string }> => {
    try {
      const authData = await pb.collection('users').authWithPassword(email.trim(), pass)
      if (!authData.record.ativo && authData.record.ativo !== undefined) {
        pb.authStore.clear()
        return { sucesso: false, erro: 'Conta inativa. Procure o Administrador.' }
      }
      return { sucesso: true }
    } catch (err: any) {
      console.error('Erro de autenticação:', err)
      return {
        sucesso: false,
        erro: err.message || 'Credenciais inválidas. Verifique seu e-mail e senha.',
      }
    }
  }

  const logout = () => {
    pb.authStore.clear()
    setUsuario(null)
  }

  const temPermissao = (operacao: string): boolean => {
    if (!usuario) return false
    const perms = PERMISSOES_POR_PERFIL[usuario.perfil] || []
    return perms.includes(operacao)
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        isAutenticado: !!usuario,
        isLoading,
        login,
        logout,
        temPermissao,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider')
  }
  return context
}
