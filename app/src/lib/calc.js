// Funções de cálculo puras da plataforma CITA-COOP.
// Todas são cobertas por testes unitários em tests/calc.test.js.

/** Distância em km entre dois pontos (fórmula de haversine). */
export function distanciaKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const rad = (g) => (g * Math.PI) / 180
  const dLat = rad(lat2 - lat1)
  const dLon = rad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

/** Limita um valor ao intervalo [0, 1]. */
export const limitar01 = (x) => Math.max(0, Math.min(1, Number.isFinite(x) ? x : 0))

// ---------------------------------------------------------------- ICPP
export const COMPONENTES_ICPP = [
  { id: 'cadastro', nome: 'Cadastro', rotulo: 'CAF ativos', descricao: 'CAF ativos ÷ estabelecimentos familiares', fonte: 'MDA, IBGE' },
  { id: 'credito', nome: 'Crédito', rotulo: 'Contratos Pronaf', descricao: 'Contratos Pronaf ÷ estabelecimentos familiares', fonte: 'BCB (SICOR)' },
  { id: 'ater', nome: 'ATER', rotulo: 'Famílias atendidas por ATER', descricao: 'Famílias atendidas ÷ estabelecimentos familiares', fonte: 'ANATER, Emater' },
  { id: 'pnae', nome: 'PNAE', rotulo: '% das compras do PNAE na agricultura familiar', descricao: '% das compras ÷ meta legal', fonte: 'FNDE', percentual: true },
  { id: 'paa', nome: 'PAA', rotulo: 'Agricultores fornecedores do PAA', descricao: 'Fornecedores ÷ estabelecimentos familiares', fonte: 'MDS, Conab' },
  { id: 'protecao', nome: 'Proteção', rotulo: 'Adesões a Garantia-Safra e SEAF', descricao: 'Adesões ÷ estabelecimentos familiares', fonte: 'MDA' },
]

/**
 * Normaliza os componentes do ICPP para o intervalo 0–1.
 * `valores` traz os numeradores; `estabFamiliares` é o denominador comum (Censo Agro).
 * O PNAE é informado em % e normalizado pela meta legal (`metaPnae`, padrão 30).
 */
export function componentesIcpp(valores, estabFamiliares, metaPnae = 30) {
  const out = {}
  for (const c of COMPONENTES_ICPP) {
    const v = Number(valores?.[c.id]) || 0
    if (c.percentual) out[c.id] = limitar01(v / metaPnae)
    else out[c.id] = estabFamiliares > 0 ? limitar01(v / estabFamiliares) : 0
  }
  return out
}

/** ICPP = média ponderada dos componentes normalizados (0–1). */
export function icpp(componentes, pesos) {
  let soma = 0
  let somaPesos = 0
  for (const c of COMPONENTES_ICPP) {
    const w = Math.max(0, Number(pesos?.[c.id] ?? 1))
    soma += w * limitar01(componentes?.[c.id] ?? 0)
    somaPesos += w
  }
  return somaPesos > 0 ? soma / somaPesos : 0
}

export function faixaIcpp(v) {
  if (v >= 0.7) return { rotulo: 'Cobertura alta', nivel: 'bom' }
  if (v >= 0.4) return { rotulo: 'Cobertura média', nivel: 'atencao' }
  return { rotulo: 'Cobertura baixa', nivel: 'critico' }
}

/** Cooperativas por 10 mil estabelecimentos familiares. */
export function densidadeCooperativa(cooperativas, estabFamiliares) {
  return estabFamiliares > 0 ? (cooperativas / estabFamiliares) * 10000 : 0
}

/** Município é "vazio de atendimento" quando tem muitos estabelecimentos familiares e nenhuma cooperativa agropecuária ativa. */
export function ehVazio(coopAgro, estabFamiliares, minimo = 500) {
  return coopAgro === 0 && estabFamiliares >= minimo
}

// ---------------------------------------------------------------- IMGC
export const DIMENSOES_IMGC = [
  { id: 'governanca', nome: 'Governança', perguntas: [
    'A Assembleia Geral Ordinária foi realizada no prazo legal no último exercício?',
    'Os conselhos de administração e fiscal se reúnem com regularidade e registram atas?',
    'Estatuto e regimento interno estão atualizados e são conhecidos pelos cooperados?' ] },
  { id: 'financas', nome: 'Finanças', perguntas: [
    'A cooperativa mantém fluxo de caixa atualizado e projetado?',
    'Os custos por produto ou serviço são conhecidos e acompanhados?',
    'O endividamento e o capital de giro são monitorados pela diretoria?' ] },
  { id: 'contabilidade', nome: 'Contabilidade', perguntas: [
    'A escrituração contábil está em dia e segue a norma das cooperativas (ITG 2004)?',
    'Fundo de Reserva e FATES são constituídos e controlados?',
    'As demonstrações são apresentadas aos cooperados de forma compreensível?' ] },
  { id: 'conformidade', nome: 'Conformidade legal e fiscal', perguntas: [
    'As certidões negativas (federal, FGTS e trabalhista) estão válidas?',
    'As obrigações acessórias fiscais são entregues no prazo?',
    'CNPJ e CAF da cooperativa estão ativos e regulares?' ] },
  { id: 'comercializacao', nome: 'Comercialização', perguntas: [
    'A cooperativa vende por mais de um canal (mercados, feiras, indústria, governo)?',
    'Participa de chamadas públicas do PNAE ou do PAA?',
    'Os preços são formados com base em custos e pesquisa de mercado?' ] },
  { id: 'pessoas', nome: 'Pessoas', perguntas: [
    'Há equipe administrativa com funções definidas?',
    'Dirigentes e conselheiros recebem capacitação periódica?',
    'Existe ação para atrair jovens e preparar a sucessão?' ] },
  { id: 'producao', nome: 'Produção', perguntas: [
    'A oferta dos cooperados é planejada (calendário e volumes)?',
    'Há controle de qualidade e padronização dos produtos?',
    'A cooperativa agrega valor (beneficiamento, agroindústria, marca própria)?' ] },
]

