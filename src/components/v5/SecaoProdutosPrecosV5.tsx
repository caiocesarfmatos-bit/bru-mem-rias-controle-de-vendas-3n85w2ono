import React, { useState } from 'react'
import { useAppV5 } from '@/context/AppV5Context'
import { Produto, FaixaPreco, CHAVES_PARAMETROS } from '@/types/appV5'
import { Tag, Plus, Edit2, AlertTriangle, Layers, Sparkles, Info, Check } from 'lucide-react'
import { formatarMoeda, formatarNumero } from '@/lib/formatters'
import { useToast } from '@/hooks/use-toast'

export const SecaoProdutosPrecosV5: React.FC = () => {
  const {
    data,
    adicionarProduto,
    adicionarComposicaoKit,
    atualizarFaixaPreco,
    custoTotalUnitarioAtual,
    getParametro,
  } = useAppV5()
  const { toast } = useToast()

  const [showModalNovoProduto, setShowModalNovoProduto] = useState(false)
  const [showModalEditarFaixa, setShowModalEditarFaixa] = useState<FaixaPreco | null>(null)

  // Form novo produto / kit
  const [nomeProduto, setNomeProduto] = useState('')
  const [dimensaoProduto, setDimensaoProduto] = useState('5x5 cm')
  const [descricaoProduto, setDescricaoProduto] = useState('')
  const [ehKit, setEhKit] = useState(false)
  const [qtdNoKit, setQtdNoKit] = useState<number>(3)

  // Form edição faixa
  const [precoFaixa, setPrecoFaixa] = useState<number>(14.99)
  const [nomeComercialFaixa, setNomeComercialFaixa] = useState('')

  const margemMinimaParam = getParametro(CHAVES_PARAMETROS.MARGEM_MINIMA_PCT) || 30

  const handleSalvarProduto = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nomeProduto.trim()) {
      toast({ title: 'Nome obrigatório', variant: 'destructive' })
      return
    }

    const custoCalc = ehKit
      ? Number((custoTotalUnitarioAtual * qtdNoKit).toFixed(2))
      : custoTotalUnitarioAtual

    const novoProduto = adicionarProduto({
      nome: nomeProduto,
      dimensao: dimensaoProduto,
      descricao: descricaoProduto,
      custoUnitarioCalculado: custoCalc,
      ativo: true,
      ehKit,
    })

    if (ehKit) {
      adicionarComposicaoKit(novoProduto.id, 'prod-ima-5x5', qtdNoKit)
    }

    toast({
      title: 'Produto/Kit cadastrado com sucesso! 💖',
      description: `Custo calculado automaticamente: ${formatarMoeda(custoCalc)}`,
    })

    setShowModalNovoProduto(false)
    setNomeProduto('')
    setDescricaoProduto('')
    setEhKit(false)
  }

  const handleSalvarEdicaoFaixa = (e: React.FormEvent) => {
    e.preventDefault()
    if (!showModalEditarFaixa) return

    atualizarFaixaPreco(showModalEditarFaixa.id, {
      precoUnitario: precoFaixa,
      nomeComercial: nomeComercialFaixa || showModalEditarFaixa.nomeComercial,
    })

    toast({ title: 'Faixa de preço atualizada na tabela oficial!' })
    setShowModalEditarFaixa(null)
  }

  return (
    <div className="space-y-6">
      {/* Topo com Botão de Cadastro */}
      <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#FF1493]" />
            <h2 className="text-base font-bold font-brand-serif text-[#4E342E]">
              Produtos, Kits e Tabela de Faixas Oficiais
            </h2>
          </div>
          <p className="text-xs text-[#4E342E]/70 mt-0.5">
            O preço unitário é determinado exclusivamente pela faixa de quantidade do mesmo pedido.
          </p>
        </div>

        <button
          onClick={() => setShowModalNovoProduto(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#FF1493] hover:bg-[#E01284] rounded-full shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Produto / Kit</span>
        </button>
      </div>

      {/* Tabela Oficial de Faixas de Preço Pré-carregadas */}
      <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold font-brand-serif text-[#4E342E]">
            Tabela Oficial de Preços por Quantidade (Ímã 5x5 cm)
          </h3>
          <span className="text-[11px] text-gray-500">
            Margem mínima: <strong>{margemMinimaParam}%</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#FFF0F8] text-[#4E342E] uppercase font-bold text-[10px]">
              <tr>
                <th className="py-2.5 px-3 rounded-l-xl">Nome Comercial</th>
                <th className="py-2.5 px-3">Faixa de Quantidade</th>
                <th className="py-2.5 px-3">Preço Unitário</th>
                <th className="py-2.5 px-3">Custo Unitário</th>
                <th className="py-2.5 px-3">Lucro Bruto Unit.</th>
                <th className="py-2.5 px-3">Margem (%)</th>
                <th className="py-2.5 px-3 rounded-r-xl text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.faixasPreco.map((faixa) => {
                const custo = custoTotalUnitarioAtual
                const lucro = faixa.precoUnitario - custo
                const margemPct = (lucro / faixa.precoUnitario) * 100
                const abaixoMinimo = margemPct < margemMinimaParam

                return (
                  <tr key={faixa.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-3 font-bold text-[#4E342E]">
                      {faixa.nomeComercial}
                      <span className="text-[10px] text-gray-400 block font-normal">
                        Ref: {faixa.nomeReferencia}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#4E342E]">
                      {faixa.quantidadeMinima} a{' '}
                      {faixa.quantidadeMaxima === Infinity ? 'acima' : faixa.quantidadeMaxima} un
                    </td>
                    <td className="py-3 px-3 font-bold text-[#FF1493] text-sm">
                      {formatarMoeda(faixa.precoUnitario)}
                    </td>
                    <td className="py-3 px-3 text-gray-600">{formatarMoeda(custo)}</td>
                    <td className="py-3 px-3 font-bold text-green-700">{formatarMoeda(lucro)}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                          abaixoMinimo ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {formatarNumero(margemPct, 1)}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          setShowModalEditarFaixa(faixa)
                          setPrecoFaixa(faixa.precoUnitario)
                          setNomeComercialFaixa(faixa.nomeComercial)
                        }}
                        className="p-1.5 text-gray-500 hover:text-[#FF1493] hover:bg-[#FFF0F8] rounded-lg transition-colors"
                        title="Editar Preço da Faixa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lista de Produtos e Kits Cadastrados */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold font-brand-serif text-[#4E342E]">
          Catálogo Interno de Produtos e Kits
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.produtos.map((prod) => {
            const composicoesDoKit = data.composicoes.filter((c) => c.produtoKitId === prod.id)

            return (
              <div
                key={prod.id}
                className="bg-white rounded-2xl p-4 border border-[#F0E4E0] shadow-2xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-gray-100">
                    <div>
                      <h4 className="text-xs font-bold text-[#4E342E]">{prod.nome}</h4>
                      <span className="text-[10px] text-gray-400 block">{prod.dimensao}</span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        prod.ehKit ? 'bg-purple-100 text-purple-800' : 'bg-[#FFF0F8] text-[#FF1493]'
                      }`}
                    >
                      {prod.ehKit ? 'Kit Composto' : 'Avulso'}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#4E342E]/70 pt-2">{prod.descricao}</p>

                  {prod.ehKit && composicoesDoKit.length > 0 && (
                    <div className="mt-2 p-2 bg-purple-50/70 rounded-xl border border-purple-100 text-[10px] text-purple-900 space-y-1">
                      <span className="font-bold block">Composição do Kit:</span>
                      {composicoesDoKit.map((comp) => (
                        <div key={comp.id} className="flex justify-between">
                          <span>{comp.quantidade}x Ímã 5x5 cm</span>
                          <span className="font-bold">{formatarMoeda(comp.custoCalculado)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-500 text-[11px]">Custo Calculado:</span>
                  <span className="font-bold text-[#4E342E]">
                    {formatarMoeda(prod.custoUnitarioCalculado)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal Novo Produto / Kit */}
      {showModalNovoProduto && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#F0E4E0] space-y-4">
            <h3 className="text-base font-bold font-brand-serif text-[#4E342E]">
              Cadastrar Produto ou Kit
            </h3>

            <form onSubmit={handleSalvarProduto} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#4E342E] mb-1">Nome do Produto *</label>
                <input
                  type="text"
                  value={nomeProduto}
                  onChange={(e) => setNomeProduto(e.target.value)}
                  placeholder="Ex: Trio de Ímãs Natalinos"
                  className="w-full px-3 py-2 border rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#4E342E] mb-1">Dimensão</label>
                <input
                  type="text"
                  value={dimensaoProduto}
                  onChange={(e) => setDimensaoProduto(e.target.value)}
                  placeholder="Ex: 5x5 cm"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-[#4E342E] mb-1">Descrição</label>
                <textarea
                  value={descricaoProduto}
                  onChange={(e) => setDescricaoProduto(e.target.value)}
                  placeholder="Detalhes sobre acabamento, embalagem e fotos..."
                  className="w-full px-3 py-2 border rounded-xl"
                  rows={2}
                />
              </div>

              <div className="p-3 bg-[#FFF0F8] rounded-xl border border-[#FF1493]/20 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="check-kit"
                    checked={ehKit}
                    onChange={(e) => setEhKit(e.target.checked)}
                    className="rounded text-[#FF1493] focus:ring-[#FF1493]"
                  />
                  <label htmlFor="check-kit" className="font-bold text-[#4E342E] cursor-pointer">
                    Este item é um Kit com múltiplos ímãs?
                  </label>
                </div>

                {ehKit && (
                  <div>
                    <label className="block font-bold text-[#4E342E] mb-1">
                      Quantidade de ímãs no kit:
                    </label>
                    <input
                      type="number"
                      min="2"
                      value={qtdNoKit}
                      onChange={(e) => setQtdNoKit(Math.max(2, parseInt(e.target.value) || 2))}
                      className="w-full px-3 py-2 border rounded-xl bg-white"
                    />
                    <span className="text-[10px] text-gray-500 block mt-1">
                      Custo total do kit será calculado multiplicando o custo do ímã por {qtdNoKit}.
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModalNovoProduto(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#FF1493] hover:bg-[#E01284] text-white font-bold rounded-full"
                >
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Preço da Faixa */}
      {showModalEditarFaixa && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#F0E4E0] space-y-4">
            <h3 className="text-base font-bold font-brand-serif text-[#4E342E]">
              Editar Preço Oficial da Faixa
            </h3>

            <form onSubmit={handleSalvarEdicaoFaixa} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#4E342E] mb-1">Nome Comercial</label>
                <input
                  type="text"
                  value={nomeComercialFaixa}
                  onChange={(e) => setNomeComercialFaixa(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#4E342E] mb-1">
                  Preço Unitário Oficial (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={precoFaixa}
                  onChange={(e) => setPrecoFaixa(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-xl font-bold text-sm text-[#FF1493]"
                  required
                />
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border space-y-1">
                <span className="text-[10px] text-gray-500 block">Simulação de Margem:</span>
                <span className="font-bold text-[#4E342E]">
                  Margem resultante:{' '}
                  {formatarNumero(((precoFaixa - custoTotalUnitarioAtual) / precoFaixa) * 100, 1)}%
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModalEditarFaixa(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#FF1493] hover:bg-[#E01284] text-white font-bold rounded-full"
                >
                  Salvar Preço
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
