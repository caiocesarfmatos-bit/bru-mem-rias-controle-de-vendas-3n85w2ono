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
} from '@/lib/storage'
import { sanitizarTexto } from '@/lib/formatters'

interface AppContextType {
  data: AppData
  audit: AuditEntry[]
  settings: AppSettings
  activeTab: TabId
  setActiveTab: (tab: TabId) => void
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
