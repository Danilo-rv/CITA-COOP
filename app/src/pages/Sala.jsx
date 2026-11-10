import { useMemo } from 'react'
import { Cabecalho, Cartao, Origem, Aviso, Nivel, Indicador } from '../components/ui.jsx'
import { useLocal } from '../lib/store.js'
import { avaliarAlertas, fmtDec } from '../lib/calc.js'

// Cenário de demonstração: territórios fictícios com valores ilustrativos.
// A ligação com as séries reais (CHIRPS, Sentinel-2, SMAP via Earth Engine) é etapa do TRL 5.
const CENARIO = [
  { territorio: 'Território Demonstrativo Norte', cooperativas: 42, ndvi: -0.18, chuva: -46, umidade: 12, temperatura: 2.1 },
  { territorio: 'Território Demonstrativo Vale', cooperativas: 67, ndvi: -0.04, chuva: -12, umidade: 24, temperatura: 0.6 },
  { territorio: 'Território Demonstrativo Serra', cooperativas: 23, ndvi: 0.05, chuva: 96, umidade: 41, temperatura: -0.3 },
  { territorio: 'Território Demonstrativo Sertão', cooperativas: 58, ndvi: -0.22, chuva: -61, umidade: 9, temperatura: 2.8 },
  { territorio: 'Território Demonstrativo Cerrado', cooperativas: 35, ndvi: -0.09, chuva: -33, umidade: 17, temperatura: 1.4 },
  { territorio: 'Território Demonstrativo Litoral', cooperativas: 19, ndvi: 0.02, chuva: 18, umidade: 33, temperatura: 0.2 },
]
const REGRAS_PADRAO = [
  { id: 'seca', nome: 'Seca agrícola', nivel: 'critico', ativa: true, condicoes: [{ campo: 'ndvi', op: '<', valor: -0.1 }, { campo: 'chuva', op: '<', valor: -30 }] },
  { id: 'solo', nome: 'Solo muito seco', nivel: 'serio', ativa: true, condicoes: [{ campo: 'umidade', op: '<', valor: 15 }] },
  { id: 'chuva', nome: 'Chuva extrema', nivel: 'atencao', ativa: true, condicoes: [{ campo: 'chuva', op: '>', valor: 80 }] },
]
const CAMPOS = { ndvi: 'Anomalia de NDVI', chuva: 'Anomalia de chuva (%)', umidade: 'Umidade do solo (%)', temperatura: 'Anomalia de temperatura (°C)' }
const ROT = { critico: 'Crítico', serio: 'Sério', atencao: 'Atenção' }

