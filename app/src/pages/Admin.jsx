import { Cabecalho, Cartao, Origem, Aviso, Nivel } from '../components/ui.jsx'
import { CATALOGO, SITUACAO } from '../lib/catalogo.js'
import { MENU, PERFIS } from '../menu.js'

export default function Admin() {
  const limpar = () => { Object.keys(localStorage).filter((k) => k.startsWith('citacoop:')).forEach((k) => localStorage.removeItem(k)); location.reload() }
  return (
    <>
      <Cabecalho sobre="Conhecimento" titulo="Administração">
        Visão da equipe do Centro: situação das fontes de dados, perfis de acesso e regras de governança.
      </Cabecalho>
      <div className="pilha">
        <Cartao titulo="Fontes de dados e cargas" origem={<Origem />}>
          <div className="tabela-rolagem"><table data-teste="tabela-fontes">
            <thead><tr><th>Fonte</th><th>Órgão</th><th>Atualização</th><th>Referência</th><th>Situação</th></tr></thead>
            <tbody>{CATALOGO.map((c) => (
              <tr key={c.id}><td><b>{c.nome}</b></td><td>{c.orgao}</td><td>{c.atualizacao}</td><td>{c.referencia}</td><td><Nivel nivel={SITUACAO[c.situacao].nivel}>{SITUACAO[c.situacao].rotulo}</Nivel></td></tr>
            ))}</tbody>
          </table></div>
        </Cartao>
        <div className="grade g2">
          <Cartao titulo="Perfis e menus" sub="O que cada perfil enxerga. Nesta fase a troca de perfil é uma demonstração, sem login.">
            <div className="tabela-rolagem"><table>
              <thead><tr><th>Perfil</th><th>Itens do menu</th></tr></thead>
              <tbody>{PERFIS.map((p) => (
                <tr key={p.id}><td><b>{p.nome}</b></td><td style={{ color: 'var(--texto-2)' }}>{MENU.flatMap((g) => g.itens).filter((i) => i.perfis.includes(p.id)).map((i) => i.nome).join(', ')}</td></tr>
              ))}</tbody>
            </table></div>
          </Cartao>
          <Cartao titulo="Governança e LGPD">
            <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--texto-2)', fontSize: '.9rem', display: 'grid', gap: 8 }}>
              <li>Os painéis públicos mostram dados de pessoas jurídicas e agregados por território.</li>
              <li>Telefone e e-mail do CNPJ não são publicados.</li>
              <li>Dados de cooperados só entram com termo de consentimento e acordo com a cooperativa.</li>
              <li>Os registros feitos nesta fase ficam apenas no navegador de quem os criou.</li>
              <li>Pesos do ICPP e do IMGC serão definidos pelo comitê gestor.</li>
            </ul>
            <div className="linha" style={{ marginTop: 16 }}><button className="botao" onClick={limpar}>Apagar todos os registros locais deste navegador</button></div>
          </Cartao>
        </div>
        <Aviso>Login com perfis reais, banco de dados central (PostgreSQL/PostGIS no Supabase) e log de auditoria fazem parte da próxima fase. O esquema do banco já está no repositório, em <code>supabase/schema.sql</code>.</Aviso>
      </div>
    </>
  )
}
