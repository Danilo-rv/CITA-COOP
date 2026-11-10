import { describe, it, expect } from 'vitest'
import * as c from '../src/lib/calc.js'

describe('distanciaKm', () => {
  it('é zero para o mesmo ponto', () => expect(c.distanciaKm(-16.68, -49.25, -16.68, -49.25)).toBe(0))
  it('Goiânia–Brasília fica perto de 173 km', () => {
    const d = c.distanciaKm(-16.6869, -49.2648, -15.7939, -47.8828)
    expect(d).toBeGreaterThan(165); expect(d).toBeLessThan(180)
  })
  it('é simétrica', () => expect(c.distanciaKm(0, 0, 10, 10)).toBeCloseTo(c.distanciaKm(10, 10, 0, 0), 6))
})

describe('ICPP', () => {
  const pesos = { cadastro: 1, credito: 1, ater: 1, pnae: 1, paa: 1, protecao: 1 }
  it('normaliza componentes pelo número de estabelecimentos familiares', () => {
    const k = c.componentesIcpp({ cadastro: 500, credito: 250, ater: 100, pnae: 15, paa: 50, protecao: 0 }, 1000)
    expect(k).toEqual({ cadastro: 0.5, credito: 0.25, ater: 0.1, pnae: 0.5, paa: 0.05, protecao: 0 })
  })
  it('limita componentes a 1 (cobertura acima de 100%)', () => {
    const k = c.componentesIcpp({ cadastro: 5000, pnae: 60 }, 1000)
    expect(k.cadastro).toBe(1); expect(k.pnae).toBe(1)
  })
  it('denominador zero não gera divisão por zero', () => {
    expect(c.componentesIcpp({ cadastro: 10 }, 0).cadastro).toBe(0)
  })
  it('média simples com pesos iguais', () => {
    expect(c.icpp({ cadastro: 1, credito: 1, ater: 0, pnae: 0, paa: 0, protecao: 0 }, pesos)).toBeCloseTo(2 / 6, 10)
  })
  it('respeita os pesos', () => {
    const v = c.icpp({ cadastro: 1, credito: 0, ater: 0, pnae: 0, paa: 0, protecao: 0 }, { ...pesos, cadastro: 5 })
    expect(v).toBeCloseTo(0.5, 10)
  })
  it('fica sempre entre 0 e 1', () => {
    expect(c.icpp({}, pesos)).toBe(0)
    expect(c.icpp({ cadastro: 9, credito: 9, ater: 9, pnae: 9, paa: 9, protecao: 9 }, pesos)).toBe(1)
  })
  it('pesos todos zero devolvem 0', () => {
    expect(c.icpp({ cadastro: 1 }, { cadastro: 0, credito: 0, ater: 0, pnae: 0, paa: 0, protecao: 0 })).toBe(0)
  })
  it('classifica faixas', () => {
    expect(c.faixaIcpp(0.8).nivel).toBe('bom'); expect(c.faixaIcpp(0.5).nivel).toBe('atencao'); expect(c.faixaIcpp(0.1).nivel).toBe('critico')
  })
})

describe('presença cooperativa', () => {
  it('densidade por 10 mil estabelecimentos', () => expect(c.densidadeCooperativa(5, 2000)).toBe(25))
  it('densidade com denominador zero', () => expect(c.densidadeCooperativa(5, 0)).toBe(0))
  it('vazio de atendimento', () => {
    expect(c.ehVazio(0, 800)).toBe(true); expect(c.ehVazio(1, 800)).toBe(false); expect(c.ehVazio(0, 100)).toBe(false)
    expect(c.ehVazio(0, 100, 50)).toBe(true)
  })
})

