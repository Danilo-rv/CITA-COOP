import { useEffect, useRef, useState } from 'react'
import { Cabecalho, Cartao, Origem, Aviso, Icone } from '../components/ui.jsx'
import { useLocal } from '../lib/store.js'
import { semAcento } from '../lib/calc.js'

// Base de conhecimento inicial. Em produção, o conteúdo virá da Embrapa e das Emater, com revisão técnica.
export const BASE = [
  { id: 'pnae', pergunta: 'Como vender para a merenda escolar (PNAE)?', termos: ['pnae', 'merenda', 'escola', 'alimentacao escolar'],
    resposta: 'O PNAE compra da agricultura familiar por chamada pública, sem licitação. A Lei 11.947/2009 reserva uma parcela mínima dos recursos repassados pelo FNDE para essas compras (30% no texto original; confirme o percentual vigente no FNDE).\n\nPara participar, a cooperativa precisa de CAF Jurídico ativo, documentação fiscal em dia e um projeto de venda. Acompanhe as chamadas da prefeitura e da secretaria de educação do estado.',
    fonte: 'Lei 11.947/2009; resoluções do FNDE' },
  { id: 'caf', pergunta: 'O que é o CAF e quem precisa?', termos: ['caf', 'dap', 'cadastro'],
    resposta: 'O CAF (Cadastro Nacional da Agricultura Familiar) substituiu a DAP e identifica quem é da agricultura familiar para acessar as políticas públicas. Existe o CAF da unidade familiar e o CAF Jurídico, para cooperativas e associações.\n\nA inscrição é feita em entidades credenciadas, como sindicatos e escritórios de ATER.',
    fonte: 'MDA — Cadastro Nacional da Agricultura Familiar' },
  { id: 'ago', pergunta: 'Qual o prazo da Assembleia Geral Ordinária?', termos: ['ago', 'assembleia', 'prestacao de contas'],
    resposta: 'A Assembleia Geral Ordinária deve ser realizada todo ano, nos três primeiros meses após o fim do exercício social. Nela os cooperados deliberam sobre a prestação de contas, a destinação das sobras e a eleição dos conselhos, quando for o caso.',
    fonte: 'Lei 5.764/1971, art. 44' },
  { id: 'fundos', pergunta: 'Quanto das sobras vai para os fundos obrigatórios?', termos: ['fates', 'fundo', 'reserva', 'sobras'],
    resposta: 'A lei exige no mínimo 10% das sobras líquidas para o Fundo de Reserva e no mínimo 5% para o FATES (Fundo de Assistência Técnica, Educacional e Social). O estatuto pode fixar percentuais maiores. O restante fica à disposição da assembleia.',
    fonte: 'Lei 5.764/1971, art. 28' },
  { id: 'zarc', pergunta: 'Qual a melhor época para plantar?', termos: ['plantar', 'plantio', 'zarc', 'epoca', 'zoneamento'],
    resposta: 'O Zoneamento Agrícola de Risco Climático (ZARC) indica, para cada município, cultura e tipo de solo, as janelas de plantio com menor risco de perda por clima. Seguir o ZARC também é condição para o seguro rural e o Proagro. Consulte as portarias do MAPA ou o aplicativo Plantio Certo, da Embrapa.',
    fonte: 'MAPA / Embrapa — ZARC' },
  { id: 'pronaf', pergunta: 'Como acessar o crédito do Pronaf?', termos: ['pronaf', 'credito', 'financiamento', 'emprestimo'],
    resposta: 'O Pronaf financia custeio e investimento da agricultura familiar com juros menores. É preciso ter CAF ativo e apresentar um projeto ou proposta ao banco ou cooperativa de crédito. O técnico de ATER pode ajudar a elaborar o projeto.',
    fonte: 'Manual de Crédito Rural — Banco Central' },
  { id: 'paa', pergunta: 'O que é o PAA?', termos: ['paa', 'aquisicao de alimentos', 'compra institucional'],
    resposta: 'O Programa de Aquisição de Alimentos compra produtos da agricultura familiar para doar a pessoas em insegurança alimentar e para abastecer órgãos públicos. A cooperativa pode participar por meio de propostas à Conab ou de editais de estados e municípios.',
    fonte: 'MDS / Conab' },
]

