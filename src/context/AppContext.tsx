import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  AppData,
  AuditEntry,
  AppSettings,
  TabId,
  ProdutoKit,
  CustoItem,
  CustoLancamento,
  PedidoCliente,
  Cliente,
  Fornecedor,
  InsumoEstoque,
  MovimentacaoEstoque,
  ProdutoProntoItem,
  EstoqueData,
} from '@/types/app'
import {
  carregarDados,
  salvarDados,
  carregarAuditoria,
  salvarAuditoria,
  registrarAuditoria,
  carregarConfiguracoes,
  salvarConfiguracoes,
  PRODUTOS_PADRAO,
  FORNECEDORES_PADRAO,
  CLIENTES_PADRAO,
  AUDIT_PADRAO,
  SETTINGS_PADRAO,
  ESTOQUE_PADRAO,
} from '@/lib/storage'
import { sanitizarTexto } from '@/lib/formatters'

interface AppContextType {
  data: AppData
  audit: AuditEntry[]
  settings: AppSettings
  activeTab: TabId
  setActiveTab: (tab: TabId) => void
  selectedClienteIdFoco?: string | null
  setSelectedClienteIdFoco: (id: string | null) => void
  navegarParaCliente: (clienteId: string) => void
  navegarParaRelatorio: (secao?: 'produtos' | 'clientes' | 'canais' | 'resumo') => void
  focoSecaoRelatorio?: string | null
  setFocoSecaoRelatorio: (secao: string | null) => void
  periodoRelatorioTipo: string
  setPeriodoRelatorioTipo: (tipo: string) => void
  periodoCustomInicio: string
  setPeriodoCustomInicio: (data: string) => void
  periodoCustomFim: string
  setPeriodoCustomFim: (data: string) => void
  activeProduct: ProdutoKit
  setActiveProductId: (id: string) => void

  // Custos / Produtos
  updateProdutoLote: (produtoId: string, unidadesLote: number) => void
  updateCustoBase: (produtoId: string, itemId: string, novoCustoBase: number) => void
  addCustoLancamento: (
    produtoId: string,
    itemId: string,
    lancamento: Omit<CustoLancamento, 'id' | 'criadoEm'>,
  ) => void
  editCustoLancamento: (
    produtoId: string,
    itemId: string,
    lancamentoId: string,
    novosDados: Omit<CustoLancamento, 'id' | 'criadoEm'>,
  ) => void
  deleteCustoLancamento: (produtoId: string, itemId: string, lancamentoId: string) => void
  createProduto: (nome: string, unidadesLote?: number) => void
  renameProduto: (produtoId: string, novoNome: string) => void
  deleteProduto: (produtoId: string) => void

  // Clientes
  addCliente: (cliente: Omit<Cliente, 'id' | 'pedidos' | 'dataCadastro'>) => Cliente
  updateCliente: (id: string, cliente: Partial<Cliente>) => void
  deleteCliente: (id: string) => void
  addPedidoCliente: (
    clienteId: string,
    pedido: Omit<PedidoCliente, 'id' | 'criadoEm' | 'clienteId' | 'clienteNome'>,
  ) => void
  updatePedidoStatus: (clienteId: string, pedidoId: string, status: PedidoCliente['status']) => void
  deletePedidoCliente: (clienteId: string, pedidoId: string) => void

  // Fornecedores
  addFornecedor: (fornecedor: Omit<Fornecedor, 'id' | 'criadoEm'>) => void
  updateFornecedor: (id: string, fornecedor: Partial<Fornecedor>) => void
  deleteFornecedor: (id: string) => void

  // MÓDULO 6: ESTOQUE
  addInsumoEstoque: (insumo: Omit<InsumoEstoque, 'id' | 'criadoEm'>) => InsumoEstoque
  updateInsumoEstoque: (id: string, insumo: Partial<InsumoEstoque>) => void
  deleteInsumoEstoque: (id: string) => void
  addMovimentacaoEstoque: (
    mov: Omit<MovimentacaoEstoque, 'id' | 'criadoEm'>,
    opcoes?: { refletirEmCustos?: boolean; custoItemId?: string },
  ) => void
  editMovimentacaoEstoque: (id: string, mov: Omit<MovimentacaoEstoque, 'id' | 'criadoEm'>) => void
  deleteMovimentacaoEstoque: (id: string) => void
  updateProdutoPronto: (id: string, item: Partial<ProdutoProntoItem>) => void
  addProdutoPronto: (item: Omit<ProdutoProntoItem, 'id' | 'atualizadoEm'>) => void

  // Configurações e Backup
  updateSettings: (newSettings: Partial<AppSettings>) => void
  restoreDataFromJson: (jsonData: AppData, auditData?: AuditEntry[]) => void
  resetAllData: () => void
  logAudit: (modulo: AuditEntry['modulo'], acao: string, detalhe: string) => void
}

