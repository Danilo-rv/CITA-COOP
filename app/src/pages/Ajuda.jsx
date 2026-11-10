import { Link } from 'react-router-dom'
import { Cabecalho, Cartao, Icone, Aviso } from '../components/ui.jsx'
import { TODOS_ITENS } from '../menu.js'

export default function Ajuda() {
  const base = import.meta.env.BASE_URL
  return (
    <>
      <Cabecalho sobre="Conhecimento" titulo="Ajuda e acessibilidade" acoes={<a className="botao primario" href={base + 'docs/Manual_CITA-COOP.pdf'} target="_blank" rel="noreferrer"><Icone nome="doc" tamanho={17} />Abrir o manual (PDF)</a>}>
        Como usar a plataforma em poucos passos e quais recursos existem para que todas as pessoas consigam usá-la.
      </Cabecalho>
      <div className="grade g2">
        <Cartao titulo="Primeiros passos">
          <div className="pilha">
            <div className="passo"><i>1</i><div><b>Escolha o seu perfil</b><p style={{ color: 'var(--texto-2)' }}>No alto da tela, selecione como você usa a plataforma. O menu mostra só o que interessa ao seu perfil.</p></div></div>
            <div className="passo"><i>2</i><div><b>Abra o Geoportal</b><p style={{ color: 'var(--texto-2)' }}>Veja o mapa do Brasil, filtre por estado e ramo e clique em um círculo para conhecer as cooperativas do município.</p></div></div>
            <div className="passo"><i>3</i><div><b>Busque uma cooperativa</b><p style={{ color: 'var(--texto-2)' }}>Digite o nome ou o CNPJ na busca do Geoportal para abrir a ficha.</p></div></div>
            <div className="passo"><i>4</i><div><b>Use os serviços</b><p style={{ color: 'var(--texto-2)' }}>Registre uma demanda, tire dúvidas na ATER Virtual, faça o diagnóstico de gestão ou encontre cooperativas perto de um comprador.</p></div></div>
          </div>
        </Cartao>
        <Cartao titulo="Acessibilidade">
          <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--texto-2)', fontSize: '.9rem', display: 'grid', gap: 8 }} data-teste="lista-acessibilidade">
            <li><b>Libras:</b> o botão azul do VLibras, no canto da tela, traduz os textos para a Língua Brasileira de Sinais. É a ferramenta oficial do governo federal (gov.br).</li>
            <li><b>Tamanho do texto:</b> use os botões <kbd>A−</kbd> e <kbd>A+</kbd> no alto da tela.</li>
            <li><b>Alto contraste:</b> o botão de contraste troca as cores para fundo preto com texto claro.</li>
            <li><b>Tema escuro:</b> o botão de lua/sol alterna entre claro e escuro.</li>
            <li><b>Teclado:</b> toda a plataforma funciona com <kbd>Tab</kbd> e <kbd>Enter</kbd>. O primeiro <kbd>Tab</kbd> mostra o atalho “Pular para o conteúdo”.</li>
            <li><b>Leitores de tela:</b> páginas com títulos, rótulos e descrições; tabelas acompanham os gráficos e o mapa.</li>
            <li><b>Celular:</b> o layout se adapta a telas pequenas.</li>
          </ul>
        </Cartao>
      </div>

      <Cartao titulo="O que significa cada etiqueta" style={{ marginTop: 16 }}>
        <div className="grade g3" style={{ fontSize: '.88rem', color: 'var(--texto-2)' }}>
          <div><span className="etiqueta real"><i className="ponto bom" />Dados reais</span><p style={{ marginTop: 6 }}>Informação de fonte oficial já carregada (Receita Federal, IBGE).</p></div>
          <div><span className="etiqueta demo">Registro local</span><p style={{ marginTop: 6 }}>Informação digitada por você, guardada só neste navegador.</p></div>
          <div><span className="etiqueta demo">Demonstração</span><p style={{ marginTop: 6 }}>Exemplo ilustrativo, onde a fonte oficial ainda não está conectada.</p></div>
        </div>
      </Cartao>

      <Cartao titulo="Guia rápido dos módulos" style={{ marginTop: 16 }}>
        <div className="tabela-rolagem"><table>
          <thead><tr><th>Módulo</th><th>Para que serve</th><th /></tr></thead>
          <tbody>{TODOS_ITENS.filter((i) => i.rota !== '/').map((i) => (
            <tr key={i.rota}><td><b>{i.nome}</b></td><td style={{ color: 'var(--texto-2)' }}>{i.resumo}</td><td><Link to={i.rota} aria-label={`Abrir ${i.nome}`}><Icone nome="seta" tamanho={17} /></Link></td></tr>
          ))}</tbody>
        </table></div>
      </Cartao>
      <div style={{ marginTop: 16 }}><Aviso>O VLibras precisa de conexão com a internet para carregar o intérprete virtual.</Aviso></div>
    </>
  )
}
