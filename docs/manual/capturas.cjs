// Gera as capturas de tela anotadas usadas no manual e no dossiê de TRL.
// Uso: node docs/manual/capturas.cjs   (com a plataforma servida em http://localhost:4173)
const { chromium, devices } = require('playwright')
const path = require('path')
const BASE = process.env.CITA_URL || 'http://localhost:4173'
const IMG = path.join(__dirname, 'img')

async function marcar(p, marcas) {
  await p.evaluate((ms) => {
    document.querySelectorAll('.__marca').forEach((e) => e.remove())
    for (const m of ms) {
      const el = typeof m.sel === 'string' ? document.querySelector(m.sel) : null
      if (!el) continue
      const r = el.getBoundingClientRect()
      const cx = document.createElement('div')
      cx.className = '__marca'
      cx.style.cssText = `position:fixed;left:${r.left - 5}px;top:${r.top - 5}px;width:${r.width + 10}px;height:${r.height + 10}px;border:2.5px solid #d6336c;border-radius:12px;z-index:99998;pointer-events:none;box-shadow:0 0 0 3px rgba(214,51,108,.18)`
      const n = document.createElement('div')
      n.className = '__marca'
      n.textContent = m.n
      const px = m.pos === 'dir' ? r.right - 8 : r.left - 16, py = m.pos === 'baixo' ? r.bottom - 10 : r.top - 16
      n.style.cssText = `position:fixed;left:${Math.max(4, px)}px;top:${Math.max(4, py)}px;width:30px;height:30px;border-radius:50%;background:#d6336c;color:#fff;font:700 15px/30px Inter,system-ui,sans-serif;text-align:center;z-index:99999;box-shadow:0 2px 8px rgba(0,0,0,.3);pointer-events:none`
      document.body.append(cx, n)
    }
  }, marcas)
}

