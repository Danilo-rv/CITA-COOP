import { useEffect, useRef } from 'react'

const TRACOS = {
  inicio: 'M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10',
  mapa: 'M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4Zm0 0v14m6-12v14',
  radar: 'M12 12 19 5M12 3a9 9 0 1 0 9 9M12 7a5 5 0 1 0 5 5',
  politicas: 'M4 20V10m5.5 10V4M15 20v-7m5.5 7V8',
  demandas: 'M4 5h16v11H9l-5 4V5Zm4 4h8m-8 3.5h5',
  ater: 'M12 20v-8m0 0c0-4 3-7 8-7 0 5-3 8-8 7Zm0 2c0-3-2.5-5.5-7-5.5 0 4 2.5 6.5 7 5.5Z',
  mercados: 'M4 8h16l-1.5 11h-13L4 8Zm4 0a4 4 0 0 1 8 0',
  gestao: 'M4 20h16M6 20V9l6-5 6 5v11M10 20v-6h4v6',
  formacao: 'M2.5 9 12 4.5 21.5 9 12 13.5 2.5 9Zm4 2.5V16c1.5 1.5 3.5 2 5.5 2s4-.5 5.5-2v-4.5',
  observatorio: 'M4 6c0-1.5 3.5-2.5 8-2.5S20 4.5 20 6s-3.5 2.5-8 2.5S4 7.5 4 6Zm0 0v12c0 1.5 3.5 2.5 8 2.5s8-1 8-2.5V6M4 12c0 1.5 3.5 2.5 8 2.5s8-1 8-2.5',
  resultados: 'M12 3v9l6.5 6.5M12 3a9 9 0 1 0 9 9',
  admin: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.5-3 1.5-1-2-3.5-1.8.700a7 7 0 0 0-1.7-1L15 5h-4l-.5 2.2a7 7 0 0 0-1.7 1L7 7.5 5 11l1.5 1L5 13l2 3.5 1.8-.7a7 7 0 0 0 1.7 1L11 19h4l.5-2.2a7 7 0 0 0 1.7-1l1.8.700 2-3.5-1.5-1Z',
  ajuda: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-2.5-11.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7m0 2.5v.1',
  busca: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5-2 4.5 4.5',
  menu: 'M4 7h16M4 12h16M4 17h16',
  fechar: 'M6 6l12 12M18 6 6 18',
  sol: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0-13v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4',
  lua: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z',
  contraste: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-18v18',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-10v6m0-9v.1',
  baixar: 'M12 4v11m0 0 4.5-4.5M12 15l-4.5-4.5M5 19.5h14',
  seta: 'M5 12h14m0 0-5.5-5.5M19 12l-5.5 5.5',
  mais: 'M12 5v14M5 12h14',
  alerta: 'M12 4 2.5 20h19L12 4Zm0 6v5m0 2.5v.1',
  check: 'M5 12.5 10 17.5 19.5 7',
  doc: 'M7 3h7l4 4v14H7V3Zm7 0v4h4M9.5 12h5m-5 3.5h5',
  pin: 'M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  enviar: 'M4 12 20 4l-5 16-3.5-6.5L4 12Z',
}

export function Icone({ nome, tamanho = 20 }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={TRACOS[nome] || TRACOS.info} />
    </svg>
  )
}

export function Cabecalho({ sobre, titulo, children, acoes }) {
  return (
    <header className="cabecalho">
      <div>
        {sobre && <span className="sobretitulo">{sobre}</span>}
        <h1>{titulo}</h1>
        {children && <p>{children}</p>}
      </div>
      {acoes && <div className="linha">{acoes}</div>}
    </header>
  )
}

/** Etiqueta que informa a origem do que está na tela: dado real, registro local ou demonstração. */
export function Origem({ tipo = 'real', children }) {
  const txt = { real: 'Dados reais', demo: 'Demonstração', local: 'Registro local' }[tipo]
  return <span className={`etiqueta ${tipo === 'real' ? 'real' : 'demo'}`} title={children || txt}>{tipo === 'real' && <i className="ponto bom" />}{children || txt}</span>
}

export function Cartao({ titulo, sub, origem, acoes, children, className = '', ...resto }) {
  return (
    <section className={`cartao ${className}`} {...resto}>
      {(titulo || origem || acoes) && (
        <div className="cartao-topo">
          <div>
            {titulo && <h2>{titulo}</h2>}
            {sub && <p className="sub" style={{ marginBottom: 0, marginTop: 4 }}>{sub}</p>}
          </div>
          <div className="linha" style={{ flexWrap: 'nowrap' }}>{origem}{acoes}</div>
        </div>
      )}
      {children}
    </section>
  )
}

export function Indicador({ rotulo, valor, nota, origem }) {
  return (
    <div className="cartao indicador">
      <span className="rot">{rotulo}</span>
      <span className="val num">{valor}</span>
      {nota && <span className="nota">{nota}</span>}
      {origem}
    </div>
  )
}

export function Aviso({ children, icone = 'info' }) {
  return <div className="aviso" role="note"><Icone nome={icone} tamanho={18} /><div>{children}</div></div>
}

export function Nivel({ nivel, children }) {
  return <span className={`etiqueta ${nivel}`}><i className={`ponto ${nivel}`} />{children}</span>
}

export function Abas({ abas, atual, aoMudar }) {
  return (
    <div className="abas" role="tablist">
      {abas.map((a) => (
        <button key={a.id} role="tab" aria-selected={atual === a.id} onClick={() => aoMudar(a.id)}>{a.nome}</button>
      ))}
    </div>
  )
}

export function Modal({ titulo, aoFechar, children }) {
  const ref = useRef(null)
  useEffect(() => {
    const anterior = document.activeElement
    ref.current?.focus()
    const tecla = (e) => e.key === 'Escape' && aoFechar()
    document.addEventListener('keydown', tecla)
    return () => { document.removeEventListener('keydown', tecla); anterior?.focus?.() }
  }, [aoFechar])
  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={titulo} tabIndex={-1} ref={ref}>
        <div className="linha" style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'nowrap' }}>
          <h2 style={{ fontSize: '1.2rem' }}>{titulo}</h2>
          <button className="botao icone sutil" onClick={aoFechar} aria-label="Fechar"><Icone nome="fechar" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Carregando({ erro }) {
  if (erro) return <div className="vazio" role="alert">Não foi possível carregar os dados. {String(erro.message || erro)}</div>
  return <div className="vazio" role="status">Carregando dados…</div>
}
