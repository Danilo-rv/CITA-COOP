import { Cabecalho, Cartao, Origem, Aviso, Carregando } from '../components/ui.jsx'
import { useDados } from '../lib/dados.js'
import { ler } from '../lib/store.js'
import { fmtInt, pontuarImgc } from '../lib/calc.js'

export default function Resultados() {
  const { dados: r, erro } = useDados('resumo.json')
  if (!r) return <Carregando erro={erro} />
  const imgc = pontuarImgc(ler('gestao:imgc', {}))
  const demandas = ler('demandas', []).filter((d) => !d.exemplo).length
  const fila = ler('ater:fila', []).length
  const linhas = [
    ['Território', 'Cooperativas georreferenciadas na base', fmtInt(r.ativas), 'real', 'Todas as cooperativas ativas do país, no nível município.'],
    ['Políticas públicas', 'Municípios com ICPP calculado', '0', 'aguarda', 'Denominador (Censo) pronto para 5.572 municípios; numeradores dependem de convênios.'],
    ['Gestão', 'Cooperativas diagnosticadas pelo IMGC', imgc.completo ? '1' : '0', 'local', 'Diagnósticos completos feitos neste navegador.'],
    ['Gestão', 'Evolução média do IMGC após a assessoria', '—', 'aguarda', 'Exige aplicação antes e depois da assessoria no piloto.'],
    ['Conformidade', '% de cooperativas com documentação regular', '—', 'aguarda', 'Será medido com as cooperativas do piloto em Goiás.'],
    ['Mercado', 'Variação do faturamento e do acesso a PAA e PNAE', '—', 'aguarda', 'Comparação antes e depois, no piloto.'],
    ['Formação', 'Dirigentes e conselheiros capacitados', '0', 'aguarda', 'Trilhas ainda não ofertadas.'],
    ['Serviços', 'Atendimentos da ATER virtual e demandas registradas', String(demandas + fila), 'local', 'Demandas e perguntas encaminhadas neste navegador (sem contar exemplos).'],
    ['Pesquisa', 'Dissertações, artigos e produtos técnicos do PPGADM', '0', 'aguarda', 'A registrar pelo Núcleo de Assessoria.'],
  ]
  return (
    <>
      <Cabecalho sobre="Conhecimento" titulo="Resultados">
        Os nove indicadores de resultado definidos no projeto e o valor atual de cada um.
      </Cabecalho>
      <Cartao>
        <div className="tabela-rolagem"><table data-teste="tabela-resultados">
          <thead><tr><th>Eixo</th><th>Indicador</th><th className="n">Valor atual</th><th>Origem</th><th>Observação</th></tr></thead>
          <tbody>{linhas.map(([eixo, ind, v, o, obs]) => (
            <tr key={ind}><td><span className="etiqueta">{eixo}</span></td><td><b>{ind}</b></td><td className="n" style={{ fontSize: '1.05rem', fontWeight: 650 }}>{v}</td>
              <td>{o === 'real' ? <Origem /> : o === 'local' ? <Origem tipo="local" /> : <span className="etiqueta demo">A medir no piloto</span>}</td><td style={{ color: 'var(--texto-2)' }}>{obs}</td></tr>
          ))}</tbody>
        </table></div>
      </Cartao>
      <div style={{ marginTop: 16 }}><Aviso>Nesta fase (TRL 4) só o indicador de território tem valor consolidado. Os demais serão alimentados no piloto em Goiás, quando a plataforma estiver em uso pelas cooperativas e pelo Núcleo.</Aviso></div>
    </>
  )
}
