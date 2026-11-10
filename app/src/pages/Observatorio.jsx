import { useState } from 'react'
import { Cabecalho, Cartao, Origem, Aviso, Abas, Carregando, Nivel, Icone, Indicador } from '../components/ui.jsx'
import { Linhas, Colunas, BarrasH } from '../components/charts.jsx'
import { useDados } from '../lib/dados.js'
import { CATALOGO, SITUACAO } from '../lib/catalogo.js'
import { fmtInt, fmtDec } from '../lib/calc.js'

export default function Observatorio() {
  const [aba, setAba] = useState('demografia')
  return (
    <>
      <Cabecalho sobre="Conhecimento" titulo="Observatório">
        Análises, dados abertos e a ficha técnica de cada fonte. Espaço pensado para pesquisadores, estudantes e gestores.
      </Cabecalho>
      <Abas atual={aba} aoMudar={setAba} abas={[{ id: 'demografia', nome: 'Demografia das cooperativas' }, { id: 'dados', nome: 'Dados abertos' }, { id: 'catalogo', nome: 'Catálogo de dados' }]} />
      {aba === 'demografia' && <Demografia />}
      {aba === 'dados' && <DadosAbertos />}
      {aba === 'catalogo' && <Catalogo />}
    </>
  )
}

function Demografia() {
  const { dados: d, erro } = useDados('demografia.json')
  const { dados: r } = useDados('resumo.json')
  if (!d || !r) return <Carregando erro={erro} />
  const serie = d.serie.filter((s) => s.ano >= 1995 && s.ano <= 2025)
  const tabela = [...d.uf].sort((a, b) => b.pct_ativas - a.pct_ativas)
  return (
    <div className="pilha">
      <div className="grade g4">
        <Indicador rotulo="Registros de cooperativas no CNPJ" valor={fmtInt(r.estabelecimentos_total)} nota="Matrizes e filiais, todas as situações" origem={<Origem />} />
        <Indicador rotulo="Ativas" valor={fmtInt(r.situacao.ATIVA)} origem={<Origem />} />
        <Indicador rotulo="Baixadas" valor={fmtInt(r.situacao.BAIXADA)} origem={<Origem />} />
        <Indicador rotulo="Inaptas" valor={fmtInt(r.situacao.INAPTA)} origem={<Origem />} />
      </div>
      <Cartao titulo="Cooperativas abertas e baixadas por ano" sub="Matrizes. Os picos de baixas em 2008 e 2015 sugerem encerramentos registrados em lote no cadastro, e não uma onda de fechamentos naqueles anos." origem={<Origem />}>
        <Linhas dados={serie} x="ano" series={[{ chave: 'abertas', nome: 'Abertas', cor: 'var(--serie-1)' }, { chave: 'baixadas', nome: 'Baixadas', cor: 'var(--serie-2)' }]} />
      </Cartao>
      <div className="grade g2">
        <Cartao titulo="Quantas continuam ativas, por período de abertura" sub="Percentual das matrizes abertas em cada período que seguem ativas hoje." origem={<Origem />}>
          <Colunas itens={d.coortes.map((c) => ({ nome: c.periodo, valor: c.pct_ativas, dica: `${fmtInt(c.ativas)} ativas de ${fmtInt(c.abertas)} abertas` }))} formato={(v) => fmtDec(v, 0)} unidade="%" max={100} />
        </Cartao>
        <Cartao titulo="Percentual de matrizes ativas por ramo" sub="Ramo estimado pelo CNAE principal." origem={<Origem />}>
          <BarrasH itens={[...d.ramo].sort((a, b) => b.pct_ativas - a.pct_ativas).map((x) => ({ nome: x.ramo, valor: x.pct_ativas }))} formato={(v) => fmtDec(v, 0) + '%'} max={100} />
        </Cartao>
      </div>
      <Cartao titulo="Situação das matrizes por estado" origem={<Origem />}>
        <div className="tabela-rolagem"><table data-teste="tabela-demografia">
          <thead><tr><th>UF</th><th className="n">Registradas</th><th className="n">Ativas</th><th className="n">Baixadas</th><th className="n">Inaptas</th><th className="n">% ativas</th><th style={{ width: 120 }} /></tr></thead>
          <tbody>{tabela.map((u) => (
            <tr key={u.uf}><td><b>{u.uf}</b></td><td className="n">{fmtInt(u.total)}</td><td className="n">{fmtInt(u.ativas)}</td><td className="n">{fmtInt(u.baixadas)}</td><td className="n">{fmtInt(u.inaptas)}</td><td className="n">{fmtDec(u.pct_ativas)}%</td>
              <td><div className="barra-mini"><i style={{ width: `${u.pct_ativas}%` }} /></div></td></tr>
          ))}</tbody>
        </table></div>
      </Cartao>
      <Aviso>Leitura cuidadosa: o CNPJ só guarda a situação atual de cada registro. Cooperativas antigas já extintas antes da informatização podem não aparecer, e “inapta” indica omissão de declarações, não necessariamente encerramento.</Aviso>
    </div>
  )
}

