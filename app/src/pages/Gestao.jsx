import { useState } from 'react'
import { Cabecalho, Cartao, Origem, Aviso, Abas, Nivel, Indicador } from '../components/ui.jsx'
import { Radar } from '../components/charts.jsx'
import { useLocal } from '../lib/store.js'
import { DIMENSOES_IMGC, ESCALA_IMGC, pontuarImgc, nivelImgc, statusDocumento, semaforoGeral, indicadoresFinanceiros, fmtDec, fmtPct, fmtMoeda } from '../lib/calc.js'

const CURTO = { governanca: 'Governança', financas: 'Finanças', contabilidade: 'Contabilidade', conformidade: 'Conformidade', comercializacao: 'Comercialização', pessoas: 'Pessoas', producao: 'Produção' }
const DOCS = [
  { id: 'cnpj', nome: 'CNPJ ativo', dica: 'Situação cadastral na Receita Federal' },
  { id: 'caf', nome: 'CAF Jurídico', dica: 'Validade do cadastro no MDA' },
  { id: 'federal', nome: 'Certidão de tributos federais (CND)', dica: 'Receita Federal / PGFN' },
  { id: 'fgts', nome: 'Certificado de regularidade do FGTS', dica: 'Caixa Econômica Federal' },
  { id: 'trabalhista', nome: 'Certidão de débitos trabalhistas (CNDT)', dica: 'Justiça do Trabalho' },
  { id: 'ago', nome: 'Assembleia Geral Ordinária', dica: 'Data limite da próxima AGO' },
  { id: 'mandato', nome: 'Mandato da diretoria', dica: 'Fim do mandato vigente' },
]
const ROT = { bom: 'Tudo em dia', atencao: 'Há documentos a vencer', critico: 'Há documentos vencidos', neutro: 'Faltam informações' }

export default function Gestao() {
  const [aba, setAba] = useState('imgc')
  const [nome, setNome] = useLocal('gestao:cooperativa', '')
  return (
    <>
      <Cabecalho sobre="Serviços" titulo="Gestão Cooperativa" acoes={<Origem tipo="local" />}>
        Ferramentas para a cooperativa se conhecer e se organizar: diagnóstico de maturidade, controle de documentos e indicadores financeiros.
      </Cabecalho>
      <label className="campo" style={{ maxWidth: 420, marginBottom: 16 }}>Cooperativa em análise
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da cooperativa" data-teste="gestao-nome" />
      </label>
      <Abas atual={aba} aoMudar={setAba} abas={[{ id: 'imgc', nome: 'Diagnóstico IMGC' }, { id: 'conformidade', nome: 'Regularidade' }, { id: 'financeiro', nome: 'Financeiro' }, { id: 'biblioteca', nome: 'Biblioteca' }]} />
      {aba === 'imgc' && <Imgc />}
      {aba === 'conformidade' && <Conformidade />}
      {aba === 'financeiro' && <Financeiro />}
      {aba === 'biblioteca' && <Biblioteca />}
    </>
  )
}

function Imgc() {
  const [resp, setResp] = useLocal('gestao:imgc', {})
  const r = pontuarImgc(resp)
  const nivel = nivelImgc(r.geral)
  const marcar = (dim, i, v) => { const a = [...(resp[dim] || [])]; a[i] = v; setResp({ ...resp, [dim]: a }) }
  const exemplo = () => setResp({ governanca: [3, 2, 3], financas: [2, 1, 2], contabilidade: [3, 3, 2], conformidade: [2, 3, 4], comercializacao: [2, 3, 1], pessoas: [1, 1, 0], producao: [2, 2, 1] })
  const frageis = DIMENSOES_IMGC.filter((d) => r.dimensoes[d.id] != null).sort((a, b) => r.dimensoes[a.id] - r.dimensoes[b.id]).slice(0, 2)
  return (
    <div className="grade g2" style={{ alignItems: 'start' }}>
      <Cartao titulo="Questionário" sub={`Índice de Maturidade de Gestão Cooperativa · ${r.respondidas} de ${r.total} respondidas`} acoes={<><button className="botao sutil" onClick={exemplo}>Exemplo</button><button className="botao sutil" onClick={() => setResp({})}>Limpar</button></>}>
        <div className="medidor" style={{ marginBottom: 6 }}><i style={{ width: `${(r.respondidas / r.total) * 100}%` }} /></div>
        {DIMENSOES_IMGC.map((d) => (
          <fieldset key={d.id} style={{ border: 0, padding: 0, margin: '18px 0 0' }}>
            <legend style={{ padding: 0 }}><h3>{d.nome}</h3></legend>
            {d.perguntas.map((p, i) => (
              <div className="pergunta" key={i}>
                <p id={`${d.id}-${i}`}>{p}</p>
                <div className="escala" role="radiogroup" aria-labelledby={`${d.id}-${i}`}>
                  {ESCALA_IMGC.map((e, v) => (
                    <label key={v}><input type="radio" name={`${d.id}-${i}`} checked={resp[d.id]?.[i] === v} onChange={() => marcar(d.id, i, v)} />{e}</label>
                  ))}
                </div>
              </div>
            ))}
          </fieldset>
        ))}
      </Cartao>
      <div className="pilha" style={{ position: 'sticky', top: 76 }}>
        <Cartao titulo="Resultado">
          <div className="linha" style={{ alignItems: 'baseline' }}>
            <span className="indicador"><span className="val num" style={{ fontSize: '2.8rem' }} data-teste="imgc-nota">{r.geral == null ? '—' : fmtDec(r.geral, 0)}</span></span>
            <span style={{ color: 'var(--texto-3)' }}>de 100</span>
            <Nivel nivel={nivel.nivel}>{nivel.rotulo}</Nivel>
          </div>
          <Radar eixos={DIMENSOES_IMGC.map((d) => ({ nome: d.nome, curto: CURTO[d.id], valor: r.dimensoes[d.id] }))} />
          {frageis.length > 0 && <p style={{ fontSize: '.88rem', color: 'var(--texto-2)' }}>Dimensões que pedem mais atenção: <b>{frageis.map((d) => d.nome).join(' e ')}</b>.</p>}
        </Cartao>
        <Aviso>O questionário é uma versão inicial com 21 perguntas. O instrumento definitivo será validado pelo Núcleo de Assessoria (PPGADM/IF Goiano) e alinhado ao PDGC do Sescoop.</Aviso>
      </div>
    </div>
  )
}

