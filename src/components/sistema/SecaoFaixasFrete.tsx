// src/components/sistema/SecaoFaixasFrete.tsx
// Gestão administrativa de faixas de frete próprias do negócio (Recreio dos Bandeirantes, RJ)
// Sem números decorativos (apenas valores funcionais)

import { useState, useEffect } from 'react'
import {
  listarFaixasFrete,
  criarFaixaFrete,
  atualizarFaixaFrete,
  excluirFaixaFrete,
  FaixaFreteRegistro,
  RegiaoFrete,
  ModalidadeFrete,
  TipoFaixaFrete,
  MODALIDADE_ROTULOS,
  REGIAO_ROTULOS,
} from '@/services/frete'
import { formatarCentavosParaReal, parseRealParaCentavos } from '@/lib/formatters'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import {
  Truck,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  MapPin,
  Clock,
  DollarSign,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function SecaoFaixasFrete() {
  const { usuario } = useAuth()
  const { toast } = useToast()

  const [faixas, setFaixas] = useState<FaixaFreteRegistro[]>([])
  const [carregando, setCarregando] = useState(false)
  const [filtroRegiao, setFiltroRegiao] = useState<string>('TODAS')

  // Modal formulário
  const [modalAberto, setModalAberto] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  // Campos do formulário
  const [nome, setNome] = useState('')
  const [regiaoDestino, setRegiaoDestino] = useState<RegiaoFrete>('RJ_CAPITAL')
  const [ufDestino, setUfDestino] = useState('RJ')
  const [modalidade, setModalidade] = useState<ModalidadeFrete>('SEDEX')
  const [tipoFaixa, setTipoFaixa] = useState<TipoFaixaFrete>('peso_gramas')
  const [faixaMinima, setFaixaMinima] = useState<string>('0')
  const [faixaMaxima, setFaixaMaxima] = useState<string>('1000')
  const [precoInput, setPrecoInput] = useState<string>('15,00')
  const [prazoDias, setPrazoDias] = useState<string>('2')
  const [ativo, setAtivo] = useState(true)
  const [observacao, setObservacao] = useState('')

  const podeEditar = usuario?.perfil === 'administrador' || usuario?.perfil === 'gestor'
  const podeExcluir = usuario?.perfil === 'administrador'

  const carregarDados = async () => {
    setCarregando(true)
    try {
      const lista = await listarFaixasFrete(false)
      setFaixas(lista)
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar faixas',
        description: err.message || 'Falha ao buscar faixas de frete no servidor.',
        variant: 'destructive',
      })
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const abrirNovo = () => {
    setEditandoId(null)
    setNome('')
    setRegiaoDestino('RJ_CAPITAL')
    setUfDestino('RJ')
    setModalidade('SEDEX')
    setTipoFaixa('peso_gramas')
    setFaixaMinima('0')
    setFaixaMaxima('1000')
    setPrecoInput('0,00')
    setPrazoDias('2')
    setAtivo(true)
    setObservacao('')
    setModalAberto(true)
  }

  const abrirEdicao = (faixa: FaixaFreteRegistro) => {
    setEditandoId(faixa.id)
    setNome(faixa.nome)
    setRegiaoDestino(faixa.regiao_destino)
    setUfDestino(faixa.uf_destino || '')
    setModalidade(faixa.modalidade)
    setTipoFaixa(faixa.tipo_faixa)
    setFaixaMinima(String(faixa.faixa_minima))
    setFaixaMaxima(String(faixa.faixa_maxima))
    setPrecoInput(((faixa.preco_centavos || 0) / 100).toFixed(2).replace('.', ','))
    setPrazoDias(String(faixa.prazo_dias_estimado))
    setAtivo(faixa.ativo)
    setObservacao(faixa.observacao || '')
    setModalAberto(true)
  }

  const salvarFaixa = async () => {
    if (!nome.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Informe uma descrição ou nome para a faixa de frete.',
        variant: 'destructive',
      })
      return
    }

    const min = parseFloat(faixaMinima) || 0
    const max = parseFloat(faixaMaxima) || 0
    if (max < min) {
      toast({
        title: 'Faixa inválida',
        description: 'O valor máximo da faixa não pode ser menor que o valor mínimo.',
        variant: 'destructive',
      })
      return
    }

    const precoCentavos = parseRealParaCentavos(precoInput)
    const prazo = parseInt(prazoDias, 10) || 1

    setSalvando(true)
    try {
      const payload = {
        nome: nome.trim(),
        regiao_destino: regiaoDestino,
        uf_destino: ufDestino.trim().toUpperCase() || undefined,
        modalidade,
        tipo_faixa: tipoFaixa,
        faixa_minima: min,
        faixa_maxima: max,
        preco_centavos: precoCentavos,
        prazo_dias_estimado: prazo,
        ativo,
        observacao: observacao.trim() || undefined,
      }

      const nomeUsuario = usuario?.name || usuario?.email || 'Administrador'
      if (editandoId) {
        await atualizarFaixaFrete(editandoId, payload, nomeUsuario)
        toast({
          title: 'Faixa de frete atualizada',
          description: 'A alteração foi salva com registro de auditoria.',
        })
      } else {
        await criarFaixaFrete(payload, nomeUsuario)
        toast({
          title: 'Faixa de frete criada',
          description: 'Nova modalidade disponível para cálculo automático.',
        })
      }

      setModalAberto(false)
      await carregarDados()
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar',
        description: err.message || 'Falha ao gravar faixa no servidor.',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  const handleExcluir = async (id: string, nomeFaixa: string) => {
    if (!podeExcluir) {
      toast({
        title: 'Ação restrita',
        description: 'Apenas Administradores podem excluir faixas de frete.',
        variant: 'destructive',
      })
      return
    }

    if (!confirm(`Deseja remover a faixa de frete "${nomeFaixa}"?`)) return

    try {
      const nomeUsuario = usuario?.name || usuario?.email || 'Administrador'
      await excluirFaixaFrete(id, nomeUsuario)
      toast({
        title: 'Faixa removida',
        description: 'Registro excluído do catálogo ativo.',
      })
      await carregarDados()
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir',
        description: err.message || 'Falha ao excluir faixa.',
        variant: 'destructive',
      })
    }
  }

  const toggleAtivo = async (faixa: FaixaFreteRegistro) => {
    if (!podeEditar) return
    try {
      const nomeUsuario = usuario?.name || usuario?.email || 'Administrador'
      await atualizarFaixaFrete(faixa.id, { ativo: !faixa.ativo }, nomeUsuario)
      toast({
        title: faixa.ativo ? 'Faixa desativada' : 'Faixa reativada',
        description: `Faixa ${faixa.nome} atualizada com sucesso.`,
      })
      await carregarDados()
    } catch (err: any) {
      toast({
        title: 'Erro ao alterar status',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  const faixasFiltradas = faixas.filter((f) => {
    if (filtroRegiao === 'TODAS') return true
    return f.regiao_destino === filtroRegiao
  })

  return (
    <div className="space-y-6">
      {/* Cabeçalho informativo */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Tabela Própria de Frete</CardTitle>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                  Origem: Recreio dos Bandeirantes, Rio de Janeiro
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Configuração de faixas tarifárias por região/UF e peso dos ímãs personalizados (5x5
                cm). O cálculo automático aplica as regras ativas durante a criação de pedidos.
              </p>
            </div>
            {podeEditar && (
              <Button onClick={abrirNovo} className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Faixa de Frete
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Barra de filtros */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/50">
            <span className="text-xs font-medium text-muted-foreground">Filtrar por Região:</span>
            <div className="flex flex-wrap gap-1.5">
              <Button
                variant={filtroRegiao === 'TODAS' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-7"
                onClick={() => setFiltroRegiao('TODAS')}
              >
                Todas
              </Button>
              {Object.entries(REGIAO_ROTULOS).map(([key, rotulo]) => (
                <Button
                  key={key}
                  variant={filtroRegiao === key ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setFiltroRegiao(key)}
                >
                  {rotulo.split('(')[0].trim()}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Faixas */}
      {carregando ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Carregando tabela de frete...
        </div>
      ) : faixasFiltradas.length === 0 ? (
        <Card className="p-8 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">
            Nenhuma faixa de frete encontrada para o filtro selecionado.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Cadastre novas faixas para habilitar o cálculo automático nesta região.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {faixasFiltradas.map((faixa) => (
            <Card
              key={faixa.id}
              className={`border transition-colors ${
                faixa.ativo
                  ? 'border-border bg-card'
                  : 'border-dashed border-border/70 bg-muted/30 opacity-75'
              }`}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-sm leading-snug">{faixa.nome}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge variant="secondary" className="text-xs font-normal">
                        {MODALIDADE_ROTULOS[faixa.modalidade] || faixa.modalidade}
                      </Badge>
                      {faixa.uf_destino && (
                        <Badge variant="outline" className="text-xs font-normal">
                          UF: {faixa.uf_destino}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleAtivo(faixa)}
                    title={faixa.ativo ? 'Clique para desativar' : 'Clique para ativar'}
                    className="cursor-pointer"
                  >
                    {faixa.ativo ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground pt-1 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      Região:
                    </span>
                    <span className="font-medium text-foreground">
                      {REGIAO_ROTULOS[faixa.regiao_destino] || faixa.regiao_destino}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Limite da Faixa:</span>
                    <span className="font-medium text-foreground">
                      {faixa.tipo_faixa === 'peso_gramas' &&
                        `${faixa.faixa_minima}g a ${faixa.faixa_maxima}g`}
                      {faixa.tipo_faixa === 'valor_pedido_centavos' &&
                        `${formatarCentavosParaReal(faixa.faixa_minima)} a ${formatarCentavosParaReal(
                          faixa.faixa_maxima,
                        )}`}
                      {faixa.tipo_faixa === 'quantidade_itens' &&
                        `${faixa.faixa_minima} a ${faixa.faixa_maxima} un.`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      Prazo Estimado:
                    </span>
                    <span className="font-medium text-foreground">
                      {faixa.prazo_dias_estimado} dia(s) úteis
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div>
                    <span className="text-xs text-muted-foreground block">Tarifa:</span>
                    <span className="text-lg font-bold text-foreground">
                      {faixa.preco_centavos === 0 ? (
                        <span className="text-emerald-600 flex items-center gap-1 text-sm font-semibold">
                          <Sparkles className="h-3.5 w-3.5" /> Grátis
                        </span>
                      ) : (
                        formatarCentavosParaReal(faixa.preco_centavos)
                      )}
                    </span>
                  </div>

                  {podeEditar && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => abrirEdicao(faixa)}
                        title="Editar faixa"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {podeExcluir && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive/70 hover:text-destructive"
                          onClick={() => handleExcluir(faixa.id, faixa.nome)}
                          title="Excluir faixa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {faixa.observacao && (
                  <p className="text-[11px] text-muted-foreground italic pt-1 border-t border-border/40">
                    {faixa.observacao}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editandoId ? 'Editar Faixa de Frete' : 'Nova Faixa de Frete'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="nome">Nome Identificador da Faixa</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Sedex RJ Capital até 1kg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Região de Destino</Label>
                <Select
                  value={regiaoDestino}
                  onValueChange={(val) => setRegiaoDestino(val as RegiaoFrete)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(REGIAO_ROTULOS).map(([key, rotulo]) => (
                      <SelectItem key={key} value={key}>
                        {rotulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="uf">UF Específica (Opcional)</Label>
                <Input
                  id="uf"
                  value={ufDestino}
                  onChange={(e) => setUfDestino(e.target.value.toUpperCase())}
                  placeholder="Ex: RJ, SP (ou vazio para todas)"
                  maxLength={2}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Modalidade</Label>
                <Select
                  value={modalidade}
                  onValueChange={(val) => setModalidade(val as ModalidadeFrete)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MODALIDADE_ROTULOS).map(([key, rotulo]) => (
                      <SelectItem key={key} value={key}>
                        {rotulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tipo de Faixa</Label>
                <Select
                  value={tipoFaixa}
                  onValueChange={(val) => setTipoFaixa(val as TipoFaixaFrete)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="peso_gramas">Peso (gramas)</SelectItem>
                    <SelectItem value="valor_pedido_centavos">Valor do Pedido (R$)</SelectItem>
                    <SelectItem value="quantidade_itens">Quantidade de Ímãs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="fMin">
                  Mínimo (
                  {tipoFaixa === 'peso_gramas'
                    ? 'g'
                    : tipoFaixa === 'quantidade_itens'
                      ? 'un.'
                      : 'centavos'}
                  )
                </Label>
                <Input
                  id="fMin"
                  type="number"
                  value={faixaMinima}
                  onChange={(e) => setFaixaMinima(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="fMax">
                  Máximo (
                  {tipoFaixa === 'peso_gramas'
                    ? 'g'
                    : tipoFaixa === 'quantidade_itens'
                      ? 'un.'
                      : 'centavos'}
                  )
                </Label>
                <Input
                  id="fMax"
                  type="number"
                  value={faixaMaxima}
                  onChange={(e) => setFaixaMaxima(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="preco">Preço de Frete (R$)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="preco"
                    className="pl-8"
                    value={precoInput}
                    onChange={(e) => setPrecoInput(e.target.value)}
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="prazo">Prazo Estimado (dias úteis)</Label>
                <Input
                  id="prazo"
                  type="number"
                  min="1"
                  value={prazoDias}
                  onChange={(e) => setPrazoDias(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="obs">Observações / Orientações de Envio</Label>
              <Input
                id="obs"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex: Retirada de seg a sex das 10h às 18h no Recreio"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAberto(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={salvarFaixa} disabled={salvando}>
              {salvando ? 'Gravando...' : editandoId ? 'Atualizar Faixa' : 'Cadastrar Faixa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
