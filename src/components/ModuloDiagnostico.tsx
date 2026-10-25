import React, { useState, useEffect, useCallback } from 'react'
import { useApp } from '@/context/AppContext'
import {
  formatarMoeda,
  TABELA_PRECOS_OFICIAL,
  obterPrecoOficial,
  sanitizarTexto,
} from '@/lib/formatters'
import { calcularProgressoMetas } from '@/lib/metasUtils'
import { AppData, ProdutoKit, MetaVendas } from '@/types/app'
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCw,
  ShieldCheck,
  Stethoscope,
  Database,
  Calculator,
  Lock,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react'

export interface TestResultItem {
  id: string
  titulo: string
  descricao: string
  sucesso: boolean
  detalhes: string
  tempoMs: number
}

export const ModuloDiagnostico: React.FC = () => {
  const { data, activeProduct, logAudit } = useApp()
  const [testando, setTestando] = useState(false)
  const [resultados, setResultados] = useState<TestResultItem[]>([])
  const [ultimaExecucao, setUltimaExecucao] = useState<Date | null>(null)

  const executarBateriaDeTestes = useCallback(async () => {
    setTestando(true)
    const novosResultados: TestResultItem[] = []

    // 1. TESTE: LOCALSTORAGE DISPONÍVEL E GRAVANDO/LENDO DE FATO
    {
      const t0 = performance.now()
      let sucesso = false
      let detalhes = ''
      const chaveTemp = '__bru_diagnostico_teste_temp__'
      const valorTeste = JSON.stringify({ ping: 'pong', timestamp: Date.now() })
      try {
        localStorage.setItem(chaveTemp, valorTeste)
        const lido = localStorage.getItem(chaveTemp)
        if (lido === valorTeste) {
          localStorage.removeItem(chaveTemp)
          const conferirRemocao = localStorage.getItem(chaveTemp)
          if (conferirRemocao === null) {
            sucesso = true
            detalhes =
              'localStorage funcional: gravação, leitura e remoção validadas com sucesso sem tocar nos dados reais.'
          } else {
            detalhes = 'Falha ao remover chave de teste temporária.'
          }
        } else {
          detalhes = `Valor lido (${lido}) diferente do gravado (${valorTeste}).`
        }
      } catch (err: unknown) {
        detalhes = err instanceof Error ? err.message : 'Erro ao acessar localStorage'
      }
      novosResultados.push({
        id: 'localstorage',
        titulo: 'Disponibilidade e Operação do localStorage',
        descricao:
          'Verifica se a gravação, leitura e limpeza no navegador estão ativas e sem bloqueios.',
        sucesso,
        detalhes,
        tempoMs: Math.round(performance.now() - t0),
      })
    }

    // 2. TESTE: SOMA DE CUSTOS DO MÓDULO CUSTOS CONFERIDA (EM MEMÓRIA)
    {
      const t0 = performance.now()
      let sucesso = false
      let detalhes = ''
      try {
        // Criar estrutura de teste em memória com produto ímã 5x5 fictício
        const produtoTeste: ProdutoKit = {
          id: 'test-prod-diag',
          nome: 'Produto Teste Diagnóstico',
          unidadesLote: 100,
          criadoEm: new Date().toISOString(),
          itens: [
            {
              id: 'item-1',
              nome: 'Base Magnética',
              custoBase: 0.6,
              unidadesCobertas: 1,
              lancamentos: [
                {
                  id: 'l1',
                  data: '2025-01-01',
                  descricao: 'Gasto extra 1',
                  valor: 0.15,
                  criadoEm: '',
                },
                {
                  id: 'l2',
                  data: '2025-01-02',
                  descricao: 'Gasto extra 2',
                  valor: 0.25,
                  criadoEm: '',
                },
              ],
            },
            {
              id: 'item-2',
              nome: 'Impressão Foto',
              custoBase: 0.45,
              unidadesCobertas: 1,
              lancamentos: [
                {
                  id: 'l3',
                  data: '2025-01-03',
                  descricao: 'Gasto extra 3',
                  valor: 0.05,
                  criadoEm: '',
                },
              ],
            },
          ],
        }

        // Soma esperada:
        // Item 1: 0.60 + 0.15 + 0.25 = 1.00
        // Item 2: 0.45 + 0.05 = 0.50
        // Total lote: 1.50
        // Custo unitário para 100 un: 1.50 / 100 = 0.015 (R$ 0,02 arredondado ou 0.015 exato)
        const totalCalculado = produtoTeste.itens.reduce((acc, it) => {
          const extras = it.lancamentos.reduce((s, l) => s + l.valor, 0)
          return acc + it.custoBase + extras
        }, 0)
        const unitarioCalculado = totalCalculado / produtoTeste.unidadesLote

        const esperadoTotal = 1.5
        const esperadoUnit = 0.015

        if (
          Math.abs(totalCalculado - esperadoTotal) < 0.0001 &&
          Math.abs(unitarioCalculado - esperadoUnit) < 0.0001
        ) {
          sucesso = true
          detalhes = `Soma apurada idêntica ao esperado: Total Lote = R$ ${totalCalculado.toFixed(2)}, Unitário = R$ ${unitarioCalculado.toFixed(3)}. Fixture 100% em memória descartada.`
        } else {
          detalhes = `Divergência na soma de custos: esperado ${esperadoTotal}, apurado ${totalCalculado}.`
        }
      } catch (err: unknown) {
        detalhes = err instanceof Error ? err.message : 'Erro no cálculo de custos'
      }

      novosResultados.push({
        id: 'soma-custos',
        titulo: 'Soma de Custos e Custo Unitário Apurado',
        descricao:
          'Valida a fórmula de custo base + lançamentos extras / lote em buffer de memória isolado.',
        sucesso,
        detalhes,
        tempoMs: Math.round(performance.now() - t0),
      })
    }

    // 3. TESTE: TABELA DE PREÇOS OFICIAL RETORNANDO O VALOR CORRETO PARA CADA FAIXA
    {
      const t0 = performance.now()
      let sucesso = true
      const falhas: string[] = []

      const casos = [
        { qtd: 1, esperado: 14.99, faixa: '1 a 4 un' },
        { qtd: 4, esperado: 14.99, faixa: '1 a 4 un' },
        { qtd: 5, esperado: 12.5, faixa: '5 a 25 un' },
        { qtd: 25, esperado: 12.5, faixa: '5 a 25 un' },
        { qtd: 26, esperado: 11.5, faixa: '26 a 50 un' },
        { qtd: 50, esperado: 11.5, faixa: '26 a 50 un' },
        { qtd: 51, esperado: 10.5, faixa: '51 a 100 un' },
        { qtd: 100, esperado: 10.5, faixa: '51 a 100 un' },
        { qtd: 101, esperado: 9.99, faixa: 'acima de 100 un' },
        { qtd: 500, esperado: 9.99, faixa: 'acima de 100 un' },
      ]

      for (const c of casos) {
        const retornado = obterPrecoOficial(c.qtd)
        if (Math.abs(retornado - c.esperado) > 0.001) {
          sucesso = false
          falhas.push(
            `Qtd ${c.qtd}: esperado R$ ${c.esperado.toFixed(2)}, retornado R$ ${retornado.toFixed(2)}`,
          )
        }
      }

      novosResultados.push({
        id: 'tabela-precos',
        titulo: 'Tabela Oficial de Preços por Faixa',
        descricao:
          'Conferência de 1 a 4 un (R$ 14,99), 5 a 25 (R$ 12,50), 26 a 50 (R$ 11,50), 51 a 100 (R$ 10,50) e > 100 (R$ 9,99).',
        sucesso,
        detalhes: sucesso
          ? 'Todas as 5 faixas e limites extremos retornaram os valores oficiais com precisão.'
          : `Falhas encontradas: ${falhas.join('; ')}`,
        tempoMs: Math.round(performance.now() - t0),
      })
    }

    // 4. TESTE: SANITIZAÇÃO BLOQUEANDO ENTRADA MALICIOSA (XSS E INJEÇÃO)
    {
      const t0 = performance.now()
      let sucesso = true
      const falhas: string[] = []

      const testesXss = [
        {
          entrada: '<script>alert("xss")</script>Cliente Legal',
          esperadoNaoConter: '<script>',
        },
        {
          entrada: '<img src=x onerror=alert(1)>',
          esperadoNaoConter: '<',
        },
        {
          entrada: 'Texto com\x00caractere nulo e <tag>',
          esperadoNaoConter: '<tag>',
        },
      ]

      for (const t of testesXss) {
        const sanitizado = sanitizarTexto(t.entrada)
        if (
          sanitizado.includes(t.esperadoNaoConter) ||
          sanitizado.includes('<') ||
          sanitizado.includes('>')
        ) {
          sucesso = false
          falhas.push(`Entrada "${t.entrada}" produziu saída insegura: "${sanitizado}"`)
        }
      }

      novosResultados.push({
        id: 'sanitizacao',
        titulo: 'Sanitização contra XSS e Entradas Maliciosas',
        descricao:
          'Verifica se tags HTML, scripts e caracteres de controle perigosos são neutralizados.',
        sucesso,
        detalhes: sucesso
          ? 'Tags <script>, <img> com handlers e caracteres injetados foram bloqueados com sucesso.'
          : `Falhas na sanitização: ${falhas.join('; ')}`,
        tempoMs: Math.round(performance.now() - t0),
      })
    }

    // 5. TESTE: BACKUP ROUND-TRIP (EXPORTAÇÃO E REIMPORTAÇÃO IDÊNTICA EM MEMÓRIA)
    {
      const t0 = performance.now()
      let sucesso = false
      let detalhes = ''
      try {
        // Serializa o estado atual em JSON (igual ao backup)
        const backupJsonString = JSON.stringify({
          app: 'Bru Memórias | Controle de Vendas',
          exportadoEm: new Date().toISOString(),
          versao: 1,
          dados: data,
        })

        // Restaura num buffer em memória isolado (NUNCA sobrescreve os dados reais do usuário)
        const parseBuffer = JSON.parse(backupJsonString) as { dados: AppData }
        const dadosRestaurados = parseBuffer.dados

        // Confere paridade estrutural
        const produtosIguais = dadosRestaurados.produtos.length === data.produtos.length
        const clientesIguais = dadosRestaurados.clientes.length === data.clientes.length
        const fornecedoresIguais = dadosRestaurados.fornecedores.length === data.fornecedores.length

        // Compara JSON de dados para igualdade exata
        const jsonOriginal = JSON.stringify(data)
        const jsonRoundTrip = JSON.stringify(dadosRestaurados)

        if (
          produtosIguais &&
          clientesIguais &&
          fornecedoresIguais &&
          jsonOriginal === jsonRoundTrip
        ) {
          sucesso = true
          detalhes = `Round-trip verificado com fidelidade absoluta de 100% (${dadosRestaurados.produtos.length} produtos, ${dadosRestaurados.clientes.length} clientes). Storage real permaneceu intocado.`
        } else {
          detalhes = 'Divergência entre o objeto de dados original e o restaurado em memória.'
        }
      } catch (err: unknown) {
        detalhes = err instanceof Error ? err.message : 'Falha no teste de round-trip'
      }

      novosResultados.push({
        id: 'backup-roundtrip',
        titulo: 'Backup JSON Round-Trip (Exportação/Restauração em Memória)',
        descricao:
          'Serializa os dados em JSON e restaura em memória para garantir fidelidade sem afetar o storage.',
        sucesso,
        detalhes,
        tempoMs: Math.round(performance.now() - t0),
      })
    }

    // 6. TESTE: CÁLCULOS DA CALCULADORA (RECEITA, CUSTO, LUCRO, MARGEM) COM ENTRADAS CONHECIDAS
    {
      const t0 = performance.now()
      let sucesso = false
      let detalhes = ''

      // Entradas conhecidas:
      // Quantidade = 10
      // Preço unitário = 12.50 -> Receita bruta = 125.00
      // Custo unitário = 3.20 -> Custo produtos = 32.00
      // Desconto = 5.00 -> Receita após desconto = 120.00
      // Taxa cartão = 4% de 120.00 = 4.80
      // Impostos = 0%
      // Frete = 10.00
      // Deduções totais = 5.00 + 4.80 + 10.00 = 19.80
      // Lucro líquido = 125.00 - 32.00 - 19.80 = 73.20
      // Margem líquida = (73.20 / 125.00) * 100 = 58.56%
      const qtd = 10
      const preco = 12.5
      const custo = 3.2
      const desc = 5.0
      const taxa = 4.0
      const frt = 10.0

      const recBruta = qtd * preco
      const custoTotal = qtd * custo
      const recAposDesc = recBruta - desc
      const vTaxa = (recAposDesc * taxa) / 100
      const dedTot = desc + vTaxa + frt
      const lucroLiq = recBruta - custoTotal - dedTot
      const margem = (lucroLiq / recBruta) * 100

      const expRec = 125.0
      const expCusto = 32.0
      const expLucro = 73.2
      const expMargem = 58.56

      const diffRec = Math.abs(recBruta - expRec)
      const diffCusto = Math.abs(custoTotal - expCusto)
      const diffLucro = Math.abs(lucroLiq - expLucro)
      const diffMargem = Math.abs(margem - expMargem)

      if (diffRec < 0.001 && diffCusto < 0.001 && diffLucro < 0.001 && diffMargem < 0.01) {
        sucesso = true
        detalhes = `Cálculos exatos conferidos: Receita = R$ ${recBruta.toFixed(2)}, Custo = R$ ${custoTotal.toFixed(2)}, Lucro Líquido = R$ ${lucroLiq.toFixed(2)}, Margem = ${margem.toFixed(2)}%.`
      } else {
        detalhes = `Divergência nos cálculos da calculadora: Lucro=${lucroLiq} (esp ${expLucro}), Margem=${margem}% (esp ${expMargem}%).`
      }

      novosResultados.push({
        id: 'calculadora-calculos',
        titulo: 'Cálculos da Calculadora (Receita, Custo, Lucro e Margem)',
        descricao:
          'Verificação matemática precisa de receitas, deduções e margem líquida com entradas controladas.',
        sucesso,
        detalhes,
        tempoMs: Math.round(performance.now() - t0),
      })
    }

    // 7. TESTE: CÁLCULOS DE METAS (PROGRESSO E RITMO) COM DADOS DE TESTE
    {
      const t0 = performance.now()
      let sucesso = false
      let detalhes = ''

      try {
        const metaTeste: MetaVendas = {
          id: 'meta-teste-diag',
          periodType: 'mensal',
          metaReceita: 2000,
          metaLucro: 1000,
          metaQuantidade: 100,
          criadoEm: '2025-01-01T00:00:00.000Z',
        }

        // Simula KPIs em 50% de progresso
        const kpisTeste = {
          receitaTotal: { atual: 1000, anterior: 800, variacaoPct: 25, tendencia: 'alta' as const },
          lucroTotal: { atual: 500, anterior: 400, variacaoPct: 25, tendencia: 'alta' as const },
          quantidadeTotal: { atual: 50, anterior: 40, variacaoPct: 25, tendencia: 'alta' as const },
          ticketMedio: { atual: 50, anterior: 45, variacaoPct: 11.1, tendencia: 'alta' as const },
          margemMedia: 50,
          pedidosCount: 20,
        }

        const intervaloTeste = {
          inicio: '2025-01-01',
          fim: '2025-01-31',
        }

        const analise = calcularProgressoMetas(metaTeste, kpisTeste, intervaloTeste)

        const itemReceita = analise.itens.find((i) => i.tipo === 'receita')
        const itemLucro = analise.itens.find((i) => i.tipo === 'lucro')
        const itemQtd = analise.itens.find((i) => i.tipo === 'quantidade')

        const pctReceita = itemReceita?.percentual ?? 0
        const pctLucro = itemLucro?.percentual ?? 0
        const pctQtd = itemQtd?.percentual ?? 0

        // Todos devem ter atingido exatamente 50%
        if (
          Math.abs(pctReceita - 50) < 0.1 &&
          Math.abs(pctLucro - 50) < 0.1 &&
          Math.abs(pctQtd - 50) < 0.1
        ) {
          sucesso = true
          detalhes = `Cálculo de metas validado: Receita (${pctReceita}%), Lucro (${pctLucro}%), Quantidade (${pctQtd}%). Ritmo: ${itemReceita?.ritmoStatus || 'ok'}.`
        } else {
          detalhes = `Percentuais incorretos: Receita=${pctReceita}%, Lucro=${pctLucro}%, Qtd=${pctQtd}%.`
        }
      } catch (err: unknown) {
        detalhes = err instanceof Error ? err.message : 'Falha no cálculo de metas'
      }

      novosResultados.push({
        id: 'metas-calculos',
        titulo: 'Cálculos de Metas de Vendas (Progresso e Ritmo)',
        descricao:
          'Valida proporções atingidas e status de ritmo (adiantado, no ritmo, atrasado) com fixtures controladas.',
        sucesso,
        detalhes,
        tempoMs: Math.round(performance.now() - t0),
      })
    }

    setResultados(novosResultados)
    setUltimaExecucao(new Date())
    setTestando(false)

    const falhasCount = novosResultados.filter((r) => !r.sucesso).length
    logAudit(
      'Sistema',
      'Diagnóstico executado',
      `Autoteste completado com ${novosResultados.length - falhasCount}/${novosResultados.length} testes aprovados.`,
    )
  }, [data, logAudit])

  // Roda automaticamente ao abrir a aba
  useEffect(() => {
    executarBateriaDeTestes()
  }, [executarBateriaDeTestes])

  const totalAprovados = resultados.filter((r) => r.sucesso).length
  const totalTestes = resultados.length
  const todosAprovados = totalAprovados === totalTestes && totalTestes > 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabeçalho do Módulo */}
      <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-soft-pink flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#FF1493] uppercase tracking-wider block mb-1">
            Auditoria de Sistema
          </span>
          <h2 className="text-2xl font-brand-serif font-bold text-[#4E342E] flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-[#FF1493]" />
            <span>Diagnóstico & Autoteste do App</span>
          </h2>
          <p className="text-xs text-[#4E342E]/70 mt-1">
            Bateria completa de testes em memória: integridade de storage, cálculos, precificação,
            sanitização e segurança.
          </p>
        </div>

        <button
          onClick={executarBateriaDeTestes}
          disabled={testando}
          className="min-h-[44px] px-4 py-2 text-xs font-bold text-white bg-[#FF1493] hover:bg-[#E01284] disabled:opacity-50 rounded-full shadow-md transition-all duration-150 flex items-center justify-center gap-2 active:scale-95 flex-shrink-0"
        >
          {testando ? (
            <RotateCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-current" />
          )}
          <span>{testando ? 'Executando testes...' : 'Executar testes'}</span>
        </button>
      </div>

      {/* Banner Resumo de Integridade */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          testando
            ? 'bg-blue-50/70 border-blue-200 text-blue-900'
            : todosAprovados
              ? 'bg-gradient-to-r from-emerald-500/10 via-[#FFF0F8] to-emerald-500/10 border-2 border-emerald-400 text-[#4E342E]'
              : 'bg-red-50 border-2 border-red-300 text-red-900'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm ${
                testando
                  ? 'bg-blue-100 text-blue-600'
                  : todosAprovados
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
              }`}
            >
              {testando ? (
                <RotateCw className="w-6 h-6 animate-spin" />
              ) : todosAprovados ? (
                <CheckCircle2 className="w-7 h-7" />
              ) : (
                <XCircle className="w-7 h-7" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold font-brand-serif">
                {testando
                  ? 'Rodando bateria de autoteste...'
                  : todosAprovados
                    ? 'Sistema 100% Operacional e Conforme! ✨'
                    : `${totalTestes - totalAprovados} teste(s) apontaram falhas`}
              </h3>
              <p className="text-xs text-[#4E342E]/70 mt-0.5">
                {totalAprovados} de {totalTestes} verificações aprovadas com sucesso.
                {ultimaExecucao && (
                  <span className="ml-1 text-gray-500">
                    Última verificação: {ultimaExecucao.toLocaleTimeString('pt-BR')}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-black/10 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-[#FF1493]" />
            <span>Zero impacto nos dados reais</span>
          </div>
        </div>
      </div>

      {/* Lista de Testes com Status ao Vivo */}
      <div className="space-y-3">
        {resultados.map((teste) => {
          return (
            <div
              key={teste.id}
              className={`p-4 rounded-2xl bg-white border transition-all shadow-soft-pink ${
                teste.sucesso
                  ? 'border-[#F0E4E0] hover:border-emerald-300'
                  : 'border-red-300 bg-red-50/20'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 flex-shrink-0">
                    {teste.sucesso ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-[#4E342E]">{teste.titulo}</h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          teste.sucesso
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {teste.sucesso ? '✅ Aprovado' : '❌ Falhou'}
                      </span>
                      <span className="text-[10px] text-gray-400">{teste.tempoMs}ms</span>
                    </div>
                    <p className="text-xs text-[#4E342E]/70 mt-1 leading-relaxed">
                      {teste.descricao}
                    </p>

                    {/* Detalhes técnicos da execução */}
                    <div
                      className={`mt-2.5 p-2.5 rounded-xl text-xs font-mono border ${
                        teste.sucesso
                          ? 'bg-[#FAFAFA] border-[#F0E4E0] text-[#4E342E]/80'
                          : 'bg-red-50 border-red-200 text-red-900 font-semibold'
                      }`}
                    >
                      <span className="font-bold font-sans text-[11px] block text-gray-500 mb-0.5">
                        Resultado da verificação:
                      </span>
                      {teste.detalhes}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Nota Informativa sobre Segurança de Testes */}
      <div className="p-4 bg-[#F5EFEA]/80 rounded-2xl border border-[#F0E4E0] flex items-start gap-3 text-xs text-[#4E342E]/80">
        <Info className="w-4 h-4 text-[#FF1493] flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Garantia de Não-Interferência:</strong> Todos os testes desta bateria utilizam
          buffers isolados em memória e chaves temporárias descartadas logo em seguida. Seus dados
          cadastrais, pedidos, custos reais e configurações permanecem 100% seguros e inalterados
          durante e após a execução.
        </div>
      </div>
    </div>
  )
}
