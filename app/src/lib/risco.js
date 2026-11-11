// Cálculos e catálogo de indicadores da tela "Risco Territorial".
import { fmtInt, fmtDec } from './calc.js'

// ------------------------------------------------------------------ estatística
const valido = (v) => v != null && Number.isFinite(v)

/** Limites de classes por quantis. Devolve k-1 cortes crescentes (remove cortes repetidos, como em indicadores com muitos zeros). */
export function limitesPorQuantil(valores, k = 6) {
  const v = valores.filter(valido).sort((a, b) => a - b)
  if (!v.length) return []
  const cortes = []
  for (let i = 1; i < k; i++) {
    const pos = (i / k) * (v.length - 1), lo = Math.floor(pos), f = pos - lo
    const c = v[lo] + (v[Math.min(lo + 1, v.length - 1)] - v[lo]) * f
    if (c > v[0] && (!cortes.length || c > cortes[cortes.length - 1])) cortes.push(c)
  }
  return cortes
}

/** Índice (0 a cortes.length) da classe de um valor: valores iguais a um corte caem na classe de cima. */
export function classeDe(valor, cortes) {
  if (!valido(valor)) return -1
  let i = 0
  while (i < cortes.length && valor >= cortes[i]) i++
  return i
}

/** Percentil (0 a 100) de cada valor na lista, usando o posto médio nos empates. Nulos continuam nulos. */
export function percentis(valores) {
  const idx = valores.map((v, i) => [v, i]).filter(([v]) => valido(v)).sort((a, b) => a[0] - b[0])
  const out = new Array(valores.length).fill(null), n = idx.length
  if (n === 0) return out
  if (n === 1) { out[idx[0][1]] = 50; return out }
  let i = 0
  while (i < n) {
    let j = i
    while (j + 1 < n && idx[j + 1][0] === idx[i][0]) j++
    const p = (((i + j) / 2) / (n - 1)) * 100
    for (let k = i; k <= j; k++) out[idx[k][1]] = p
    i = j + 1
  }
  return out
}

export function mediana(valores) {
  const v = valores.filter(valido).sort((a, b) => a - b)
  if (!v.length) return null
  const m = Math.floor(v.length / 2)
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2
}
export const media = (valores) => {
  const v = valores.filter(valido)
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null
}

// ------------------------------------------------------------------ prioridade de apoio
export const COMPONENTES_PRIORIDADE = [
  { id: 'des', nome: 'Desastres recentes', ajuda: 'Registros de desastres no município nos últimos 10 anos (Atlas Digital)' },
  { id: 'ivs', nome: 'Vulnerabilidade social', ajuda: 'IVS 2010 (Ipea): quanto maior, mais vulnerável' },
  { id: 'hid', nome: 'Insegurança hídrica', ajuda: 'ISH 2017 (ANA): quanto menor a segurança hídrica, maior a nota' },
  { id: 'coop', nome: 'Falta de cooperativas', ajuda: 'Cooperativas agropecuárias por 10 mil estabelecimentos familiares: quanto menos, maior a nota' },
]
export const MINIMO_COMPONENTES = 3

/**
 * Nota de prioridade (0 a 100): média ponderada dos percentis disponíveis.
 * `percentisDoMunicipio` = { des, ivs, hid, coop } com valores de 0 a 100 ou nulos. Se faltarem componentes, os pesos dos
 * demais são reescalados; com menos de MINIMO_COMPONENTES componentes disponíveis a nota é nula.
 */
export function notaPrioridade(percentisDoMunicipio, pesos) {
  let soma = 0, peso = 0, n = 0
  for (const c of COMPONENTES_PRIORIDADE) {
    const p = percentisDoMunicipio?.[c.id]
    if (!valido(p)) continue
    n++
    const w = Math.max(0, Number(pesos?.[c.id] ?? 1))
    soma += w * p; peso += w
  }
  if (n < MINIMO_COMPONENTES || peso <= 0) return null
  return soma / peso
}

// ------------------------------------------------------------------ cores
// Rampa sequencial de um só matiz (azul) validada para claro e escuro; no escuro, valores baixos ficam perto do fundo.
const RAMPA = ['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#1c5cab', '#0d366b']
export function rampa(n, escuro = false) {
  const passos = n <= 1 ? [RAMPA[3]] : Array.from({ length: n }, (_, i) => RAMPA[Math.round((i / (n - 1)) * (RAMPA.length - 1))])
  return escuro ? passos.slice().reverse() : passos
}

