// Testes de ponta a ponta (navegador real, Chromium headless) — evidência de validação em laboratório (TRL 4).
// Pré-requisito: `npm run build && npm run preview` (servidor em http://localhost:4173).
const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const { chromium } = require('playwright')

const BASE = process.env.CITA_URL || 'http://localhost:4173'
let navegador, ctx, p
const erros = []

async function abrir(rota) {
  const url = `${BASE}/#${rota}`
  if (p.url() === url) await p.reload({ waitUntil: 'networkidle' }) // mesma tela: recarrega para começar do estado inicial
  else await p.goto(url, { waitUntil: 'networkidle' })
  await p.waitForSelector('h1')
}
const texto = (sel) => p.locator(sel).first().innerText()
const numero = async (sel) => Number((await texto(sel)).replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, ''))

before(async () => {
  navegador = await chromium.launch()
  ctx = await navegador.newContext({ viewport: { width: 1366, height: 850 }, locale: 'pt-BR' })
  p = await ctx.newPage()
  p.on('pageerror', (e) => erros.push(e.message))
})
after(async () => { await navegador.close() })

const ROTAS = [
  ['/', 'Dados do território'], ['/geoportal', 'Geoportal das cooperativas'], ['/sala-de-situacao', 'Sala de Situação'],
  ['/politicas-publicas', 'Políticas Públicas'], ['/demandas', 'Demandas'], ['/ater-virtual', 'ATER Virtual'], ['/mercados', 'Mercados'],
  ['/gestao', 'Gestão Cooperativa'], ['/formacao', 'Formação'], ['/observatorio', 'Observatório'], ['/resultados', 'Resultados'],
  ['/administracao', 'Administração'], ['/ajuda', 'Ajuda e acessibilidade'],
]

test('RF-01 todas as 13 telas abrem com título e sem erro de execução', async () => {
  for (const [rota, titulo] of ROTAS) {
    await abrir(rota)
    assert.match(await texto('h1'), new RegExp(titulo), `título da rota ${rota}`)
  }
  assert.deepEqual(erros, [])
})

test('RF-02 Início mostra os números reais da base nacional', async () => {
  await abrir('/')
  const resumo = await (await p.request.get(`${BASE}/dados/resumo.json`)).json()
  const corpo = await texto('main')
  assert.ok(corpo.includes(resumo.ativas.toLocaleString('pt-BR')), 'total de cooperativas ativas')
  assert.ok(corpo.includes(resumo.municipios_com_cooperativa.toLocaleString('pt-BR')), 'municípios com cooperativa')
  assert.ok(resumo.ativas > 38000)
})

test('RF-03 Geoportal desenha o mapa e filtra por estado e por ramo', async () => {
  await abrir('/geoportal')
  await p.waitForSelector('[data-teste=mapa] canvas')
  const resumo = await (await p.request.get(`${BASE}/dados/resumo.json`)).json()
  assert.equal(await numero('[data-teste=total-visivel]'), resumo.ativas)
  await p.selectOption('[data-teste=uf]', 'GO')
  assert.equal(await numero('[data-teste=total-visivel]'), resumo.por_uf.GO)
  await p.selectOption('[data-teste=ramo]', '0')
  const agroGO = await numero('[data-teste=total-visivel]')
  assert.ok(agroGO > 0 && agroGO < resumo.por_uf.GO, 'filtro de ramo reduz o total')
})

test('RF-04 Geoportal abre a lista do município e a ficha da cooperativa', async () => {
  await abrir('/geoportal')
  await p.locator('[data-teste=painel] .lista-coop button').first().click()
  assert.match(await texto('[data-teste=municipio-nome]'), /São Paulo – SP/)
  await p.waitForSelector('[data-teste=lista-coops] button')
  await p.locator('[data-teste=lista-coops] button').first().click()
  const ficha = await texto('[data-teste=ficha]')
  assert.match(ficha, /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/, 'CNPJ formatado na ficha')
  assert.match(ficha, /São Paulo – SP/)
  await p.keyboard.press('Escape')
  assert.equal(await p.locator('[role=dialog]').count(), 0, 'Esc fecha a ficha')
})

