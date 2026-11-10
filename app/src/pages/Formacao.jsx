import { Cabecalho, Cartao, Aviso, Icone } from '../components/ui.jsx'

const TRILHAS = [
  { nome: 'Governança cooperativa na prática', publico: 'Dirigentes e conselheiros', horas: 20, modulos: ['Papéis da assembleia e dos conselhos', 'Como conduzir uma AGO', 'Transparência com o cooperado'] },
  { nome: 'Finanças para o conselho fiscal', publico: 'Conselheiros fiscais', horas: 16, modulos: ['Lendo o balanço e a DRE', 'Fundos obrigatórios e sobras', 'Parecer do conselho fiscal'] },
  { nome: 'Vendendo para o PNAE e o PAA', publico: 'Dirigentes e equipe comercial', horas: 12, modulos: ['Como funciona a chamada pública', 'Documentação e projeto de venda', 'Formação de preço'] },
  { nome: 'Sucessão e juventude na cooperativa', publico: 'Dirigentes e jovens cooperados', horas: 10, modulos: ['Por que planejar a sucessão', 'Participação dos jovens', 'Plano de transição'] },
]

export default function Formacao() {
  return (
    <>
      <Cabecalho sobre="Serviços" titulo="Formação">
        Trilhas curtas de capacitação a distância para dirigentes e conselheiros, com certificação pelo IF Goiano.
      </Cabecalho>
      <div style={{ marginBottom: 16 }}><Aviso>O catálogo abaixo mostra as trilhas planejadas. As aulas e a emissão de certificados entram na próxima fase, com o Núcleo de Assessoria em Gestão Cooperativa.</Aviso></div>
      <div className="grade g2">
        {TRILHAS.map((t) => (
          <Cartao key={t.nome} titulo={t.nome} sub={`${t.publico} · ${t.horas} horas`} origem={<span className="etiqueta demo">Planejada</span>}>
            <ol style={{ margin: 0, paddingLeft: 20, color: 'var(--texto-2)', fontSize: '.9rem' }}>{t.modulos.map((m) => <li key={m}>{m}</li>)}</ol>
            <div className="linha" style={{ marginTop: 14 }}><button className="botao" disabled><Icone nome="formacao" tamanho={17} />Inscrições em breve</button></div>
          </Cartao>
        ))}
      </div>
    </>
  )
}