const AppContext = createContext<AppContextType | null>(null)

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData>(() => carregarDados())
  const [audit, setAudit] = useState<AuditEntry[]>(() => carregarAuditoria())
  const [settings, setSettings] = useState<AppSettings>(() => carregarConfiguracoes())
  const [selectedClienteIdFoco, setSelectedClienteIdFoco] = useState<string | null>(null)
  const [focoSecaoRelatorio, setFocoSecaoRelatorio] = useState<string | null>(null)

  // Período compartilhado entre Painel e Relatórios
  const periodoRelatorioTipo = settings.periodoRelatorioTipo || 'mes_atual'
  const setPeriodoRelatorioTipo = (tipo: string) => {
    setSettings((prev) => ({ ...prev, periodoRelatorioTipo: tipo }))
  }

  const hojeIso = new Date().toISOString().split('T')[0]
  const data30dAtrasIso = (() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })()

  const periodoCustomInicio = settings.periodoCustomInicio || data30dAtrasIso
  const setPeriodoCustomInicio = (ini: string) => {
    setSettings((prev) => ({ ...prev, periodoCustomInicio: ini }))
  }

  const periodoCustomFim = settings.periodoCustomFim || hojeIso
  const setPeriodoCustomFim = (fim: string) => {
    setSettings((prev) => ({ ...prev, periodoCustomFim: fim }))
  }

  const navegarParaCliente = (clienteId: string) => {
    setSelectedClienteIdFoco(clienteId)
    setSettings((prev) => ({ ...prev, abaAtiva: 'clientes' }))
  }

  const navegarParaRelatorio = (secao?: 'produtos' | 'clientes' | 'canais' | 'resumo') => {
    if (secao) {
      setFocoSecaoRelatorio(secao)
    }
    setSettings((prev) => ({ ...prev, abaAtiva: 'relatorios' }))
  }

  // Persistir dados quando mudarem
  useEffect(() => {
    salvarDados(data)
  }, [data])

  useEffect(() => {
    salvarConfiguracoes(settings)
  }, [settings])

  const logAudit = (modulo: AuditEntry['modulo'], acao: string, detalhe: string) => {
    registrarAuditoria(modulo, acao, detalhe)
    setAudit(carregarAuditoria())
  }

  const setActiveTab = (tab: TabId) => {
    setSettings((prev) => ({ ...prev, abaAtiva: tab }))
  }

  const activeTab = settings.abaAtiva || 'custos'

  const activeProduct =
    data.produtos.find((p) => p.id === settings.produtoAtivoId) ||
    data.produtos[0] ||
    PRODUTOS_PADRAO[0]

  const setActiveProductId = (id: string) => {
    setSettings((prev) => ({ ...prev, produtoAtivoId: id }))
  }

  // --- MÓDULO 1: CUSTOS / PRODUTOS ---
  const updateProdutoLote = (produtoId: string, unidadesLote: number) => {
    const seguroLote = Math.max(1, Math.round(unidadesLote))
    setData((prev) => {
      const novos = prev.produtos.map((p) =>
        p.id === produtoId ? { ...p, unidadesLote: seguroLote } : p,
      )
      return { ...prev, produtos: novos }
    })
    logAudit(
      'Custos',
      'Lote alterado',
      `Lote do produto ${activeProduct.nome} alterado para ${seguroLote} unidades.`,
    )
  }

  const updateCustoBase = (produtoId: string, itemId: string, novoCustoBase: number) => {
    const valorPositivo = Math.max(0, novoCustoBase)
    setData((prev) => {
      const produtos = prev.produtos.map((prod) => {
        if (prod.id !== produtoId) return prod
        const itens = prod.itens.map((it) => {
          if (it.id !== itemId) return it
          return { ...it, custoBase: valorPositivo }
        })
        return { ...prod, itens }
      })
      return { ...prev, produtos }
    })
    const itemNome = activeProduct.itens.find((i) => i.id === itemId)?.nome || itemId
    logAudit(
      'Custos',
      'Custo base editado',
      `Item "${itemNome}" custo base ajustado para R$ ${valorPositivo.toFixed(2)}.`,
    )
  }

  const addCustoLancamento = (
    produtoId: string,
    itemId: string,
    lanc: Omit<CustoLancamento, 'id' | 'criadoEm'>,
  ) => {
    const novoId = 'lanc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4)
    const novoLancamento: CustoLancamento = {
      id: novoId,
      data: lanc.data || new Date().toISOString().split('T')[0],
      descricao: sanitizarTexto(lanc.descricao) || 'Gasto extra',
      valor: Math.max(0, lanc.valor || 0),
      criadoEm: new Date().toISOString(),
    }

    setData((prev) => {
      const produtos = prev.produtos.map((prod) => {
        if (prod.id !== produtoId) return prod
        const itens = prod.itens.map((it) => {
          if (it.id !== itemId) return it
          return {
            ...it,
            lancamentos: [novoLancamento, ...it.lancamentos],
          }
        })
        return { ...prod, itens }
      })
      return { ...prev, produtos }
    })

    const itemNome = activeProduct.itens.find((i) => i.id === itemId)?.nome || itemId
    logAudit(
      'Custos',
      'Lançamento adicionado',
      `Item "${itemNome}": ${novoLancamento.descricao} no valor de R$ ${novoLancamento.valor.toFixed(2)}.`,
    )
  }

  const editCustoLancamento = (
    produtoId: string,
    itemId: string,
    lancamentoId: string,
    novosDados: Omit<CustoLancamento, 'id' | 'criadoEm'>,
  ) => {
    setData((prev) => {
      const produtos = prev.produtos.map((prod) => {
        if (prod.id !== produtoId) return prod
        const itens = prod.itens.map((it) => {
          if (it.id !== itemId) return it
          const lancamentos = it.lancamentos.map((l) => {
            if (l.id !== lancamentoId) return l
            return {
              ...l,
              data: novosDados.data,
              descricao: sanitizarTexto(novosDados.descricao),
              valor: Math.max(0, novosDados.valor),
            }
          })
          return { ...it, lancamentos }
        })
        return { ...prod, itens }
      })
      return { ...prev, produtos }
    })
    logAudit('Custos', 'Lançamento editado', `Lançamento ${lancamentoId} atualizado.`)
  }

  const deleteCustoLancamento = (produtoId: string, itemId: string, lancamentoId: string) => {
    setData((prev) => {
      const produtos = prev.produtos.map((prod) => {
        if (prod.id !== produtoId) return prod
        const itens = prod.itens.map((it) => {
          if (it.id !== itemId) return it
          return {
            ...it,
            lancamentos: it.lancamentos.filter((l) => l.id !== lancamentoId),
          }
        })
        return { ...prod, itens }
      })
      return { ...prev, produtos }
    })
    logAudit(
      'Custos',
      'Lançamento excluído',
      `Lançamento ${lancamentoId} removido do item ${itemId}.`,
    )
  }

  const createProduto = (nome: string, unidadesLote = 100) => {
    const nomeLimpo = sanitizarTexto(nome) || 'Novo Produto/Kit'
    const id = 'prod-' + Date.now()
    const novosItens: CustoItem[] = activeProduct.itens.map((it) => ({
      ...it,
      lancamentos: [],
    }))

    const novoProduto: ProdutoKit = {
      id,
      nome: nomeLimpo,
      unidadesLote: Math.max(1, unidadesLote),
      itens: novosItens,
      criadoEm: new Date().toISOString(),
    }

    setData((prev) => ({
      ...prev,
      produtos: [...prev.produtos, novoProduto],
    }))
    setSettings((prev) => ({ ...prev, produtoAtivoId: id }))
    logAudit('Custos', 'Produto/Kit criado', `Criado novo produto/kit: "${nomeLimpo}".`)
  }

  const renameProduto = (produtoId: string, novoNome: string) => {
    const nomeLimpo = sanitizarTexto(novoNome)
    if (!nomeLimpo) return
    setData((prev) => ({
      ...prev,
      produtos: prev.produtos.map((p) => (p.id === produtoId ? { ...p, nome: nomeLimpo } : p)),
    }))
    logAudit('Custos', 'Produto renomeado', `Produto renomeado para "${nomeLimpo}".`)
  }

  const deleteProduto = (produtoId: string) => {
    if (data.produtos.length <= 1) {
      return
    }
    const produtoNome = data.produtos.find((p) => p.id === produtoId)?.nome || produtoId
    setData((prev) => {
      const restantes = prev.produtos.filter((p) => p.id !== produtoId)
      return { ...prev, produtos: restantes }
    })
    // Ajusta produto ativo
    const outros = data.produtos.filter((p) => p.id !== produtoId)
    if (outros.length > 0) {
      setSettings((prev) => ({ ...prev, produtoAtivoId: outros[0].id }))
    }
    logAudit('Custos', 'Produto excluído', `Produto "${produtoNome}" excluído.`)
  }

  // --- MÓDULO 3: CLIENTES ---
  const addCliente = (c: Omit<Cliente, 'id' | 'pedidos' | 'dataCadastro'>): Cliente => {
    const novoId = 'cli-' + Date.now()
    const novo: Cliente = {
      id: novoId,
      nome: sanitizarTexto(c.nome),
      endereco: sanitizarTexto(c.endereco),
      telefoneWhatsapp: sanitizarTexto(c.telefoneWhatsapp),
      telefoneRecado: sanitizarTexto(c.telefoneRecado),
      email: sanitizarTexto(c.email).toLowerCase(),
      instagram: sanitizarTexto(c.instagram),
      facebook: sanitizarTexto(c.facebook),
      tiktok: sanitizarTexto(c.tiktok),
      outrosCanais: sanitizarTexto(c.outrosCanais),
      consentimentoLgpd: Boolean(c.consentimentoLgpd),
      dataCadastro: new Date().toISOString().split('T')[0],
      pedidos: [],
    }

    setData((prev) => ({
      ...prev,
      clientes: [novo, ...prev.clientes],
    }))
    logAudit('Clientes', 'Cliente cadastrado', `Cliente "${novo.nome}" cadastrado com sucesso.`)
    return novo
  }

  const updateCliente = (id: string, c: Partial<Cliente>) => {
    setData((prev) => ({
      ...prev,
      clientes: prev.clientes.map((cli) => {
        if (cli.id !== id) return cli
        return {
          ...cli,
          nome: c.nome !== undefined ? sanitizarTexto(c.nome) : cli.nome,
          endereco: c.endereco !== undefined ? sanitizarTexto(c.endereco) : cli.endereco,
          telefoneWhatsapp:
            c.telefoneWhatsapp !== undefined
              ? sanitizarTexto(c.telefoneWhatsapp)
              : cli.telefoneWhatsapp,
          telefoneRecado:
            c.telefoneRecado !== undefined ? sanitizarTexto(c.telefoneRecado) : cli.telefoneRecado,
          email: c.email !== undefined ? sanitizarTexto(c.email).toLowerCase() : cli.email,
          instagram: c.instagram !== undefined ? sanitizarTexto(c.instagram) : cli.instagram,
          facebook: c.facebook !== undefined ? sanitizarTexto(c.facebook) : cli.facebook,
          tiktok: c.tiktok !== undefined ? sanitizarTexto(c.tiktok) : cli.tiktok,
          outrosCanais:
            c.outrosCanais !== undefined ? sanitizarTexto(c.outrosCanais) : cli.outrosCanais,
          consentimentoLgpd:
            c.consentimentoLgpd !== undefined
              ? Boolean(c.consentimentoLgpd)
              : cli.consentimentoLgpd,
        }
      }),
    }))
    logAudit('Clientes', 'Cliente editado', `Cadastro do cliente ${id} atualizado.`)
  }

  const deleteCliente = (id: string) => {
    const nome = data.clientes.find((c) => c.id === id)?.nome || id
    setData((prev) => ({
      ...prev,
      clientes: prev.clientes.filter((c) => c.id !== id),
    }))
    logAudit('Clientes', 'Cliente excluído', `Cliente "${nome}" excluído com histórico.`)
  }

  const addPedidoCliente = (
    clienteId: string,
    p: Omit<PedidoCliente, 'id' | 'criadoEm' | 'clienteId' | 'clienteNome'>,
  ) => {
    const cliente = data.clientes.find((c) => c.id === clienteId)
    const clienteNome = cliente?.nome || 'Cliente'
    const pedidoId = 'ped-' + Date.now()

    const novoPedido: PedidoCliente = {
      ...p,
      id: pedidoId,
      clienteId,
      clienteNome,
      criadoEm: new Date().toISOString(),
    }

    setData((prev) => ({
      ...prev,
      clientes: prev.clientes.map((cli) => {
        if (cli.id !== clienteId) return cli
        return {
          ...cli,
          pedidos: [novoPedido, ...cli.pedidos],
        }
      }),
    }))

    logAudit(
      'Calculadora',
      'Pedido salvo',
      `Pedido #${pedidoId} registrado para ${clienteNome} - ${p.quantidade} un de ${p.produtoNome} (R$ ${p.receita.toFixed(2)}).`,
    )
  }

  const updatePedidoStatus = (
    clienteId: string,
    pedidoId: string,
    status: PedidoCliente['status'],
  ) => {
    setData((prev) => ({
      ...prev,
      clientes: prev.clientes.map((cli) => {
        if (cli.id !== clienteId) return cli
        return {
          ...cli,
          pedidos: cli.pedidos.map((ped) => (ped.id === pedidoId ? { ...ped, status } : ped)),
        }
      }),
    }))
    logAudit(
      'Calculadora',
      'Status do pedido alterado',
      `Pedido #${pedidoId} alterado para status "${status}".`,
    )
  }

  const deletePedidoCliente = (clienteId: string, pedidoId: string) => {
    setData((prev) => ({
      ...prev,
      clientes: prev.clientes.map((cli) => {
        if (cli.id !== clienteId) return cli
        return {
          ...cli,
          pedidos: cli.pedidos.filter((ped) => ped.id !== pedidoId),
        }
      }),
    }))
    logAudit(
      'Calculadora',
      'Pedido excluído',
      `Pedido #${pedidoId} excluído do cliente ${clienteId}.`,
    )
  }

  // --- MÓDULO 4: FORNECEDORES ---
  const addFornecedor = (f: Omit<Fornecedor, 'id' | 'criadoEm'>) => {
    const novo: Fornecedor = {
      ...f,
      id: 'forn-' + Date.now(),
      nome: sanitizarTexto(f.nome),
      contato: sanitizarTexto(f.contato),
      prazo: sanitizarTexto(f.prazo),
      link: f.link ? sanitizarTexto(f.link) : '',
      criadoEm: new Date().toISOString(),
    }
    setData((prev) => ({
      ...prev,
      fornecedores: [novo, ...prev.fornecedores],
    }))
    logAudit(
      'Fornecedores',
      'Fornecedor adicionado',
      `Fornecedor "${novo.nome}" cadastrado para o insumo "${novo.insumoNome}".`,
    )
  }

  const updateFornecedor = (id: string, f: Partial<Fornecedor>) => {
    setData((prev) => ({
      ...prev,
      fornecedores: prev.fornecedores.map((forn) => {
        if (forn.id !== id) return forn
        return {
          ...forn,
          ...f,
          nome: f.nome !== undefined ? sanitizarTexto(f.nome) : forn.nome,
          contato: f.contato !== undefined ? sanitizarTexto(f.contato) : forn.contato,
          prazo: f.prazo !== undefined ? sanitizarTexto(f.prazo) : forn.prazo,
          link: f.link !== undefined ? sanitizarTexto(f.link) : forn.link,
        }
      }),
    }))
    logAudit('Fornecedores', 'Fornecedor editado', `Fornecedor ${id} atualizado.`)
  }

  const deleteFornecedor = (id: string) => {
    const nome = data.fornecedores.find((f) => f.id === id)?.nome || id
    setData((prev) => ({
      ...prev,
      fornecedores: prev.fornecedores.filter((f) => f.id !== id),
    }))
    logAudit('Fornecedores', 'Fornecedor excluído', `Fornecedor "${nome}" excluído.`)
  }

  // --- MÓDULO 6: ESTOQUE ---

  // Função auxiliar para recalcular saldo e custo médio de um insumo com base no histórico de movimentações
  const recalcularInsumo = (
    insumoAtual: InsumoEstoque,
    todasMovs: MovimentacaoEstoque[],
  ): InsumoEstoque => {
    const movsItem = todasMovs
      .filter((m) => m.itemId === insumoAtual.id)
      .sort((a, b) =>
        a.data > b.data ? 1 : a.data < b.data ? -1 : a.criadoEm > b.criadoEm ? 1 : -1,
      )

    let saldo = 0
    let valorAcumulado = 0
    let custoMedio = insumoAtual.custoMedioUnitario || 0

    for (const m of movsItem) {
      if (m.tipo === 'entrada') {
        const precoEntrada =
          m.custoUnitario !== undefined && m.custoUnitario >= 0 ? m.custoUnitario : custoMedio
        const novoSaldo = saldo + m.quantidade
        if (novoSaldo > 0) {
          valorAcumulado = saldo * custoMedio + m.quantidade * precoEntrada
          custoMedio = valorAcumulado / novoSaldo
        }
        saldo = Math.max(0, novoSaldo)
      } else {
        // saída
        saldo = Math.max(0, saldo - m.quantidade)
        valorAcumulado = saldo * custoMedio
      }
    }

    // Se não houver movimentações cadastradas, mantém a quantidade informada do insumo
    if (movsItem.length === 0) {
      return insumoAtual
    }

    return {
      ...insumoAtual,
      quantidadeAtual: Number(saldo.toFixed(2)),
      custoMedioUnitario: Number(custoMedio.toFixed(2)),
    }
  }

  const addInsumoEstoque = (insumo: Omit<InsumoEstoque, 'id' | 'criadoEm'>): InsumoEstoque => {
    const novoId = 'est-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4)
    const novo: InsumoEstoque = {
      id: novoId,
      nome: sanitizarTexto(insumo.nome),
      categoria: insumo.categoria ? sanitizarTexto(insumo.categoria) : 'Insumo',
      unidade: sanitizarTexto(insumo.unidade) || 'un',
      quantidadeAtual: Math.max(0, insumo.quantidadeAtual || 0),
      custoMedioUnitario: Math.max(0, insumo.custoMedioUnitario || 0),
      estoqueMinimo: Math.max(0, insumo.estoqueMinimo || 0),
      criadoEm: new Date().toISOString(),
    }

    setData((prev) => {
      const estoqueAtual = prev.estoque || ESTOQUE_PADRAO
      return {
        ...prev,
        estoque: {
          ...estoqueAtual,
          insumos: [...estoqueAtual.insumos, novo],
        },
      }
    })

    logAudit(
      'Estoque',
      'Insumo adicionado',
      `Insumo "${novo.nome}" cadastrado com estoque inicial de ${novo.quantidadeAtual} ${novo.unidade} e mínimo de ${novo.estoqueMinimo}.`,
    )

    return novo
  }

  const updateInsumoEstoque = (id: string, insumo: Partial<InsumoEstoque>) => {
    setData((prev) => {
      const estoqueAtual = prev.estoque || ESTOQUE_PADRAO
      const insumosAtualizados = estoqueAtual.insumos.map((item) => {
        if (item.id !== id) return item
        return {
          ...item,
          nome: insumo.nome !== undefined ? sanitizarTexto(insumo.nome) : item.nome,
          categoria:
            insumo.categoria !== undefined ? sanitizarTexto(insumo.categoria) : item.categoria,
          unidade: insumo.unidade !== undefined ? sanitizarTexto(insumo.unidade) : item.unidade,
          quantidadeAtual:
            insumo.quantidadeAtual !== undefined
              ? Math.max(0, insumo.quantidadeAtual)
              : item.quantidadeAtual,
          custoMedioUnitario:
            insumo.custoMedioUnitario !== undefined
              ? Math.max(0, insumo.custoMedioUnitario)
              : item.custoMedioUnitario,
          estoqueMinimo:
            insumo.estoqueMinimo !== undefined
              ? Math.max(0, insumo.estoqueMinimo)
              : item.estoqueMinimo,
        }
      })
      return {
        ...prev,
        estoque: {
          ...estoqueAtual,
          insumos: insumosAtualizados,
        },
      }
    })

    logAudit('Estoque', 'Insumo atualizado', `Insumo ${id} atualizado.`)
  }

  const deleteInsumoEstoque = (id: string) => {
    const estoqueAtual = data.estoque || ESTOQUE_PADRAO
    const insumoNome = estoqueAtual.insumos.find((i) => i.id === id)?.nome || id

    setData((prev) => {
      const est = prev.estoque || ESTOQUE_PADRAO
      return {
        ...prev,
        estoque: {
          ...est,
          insumos: est.insumos.filter((i) => i.id !== id),
          movimentacoes: est.movimentacoes.filter((m) => m.itemId !== id),
        },
      }
    })

    logAudit(
      'Estoque',
      'Insumo excluído',
      `Insumo "${insumoNome}" e suas movimentações foram excluídos do estoque.`,
    )
  }

  const addMovimentacaoEstoque = (
    mov: Omit<MovimentacaoEstoque, 'id' | 'criadoEm'>,
    opcoes?: { refletirEmCustos?: boolean; custoItemId?: string },
  ) => {
    const novoId = 'mov-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4)
    const novaMov: MovimentacaoEstoque = {
      ...mov,
      id: novoId,
      quantidade: Math.max(0, mov.quantidade || 0),
      custoUnitario: mov.custoUnitario !== undefined ? Math.max(0, mov.custoUnitario) : undefined,
      observacao: mov.observacao ? sanitizarTexto(mov.observacao) : '',
      refletirEmCustos: Boolean(opcoes?.refletirEmCustos),
      criadoEm: new Date().toISOString(),
    }

    setData((prev) => {
      const est = prev.estoque || ESTOQUE_PADRAO
      const novasMovs = [novaMov, ...est.movimentacoes]

      // Atualizar saldo e custo médio do insumo correspondente
      const insumosAtualizados = est.insumos.map((item) => {
        if (item.id !== novaMov.itemId) return item
        let novoSaldo = item.quantidadeAtual
        let novoCustoMedio = item.custoMedioUnitario

        if (novaMov.tipo === 'entrada') {
          const valorAnterior = novoSaldo * novoCustoMedio
          const precoCompra =
            novaMov.custoUnitario !== undefined ? novaMov.custoUnitario : novoCustoMedio
          const valorNovaEntrada = novaMov.quantidade * precoCompra
          novoSaldo = novoSaldo + novaMov.quantidade
          if (novoSaldo > 0) {
            novoCustoMedio = (valorAnterior + valorNovaEntrada) / novoSaldo
          }
        } else {
          novoSaldo = Math.max(0, novoSaldo - novaMov.quantidade)
        }

        return {
          ...item,
          quantidadeAtual: Number(novoSaldo.toFixed(2)),
          custoMedioUnitario: Number(novoCustoMedio.toFixed(2)),
        }
      })

      // Se solicitado refletir em Custos e for entrada com custo pago
      let novosProdutos = prev.produtos
      if (opcoes?.refletirEmCustos && novaMov.tipo === 'entrada' && novaMov.custoUnitario) {
        const custoTotalCompra = novaMov.quantidade * novaMov.custoUnitario
        // Localiza item correspondente pelo nome ou id
        const alvoItemId =
          opcoes.custoItemId ||
          activeProduct.itens.find(
            (it) =>
              it.nome.toLowerCase() === novaMov.itemNome.toLowerCase() ||
              novaMov.itemId.includes(it.id),
          )?.id

        if (alvoItemId) {
          const lanc: CustoLancamento = {
            id: 'lanc-est-' + Date.now(),
            data: novaMov.data,
            descricao: `Entrada estoque (${novaMov.quantidade} un): ${novaMov.observacao || 'Compra'}`,
            valor: Number(custoTotalCompra.toFixed(2)),
            criadoEm: new Date().toISOString(),
          }

          novosProdutos = prev.produtos.map((p) => {
            if (p.id !== activeProduct.id) return p
            return {
              ...p,
              itens: p.itens.map((it) =>
                it.id === alvoItemId ? { ...it, lancamentos: [lanc, ...it.lancamentos] } : it,
              ),
            }
          })
        }
      }

      return {
        ...prev,
        produtos: novosProdutos,
        estoque: {
          ...est,
          insumos: insumosAtualizados,
          movimentacoes: novasMovs,
        },
      }
    })

    const tipoStr = novaMov.tipo === 'entrada' ? 'Entrada' : 'Saída'
    logAudit(
      'Estoque',
      `Movimentação registrada (${tipoStr})`,
      `${tipoStr} de ${novaMov.quantidade} no item "${novaMov.itemNome}" (Motivo: ${novaMov.motivo}).`,
    )
  }

  const editMovimentacaoEstoque = (
    id: string,
    mov: Omit<MovimentacaoEstoque, 'id' | 'criadoEm'>,
  ) => {
    setData((prev) => {
      const est = prev.estoque || ESTOQUE_PADRAO
      const novasMovs = est.movimentacoes.map((m) => {
        if (m.id !== id) return m
        return {
          ...m,
          itemId: mov.itemId,
          itemNome: mov.itemNome,
          data: mov.data,
          tipo: mov.tipo,
          quantidade: Math.max(0, mov.quantidade),
          custoUnitario:
            mov.custoUnitario !== undefined ? Math.max(0, mov.custoUnitario) : undefined,
          motivo: mov.motivo,
          observacao: mov.observacao ? sanitizarTexto(mov.observacao) : '',
        }
      })

      // Recalcular todos os insumos afetados
      const insumosAtualizados = est.insumos.map((item) => recalcularInsumo(item, novasMovs))

      return {
        ...prev,
        estoque: {
          ...est,
          insumos: insumosAtualizados,
          movimentacoes: novasMovs,
        },
      }
    })

    logAudit(
      'Estoque',
      'Movimentação editada',
      `Movimentação ${id} atualizada com recálculo de saldo.`,
    )
  }

  const deleteMovimentacaoEstoque = (id: string) => {
    const est = data.estoque || ESTOQUE_PADRAO
    const mov = est.movimentacoes.find((m) => m.id === id)

    setData((prev) => {
      const atualEst = prev.estoque || ESTOQUE_PADRAO
      const novasMovs = atualEst.movimentacoes.filter((m) => m.id !== id)
      const insumosAtualizados = atualEst.insumos.map((item) => recalcularInsumo(item, novasMovs))

      return {
        ...prev,
        estoque: {
          ...atualEst,
          insumos: insumosAtualizados,
          movimentacoes: novasMovs,
        },
      }
    })

    logAudit(
      'Estoque',
      'Movimentação excluída',
      `Movimentação de ${mov?.tipo || ''} (${mov?.quantidade || 0} un) de "${mov?.itemNome || id}" removida com recálculo de saldo.`,
    )
  }

  const updateProdutoPronto = (id: string, item: Partial<ProdutoProntoItem>) => {
    setData((prev) => {
      const est = prev.estoque || ESTOQUE_PADRAO
      const produtosAtualizados = est.produtosProntos.map((pp) => {
        if (pp.id !== id) return pp
        const prod =
          item.quantidadeProduzida !== undefined
            ? Math.max(0, item.quantidadeProduzida)
            : pp.quantidadeProduzida
        const vend =
          item.quantidadeVendida !== undefined
            ? Math.max(0, item.quantidadeVendida)
            : pp.quantidadeVendida
        const disp =
          item.quantidadeDisponivel !== undefined
            ? Math.max(0, item.quantidadeDisponivel)
            : Math.max(0, prod - vend)

        return {
          ...pp,
          produtoNome:
            item.produtoNome !== undefined ? sanitizarTexto(item.produtoNome) : pp.produtoNome,
          quantidadeProduzida: prod,
          quantidadeVendida: vend,
          quantidadeDisponivel: disp,
          custoEstimadoUnitario:
            item.custoEstimadoUnitario !== undefined
              ? Math.max(0, item.custoEstimadoUnitario)
              : pp.custoEstimadoUnitario,
          observacao:
            item.observacao !== undefined ? sanitizarTexto(item.observacao) : pp.observacao,
          atualizadoEm: new Date().toISOString(),
        }
      })

      return {
        ...prev,
        estoque: {
          ...est,
          produtosProntos: produtosAtualizados,
        },
      }
    })

    logAudit('Estoque', 'Produto pronto atualizado', `Estoque de produto acabado ${id} atualizado.`)
  }

  const addProdutoPronto = (item: Omit<ProdutoProntoItem, 'id' | 'atualizadoEm'>) => {
    const novoId = 'pp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4)
    const novo: ProdutoProntoItem = {
      ...item,
      id: novoId,
      produtoNome: sanitizarTexto(item.produtoNome),
      quantidadeProduzida: Math.max(0, item.quantidadeProduzida || 0),
      quantidadeVendida: Math.max(0, item.quantidadeVendida || 0),
      quantidadeDisponivel: Math.max(
        0,
        item.quantidadeDisponivel !== undefined
          ? item.quantidadeDisponivel
          : (item.quantidadeProduzida || 0) - (item.quantidadeVendida || 0),
      ),
      custoEstimadoUnitario: Math.max(0, item.custoEstimadoUnitario || 0),
      observacao: item.observacao ? sanitizarTexto(item.observacao) : '',
      atualizadoEm: new Date().toISOString(),
    }

    setData((prev) => {
      const est = prev.estoque || ESTOQUE_PADRAO
      return {
        ...prev,
        estoque: {
          ...est,
          produtosProntos: [...est.produtosProntos, novo],
        },
      }
    })

    logAudit(
      'Estoque',
      'Produto pronto adicionado',
      `Novo produto pronto cadastrado: "${novo.produtoNome}".`,
    )
  }

  // --- CONFIGURAÇÕES E RESTAURAÇÃO ---
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }))
  }

  const restoreDataFromJson = (jsonData: AppData, auditData?: AuditEntry[]) => {
    if (!jsonData.produtos || !Array.isArray(jsonData.produtos)) {
      throw new Error('Arquivo de backup inválido: lista de produtos ausente.')
    }
    setData(jsonData)
    if (auditData && Array.isArray(auditData)) {
      setAudit(auditData)
      salvarAuditoria(auditData)
    }
    logAudit(
      'Sistema',
      'Importação realizada',
      'Dados e histórico restaurados a partir de arquivo de backup JSON.',
    )
  }

  const resetAllData = () => {
    const defaults: AppData = {
      produtos: PRODUTOS_PADRAO,
      clientes: CLIENTES_PADRAO,
      fornecedores: FORNECEDORES_PADRAO,
      version: 1,
    }
    setData(defaults)
    setAudit(AUDIT_PADRAO)
    salvarAuditoria(AUDIT_PADRAO)
    setSettings(SETTINGS_PADRAO)
    logAudit(
      'Sistema',
      'Restauração de fábrica',
      'Todos os dados locais foram restaurados para os padrões originais.',
    )
  }

  return (
    <AppContext.Provider
      value={{
        data,
        audit,
        settings,
        activeTab,
        setActiveTab,
        selectedClienteIdFoco,
        setSelectedClienteIdFoco,
        navegarParaCliente,
        navegarParaRelatorio,
        focoSecaoRelatorio,
        setFocoSecaoRelatorio,
        periodoRelatorioTipo,
        setPeriodoRelatorioTipo,
        periodoCustomInicio,
        setPeriodoCustomInicio,
        periodoCustomFim,
        setPeriodoCustomFim,
        activeProduct,
        setActiveProductId,
        updateProdutoLote,
        updateCustoBase,
        addCustoLancamento,
        editCustoLancamento,
        deleteCustoLancamento,
        createProduto,
        renameProduto,
        deleteProduto,
        addCliente,
        updateCliente,
        deleteCliente,
        addPedidoCliente,
        updatePedidoStatus,
        deletePedidoCliente,
        addFornecedor,
        updateFornecedor,
        deleteFornecedor,
        addInsumoEstoque,
        updateInsumoEstoque,
        deleteInsumoEstoque,
        addMovimentacaoEstoque,
        editMovimentacaoEstoque,
        deleteMovimentacaoEstoque,
        updateProdutoPronto,
        addProdutoPronto,
        updateSettings,
        restoreDataFromJson,
        resetAllData,
        logAudit,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp deve ser usado dentro de AppProvider')
  }
  return context
}
