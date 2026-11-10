import { useEffect, useMemo, useState } from 'react'
import { Cabecalho, Cartao, Origem, Aviso, Carregando, Indicador } from '../components/ui.jsx'
import { useDados, carregar, M, C } from '../lib/dados.js'
import { useLocal } from '../lib/store.js'
import { distanciaKm, fmtInt, fmtDec, semAcento, tituloNome, fmtCnpj } from '../lib/calc.js'

const EXEMPLOS = [
  { id: 'c1', orgao: 'Prefeitura (exemplo)', programa: 'PNAE', produtos: 'Hortaliças, frutas e polpa de fruta', prazo: '2026-12-15', exemplo: true },
  { id: 'c2', orgao: 'Secretaria Estadual de Educação (exemplo)', programa: 'PNAE', produtos: 'Feijão, arroz e farinha de mandioca', prazo: '2026-12-20', exemplo: true },
  { id: 'c3', orgao: 'Conab (exemplo)', programa: 'PAA', produtos: 'Leite e derivados', prazo: '2027-01-10', exemplo: true },
]

export default function Mercados() {
  const { dados: municipios, erro } = useDados('municipios.json')
  const [busca, setBusca] = useState(null)
  const [cod, setCod] = useLocal('mercados:municipio', '5208707')
  const [raio, setRaio] = useLocal('mercados:raio', 100)
  const [chamadas, setChamadas] = useLocal('mercados:chamadas', EXEMPLOS)
  const [nova, setNova] = useState({ orgao: '', programa: 'PNAE', produtos: '', prazo: '' })
  const [coops, setCoops] = useState(null)

  const origem = municipios?.find((m) => m[M.cod] === cod)
  const proximos = useMemo(() => {
    if (!origem) return []
    return municipios.map((m) => ({ m, km: distanciaKm(origem[M.lat], origem[M.lon], m[M.lat], m[M.lon]) }))
      .filter((x) => x.km <= raio && x.m[M.ramos][0] > 0).sort((a, b) => a.km - b.km)
  }, [origem, municipios, raio])
  const total = proximos.reduce((s, x) => s + x.m[M.ramos][0], 0)

  useEffect(() => {
    if (!proximos.length) { setCoops([]); return }
    let vivo = true; setCoops(null)
    const ufs = [...new Set(proximos.map((x) => x.m[M.uf]))]
    const dist = new Map(proximos.map((x) => [x.m[M.cod], x]))
    Promise.all(ufs.map((u) => carregar(`coops/${u}.json`))).then((listas) => {
      if (!vivo) return
      setCoops(listas.flat().filter((c) => c[C.ramo] === 0 && dist.has(c[C.cod])).map((c) => ({ c, ...dist.get(c[C.cod]) })).sort((a, b) => a.km - b.km))
    })
    return () => { vivo = false }
  }, [proximos])

  if (!municipios) return <Carregando erro={erro} />
  const opcoes = busca && busca.trim().length >= 2 ? municipios.filter((m) => semAcento(m[M.nome]).includes(semAcento(busca.trim()))).slice(0, 8) : []
  const adicionar = (e) => { e.preventDefault(); if (!nova.orgao || !nova.produtos) return; setChamadas([{ ...nova, id: 'c' + Date.now() }, ...chamadas]); setNova({ orgao: '', programa: 'PNAE', produtos: '', prazo: '' }) }

  return (
    <>
      <Cabecalho sobre="Serviços" titulo="Mercados">
        Aproxima quem compra de quem produz: encontre as cooperativas agropecuárias perto de um município comprador e acompanhe as chamadas públicas do PNAE e do PAA.
      </Cabecalho>

      <div className="grade g2" style={{ marginBottom: 16 }}>
        <Cartao titulo="Cooperativas próximas de um comprador" origem={<Origem />}>
          <div className="grade gform" style={{ alignItems: 'end' }}>
            <label className="campo">Município comprador
              <input className="entrada" value={busca ?? (origem ? `${origem[M.nome]} – ${origem[M.uf]}` : '')} onFocus={() => setBusca('')} onChange={(e) => setBusca(e.target.value)} placeholder="Digite o nome" data-teste="mercados-municipio" />
            </label>
            <label className="campo">Raio: {raio} km
              <input type="range" min="25" max="300" step="25" value={raio} onChange={(e) => setRaio(Number(e.target.value))} data-teste="mercados-raio" />
            </label>
          </div>
          {opcoes.length > 0 && <div className="sugestoes" style={{ marginTop: 8 }}>{opcoes.map((o) => <button key={o[M.cod]} onClick={() => { setCod(o[M.cod]); setBusca(null) }}>{o[M.nome]} – {o[M.uf]}</button>)}</div>}
          <div className="grade" style={{ gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
            <div className="indicador"><span className="rot">Cooperativas agropecuárias no raio</span><span className="val num" data-teste="mercados-total">{fmtInt(total)}</span></div>
            <div className="indicador"><span className="rot">Municípios com oferta</span><span className="val num">{fmtInt(proximos.length)}</span></div>
          </div>
          <p className="sub" style={{ marginTop: 10, marginBottom: 0 }}>Distância em linha reta entre as sedes dos municípios.</p>
        </Cartao>

        <Cartao titulo="Chamadas públicas" origem={<Origem tipo="local" />} acoes={<button className="botao sutil" onClick={() => setChamadas([])}>Limpar</button>}>
          <div className="pilha p" style={{ maxHeight: 210, overflowY: 'auto' }}>
            {chamadas.length === 0 && <div className="vazio">Nenhuma chamada cadastrada.</div>}
            {chamadas.map((c) => (
              <div className="ficha" key={c.id} style={{ marginBottom: 0 }}>
                <div className="linha" style={{ justifyContent: 'space-between' }}><b style={{ margin: 0 }}>{c.orgao}</b><span className="etiqueta">{c.programa}</span></div>
                <p>{c.produtos}</p><p>Prazo: {c.prazo ? c.prazo.split('-').reverse().join('/') : 'não informado'} {c.exemplo && <Origem tipo="demo">Exemplo</Origem>}</p>
              </div>
            ))}
          </div>
          <form onSubmit={adicionar} className="grade gform" style={{ marginTop: 12, alignItems: 'end' }}>
            <label className="campo">Órgão comprador<input value={nova.orgao} onChange={(e) => setNova({ ...nova, orgao: e.target.value })} /></label>
            <label className="campo">Programa<select value={nova.programa} onChange={(e) => setNova({ ...nova, programa: e.target.value })}><option>PNAE</option><option>PAA</option><option>Outro</option></select></label>
            <label className="campo">Produtos<input value={nova.produtos} onChange={(e) => setNova({ ...nova, produtos: e.target.value })} /></label>
            <label className="campo">Prazo<input type="date" value={nova.prazo} onChange={(e) => setNova({ ...nova, prazo: e.target.value })} /></label>
            <button className="botao" type="submit">Adicionar chamada</button>
          </form>
        </Cartao>
      </div>

      <Cartao titulo={`Cooperativas agropecuárias até ${raio} km de ${origem ? origem[M.nome] : '—'}`} sub="Ordenadas da mais próxima para a mais distante." origem={<Origem />}>
        {!coops ? <Carregando /> : coops.length === 0 ? <div className="vazio">Nenhuma cooperativa agropecuária ativa neste raio.</div> : (
          <div className="tabela-rolagem">
            <table data-teste="tabela-proximas">
              <thead><tr><th>Cooperativa</th><th>Município</th><th className="n">Distância</th><th>CNPJ</th></tr></thead>
              <tbody>{coops.slice(0, 40).map(({ c, m, km }) => (
                <tr key={c[C.cnpj]}><td>{tituloNome(c[C.fantasia] || c[C.razao])}</td><td>{m[M.nome]} – {m[M.uf]}</td><td className="n">{km < 1 ? 'no município' : `${fmtDec(km, 0)} km`}</td><td className="num">{fmtCnpj(c[C.cnpj])}</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
        {coops && coops.length > 40 && <p className="sub" style={{ marginTop: 10, marginBottom: 0 }}>Mostrando 40 de {fmtInt(coops.length)}.</p>}
      </Cartao>
      <div style={{ marginTop: 16 }}><Aviso>A lista mostra cooperativas de ramo agropecuário (estimado pelo CNAE). A oferta de produtos de cada cooperativa e a leitura automática dos editais do PNAE e do PAA entram quando as cooperativas cadastrarem sua produção e houver integração com FNDE e Conab.</Aviso></div>
    </>
  )
}
