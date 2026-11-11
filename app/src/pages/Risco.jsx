import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import { Cabecalho, Cartao, Origem, Aviso, Abas, Modal, Carregando, Indicador, Icone } from '../components/ui.jsx'
import { Linhas, Dispersao } from '../components/charts.jsx'
import { useDados, carregar, M, UFS } from '../lib/dados.js'
import { useLocal } from '../lib/store.js'
import { cssVar, ehEscuro, useTemaVersao } from '../lib/tema.js'
import { fmtInt, fmtDec, semAcento, tituloNome } from '../lib/calc.js'
import { INDICADORES, INDICADOR_POR_ID, TEMAS, COMPONENTES_PRIORIDADE, limitesPorQuantil, classeDe, percentis, mediana, media, notaPrioridade, rampa, formatar, fmtReais } from '../lib/risco.js'

export default function Risco() {
  const { dados: risco, erro } = useDados('risco.json')
  const { dados: munis } = useDados('municipios.json')
  if (!risco || !munis) return <Carregando erro={erro} />
  return <Corpo risco={risco} munis={munis} />
}

/** Junta as camadas de risco com os dados de cooperativas (mesmo código de município do IBGE). */
function useBase(risco, munis) {
  return useMemo(() => {
    const n = risco.cod.length, porCod = new Map(munis.map((m) => [m[M.cod], m]))
    const nome = [], uf = [], lat = [], lon = [], ativas = [], agro = [], fam = [], agro10 = [], ramos = []
    for (let i = 0; i < n; i++) {
      const m = porCod.get(risco.cod[i])
      nome.push(m ? m[M.nome] : risco.cod[i]); uf.push(m ? m[M.uf] : ''); lat.push(m ? m[M.lat] : null); lon.push(m ? m[M.lon] : null)
      ativas.push(m ? m[M.ramos].reduce((a, b) => a + b, 0) : 0); agro.push(m ? m[M.ramos][0] : 0)
      fam.push(m && m[M.familiar] > 0 ? m[M.familiar] : null); ramos.push(m ? m[M.ramos] : [])
      agro10.push(m && m[M.familiar] > 0 ? (m[M.ramos][0] / m[M.familiar]) * 1e4 : null)
    }
    const col = { ...risco.col, coops_ativas: ativas, coops_agro: agro, coops_agro_10mil: agro10, estab_familiares: fam }
    return { n, cod: risco.cod, idx: new Map(risco.cod.map((c, i) => [c, i])), nome, uf, lat, lon, col, ramos }
  }, [risco, munis])
}

function Corpo({ risco, munis }) {
  const base = useBase(risco, munis)
  const [aba, setAba] = useState('mapa')
  const [ficha, setFicha] = useState(null)
  return (
    <>
      <Cabecalho sobre="Território" titulo="Risco Territorial" acoes={<Origem />}>
        Cruza o histórico de desastres, a vulnerabilidade social, a segurança hídrica, o solo, a população e a rede de rios de cada município com a presença de cooperativas.
      </Cabecalho>
      <Abas atual={aba} aoMudar={setAba} abas={[{ id: 'mapa', nome: 'Mapa' }, { id: 'prioridades', nome: 'Prioridades de apoio' }, { id: 'historico', nome: 'Histórico de desastres' }, { id: 'fontes', nome: 'Fontes e método' }]} />
      {aba === 'mapa' && <AbaMapa base={base} aoAbrirFicha={setFicha} />}
      {aba === 'prioridades' && <AbaPrioridades base={base} aoAbrirFicha={setFicha} />}
      {aba === 'historico' && <AbaHistorico base={base} risco={risco} />}
      {aba === 'fontes' && <AbaFontes risco={risco} />}
      {ficha != null && <Modal titulo={`${base.nome[ficha]} – ${base.uf[ficha]}`} aoFechar={() => setFicha(null)}><FichaMunicipio base={base} i={ficha} /></Modal>}
    </>
  )
}

