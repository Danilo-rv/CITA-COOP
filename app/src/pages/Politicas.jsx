import { useMemo, useState } from 'react'
import { Cabecalho, Cartao, Origem, Aviso, Abas, Carregando, Nivel, Indicador } from '../components/ui.jsx'
import { BarrasH } from '../components/charts.jsx'
import { useDados, M, UFS } from '../lib/dados.js'
import { useLocal } from '../lib/store.js'
import { COMPONENTES_ICPP, componentesIcpp, icpp, faixaIcpp, densidadeCooperativa, ehVazio, fmtInt, fmtDec, fmtPct, semAcento } from '../lib/calc.js'

const PESOS_PADRAO = Object.fromEntries(COMPONENTES_ICPP.map((c) => [c.id, 1]))

export default function Politicas() {
  const { dados: municipios, erro } = useDados('municipios.json')
  const [aba, setAba] = useState('presenca')
  if (!municipios) return <Carregando erro={erro} />
  return (
    <>
      <Cabecalho sobre="Território" titulo="Políticas Públicas">
        Mostra onde a agricultura familiar está, onde há cooperativas para atendê-la e quanto das políticas chega a cada território.
      </Cabecalho>
      <Abas atual={aba} aoMudar={setAba} abas={[{ id: 'presenca', nome: 'Presença cooperativa' }, { id: 'vazios', nome: 'Vazios de atendimento' }, { id: 'icpp', nome: 'Calculadora do ICPP' }]} />
      {aba === 'presenca' && <Presenca municipios={municipios} />}
      {aba === 'vazios' && <Vazios municipios={municipios} />}
      {aba === 'icpp' && <Icpp municipios={municipios} />}
    </>
  )
}

