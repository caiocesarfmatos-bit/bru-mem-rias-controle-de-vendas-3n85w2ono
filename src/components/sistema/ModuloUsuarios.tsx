import React, { useState, useEffect } from 'react'
import {
  listarUsuarios,
  criarUsuarioComCodigoRestrito,
  alterarCodigoRestritoServidor,
} from '@/services/usuarios'
import { UsuarioSistema, PerfilUsuario } from '@/types/sistema'
import { formatarDataHoraPtBR } from '@/lib/formatters'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Shield,
  UserPlus,
  UserCheck,
  ShieldAlert,
  KeyRound,
  Lock,
  CheckCircle2,
} from 'lucide-react'

export const ModuloUsuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([])
  const [modalAberto, setModalAberto] = useState(false)
  const [modalTrocaAberto, setModalTrocaAberto] = useState(false)

  // Formulário de Cadastro
  const [email, setEmail] = useState('')
  const [nome, setNome] = useState('')
  const [perfil, setPerfil] = useState<PerfilUsuario>('vendedor')
  const [senha, setSenha] = useState('Skip@Pass123')
  const [codigoRestrito, setCodigoRestrito] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Formulário de Troca de Código Restrito
  const [codigoAtual, setCodigoAtual] = useState('')
  const [novoCodigo, setNovoCodigo] = useState('')
  const [erroTroca, setErroTroca] = useState<string | null>(null)
  const [sucessoTroca, setSucessoTroca] = useState<string | null>(null)
  const [loadingTroca, setLoadingTroca] = useState(false)

  const carregar = async () => {
    setLoading(true)
    const list = await listarUsuarios()
    setUsuarios(list)
    setLoading(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)
    setLoading(true)
    try {
      await criarUsuarioComCodigoRestrito({
        email,
        name: nome,
        perfil,
        passwordInicial: senha,
        codigoRestrito,
      })
      setModalAberto(false)
      setEmail('')
      setNome('')
      setCodigoRestrito('')
      carregar()
    } catch (err: any) {
      setErro(err.message || 'Erro ao criar usuário com código restrito.')
    } finally {
      setLoading(false)
    }
  }

  const handleTrocarCodigo = async (e: React.FormEvent) => {
    e.preventDefault()
    setErroTroca(null)
    setSucessoTroca(null)
    setLoadingTroca(true)
    try {
      const res = await alterarCodigoRestritoServidor({
        codigoAtual,
        novoCodigo,
      })
      if (res.sucesso) {
        setSucessoTroca('Código restrito do Administrador atualizado com sucesso no servidor!')
        setCodigoAtual('')
        setNovoCodigo('')
        setTimeout(() => {
          setModalTrocaAberto(false)
          setSucessoTroca(null)
        }, 1500)
      } else {
        setErroTroca(res.mensagem || 'Falha ao atualizar código restrito.')
      }
    } catch (err: any) {
      setErroTroca(err.message || 'Código atual incorreto ou erro no servidor.')
    } finally {
      setLoadingTroca(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl font-serif font-bold text-[#4E342E] flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#FF1493]" />
          Usuários & Acesso
        </h2>

        <div className="flex items-center gap-2">
          {/* Modal Troca Código Restrito */}
          <Dialog open={modalTrocaAberto} onOpenChange={setModalTrocaAberto}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="border-[#E0D0CC] text-[#4E342E] hover:bg-[#FFF0F5]"
              >
                <KeyRound className="w-4 h-4 mr-2 text-[#FF1493]" />
                Alterar Código Restrito ADM
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-xl font-serif font-bold text-[#4E342E] flex items-center gap-2">
                  <Lock className="w-5 h-5 text-[#FF1493]" />
                  Código Restrito de Acesso do Administrador
                </DialogTitle>
              </DialogHeader>

              <p className="text-xs text-[#4E342E]/70">
                O código restrito protege a criação de contas e a elevação de privilégios. É
                armazenado no servidor em formato hash SHA-256 não reversível.
              </p>

              {erroTroca && (
                <div className="p-3 bg-red-50 text-red-700 text-sm border border-red-200 rounded flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{erroTroca}</span>
                </div>
              )}

              {sucessoTroca && (
                <div className="p-3 bg-green-50 text-green-700 text-sm border border-green-200 rounded flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>{sucessoTroca}</span>
                </div>
              )}

              <form onSubmit={handleTrocarCodigo} className="space-y-4 text-[#4E342E] mt-2">
                <div>
                  <Label>Código Restrito Atual</Label>
                  <Input
                    required
                    type="password"
                    value={codigoAtual}
                    onChange={(e) => setCodigoAtual(e.target.value)}
                    placeholder="Código atual (ex: 6 dígitos)"
                    className="border-[#E0D0CC]"
                  />
                </div>

                <div>
                  <Label>Novo Código Restrito (mínimo 6 dígitos)</Label>
                  <Input
                    required
                    type="password"
                    value={novoCodigo}
                    onChange={(e) => setNovoCodigo(e.target.value)}
                    placeholder="Digite o novo código restrito"
                    className="border-[#E0D0CC]"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModalTrocaAberto(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={loadingTroca}
                    className="bg-[#FF1493] hover:bg-[#D8117E] text-white"
                  >
                    {loadingTroca ? 'Atualizando...' : 'Gravar Novo Código no Servidor'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Modal Novo Usuário */}
          <Dialog open={modalAberto} onOpenChange={setModalAberto}>
            <DialogTrigger asChild>
              <Button className="bg-[#FF1493] hover:bg-[#D8117E] text-white shadow-sm">
                <UserPlus className="w-4 h-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-serif font-bold text-[#4E342E]">
                  Cadastrar Novo Colaborador
                </DialogTitle>
              </DialogHeader>

              {erro && (
                <div className="p-3 bg-red-50 text-red-700 text-sm border border-red-200 rounded flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{erro}</span>
                </div>
              )}

              <form onSubmit={handleCriar} className="space-y-4 text-[#4E342E]">
                <div>
                  <Label>Nome Completo</Label>
                  <Input
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Nome do colaborador"
                    className="border-[#E0D0CC]"
                  />
                </div>

                <div>
                  <Label>E-mail Corporativo</Label>
                  <Input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="colaborador@brumemorias.com.br"
                    className="border-[#E0D0CC]"
                  />
                </div>

                <div>
                  <Label>Perfil de Acesso</Label>
                  <Select value={perfil} onValueChange={(v: any) => setPerfil(v)}>
                    <SelectTrigger className="border-[#E0D0CC]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="administrador">Administrador (Total)</SelectItem>
                      <SelectItem value="gestor">Gestor Operacional</SelectItem>
                      <SelectItem value="vendedor">Vendedor</SelectItem>
                      <SelectItem value="operador_caixa">Operador de Caixa</SelectItem>
                      <SelectItem value="estoquista">Estoquista</SelectItem>
                      <SelectItem value="consulta">Apenas Consulta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Senha Inicial (mínimo 8 caracteres)</Label>
                  <Input
                    required
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="border-[#E0D0CC]"
                  />
                </div>

                {/* Campo Obrigatório do Código Restrito de Acesso do Administrador */}
                <div className="bg-[#FFF0F5]/50 p-3 rounded-lg border border-[#FF1493]/30 space-y-2">
                  <Label className="text-xs font-bold text-[#4E342E] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#FF1493]" />
                    Código Restrito de Acesso do Administrador
                  </Label>
                  <Input
                    required
                    type="password"
                    value={codigoRestrito}
                    onChange={(e) => setCodigoRestrito(e.target.value)}
                    placeholder="Digite o código restrito de 6 dígitos"
                    className="border-[#FF1493]/40 bg-white"
                  />
                  <p className="text-[11px] text-[#4E342E]/70">
                    Obrigatório para autorizar criação e atribuição de perfis. Validação feita
                    diretamente no servidor com auditoria imutável.
                  </p>
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setModalAberto(false)}>
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-[#FF1493] hover:bg-[#D8117E] text-white"
                  >
                    {loading ? 'Validando no Servidor...' : 'Criar Credencial Autorizada'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Grid de Usuários */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {usuarios.map((u) => (
          <Card key={u.id} className="border border-[#F0E4E0] shadow-sm">
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base font-bold text-[#4E342E]">
                    {u.name || u.email}
                  </CardTitle>
                  <p className="text-xs text-[#4E342E]/70">{u.email}</p>
                </div>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#FFF0F5] text-[#FF1493] border border-[#FF1493]/20">
                  {u.perfil}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2 text-xs text-[#4E342E]/70 space-y-1">
              <div className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-green-600" />
                <span>Conta ativa e autorizada</span>
              </div>
              <div className="text-[11px] text-[#4E342E]/50">
                Criado em: {formatarDataHoraPtBR(u.created)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