describe('IMGC', () => {
  const tudo = (v) => Object.fromEntries(c.DIMENSOES_IMGC.map((d) => [d.id, d.perguntas.map(() => v)]))
  it('tem 7 dimensões com 3 perguntas', () => {
    expect(c.DIMENSOES_IMGC).toHaveLength(7); c.DIMENSOES_IMGC.forEach((d) => expect(d.perguntas).toHaveLength(3))
  })
  it('nota máxima = 100 e mínima = 0', () => {
    expect(c.pontuarImgc(tudo(4)).geral).toBe(100); expect(c.pontuarImgc(tudo(0)).geral).toBe(0)
  })
  it('nota intermediária', () => expect(c.pontuarImgc(tudo(2)).geral).toBe(50))
  it('sem respostas devolve nulo e incompleto', () => {
    const r = c.pontuarImgc({}); expect(r.geral).toBeNull(); expect(r.completo).toBe(false); expect(r.respondidas).toBe(0)
  })
  it('respostas parciais contam só as dimensões respondidas', () => {
    const r = c.pontuarImgc({ governanca: [4, 4, 4] })
    expect(r.dimensoes.governanca).toBe(100); expect(r.dimensoes.financas).toBeNull(); expect(r.geral).toBe(100); expect(r.completo).toBe(false)
  })
  it('ignora valores inválidos', () => {
    const r = c.pontuarImgc({ governanca: [4, 9, -1] }); expect(r.dimensoes.governanca).toBe(100); expect(r.respondidas).toBe(1)
  })
  it('níveis de maturidade', () => {
    expect(c.nivelImgc(80).rotulo).toBe('Consolidada'); expect(c.nivelImgc(60).rotulo).toBe('Em desenvolvimento')
    expect(c.nivelImgc(30).rotulo).toBe('Inicial'); expect(c.nivelImgc(10).rotulo).toBe('Crítica'); expect(c.nivelImgc(null).nivel).toBe('neutro')
  })
})

describe('conformidade', () => {
  const hoje = new Date(2026, 10, 10)
  it('documento em dia', () => expect(c.statusDocumento('2027-03-01', hoje).nivel).toBe('bom'))
  it('documento a vencer em até 30 dias', () => {
    const s = c.statusDocumento('2026-11-25', hoje); expect(s.nivel).toBe('atencao'); expect(s.dias).toBe(15)
  })
  it('documento vencido', () => {
    const s = c.statusDocumento('2026-11-01', hoje); expect(s.nivel).toBe('critico'); expect(s.dias).toBe(-9)
  })
  it('vence hoje', () => expect(c.statusDocumento('2026-11-10', hoje).rotulo).toBe('Vence hoje'))
  it('sem data', () => expect(c.statusDocumento('', hoje).nivel).toBe('neutro'))
  it('semáforo geral mostra a pior situação', () => {
    expect(c.semaforoGeral([{ nivel: 'bom' }, { nivel: 'atencao' }])).toBe('atencao')
    expect(c.semaforoGeral([{ nivel: 'bom' }, { nivel: 'critico' }, { nivel: 'atencao' }])).toBe('critico')
    expect(c.semaforoGeral([{ nivel: 'bom' }])).toBe('bom'); expect(c.semaforoGeral([])).toBe('bom')
  })
})

describe('financeiro', () => {
  const base = { ativoCirculante: 200000, passivoCirculante: 100000, ativoTotal: 500000, passivoTotal: 200000, receita: 1000000, custos: 700000, despesas: 200000 }
  it('calcula indicadores', () => {
    const r = c.indicadoresFinanceiros(base)
    expect(r.liquidezCorrente).toBe(2); expect(r.endividamento).toBe(0.4); expect(r.margem).toBe(0.1)
    expect(r.capitalGiro).toBe(100000); expect(r.sobras).toBe(100000)
  })
  it('destina no mínimo 10% ao Fundo de Reserva e 5% ao FATES', () => {
    const r = c.indicadoresFinanceiros(base)
    expect(r.fundoReserva).toBe(10000); expect(r.fates).toBe(5000); expect(r.sobrasADisposicao).toBe(85000)
  })
  it('não aceita percentuais abaixo do mínimo legal', () => {
    const r = c.indicadoresFinanceiros({ ...base, pctReserva: 2, pctFates: 1 })
    expect(r.fundoReserva).toBe(10000); expect(r.fates).toBe(5000)
  })
  it('aceita percentuais maiores definidos no estatuto', () => {
    expect(c.indicadoresFinanceiros({ ...base, pctReserva: 20 }).fundoReserva).toBe(20000)
  })
  it('com perdas não há destinação', () => {
    const r = c.indicadoresFinanceiros({ ...base, custos: 900000 })
    expect(r.sobras).toBe(-100000); expect(r.fundoReserva).toBe(0); expect(r.fates).toBe(0); expect(r.sobrasADisposicao).toBe(0)
  })
  it('campos vazios não quebram', () => {
    const r = c.indicadoresFinanceiros({}); expect(r.liquidezCorrente).toBeNull(); expect(r.endividamento).toBeNull(); expect(r.margem).toBeNull()
  })
})