;(async () => {
  const b = await chromium.launch({ args: ['--lang=pt-BR'], env: { ...process.env, LANGUAGE: 'pt_BR', LANG: 'pt_BR.UTF-8' } })
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2, locale: 'pt-BR' })
  const p = await ctx.newPage()
  const ir = async (rota) => { await p.goto(`${BASE}/#${rota}`, { waitUntil: 'networkidle' }); await p.evaluate(() => document.querySelectorAll('.__marca').forEach((e) => e.remove())); await p.waitForTimeout(700) }
  const foto = async (nome, marcas = []) => { await marcar(p, marcas); await p.screenshot({ path: path.join(IMG, nome + '.jpg'), type: 'jpeg', quality: 88 }); await marcar(p, []); console.log('ok', nome) }
  const aba = (nome) => p.getByRole('tab', { name: nome }).click()

  await ir('/'); await p.waitForSelector('#vlibras-button', { state: 'attached', timeout: 15000 }).catch(() => {})
  await foto('01-inicio', [{ sel: '#menu', n: 1 }, { sel: '.seletor-perfil', n: 2 }, { sel: '.topo [role=group]', n: 3 }, { sel: '.conteudo .g4', n: 4 }, { sel: '#vlibras-access-wrapper', n: 5 }])

  await ir('/geoportal')
  await foto('02-geoportal', [{ sel: '.conteudo > .cartao', n: 1 }, { sel: '.mapa-caixa', n: 2 }, { sel: '[data-teste=painel]', n: 3 }, { sel: '.busca', n: 4 }, { sel: '.mapa-legenda', n: 5, pos: 'dir' }])
  await p.selectOption('[data-teste=uf]', 'GO'); await p.waitForTimeout(900)
  await p.locator('[data-teste=painel] .lista-coop button').nth(1).click(); await p.waitForSelector('[data-teste=lista-coops] button'); await p.waitForTimeout(900)
  await foto('03-geoportal-municipio', [{ sel: '[data-teste=uf]', n: 1 }, { sel: '[data-teste=municipio-nome]', n: 2, pos: 'dir' }, { sel: '[data-teste=lista-coops]', n: 3 }])
  await p.locator('[data-teste=lista-coops] button').first().click(); await p.waitForTimeout(500)
  await foto('04-ficha', [{ sel: '[data-teste=ficha]', n: 1 }])
  await p.keyboard.press('Escape')
  await ir('/geoportal'); await p.selectOption('[data-teste=camada]', 'vazios'); await p.waitForTimeout(900)
  await foto('05-geoportal-vazios', [{ sel: '[data-teste=camada]', n: 1 }, { sel: 'input[type=range]', n: 2 }, { sel: '[data-teste=painel]', n: 3 }])

  await ir('/sala-de-situacao')
  await foto('06-sala', [{ sel: '.conteudo .g4', n: 1 }, { sel: '[data-teste=alertas]', n: 2 }, { sel: '.conteudo .g2 > section:nth-child(2)', n: 3 }])

  await ir('/politicas-publicas'); await foto('07-politicas-presenca', [{ sel: '.abas', n: 1 }, { sel: '.conteudo .g3', n: 2 }, { sel: '[data-teste=tabela-uf]', n: 3 }])
  await aba('Vazios de atendimento'); await p.waitForTimeout(400)
  await foto('08-politicas-vazios', [{ sel: '[data-teste=minimo]', n: 1 }, { sel: '.conteudo .g3', n: 2 }, { sel: '.conteudo table', n: 3 }])
  await aba('Calculadora do ICPP'); await p.fill('[data-teste=icpp-municipio]', 'Rio Verde'); await p.getByRole('button', { name: 'Rio Verde – GO', exact: true }).click()
  await p.getByRole('button', { name: 'Preencher com valores de exemplo' }).click(); await p.waitForTimeout(400)
  await foto('09-politicas-icpp', [{ sel: '[data-teste=icpp-municipio]', n: 1 }, { sel: '[data-teste=icpp-cadastro]', n: 2 }, { sel: '[data-teste=icpp-valor]', n: 3, pos: 'dir' }])

  await ir('/demandas')
  await p.fill('[data-teste=demanda-titulo]', 'Estrada sem condição de escoar a produção')
  await p.fill('[data-teste=demanda-texto]', 'A estrada vicinal está intransitável e o caminhão não consegue buscar o leite dos cooperados.')
  await foto('10-demandas', [{ sel: '[data-teste=form-demanda]', n: 1 }, { sel: '[data-teste=previa-classificacao]', n: 2 }, { sel: '[data-teste=quadro]', n: 3 }])

  await ir('/ater-virtual'); await p.fill('[data-teste=ater-entrada]', 'Qual o prazo da assembleia?'); await p.keyboard.press('Enter')
  await p.fill('[data-teste=ater-entrada]', 'Como trato carrapato em bezerro?'); await p.keyboard.press('Enter'); await p.waitForTimeout(400)
  await foto('11-ater', [{ sel: '[data-teste=mensagens]', n: 1 }, { sel: '.sugestoes', n: 2 }, { sel: '[data-teste=fila]', n: 3 }])

  await ir('/mercados'); await p.waitForSelector('[data-teste=tabela-proximas] tbody tr')
  await foto('12-mercados', [{ sel: '[data-teste=mercados-municipio]', n: 1 }, { sel: '[data-teste=mercados-raio]', n: 2 }, { sel: '[data-teste=mercados-total]', n: 3, pos: 'dir' }, { sel: '.conteudo .g2 > section:nth-child(2)', n: 4 }])

  await ir('/gestao'); await p.fill('[data-teste=gestao-nome]', 'Cooperativa Exemplo do Vale'); await p.getByRole('button', { name: 'Exemplo' }).click(); await p.waitForTimeout(400)
  await foto('13-gestao-imgc', [{ sel: '.abas', n: 1 }, { sel: '.escala', n: 2 }, { sel: '[data-teste=imgc-nota]', n: 3, pos: 'dir' }])
  await aba('Regularidade'); await p.getByRole('button', { name: 'Exemplo' }).click(); await p.waitForTimeout(300)
  await foto('14-gestao-regularidade', [{ sel: '.conteudo .g3', n: 1 }, { sel: '[data-teste=tabela-docs]', n: 2 }])
  await aba('Financeiro'); await p.getByRole('button', { name: 'Exemplo' }).click(); await p.waitForTimeout(300)
  await foto('15-gestao-financeiro', [{ sel: '.conteudo .g2 > section', n: 1 }, { sel: '[data-teste=fin-sobras]', n: 2, pos: 'dir' }, { sel: '[data-teste=fin-reserva]', n: 3, pos: 'dir' }])

  await ir('/formacao'); await foto('16-formacao')
  await ir('/observatorio'); await p.waitForSelector('.grafico svg'); await foto('17-observatorio', [{ sel: '.abas', n: 1 }, { sel: '.conteudo .g4', n: 2 }, { sel: '.grafico', n: 3 }])
  await aba('Dados abertos'); await p.waitForTimeout(300); await foto('18-observatorio-dados', [{ sel: 'a[download]', n: 1 }])
  await aba('Catálogo de dados'); await p.waitForTimeout(300); await foto('19-observatorio-catalogo', [{ sel: '[data-teste=catalogo] section', n: 1 }])
  await ir('/administracao'); await foto('21-administracao', [{ sel: '[data-teste=tabela-fontes]', n: 1 }])

  await ir('/ajuda'); await p.locator('#vlibras-button').click().catch(() => {}); await p.waitForTimeout(15000)
  await foto('22-vlibras', [{ sel: '.topo [role=group]', n: 1 }, { sel: '[data-teste=lista-acessibilidade]', n: 2 }])
  // contexto limpo (sem registros locais nem VLibras aberto) para as telas abaixo
  const limpo = await b.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2, locale: 'pt-BR' })
  const q = await limpo.newPage()
  const fotoq = async (nome) => { await q.waitForTimeout(700); await q.screenshot({ path: path.join(IMG, nome + '.jpg'), type: 'jpeg', quality: 88 }); console.log('ok', nome) }
  await q.goto(`${BASE}/#/resultados`, { waitUntil: 'networkidle' }); await fotoq('20-resultados')
  await q.getByRole('button', { name: 'Alto contraste' }).click(); await q.goto(`${BASE}/#/geoportal`, { waitUntil: 'networkidle' }); await fotoq('23-alto-contraste')
  await q.getByRole('button', { name: 'Alto contraste' }).click(); await q.getByRole('button', { name: 'Usar tema escuro' }).click()
  await q.goto(`${BASE}/#/observatorio`, { waitUntil: 'networkidle' }); await fotoq('24-tema-escuro')

  const cel = await (await b.newContext({ ...devices['iPhone 13'], locale: 'pt-BR' })).newPage()
  await cel.goto(`${BASE}/#/`, { waitUntil: 'networkidle' }); await cel.waitForTimeout(600)
  await cel.screenshot({ path: path.join(IMG, '25-celular-inicio.jpg'), type: 'jpeg', quality: 88 })
  await cel.getByRole('button', { name: 'Abrir menu' }).click(); await cel.waitForTimeout(400)
  await cel.screenshot({ path: path.join(IMG, '26-celular-menu.jpg'), type: 'jpeg', quality: 88 })
  await b.close()
})()