test('RF-05 Busca por nome encontra cooperativa e leva à ficha', async () => {
  await abrir('/geoportal')
  await p.fill('[data-teste=busca]', 'cooperativa agropecuaria')
  await p.waitForSelector('[data-teste=resultados-busca] button')
  assert.ok((await p.locator('[data-teste=resultados-busca] button').count()) > 0)
  await p.locator('[data-teste=resultados-busca] button').first().click()
  await p.waitForSelector('[data-teste=ficha]')
  assert.match(await texto('[role=dialog] h2'), /agropecu/i)
  await p.keyboard.press('Escape')
})

test('RF-06 Camada de vazios de atendimento responde ao limite mínimo', async () => {
  await abrir('/politicas-publicas')
  await p.getByRole('tab', { name: 'Vazios de atendimento' }).click()
  const com1000 = await numero('[data-teste=n-vazios]')
  await p.locator('[data-teste=minimo]').fill('3000')
  const com3000 = await numero('[data-teste=n-vazios]')
  assert.ok(com1000 > 0 && com3000 < com1000, `vazios: ${com1000} (≥1000) > ${com3000} (≥3000)`)
})

test('RF-07 Calculadora do ICPP usa o denominador do Censo e calcula a média ponderada', async () => {
  await abrir('/politicas-publicas')
  await p.getByRole('tab', { name: 'Calculadora do ICPP' }).click()
  await p.fill('[data-teste=icpp-municipio]', 'Rio Verde')
  await p.getByRole('button', { name: 'Rio Verde – GO', exact: true }).click()
  const den = await numero('[data-teste=icpp-denominador]')
  assert.ok(den > 0)
  const v = { cadastro: Math.round(den * 0.5), credito: Math.round(den * 0.25), ater: 0, pnae: 15, paa: 0, protecao: 0 }
  for (const [k, x] of Object.entries(v)) await p.fill(`[data-teste=icpp-${k}]`, String(x))
  const esperado = (v.cadastro / den + v.credito / den + 0.5) / 6
  assert.ok(Math.abs((await numero('[data-teste=icpp-valor]')) - esperado) < 0.006, 'ICPP conforme a fórmula')
})

test('RF-08 Demandas: registra, classifica o tema, move no quadro e persiste', async () => {
  await abrir('/demandas')
  await p.fill('[data-teste=demanda-titulo]', 'Teste automatizado de seca')
  await p.fill('[data-teste=demanda-texto]', 'Estamos com seca e a lavoura de milho foi perdida. Urgente.')
  assert.match(await texto('[data-teste=previa-classificacao]'), /Clima e produção/)
  assert.match(await texto('[data-teste=previa-classificacao]'), /prioridade alta/)
  await p.getByRole('button', { name: 'Registrar' }).click()
  assert.match(await texto('[data-etapa=classificada]'), /Teste automatizado de seca/)
  await p.getByRole('button', { name: /Avançar "Teste automatizado de seca"/ }).click()
  assert.match(await texto('[data-etapa=encaminhada]'), /Teste automatizado de seca/)
  await p.reload({ waitUntil: 'networkidle' })
  assert.match(await texto('[data-etapa=encaminhada]'), /Teste automatizado de seca/, 'continua após recarregar')
})

test('RF-09 ATER Virtual responde com fonte e encaminha o que não sabe', async () => {
  await abrir('/ater-virtual')
  await p.fill('[data-teste=ater-entrada]', 'Qual o prazo da assembleia?')
  await p.keyboard.press('Enter')
  assert.match(await texto('[data-teste=mensagens]'), /três primeiros meses/)
  assert.match(await texto('[data-teste=mensagens]'), /Lei 5\.764/)
  await p.fill('[data-teste=ater-entrada]', 'Como trato carrapato em bezerro?')
  await p.keyboard.press('Enter')
  assert.match(await texto('[data-teste=fila]'), /carrapato/)
})

