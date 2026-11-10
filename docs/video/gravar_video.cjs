// Grava o vídeo de apresentação (cerca de 1 minuto) navegando pela plataforma real.
// Uso: node docs/video/gravar_video.cjs   (plataforma servida em http://localhost:4173; requer ffmpeg)
const { chromium } = require('playwright')
const { execSync } = require('child_process')
const fs = require('fs'), path = require('path')
const BASE = process.env.CITA_URL || 'http://localhost:4173'
const BRUTO = path.join(__dirname, 'bruto')
const W = 1280, H = 720

const SOBREPOSICAO = () => {
  const monta = () => {
    if (document.getElementById('__video')) return
    const st = document.createElement('style')
    st.textContent = `
      #__leg{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:2147483646;background:rgba(9,20,40,.92);color:#fff;font:600 21px/1.3 'Inter Variable',Inter,system-ui,sans-serif;padding:13px 26px;border-radius:14px;box-shadow:0 10px 40px rgba(0,0,0,.35);opacity:0;transition:opacity .35s;max-width:1060px;text-align:center;pointer-events:none;border:1px solid rgba(255,255,255,.14)}
      #__leg b{color:#6ee7c1}
      #__cur{position:fixed;left:0;top:0;width:22px;height:22px;border-radius:50%;background:rgba(214,51,108,.85);border:2.5px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.35);z-index:2147483647;pointer-events:none;transform:translate(-50%,-50%);transition:width .12s,height .12s}
      #__cur.clique{width:34px;height:34px}
      #__capa{position:fixed;inset:0;z-index:2147483645;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;color:#fff;text-align:center;background:radial-gradient(900px 420px at 80% 0%,rgba(62,224,176,.38),transparent 60%),linear-gradient(140deg,#0b2a5e,#0f62d6 75%);transition:opacity .6s;font-family:'Space Grotesk Variable','Inter Variable',system-ui,sans-serif}
      #__capa .m{font-size:64px;font-weight:700;letter-spacing:-.02em}
      #__capa .s{font:500 25px/1.35 'Inter Variable',system-ui,sans-serif;max-width:860px;color:rgba(255,255,255,.9)}
      #__capa .t{font:650 14px 'Inter Variable',system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#9fe8d0}`
    const g = document.createElement('div'); g.id = '__video'
    g.innerHTML = `<div id="__capa"><div class="t"></div><div class="m"></div><div class="s"></div></div><div id="__leg"></div><div id="__cur"></div>`
    document.documentElement.append(st, g)
    document.addEventListener('mousemove', (e) => { const c = document.getElementById('__cur'); c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px' }, true)
    document.addEventListener('mousedown', () => { const c = document.getElementById('__cur'); c.classList.add('clique'); setTimeout(() => c.classList.remove('clique'), 180) }, true)
  }
  if (document.documentElement) monta(); document.addEventListener('DOMContentLoaded', monta)
}

;(async () => {
  fs.rmSync(BRUTO, { recursive: true, force: true })
  const b = await chromium.launch({ args: ['--lang=pt-BR'] })
  const ctx = await b.newContext({ viewport: { width: W, height: H }, locale: 'pt-BR', recordVideo: { dir: BRUTO, size: { width: W, height: H } } })
  // O quadro 3D do intérprete do VLibras não é capturado pela gravação de vídeo do navegador.
  // Por isso a cena de acessibilidade mostra uma captura de tela real da plataforma com o VLibras aberto.
  const aq = await ctx.newPage()
  await aq.goto(BASE + '/#/ajuda', { waitUntil: 'networkidle' })
  await aq.evaluate(() => window.VLibrasWidget?.open?.()); await aq.waitForTimeout(18000)
  const fotoVlibras = (await aq.screenshot({ type: 'jpeg', quality: 90 })).toString('base64')
  const videoAq = await aq.video().path(); await aq.close(); fs.rmSync(videoAq, { force: true })
  await ctx.addInitScript(() => { try { localStorage.removeItem('@vlibras-widget') } catch {} })
  await ctx.addInitScript(SOBREPOSICAO)
  const tPagina = Date.now()
  const p = await ctx.newPage()
  const espera = (ms) => p.waitForTimeout(ms)
  const capa = (t, m, s) => p.evaluate(([t, m, s]) => { const c = document.getElementById('__capa'); c.querySelector('.t').textContent = t; c.querySelector('.m').textContent = m; c.querySelector('.s').textContent = s; c.style.display = 'flex'; requestAnimationFrame(() => (c.style.opacity = 1)) }, [t, m, s])
  const semCapa = async () => { await p.evaluate(() => { document.getElementById('__capa').style.opacity = 0 }); await espera(600); await p.evaluate(() => { document.getElementById('__capa').style.display = 'none' }) }
  const leg = (html) => p.evaluate((h) => { const l = document.getElementById('__leg'); l.innerHTML = h; l.style.opacity = h ? 1 : 0 }, html)
  let mx = W / 2, my = H / 2
  const mover = async (x, y, passos = 22) => { await p.mouse.move(x, y, { steps: passos }); mx = x; my = y }
  const ate = async (loc, passos) => { const r = await loc.first().boundingBox(); if (r) await mover(r.x + r.width / 2, r.y + r.height / 2, passos); return r }
  const clicar = async (loc) => { await ate(loc); await espera(160); await p.mouse.down(); await p.mouse.up() }
  const menu = (nome) => clicar(p.locator('#menu a', { hasText: nome }))
  const t0 = Date.now(); const marca = (n) => console.log(n.padEnd(16), ((Date.now() - t0) / 1000).toFixed(1) + 's')

  // 0 — abertura
  await p.goto(BASE + '/#/', { waitUntil: 'networkidle' })
  await capa('Centro de Inteligência Territorial Analítica em Cooperativas', 'CITA-COOP', 'Dados do território transformados em decisão.')
  const corte = (Date.now() - tPagina) / 1000 + 0.25 // tempo em branco antes da abertura, cortado do vídeo final
  await p.mouse.move(mx, my); await espera(3600); await semCapa(); marca('abertura')

  // 1 — início
  await leg('<b>38.658 cooperativas ativas</b> de todo o Brasil, em um só lugar')
  await ate(p.locator('.conteudo .g4 .cartao').nth(0), 30); await espera(700)
  await ate(p.locator('.conteudo .g4 .cartao').nth(2), 30); await espera(700)
  await p.mouse.wheel(0, 330); await espera(1500); await p.mouse.wheel(0, -330); await espera(400); marca('inicio')

  // 2 — geoportal
  await menu('Geoportal'); await p.waitForSelector('[data-teste=mapa] canvas'); await espera(900)
  await leg('<b>Geoportal:</b> o mapa nacional das cooperativas, por município')
  await mover(640, 400, 30); await espera(1100)
  await ate(p.locator('[data-teste=uf]')); await espera(250); await p.selectOption('[data-teste=uf]', 'GO'); await espera(1300)
  await leg('Filtre por <b>estado</b> e <b>ramo</b> e abra a ficha de cada cooperativa')
  await clicar(p.locator('[data-teste=painel] .lista-coop button').nth(1)); await p.waitForSelector('[data-teste=lista-coops] button'); await espera(1500)
  await clicar(p.locator('[data-teste=lista-coops] button').first()); await espera(2000)
  await p.keyboard.press('Escape'); await espera(300); marca('geoportal')

  // 3 — vazios
  await ate(p.locator('[data-teste=camada]')); await p.selectOption('[data-teste=camada]', 'vazios'); await p.selectOption('[data-teste=uf]', ''); await espera(600)
  await leg('<b>Vazios de atendimento:</b> onde há agricultura familiar e nenhuma cooperativa agropecuária')
  await mover(600, 330, 30); await espera(1600); await mover(700, 430, 30); await espera(1900); marca('vazios')

  // 4 — ICPP
  await menu('Políticas Públicas'); await espera(700)
  await leg('<b>Políticas Públicas:</b> meça a cobertura das políticas em cada município (ICPP)')
  await clicar(p.getByRole('tab', { name: 'Calculadora do ICPP' })); await espera(400)
  await clicar(p.locator('[data-teste=icpp-municipio]')); await p.keyboard.type('Rio Verde', { delay: 55 }); await espera(300)
  await clicar(p.getByRole('button', { name: 'Rio Verde – GO', exact: true })); await espera(400)
  await clicar(p.getByRole('button', { name: 'Preencher com valores de exemplo' })); await espera(700)
  await ate(p.locator('[data-teste=icpp-valor]'), 26); await espera(1900); marca('icpp')

  // 5 — demandas
  await menu('Demandas'); await espera(600)
  await leg('<b>Demandas:</b> registre uma necessidade e o tema é identificado na hora')
  await clicar(p.locator('[data-teste=demanda-titulo]')); await p.keyboard.type('Seca atingiu a lavoura', { delay: 32 })
  await clicar(p.locator('[data-teste=demanda-texto]')); await p.keyboard.type('Estamos com seca há 30 dias e a lavoura de milho foi perdida. Urgente.', { delay: 24 })
  await espera(500); await ate(p.locator('[data-teste=previa-classificacao]'), 20); await espera(2000); marca('demandas')

  // 6 — gestão
  await menu('Gestão Cooperativa'); await espera(600)
  await leg('<b>Gestão Cooperativa:</b> diagnóstico em 7 dimensões, documentos e finanças')
  await clicar(p.getByRole('button', { name: 'Exemplo' })); await espera(500); await p.mouse.wheel(0, 240); await espera(1500)
  await mover(930, 380, 26); await espera(1800); marca('gestao')

  // 7 — observatório
  await menu('Observatório'); await p.waitForSelector('.grafico svg'); await espera(500)
  await leg('<b>Observatório:</b> análises e dados abertos para pesquisa')
  await p.mouse.wheel(0, 260); await espera(700)
  const g = await p.locator('.grafico svg').first().boundingBox()
  await mover(g.x + g.width * 0.25, g.y + g.height * 0.5, 20); await mover(g.x + g.width * 0.8, g.y + g.height * 0.5, 70); await espera(700); marca('observatorio')

  // 8 — acessibilidade
  await menu('Ajuda e acessibilidade'); await espera(500)
  await leg('<b>Acessível a todos:</b> Libras com o VLibras (gov.br), alto contraste e uso por teclado')
  await ate(p.locator('#vlibras-button')).catch(() => {}); await espera(500)
  await p.evaluate((b64) => {
    const i = document.createElement('img'); i.id = '__foto'; i.src = 'data:image/jpeg;base64,' + b64
    i.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;object-fit:cover;z-index:2147483640;opacity:0;transition:opacity .35s'
    document.documentElement.append(i); requestAnimationFrame(() => (i.style.opacity = 1))
  }, fotoVlibras)
  await espera(4300)
  await p.evaluate(() => document.getElementById('__foto')?.remove())
  await clicar(p.getByRole('button', { name: 'Alto contraste' })); await espera(2000)
  await clicar(p.getByRole('button', { name: 'Alto contraste' })); await espera(700); marca('acessibilidade')

  // 9 — encerramento
  await leg('')
  await capa('Protótipo validado em laboratório · TRL 4', 'CITA-COOP', 'Inteligência territorial para as cooperativas, a agricultura familiar e a gestão pública.')
  await espera(3600); marca('fim')

  const video = await p.video().path()
  await ctx.close(); await b.close()
  const dur = Number(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${video}"`).toString().trim()) - corte
  const fator = Math.min(1, 60 / dur) // se passar de 60 s, acelera levemente para fechar em 1 minuto
  const saida = path.join(__dirname, 'CITA-COOP_apresentacao.mp4')
  execSync(`ffmpeg -y -loglevel error -ss ${corte.toFixed(2)} -i "${video}" -vf "setpts=${fator.toFixed(4)}*PTS,fps=30,format=yuv420p" -c:v libx264 -preset slow -crf 20 -movflags +faststart -an "${saida}"`)
  fs.rmSync(BRUTO, { recursive: true, force: true })
  console.log(`bruto ${dur.toFixed(1)}s · fator ${fator.toFixed(3)} · ${saida} · ${(fs.statSync(saida).size / 1e6).toFixed(1)} MB`)
})()