// ------------------------------------------------------------------ formatação
export const fmtReais = (v) => {
  if (!valido(v)) return '—'
  if (Math.abs(v) >= 1e9) return `R$ ${fmtDec(v / 1e9, 1)} bi`
  if (Math.abs(v) >= 1e6) return `R$ ${fmtDec(v / 1e6, 1)} mi`
  if (Math.abs(v) >= 1e3) return `R$ ${fmtDec(v / 1e3, 0)} mil`
  return `R$ ${fmtInt(v)}`
}
export function formatar(ind, v) {
  if (!valido(v)) return '—'
  if (ind.moeda) return fmtReais(v)
  const txt = ind.dec ? fmtDec(v, ind.dec) : fmtInt(v)
  return ind.unidade ? `${txt} ${ind.unidade}` : txt
}

// ------------------------------------------------------------------ catálogo de indicadores
// `col` é o nome da coluna em risco.json (ou uma coluna derivada, calculada no navegador com os dados de cooperativas).
export const TEMAS = [
  { id: 'desastres', nome: 'Desastres (Atlas Digital, 1991–2025)', fonte: 'atlas' },
  { id: 'vulnerabilidade', nome: 'Vulnerabilidade social (IVS, Ipea)', fonte: 'ivs' },
  { id: 'hidrica', nome: 'Segurança hídrica (ANA)', fonte: 'ish' },
  { id: 'agua', nome: 'Rios, bacias e lagos (HydroSHEDS)', fonte: 'hydro' },
  { id: 'solo', nome: 'Solo, 0 a 30 cm (SoilGrids)', fonte: 'solo' },
  { id: 'populacao', nome: 'População e urbanização (GHSL)', fonte: 'ghsl' },
  { id: 'coops', nome: 'Cooperativas (Receita Federal) e agricultura familiar (IBGE)', fonte: 'cnpj' },
]
export const INDICADORES = [
  { id: 'des_recentes', tema: 'desastres', rotulo: 'Desastres nos últimos 10 anos', col: 'des_recentes', unidade: 'registros', ajuda: 'Registros de desastres de 2016 a 2025.' },
  { id: 'des_total', tema: 'desastres', rotulo: 'Desastres desde 1991', col: 'des_total', unidade: 'registros' },
  { id: 'des_seca', tema: 'desastres', rotulo: 'Estiagem e seca', col: 'des_seca', unidade: 'registros', ajuda: 'Registros de estiagem e seca desde 1991.' },
  { id: 'des_cheias', tema: 'desastres', rotulo: 'Enxurradas e inundações', col: 'des_cheias', unidade: 'registros', ajuda: 'Enxurradas, inundações e alagamentos.' },
  { id: 'des_tempestades', tema: 'desastres', rotulo: 'Tempestades', col: 'des_tempestades', unidade: 'registros', ajuda: 'Chuvas intensas, vendavais, ciclones, granizo e tornados.' },
  { id: 'pessoas_afetadas', tema: 'desastres', rotulo: 'Pessoas afetadas (danos humanos diretos)', col: 'pessoas_afetadas', unidade: 'pessoas' },
  { id: 'perda_agro', tema: 'desastres', rotulo: 'Prejuízo agrícola e pecuário', col: 'perda_agro', moeda: true, ajuda: 'Soma dos prejuízos privados na agricultura e na pecuária, em valores nominais (sem correção de preços).' },
  { id: 'ivs2010', tema: 'vulnerabilidade', rotulo: 'IVS 2010', col: 'ivs2010', dec: 3, ajuda: 'De 0 (menor vulnerabilidade) a 1 (maior).' },
  { id: 'ivs_infra', tema: 'vulnerabilidade', rotulo: 'IVS Infraestrutura urbana', col: 'ivs_infra', dec: 3 },
  { id: 'ivs_capital', tema: 'vulnerabilidade', rotulo: 'IVS Capital humano', col: 'ivs_capital', dec: 3 },
  { id: 'ivs_renda', tema: 'vulnerabilidade', rotulo: 'IVS Renda e trabalho', col: 'ivs_renda', dec: 3 },
  { id: 'ivs2000', tema: 'vulnerabilidade', rotulo: 'IVS 2000', col: 'ivs2000', dec: 3 },
  { id: 'ish2017_geral', tema: 'hidrica', rotulo: 'ISH 2017 (geral)', col: 'ish2017_geral', dec: 2, ajuda: 'De 1 (mínimo) a 5 (máximo): quanto maior, maior a segurança hídrica. Média das bacias do município, ponderada pela área.' },
  { id: 'ish2017_pct_area_baixa', tema: 'hidrica', rotulo: 'Área com segurança hídrica mínima ou baixa (2017)', col: 'ish2017_pct_area_baixa', dec: 0, unidade: '%' },
  { id: 'ish2017_humana', tema: 'hidrica', rotulo: 'ISH 2017 · dimensão humana', col: 'ish2017_humana', dec: 2 },
  { id: 'ish2017_economica', tema: 'hidrica', rotulo: 'ISH 2017 · dimensão econômica', col: 'ish2017_economica', dec: 2 },
  { id: 'ish2017_ecossistemica', tema: 'hidrica', rotulo: 'ISH 2017 · dimensão ecossistêmica', col: 'ish2017_ecossistemica', dec: 2 },
  { id: 'ish2017_resiliencia', tema: 'hidrica', rotulo: 'ISH 2017 · resiliência', col: 'ish2017_resiliencia', dec: 2 },
  { id: 'ish2035_geral', tema: 'hidrica', rotulo: 'ISH 2035 (projeção)', col: 'ish2035_geral', dec: 2, ajuda: 'Cenário projetado pela ANA no Plano Nacional de Segurança Hídrica.' },
  { id: 'rios_km_km2', tema: 'agua', rotulo: 'Densidade de rios', col: 'rios_km_km2', dec: 2, unidade: 'km/km²', ajuda: 'Extensão da rede de drenagem (HydroRIVERS) por área do município.' },
  { id: 'reservatorios_area_km2', tema: 'agua', rotulo: 'Área de reservatórios', col: 'reservatorios_area_km2', dec: 1, unidade: 'km²' },
  { id: 'lagos_area_km2', tema: 'agua', rotulo: 'Área de lagos e reservatórios', col: 'lagos_area_km2', dec: 1, unidade: 'km²', ajuda: 'Corpos d\'água de 10 ha ou mais (HydroLAKES), atribuídos ao município do ponto central de cada um.' },
  { id: 'ph', tema: 'solo', rotulo: 'pH do solo', col: 'ph', dec: 1, ajuda: 'pH em água, média de 0 a 30 cm.' },
  { id: 'argila_pct', tema: 'solo', rotulo: 'Argila', col: 'argila_pct', dec: 0, unidade: '%' },
  { id: 'areia_pct', tema: 'solo', rotulo: 'Areia', col: 'areia_pct', dec: 0, unidade: '%' },
  { id: 'carbono_g_kg', tema: 'solo', rotulo: 'Carbono orgânico', col: 'carbono_g_kg', dec: 1, unidade: 'g/kg' },
  { id: 'ctc_cmolc_kg', tema: 'solo', rotulo: 'Capacidade de troca de cátions', col: 'ctc_cmolc_kg', dec: 1, unidade: 'cmolc/kg' },
  { id: 'pop2020', tema: 'populacao', rotulo: 'População em 2020', col: 'pop2020', unidade: 'hab.', ajuda: 'Estimativa da grade de população do GHSL, não é o número oficial do Censo.' },
  { id: 'densidade_hab_km2', tema: 'populacao', rotulo: 'Densidade demográfica', col: 'densidade_hab_km2', dec: 1, unidade: 'hab./km²' },
  { id: 'pct_pop_rural', tema: 'populacao', rotulo: 'População em áreas rurais', col: 'pct_pop_rural', dec: 0, unidade: '%', ajuda: 'Parte da população em áreas classificadas como rurais pelo Grau de Urbanização (GHS-SMOD).' },
  { id: 'cresc_pop_pct', tema: 'populacao', rotulo: 'Crescimento 2000–2020', col: 'cresc_pop_pct', dec: 0, unidade: '%' },
  { id: 'area_construida_km2', tema: 'populacao', rotulo: 'Área construída', col: 'area_construida_km2', dec: 1, unidade: 'km²' },
  { id: 'coops_ativas', tema: 'coops', rotulo: 'Cooperativas ativas (todos os ramos)', col: 'coops_ativas', unidade: 'coop.' },
  { id: 'coops_agro', tema: 'coops', rotulo: 'Cooperativas agropecuárias', col: 'coops_agro', unidade: 'coop.', ajuda: 'Ramo estimado pelo CNAE principal.' },
  { id: 'coops_agro_10mil', tema: 'coops', rotulo: 'Cooperativas agropecuárias por 10 mil estab. familiares', col: 'coops_agro_10mil', dec: 1 },
  { id: 'estab_familiares', tema: 'coops', rotulo: 'Estabelecimentos da agricultura familiar', col: 'estab_familiares', unidade: 'estab.', ajuda: 'Censo Agropecuário 2017.' },
]
export const INDICADOR_POR_ID = Object.fromEntries(INDICADORES.map((i) => [i.id, i]))