export function responder(texto) {
  const t = semAcento(texto)
  let melhor = null
  for (const item of BASE) {
    const n = item.termos.filter((k) => t.includes(k)).length
    if (n && (!melhor || n > melhor.n)) melhor = { item, n }
  }
  return melhor?.item || null
}

export default function Ater() {
  const [msgs, setMsgs] = useLocal('ater:conversa', [{ de: 'bot', texto: 'Olá! Sou o assistente de orientação do CITA-COOP. Posso responder dúvidas sobre políticas públicas, gestão e produção. Se eu não souber, encaminho para um técnico.' }])
  const [fila, setFila] = useLocal('ater:fila', [])
  const [txt, setTxt] = useState('')
  const fim = useRef(null)
  useEffect(() => { fim.current?.scrollIntoView({ block: 'nearest' }) }, [msgs])
  const perguntar = (pergunta) => {
    if (!pergunta.trim()) return
    const r = responder(pergunta)
    const novas = [...msgs, { de: 'eu', texto: pergunta }]
    if (r) novas.push({ de: 'bot', texto: r.resposta, fonte: r.fonte })
    else {
      novas.push({ de: 'bot', texto: 'Ainda não tenho uma resposta segura para isso. Encaminhei sua pergunta para a fila de um técnico de ATER.' })
      setFila([{ id: Date.now(), pergunta, quando: new Date().toLocaleString('pt-BR'), situacao: 'Aguardando técnico' }, ...fila])
    }
    setMsgs(novas); setTxt('')
  }
  return (
    <>
      <Cabecalho sobre="Serviços" titulo="ATER Virtual" acoes={<Origem tipo="local" />}>
        Orientação rápida para cooperados e dirigentes. A ATER virtual complementa o técnico presencial, não o substitui: o que o assistente não resolve vai para a fila de atendimento humano.
      </Cabecalho>
      <div className="grade g2">
        <Cartao titulo="Conversa">
          <div className="conversa">
            <div className="mensagens" aria-live="polite" data-teste="mensagens">
              {msgs.map((m, i) => <div key={i} className={`msg ${m.de}`}>{m.texto}{m.fonte && <small>Fonte: {m.fonte}</small>}</div>)}
              <div ref={fim} />
            </div>
            <div className="sugestoes">{BASE.slice(0, 5).map((b) => <button key={b.id} onClick={() => perguntar(b.pergunta)}>{b.pergunta}</button>)}</div>
            <form className="linha" style={{ flexWrap: 'nowrap' }} onSubmit={(e) => { e.preventDefault(); perguntar(txt) }}>
              <input className="entrada" value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="Escreva sua dúvida" aria-label="Escreva sua dúvida" data-teste="ater-entrada" />
              <button className="botao primario" type="submit" aria-label="Enviar"><Icone nome="enviar" tamanho={17} /></button>
            </form>
          </div>
        </Cartao>
        <div className="pilha">
          <Cartao titulo="Fila para o técnico" sub="Perguntas que o assistente não soube responder." acoes={fila.length > 0 && <button className="botao sutil" onClick={() => setFila([])}>Limpar</button>}>
            {fila.length === 0 ? <div className="vazio">Nenhuma pergunta aguardando.</div> : (
              <div className="pilha p" data-teste="fila">{fila.map((f) => (
                <div className="ficha" key={f.id} style={{ marginBottom: 0 }}><b>{f.pergunta}</b><p>{f.quando} · {f.situacao}</p></div>
              ))}</div>
            )}
          </Cartao>
          <Cartao titulo="Base de conhecimento" sub={`${BASE.length} temas com fonte indicada`}>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: '.88rem', color: 'var(--texto-2)' }}>{BASE.map((b) => <li key={b.id}>{b.pergunta}</li>)}</ul>
          </Cartao>
          <Aviso>Nesta fase o assistente responde por regras, a partir de uma base curada. A entrada por WhatsApp, o diagnóstico por foto e o uso de IA com conteúdo da Embrapa e das Emater são etapas seguintes. <button className="botao sutil" style={{ minHeight: 0, padding: '0 4px' }} onClick={() => setMsgs(msgs.slice(0, 1))}>Reiniciar conversa</button></Aviso>
        </div>
      </div>
    </>
  )
}