function Presenca({ municipios }) {
  const linhas = useMemo(() => {
    const por = {}
    for (const m of municipios) {
      const u = (por[m[M.uf]] ||= { uf: m[M.uf], agro: 0, familiar: 0, municipios: 0, comAgro: 0 })
      u.agro += m[M.ramos][0]; u.familiar += m[M.familiar]; u.municipios += 1; if (m[M.ramos][0] > 0) u.comAgro += 1
    }
    return Object.values(por).map((u) => ({ ...u, dens: densidadeCooperativa(u.agro, u.familiar) })).sort((a, b) => b.dens - a.dens)
  }, [municipios])
  const br = linhas.reduce((s, u) => ({ agro: s.agro + u.agro, familiar: s.familiar + u.familiar }), { agro: 0, familiar: 0 })
  return (
    <div className="pilha">
      <div className="grade g3">
        <Indicador rotulo="Cooperativas agropecuárias ativas" valor={fmtInt(br.agro)} nota="Ramo estimado pelo CNAE" origem={<Origem />} />
        <Indicador rotulo="Estabelecimentos da agricultura familiar" valor={fmtInt(br.familiar)} nota="Censo Agropecuário 2017" origem={<Origem />} />
        <Indicador rotulo="Cooperativas por 10 mil estab. familiares" valor={fmtDec(densidadeCooperativa(br.agro, br.familiar))} nota="Média nacional" origem={<Origem />} />
      </div>
      <div className="grade g2">
        <Cartao titulo="Cooperativas agropecuárias por 10 mil estabelecimentos familiares" sub="Por estado, do maior para o menor." origem={<Origem />}>
          <BarrasH itens={linhas.map((u) => ({ nome: u.uf, valor: u.dens }))} formato={(v) => fmtDec(v)} />
        </Cartao>
        <Cartao titulo="Tabela por estado" origem={<Origem />}>
          <div className="tabela-rolagem">
            <table data-teste="tabela-uf">
              <thead><tr><th>UF</th><th className="n">Coop. agro</th><th className="n">Estab. familiares</th><th className="n">Por 10 mil</th><th className="n">Mun. com coop.</th></tr></thead>
              <tbody>{linhas.map((u) => (
                <tr key={u.uf}><td><b>{u.uf}</b></td><td className="n">{fmtInt(u.agro)}</td><td className="n">{fmtInt(u.familiar)}</td><td className="n">{fmtDec(u.dens)}</td><td className="n">{fmtPct(u.comAgro / u.municipios, 0)}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </Cartao>
      </div>
      <Aviso>Este indicador usa a sede da cooperativa. Uma cooperativa pode atender municípios vizinhos; a área de abrangência real depende dos vínculos do CAF (MDA).</Aviso>
    </div>
  )
}

function Vazios({ municipios }) {
  const [minimo, setMinimo] = useState(1000)
  const [uf, setUf] = useState('')
  const lista = useMemo(() => municipios.filter((m) => (!uf || m[M.uf] === uf) && ehVazio(m[M.ramos][0], m[M.familiar], minimo)).sort((a, b) => b[M.familiar] - a[M.familiar]), [municipios, minimo, uf])
  const total = lista.reduce((s, m) => s + m[M.familiar], 0)
  const csv = () => {
    const txt = 'cod_ibge;municipio;uf;estabelecimentos_familiares;cooperativas_ativas_todos_os_ramos\n' + lista.map((m) => [m[M.cod], m[M.nome], m[M.uf], m[M.familiar], m[M.ramos].reduce((a, b) => a + b, 0)].join(';')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + txt], { type: 'text/csv' })); a.download = 'vazios_de_atendimento.csv'; a.click()
  }
  return (
    <div className="pilha">
      <Cartao>
        <div className="grade gform" style={{ alignItems: 'end' }}>
          <label className="campo">Mínimo de estabelecimentos familiares: {fmtInt(minimo)}
            <input type="range" min="100" max="5000" step="100" value={minimo} onChange={(e) => setMinimo(Number(e.target.value))} data-teste="minimo" />
          </label>
          <label className="campo">Estado
            <select value={uf} onChange={(e) => setUf(e.target.value)}><option value="">Brasil inteiro</option>{UFS.map((u) => <option key={u}>{u}</option>)}</select>
          </label>
          <button className="botao" onClick={csv}>Baixar lista (CSV)</button>
        </div>
      </Cartao>
      <div className="grade g3">
        <Indicador rotulo="Municípios sem cooperativa agropecuária" valor={<span data-teste="n-vazios">{fmtInt(lista.length)}</span>} nota={`com ${fmtInt(minimo)} ou mais estabelecimentos familiares`} origem={<Origem />} />
        <Indicador rotulo="Estabelecimentos familiares nesses municípios" valor={fmtInt(total)} origem={<Origem />} />
      </div>
      <Cartao titulo="Fila de prioridades" sub="Ordenada pelo número de estabelecimentos familiares sem cooperativa agropecuária com sede no município." origem={<Origem />}>
        <div className="tabela-rolagem">
          <table>
            <thead><tr><th>#</th><th>Município</th><th>UF</th><th className="n">Estab. familiares</th><th className="n">Coop. de outros ramos</th></tr></thead>
            <tbody>{lista.slice(0, 50).map((m, i) => (
              <tr key={m[M.cod]}><td className="num">{i + 1}</td><td>{m[M.nome]}</td><td>{m[M.uf]}</td><td className="n">{fmtInt(m[M.familiar])}</td><td className="n">{m[M.ramos].reduce((a, b) => a + b, 0)}</td></tr>
            ))}</tbody>
          </table>
        </div>
        {lista.length > 50 && <p className="sub" style={{ marginTop: 10, marginBottom: 0 }}>Mostrando os 50 primeiros de {fmtInt(lista.length)}. Baixe o CSV para ver todos.</p>}
      </Cartao>
    </div>
  )
}

function Icpp({ municipios }) {
  const [busca, setBusca] = useState('')
  const [cod, setCod] = useLocal('icpp:municipio', '')
  const [valores, setValores] = useLocal('icpp:valores', {})
  const [pesos, setPesos] = useLocal('icpp:pesos', PESOS_PADRAO)
  const m = municipios.find((x) => x[M.cod] === cod)
  const opcoes = useMemo(() => {
    const t = semAcento(busca.trim()); if (t.length < 2) return []
    return municipios.filter((x) => semAcento(x[M.nome]).includes(t)).slice(0, 8)
  }, [busca, municipios])
  const comp = componentesIcpp(valores, m ? m[M.familiar] : 0)
  const indice = icpp(comp, pesos)
  const faixa = faixaIcpp(indice)
  const exemplo = () => { if (!m) return; const f = m[M.familiar]; setValores({ cadastro: Math.round(f * 0.62), credito: Math.round(f * 0.21), ater: Math.round(f * 0.12), pnae: 24, paa: Math.round(f * 0.03), protecao: Math.round(f * 0.08) }) }
  return (
    <div className="pilha">
      <Aviso>O ICPP (Índice de Cobertura de Políticas Públicas) mede quanto das políticas da agricultura familiar chega a quem tem direito. O denominador (estabelecimentos familiares) já vem do Censo. Os numeradores dependem de convênios com MDA, Banco Central, FNDE e ANATER — por enquanto, informe os valores do município para calcular.</Aviso>
      <div className="grade g2">
        <Cartao titulo="1. Município e valores" origem={<Origem tipo="local" />}>
          <label className="campo">Município
            <input className="entrada" placeholder="Digite o nome do município" value={m && !busca ? `${m[M.nome]} – ${m[M.uf]}` : busca} onChange={(e) => { setBusca(e.target.value); if (cod) setCod('') }} data-teste="icpp-municipio" />
          </label>
          {opcoes.length > 0 && !m && (
            <div className="sugestoes" style={{ marginTop: 8 }}>{opcoes.map((o) => <button key={o[M.cod]} onClick={() => { setCod(o[M.cod]); setBusca('') }}>{o[M.nome]} – {o[M.uf]}</button>)}</div>
          )}
          {m && (
            <>
              <p style={{ margin: '12px 0', fontSize: '.88rem' }}>Estabelecimentos da agricultura familiar: <b className="num" data-teste="icpp-denominador">{fmtInt(m[M.familiar])}</b> <Origem>IBGE</Origem></p>
              <div className="grade gform">
                {COMPONENTES_ICPP.map((c) => (
                  <label className="campo" key={c.id}>{c.rotulo}
                    <input type="number" min="0" value={valores[c.id] ?? ''} onChange={(e) => setValores({ ...valores, [c.id]: e.target.value })} data-teste={`icpp-${c.id}`} />
                    <small>Fonte: {c.fonte}</small>
                  </label>
                ))}
              </div>
              <div className="linha" style={{ marginTop: 12 }}>
                <button className="botao" onClick={exemplo}>Preencher com valores de exemplo</button>
                <button className="botao sutil" onClick={() => setValores({})}>Limpar</button>
              </div>
            </>
          )}
        </Cartao>

        <Cartao titulo="2. Resultado" sub="Cada componente é normalizado entre 0 e 1 e combinado por média ponderada.">
          {!m ? <div className="vazio">Escolha um município para calcular.</div> : (
            <>
              <div className="linha" style={{ alignItems: 'baseline', marginBottom: 6 }}>
                <span className="indicador"><span className="val num" style={{ fontSize: '2.6rem' }} data-teste="icpp-valor">{fmtDec(indice, 2)}</span></span>
                <Nivel nivel={faixa.nivel}>{faixa.rotulo}</Nivel>
              </div>
              <div className="medidor" style={{ marginBottom: 16 }}><i style={{ width: `${indice * 100}%` }} /></div>
              <BarrasH max={1} formato={(v) => fmtPct(v, 0)} itens={COMPONENTES_ICPP.map((c) => ({ nome: c.nome, valor: comp[c.id] }))} />
              <h3 style={{ margin: '18px 0 8px' }}>Pesos dos componentes</h3>
              <div className="grade gform">
                {COMPONENTES_ICPP.map((c) => (
                  <label className="campo" key={c.id}>{c.nome}: {pesos[c.id]}
                    <input type="range" min="0" max="5" step="1" value={pesos[c.id]} onChange={(e) => setPesos({ ...pesos, [c.id]: Number(e.target.value) })} />
                  </label>
                ))}
              </div>
              <p className="sub" style={{ margin: '10px 0 0' }}>Os pesos oficiais serão definidos pelo comitê gestor com especialistas (método AHP).</p>
            </>
          )}
        </Cartao>
      </div>
    </div>
  )
}
