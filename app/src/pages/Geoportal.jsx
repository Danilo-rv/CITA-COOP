import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import { Cabecalho, Cartao, Icone, Origem, Modal, Carregando, Aviso } from '../components/ui.jsx'
import { useDados, carregar, M, C, UFS, somaRamos } from '../lib/dados.js'
import { fmtInt, fmtDec, fmtCnpj, fmtCep, tituloNome, semAcento, densidadeCooperativa, ehVazio } from '../lib/calc.js'

/** Raio do círculo em pixels: cresce com a raiz do valor e acompanha o zoom do mapa. */
export function raioBolha(camada, v, zoom) {
  const k = Math.max(0.8, Math.min(3.2, Math.pow(1.32, zoom - 4)))
  const base = camada === 'coops' ? 1.3 + Math.sqrt(v) * 0.8 : 1.2 + Math.sqrt(v) / 8
  return Math.min(46, base * k)
}

const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim()

function useTemaVersao() {
  const [v, setV] = useState(0)
  useEffect(() => {
    const o = new MutationObserver(() => setV((x) => x + 1))
    o.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-contraste'] })
    return () => o.disconnect()
  }, [])
  return v
}

export default function Geoportal() {
  const { dados: municipios, erro } = useDados('municipios.json')
  const { dados: malha } = useDados('uf.geojson')
  const { dados: resumo } = useDados('resumo.json')
  const { dados: cnaes } = useDados('cnaes.json')
  const [camada, setCamada] = useState('coops')
  const [uf, setUf] = useState('')
  const [ramo, setRamo] = useState(-1)
  const [minimo, setMinimo] = useState(500)
  const [base, setBase] = useState(false)
  const [sel, setSel] = useState(null) // código do município
  const [ficha, setFicha] = useState(null)
  const [lista, setLista] = useState(null)
  const [zoom, setZoom] = useState(4.25)
  const temaV = useTemaVersao()

  const elMapa = useRef(null)
  const mapa = useRef(null)
  const camadas = useRef({})

  const porCodigo = useMemo(() => new Map((municipios || []).map((m) => [m[M.cod], m])), [municipios])

  // pontos visíveis conforme camada e filtros
  const pontos = useMemo(() => {
    if (!municipios) return []
    const out = []
    for (const m of municipios) {
      if (uf && m[M.uf] !== uf) continue
      if (camada === 'coops') {
        const n = somaRamos(m, ramo)
        if (n > 0) out.push({ m, valor: n })
      } else if (ehVazio(m[M.ramos][0], m[M.familiar], minimo)) out.push({ m, valor: m[M.familiar] })
    }
    return out.sort((a, b) => b.valor - a.valor)
  }, [municipios, camada, uf, ramo, minimo])

  const totalVisivel = useMemo(() => pontos.reduce((s, p) => s + p.valor, 0), [pontos])

  // cria o mapa uma vez
  useEffect(() => {
    if (!elMapa.current || mapa.current) return
    const mp = L.map(elMapa.current, { zoomControl: true, minZoom: 3, maxZoom: 12, zoomSnap: 0.25, attributionControl: true, preferCanvas: true })
    mp.attributionControl.setPrefix(false).addAttribution('Malhas: IBGE · Cooperativas: Receita Federal')
    mp.createPane('bolhas').style.zIndex = 450
    mp.fitBounds([[-33.8, -73.9], [5.3, -34.8]])
    mp.on('zoomend', () => setZoom(mp.getZoom()))
    mapa.current = mp
    window.__mapaCita = mp
    return () => { mp.remove(); mapa.current = null }
  }, [municipios])

  // mapa base opcional (precisa de internet)
  useEffect(() => {
    const mp = mapa.current; if (!mp) return
    if (base && !camadas.current.base) {
      camadas.current.base = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 12, attribution: '© OpenStreetMap' }).addTo(mp)
    } else if (!base && camadas.current.base) { mp.removeLayer(camadas.current.base); camadas.current.base = null }
  }, [base, municipios])

  // contorno das UFs
  useEffect(() => {
    const mp = mapa.current; if (!mp || !malha) return
    if (camadas.current.uf) mp.removeLayer(camadas.current.uf)
    camadas.current.uf = L.geoJSON(malha, {
      interactive: false,
      style: (f) => ({ color: cssVar('--texto-3'), weight: uf && f.properties.uf === uf ? 1.8 : 0.7, opacity: 0.7, fillColor: cssVar('--superficie'), fillOpacity: base ? 0 : uf && f.properties.uf !== uf ? 0.35 : 1 }),
    }).addTo(mp)
    camadas.current.uf.bringToBack()
    if (uf) {
      const alvo = camadas.current.uf.getLayers().find((l) => l.feature.properties.uf === uf)
      if (alvo) mp.fitBounds(alvo.getBounds(), { padding: [20, 20] })
    } else mp.fitBounds([[-33.8, -73.9], [5.3, -34.8]])
  }, [malha, uf, base, temaV, municipios])

  // bolhas
  useEffect(() => {
    const mp = mapa.current; if (!mp) return
    if (camadas.current.bolhas) mp.removeLayer(camadas.current.bolhas)
    const cor = cssVar(camada === 'coops' ? '--serie-1' : '--serie-2')
    const borda = cssVar('--superficie')
    const render = L.canvas({ pane: 'bolhas', padding: 0.3 })
    const grupo = L.layerGroup()
    const raio = (v) => raioBolha(camada, v, zoom)
    for (const p of pontos) {
      const m = p.m
      const marcado = sel === m[M.cod]
      L.circleMarker([m[M.lat], m[M.lon]], {
        renderer: render, pane: 'bolhas', radius: raio(p.valor) + (marcado ? 2 : 0),
        color: marcado ? cssVar('--texto') : borda, weight: marcado ? 2.5 : 0.6, fillColor: cor, fillOpacity: marcado ? 0.95 : 0.58,
      })
        .bindTooltip(`<b>${m[M.nome]} – ${m[M.uf]}</b><br>${camada === 'coops' ? `${fmtInt(p.valor)} cooperativa${p.valor > 1 ? 's' : ''} ativa${p.valor > 1 ? 's' : ''}` : `${fmtInt(p.valor)} estabelecimentos familiares, nenhuma cooperativa agropecuária`}`, { direction: 'top', offset: [0, -4] })
        .on('click', () => setSel(m[M.cod]))
        .addTo(grupo)
    }
    grupo.addTo(mp)
    camadas.current.bolhas = grupo
  }, [pontos, camada, sel, temaV, zoom])

  // lista de cooperativas do município selecionado
  const mSel = sel ? porCodigo.get(sel) : null
  useEffect(() => {
    if (!mSel) { setLista(null); return }
    let vivo = true
    setLista(null)
    carregar(`coops/${mSel[M.uf]}.json`).then((todas) => vivo && setLista(todas.filter((c) => c[C.cod] === mSel[M.cod]))).catch(() => vivo && setLista([]))
    return () => { vivo = false }
  }, [mSel])

  const irPara = (cod, cnpj) => {
    const m = porCodigo.get(cod); if (!m) return
    setCamada('coops'); setRamo(-1); setSel(cod)
    mapa.current?.setView([m[M.lat], m[M.lon]], 8)
    if (cnpj) carregar(`coops/${m[M.uf]}.json`).then((todas) => { const c = todas.find((x) => x[C.cnpj] === cnpj); if (c) setFicha(c) })
  }

  if (!municipios) return <Carregando erro={erro} />
  const ramos = resumo?.ramos || []
  const listaFiltrada = lista && (camada === 'coops' && ramo >= 0 ? lista.filter((c) => c[C.ramo] === ramo) : lista)

  return (
    <>
      <Cabecalho sobre="Território" titulo="Geoportal das cooperativas" acoes={<Busca aoEscolher={irPara} porCodigo={porCodigo} />}>
        Mapa nacional das cooperativas ativas. Cada círculo é um município; o tamanho indica a quantidade. Clique em um círculo para ver a lista e a ficha de cada cooperativa.
      </Cabecalho>

      <div className="cartao" style={{ marginBottom: 16, padding: 14 }}>
        <div className="grade gform" style={{ alignItems: 'end' }}>
          <label className="campo">Camada
            <select value={camada} onChange={(e) => { setCamada(e.target.value); setSel(null) }} data-teste="camada">
              <option value="coops">Cooperativas ativas</option>
              <option value="vazios">Vazios de atendimento</option>
            </select>
          </label>
          <label className="campo">Estado
            <select value={uf} onChange={(e) => { setUf(e.target.value); setSel(null) }} data-teste="uf">
              <option value="">Brasil inteiro</option>
              {UFS.map((u) => <option key={u}>{u}</option>)}
            </select>
          </label>
          {camada === 'coops' ? (
            <label className="campo">Ramo (estimado pelo CNAE)
              <select value={ramo} onChange={(e) => setRamo(Number(e.target.value))} data-teste="ramo">
                <option value={-1}>Todos os ramos</option>
                {ramos.map((r, i) => <option key={r} value={i}>{r}</option>)}
              </select>
            </label>
          ) : (
            <label className="campo">Mínimo de estabelecimentos familiares: {fmtInt(minimo)}
              <input type="range" min="100" max="3000" step="100" value={minimo} onChange={(e) => setMinimo(Number(e.target.value))} />
            </label>
          )}
          <label className="linha" style={{ fontSize: '.84rem', color: 'var(--texto-2)', minHeight: 38 }}>
            <input type="checkbox" checked={base} onChange={(e) => setBase(e.target.checked)} /> Mapa de ruas (OpenStreetMap)
          </label>
        </div>
      </div>

      <div className="mapa-layout">
        <div className="mapa-caixa">
          <div ref={elMapa} role="application" aria-label="Mapa interativo do Brasil com as cooperativas por município" data-teste="mapa" />
          <div className="mapa-legenda" style={{ '--cor-bolha': camada === 'coops' ? 'var(--serie-1)' : 'var(--serie-2)' }}>
            <b>{camada === 'coops' ? 'Cooperativas ativas por município' : 'Municípios sem cooperativa agropecuária'}</b>
            <div className="bolhas">
              {(camada === 'coops' ? [1, 50, 400] : [500, 2000, 8000]).map((v) => { const d = Math.round(raioBolha(camada, v, zoom) * 2); return (
                <span key={v}><i style={{ width: d, height: d }} />{fmtInt(v)}</span>) }
              )}
            </div>
            <div style={{ marginTop: 6 }}>Posição: sede do município.</div>
          </div>
        </div>

        <Cartao className="painel-lado" data-teste="painel">
          {!mSel ? (
            <>
              <div className="linha" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
                <h2>{uf || 'Brasil'}</h2><Origem />
              </div>
              <div className="grade" style={{ gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <div><div className="indicador"><span className="rot">{camada === 'coops' ? 'Cooperativas' : 'Estab. familiares'}</span><span className="val num" style={{ fontSize: '1.5rem' }} data-teste="total-visivel">{fmtInt(totalVisivel)}</span></div></div>
                <div><div className="indicador"><span className="rot">Municípios</span><span className="val num" style={{ fontSize: '1.5rem' }}>{fmtInt(pontos.length)}</span></div></div>
              </div>
              <h3 style={{ marginBottom: 6 }}>{camada === 'coops' ? 'Municípios com mais cooperativas' : 'Maiores vazios de atendimento'}</h3>
              {camada === 'vazios' && <p className="sub" style={{ color: 'var(--texto-3)', fontSize: '.8rem', marginBottom: 8 }}>Municípios com pelo menos {fmtInt(minimo)} estabelecimentos da agricultura familiar e nenhuma cooperativa de ramo agropecuário ativa com sede no local.</p>}
              <ul className="lista-coop">
                {pontos.slice(0, 12).map((p) => (
                  <li key={p.m[M.cod]}><button onClick={() => { setSel(p.m[M.cod]); mapa.current?.setView([p.m[M.lat], p.m[M.lon]], 8) }}>
                    <b>{p.m[M.nome]} – {p.m[M.uf]}</b><span>{fmtInt(p.valor)} {camada === 'coops' ? 'cooperativas ativas' : 'estabelecimentos familiares'}</span>
                  </button></li>
                ))}
              </ul>
              {pontos.length === 0 && <div className="vazio">Nenhum município atende a esses filtros.</div>}
            </>
          ) : (
            <>
              <button className="botao sutil" style={{ marginLeft: -10, marginBottom: 6 }} onClick={() => setSel(null)}>← Voltar ao resumo</button>
              <div className="linha" style={{ justifyContent: 'space-between' }}>
                <h2 data-teste="municipio-nome">{mSel[M.nome]} – {mSel[M.uf]}</h2><Origem />
              </div>
              <dl className="def" style={{ gridTemplateColumns: '1fr auto', marginBottom: 14 }}>
                <dt>Cooperativas ativas</dt><dd className="num">{fmtInt(somaRamos(mSel))}</dd>
                <dt>do ramo agropecuário</dt><dd className="num">{fmtInt(mSel[M.ramos][0])}</dd>
                <dt>Estabelecimentos familiares</dt><dd className="num">{fmtInt(mSel[M.familiar])}</dd>
                <dt>Coop. agro por 10 mil estab. familiares</dt><dd className="num">{mSel[M.familiar] ? fmtDec(densidadeCooperativa(mSel[M.ramos][0], mSel[M.familiar])) : '—'}</dd>
              </dl>
              <h3 style={{ marginBottom: 4 }}>Cooperativas {ramo >= 0 && camada === 'coops' ? `· ${ramos[ramo]}` : ''}</h3>
              {!listaFiltrada ? <Carregando /> : listaFiltrada.length === 0 ? <div className="vazio">Nenhuma cooperativa ativa com sede neste município.</div> : (
                <ul className="lista-coop" data-teste="lista-coops">
                  {listaFiltrada.map((c) => (
                    <li key={c[C.cnpj]}><button onClick={() => setFicha(c)}>
                      <b>{tituloNome(c[C.fantasia] || c[C.razao])}</b>
                      <span>{ramos[c[C.ramo]]} · {c[C.tipo] === 1 ? 'Matriz' : 'Filial'}{c[C.inicio] ? ` · desde ${c[C.inicio]}` : ''}</span>
                    </button></li>
                  ))}
                </ul>
              )}
            </>
          )}
        </Cartao>
      </div>

      <div style={{ marginTop: 16 }}>
        <Aviso>
          <b>Como ler este mapa.</b> A base reúne todas as cooperativas ativas do CNPJ (natureza jurídica 214-3), de todos os ramos. O recorte específico da agricultura familiar depende do cadastro CAF Jurídico (MDA). A posição de cada cooperativa é a sede do seu município; a localização por endereço é a próxima etapa.
        </Aviso>
      </div>

      {ficha && <FichaCooperativa c={ficha} ramos={ramos} cnaes={cnaes} municipio={porCodigo.get(ficha[C.cod])} aoFechar={() => setFicha(null)} />}
    </>
  )
}

function FichaCooperativa({ c, ramos, cnaes, municipio, aoFechar }) {
  return (
    <Modal titulo={tituloNome(c[C.razao])} aoFechar={aoFechar}>
      <div className="linha" style={{ marginTop: 10 }}>
        <Origem>Receita Federal · CNPJ</Origem>
        <span className="etiqueta">{ramos[c[C.ramo]]}</span>
        <span className="etiqueta bom"><i className="ponto bom" />Ativa</span>
      </div>
      <dl className="def" data-teste="ficha">
        <dt>CNPJ</dt><dd className="num">{fmtCnpj(c[C.cnpj])}</dd>
        {c[C.fantasia] && <><dt>Nome fantasia</dt><dd>{tituloNome(c[C.fantasia])}</dd></>}
        <dt>Tipo</dt><dd>{c[C.tipo] === 1 ? 'Matriz' : 'Filial'}</dd>
        <dt>Início da atividade</dt><dd>{c[C.inicio] || '—'}</dd>
        <dt>Atividade principal</dt><dd>{cnaes?.[c[C.cnae]] || '—'} <span style={{ color: 'var(--texto-3)' }}>(CNAE {c[C.cnae]})</span></dd>
        <dt>Endereço</dt><dd>{tituloNome(c[C.endereco])}{c[C.bairro] ? `, ${tituloNome(c[C.bairro])}` : ''}</dd>
        <dt>Município</dt><dd>{municipio ? `${municipio[M.nome]} – ${municipio[M.uf]}` : '—'}</dd>
        <dt>CEP</dt><dd className="num">{fmtCep(c[C.cep]) || '—'}</dd>
        <dt>Precisão no mapa</dt><dd>Sede do município</dd>
      </dl>
      <div style={{ marginTop: 16 }}>
        <Aviso>Campos como área de abrangência, número de cooperados, ATER disponível e políticas acessadas serão preenchidos quando houver convênio com as fontes (CAF/MDA, ANATER) ou cadastro pela própria cooperativa.</Aviso>
      </div>
    </Modal>
  )
}

function Busca({ aoEscolher, porCodigo }) {
  const [q, setQ] = useState('')
  const [indice, setIndice] = useState(null)
  const [aberto, setAberto] = useState(false)
  const caixa = useRef(null)
  useEffect(() => { if (q.trim().length >= 3 && !indice) carregar('busca.json').then(setIndice).catch(() => setIndice([])) }, [q, indice])
  useEffect(() => {
    const fora = (e) => { if (!caixa.current?.contains(e.target)) setAberto(false) }
    document.addEventListener('mousedown', fora)
    return () => document.removeEventListener('mousedown', fora)
  }, [])
  const achados = useMemo(() => {
    const t = semAcento(q.trim())
    if (t.length < 3 || !indice) return []
    const digitos = t.replace(/\D/g, '')
    const termos = t.split(/\s+/).filter(Boolean)
    const out = []
    for (const r of indice) {
      const nome = r[1].toLowerCase()
      if ((digitos.length >= 5 && r[0].includes(digitos)) || termos.every((p) => nome.includes(p))) { out.push(r); if (out.length >= 12) break }
    }
    return out
  }, [q, indice])
  return (
    <div className="busca" ref={caixa}>
      <Icone nome="busca" tamanho={17} />
      <input className="entrada" type="search" placeholder="Buscar por nome ou CNPJ" aria-label="Buscar cooperativa por nome ou CNPJ" value={q}
        onChange={(e) => { setQ(e.target.value); setAberto(true) }} onFocus={() => setAberto(true)} accessKey="3" data-teste="busca" />
      {aberto && q.trim().length >= 3 && (
        <div className="resultados" role="listbox" data-teste="resultados-busca">
          {!indice ? <div className="vazio" style={{ padding: 14 }}>Carregando índice…</div> : achados.length === 0 ? <div className="vazio" style={{ padding: 14 }}>Nenhuma cooperativa encontrada.</div> : achados.map((r) => {
            const m = porCodigo.get(r[3])
            return (
              <button key={r[0]} role="option" onClick={() => { aoEscolher(r[3], r[0]); setAberto(false) }}>
                {tituloNome(r[1])}<span>{m ? `${m[M.nome]} – ${m[M.uf]}` : r[2]} · {fmtCnpj(r[0])}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
