import { useState } from 'react'
import { Cabecalho, Cartao, Origem, Aviso, Nivel, Icone } from '../components/ui.jsx'
import { BarrasH } from '../components/charts.jsx'
import { useLocal } from '../lib/store.js'
import { classificarDemanda, TEMAS_DEMANDA } from '../lib/calc.js'
import { UFS } from '../lib/dados.js'

const ETAPAS = [{ id: 'nova', nome: 'Nova' }, { id: 'classificada', nome: 'Classificada' }, { id: 'encaminhada', nome: 'Encaminhada' }, { id: 'resolvida', nome: 'Resolvida' }]
const DESTINO = { clima: 'Defesa Civil e ATER local', credito: 'Agente financeiro / Pronaf', mercado: 'Núcleo de Mercados', documentos: 'Núcleo de Assessoria em Gestão', ater: 'Escritório de ATER', infra: 'Prefeitura / Estado', gestao: 'Núcleo de Assessoria em Gestão', outros: 'Equipe do Centro' }
const EXEMPLOS = [
  { id: 'ex1', titulo: 'Veranico atingiu a lavoura de milho', texto: 'Estamos com seca há 30 dias e a lavoura de milho dos cooperados está comprometida. Urgente.', autor: 'Cooperativa (exemplo)', uf: 'GO', municipio: 'Município de exemplo', etapa: 'classificada', exemplo: true },
  { id: 'ex2', titulo: 'Certidão vencida impediu venda', texto: 'Perdemos a chamada pública do PNAE porque a certidão do FGTS estava vencida.', autor: 'Cooperativa (exemplo)', uf: 'BA', municipio: 'Município de exemplo', etapa: 'encaminhada', exemplo: true },
  { id: 'ex3', titulo: 'Precisamos de visita técnica', texto: 'Os cooperados pedem orientação de um técnico sobre manejo de pragas na horta.', autor: 'Associado (exemplo)', uf: 'PR', municipio: 'Município de exemplo', etapa: 'nova', exemplo: true },
].map((d) => ({ ...d, ...classificarDemanda(d.titulo + ' ' + d.texto) }))

export default function Demandas() {
  const [demandas, setDemandas] = useLocal('demandas', EXEMPLOS)
  const [f, setF] = useState({ titulo: '', texto: '', autor: '', uf: 'GO', municipio: '' })
  const previa = f.texto.length > 8 ? classificarDemanda(f.titulo + ' ' + f.texto) : null
  const enviar = (e) => {
    e.preventDefault()
    if (!f.titulo.trim() || !f.texto.trim()) return
    setDemandas([{ ...f, id: 'd' + Date.now(), etapa: 'classificada', criada: new Date().toISOString().slice(0, 10), ...classificarDemanda(f.titulo + ' ' + f.texto) }, ...demandas])
    setF({ titulo: '', texto: '', autor: '', uf: f.uf, municipio: '' })
  }
  const mover = (id, dir) => setDemandas(demandas.map((d) => {
    if (d.id !== id) return d
    const i = ETAPAS.findIndex((x) => x.id === d.etapa)
    return { ...d, etapa: ETAPAS[Math.max(0, Math.min(ETAPAS.length - 1, i + dir))].id }
  }))
  const porTema = [...TEMAS_DEMANDA, { id: 'outros', nome: 'Outros assuntos' }].map((t) => ({ nome: t.nome, valor: demandas.filter((d) => d.tema === t.id).length })).filter((x) => x.valor).sort((a, b) => b.valor - a.valor)
  return (
    <>
      <Cabecalho sobre="Serviços" titulo="Demandas" acoes={<Origem tipo="local" />}>
        Registre uma dor ou necessidade da cooperativa. O sistema identifica o tema, sugere para quem encaminhar e acompanha até a solução.
      </Cabecalho>

      <div className="grade g2" style={{ marginBottom: 20 }}>
        <Cartao titulo="Registrar demanda">
          <form onSubmit={enviar} className="pilha p" data-teste="form-demanda">
            <label className="campo">Título<input required value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} placeholder="Resuma em uma frase" data-teste="demanda-titulo" /></label>
            <label className="campo">O que está acontecendo?<textarea required value={f.texto} onChange={(e) => setF({ ...f, texto: e.target.value })} placeholder="Descreva a situação com suas palavras" data-teste="demanda-texto" /></label>
            <div className="grade gform">
              <label className="campo">Quem registra<input value={f.autor} onChange={(e) => setF({ ...f, autor: e.target.value })} placeholder="Cooperativa ou pessoa" /></label>
              <label className="campo">Estado<select value={f.uf} onChange={(e) => setF({ ...f, uf: e.target.value })}>{UFS.map((u) => <option key={u}>{u}</option>)}</select></label>
              <label className="campo">Município<input value={f.municipio} onChange={(e) => setF({ ...f, municipio: e.target.value })} /></label>
            </div>
            {previa && (
              <div className="aviso" data-teste="previa-classificacao"><Icone nome="check" tamanho={18} /><div>Tema identificado: <b>{previa.nomeTema}</b>{previa.prioridade === 'alta' && <> · <b>prioridade alta</b></>}<br />Encaminhamento sugerido: {DESTINO[previa.tema]}</div></div>
            )}
            <div className="linha fim"><button className="botao primario" type="submit"><Icone nome="enviar" tamanho={17} />Registrar</button></div>
          </form>
        </Cartao>
        <Cartao titulo="Demandas por tema" sub={`${demandas.length} demanda${demandas.length === 1 ? '' : 's'} registrada${demandas.length === 1 ? '' : 's'}`} acoes={<button className="botao sutil" onClick={() => setDemandas([])}>Limpar tudo</button>}>
          {porTema.length ? <BarrasH itens={porTema} /> : <div className="vazio">Ainda não há demandas.</div>}
          <div style={{ marginTop: 14 }}><Aviso>A classificação automática usa regras de palavras-chave nesta fase. O uso de inteligência artificial e a entrada por WhatsApp são etapas seguintes.</Aviso></div>
        </Cartao>
      </div>

      <div className="quadro" data-teste="quadro">
        {ETAPAS.map((et, ei) => {
          const itens = demandas.filter((d) => d.etapa === et.id)
          return (
            <div className="coluna" key={et.id} data-etapa={et.id}>
              <h3>{et.nome}<span className="num">{itens.length}</span></h3>
              {itens.map((d) => (
                <article className="ficha" key={d.id}>
                  <b>{d.titulo}</b>
                  <p>{d.texto}</p>
                  <div className="linha">
                    <span className="etiqueta">{d.nomeTema}</span>
                    {d.prioridade === 'alta' && <Nivel nivel="critico">Prioridade alta</Nivel>}
                    {d.exemplo && <Origem tipo="demo">Exemplo</Origem>}
                  </div>
                  <p style={{ marginTop: 6 }}>{[d.autor, d.municipio, d.uf].filter(Boolean).join(' · ')}</p>
                  <p>Encaminhar para: {DESTINO[d.tema]}</p>
                  <div className="linha">
                    {ei > 0 && <button className="botao" onClick={() => mover(d.id, -1)} aria-label={`Voltar "${d.titulo}" para ${ETAPAS[ei - 1].nome}`}>← Voltar</button>}
                    {ei < ETAPAS.length - 1 && <button className="botao" onClick={() => mover(d.id, 1)} aria-label={`Avançar "${d.titulo}" para ${ETAPAS[ei + 1].nome}`}>Avançar →</button>}
                  </div>
                </article>
              ))}
            </div>
          )
        })}
      </div>
    </>
  )
}