test('RF-10 Mercados lista cooperativas reais por raio de distância', async () => {
  await abrir('/mercados')
  await p.waitForSelector('[data-teste=tabela-proximas] tbody tr')
  const r100 = await numero('[data-teste=mercados-total]')
  await p.locator('[data-teste=mercados-raio]').fill('300')
  await p.waitForFunction((a) => Number(document.querySelector('[data-teste=mercados-total]').innerText.replace(/\D/g, '')) > a, r100)
  assert.ok(r100 > 0 && (await numero('[data-teste=mercados-total]')) > r100)
  assert.match(await texto('[data-teste=tabela-proximas] tbody tr'), /no município|km/)
})

test('RF-11 Gestão: IMGC pontua e o financeiro aplica os fundos legais', async () => {
  await abrir('/gestao')
  assert.equal(await texto('[data-teste=imgc-nota]'), '—')
  await p.getByRole('button', { name: 'Exemplo' }).click()
  const nota = await numero('[data-teste=imgc-nota]')
  assert.ok(nota > 0 && nota <= 100)
  await p.getByRole('tab', { name: 'Financeiro' }).click()
  for (const [k, x] of Object.entries({ receita: 1000000, custos: 700000, despesas: 200000, ativoCirculante: 200000, passivoCirculante: 100000 })) await p.fill(`[data-teste=fin-${k}]`, String(x))
  assert.match(await texto('[data-teste=fin-sobras]'), /100\.000,00/)
  assert.match(await texto('[data-teste=fin-reserva]'), /10\.000,00/)
  assert.match(await texto('[data-teste=fin-fates]'), /5\.000,00/)
  assert.equal(await texto('[data-teste=fin-liquidez]'), '2,00')
})

test('RF-12 Regularidade: semáforo muda com a data de validade', async () => {
  await abrir('/gestao')
  await p.getByRole('tab', { name: 'Regularidade' }).click()
  const dia = (d) => { const x = new Date(); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10) }
  await p.fill('[data-teste=doc-fgts]', dia(-5))
  await p.fill('[data-teste=doc-federal]', dia(10))
  await p.fill('[data-teste=doc-caf]', dia(200))
  const t = await texto('[data-teste=tabela-docs]')
  assert.match(t, /Vencido há 5 dias/); assert.match(t, /Vence em 10 dias/); assert.match(t, /Em dia/)
})

test('RF-13 Observatório: demografia, downloads e catálogo de dados', async () => {
  await abrir('/observatorio')
  await p.waitForSelector('[data-teste=tabela-demografia] tbody tr')
  assert.equal(await p.locator('[data-teste=tabela-demografia] tbody tr').count(), 27, '27 UFs')
  await p.getByRole('tab', { name: 'Dados abertos' }).click()
  const href = await p.locator('a[download]').first().getAttribute('href')
  const r = await p.request.get(new URL(href, BASE + '/').toString())
  assert.equal(r.status(), 200); assert.ok((await r.body()).length > 1e6, 'arquivo de dados abertos disponível')
  await p.getByRole('tab', { name: 'Catálogo de dados' }).click()
  assert.match(await texto('[data-teste=catalogo]'), /Linhagem/)
})

test('RNF-01 Acessibilidade: VLibras, idioma, atalho, tamanho de texto, contraste e tema', async () => {
  await abrir('/')
  assert.equal(await p.getAttribute('html', 'lang'), 'pt-BR')
  assert.equal(await p.locator('[vw] [vw-access-button]').count(), 1, 'marcação do VLibras presente')
  assert.equal(await p.locator('script[src*="vlibras.gov.br"]').count(), 1, 'script oficial do VLibras')
  assert.equal(await p.locator('a.pular').count(), 1, 'atalho para pular ao conteúdo')
  await p.getByRole('button', { name: 'Aumentar o tamanho do texto' }).click()
  assert.equal(await p.getAttribute('html', 'data-fonte'), '1')
  await p.getByRole('button', { name: 'Diminuir o tamanho do texto' }).click()
  await p.getByRole('button', { name: 'Alto contraste' }).click()
  assert.equal(await p.getAttribute('html', 'data-contraste'), 'alto')
  assert.equal(await p.evaluate(() => getComputedStyle(document.body).backgroundColor), 'rgb(0, 0, 0)')
  await p.getByRole('button', { name: 'Alto contraste' }).click()
  await p.getByRole('button', { name: 'Usar tema escuro' }).click()
  assert.equal(await p.getAttribute('html', 'data-theme'), 'dark')
  await p.getByRole('button', { name: 'Usar tema claro' }).click()
  const semNome = await p.evaluate(() => [...document.querySelectorAll('main button, .topo button, main input, main select')].filter((e) => !(e.innerText || e.getAttribute('aria-label') || e.labels?.length || e.getAttribute('placeholder'))).length)
  assert.equal(semNome, 0, 'todos os controles têm nome acessível')
})