export const ESCALA_IMGC = ['Não existe', 'Inicial', 'Parcial', 'Implantado', 'Consolidado'] // 0 a 4

/**
 * Pontuação do IMGC. `respostas` = { governanca: [0..4, 0..4, 0..4], ... }.
 * Retorna a nota de cada dimensão e a nota geral em escala 0–100.
 * Perguntas sem resposta não entram na média; `completo` indica se todas foram respondidas.
 */
export function pontuarImgc(respostas) {
  const dimensoes = {}
  let soma = 0
  let n = 0
  let respondidas = 0
  let total = 0
  for (const d of DIMENSOES_IMGC) {
    const r = (respostas?.[d.id] || []).slice(0, d.perguntas.length)
    const validas = r.filter((x) => Number.isInteger(x) && x >= 0 && x <= 4)
    total += d.perguntas.length
    respondidas += validas.length
    if (validas.length) {
      const nota = (validas.reduce((a, b) => a + b, 0) / (validas.length * 4)) * 100
      dimensoes[d.id] = Math.round(nota * 10) / 10
      soma += nota
      n += 1
    } else dimensoes[d.id] = null
  }
  const geral = n ? Math.round((soma / n) * 10) / 10 : null
  return { dimensoes, geral, completo: respondidas === total, respondidas, total }
}

export function nivelImgc(nota) {
  if (nota == null) return { rotulo: 'Sem diagnóstico', nivel: 'neutro' }
  if (nota >= 75) return { rotulo: 'Consolidada', nivel: 'bom' }
  if (nota >= 50) return { rotulo: 'Em desenvolvimento', nivel: 'atencao' }
  if (nota >= 25) return { rotulo: 'Inicial', nivel: 'serio' }
  return { rotulo: 'Crítica', nivel: 'critico' }
}

// ---------------------------------------------------------------- Conformidade
/** Situação de um documento pela data de validade (AAAA-MM-DD). */
export function statusDocumento(validade, hoje = new Date(), diasAlerta = 30) {
  if (!validade) return { nivel: 'neutro', rotulo: 'Não informado', dias: null }
  const v = new Date(validade + 'T00:00:00')
  const h = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  const dias = Math.round((v - h) / 86400000)
  if (dias < 0) return { nivel: 'critico', rotulo: `Vencido há ${-dias} dia${dias === -1 ? '' : 's'}`, dias }
  if (dias <= diasAlerta) return { nivel: 'atencao', rotulo: dias === 0 ? 'Vence hoje' : `Vence em ${dias} dia${dias === 1 ? '' : 's'}`, dias }
  return { nivel: 'bom', rotulo: 'Em dia', dias }
}

/** Resumo do semáforo: pior situação entre os documentos. */
export function semaforoGeral(lista) {
  const ordem = { critico: 3, atencao: 2, neutro: 1, bom: 0 }
  let pior = 'bom'
  for (const s of lista) if (ordem[s.nivel] > ordem[pior]) pior = s.nivel
  return pior
}

// ---------------------------------------------------------------- Financeiro
/**
 * Indicadores financeiros básicos de uma cooperativa.
 * Destinação das sobras conforme a Lei 5.764/71, art. 28:
 * mínimo de 10% para o Fundo de Reserva e 5% para o FATES.
 */
export function indicadoresFinanceiros(d) {
  const n = (x) => Number(x) || 0
  const ativoCirc = n(d.ativoCirculante), passivoCirc = n(d.passivoCirculante)
  const ativoTotal = n(d.ativoTotal), passivoTotal = n(d.passivoTotal)
  const receita = n(d.receita), custos = n(d.custos), despesas = n(d.despesas)
  const sobras = receita - custos - despesas
  const pReserva = Math.max(10, n(d.pctReserva) || 10)
  const pFates = Math.max(5, n(d.pctFates) || 5)
  const reserva = sobras > 0 ? (sobras * pReserva) / 100 : 0
  const fates = sobras > 0 ? (sobras * pFates) / 100 : 0
  return {
    liquidezCorrente: passivoCirc > 0 ? ativoCirc / passivoCirc : null,
    endividamento: ativoTotal > 0 ? passivoTotal / ativoTotal : null,
    margem: receita > 0 ? sobras / receita : null,
    capitalGiro: ativoCirc - passivoCirc,
    sobras,
    fundoReserva: reserva,
    fates,
    sobrasADisposicao: sobras > 0 ? sobras - reserva - fates : 0,
  }
}

