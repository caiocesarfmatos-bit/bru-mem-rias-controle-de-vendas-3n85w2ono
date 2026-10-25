// src/services/tabelaValores.ts
import pb from '@/lib/pocketbase/client'
import { TabelaValorItem } from '@/types/sistema'

export async function listarValoresDominio(dominio: string): Promise<TabelaValorItem[]> {
  try {
    const records = await pb.collection('tabela_valores').getFullList({
      filter: `dominio = '${dominio}' && ativo = true`,
      sort: 'ordem',
    })
    return records.map((r) => ({
      id: r.id,
      dominio: r.getString('dominio'),
      codigo: r.getString('codigo'),
      rotulo: r.getString('rotulo'),
      ordem: r.getInt('ordem'),
      ativo: r.getBool('ativo'),
      regras_json: r.regras_json,
    }))
  } catch (err) {
    console.error(`Erro ao listar domínio ${dominio}:`, err)
    return []
  }
}

export async function listarFormasPagamento(): Promise<TabelaValorItem[]> {
  return listarValoresDominio('forma_pagamento')
}