export default function Sala() {
  const [regras, setRegras] = useLocal('sala:regras', REGRAS_PADRAO)
  const alertas = useMemo(() => avaliarAlertas(CENARIO, regras), [regras])
  const mudar = (i, j, valor) => setRegras(regras.map((r, a) => (a !== i ? r : { ...r, condicoes: r.condicoes.map((c, b) => (b !== j ? c : { ...c, valor })) })))
  const afetadas = new Set(alertas.map((a) => a.territorio))
  return (
    <>
      <Cabecalho sobre="Território" titulo="Sala de Situação" acoes={<Origem tipo="demo">Cenário de demonstração</Origem>}>
        Acompanha clima, vegetação e solo por território e avisa quando uma combinação de sinais indica risco para as cooperativas.
      </Cabecalho>
      <div style={{ marginBottom: 16 }}>
        <Aviso icone="alerta"><b>Os territórios e valores desta tela são ilustrativos.</b> O motor de alertas é real e já funciona: mude os limites das regras abaixo e veja os alertas mudarem. A ligação com os dados de satélite e estações é a próxima etapa.</Aviso>
      </div>

      <div className="grade g4" style={{ marginBottom: 16 }}>
        <Indicador rotulo="Alertas ativos" valor={alertas.length} />
        <Indicador rotulo="Territórios em alerta" valor={`${afetadas.size} de ${CENARIO.length}`} />
        <Indicador rotulo="Cooperativas em áreas de alerta" valor={CENARIO.filter((t) => afetadas.has(t.territorio)).reduce((s, t) => s + t.cooperativas, 0)} />
        <Indicador rotulo="Regras ativas" valor={regras.filter((r) => r.ativa).length} />
      </div>

      <div className="grade g2">
        <Cartao titulo="Central de alertas" sub="Do mais grave para o menos grave.">
          {alertas.length === 0 ? <div className="vazio">Nenhum alerta com as regras atuais.</div> : (
            <div className="pilha p" data-teste="alertas">
              {alertas.map((a, i) => (
                <div key={i} className="ficha" style={{ marginBottom: 0 }}>
                  <div className="linha" style={{ justifyContent: 'space-between' }}><b style={{ margin: 0 }}>{a.nome}</b><Nivel nivel={a.nivel}>{ROT[a.nivel]}</Nivel></div>
                  <p>{a.territorio} · {a.observacao.cooperativas} cooperativas</p>
                  <p className="num">NDVI {fmtDec(a.observacao.ndvi, 2)} · chuva {a.observacao.chuva > 0 ? '+' : ''}{a.observacao.chuva}% · solo {a.observacao.umidade}%</p>
                </div>
              ))}
            </div>
          )}
        </Cartao>

        <Cartao titulo="Regras de alerta" sub="Um alerta dispara quando todas as condições da regra são verdadeiras." acoes={<button className="botao sutil" onClick={() => setRegras(REGRAS_PADRAO)}>Restaurar</button>}>
          <div className="pilha">
            {regras.map((r, i) => (
              <div key={r.id}>
                <label className="linha" style={{ fontWeight: 600 }}>
                  <input type="checkbox" checked={r.ativa} onChange={(e) => setRegras(regras.map((x, a) => (a === i ? { ...x, ativa: e.target.checked } : x)))} />
                  {r.nome} <Nivel nivel={r.nivel}>{ROT[r.nivel]}</Nivel>
                </label>
                {r.condicoes.map((c, j) => (
                  <label key={j} className="linha" style={{ fontSize: '.84rem', color: 'var(--texto-2)', marginTop: 6, paddingLeft: 24 }}>
                    {CAMPOS[c.campo]} {c.op === '<' ? 'menor que' : 'maior que'}
                    <input className="entrada num" style={{ width: 90 }} type="number" step={c.campo === 'ndvi' ? 0.01 : 1} value={c.valor} onChange={(e) => mudar(i, j, Number(e.target.value))} aria-label={`${r.nome}: limite de ${CAMPOS[c.campo]}`} />
                  </label>
                ))}
              </div>
            ))}
          </div>
        </Cartao>
      </div>

      <Cartao titulo="Situação por território" origem={<Origem tipo="demo" />} style={{ marginTop: 16 }}>
        <div className="tabela-rolagem">
          <table>
            <thead><tr><th>Território</th><th className="n">Cooperativas</th><th className="n">Anomalia NDVI</th><th className="n">Anomalia de chuva</th><th className="n">Umidade do solo</th><th className="n">Anomalia de temp.</th><th>Situação</th></tr></thead>
            <tbody>
              {CENARIO.map((t) => {
                const a = alertas.find((x) => x.territorio === t.territorio)
                return (
                  <tr key={t.territorio}>
                    <td>{t.territorio}</td><td className="n">{t.cooperativas}</td><td className="n">{fmtDec(t.ndvi, 2)}</td>
                    <td className="n">{t.chuva > 0 ? '+' : ''}{t.chuva}%</td><td className="n">{t.umidade}%</td><td className="n">{t.temperatura > 0 ? '+' : ''}{fmtDec(t.temperatura)} °C</td>
                    <td>{a ? <Nivel nivel={a.nivel}>{a.nome}</Nivel> : <Nivel nivel="bom">Normal</Nivel>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Cartao>
    </>
  )
}