function Conformidade() {
  const [datas, setDatas] = useLocal('gestao:documentos', {})
  const situacoes = DOCS.map((d) => ({ ...d, ...statusDocumento(datas[d.id]) }))
  const geral = semaforoGeral(situacoes)
  const exemplo = () => {
    const d = (dias) => { const x = new Date(); x.setDate(x.getDate() + dias); return x.toISOString().slice(0, 10) }
    setDatas({ cnpj: d(400), caf: d(210), federal: d(18), fgts: d(-6), trabalhista: d(95), ago: d(120), mandato: d(500) })
  }
  return (
    <div className="pilha">
      <div className="grade g3">
        <Indicador rotulo="Situação geral" valor={<Nivel nivel={geral}>{ROT[geral]}</Nivel>} />
        <Indicador rotulo="Documentos em dia" valor={`${situacoes.filter((s) => s.nivel === 'bom').length} de ${DOCS.length}`} />
        <Indicador rotulo="Vencidos ou a vencer em 30 dias" valor={situacoes.filter((s) => s.nivel === 'critico' || s.nivel === 'atencao').length} />
      </div>
      <Cartao titulo="Painel de regularidade" sub="Informe a validade de cada documento. O painel avisa 30 dias antes do vencimento." acoes={<><button className="botao sutil" onClick={exemplo}>Exemplo</button><button className="botao sutil" onClick={() => setDatas({})}>Limpar</button></>}>
        <div className="tabela-rolagem">
          <table data-teste="tabela-docs">
            <thead><tr><th>Documento</th><th>Validade</th><th>Situação</th></tr></thead>
            <tbody>{situacoes.map((s) => (
              <tr key={s.id}>
                <td><b>{s.nome}</b><br /><span style={{ color: 'var(--texto-3)', fontSize: '.78rem' }}>{s.dica}</span></td>
                <td><input className="entrada" style={{ width: 170 }} type="date" value={datas[s.id] || ''} onChange={(e) => setDatas({ ...datas, [s.id]: e.target.value })} aria-label={`Validade: ${s.nome}`} data-teste={`doc-${s.id}`} /></td>
                <td><Nivel nivel={s.nivel}>{s.rotulo}</Nivel></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Cartao>
      <Aviso>Muitas cooperativas perdem vendas ao PAA e ao PNAE por documento vencido. A consulta automática das certidões nos órgãos emissores é uma etapa futura; por enquanto as datas são informadas pela cooperativa.</Aviso>
    </div>
  )
}

function Financeiro() {
  const [d, setD] = useLocal('gestao:financeiro', {})
  const r = indicadoresFinanceiros(d)
  const campo = (id, rotulo) => (
    <label className="campo" key={id}>{rotulo}<input type="number" min="0" value={d[id] ?? ''} onChange={(e) => setD({ ...d, [id]: e.target.value })} data-teste={`fin-${id}`} /></label>
  )
  const exemplo = () => setD({ receita: 1850000, custos: 1320000, despesas: 380000, ativoCirculante: 420000, passivoCirculante: 260000, ativoTotal: 1150000, passivoTotal: 480000, pctReserva: 10, pctFates: 5 })
  const leitura = (v, bom, ok) => (v == null ? 'neutro' : bom(v) ? 'bom' : ok(v) ? 'atencao' : 'critico')
  return (
    <div className="grade g2" style={{ alignItems: 'start' }}>
      <Cartao titulo="Dados do exercício" sub="Valores em reais." acoes={<><button className="botao sutil" onClick={exemplo}>Exemplo</button><button className="botao sutil" onClick={() => setD({})}>Limpar</button></>}>
        <div className="grade gform">
          {campo('receita', 'Ingressos e receitas')}{campo('custos', 'Custos')}{campo('despesas', 'Despesas')}
          {campo('ativoCirculante', 'Ativo circulante')}{campo('passivoCirculante', 'Passivo circulante')}
          {campo('ativoTotal', 'Ativo total')}{campo('passivoTotal', 'Passivo total (dívidas)')}
          {campo('pctReserva', 'Fundo de Reserva (%)')}{campo('pctFates', 'FATES (%)')}
        </div>
      </Cartao>
      <div className="pilha">
        <Cartao titulo="Indicadores">
          <dl className="def" style={{ gridTemplateColumns: '1fr auto auto', alignItems: 'center', marginTop: 0 }}>
            <dt>Sobras do exercício</dt><dd className="num" data-teste="fin-sobras">{fmtMoeda(r.sobras)}</dd><dd><Nivel nivel={r.sobras > 0 ? 'bom' : r.sobras < 0 ? 'critico' : 'neutro'}>{r.sobras > 0 ? 'Sobras' : r.sobras < 0 ? 'Perdas' : '—'}</Nivel></dd>
            <dt>Margem</dt><dd className="num">{fmtPct(r.margem)}</dd><dd><Nivel nivel={leitura(r.margem, (v) => v >= 0.05, (v) => v >= 0)}>{r.margem == null ? '—' : r.margem >= 0.05 ? 'Saudável' : r.margem >= 0 ? 'Apertada' : 'Negativa'}</Nivel></dd>
            <dt>Liquidez corrente</dt><dd className="num" data-teste="fin-liquidez">{r.liquidezCorrente == null ? '—' : fmtDec(r.liquidezCorrente, 2)}</dd><dd><Nivel nivel={leitura(r.liquidezCorrente, (v) => v >= 1.2, (v) => v >= 1)}>{r.liquidezCorrente == null ? '—' : r.liquidezCorrente >= 1.2 ? 'Confortável' : r.liquidezCorrente >= 1 ? 'No limite' : 'Insuficiente'}</Nivel></dd>
            <dt>Endividamento</dt><dd className="num">{fmtPct(r.endividamento)}</dd><dd><Nivel nivel={leitura(r.endividamento, (v) => v <= 0.5, (v) => v <= 0.7)}>{r.endividamento == null ? '—' : r.endividamento <= 0.5 ? 'Controlado' : r.endividamento <= 0.7 ? 'Atenção' : 'Elevado'}</Nivel></dd>
            <dt>Capital de giro</dt><dd className="num">{fmtMoeda(r.capitalGiro)}</dd><dd />
          </dl>
        </Cartao>
        <Cartao titulo="Destinação das sobras" sub="Lei 5.764/1971, art. 28: no mínimo 10% para o Fundo de Reserva e 5% para o FATES.">
          <dl className="def" style={{ gridTemplateColumns: '1fr auto', marginTop: 0 }}>
            <dt>Fundo de Reserva</dt><dd className="num" data-teste="fin-reserva">{fmtMoeda(r.fundoReserva)}</dd>
            <dt>FATES</dt><dd className="num" data-teste="fin-fates">{fmtMoeda(r.fates)}</dd>
            <dt>À disposição da assembleia</dt><dd className="num"><b>{fmtMoeda(r.sobrasADisposicao)}</b></dd>
          </dl>
        </Cartao>
        <Aviso>As faixas de leitura são orientativas. As demonstrações completas (DRE e balanço conforme a ITG 2004) e a integração com o software de gestão da cooperativa são etapas seguintes.</Aviso>
      </div>
    </div>
  )
}

function Biblioteca() {
  const itens = [
    ['Edital de convocação e ata de AGO', 'Governança'], ['Estatuto social (modelo comentado)', 'Governança'], ['Regimento interno', 'Governança'],
    ['Planilha de fluxo de caixa', 'Finanças'], ['Planilha de custo de produção', 'Finanças'], ['Projeto de venda para o PNAE', 'Comercialização'],
    ['Lista de documentos para chamada pública', 'Comercialização'], ['Plano de gestão (Mais Gestão)', 'Planejamento'],
  ]
  return (
    <Cartao titulo="Biblioteca de modelos" sub="Documentos de apoio à gestão.">
      <div className="tabela-rolagem"><table>
        <thead><tr><th>Modelo</th><th>Tema</th><th>Situação</th></tr></thead>
        <tbody>{itens.map(([n, t]) => <tr key={n}><td>{n}</td><td>{t}</td><td><span className="etiqueta demo">Em elaboração pelo Núcleo</span></td></tr>)}</tbody>
      </table></div>
    </Cartao>
  )
}
