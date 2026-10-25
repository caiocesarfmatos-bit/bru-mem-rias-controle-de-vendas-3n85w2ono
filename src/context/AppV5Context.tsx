import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  AppDataV5,
  AbaPrincipalId,
  SubsecaoId,
  Parametro,
  CHAVES_PARAMETROS,
  Produto,
  FaixaPreco,
  ComposicaoItem,
  Insumo,
  Fornecedor,
  CustoItem,
  CustoLancamento,
  Cliente,
  Orcamento,
  Pedido,
  StatusPedido,
  StatusOrcamento,
  ArquivoArte,
  AuditEntry,
  LancamentoFinanceiro,
  MovimentoEstoque,
  CompromissoFiscal,
  RegiaoAtendimento,
  Lead,
  CampanhaMarketing,
  ConteudoPlanejamento,
  MotivoPerda,
  ChecklistFinalizacao,
} from '@/types/appV5'
import {
  carregarDadosV5,
  salvarDadosV5,
  DADOS_PADRAO_V5,
  PRODUTOS_PADRAO_V5,
  calcularCustoTotalUnitario,
  buscarFaixaPreco,
  ITENS_CUSTO_PADRAO,
} from '@/lib/storageV5'
import { derivarSenhaPbkdf2, verificarSenhaPbkdf2 } from '@/lib/authCrypto'
import { sanitizarTexto } from '@/lib/formatters'

interface AppV5ContextType {
  data: AppDataV5
  abaAtiva: AbaPrincipalId
  setAbaAtiva: (aba: AbaPrincipalId) => void
  subsecaoAtiva: SubsecaoId
  setSubsecaoAtiva: (sub: SubsecaoId) => void
  navegarPara: (aba: AbaPrincipalId, subsecao?: SubsecaoId) => void

  // Autenticação & Acesso do Administrador
  isConfigurado: boolean
  isAutenticado: boolean
  tentativasRestantes: number
  bloqueadoSegundos: number
  criarSenhaMestre: (senha: string) => Promise<{ sucesso: boolean; mensagem?: string }>
  desbloquearComSenha: (senha: string) => Promise<{ sucesso: boolean; mensagem?: string }>
  sairDoSistema: () => void
  reiniciarSistemaPerdaAcesso: () => void

  // Parâmetros de Negócio (PARAMETRO - Fonte única de todo limite numérico)
  getParametro: (chave: string) => number
  atualizarParametro: (chave: string, novoValor: number) => { sucesso: boolean; erro?: string }

  // Auditoria segura (PROIBIDO registrar dados pessoais do cliente)
  registrarAuditoriaSegura: (
    entidade: string,
    entidadeId: string,
    acao: string,
    detalhes?: {
      campoAlterado?: string
      valorAnterior?: string
      valorNovo?: string
      detalhe?: string
    },
  ) => void

  // Clientes & LGPD
  adicionarCliente: (c: Omit<Cliente, 'id' | 'dataCadastro' | 'ativo'>) => Cliente
  atualizarCliente: (id: string, c: Partial<Cliente>) => void
  excluirDadosClienteLgpd: (clienteId: string) => void
  exportarDadosTitularLgpd: (clienteId: string) => string

  // Custos, Insumos & Precificação
  custoTotalUnitarioAtual: number
  adicionarLancamentoCusto: (
    custoItemId: string,
    lancamento: Omit<CustoLancamento, 'id' | 'criadoEm'>,
  ) => void
  editarLancamentoCusto: (
    custoItemId: string,
    lancamentoId: string,
    dados: Omit<CustoLancamento, 'id' | 'criadoEm'>,
  ) => void
  excluirLancamentoCusto: (custoItemId: string, lancamentoId: string) => void
  adicionarItemCustoNaoCatalogado: (nome: string, valorInicial: number, descricao: string) => void
  atualizarCustoBaseItem: (custoItemId: string, novoCustoBase: number) => void
  adicionarProduto: (prod: Omit<Produto, 'id' | 'criadoEm'>) => Produto
  atualizarProduto: (id: string, prod: Partial<Produto>) => void
  adicionarComposicaoKit: (kitId: string, componenteId: string, quantidade: number) => void
  atualizarFaixaPreco: (faixaId: string, dados: Partial<FaixaPreco>) => void

  // Fluxo Comercial: Orçamentos e Pedidos
  criarOrcamento: (orc: {
    clienteId: string
    produtoId: string
    quantidade: number
    frete?: number
    desconto?: number
    validadeDias?: number
    observacoes?: string
  }) => Orcamento
  enviarOrcamento: (orcamentoId: string) => void
  reemitirOrcamentoVencido: (orcamentoId: string, novaValidadeDias?: number) => Orcamento
  marcarOrcamentoPerdido: (orcamentoId: string, motivo: MotivoPerda) => void
  aprovarOrcamentoParaPedido: (
    orcamentoId: string,
    opcoes?: {
      formaPagamento?: string
      exigeSinal?: boolean
      sinalRecebido?: number
      prazoPrometidoDias?: number
    },
  ) => Pedido

  // Pedidos & Produção
  atualizarStatusPedido: (
    pedidoId: string,
    novoStatus: StatusPedido,
    justificativa?: string,
  ) => { sucesso: boolean; erro?: string }
  registrarPerdaPedido: (pedidoId: string, motivo: MotivoPerda) => void
  cancelarPedido: (pedidoId: string, motivo: string) => void
  atualizarChecklistFinalizacao: (
    pedidoId: string,
    checklist: Partial<ChecklistFinalizacao>,
  ) => void

  // Controle de Arte
  cadastrarOuAtualizarArte: (
    arte: Omit<ArquivoArte, 'id' | 'criadoEm'> & { id?: string },
  ) => ArquivoArte
  aprovarArteCliente: (arteId: string) => void

  // Fornecedores & Insumos
  adicionarFornecedor: (f: Omit<Fornecedor, 'id' | 'criadoEm'>) => Fornecedor
  atualizarFornecedor: (id: string, f: Partial<Fornecedor>) => void
  excluirFornecedor: (id: string) => void
  adicionarInsumo: (ins: Omit<Insumo, 'id' | 'criadoEm'>) => Insumo
  atualizarInsumo: (id: string, ins: Partial<Insumo>) => void
  excluirInsumo: (id: string) => void

  // Backup & Importação
  exportarBackupCompletoJson: () => string
  importarBackupCompletoJson: (conteudoJson: string) => {
    sucesso: boolean
    mensagem: string
    contagemAntes?: Record<string, number>
    contagemDepois?: Record<string, number>
  }