test('RNF-02 Navegação só com teclado chega ao conteúdo', async () => {
  await abrir('/')
  await p.keyboard.press('Tab')
  assert.equal(await p.evaluate(() => document.activeElement.className), 'pular')
  await p.keyboard.press('Enter')
  assert.equal(await p.evaluate(() => document.activeElement.id), 'conteudo')
})

test('RNF-03 Menu muda conforme o perfil', async () => {
  await abrir('/')
  await p.selectOption('.topo select', 'centro')
  assert.ok((await texto('#menu')).includes('Administração'))
  await p.selectOption('.topo select', 'publico')
  const menu = await texto('#menu')
  assert.ok(!menu.includes('Administração') && !menu.includes('Demandas') && menu.includes('Geoportal'))
  await p.selectOption('.topo select', 'centro')
})

test('RNF-04 Layout responsivo em celular (390 px) sem rolagem horizontal', async () => {
  const cel = await ctx.newPage()
  await cel.setViewportSize({ width: 390, height: 800 })
  for (const rota of ['/', '/geoportal', '/demandas', '/gestao', '/observatorio']) {
    await cel.goto(`${BASE}/#${rota}`, { waitUntil: 'networkidle' })
    const sobra = await cel.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    assert.ok(sobra <= 1, `rota ${rota} sem rolagem horizontal (sobra ${sobra}px)`)
  }
  await cel.getByRole('button', { name: 'Abrir menu' }).click()
  assert.ok(await cel.locator('.lateral.aberta').isVisible())
  await cel.close()
})

test('RNF-05 Desempenho: mapa nacional pronto em menos de 5 s', async () => {
  const t0 = Date.now()
  await p.goto(`${BASE}/#/geoportal`, { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('[data-teste=mapa] canvas')
  await p.waitForSelector('[data-teste=total-visivel]')
  const ms = Date.now() - t0
  console.log(`    tempo até o mapa: ${ms} ms`)
  assert.ok(ms < 5000)
})

test('RD-01 Integridade dos dados publicados', async () => {
  const j = async (n) => (await p.request.get(`${BASE}/dados/${n}`)).json()
  const [resumo, mun, uf] = [await j('resumo.json'), await j('municipios.json'), await j('uf.geojson')]
  assert.equal(mun.length, 5572, '5.572 municípios')
  assert.equal(uf.features.length, 27, '27 UFs na malha')
  const soma = mun.reduce((s, m) => s + m[5].reduce((a, b) => a + b, 0), 0)
  assert.equal(soma, resumo.ativas, 'soma por município = total nacional')
  assert.equal(Object.values(resumo.por_uf).reduce((a, b) => a + b, 0), resumo.ativas, 'soma por UF = total nacional')
  assert.equal(resumo.por_ramo.reduce((a, b) => a + b, 0), resumo.ativas, 'soma por ramo = total nacional')
  assert.ok(mun.every((m) => m[3] > -34 && m[3] < 5.5 && m[4] > -74.5 && m[4] < -28), 'coordenadas dentro do Brasil')
  const go = await j('coops/GO.json')
  assert.equal(go.length, resumo.por_uf.GO)
  assert.ok(go.every((c) => /^\d{14}$/.test(c[0]) && c[6].startsWith('52')), 'CNPJ com 14 dígitos e município de Goiás')
  assert.equal(mun.reduce((s, m) => s + m[7], 0), resumo.estab_familiares_brasil)
})
