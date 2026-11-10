// Carregamento dos dados estáticos (app/public/dados) com cache em memória.
import { useEffect, useState } from 'react'

const BASE = import.meta.env.BASE_URL + 'dados/'
const cache = new Map()

export function carregar(nome) {
  if (!cache.has(nome)) {
    cache.set(nome, fetch(BASE + nome).then((r) => {
      if (!r.ok) throw new Error(`Falha ao carregar ${nome} (${r.status})`)
      return r.json()
    }).catch((e) => { cache.delete(nome); throw e }))
  }
  return cache.get(nome)
}

/** Hook: devolve { dados, erro, carregando } para um arquivo de dados. */
export function useDados(nome) {
  const [estado, setEstado] = useState({ dados: null, erro: null, carregando: !!nome })
  useEffect(() => {
    if (!nome) { setEstado({ dados: null, erro: null, carregando: false }); return }
    let vivo = true
    setEstado((s) => ({ ...s, carregando: true, erro: null }))
    carregar(nome).then((dados) => vivo && setEstado({ dados, erro: null, carregando: false }))
      .catch((erro) => vivo && setEstado({ dados: null, erro, carregando: false }))
    return () => { vivo = false }
  }, [nome])
  return estado
}

// municipios.json: [cod, nome, uf, lat, lon, [contagem por ramo], estabTotal, estabFamiliar]
export const M = { cod: 0, nome: 1, uf: 2, lat: 3, lon: 4, ramos: 5, estab: 6, familiar: 7 }
// coops/UF.json: [cnpj, razao, fantasia, matrizFilial, anoInicio, cnae, codIbge, endereco, bairro, cep, ramo]
export const C = { cnpj: 0, razao: 1, fantasia: 2, tipo: 3, inicio: 4, cnae: 5, cod: 6, endereco: 7, bairro: 8, cep: 9, ramo: 10 }

export const UFS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']
export const somaRamos = (m, ramo = -1) => (ramo >= 0 ? m[M.ramos][ramo] : m[M.ramos].reduce((a, b) => a + b, 0))
