import React, { useState, useEffect } from 'react'
import { listarUsuarios, criarUsuarioConvite } from '@/services/usuarios'
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
import { Shield, UserPlus, UserCheck, ShieldAlert, Key } from 'lucide-react'

export const ModuloUsuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([])
  const [modalAberto, setModalAberto] = useState(false)
  const [email, setEmail] = useState('')
  const [nome, setNome] = useState('')
  const [perfil, setPerfil] = useState<PerfilUsuario>('vendedor')
  const [senha, setSenha] = useState('Skip@Pass123')
  const [erro, setErro] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
    try {
      await criarUsuarioConvite({
        email,
        name: nome,
        perfil,
        passwordInicial: senha,
      })
      setModalAberto(false)
      setEmail('')
      setNome('')
      carregar()
    } catch (err: any) {
      setErro(err.message || 'Erro ao criar usuário')
    }
  }

  return (
    <div className="space-y-6">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#4E342E] flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#FF1493]" />
            Usuários e Controle de Acesso
          </h2>
          <p className="text-sm text-[#4E342E]/70">
            Perfis de acesso granulares (Administrador, Gestor, Vendedor, Operador de Caixa,
            Estoquista, Consulta)
          </p>
        </div>

        <Dialog open={modalAberto} onOpenChange={setModalAberto}>
          <DialogTrigger asChild>
            <Button className="bg-[#FF1493] hover:bg-[#D8117E] text-white">
              <UserPlus className="w-4 h-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-xl font-serif font-bold text-[#4E342E]">
                Cadastrar Novo Colaborador
              </DialogTitle>
            </DialogHeader>

            {erro && (
              <div className="p-3 bg-red-50 text-red-700 text-sm border border-red-200 rounded">
                {erro}
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
                />
              </div>

              <div>
                <Label>Perfil de Acesso</Label>
                <Select value={perfil} onValueChange={(v: any) => setPerfil(v)}>
                  <SelectTrigger>
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
                />
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setModalAberto(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#FF1493] hover:bg-[#D8117E] text-white">
                  Criar Credencial
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
                <span>Conta ativa</span>
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
