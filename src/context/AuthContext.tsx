import React, { createContext, useContext, useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { UsuarioSistema, PerfilUsuario } from '@/types/sistema'

interface AuthContextType {
  usuario: UsuarioSistema | null
  isAutenticado: boolean
  contraSenhaLiberada: boolean
  aguardandoContraSenha: boolean
  isLoading: boolean
  login: (email: string, pass: string) => Promise<{ sucesso: boolean; erro?: string }>
  validarContraSenha: (
    codigo: string,
  ) => Promise<{ sucesso: boolean; erro?: string; bloqueadoSegundos?: number }>
  logout: () => Promise<void>
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
    'gerenciar_marketing',
    'exportar_leads',
    'gerenciar_personas',
    'gerenciar_calendario',
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
    'gerenciar_marketing',
    'exportar_leads',
    'gerenciar_personas',
    'gerenciar_calendario',
  ],
  vendedor: [
    'conceder_desconto',
    'cadastrar_cliente',
    'gerenciar_marketing',
    'gerenciar_calendario',
  ],
  operador_caixa: ['dar_baixa_caixa'],
  estoquista: ['cadastrar_fornecedor', 'lancar_ajuste_estoque'],
  consulta: [],
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<UsuarioSistema | null>(null)
  const [contraSenhaLiberada, setContraSenhaLiberada] = useState<boolean>(() => {
    return sessionStorage.getItem('bm_contra_senha_validada') === 'true'
  })
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
      contra_senha_liberada: Boolean(m.contra_senha_liberada),
      created: typeof m.created === 'string' ? m.created : new Date().toISOString(),
      updated: typeof m.updated === 'string' ? m.updated : new Date().toISOString(),
    }
  }

  // Sincronizar estado da sessão
  useEffect(() => {
    if (pb.authStore.isValid && pb.authStore.model) {
      const u = extrairUsuarioSeguro(pb.authStore.model)
      setUsuario(u)
      const sessaoAtiva = sessionStorage.getItem('bm_contra_senha_validada') === 'true'
      setContraSenhaLiberada(sessaoAtiva && Boolean(u?.contra_senha_liberada))
    } else {
      setUsuario(null)
      setContraSenhaLiberada(false)
      sessionStorage.removeItem('bm_contra_senha_validada')
    }
    setIsLoading(false)

    const unsubscribe = pb.authStore.onChange(() => {
      if (pb.authStore.isValid && pb.authStore.model) {
        const u = extrairUsuarioSeguro(pb.authStore.model)
        setUsuario(u)
        const sessaoAtiva = sessionStorage.getItem('bm_contra_senha_validada') === 'true'
        setContraSenhaLiberada(sessaoAtiva && Boolean(u?.contra_senha_liberada))
      } else {
        setUsuario(null)
        setContraSenhaLiberada(false)
        sessionStorage.removeItem('bm_contra_senha_validada')
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
        setUsuario(null)
        setContraSenhaLiberada(false)
        sessionStorage.removeItem('bm_contra_senha_validada')
        return { sucesso: false, erro: 'Conta inativa. Procure o Administrador.' }
      }

      // Ao realizar login com sucesso, a contra senha NUNCA vem liberada automaticamente
      // Garante estado limpo e aguardando contra senha
      sessionStorage.removeItem('bm_contra_senha_validada')
      setContraSenhaLiberada(false)
      setUsuario(extrairUsuarioSeguro(authData.record))
      return { sucesso: true }
    } catch (err: any) {
      console.error('Erro de autenticação:', err)
      return {
        sucesso: false,
        erro: err.message || 'Credenciais inválidas. Verifique seu e-mail e senha.',
      }
    }
  }

  const validarContraSenha = async (
    codigo: string,
  ): Promise<{ sucesso: boolean; erro?: string; bloqueadoSegundos?: number }> => {
    try {
      const res = await pb.send<{
        sucesso: boolean
        mensagem?: string
        erro?: string
        bloqueadoSegundos?: number
        usuario?: any
      }>('/backend/v1/sistema/auth/validar-contra-senha', {
        method: 'POST',
        body: { contraSenha: codigo.trim() },
      })

      if (res && res.sucesso) {
        sessionStorage.setItem('bm_contra_senha_validada', 'true')
        setContraSenhaLiberada(true)
        if (res.usuario && pb.authStore.model) {
          setUsuario({
            ...extrairUsuarioSeguro(pb.authStore.model)!,
            contra_senha_liberada: true,
          })
        }
        return { sucesso: true }
      }
      return { sucesso: false, erro: res?.erro || 'Código incorreto.' }
    } catch (err: any) {
      const dados = err.data || {}
      return {
        sucesso: false,
        erro: dados.erro || err.message || 'Código incorreto.',
        bloqueadoSegundos: dados.bloqueadoSegundos,
      }
    }
  }

  const logout = async () => {
    try {
      if (pb.authStore.isValid) {
        await pb.send('/backend/v1/sistema/auth/resetar-contra-senha-sessao', {
          method: 'POST',
        })
      }
    } catch {
      /* intentionally ignored */
    }
    sessionStorage.removeItem('bm_contra_senha_validada')
    setContraSenhaLiberada(false)
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
        isAutenticado: !!usuario && contraSenhaLiberada,
        contraSenhaLiberada,
        aguardandoContraSenha: !!usuario && !contraSenhaLiberada,
        isLoading,
        login,
        validarContraSenha,
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