  // Primeiro uso / Onboarding de configuração inicial obrigatória
  passoAbertoPrimeiroUso: number | null
  concluirPassoPrimeiroUso: (passo: number) => void
}

const AppV5Context = createContext<AppV5ContextType | null>(null)

export const AppV5Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppDataV5>(() => carregarDadosV5())

  // Navegação
  const [abaAtiva, setAbaAtiva] = useState<AbaPrincipalId>('hoje')
  const [subsecaoAtiva, setSubsecaoAtiva] = useState<SubsecaoId>('painel')

  // Autenticação & Sessão
  const [isAutenticado, setIsAutenticado] = useState<boolean>(false)
  const [tentativasFalhas, setTentativasFalhas] = useState<number>(0)
  const [bloqueadoAte, setBloqueadoAte] = useState<number | null>(null)
  const [bloqueadoSegundos, setBloqueadoSegundos] = useState<number>(0)
  const [ultimoAcessoTimestamp, setUltimoAcessoTimestamp] = useState<number>(() => Date.now())

  // Primeiro uso / Onboarding guiado
  const [passoAbertoPrimeiroUso, setPassoAbertoPrimeiroUso] = useState<number | null>(() => {
    // Se não há orçamentos nem clientes reais além do seed inicial, inicia o passo a passo
    return null
  })

  // Persistência automática
  useEffect(() => {
    salvarDadosV5(data)
  }, [data])

  // Timer de desbloqueio temporário
  useEffect(() => {
    if (!bloqueadoAte) {
      setBloqueadoSegundos(0)
      return
    }

    const interval = setInterval(() => {
      const agora = Date.now()
      const restanteMs = bloqueadoAte - agora
      if (restanteMs <= 0) {
        setBloqueadoAte(null)
        setBloqueadoSegundos(0)
        setTentativasFalhas(0)
        clearInterval(interval)
      } else {
        setBloqueadoSegundos(Math.ceil(restanteMs / 1000))
      }
    }, 500)

    return () => clearInterval(interval)
  }, [bloqueadoAte])

  // Decisão de negócio e solicitação explícita do usuário:
  // Remoção permanente de desligamento automático e bloqueio de tela por inatividade.
  // A sessão permanece ativa até o usuário clicar em "Sair" explicitamente.
  // Nenhum timer de inatividade desloga ou bloqueia o sistema.

  // 1. OBTENÇÃO DE PARÂMETROS
  const getParametro = useCallback(
    (chave: string): number => {
      const p = data.parametros.find((param) => param.chave === chave)
      if (p !== undefined && !isNaN(p.valor)) return p.valor
      // Procura no padrão
      const padrao = DADOS_PADRAO_V5.parametros.find((param) => param.chave === chave)
      return padrao ? padrao.valor : 0
    },
    [data.parametros],
  )

  // 2. AUDITORIA SEGURA (Sem dados pessoais em valorAnterior/valorNovo)
  const registrarAuditoriaSegura = useCallback(
    (
      entidade: string,
      entidadeId: string,
      acao: string,
      detalhes?: {
        campoAlterado?: string
        valorAnterior?: string
        valorNovo?: string
        detalhe?: string
      },
    ) => {
      // Regra de segurança LGPD: proibido armazenar telefone, e-mail, nomes completos do cliente
      const nova: AuditEntry = {
        id: 'aud-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        dataHora: new Date().toISOString(),
        entidade: sanitizarTexto(entidade),
        entidadeId: sanitizarTexto(entidadeId),
        acao: sanitizarTexto(acao),
        campoAlterado: detalhes?.campoAlterado ? sanitizarTexto(detalhes.campoAlterado) : undefined,
        valorAnterior: detalhes?.valorAnterior ? sanitizarTexto(detalhes.valorAnterior) : undefined,
        valorNovo: detalhes?.valorNovo ? sanitizarTexto(detalhes.valorNovo) : undefined,
        usuario: 'Administrador',
        detalhe: detalhes?.detalhe ? sanitizarTexto(detalhes.detalhe) : undefined,
      }

      setData((prev) => {
        const pctRetencao =
          prev.parametros.find((p) => p.chave === CHAVES_PARAMETROS.PCT_RETENCAO_AUDITORIA)
            ?.valor || 70
        // Mantém histórico razoável para respeitar espaço local
        const maxRegistros = Math.max(100, Math.round(pctRetencao * 10))
        const atualizados = [nova, ...(prev.auditoria || [])].slice(0, maxRegistros)
        return { ...prev, auditoria: atualizados }
      })
    },
    [],
  )

  // 3. AUTENTICAÇÃO DO ADMINISTRADOR
  const isConfigurado = Boolean(data.auth?.isConfigurado && data.auth?.senhaHash)

  const criarSenhaMestre = async (
    senha: string,
  ): Promise<{ sucesso: boolean; mensagem?: string }> => {
    if (!senha || senha.trim().length < 4) {
      return {
        sucesso: false,
        mensagem: 'A senha do administrador deve conter pelo menos 4 dígitos.',
      }
    }

    try {
      const { hashHex, salHex } = await derivarSenhaPbkdf2(senha.trim())
      setData((prev) => ({
        ...prev,
        auth: {
          isConfigurado: true,
          senhaHash: hashHex,
          senhaSal: salHex,
        },
      }))
      setIsAutenticado(true)
      setTentativasFalhas(0)
      setBloqueadoAte(null)
      registrarAuditoriaSegura('AUTH', 'admin', 'Senha mestre definida no primeiro uso')
      return { sucesso: true }
    } catch {
      return { sucesso: false, mensagem: 'Erro ao processar segurança no navegador.' }
    }
  }

  const desbloquearComSenha = async (
    senha: string,
  ): Promise<{ sucesso: boolean; mensagem?: string }> => {
    if (bloqueadoAte && Date.now() < bloqueadoAte) {
      return {
        sucesso: false,
        mensagem: `Sistema bloqueado temporariamente por tentativas erradas. Aguarde ${bloqueadoSegundos}s.`,
      }
    }

    if (!data.auth?.senhaHash || !data.auth?.senhaSal) {
      return { sucesso: false, mensagem: 'Senha mestre não configurada.' }
    }

    const correto = await verificarSenhaPbkdf2(
      senha.trim(),
      data.auth.senhaHash,
      data.auth.senhaSal,
    )

    if (correto) {
      setIsAutenticado(true)
      setTentativasFalhas(0)
      setBloqueadoAte(null)
      setUltimoAcessoTimestamp(Date.now())
      registrarAuditoriaSegura('AUTH', 'admin', 'Acesso autorizado por senha')
      return { sucesso: true }
    } else {
      const novasFalhas = tentativasFalhas + 1
      setTentativasFalhas(novasFalhas)
      registrarAuditoriaSegura('AUTH', 'admin', 'Tentativa de senha incorreta', {
        valorNovo: `Tentativa ${novasFalhas}`,
      })

      if (novasFalhas >= 5) {
        const tempoBloqueioSeg = getParametro(CHAVES_PARAMETROS.TEMPO_BLOQUEIO_SEGUNDOS) || 60
        const ate = Date.now() + tempoBloqueioSeg * 1000
        setBloqueadoAte(ate)
        setBloqueadoSegundos(tempoBloqueioSeg)
        registrarAuditoriaSegura('AUTH', 'admin', 'Bloqueio temporário ativado', {
          valorNovo: `${tempoBloqueioSeg}s`,
        })
        return {
          sucesso: false,
          mensagem: `5 tentativas incorretas. O acesso foi bloqueado temporariamente por ${tempoBloqueioSeg} segundos.`,
        }
      }

      return {
        sucesso: false,
        mensagem: `Senha incorreta. ${5 - novasFalhas} tentativa(s) restante(s) antes do bloqueio temporário.`,
      }
    }
  }

  const sairDoSistema = () => {
    setIsAutenticado(false)
    registrarAuditoriaSegura('AUTH', 'admin', 'Sessão encerrada pelo administrador')
  }

  const reiniciarSistemaPerdaAcesso = () => {
    // Redefinição completa com perda de dados antigos caso esqueça a senha
    setData({
      ...DADOS_PADRAO_V5,
      dataHora: new Date().toISOString(),
      auth: { isConfigurado: false },
    })
    setIsAutenticado(false)
    setTentativasFalhas(0)
    setBloqueadoAte(null)
  }

  // 4. ATUALIZAR PARÂMETROS
  const atualizarParametro = (
    chave: string,
    novoValor: number,
  ): { sucesso: boolean; erro?: string } => {
    const param = data.parametros.find((p) => p.chave === chave)
    if (!param) return { sucesso: false, erro: 'Parâmetro não encontrado.' }

    if (novoValor < param.valorMinimo || novoValor > param.valorMaximo) {
      return {
        sucesso: false,
        erro: `Valor fora da faixa permitida (${param.valorMinimo} a ${param.valorMaximo} ${param.unidade}).`,
      }
    }

    const valorAntigo = param.valor
    setData((prev) => ({
      ...prev,
      parametros: prev.parametros.map((p) => (p.chave === chave ? { ...p, valor: novoValor } : p)),
    }))

    registrarAuditoriaSegura('PARAMETRO', chave, 'Parâmetro alterado', {
      campoAlterado: 'valor',
      valorAnterior: String(valorAntigo),
      valorNovo: String(novoValor),
    })

    return { sucesso: true }
  }

  // 5. NAVEGAÇÃO RÁPIDA
  const navegarPara = (aba: AbaPrincipalId, subsecao?: SubsecaoId) => {
    setAbaAtiva(aba)
    if (subsecao) {
      setSubsecaoAtiva(subsecao)
    } else {
      // Subseção padrão por aba
      const defaults: Record<AbaPrincipalId, SubsecaoId> = {
        hoje: 'painel',
        vender: 'clientes',
        produzir: 'producao',
        dinheiro: 'custos',
        crescer: 'planejamento',
      }
      setSubsecaoAtiva(defaults[aba])
    }
  }

  // 6. CUSTOS E PRODUTOS
  const custoTotalUnitarioAtual = calcularCustoTotalUnitario(data.custosItens)

  const adicionarLancamentoCusto = (
    custoItemId: string,
    lancamento: Omit<CustoLancamento, 'id' | 'criadoEm'>,
  ) => {
    const novoLanc: CustoLancamento = {
      id: 'lanc-' + Date.now(),
      data: lancamento.data || new Date().toISOString().split('T')[0],
      descricao: sanitizarTexto(lancamento.descricao) || 'Gasto extra',
      valor: Math.max(0, lancamento.valor || 0),
      criadoEm: new Date().toISOString(),
    }

    setData((prev) => {
      const novosItens = prev.custosItens.map((it) => {
        if (it.id !== custoItemId) return it
        return { ...it, lancamentos: [novoLanc, ...it.lancamentos] }
      })
      const novoCustoTotal = calcularCustoTotalUnitario(novosItens)
      const novosProdutos = prev.produtos.map((p) =>
        p.id === 'prod-ima-5x5'
          ? { ...p, custoUnitarioCalculado: Number(novoCustoTotal.toFixed(2)) }
          : p,
      )
      return { ...prev, custosItens: novosItens, produtos: novosProdutos }
    })

    registrarAuditoriaSegura('CUSTO', custoItemId, 'Lançamento de custo adicionado', {
      valorNovo: String(novoLanc.valor),
      detalhe: novoLanc.descricao,
    })
  }

  const editarLancamentoCusto = (
    custoItemId: string,
    lancamentoId: string,
    novosDados: Omit<CustoLancamento, 'id' | 'criadoEm'>,
  ) => {
    setData((prev) => {
      const novosItens = prev.custosItens.map((it) => {
        if (it.id !== custoItemId) return it
        const lancs = it.lancamentos.map((l) =>
          l.id === lancamentoId
            ? {
                ...l,
                data: novosDados.data,
                descricao: sanitizarTexto(novosDados.descricao),
                valor: Math.max(0, novosDados.valor),
              }
            : l,
        )
        return { ...it, lancamentos: lancs }
      })
      const novoCustoTotal = calcularCustoTotalUnitario(novosItens)
      const novosProdutos = prev.produtos.map((p) =>
        p.id === 'prod-ima-5x5'
          ? { ...p, custoUnitarioCalculado: Number(novoCustoTotal.toFixed(2)) }
          : p,
      )
      return { ...prev, custosItens: novosItens, produtos: novosProdutos }
    })

    registrarAuditoriaSegura('CUSTO', custoItemId, 'Lançamento de custo editado', {
      detalhe: lancamentoId,
    })
  }

  const excluirLancamentoCusto = (custoItemId: string, lancamentoId: string) => {
    setData((prev) => {
      const novosItens = prev.custosItens.map((it) => {
        if (it.id !== custoItemId) return it
        return { ...it, lancamentos: it.lancamentos.filter((l) => l.id !== lancamentoId) }
      })
      const novoCustoTotal = calcularCustoTotalUnitario(novosItens)
      const novosProdutos = prev.produtos.map((p) =>
        p.id === 'prod-ima-5x5'
          ? { ...p, custoUnitarioCalculado: Number(novoCustoTotal.toFixed(2)) }
          : p,
      )
      return { ...prev, custosItens: novosItens, produtos: novosProdutos }
    })

    registrarAuditoriaSegura('CUSTO', custoItemId, 'Lançamento de custo excluído', {
      detalhe: lancamentoId,
    })
  }

  const adicionarItemCustoNaoCatalogado = (
    nome: string,
    valorInicial: number,
    descricao: string,
  ) => {
    const id = 'custo-extra-' + Date.now()
    const novoItem: CustoItem = {
      id,
      nome: sanitizarTexto(nome) || 'Item extra não catalogado',
      custoBase: Math.max(0, valorInicial),
      unidadesCobertas: 1,
      lancamentos: descricao
        ? [
            {
              id: 'lanc-init-' + Date.now(),
              data: new Date().toISOString().split('T')[0],
              descricao: sanitizarTexto(descricao),
              valor: Math.max(0, valorInicial),
              criadoEm: new Date().toISOString(),
            },
          ]
        : [],
      isPadrao: false,
    }

    setData((prev) => {
      const novosItens = [...prev.custosItens, novoItem]
      const novoCustoTotal = calcularCustoTotalUnitario(novosItens)
      const novosProdutos = prev.produtos.map((p) =>
        p.id === 'prod-ima-5x5'
          ? { ...p, custoUnitarioCalculado: Number(novoCustoTotal.toFixed(2)) }
          : p,
      )
      return { ...prev, custosItens: novosItens, produtos: novosProdutos }
    })

    registrarAuditoriaSegura('CUSTO', id, 'Item de custo não catalogado criado', {
      valorNovo: String(valorInicial),
      detalhe: novoItem.nome,
    })
  }

  const atualizarCustoBaseItem = (custoItemId: string, novoCustoBase: number) => {
    const valorPositivo = Math.max(0, novoCustoBase)
    setData((prev) => {
      const novosItens = prev.custosItens.map((it) =>
        it.id === custoItemId ? { ...it, custoBase: valorPositivo } : it,
      )
      const novoCustoTotal = calcularCustoTotalUnitario(novosItens)
      const novosProdutos = prev.produtos.map((p) =>
        p.id === 'prod-ima-5x5'
          ? { ...p, custoUnitarioCalculado: Number(novoCustoTotal.toFixed(2)) }
          : p,
      )
      return { ...prev, custosItens: novosItens, produtos: novosProdutos }
    })

    registrarAuditoriaSegura('CUSTO', custoItemId, 'Custo base alterado', {
      valorNovo: String(valorPositivo),
    })
  }

  const adicionarProduto = (prod: Omit<Produto, 'id' | 'criadoEm'>): Produto => {
    const novoId = 'prod-' + Date.now()
    const novoProduto: Produto = {
      ...prod,
      id: novoId,
      nome: sanitizarTexto(prod.nome),
      dimensao: sanitizarTexto(prod.dimensao),
      descricao: sanitizarTexto(prod.descricao),
      criadoEm: new Date().toISOString(),
    }
    setData((prev) => ({ ...prev, produtos: [...prev.produtos, novoProduto] }))
    registrarAuditoriaSegura('PRODUTO', novoId, 'Produto cadastrado', {
      detalhe: novoProduto.nome,
    })
    return novoProduto
  }

  const atualizarProduto = (id: string, prod: Partial<Produto>) => {
    setData((prev) => ({
      ...prev,
      produtos: prev.produtos.map((p) => (p.id === id ? { ...p, ...prod } : p)),
    }))
    registrarAuditoriaSegura('PRODUTO', id, 'Produto atualizado')
  }

  const adicionarComposicaoKit = (kitId: string, componenteId: string, quantidade: number) => {
    const compId = 'comp-' + Date.now()
    const componente = data.produtos.find((p) => p.id === componenteId)
    const custoCalculado = (componente?.custoUnitarioCalculado || 0) * quantidade

    const nova: ComposicaoItem = {
      id: compId,
      produtoKitId: kitId,
      produtoComponenteId: componenteId,
      quantidade: Math.max(1, quantidade),
      custoCalculado: Number(custoCalculado.toFixed(2)),
    }

    setData((prev) => {
      const novasComposicoes = [...prev.composicoes, nova]
      // Recalcula custo do kit
      const custoTotalKit = novasComposicoes
        .filter((c) => c.produtoKitId === kitId)
        .reduce((acc, c) => acc + c.custoCalculado, 0)

      const produtosAtualizados = prev.produtos.map((p) =>
        p.id === kitId ? { ...p, custoUnitarioCalculado: Number(custoTotalKit.toFixed(2)) } : p,
      )

      return { ...prev, composicoes: novasComposicoes, produtos: produtosAtualizados }
    })

    registrarAuditoriaSegura('COMPOSICAO', compId, 'Item de kit vinculado', {
      valorNovo: `${quantidade} un de ${componenteId}`,
    })
  }

  const atualizarFaixaPreco = (faixaId: string, dados: Partial<FaixaPreco>) => {
    setData((prev) => ({
      ...prev,
      faixasPreco: prev.faixasPreco.map((f) => (f.id === faixaId ? { ...f, ...dados } : f)),
    }))
    registrarAuditoriaSegura('FAIXA_PRECO', faixaId, 'Faixa de preço atualizada')
  }

  // 7. CLIENTES E PRIVACIDADE (LGPD)
  const adicionarCliente = (c: Omit<Cliente, 'id' | 'dataCadastro' | 'ativo'>): Cliente => {
    const novoId = 'cli-' + Date.now()
    const novo: Cliente = {
      ...c,
      id: novoId,
      nome: sanitizarTexto(c.nome),
      whatsapp: sanitizarTexto(c.whatsapp),
      telefoneRecado: sanitizarTexto(c.telefoneRecado),
      email: sanitizarTexto(c.email).toLowerCase(),
      instagram: sanitizarTexto(c.instagram),
      cidade: sanitizarTexto(c.cidade) || 'Rio de Janeiro',
      estado: sanitizarTexto(c.estado).toUpperCase() || 'RJ',
      cep: sanitizarTexto(c.cep),
      endereco: sanitizarTexto(c.endereco),
      dataCadastro: new Date().toISOString().split('T')[0],
      ativo: true,
      dataHoraConsentimento: c.consentimento ? new Date().toISOString() : undefined,
    }

    setData((prev) => ({ ...prev, clientes: [novo, ...prev.clientes] }))
    // Auditoria sem gravar o nome ou telefone do cliente
    registrarAuditoriaSegura('CLIENTE', novoId, 'Cliente cadastrado', {
      detalhe: `Origem: ${novo.origem} | Base legal: ${novo.baseLegal}`,
    })

    return novo
  }

  const atualizarCliente = (id: string, c: Partial<Cliente>) => {
    setData((prev) => ({
      ...prev,
      clientes: prev.clientes.map((cli) => {
        if (cli.id !== id) return cli
        const novoConsentimento =
          c.consentimento !== undefined ? c.consentimento : cli.consentimento
        const consentiuAgora = novoConsentimento && !cli.consentimento
        return {
          ...cli,
          ...c,
          nome: c.nome !== undefined ? sanitizarTexto(c.nome) : cli.nome,
          whatsapp: c.whatsapp !== undefined ? sanitizarTexto(c.whatsapp) : cli.whatsapp,
          email: c.email !== undefined ? sanitizarTexto(c.email).toLowerCase() : cli.email,
          cidade: c.cidade !== undefined ? sanitizarTexto(c.cidade) : cli.cidade,
          estado: c.estado !== undefined ? sanitizarTexto(c.estado).toUpperCase() : cli.estado,
          dataHoraConsentimento: consentiuAgora
            ? new Date().toISOString()
            : c.consentimento === false
              ? undefined
              : cli.dataHoraConsentimento,
        }
      }),
    }))

    registrarAuditoriaSegura('CLIENTE', id, 'Dados cadastrais do cliente atualizados')
  }

  // LGPD: "Excluir dados do cliente" apaga campos pessoais e mantém apenas o identificador interno
  // e histórico contábil para conformidade fiscal sem identificação pessoal
  const excluirDadosClienteLgpd = (clienteId: string) => {
    setData((prev) => ({
      ...prev,
      clientes: prev.clientes.map((cli) => {
        if (cli.id !== clienteId) return cli
        return {
          ...cli,
          nome: `[Titular Excluído LGPD #${clienteId.slice(-4)}]`,
          whatsapp: '',
          telefoneRecado: '',
          email: '',
          instagram: '',
          endereco: '',
          cep: '',
          cidade: 'Anonimizado',
          estado: 'XX',
          observacoes: 'Dados pessoais eliminados a pedido do titular em conformidade com a LGPD.',
          consentimento: false,
          dataHoraConsentimento: undefined,
          ativo: false,
        }
      }),
    }))

    // A auditoria registra APENAS o id, NUNCA nome ou dados pessoais
    registrarAuditoriaSegura('CLIENTE', clienteId, 'Exclusão de dados pessoais da titular (LGPD)', {
      detalhe: 'Dados pessoais anonimizados. Histórico financeiro preservado para fins fiscais.',
    })
  }

  const exportarDadosTitularLgpd = (clienteId: string): string => {
    const cliente = data.clientes.find((c) => c.id === clienteId)
    const orcamentos = data.orcamentos.filter((o) => o.clienteId === clienteId)
    const pedidos = data.pedidos.filter((p) => p.clienteId === clienteId)

    const relatorio = {
      titulo: 'Exportação de Dados do Titular - LGPD Bru Memórias',
      dataExportacao: new Date().toISOString(),
      cliente,
      orcamentos,
      pedidos,
    }

    registrarAuditoriaSegura(
      'CLIENTE',
      clienteId,
      'Exportação de dados solicitada pelo titular (LGPD)',
    )
    return JSON.stringify(relatorio, null, 2)
  }

  // 8. FLUXO COMERCIAL COMPLETO: ORÇAMENTOS
  const criarOrcamento = (orc: {
    clienteId: string
    produtoId: string
    quantidade: number
    frete?: number
    desconto?: number
    validadeDias?: number
    observacoes?: string
  }): Orcamento => {
    const orcId = 'orc-' + Date.now()
    const numero = `ORC-${new Date().getFullYear()}-${String(data.orcamentos.length + 1).padStart(3, '0')}`

    const produto =
      data.produtos.find((p) => p.id === orc.produtoId) || data.produtos[0] || PRODUTOS_PADRAO_V5[0]
    const qtd = Math.max(1, orc.quantidade)
    const faixa = buscarFaixaPreco(qtd, data.faixasPreco)
    const precoUnit = faixa.precoUnitario
    const subtotal = qtd * precoUnit
    const frete = Math.max(0, orc.frete || 0)
    const desconto = Math.max(0, orc.desconto || 0)
    const total = Math.max(0, subtotal - desconto + frete)

    const diasValidade = orc.validadeDias || 7
    const validadeDate = new Date()
    validadeDate.setDate(validadeDate.getDate() + diasValidade)
    const validadeIso = validadeDate.toISOString().split('T')[0]

    const novoOrcamento: Orcamento = {
      id: orcId,
      numero,
      clienteId: orc.clienteId,
      itens: [
        {
          produtoId: produto.id,
          produtoNome: produto.nome,
          quantidade: qtd,
          precoUnitario: precoUnit,
          custoUnitario: produto.custoUnitarioCalculado,
          total: subtotal,
        },
      ],
      quantidadeTotal: qtd,
      faixaAplicadaId: faixa.id,
      precoUnitario: precoUnit,
      desconto,
      frete,
      total,
      validade: validadeIso,
      status: 'Orçamento elaborado',
      dataCriacao: new Date().toISOString().split('T')[0],
      historicoVersoes: [
        {
          versao: 1,
          dataHora: new Date().toISOString(),
          quantidadeTotal: qtd,
          total,
          validade: validadeIso,
        },
      ],
      observacoes: orc.observacoes ? sanitizarTexto(orc.observacoes) : '',
    }

    setData((prev) => ({ ...prev, orcamentos: [novoOrcamento, ...prev.orcamentos] }))

    registrarAuditoriaSegura('ORCAMENTO', orcId, 'Orçamento criado', {
      valorNovo: `Total R$ ${total.toFixed(2)} (${qtd} un)`,
    })

    return novoOrcamento
  }

  const enviarOrcamento = (orcamentoId: string) => {
    setData((prev) => ({
      ...prev,
      orcamentos: prev.orcamentos.map((o) =>
        o.id === orcamentoId
          ? {
              ...o,
              status: 'Orçamento enviado',
              dataEnvio: new Date().toISOString(),
            }
          : o,
      ),
    }))

    registrarAuditoriaSegura('ORCAMENTO', orcamentoId, 'Orçamento enviado ao cliente')
  }

  const reemitirOrcamentoVencido = (orcamentoId: string, novaValidadeDias = 7): Orcamento => {
    const orcAtual = data.orcamentos.find((o) => o.id === orcamentoId)
    if (!orcAtual) throw new Error('Orçamento não encontrado.')

    const validadeDate = new Date()
    validadeDate.setDate(validadeDate.getDate() + novaValidadeDias)
    const novaValidade = validadeDate.toISOString().split('T')[0]

    const novaVersaoNum = orcAtual.historicoVersoes.length + 1
    const novaVersaoItem = {
      versao: novaVersaoNum,
      dataHora: new Date().toISOString(),
      quantidadeTotal: orcAtual.quantidadeTotal,
      total: orcAtual.total,
      validade: novaValidade,
      motivoAlteracao: 'Reemissão após vencimento',
    }

    const orcAtualizado: Orcamento = {
      ...orcAtual,
      validade: novaValidade,
      status: 'Orçamento enviado',
      dataEnvio: new Date().toISOString(),
      historicoVersoes: [...orcAtual.historicoVersoes, novaVersaoItem],
    }

    setData((prev) => ({
      ...prev,
      orcamentos: prev.orcamentos.map((o) => (o.id === orcamentoId ? orcAtualizado : o)),
    }))

    registrarAuditoriaSegura('ORCAMENTO', orcamentoId, 'Orçamento reemitido com nova validade', {
      valorNovo: novaValidade,
    })

    return orcAtualizado
  }

  const marcarOrcamentoPerdido = (orcamentoId: string, motivo: MotivoPerda) => {
    setData((prev) => ({
      ...prev,
      orcamentos: prev.orcamentos.map((o) =>
        o.id === orcamentoId ? { ...o, status: 'Perdido' } : o,
      ),
    }))

    registrarAuditoriaSegura('ORCAMENTO', orcamentoId, 'Orçamento marcado como perdido', {
      detalhe: motivo,
    })
  }

  const aprovarOrcamentoParaPedido = (
    orcamentoId: string,
    opcoes?: {
      formaPagamento?: string
      exigeSinal?: boolean
      sinalRecebido?: number
      prazoPrometidoDias?: number
    },
  ): Pedido => {
    const orc = data.orcamentos.find((o) => o.id === orcamentoId)
    if (!orc) throw new Error('Orçamento não encontrado.')

    // Regra: orçamento vencido não pode ser aprovado diretamente (exige reemissão)
    const hojeStr = new Date().toISOString().split('T')[0]
    if (orc.validade < hojeStr) {
      throw new Error(
        'Este orçamento está vencido. É obrigatório reemiti-lo antes de aprovar a venda.',
      )
    }

    const pedId = 'ped-' + Date.now()
    const numero = `PED-${new Date().getFullYear()}-${String(data.pedidos.length + 1).padStart(3, '0')}`

    const prazoDias = opcoes?.prazoPrometidoDias || 5
    const prazoDate = new Date()
    prazoDate.setDate(prazoDate.getDate() + prazoDias)
    const prazoPrometido = prazoDate.toISOString().split('T')[0]

    const exigeSinal = Boolean(opcoes?.exigeSinal)
    const sinalRecebido = Math.max(0, opcoes?.sinalRecebido || 0)

    // Regra: se houver sinal combinado, venda concluída só avança com sinal_recebido > 0
    if (exigeSinal && sinalRecebido <= 0) {
      throw new Error(
        'Foi combinado sinal para este pedido, mas nenhum valor de sinal foi registrado.',
      )
    }

    const saldo = Math.max(0, orc.total - sinalRecebido)

    const novoPedido: Pedido = {
      id: pedId,
      numero,
      clienteId: orc.clienteId,
      orcamentoOrigemId: orc.id,
      itens: orc.itens,
      quantidadeTotal: orc.quantidadeTotal,
      valor: orc.total - orc.frete,
      desconto: orc.desconto,
      frete: orc.frete,
      totalGeral: orc.total,
      formaPagamento: opcoes?.formaPagamento || 'PIX',
      exigeSinal,
      sinalRecebido,
      saldoRestante: saldo,
      status: 'Venda concluída',
      dataAprovacao: new Date().toISOString(),
      prazoPrometido,
      checklist: {
        arteConferida: false,
        impressaoVerificada: false,
        laminacaoSemBolhas: false,
        corteAlinhado5x5: false,
        mantaMagneticaAderente: false,
        bolsinhaOrganzaIncluida: false,
        etiquetaAfixada: false,
        embalagemEnvioSegura: false,
      },
      criadoEm: new Date().toISOString(),
    }

    setData((prev) => ({
      ...prev,
      orcamentos: prev.orcamentos.map((o) =>
        o.id === orcamentoId ? { ...o, status: 'Aprovado' } : o,
      ),
      pedidos: [novoPedido, ...prev.pedidos],
    }))

    registrarAuditoriaSegura('PEDIDO', pedId, 'Venda aprovada gerando pedido', {
      valorNovo: `R$ ${novoPedido.totalGeral.toFixed(2)}`,
    })

    return novoPedido
  }

  // 9. REGRAS OBRIGATÓRIAS DE FLUXO DO PEDIDO
  const atualizarStatusPedido = (
    pedidoId: string,
    novoStatus: StatusPedido,
    justificativa?: string,
  ): { sucesso: boolean; erro?: string } => {
    const pedido = data.pedidos.find((p) => p.id === pedidoId)
    if (!pedido) return { sucesso: false, erro: 'Pedido não encontrado.' }

    // REGRA 1: Nenhum pedido entra em produção ("Pedido em andamento") sem arte aprovada pelo cliente e registrada
    if (novoStatus === 'Pedido em andamento') {
      const arteAprovada = data.artes.some(
        (a) => a.pedidoId === pedidoId && a.aprovacaoCliente && a.resolucaoMinimaAtendida,
      )
      if (!arteAprovada) {
        return {
          sucesso: false,
          erro: 'Bloqueio de produção: É obrigatório que a arte esteja aprovada pelo cliente com resolução mínima atendida (>= 700x700 px).',
        }
      }
    }

    // REGRA 2: Nenhum pedido chega a "Entregue" sem passar por "Finalização"
    if (novoStatus === 'Entregue') {
      if (pedido.status !== 'Finalização') {
        return {
          sucesso: false,
          erro: 'Bloqueio de entrega: O pedido precisa passar pela etapa de "Finalização" com checklist de qualidade concluído antes de ser entregue.',
        }
      }
    }

    const statusAnterior = pedido.status
    const entregaReal =
      novoStatus === 'Entregue' ? new Date().toISOString().split('T')[0] : pedido.dataEntregaReal

    setData((prev) => ({
      ...prev,
      pedidos: prev.pedidos.map((p) =>
        p.id === pedidoId
          ? {
              ...p,
              status: novoStatus,
              dataEntregaReal: entregaReal,
              atualizadoEm: new Date().toISOString(),
            }
          : p,
      ),
    }))

    registrarAuditoriaSegura('PEDIDO', pedidoId, `Status alterado: ${novoStatus}`, {
      campoAlterado: 'status',
      valorAnterior: statusAnterior,
      valorNovo: novoStatus,
      detalhe: justificativa,
    })

    return { sucesso: true }
  }

  const registrarPerdaPedido = (pedidoId: string, motivo: MotivoPerda) => {
    setData((prev) => ({
      ...prev,
      pedidos: prev.pedidos.map((p) =>
        p.id === pedidoId ? { ...p, status: 'Perdido', motivoPerda: motivo } : p,
      ),
    }))

    registrarAuditoriaSegura('PEDIDO', pedidoId, 'Pedido registrado como Perdido', {
      detalhe: motivo,
    })
  }

  const cancelarPedido = (pedidoId: string, motivo: string) => {
    setData((prev) => ({
      ...prev,
      pedidos: prev.pedidos.map((p) =>
        p.id === pedidoId
          ? {
              ...p,
              status: 'Cancelado',
              motivoCancelamento: sanitizarTexto(motivo),
            }
          : p,
      ),
    }))

    registrarAuditoriaSegura('PEDIDO', pedidoId, 'Pedido cancelado', {
      detalhe: sanitizarTexto(motivo),
    })
  }

  const atualizarChecklistFinalizacao = (
    pedidoId: string,
    checklist: Partial<ChecklistFinalizacao>,
  ) => {
    setData((prev) => ({
      ...prev,
      pedidos: prev.pedidos.map((p) => {
        if (p.id !== pedidoId) return p
        const novoChecklist = { ...p.checklist, ...checklist }
        const todosMarcados =
          novoChecklist.arteConferida &&
          novoChecklist.impressaoVerificada &&
          novoChecklist.laminacaoSemBolhas &&
          novoChecklist.corteAlinhado5x5 &&
          novoChecklist.mantaMagneticaAderente &&
          novoChecklist.bolsinhaOrganzaIncluida &&
          novoChecklist.etiquetaAfixada &&
          novoChecklist.embalagemEnvioSegura

        return {
          ...p,
          checklist: {
            ...novoChecklist,
            dataFinalizacao: todosMarcados ? new Date().toISOString() : undefined,
          },
        }
      }),
    }))

    registrarAuditoriaSegura('PEDIDO', pedidoId, 'Checklist de finalização atualizado')
  }

  // 10. CONTROLE DE ARTE & QUALIDADE
  const cadastrarOuAtualizarArte = (
    arte: Omit<ArquivoArte, 'id' | 'criadoEm'> & { id?: string },
  ): ArquivoArte => {
    const arteId = arte.id || 'arte-' + Date.now()

    // Resolução de segurança para 5x5 cm: mínimo 700x700 px (300 DPI seguro)
    const largura = arte.larguraPixels || 0
    const altura = arte.alturaPixels || 0
    const resolucaoMinimaAtendida = largura >= 700 && altura >= 700
    const proporcaoQuadrada = largura > 0 && altura > 0 && Math.abs(largura - altura) <= 10

    let orientacao = ''
    if (!resolucaoMinimaAtendida) {
      orientacao = `Olá! Notamos que a foto enviada tem ${largura}x${altura} pixels, abaixo do ideal (mínimo de 700x700 pixels para o ímã 5x5 cm). Para que a impressão saia nítida e perfeita no seu ímã, você poderia nos enviar o arquivo original em alta resolução por aqui? 💖`
    } else if (!proporcaoQuadrada) {
      orientacao = `Olá! A foto enviada não está em formato quadrado (1:1). Para fazermos o ímã 5x5 cm, será necessário fazer um recorte nas bordas. Veja a prévia e nos confirme se podemos prosseguir!`
    }

    const novaArte: ArquivoArte = {
      ...arte,
      id: arteId,
      larguraPixels: largura,
      alturaPixels: altura,
      resolucaoPixels: `${largura}x${altura}`,
      proporcao: proporcaoQuadrada ? '1:1' : `${largura}:${altura}`,
      proporcaoQuadrada,
      resolucaoMinimaAtendida,
      statusRecorte: proporcaoQuadrada ? 'Adequado (1:1)' : 'Recorte necessário',
      mensagemOrientacaoPronta: orientacao,
      criadoEm: new Date().toISOString(),
    }

    setData((prev) => {
      const existe = prev.artes.some((a) => a.id === arteId)
      const atualizadas = existe
        ? prev.artes.map((a) => (a.id === arteId ? novaArte : a))
        : [novaArte, ...prev.artes]
      return { ...prev, artes: atualizadas }
    })

    registrarAuditoriaSegura('ARTE', arteId, 'Arte registrada no controle de qualidade', {
      valorNovo: `${largura}x${altura} px | Aprovada: ${arte.aprovacaoCliente ? 'Sim' : 'Não'}`,
    })

    return novaArte
  }

  const aprovarArteCliente = (arteId: string) => {
    const dataHoraIso = new Date().toISOString()
    setData((prev) => ({
      ...prev,
      artes: prev.artes.map((a) =>
        a.id === arteId ? { ...a, aprovacaoCliente: true, dataAprovacao: dataHoraIso } : a,
      ),
    }))

    registrarAuditoriaSegura('ARTE', arteId, 'Arte aprovada pelo cliente com data e hora', {
      valorNovo: dataHoraIso,
    })
  }

  // 11. FORNECEDORES & INSUMOS
  const adicionarFornecedor = (f: Omit<Fornecedor, 'id' | 'criadoEm'>): Fornecedor => {
    const novoId = 'forn-' + Date.now()
    const novo: Fornecedor = {
      ...f,
      id: novoId,
      nome: sanitizarTexto(f.nome),
      contato: sanitizarTexto(f.contato),
      cidade: sanitizarTexto(f.cidade),
      estado: sanitizarTexto(f.estado).toUpperCase(),
      prazoMedioDias: sanitizarTexto(f.prazoMedioDias),
      link: f.link ? sanitizarTexto(f.link) : '',
      criadoEm: new Date().toISOString(),
    }
    setData((prev) => ({ ...prev, fornecedores: [...prev.fornecedores, novo] }))
    registrarAuditoriaSegura('FORNECEDOR', novoId, 'Fornecedor cadastrado', {
      detalhe: `${novo.cidade}/${novo.estado}`,
    })
    return novo
  }

  const atualizarFornecedor = (id: string, f: Partial<Fornecedor>) => {
    setData((prev) => ({
      ...prev,
      fornecedores: prev.fornecedores.map((forn) => (forn.id === id ? { ...forn, ...f } : forn)),
    }))
    registrarAuditoriaSegura('FORNECEDOR', id, 'Fornecedor atualizado')
  }

  const excluirFornecedor = (id: string) => {
    setData((prev) => ({
      ...prev,
      fornecedores: prev.fornecedores.filter((f) => f.id !== id),
    }))
    registrarAuditoriaSegura('FORNECEDOR', id, 'Fornecedor excluído')
  }

  const adicionarInsumo = (ins: Omit<Insumo, 'id' | 'criadoEm'>): Insumo => {
    const novoId = 'ins-' + Date.now()
    const novo: Insumo = {
      ...ins,
      id: novoId,
      nome: sanitizarTexto(ins.nome),
      unidade: sanitizarTexto(ins.unidade),
      criadoEm: new Date().toISOString(),
    }
    setData((prev) => ({ ...prev, insumos: [...prev.insumos, novo] }))
    registrarAuditoriaSegura('INSUMO', novoId, 'Insumo cadastrado')
    return novo
  }

  const atualizarInsumo = (id: string, ins: Partial<Insumo>) => {
    setData((prev) => ({
      ...prev,
      insumos: prev.insumos.map((i) => (i.id === id ? { ...i, ...ins } : i)),
    }))
    registrarAuditoriaSegura('INSUMO', id, 'Insumo atualizado')
  }

  const excluirInsumo = (id: string) => {
    setData((prev) => ({
      ...prev,
      insumos: prev.insumos.filter((i) => i.id !== id),
    }))
    registrarAuditoriaSegura('INSUMO', id, 'Insumo excluído')
  }

  // 12. BACKUP E RESTAURAÇÃO
  const exportarBackupCompletoJson = (): string => {
    const backup: AppDataV5 = {
      ...data,
      schemaVersion: 5,
      versaoApp: '5.0.0',
      dataHora: new Date().toISOString(),
    }
    registrarAuditoriaSegura('BACKUP', 'sistema', 'Backup completo JSON exportado')
    return JSON.stringify(backup, null, 2)
  }

  const importarBackupCompletoJson = (
    conteudoJson: string,
  ): {
    sucesso: boolean
    mensagem: string
    contagemAntes?: Record<string, number>
    contagemDepois?: Record<string, number>
  } => {
    try {
      const parsed = JSON.parse(conteudoJson) as AppDataV5

      if (!parsed || typeof parsed !== 'object') {
        return { sucesso: false, mensagem: 'Arquivo JSON inválido ou corrompido.' }
      }

      // Validação do schemaVersion
      if (!parsed.schemaVersion) {
        return {
          sucesso: false,
          mensagem: 'O arquivo não possui o campo obrigatório schemaVersion.',
        }
      }

      if (parsed.schemaVersion > 5) {
        return {
          sucesso: false,
          mensagem: `A versão deste backup (schemaVersion ${parsed.schemaVersion}) é superior à suportada por esta versão do app (v5). Nenhuma alteração foi realizada.`,
        }
      }

      const contagemAntes: Record<string, number> = {
        clientes: data.clientes.length,
        produtos: data.produtos.length,
        orcamentos: data.orcamentos.length,
        pedidos: data.pedidos.length,
        insumos: data.insumos.length,
        fornecedores: data.fornecedores.length,
      }

      let dadosImportar = parsed
      if (parsed.schemaVersion < 5) {
        // Executa migração declarada
        dadosImportar = carregarDadosV5()
      }

      setData(dadosImportar)

      const contagemDepois: Record<string, number> = {
        clientes: dadosImportar.clientes?.length || 0,
        produtos: dadosImportar.produtos?.length || 0,
        orcamentos: dadosImportar.orcamentos?.length || 0,
        pedidos: dadosImportar.pedidos?.length || 0,
        insumos: dadosImportar.insumos?.length || 0,
        fornecedores: dadosImportar.fornecedores?.length || 0,
      }

      registrarAuditoriaSegura('BACKUP', 'sistema', 'Backup restaurado com sucesso', {
        valorNovo: `schemaVersion ${dadosImportar.schemaVersion}`,
      })

      return {
        sucesso: true,
        mensagem: 'Backup importado e restaurado com sucesso!',
        contagemAntes,
        contagemDepois,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na leitura do arquivo'
      return { sucesso: false, mensagem: msg }
    }
  }

  const concluirPassoPrimeiroUso = (passo: number) => {
    if (passo >= 4) {
      setPassoAbertoPrimeiroUso(null)
    } else {
      setPassoAbertoPrimeiroUso(passo + 1)
    }
  }

  const tentativasRestantes = Math.max(0, 5 - tentativasFalhas)

  return (
    <AppV5Context.Provider
      value={{
        data,
        abaAtiva,
        setAbaAtiva,
        subsecaoAtiva,
        setSubsecaoAtiva,
        navegarPara,
        isConfigurado,
        isAutenticado,
        tentativasRestantes,
        bloqueadoSegundos,
        criarSenhaMestre,
        desbloquearComSenha,
        sairDoSistema,
        reiniciarSistemaPerdaAcesso,
        getParametro,
        atualizarParametro,
        registrarAuditoriaSegura,
        adicionarCliente,
        atualizarCliente,
        excluirDadosClienteLgpd,
        exportarDadosTitularLgpd,
        custoTotalUnitarioAtual,
        adicionarLancamentoCusto,
        editarLancamentoCusto,
        excluirLancamentoCusto,
        adicionarItemCustoNaoCatalogado,
        atualizarCustoBaseItem,
        adicionarProduto,
        atualizarProduto,
        adicionarComposicaoKit,
        atualizarFaixaPreco,
        criarOrcamento,
        enviarOrcamento,
        reemitirOrcamentoVencido,
        marcarOrcamentoPerdido,
        aprovarOrcamentoParaPedido,
        atualizarStatusPedido,
        registrarPerdaPedido,
        cancelarPedido,
        atualizarChecklistFinalizacao,
        cadastrarOuAtualizarArte,
        aprovarArteCliente,
        adicionarFornecedor,
        atualizarFornecedor,
        excluirFornecedor,
        adicionarInsumo,
        atualizarInsumo,
        excluirInsumo,
        exportarBackupCompletoJson,
        importarBackupCompletoJson,
        passoAbertoPrimeiroUso,
        concluirPassoPrimeiroUso,
      }}
    >
      {children}
    </AppV5Context.Provider>
  )
}

export function useAppV5() {
  const ctx = useContext(AppV5Context)
  if (!ctx) {
    throw new Error('useAppV5 deve ser usado dentro de AppV5Provider')
  }
  return ctx
}
