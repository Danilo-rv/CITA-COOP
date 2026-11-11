import { useEffect, useRef, useState } from 'react'
import { NavLink, Route, Routes, useLocation, Navigate } from 'react-router-dom'
import { Icone } from './components/ui.jsx'
import { MENU, PERFIS } from './menu.js'
import { useLocal } from './lib/store.js'
import Inicio from './pages/Inicio.jsx'
import Geoportal from './pages/Geoportal.jsx'
import Sala from './pages/Sala.jsx'
import Politicas from './pages/Politicas.jsx'
import Risco from './pages/Risco.jsx'
import Demandas from './pages/Demandas.jsx'
import Ater from './pages/Ater.jsx'
import Mercados from './pages/Mercados.jsx'
import Gestao from './pages/Gestao.jsx'
import Formacao from './pages/Formacao.jsx'
import Observatorio from './pages/Observatorio.jsx'
import Resultados from './pages/Resultados.jsx'
import Admin from './pages/Admin.jsx'
import Ajuda from './pages/Ajuda.jsx'

export default function App() {
  const [tema, setTema] = useLocal('tema', 'light')
  const [contraste, setContraste] = useLocal('contraste', false)
  const [fonte, setFonte] = useLocal('fonte', 0)
  const [perfil, setPerfil] = useLocal('perfil', 'centro')
  const [aberta, setAberta] = useState(false)
  const local = useLocation()
  const primeira = useRef(true)

  useEffect(() => {
    const r = document.documentElement
    r.dataset.theme = tema
    if (contraste) r.dataset.contraste = 'alto'; else delete r.dataset.contraste
    r.dataset.fonte = String(fonte)
  }, [tema, contraste, fonte])

  // ao trocar de tela, leva o foco ao conteúdo (leitores de tela); na primeira carga o foco fica no início da página
  useEffect(() => {
    if (primeira.current) { primeira.current = false; return }
    setAberta(false); document.getElementById('conteudo')?.focus({ preventScroll: true }); window.scrollTo(0, 0)
  }, [local.pathname])

  return (
    <div className="app">
      <a className="pular" href="#conteudo" onClick={(e) => { e.preventDefault(); document.getElementById('conteudo')?.focus() }}>Pular para o conteúdo</a>
      {aberta && <div className="veu" onClick={() => setAberta(false)} />}

      <aside className={`lateral ${aberta ? 'aberta' : ''}`} aria-label="Menu principal">
        <NavLink to="/" className="logo" aria-label="CITA-COOP — página inicial">
          <span className="logo-marca"><Icone nome="radar" tamanho={22} /></span>
          <span><b>CITA-COOP</b><small>Inteligência territorial em cooperativas</small></span>
        </NavLink>
        <nav className="menu" id="menu">
          {MENU.map((g) => {
            const itens = g.itens.filter((i) => i.perfis.includes(perfil))
            if (!itens.length) return null
            return (
              <div key={g.grupo}>
                <div className="menu-grupo">{g.grupo}</div>
                {itens.map((i) => (
                  <NavLink key={i.rota} to={i.rota} end={i.rota === '/'} className={({ isActive }) => (isActive ? 'ativo' : '')}>
                    <Icone nome={i.icone} />{i.nome}
                  </NavLink>
                ))}
              </div>
            )
          })}
        </nav>
        <div className="lateral-rodape">
          <span className="selo-trl"><i />Protótipo · TRL 4</span>
          <div>Validado em ambiente de laboratório. Carga de dados: CNPJ/Receita 10/2026.</div>
        </div>
      </aside>

      <div className="principal">
        <div className="topo">
          <button className="botao icone sutil botao-menu" onClick={() => setAberta(true)} aria-label="Abrir menu"><Icone nome="menu" /></button>
          <label className="linha seletor-perfil">
            <span className="esconder-celular" style={{ fontSize: '.78rem', color: 'var(--texto-3)', fontWeight: 600 }}>Perfil</span>
            <select className="entrada" value={perfil} onChange={(e) => setPerfil(e.target.value)} aria-label="Perfil de uso (demonstração)">
              {PERFIS.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </label>
          <span className="espaco" />
          <div className="linha" style={{ gap: 4, flexWrap: 'nowrap' }} role="group" aria-label="Acessibilidade">
            <button className="botao sutil icone" onClick={() => setFonte(Math.max(0, fonte - 1))} disabled={fonte === 0} aria-label="Diminuir o tamanho do texto" title="Diminuir texto">A−</button>
            <button className="botao sutil icone" onClick={() => setFonte(Math.min(2, fonte + 1))} disabled={fonte === 2} aria-label="Aumentar o tamanho do texto" title="Aumentar texto">A+</button>
            <button className="botao sutil icone" aria-pressed={contraste} onClick={() => setContraste(!contraste)} aria-label="Alto contraste" title="Alto contraste"><Icone nome="contraste" /></button>
            <button className="botao sutil icone" onClick={() => setTema(tema === 'dark' ? 'light' : 'dark')} aria-label={tema === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'} title="Tema claro/escuro"><Icone nome={tema === 'dark' ? 'sol' : 'lua'} /></button>
            <NavLink className="botao sutil icone esconder-celular" to="/ajuda" aria-label="Ajuda e acessibilidade" title="Ajuda"><Icone nome="ajuda" /></NavLink>
          </div>
        </div>

        <main className="conteudo" id="conteudo" tabIndex={-1} style={{ outline: 'none' }}>
          <Routes>
            <Route path="/" element={<Inicio perfil={perfil} />} />
            <Route path="/geoportal" element={<Geoportal />} />
            <Route path="/sala-de-situacao" element={<Sala />} />
            <Route path="/risco-territorial" element={<Risco />} />
            <Route path="/politicas-publicas" element={<Politicas />} />
            <Route path="/demandas" element={<Demandas />} />
            <Route path="/ater-virtual" element={<Ater />} />
            <Route path="/mercados" element={<Mercados />} />
            <Route path="/gestao" element={<Gestao />} />
            <Route path="/formacao" element={<Formacao />} />
            <Route path="/observatorio" element={<Observatorio />} />
            <Route path="/resultados" element={<Resultados />} />
            <Route path="/administracao" element={<Admin />} />
            <Route path="/ajuda" element={<Ajuda />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="rodape">
          <span>CITA-COOP — Centro de Inteligência Territorial Analítica em Cooperativas</span>
          <span>Fontes: Receita Federal (CNPJ), IBGE (malhas e Censo Agropecuário 2017)</span>
          <span>Versão 0.5 · protótipo TRL 4</span>
        </footer>
      </div>
    </div>
  )
}