describe('demandas', () => {
  it('classifica por tema', () => {
    expect(c.classificarDemanda('Estamos com seca forte e a lavoura de milho está perdida').tema).toBe('clima')
    expect(c.classificarDemanda('Precisamos renovar o Pronaf no banco').tema).toBe('credito')
    expect(c.classificarDemanda('Queremos vender para a merenda escolar pelo PNAE').tema).toBe('mercado')
    expect(c.classificarDemanda('Nossa certidão venceu e o CAF está inativo').tema).toBe('documentos')
    expect(c.classificarDemanda('A estrada está intransitável para o caminhão').tema).toBe('infra')
  })
  it('ignora acentos e maiúsculas', () => expect(c.classificarDemanda('CRÉDITO negado').tema).toBe('credito'))
  it('texto sem termos conhecidos vai para outros', () => expect(c.classificarDemanda('bom dia').tema).toBe('outros'))
  it('detecta urgência', () => {
    expect(c.classificarDemanda('URGENTE: estamos sem água').prioridade).toBe('alta')
    expect(c.classificarDemanda('gostaria de um curso').prioridade).toBe('normal')
  })
})

describe('alertas', () => {
  const regras = [
    { id: 'seca', nome: 'Seca agrícola', nivel: 'critico', condicoes: [{ campo: 'ndvi', op: '<', valor: -0.1 }, { campo: 'chuva', op: '<', valor: -30 }] },
    { id: 'chuva', nome: 'Chuva extrema', nivel: 'atencao', condicoes: [{ campo: 'chuva', op: '>', valor: 80 }] },
  ]
  const obs = [
    { territorio: 'A', ndvi: -0.2, chuva: -50 }, { territorio: 'B', ndvi: -0.2, chuva: 10 },
    { territorio: 'C', ndvi: 0.1, chuva: 120 }, { territorio: 'D', ndvi: 0, chuva: 0 },
  ]
  it('dispara só quando todas as condições são verdadeiras', () => {
    const a = c.avaliarAlertas(obs, regras)
    expect(a.map((x) => x.territorio + ':' + x.regra)).toEqual(['A:seca', 'C:chuva'])
  })
  it('ordena do mais grave para o menos grave', () => expect(c.avaliarAlertas(obs.slice().reverse(), regras)[0].nivel).toBe('critico'))
  it('regra desativada não dispara', () => {
    expect(c.avaliarAlertas(obs, [{ ...regras[0], ativa: false }])).toHaveLength(0)
  })
})

describe('formatação', () => {
  it('CNPJ e CEP', () => { expect(c.fmtCnpj('01234567000189')).toBe('01.234.567/0001-89'); expect(c.fmtCep('74000000')).toBe('74000-000') })
  it('nome em formato de título', () => expect(c.tituloNome('COOPERATIVA DE PRODUTORES DO VALE LTDA')).toBe('Cooperativa de Produtores do Vale LTDA'))
  it('valores ausentes viram travessão', () => { expect(c.fmtInt(null)).toBe('—'); expect(c.fmtPct(null)).toBe('—') })
  it('percentual', () => expect(c.fmtPct(0.256)).toBe('25,6%'))
})
