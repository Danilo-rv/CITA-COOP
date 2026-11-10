import { useRef, useState } from 'react'
import { fmtInt } from '../lib/calc.js'

/** Barras horizontais (ranking de uma medida). Uma única cor: a identidade está no rótulo. */
export function BarrasH({ itens, formato = fmtInt, max }) {
  const m = max ?? Math.max(1, ...itens.map((i) => i.valor))
  return (
    <div className="hbar" role="list">
      {itens.map((i) => (
        <div key={i.nome} role="listitem" style={{ display: 'contents' }} title={`${i.nome}: ${formato(i.valor)}`}>
          <span className="nm">{i.nome}</span>
          <span className="tr"><i style={{ width: `${(i.valor / m) * 100}%` }} /></span>
          <span className="v">{formato(i.valor)}</span>
        </div>
      ))}
    </div>
  )
}

/** Linhas ao longo do tempo com mira e dica ao passar o mouse. series = [{ nome, cor, chave }] */
export function Linhas({ dados, x, series, altura = 260, formato = fmtInt }) {
  const W = 960, H = altura, m = { t: 14, r: 70, b: 26, l: 48 }
  const ref = useRef(null)
  const [sel, setSel] = useState(null)
  const max = Math.max(1, ...dados.flatMap((d) => series.map((s) => d[s.chave])))
  const passo = Math.pow(10, Math.floor(Math.log10(max)))
  const topo = Math.ceil(max / passo) * passo
  const px = (i) => m.l + (i / (dados.length - 1)) * (W - m.l - m.r)
  const py = (v) => m.t + (1 - v / topo) * (H - m.t - m.b)
  const marcas = [0, 0.25, 0.5, 0.75, 1].map((f) => f * topo)
  const cadaX = Math.ceil(dados.length / 8)
  const mover = (e) => {
    const r = ref.current.getBoundingClientRect()
    const rel = ((e.clientX - r.left) / r.width) * W
    const i = Math.round(((rel - m.l) / (W - m.l - m.r)) * (dados.length - 1))
    setSel(Math.max(0, Math.min(dados.length - 1, i)))
  }
  const ultimo = dados[dados.length - 1]
  // rótulos no fim das linhas: afasta os que ficariam sobrepostos
  const rotY = series.map((s) => py(ultimo[s.chave]))
  const ordem = rotY.map((y, i) => i).sort((a, b) => rotY[a] - rotY[b])
  for (let k = 1; k < ordem.length; k++) if (rotY[ordem[k]] - rotY[ordem[k - 1]] < 15) rotY[ordem[k]] = rotY[ordem[k - 1]] + 15
  return (
    <div className="grafico">
      <div className="legenda">{series.map((s) => <span key={s.chave}><i style={{ background: s.cor }} />{s.nome}</span>)}</div>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Gráfico de linhas: ${series.map((s) => s.nome).join(' e ')}`} onMouseMove={mover} onMouseLeave={() => setSel(null)}>
        {marcas.map((v) => (
          <g key={v}>
            <line x1={m.l} x2={W - m.r} y1={py(v)} y2={py(v)} stroke="var(--grade)" strokeWidth="1" />
            <text x={m.l - 8} y={py(v) + 4} textAnchor="end">{formato(v)}</text>
          </g>
        ))}
        {dados.map((d, i) => (i % cadaX === 0 ? <text key={i} x={px(i)} y={H - 6} textAnchor="middle">{d[x]}</text> : null))}
        {series.map((s, si) => (
          <g key={s.chave}>
            <polyline fill="none" stroke={s.cor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={dados.map((d, i) => `${px(i)},${py(d[s.chave])}`).join(' ')} />
            <text x={W - m.r + 8} y={rotY[si] + 1} className="rot-forte">{s.nome}</text>
          </g>
        ))}
        {sel != null && (
          <g>
            <line x1={px(sel)} x2={px(sel)} y1={m.t} y2={H - m.b} stroke="var(--texto-3)" strokeWidth="1" strokeDasharray="3 3" />
            {series.map((s) => <circle key={s.chave} cx={px(sel)} cy={py(dados[sel][s.chave])} r="4.5" fill={s.cor} stroke="var(--superficie)" strokeWidth="2" />)}
          </g>
        )}
      </svg>
      {sel != null && (
        <div className="dica" style={{ left: `${(px(sel) / W) * 100}%`, top: `${(m.t / H) * 100 + 6}%`, transform: 'translate(-50%, 0)' }}>
          <b>{dados[sel][x]}</b>
          {series.map((s) => <span key={s.chave} style={{ display: 'block' }}>{s.nome}: <b style={{ display: 'inline' }}>{formato(dados[sel][s.chave])}</b></span>)}
        </div>
      )}
    </div>
  )
}

/** Colunas verticais de uma medida, com valor sobre cada coluna e dica. */
export function Colunas({ itens, formato = (v) => v, unidade = '', altura = 220, max }) {
  const W = 720, H = altura, m = { t: 22, r: 8, b: 30, l: 8 }
  const [sel, setSel] = useState(null)
  const topo = max ?? Math.max(1, ...itens.map((i) => i.valor))
  const larg = (W - m.l - m.r) / itens.length
  const b = Math.min(46, larg - 2)
  return (
    <div className="grafico">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Gráfico de colunas">
        <line x1={m.l} x2={W - m.r} y1={H - m.b} y2={H - m.b} stroke="var(--grade)" />
        {itens.map((it, i) => {
          const h = (it.valor / topo) * (H - m.t - m.b)
          const xc = m.l + larg * i + larg / 2
          return (
            <g key={it.nome} onMouseEnter={() => setSel(i)} onMouseLeave={() => setSel(null)}>
              <rect x={xc - larg / 2} y={m.t} width={larg} height={H - m.t - m.b} fill="transparent" />
              <path d={`M${xc - b / 2},${H - m.b} v${-Math.max(0, h - 4)} q0,-4 4,-4 h${b - 8} q4,0 4,4 v${Math.max(0, h - 4)} Z`} fill="var(--serie-1)" opacity={sel == null || sel === i ? 1 : 0.55} />
              <text x={xc} y={H - m.b - h - 6} textAnchor="middle" className="rot-forte">{formato(it.valor)}{unidade}</text>
              <text x={xc} y={H - 9} textAnchor="middle">{it.nome}</text>
            </g>
          )
        })}
      </svg>
      {sel != null && itens[sel].dica && (
        <div className="dica" style={{ left: `${((m.l + larg * sel + larg / 2) / W) * 100}%`, top: '30%' }}><b>{itens[sel].nome}</b>{itens[sel].dica}</div>
      )}
    </div>
  )
}

/** Radar para as dimensões do IMGC (0–100). */
export function Radar({ eixos, tamanho = 320 }) {
  const c = tamanho / 2, R = tamanho / 2 - 58, n = eixos.length
  const pt = (i, v) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2
    return [c + Math.cos(a) * R * (v / 100), c + Math.sin(a) * R * (v / 100)]
  }
  const poli = eixos.map((e, i) => pt(i, e.valor ?? 0).join(',')).join(' ')
  return (
    <div className="grafico" style={{ maxWidth: tamanho + 80, margin: '0 auto' }}>
      <svg viewBox={`-40 0 ${tamanho + 80} ${tamanho}`} role="img" aria-label={'Radar das dimensões: ' + eixos.map((e) => `${e.nome} ${e.valor ?? 'sem nota'}`).join(', ')}>
        {[25, 50, 75, 100].map((v) => <polygon key={v} points={eixos.map((_, i) => pt(i, v).join(',')).join(' ')} fill="none" stroke="var(--grade)" strokeWidth="1" />)}
        {eixos.map((e, i) => {
          const [x, y] = pt(i, 100); const [lx, ly] = pt(i, 122)
          return (
            <g key={e.nome}>
              <line x1={c} y1={c} x2={x} y2={y} stroke="var(--grade)" />
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle">{e.curto || e.nome}</text>
              <text x={lx} y={ly + 13} textAnchor="middle" className="rot-forte">{e.valor == null ? '—' : Math.round(e.valor)}</text>
            </g>
          )
        })}
        <polygon points={poli} fill="var(--serie-1)" fillOpacity=".18" stroke="var(--serie-1)" strokeWidth="2" strokeLinejoin="round" />
        {eixos.map((e, i) => { const [x, y] = pt(i, e.valor ?? 0); return <circle key={i} cx={x} cy={y} r="4" fill="var(--serie-1)" stroke="var(--superficie)" strokeWidth="2" /> })}
      </svg>
    </div>
  )
}
