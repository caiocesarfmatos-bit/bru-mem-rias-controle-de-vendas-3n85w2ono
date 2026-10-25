import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { BrandEmblem } from '@/design/BrandEmblem'
import { BRAND_TOKENS } from '@/design/tokens'
import { Printer, Download, CheckCircle2 } from 'lucide-react'
import { formatarCentavosParaReal, formatarDataHoraPtBR } from '@/lib/formatters'

export interface ComprovantePedidoDados {
  numero: number | string
  dataEmissao: string
  clienteNome: string
  clienteDocumento?: string
  clienteContato?: string
  itens: Array<{
    descricao: string
    quantidade: number
    valorUnitarioCentavos: number
    subtotalCentavos: number
  }>
  totalCentavos: number
  formaPagamento: string
  status: string
  observacoes?: string
}

interface ModalComprovantePedidoProps {
  aberto: boolean
  onFechar: () => void
  pedido: ComprovantePedidoDados | null
}

export const ModalComprovantePedido: React.FC<ModalComprovantePedidoProps> = ({
  aberto,
  onFechar,
  pedido,
}) => {
  if (!pedido) return null

  const handleImprimir = () => {
    window.print()
  }

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-w-2xl bg-white border border-[#EEDFD7] p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Comprovante Oficial de Pedido #{pedido.numero}</DialogTitle>
        </DialogHeader>

        {/* Barra superior de ações */}
        <div className="bg-[#FFF8F4] px-6 py-3 border-b border-[#EEDFD7] flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#5C2214]">
            <CheckCircle2 className="w-4 h-4 text-[#E63980]" />
            <span>Documento Comercial Oficial</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleImprimir}
              className="bg-[#E63980] hover:bg-[#D1256E] text-white text-xs gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir Comprovante
            </Button>
          </div>
        </div>

        {/* Folha do Comprovante (Formatada para Impressão e Visualização A4/Recibo) */}
        <div
          id="area-comprovante-imprimir"
          className="p-8 space-y-6 text-[#3D150B] bg-white print:p-0 print:m-0"
        >
          {/* Cabeçalho do Comprovante com o EMBLEMA DA MARCA (proibido distorcer/recortar) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b-2 border-[#D49B42]/40">
            {/* Emblema Principal com Respiro Regulamentar */}
            <div className="flex items-center gap-3">
              <BrandEmblem
                variant="main"
                size={88}
                withPadding={true}
                surface="light"
                alt="Emblema Oficial Bru Memórias Personalizados"
              />
              <div className="text-left">
                <h1 className="text-xl font-bold font-serif text-[#3D150B]">
                  {BRAND_TOKENS.fullName}
                </h1>
                <p className="text-xs italic text-[#E63980] font-serif">"{BRAND_TOKENS.tagline}"</p>
                <p className="text-[11px] font-medium text-[#5C2214] mt-0.5">
                  {BRAND_TOKENS.subtagline}
                </p>
              </div>
            </div>

            {/* Número e Data do Pedido */}
            <div className="text-center sm:text-right bg-[#FFF8F4] sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none w-full sm:w-auto border sm:border-0 border-[#EEDFD7]">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#5C2214]/70 block">
                Comprovante de Venda
              </span>
              <span className="text-2xl font-mono font-extrabold text-[#E63980] block">
                #{pedido.numero}
              </span>
              <span className="text-xs text-[#5C2214] block mt-0.5 font-medium">
                {formatarDataHoraPtBR(pedido.dataEmissao)}
              </span>
            </div>
          </div>

          {/* Dados da Cliente */}
          <div className="bg-[#FFF8F4] p-4 rounded-xl border border-[#EEDFD7] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#5C2214]/70 block">
                Cliente
              </span>
              <span className="font-bold text-sm text-[#3D150B] block">{pedido.clienteNome}</span>
              {pedido.clienteDocumento && (
                <span className="text-[11px] text-[#5C2214] block">
                  Documento: {pedido.clienteDocumento}
                </span>
              )}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#5C2214]/70 block">
                Situação do Pedido
              </span>
              <span className="font-bold text-[#D1256E] uppercase tracking-wide text-xs">
                {pedido.status}
              </span>
              <span className="text-[11px] text-[#5C2214] block mt-0.5">
                Pagamento: <strong>{pedido.formaPagamento}</strong>
              </span>
            </div>
          </div>

          {/* Tabela de Itens */}
          <div className="border border-[#EEDFD7] rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FFF8F4] text-[#3D150B] font-bold border-b border-[#EEDFD7]">
                <tr>
                  <th className="py-2.5 px-4">Descrição do Produto</th>
                  <th className="py-2.5 px-4 text-center">Qtd</th>
                  <th className="py-2.5 px-4 text-right">Unitário</th>
                  <th className="py-2.5 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEDFD7]/60">
                {pedido.itens.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="py-2.5 px-4 font-medium text-[#3D150B]">{item.descricao}</td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-[#5C2214]">
                      {item.quantidade}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-[#5C2214]">
                      {formatarCentavosParaReal(item.valorUnitarioCentavos)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-[#3D150B]">
                      {formatarCentavosParaReal(item.subtotalCentavos)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totalizador */}
          <div className="flex justify-between items-center p-4 bg-[#FFF8F4] border-2 border-[#D49B42]/50 rounded-xl">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-[#5C2214] block">Total do Pedido</span>
              <span className="text-[11px] text-[#5C2214]/70 block">
                Valores oficiais calculados no fechamento
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-mono font-extrabold text-[#E63980]">
                {formatarCentavosParaReal(pedido.totalCentavos)}
              </span>
            </div>
          </div>

          {/* Observações */}
          {pedido.observacoes && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-[#5C2214]">
              <span className="font-bold text-[#3D150B] block mb-0.5">Observações:</span>
              <p>{pedido.observacoes}</p>
            </div>
          )}

          {/* Rodapé Institucional com Logomarca Secundária */}
          <div className="pt-4 border-t border-[#EEDFD7] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#5C2214]/80">
            <div className="flex items-center gap-2">
              <BrandEmblem
                variant="secondary-white"
                size={32}
                withPadding={false}
                alt="Logomarca Bru Memórias"
              />
              <span>Ateliê de Ímãs 5x5 Fotográficos</span>
            </div>
            <span className="text-center sm:text-right text-[10px]">
              Obrigado por confiar à Bru Memórias os seus momentos inesquecíveis!
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ModalComprovantePedido