// ------------------------------------------------------------------ estatísticas por indicador (com cache)
function useEstat(base) {
  const cache = useRef(new Map())
  return (id) => {
    if (!cache.current.has(id)) {
      const vals = base.col[INDICADOR_POR_ID[id].col]
      const validos = vals.filter((v) => v != null && Number.isFinite(v)).sort((a, b) => a - b)
      cache.current.set(id, { vals, validos, cortes: limitesPorQuantil(vals, 6), media: media(vals), mediana: mediana(vals) })
    }
    return cache.current.get(id)
  }
}
const postoNoBrasil = (st, v) => {            // percentil (0 a 100) de um valor entre todos os municípios com dado
  if (v == null || !st.validos.length) return null
  let lo = 0, hi = st.validos.length
  while (lo < hi) { const mid = (lo + hi) >> 1; if (st.validos[mid] < v) lo = mid + 1; else hi = mid }
  return (lo / st.validos.length) * 100
}

// ------------------------------------------------------------------ mapa
function AbaMapa({ base, aoAbrirFicha }) {
  const { dados: geo, erro: erroGeo } = useDados('risco_municipios.json')
  const estat = useEstat(base)
  const [indId, setIndId] = useState('des_recentes')
  const [uf, setUf] = useState('')
  const [sel, setSel] = useState(null)
  const [coops, setCoops] = useState(false)
  const [busca, setBusca] = useState('')
  const temaV = useTemaVersao()
  const el = useRef(null), mapa = useRef(null), poligonos = useRef([]), bolhas = useRef(null), camadaGeo = useRef(null)
  const ind = INDICADOR_POR_ID[indId], st = estat(indId)
  const cores = useMemo(() => rampa(st.cortes.length + 1, ehEscuro()), [st, temaV])

  useEffect(() => {   // mapa
    if (!el.current || mapa.current) return
    const mp = L.map(el.current, { minZoom: 3, maxZoom: 11, zoomSnap: 0.25, preferCanvas: true, attributionControl: true })
    mp.attributionControl.setPrefix(false).addAttribution('Malhas: IBGE 2022 · dados: veja Fontes e método')
    mp.fitBounds([[-33.8, -73.9], [5.3, -34.8]]); mapa.current = mp
    return () => { mp.remove(); mapa.current = null }
  }, [])

  useEffect(() => {   // contornos dos municípios
    const mp = mapa.current; if (!mp || !geo) return
    if (camadaGeo.current) mp.removeLayer(camadaGeo.current)
    poligonos.current = new Array(base.n).fill(null)
    camadaGeo.current = L.geoJSON(geo, {
      renderer: L.canvas({ padding: 0.3 }),
      onEachFeature: (f, layer) => {
        const i = base.idx.get(f.properties.c); if (i == null) return
        poligonos.current[i] = layer
        layer.on('click', () => setSel(i))
        layer.bindTooltip(() => { const v = base.col[ind.col]?.[i]; return `<b>${base.nome[i]} – ${base.uf[i]}</b><br>${ind.rotulo}: ${formatar(ind, v)}` }, { sticky: true })
      },
    }).addTo(mp)
    camadaGeo.current.bringToBack()
  }, [geo, base, ind])

  useEffect(() => {   // cores
    const vals = base.col[ind.col], sem = cssVar('--grade'), borda = cssVar('--superficie'), forte = cssVar('--texto')
    poligonos.current.forEach((p, i) => {
      if (!p) return
      const fora = uf && base.uf[i] !== uf, c = classeDe(vals[i], st.cortes), marcado = sel === i
      p.setStyle({ fillColor: c < 0 ? sem : cores[Math.min(c, cores.length - 1)], fillOpacity: fora ? 0.12 : c < 0 ? 0.55 : 0.92, color: marcado ? forte : borda, weight: marcado ? 2.4 : 0.25, opacity: fora ? 0.3 : 1 })
      if (marcado) p.bringToFront()
    })
  }, [geo, ind, st, cores, uf, sel, temaV, base])

  useEffect(() => {   // enquadra o estado escolhido
    const mp = mapa.current; if (!mp || !geo) return
    const grupo = uf ? poligonos.current.filter((p, i) => p && base.uf[i] === uf) : []
    if (grupo.length) mp.fitBounds(L.featureGroup(grupo).getBounds(), { padding: [16, 16] }); else if (!uf) mp.fitBounds([[-33.8, -73.9], [5.3, -34.8]])
  }, [uf, geo, base])

  useEffect(() => {   // cooperativas sobre o mapa
    const mp = mapa.current; if (!mp) return
    if (bolhas.current) { mp.removeLayer(bolhas.current); bolhas.current = null }
    if (!coops) return
    const g = L.layerGroup(), render = L.canvas({ padding: 0.3 })
    for (let i = 0; i < base.n; i++) {
      const n = base.col.coops_agro[i]; if (!n || (uf && base.uf[i] !== uf) || base.lat[i] == null) continue
      L.circleMarker([base.lat[i], base.lon[i]], { renderer: render, radius: Math.min(14, 2.5 + Math.sqrt(n) * 1.1), color: cssVar('--superficie'), weight: 1, fillColor: cssVar('--serie-2'), fillOpacity: 0.85, interactive: false }).addTo(g)
    }
    g.addTo(mp); bolhas.current = g
  }, [coops, uf, temaV, base])

  const resultados = useMemo(() => {
    const t = semAcento(busca.trim()); if (t.length < 2) return []
    const out = []; for (let i = 0; i < base.n && out.length < 8; i++) if (semAcento(base.nome[i]).includes(t) && (!uf || base.uf[i] === uf)) out.push(i)
    return out
  }, [busca, base, uf])
  const escolher = (i) => { setSel(i); setBusca(''); if (base.lat[i] != null) mapa.current?.setView([base.lat[i], base.lon[i]], 8) }

  const ranking = useMemo(() => {
    const vals = base.col[ind.col], lista = []
    for (let i = 0; i < base.n; i++) if (vals[i] != null && (!uf || base.uf[i] === uf)) lista.push(i)
    return lista.sort((a, b) => vals[b] - vals[a]).slice(0, 10)
  }, [base, ind, uf])
  const ufVals = uf ? base.col[ind.col].filter((v, i) => base.uf[i] === uf) : base.col[ind.col]
  const faixas = [st.validos[0], ...st.cortes, st.validos[st.validos.length - 1]]

  return (
    <>
      <div className="cartao" style={{ marginBottom: 16, padding: 14 }}>
        <div className="grade gform" style={{ alignItems: 'end' }}>
          <label className="campo" style={{ gridColumn: 'span 2' }}>Indicador
            <select value={indId} onChange={(e) => setIndId(e.target.value)} data-teste="risco-indicador">
              {TEMAS.map((t) => <optgroup key={t.id} label={t.nome}>{INDICADORES.filter((i) => i.tema === t.id).map((i) => <option key={i.id} value={i.id}>{i.rotulo}</option>)}</optgroup>)}
            </select>
          </label>
          <label className="campo">Estado
            <select value={uf} onChange={(e) => { setUf(e.target.value); setSel(null) }} data-teste="risco-uf"><option value="">Brasil inteiro</option>{UFS.map((u) => <option key={u}>{u}</option>)}</select>
          </label>
          <label className="campo" style={{ position: 'relative' }}>Buscar município
            <input className="entrada" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Digite o nome" data-teste="risco-busca" />
            {resultados.length > 0 && <div className="resultados" role="listbox">{resultados.map((i) => <button key={i} role="option" onClick={() => escolher(i)}>{base.nome[i]}<span>{base.uf[i]}</span></button>)}</div>}
          </label>
          <label className="linha" style={{ fontSize: '.84rem', color: 'var(--texto-2)', minHeight: 38 }}>
            <input type="checkbox" checked={coops} onChange={(e) => setCoops(e.target.checked)} data-teste="risco-coops" /> Mostrar cooperativas agropecuárias
          </label>
        </div>
      </div>

      <div className="mapa-layout">
        <div className="mapa-caixa">
          <div ref={el} role="application" aria-label={`Mapa do Brasil por município: ${ind.rotulo}`} data-teste="risco-mapa" />
          {!geo && <div className="vazio" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', zIndex: 600, pointerEvents: 'none' }}>{erroGeo ? 'Não foi possível carregar o mapa.' : 'Carregando contornos dos municípios…'}</div>}
          <div className="mapa-legenda" data-teste="risco-legenda">
            <b>{ind.rotulo}{ind.unidade && !ind.moeda ? ` (${ind.unidade})` : ''}</b>
            {cores.map((c, k) => (
              <div key={k} className="linha" style={{ gap: 7, flexWrap: 'nowrap', marginTop: 2 }}>
                <i style={{ width: 16, height: 11, background: c, display: 'block', borderRadius: 2, border: '1px solid var(--borda)' }} />
                <span className="num">{ind.moeda ? `${fmtReais(faixas[k])} a ${fmtReais(faixas[k + 1])}` : `${fmtDec(faixas[k], ind.dec ?? 0)} a ${fmtDec(faixas[k + 1], ind.dec ?? 0)}`}</span>
              </div>
            ))}
            <div className="linha" style={{ gap: 7, flexWrap: 'nowrap', marginTop: 2 }}><i style={{ width: 16, height: 11, background: 'var(--grade)', display: 'block', borderRadius: 2, border: '1px solid var(--borda)' }} /><span>Sem dado</span></div>
            {coops && <div className="linha" style={{ gap: 7, flexWrap: 'nowrap', marginTop: 4 }}><i style={{ width: 11, height: 11, background: 'var(--serie-2)', display: 'block', borderRadius: '50%' }} /><span>Cooperativas agropecuárias</span></div>}
          </div>
        </div>

        <Cartao className="painel-lado" data-teste="risco-painel">
          {sel == null ? (
            <>
              <h2>{ind.rotulo}</h2>
              {ind.ajuda && <p className="sub" style={{ marginTop: 4 }}>{ind.ajuda}</p>}
              <div className="grade" style={{ gridTemplateColumns: '1fr 1fr', gap: 10, margin: '12px 0 14px' }}>
                <div className="indicador"><span className="rot">Média {uf ? `em ${uf}` : 'nacional'}</span><span className="val num" style={{ fontSize: '1.3rem' }}>{formatar(ind, media(ufVals))}</span></div>
                <div className="indicador"><span className="rot">Mediana</span><span className="val num" style={{ fontSize: '1.3rem' }}>{formatar(ind, mediana(ufVals))}</span></div>
                <div className="indicador"><span className="rot">Municípios com dado</span><span className="val num" style={{ fontSize: '1.3rem' }} data-teste="risco-n-dado">{fmtInt(ufVals.filter((v) => v != null).length)}</span></div>
              </div>
              <h3 style={{ marginBottom: 6 }}>Maiores valores {uf ? `em ${uf}` : 'do país'}</h3>
              <ul className="lista-coop">
                {ranking.map((i) => <li key={i}><button onClick={() => escolher(i)}><b>{base.nome[i]} – {base.uf[i]}</b><span>{formatar(ind, base.col[ind.col][i])}</span></button></li>)}
              </ul>
              <p className="sub" style={{ marginTop: 10, marginBottom: 0 }}>Clique em um município no mapa para ver todos os indicadores dele.</p>
            </>
          ) : (
            <>
              <button className="botao sutil" style={{ marginLeft: -10, marginBottom: 6 }} onClick={() => setSel(null)}>← Voltar ao resumo</button>
              <FichaMunicipio base={base} i={sel} compacta />
              <div className="linha" style={{ marginTop: 10 }}><button className="botao" onClick={() => aoAbrirFicha(sel)}>Abrir ficha completa</button></div>
            </>
          )}
        </Cartao>
      </div>
      <div style={{ marginTop: 16 }}><Aviso>As cores seguem as classes de cada indicador, com o mesmo número de municípios em cada uma (quantis). Cores mais escuras indicam valores maiores, que podem ser bons ou ruins conforme o indicador: no ISH, por exemplo, valor alto é boa notícia; no IVS e nos desastres, não. Os mapas de solo, população e rios resumem pixels de 1 km por município.</Aviso></div>
    </>
  )
}

// ------------------------------------------------------------------ ficha de um município
function FichaMunicipio({ base, i, compacta = false }) {
  const estat = useEstat(base)
  const [lista, setLista] = useState(null)
  useEffect(() => {
    let vivo = true; setLista(null)
    carregar(`coops/${base.uf[i]}.json`).then((todas) => vivo && setLista(todas.filter((c) => c[6] === base.cod[i]))).catch(() => vivo && setLista([]))
    return () => { vivo = false }
  }, [base, i])
  const temas = compacta ? ['desastres', 'vulnerabilidade', 'hidrica', 'coops'] : TEMAS.map((t) => t.id)
  const pop = base.col.pop2020[i]
  return (
    <div data-teste="risco-ficha">
      <h2 data-teste="risco-ficha-nome">{base.nome[i]} – {base.uf[i]}</h2>
      <p className="sub" style={{ marginTop: 4 }}>{pop != null ? `${fmtInt(pop)} habitantes (GHSL, 2020) · ` : ''}{fmtDec(base.col.area_km2[i], 0)} km²</p>
      {temas.map((tid) => {
        const tema = TEMAS.find((t) => t.id === tid), inds = INDICADORES.filter((x) => x.tema === tid && (!compacta || ['des_recentes', 'des_seca', 'perda_agro', 'ivs2010', 'ish2017_geral', 'ish2035_geral', 'coops_agro', 'coops_agro_10mil', 'estab_familiares', 'coops_ativas'].includes(x.id)))
        return (
          <div key={tid} style={{ marginTop: 14 }}>
            <h3 style={{ fontSize: '.86rem', color: 'var(--texto-2)' }}>{tema.nome}</h3>
            <div className="pilha p" style={{ marginTop: 6, gap: 6 }}>
              {inds.map((ind) => {
                const v = base.col[ind.col][i], p = postoNoBrasil(estat(ind.id), v)
                return (
                  <div key={ind.id} title={ind.ajuda || ''} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2px 10px', fontSize: '.84rem' }}>
                    <span style={{ color: 'var(--texto-2)' }}>{ind.rotulo}</span><b className="num">{formatar(ind, v)}</b>
                    {p != null && <div className="barra-mini" style={{ gridColumn: '1 / -1', height: 4 }} role="img" aria-label={`Acima de ${fmtDec(p, 0)}% dos municípios`}><i style={{ width: `${p}%`, background: 'var(--serie-1)' }} /></div>}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
      <div style={{ marginTop: 14 }}>
        <h3 style={{ fontSize: '.86rem', color: 'var(--texto-2)' }}>Cooperativas com sede no município</h3>
        {!lista ? <p className="sub">Carregando…</p> : lista.length === 0 ? <p className="sub">Nenhuma cooperativa ativa com sede aqui.</p> : (
          <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: '.84rem', color: 'var(--texto-2)' }} data-teste="risco-ficha-coops">
            {lista.slice(0, compacta ? 5 : 12).map((c) => <li key={c[0]}>{tituloNome(c[2] || c[1])}</li>)}
            {lista.length > (compacta ? 5 : 12) && <li style={{ listStyle: 'none', marginLeft: -18 }}>e mais {lista.length - (compacta ? 5 : 12)}</li>}
          </ul>
        )}
      </div>
      <p className="sub" style={{ marginTop: 12, marginBottom: 0 }}>A barra mostra a posição do município entre os {fmtInt(base.n)} do país. Passe o mouse sobre um indicador para ver a explicação.</p>
    </div>
  )
}

// ------------------------------------------------------------------ prioridades de apoio
const PESOS_PADRAO = { des: 1, ivs: 1, hid: 1, coop: 1 }
function AbaPrioridades({ base, aoAbrirFicha }) {
  const [pesos, setPesos] = useLocal('risco:pesos', PESOS_PADRAO)
  const [uf, setUf] = useState('')
  const [minFam, setMinFam] = useState(300)
  const [semCoop, setSemCoop] = useState(false)
  const perc = useMemo(() => ({
    des: percentis(base.col.des_recentes), ivs: percentis(base.col.ivs2010),
    hid: percentis(base.col.ish2017_geral.map((v) => (v == null ? null : 6 - v))), coop: percentis(base.col.coops_agro_10mil.map((v) => (v == null ? null : -v))),
  }), [base])
  const linhas = useMemo(() => {
    const out = []
    for (let i = 0; i < base.n; i++) {
      if (uf && base.uf[i] !== uf) continue
      const fam = base.col.estab_familiares[i]; if (fam == null || fam < minFam) continue
      if (semCoop && base.col.coops_agro[i] > 0) continue
      const nota = notaPrioridade({ des: perc.des[i], ivs: perc.ivs[i], hid: perc.hid[i], coop: perc.coop[i] }, pesos)
      if (nota != null) out.push({ i, nota })
    }
    return out.sort((a, b) => b.nota - a.nota)
  }, [base, perc, pesos, uf, minFam, semCoop])
  const topo = linhas.slice(0, 50)
  const popTopo = linhas.slice(0, 100).reduce((s, l) => s + (base.col.pop2020[l.i] || 0), 0)
  const pontos = useMemo(() => {
    const p = []
    for (let i = 0; i < base.n; i++) {
      const x = base.col.ivs2010[i], y = base.col.des_recentes[i]
      if (x == null || y == null || (uf && base.uf[i] !== uf)) continue
      p.push({ i, x, y, g: base.col.coops_agro[i] > 0 ? 1 : 0, r: `${base.nome[i]} – ${base.uf[i]}` })
    }
    return p
  }, [base, uf])
  const baixar = () => {
    const cab = 'cod_ibge;municipio;uf;nota_prioridade;desastres_10_anos;ivs_2010;ish_2017;coop_agropecuarias;estab_familiares;populacao_2020'
    const txt = cab + '\n' + linhas.map(({ i, nota }) => [base.cod[i], base.nome[i], base.uf[i], nota.toFixed(1), base.col.des_recentes[i], base.col.ivs2010[i] ?? '', base.col.ish2017_geral[i] ?? '', base.col.coops_agro[i], base.col.estab_familiares[i], base.col.pop2020[i] ?? ''].join(';')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + txt], { type: 'text/csv' })); a.download = 'prioridades_de_apoio.csv'; a.click()
  }
  return (
    <div className="pilha">
      <Aviso>Esta lista é um <b>exercício de priorização</b>, não um índice oficial. Cada município recebe uma nota de 0 a 100, média das posições dele (percentis) em quatro critérios. Ajuste os pesos para refletir o que importa mais para a sua decisão. Os pesos oficiais devem ser definidos pelo comitê gestor.</Aviso>
      <div className="grade g2">
        <Cartao titulo="1. Pesos dos critérios" acoes={<button className="botao sutil" onClick={() => setPesos(PESOS_PADRAO)}>Restaurar</button>}>
          <div className="pilha p">
            {COMPONENTES_PRIORIDADE.map((c) => (
              <label className="campo" key={c.id}>{c.nome}: {pesos[c.id]}
                <input type="range" min="0" max="5" step="1" value={pesos[c.id]} onChange={(e) => setPesos({ ...pesos, [c.id]: Number(e.target.value) })} data-teste={`peso-${c.id}`} />
                <small>{c.ajuda}</small>
              </label>
            ))}
          </div>
        </Cartao>
        <Cartao titulo="2. Quais municípios entram">
          <div className="pilha p">
            <label className="campo">Estado<select value={uf} onChange={(e) => setUf(e.target.value)} data-teste="prio-uf"><option value="">Brasil inteiro</option>{UFS.map((u) => <option key={u}>{u}</option>)}</select></label>
            <label className="campo">Mínimo de estabelecimentos da agricultura familiar: {fmtInt(minFam)}
              <input type="range" min="0" max="3000" step="100" value={minFam} onChange={(e) => setMinFam(Number(e.target.value))} data-teste="prio-min" />
              <small>Evita que municípios sem agricultura familiar relevante apareçam no topo.</small></label>
            <label className="linha" style={{ fontSize: '.88rem' }}><input type="checkbox" checked={semCoop} onChange={(e) => setSemCoop(e.target.checked)} data-teste="prio-sem" /> Só municípios sem cooperativa agropecuária</label>
          </div>
          <div className="grade" style={{ gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
            <div className="indicador"><span className="rot">Municípios avaliados</span><span className="val num" style={{ fontSize: '1.4rem' }} data-teste="prio-n">{fmtInt(linhas.length)}</span></div>
            <div className="indicador"><span className="rot">População nos 100 primeiros</span><span className="val num" style={{ fontSize: '1.4rem' }}>{fmtInt(popTopo)}</span></div>
          </div>
        </Cartao>
      </div>

      <Cartao titulo="Fila de prioridades" sub={`Os 50 primeiros de ${fmtInt(linhas.length)} municípios. Clique em uma linha para ver a ficha.`} acoes={<button className="botao" onClick={baixar} data-teste="prio-csv"><Icone nome="baixar" tamanho={17} />Baixar lista completa (CSV)</button>}>
        <div className="tabela-rolagem">
          <table data-teste="prio-tabela">
            <thead><tr><th>#</th><th>Município</th><th className="n">Nota</th><th className="n">Desastres (10 anos)</th><th className="n">IVS 2010</th><th className="n">ISH 2017</th><th className="n">Coop. agro</th><th className="n">Estab. familiares</th></tr></thead>
            <tbody>{topo.map(({ i, nota }, k) => (
              <tr key={i} className="clicavel" tabIndex={0} onClick={() => aoAbrirFicha(i)} onKeyDown={(e) => e.key === 'Enter' && aoAbrirFicha(i)}>
                <td className="num">{k + 1}</td><td>{base.nome[i]} – {base.uf[i]}</td><td className="n"><b>{fmtDec(nota, 0)}</b></td>
                <td className="n">{base.col.des_recentes[i]}</td><td className="n">{base.col.ivs2010[i] == null ? '—' : fmtDec(base.col.ivs2010[i], 3)}</td>
                <td className="n">{base.col.ish2017_geral[i] == null ? '—' : fmtDec(base.col.ish2017_geral[i], 2)}</td><td className="n">{base.col.coops_agro[i]}</td><td className="n">{fmtInt(base.col.estab_familiares[i])}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Cartao>

      <Cartao titulo="Vulnerabilidade social × desastres" sub="Cada ponto é um município. Clique em um ponto para abrir a ficha. A lista acima traz os mesmos dados em tabela." origem={<Origem />}>
        <Dispersao pontos={pontos} xRot="IVS 2010" yRot="Desastres (10 anos)" xFmt={(v) => fmtDec(v, 2)} cores={['var(--serie-2)', 'var(--serie-1)']} nomes={['Sem cooperativa agropecuária', 'Com cooperativa agropecuária']} aoClicar={(p) => aoAbrirFicha(p.i)} />
      </Cartao>
    </div>
  )
}

// ------------------------------------------------------------------ histórico
function AbaHistorico({ base, risco }) {
  const { dados: serie, erro } = useDados('risco_serie.json')
  const [uf, setUf] = useState('')
  if (!serie) return <Carregando erro={erro} />
  const bruto = uf ? serie.uf[uf] : serie.brasil
  const dados = bruto.map((g, k) => ({ ano: serie.anos[0] + k, seca: g[0], cheias: g[1], tempestades: g[2], demais: g[3] + g[4] + g[5] }))
  const soma = (id) => base.col[id].reduce((s, v, i) => s + (!uf || base.uf[i] === uf ? v || 0 : 0), 0)
  const total = dados.reduce((s, d) => s + d.seca + d.cheias + d.tempestades + d.demais, 0)
  return (
    <div className="pilha">
      <div className="grade g4">
        <Indicador rotulo="Registros de desastres" valor={fmtInt(total)} nota={`${serie.anos[0]} a ${serie.anos[1]}`} origem={<Origem />} />
        <Indicador rotulo="Pessoas afetadas" valor={fmtInt(soma('pessoas_afetadas'))} nota="Danos humanos diretos" origem={<Origem />} />
        <Indicador rotulo="Mortes" valor={fmtInt(soma('mortos'))} origem={<Origem />} />
        <Indicador rotulo="Prejuízo agrícola e pecuário" valor={fmtReais(soma('perda_agro'))} nota="Valores nominais, sem correção" origem={<Origem />} />
      </div>
      <Cartao titulo="Registros por ano e tipo de desastre" sub="Cada registro é um desastre registrado por um município." origem={<Origem />}
        acoes={<select className="entrada" style={{ width: 'auto' }} value={uf} onChange={(e) => setUf(e.target.value)} aria-label="Estado" data-teste="hist-uf"><option value="">Brasil</option>{Object.keys(serie.uf).map((u) => <option key={u}>{u}</option>)}</select>}>
        <Linhas dados={dados} x="ano" series={[{ chave: 'seca', nome: 'Estiagem e seca', cor: 'var(--serie-1)' }, { chave: 'cheias', nome: 'Enxurradas e inundações', cor: 'var(--serie-2)' }, { chave: 'tempestades', nome: 'Tempestades', cor: 'var(--serie-3)' }]} />
        <details style={{ marginTop: 12 }}><summary style={{ cursor: 'pointer', fontSize: '.86rem', color: 'var(--texto-2)' }}>Ver os números em tabela</summary>
          <div className="tabela-rolagem"><table><thead><tr><th>Ano</th><th className="n">Estiagem e seca</th><th className="n">Enxurradas e inundações</th><th className="n">Tempestades</th><th className="n">Demais</th></tr></thead>
            <tbody>{dados.map((d) => <tr key={d.ano}><td>{d.ano}</td><td className="n">{fmtInt(d.seca)}</td><td className="n">{fmtInt(d.cheias)}</td><td className="n">{fmtInt(d.tempestades)}</td><td className="n">{fmtInt(d.demais)}</td></tr>)}</tbody></table></div>
        </details>
      </Cartao>
      <Aviso>Parte do aumento dos registros ao longo do tempo pode refletir a melhora do sistema de registro, e não apenas mais eventos. “Demais” reúne incêndios florestais, movimentos de massa, erosão, ondas de frio e calor e outros tipos.</Aviso>
    </div>
  )
}

// ------------------------------------------------------------------ fontes
function AbaFontes({ risco }) {
  const f = risco.fontes
  const linhas = [
    ['Desastres', `${f.atlas.nome} (${f.atlas.orgao})`, `${f.atlas.periodo}; ${fmtInt(f.atlas.registros)} registros`, 'Município', 'Contagem de registros por município e tipo. Tipos agrupados em estiagem e seca; enxurradas e inundações; tempestades; incêndio; movimentos de massa; outros.', 'Registros dependem de o município notificar. Valores em reais são nominais.'],
    ['Vulnerabilidade social', `${f.ivs.nome} (${f.ivs.orgao})`, f.ivs.periodo, 'Município', 'Valores do portal do IVS, de 0 a 1. “−1” (sem dado) vira vazio.', 'Dados de 2010, anteriores ao Censo 2022. Municípios criados depois ficam sem valor.'],
    ['Segurança hídrica', `${f.ish.nome} (${f.ish.orgao})`, f.ish.periodo, 'Ottobacia (562 mil), escala 1:1.000.000', 'Classes Mínimo a Máximo convertidas em 1 a 5; média das bacias do município ponderada pela área (grade de 0,01°).', 'Escala pequena: serve para visão regional, não para um ponto específico. A projeção 2035 é um cenário do Plano Nacional de Segurança Hídrica.'],
    ['Solo', `${f.solo.nome} (${f.solo.orgao})`, f.solo.periodo, '1 km (original: 250 m)', 'Média de pH, argila, areia, carbono orgânico e CTC de 0 a 30 cm (pesos 5, 10 e 15 cm). Lida na camada de 1 km.', 'Modelo estatístico global; as incertezas aumentam onde há poucos pontos de coleta.'],
    ['População e urbanização', `${f.ghsl.nome} (${f.ghsl.orgao})`, f.ghsl.periodo, '1 km', 'Soma da população e da área construída dos pixels cujo centro está no município. Zona rural = classes 11 a 13 do Grau de Urbanização.', 'Estimativa por modelagem e imagens de satélite; difere do Censo oficial.'],
    ['Rios, bacias e lagos', `${f.hydro.nome} (${f.hydro.orgao})`, f.hydro.periodo, 'Trechos de rio e polígonos', 'Extensão de rios pelo ponto médio de cada trecho; bacias por área dominante; lagos de 10 ha ou mais pelo ponto central.', 'Trechos que atravessam vários municípios contam só no município do ponto médio.'],
    ['Cooperativas', 'CNPJ (Receita Federal) e Censo Agropecuário 2017 (IBGE)', 'Carga de 10/2026', 'Município (sede)', 'Cooperativas ativas e agropecuárias (ramo estimado pelo CNAE) por município; estabelecimentos da agricultura familiar do Censo.', 'Todos os ramos; sem o recorte do CAF. Localização pela sede do município.'],
  ]
  return (
    <div className="pilha">
      <Cartao titulo="De onde vêm os dados e como foram combinados" origem={<Origem />}>
        <div className="tabela-rolagem"><table data-teste="risco-fontes">
          <thead><tr><th>Tema</th><th>Fonte</th><th>Período</th><th>Resolução</th><th>Como entrou no município</th><th>Cuidados</th></tr></thead>
          <tbody>{linhas.map((l) => <tr key={l[0]}>{l.map((c, k) => <td key={k} style={k === 0 ? { fontWeight: 600 } : k >= 4 ? { color: 'var(--texto-2)' } : undefined}>{c}</td>)}</tr>)}</tbody>
        </table></div>
      </Cartao>
      <Aviso>Todas as camadas foram levadas a uma grade comum de 0,01° (cerca de 1,1 km) e agregadas pelos limites municipais do IBGE de 2022. Os scripts de cada etapa estão em <code>scripts/etl/risco_*.py</code>. Antes de usar um número em relatório oficial, confira a fonte original e a data dela.</Aviso>
    </div>
  )
}
