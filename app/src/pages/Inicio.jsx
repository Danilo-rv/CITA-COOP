import { Link } from 'react-router-dom'
import { Cabecalho, Cartao, Icone, Indicador, Origem, Carregando } from '../components/ui.jsx'
import { BarrasH } from '../components/charts.jsx'
import { useDados } from '../lib/dados.js'
import { fmtInt, fmtDec } from '../lib/calc.js'
import { TODOS_ITENS } from '../menu.js'

export default function Inicio({ perfil }) {
  const { dados: r, erro } = useDados('resumo.json')
  if (!r) return <Carregando erro={erro} />
  const modulos = TODOS_ITENS.filter((i) => i.rota !== '/' && i.perfis.includes(perfil))
  const ramos = r.ramos.map((nome, i) => ({ nome, valor: r.por_ramo[i] })).sort((a, b) => b.valor - a.valor)
  return (
    <>
      <section className="heroi">
        <div className="heroi-grade" />
        <span className="sobretitulo" style={{ color: '#9fe8d0' }}>Centro de Inteligência Territorial Analítica em Cooperativas</span>
        <h1>Dados do território transformados em decisão.</h1>
        <p>O CITA-COOP reúne em um só lugar as cooperativas do país, a agricultura familiar e as políticas públicas, para mostrar onde atuar, o que atender primeiro e onde a política ainda não chega.</p>
        <div className="linha">
          <Link className="botao primario" to="/geoportal"><Icone nome="mapa" tamanho={18} />Abrir o mapa nacional</Link>
          <Link className="botao" to="/ajuda">Como usar a plataforma</Link>
        </div>
      </section>

      <div className="grade g4" style={{ marginBottom: 22 }}>
        <Indicador rotulo="Cooperativas ativas" valor={fmtInt(r.ativas)} nota={`${fmtInt(r.matrizes_ativas)} matrizes · estabelecimentos no CNPJ`} origem={<Origem />} />
        <Indicador rotulo="Municípios com cooperativa" valor={fmtInt(r.municipios_com_cooperativa)} nota={`de ${fmtInt(r.municipios_total)} municípios (${fmtDec((100 * r.municipios_com_cooperativa) / r.municipios_total, 0)}%)`} origem={<Origem />} />
        <Indicador rotulo="Estabelecimentos familiares" valor={fmtInt(r.estab_familiares_brasil)} nota="Censo Agropecuário 2017 (IBGE)" origem={<Origem />} />
        <Indicador rotulo="Registros georreferenciados" valor={`${fmtDec(r.geocodificadas_pct, 2)}%`} nota="Precisão atual: município" origem={<Origem />} />
      </div>

      <div className="grade g2" style={{ marginBottom: 26 }}>
        <Cartao titulo="Cooperativas ativas por ramo" sub="Ramo estimado pelo CNAE principal de cada estabelecimento." origem={<Origem />}>
          <BarrasH itens={ramos} />
        </Cartao>
        <Cartao titulo="O que já é dado real e o que é demonstração" sub="A plataforma indica a origem de cada informação com uma etiqueta.">
          <div className="pilha p" style={{ fontSize: '.88rem' }}>
            <div className="linha" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}><Origem /><span>Base nacional de cooperativas (Receita Federal, {r.carga.split('-').reverse().join('/')}), malhas e Censo Agropecuário (IBGE). Usada no Geoportal, em Políticas Públicas, em Mercados e no Observatório.</span></div>
            <div className="linha" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}><Origem tipo="local" /><span>O que você registra (demandas, diagnósticos, documentos) fica salvo neste navegador nesta fase do protótipo.</span></div>
            <div className="linha" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}><Origem tipo="demo" /><span>Cenários ilustrativos onde a fonte oficial ainda depende de convênio (clima por satélite, CAF, crédito, PNAE).</span></div>
          </div>
        </Cartao>
      </div>

      <Cabecalho titulo="Módulos" />
      <div className="grade g3">
        {modulos.map((m) => (
          <Link key={m.rota} to={m.rota} className="cartao modulo">
            <span className="ic"><Icone nome={m.icone} /></span>
            <span><h3>{m.nome}</h3><p>{m.resumo}</p></span>
          </Link>
        ))}
      </div>
    </>
  )
}