// ---------------------------------------------------------------- Demandas
export const TEMAS_DEMANDA = [
  { id: 'clima', nome: 'Clima e produção', termos: ['seca', 'estiagem', 'chuva', 'geada', 'granizo', 'praga', 'doenca', 'lavoura', 'safra', 'irrigacao', 'veranico'] },
  { id: 'credito', nome: 'Crédito e financiamento', termos: ['credito', 'pronaf', 'financiamento', 'banco', 'emprestimo', 'divida', 'renegocia'] },
  { id: 'mercado', nome: 'Comercialização e mercados', termos: ['venda', 'vender', 'mercado', 'pnae', 'paa', 'chamada publica', 'preco', 'comprador', 'merenda', 'escoamento'] },
  { id: 'documentos', nome: 'Documentação e regularidade', termos: ['caf', 'dap', 'certidao', 'cnpj', 'documento', 'nota fiscal', 'licenca', 'alvara', 'inspecao', 'selo'] },
  { id: 'ater', nome: 'Assistência técnica', termos: ['tecnico', 'assistencia', 'ater', 'emater', 'orientacao', 'visita', 'capacitacao', 'curso'] },
  { id: 'infra', nome: 'Infraestrutura e logística', termos: ['estrada', 'transporte', 'energia', 'internet', 'armazem', 'caminhao', 'frete', 'agua', 'maquina', 'equipamento'] },
  { id: 'gestao', nome: 'Gestão da cooperativa', termos: ['gestao', 'contabil', 'contador', 'assembleia', 'estatuto', 'ata', 'conselho', 'caixa', 'custos'] },
]

export const semAcento = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/**
 * Classificação automática de uma demanda por regras de palavras-chave.
 * (No protótipo TRL 4 a classificação é por regras; o uso de modelo de linguagem é etapa posterior.)
 */
export function classificarDemanda(texto) {
  const t = semAcento(texto)
  let melhor = null
  for (const tema of TEMAS_DEMANDA) {
    const achados = tema.termos.filter((k) => t.includes(k))
    if (achados.length && (!melhor || achados.length > melhor.achados.length)) melhor = { tema, achados }
  }
  const urgente = /(urgente|urgencia|emergencia|perd(a|emos|i) total|sem agua|imediat)/.test(t)
  return {
    tema: melhor ? melhor.tema.id : 'outros',
    nomeTema: melhor ? melhor.tema.nome : 'Outros assuntos',
    termos: melhor ? melhor.achados : [],
    prioridade: urgente ? 'alta' : 'normal',
  }
}

// ---------------------------------------------------------------- Sala de situação
/**
 * Avalia regras de alerta sobre observações de territórios.
 * regra = { id, nome, condicoes: [{ campo, op: '<'|'>'|'<='|'>=', valor }], nivel }
 * Uma regra dispara quando TODAS as condições são verdadeiras.
 */
export function avaliarAlertas(observacoes, regras) {
  const ops = { '<': (a, b) => a < b, '>': (a, b) => a > b, '<=': (a, b) => a <= b, '>=': (a, b) => a >= b }
  const alertas = []
  for (const o of observacoes) {
    for (const r of regras) {
      if (r.ativa === false) continue
      const ok = r.condicoes.every((c) => ops[c.op]?.(Number(o[c.campo]), Number(c.valor)))
      if (ok) alertas.push({ territorio: o.territorio, regra: r.id, nome: r.nome, nivel: r.nivel, observacao: o })
    }
  }
  const peso = { critico: 0, serio: 1, atencao: 2 }
  return alertas.sort((a, b) => (peso[a.nivel] ?? 9) - (peso[b.nivel] ?? 9))
}

// ---------------------------------------------------------------- Formatação
export const fmtInt = (n) => (n == null ? '—' : Math.round(n).toLocaleString('pt-BR'))
export const fmtDec = (n, d = 1) => (n == null ? '—' : Number(n).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }))
export const fmtPct = (n, d = 1) => (n == null ? '—' : fmtDec(n * 100, d) + '%')
export const fmtMoeda = (n) => (n == null ? '—' : Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))
export const fmtCnpj = (c) => String(c || '').replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
export const fmtCep = (c) => String(c || '').replace(/^(\d{5})(\d{3})$/, '$1-$2')

/** Converte nomes em MAIÚSCULAS (padrão da Receita) para leitura mais confortável. */
export function tituloNome(s) {
  const minus = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'a', 'o', 'para', 'com'])
  const siglas = new Set(['ltda', 'sa', 's/a', 'me', 'epp'])
  return String(s || '').toLowerCase().split(/\s+/).map((p, i) => {
    if (i > 0 && minus.has(p)) return p
    if (siglas.has(p)) return p.toUpperCase()
    return p.charAt(0).toUpperCase() + p.slice(1)
  }).join(' ')
}
