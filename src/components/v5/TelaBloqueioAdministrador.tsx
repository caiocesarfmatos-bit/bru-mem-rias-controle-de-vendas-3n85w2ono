import React, { useState } from 'react'
import { useAppV5 } from '@/context/AppV5Context'
import { Lock, KeyRound, AlertTriangle, ShieldCheck, RefreshCw, Eye, EyeOff } from 'lucide-react'

export const TelaBloqueioAdministrador: React.FC = () => {
  const {
    isConfigurado,
    tentativasRestantes,
    bloqueadoSegundos,
    criarSenhaMestre,
    desbloquearComSenha,
    reiniciarSistemaPerdaAcesso,
  } = useAppV5()

  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [mensagemErro, setMensagemErro] = useState('')
  const [processando, setProcessando] = useState(false)

  // Modal de confirmação para esquecimento de senha
  const [showModalReset, setShowModalReset] = useState(false)
  const [etapaReset, setEtapaReset] = useState<1 | 2>(1)
  const [palavraReset, setPalavraReset] = useState('')

  const handleCriarSenha = async (e: React.FormEvent) => {
    e.preventDefault()
    setMensagemErro('')

    if (senha.length < 4) {
      setMensagemErro('A senha deve conter pelo menos 4 caracteres.')
      return
    }

    if (senha !== confirmarSenha) {
      setMensagemErro('A confirmação de senha não confere.')
      return
    }

    setProcessando(true)
    const res = await criarSenhaMestre(senha)
    setProcessando(false)

    if (!res.sucesso) {
      setMensagemErro(res.mensagem || 'Falha ao criar senha.')
    }
  }

  const handleEntrar = async (e: React.FormEvent) => {
    e.preventDefault()
    setMensagemErro('')

    if (!senha) {
      setMensagemErro('Digite a senha de administrador.')
      return
    }

    setProcessando(true)
    const res = await desbloquearComSenha(senha)
    setProcessando(false)

    if (!res.sucesso) {
      setMensagemErro(res.mensagem || 'Senha incorreta.')
      setSenha('')
    }
  }

  const handleConfirmarResetTotal = () => {
    if (palavraReset.trim().toUpperCase() !== 'REINICIAR TUDO') {
      setMensagemErro('Digite exatamente "REINICIAR TUDO" para autorizar.')
      return
    }
    reiniciarSistemaPerdaAcesso()
    setShowModalReset(false)
    setEtapaReset(1)
    setPalavraReset('')
    setSenha('')
    setConfirmarSenha('')
  }

  const isBloqueado = bloqueadoSegundos > 0

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#F0E4E0] relative">
        {/* Topo com Ícone e Marca */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#FFF0F8] text-[#FF1493] flex items-center justify-center mb-3 shadow-inner">
            {isConfigurado ? <Lock className="w-8 h-8" /> : <KeyRound className="w-8 h-8" />}
          </div>
          <span className="font-brand-script text-2xl text-[#FF1493]">Bru Memórias</span>
          <h1 className="text-xl font-brand-serif font-bold text-[#4E342E]">
            {isConfigurado ? 'Acesso do Administrador' : 'Definição da Senha Mestre'}
          </h1>
          <p className="text-xs text-[#4E342E]/70 mt-1">
            {isConfigurado
              ? 'Sistema interno exclusivo do administrador'
              : 'Primeiro acesso: cadastre a senha única deste aparelho'}
          </p>
        </div>

        {/* Mensagem de Erro / Alerta */}
        {mensagemErro && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-fade-in">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{mensagemErro}</div>
          </div>
        )}

        {/* Estado Bloqueado Temporariamente */}
        {isBloqueado && (
          <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-xs text-center space-y-1">
            <p className="font-bold">Acesso temporariamente bloqueado!</p>
            <p>Aguarde {bloqueadoSegundos} segundos para tentar novamente.</p>
          </div>
        )}

        {/* Formulário: Primeiro Uso (Criar Senha) */}
        {!isConfigurado ? (
          <form onSubmit={handleCriarSenha} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#4E342E] mb-1">
                Nova Senha de Administrador
              </label>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  className="w-full px-4 py-3 min-h-[44px] text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF1493] pr-10"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4E342E] mb-1">
                Confirme a Nova Senha
              </label>
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Repita a senha digitada"
                className="w-full px-4 py-3 min-h-[44px] text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF1493]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={processando}
              className="w-full py-3.5 px-4 min-h-[44px] bg-[#FF1493] hover:bg-[#E01284] text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {processando ? 'Protegendo...' : 'Gravar Senha e Entrar'}
            </button>
          </form>
        ) : (
          /* Formulário: Desbloqueio (Entrar com Senha) */
          <form onSubmit={handleEntrar} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#4E342E] mb-1">
                Senha de Administrador
              </label>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  disabled={isBloqueado || processando}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full px-4 py-3 min-h-[44px] text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF1493] pr-10 disabled:opacity-50"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isBloqueado || processando}
              className="w-full py-3.5 px-4 min-h-[44px] bg-[#FF1493] hover:bg-[#E01284] text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {processando ? 'Verificando...' : 'Entrar na Central'}
            </button>

            {/* Esquecimento de Senha */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setEtapaReset(1)
                  setPalavraReset('')
                  setShowModalReset(true)
                }}
                className="text-xs text-gray-500 hover:text-red-600 underline transition-colors"
              >
                Esqueci minha senha
              </button>
            </div>
          </form>
        )}

        {/* Aviso Permanente Obrigatório do Spec (Seção 3) */}
        <div className="mt-6 p-3.5 rounded-2xl bg-[#F5EFEA]/80 border border-[#F0E4E0] text-[11px] text-[#4E342E]/80 leading-relaxed flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-[#FF1493] flex-shrink-0 mt-0.5" />
          <p>
            Esta senha impede que alguém abra o sistema por curiosidade no seu aparelho. Ela não
            substitui o bloqueio de tela do celular.
          </p>
        </div>
      </div>

      {/* Modal Dupla Confirmação: Esquecimento de Senha com Reinício Total */}
      {showModalReset && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-red-500">
            <div className="flex items-center gap-2 text-red-600 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="text-base font-bold font-brand-serif">
                {etapaReset === 1 ? 'Recuperação de Acesso' : 'Confirmação Definitiva de Reinício'}
              </h2>
            </div>

            {etapaReset === 1 ? (
              <div className="space-y-3 text-xs text-[#4E342E]/80">
                <p>
                  Por decisão de arquitetura e privacidade,{' '}
                  <strong>não existe envio de e-mail</strong> nem servidor com cópia de sua senha.
                </p>
                <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-red-800">
                  <p className="font-bold mb-1">Aviso Importante:</p>
                  <p>
                    O único modo de redefinir o acesso caso você tenha esquecido a senha é o{' '}
                    <strong>reinício do aplicativo</strong>, que apagará a senha atual para permitir
                    o cadastro de uma nova, reiniciando o banco de dados local.
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModalReset(false)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full font-medium"
                  >
                    Lembrei a Senha
                  </button>
                  <button
                    type="button"
                    onClick={() => setEtapaReset(2)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full"
                  >
                    Prosseguir para Confirmação Final →
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-[#4E342E]/80">
                <p>
                  Tem certeza absoluta? Digite{' '}
                  <strong className="text-red-600">REINICIAR TUDO</strong> para apagar a senha e
                  recomeçar:
                </p>
                <input
                  type="text"
                  value={palavraReset}
                  onChange={(e) => setPalavraReset(e.target.value)}
                  placeholder="REINICIAR TUDO"
                  className="w-full px-3 py-2 border rounded-lg uppercase tracking-wider font-mono text-sm"
                  autoFocus
                />
                <div className="flex justify-between items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEtapaReset(1)}
                    className="text-gray-500 hover:underline"
                  >
                    ← Voltar
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowModalReset(false)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmarResetTotal}
                      disabled={palavraReset.trim().toUpperCase() !== 'REINICIAR TUDO'}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full disabled:opacity-50"
                    >
                      Reiniciar e Criar Nova Senha
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