function DadosAbertos() {
  const base = import.meta.env.BASE_URL + 'dados/'
  const arquivos = [
    { nome: 'Cooperativas ativas do Brasil', arq: 'cooperativas_ativas_brasil.csv.gz', desc: 'CSV compactado, separador ponto e vírgula. CNPJ, razão social, CNAE, endereço, município (código IBGE), latitude e longitude do município.', tam: '2,8 MB' },
    { nome: 'Municípios: cooperativas por ramo e estabelecimentos familiares', arq: 'municipios.json', desc: 'JSON com os 5.572 municípios: coordenadas, contagem de cooperativas ativas por ramo e estabelecimentos do Censo Agro 2017.', tam: '0,4 MB' },
    { nome: 'Demografia das cooperativas', arq: 'demografia.json', desc: 'Séries de abertura e baixa por ano, sobrevivência por período, por UF e por ramo.', tam: '5 kB' },
    { nome: 'Malha das UFs simplificada', arq: 'uf.geojson', desc: 'GeoJSON leve para mapas na web.', tam: '0,2 MB' },
  ]
  return (
    <div className="pilha">
      <Cartao titulo="Arquivos para download" sub="Dados agregados ou de pessoas jurídicas, de fontes públicas. Sem dados pessoais." origem={<Origem />}>
        <div className="pilha p">
          {arquivos.map((a) => (
            <div className="ficha linha" key={a.arq} style={{ justifyContent: 'space-between', marginBottom: 0, flexWrap: 'nowrap', gap: 14 }}>
              <div><b>{a.nome}</b><p>{a.desc}</p></div>
              <a className="botao" href={base + a.arq} download style={{ flex: 'none' }}><Icone nome="baixar" tamanho={17} />{a.tam}</a>
            </div>
          ))}
        </div>
      </Cartao>
      <Aviso>Ao usar os dados, cite as fontes originais (Receita Federal e IBGE) e o CITA-COOP como responsável pelo tratamento. Os scripts que geram cada arquivo estão no repositório, na pasta <code>scripts/etl</code>.</Aviso>
    </div>
  )
}

function Catalogo() {
  const [aberto, setAberto] = useState('cnpj')
  return (
    <div className="pilha">
      <Aviso>Cada conjunto de dados tem uma ficha com origem, caminho percorrido até a tela (linhagem) e limitações conhecidas. É a base da governança de dados do Centro.</Aviso>
      <div className="pilha p" data-teste="catalogo">
        {CATALOGO.map((c) => (
          <Cartao key={c.id}>
            <button style={{ all: 'unset', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', gap: 12, width: '100%', alignItems: 'center' }} aria-expanded={aberto === c.id} onClick={() => setAberto(aberto === c.id ? null : c.id)}>
              <span><h3>{c.nome}</h3><span style={{ color: 'var(--texto-3)', fontSize: '.82rem' }}>{c.orgao}</span></span>
              <Nivel nivel={SITUACAO[c.situacao].nivel}>{SITUACAO[c.situacao].rotulo}</Nivel>
            </button>
            {aberto === c.id && (
              <dl className="def">
                <dt>Acesso</dt><dd>{c.acesso}</dd>
                <dt>Atualização</dt><dd>{c.atualizacao}{c.referencia !== '—' ? ` · referência ${c.referencia}` : ''}</dd>
                <dt>Cobertura</dt><dd>{c.cobertura}</dd>
                <dt>Linhagem</dt><dd>{c.linhagem}</dd>
                <dt>Limitações</dt><dd>{c.limitacoes}</dd>
                {c.script && <><dt>Script</dt><dd><code>{c.script}</code></dd></>}
              </dl>
            )}
          </Cartao>
        ))}
      </div>
    </div>
  )
}
