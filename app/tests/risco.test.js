import { describe, it, expect } from 'vitest'
import * as r from '../src/lib/risco.js'

describe('limites por quantil', () => {
  it('divide valores uniformes em classes de tamanho parecido', () => {
    const cortes = r.limitesPorQuantil(Array.from({ length: 100 }, (_, i) => i + 1), 4)
    expect(cortes).toHaveLength(3)
    expect(cortes[1]).toBeCloseTo(50.5, 5)
  })
  it('ignora nulos e NaN', () => expect(r.limitesPorQuantil([null, NaN, 1, 2, 3, 4], 2)).toEqual([2.5]))
  it('remove cortes repetidos quando há muitos zeros', () => {
    const cortes = r.limitesPorQuantil([0, 0, 0, 0, 0, 0, 0, 0, 5, 9], 5)
    expect(cortes.length).toBeLessThan(4); expect(cortes).toEqual([...cortes].sort((a, b) => a - b))
    expect(new Set(cortes).size).toBe(cortes.length); expect(cortes.every((c) => c > 0)).toBe(true)
  })
  it('lista vazia ou constante não gera cortes', () => { expect(r.limitesPorQuantil([], 5)).toEqual([]); expect(r.limitesPorQuantil([3, 3, 3], 5)).toEqual([]) })
})

describe('classe', () => {
  const c = [10, 20, 30]
  it('atribui a classe pelo corte', () => { expect(r.classeDe(5, c)).toBe(0); expect(r.classeDe(15, c)).toBe(1); expect(r.classeDe(25, c)).toBe(2); expect(r.classeDe(99, c)).toBe(3) })
  it('valor igual ao corte vai para a classe de cima', () => expect(r.classeDe(10, c)).toBe(1))
  it('sem dado devolve -1', () => { expect(r.classeDe(null, c)).toBe(-1); expect(r.classeDe(NaN, c)).toBe(-1) })
})

describe('percentis', () => {
  it('menor valor = 0 e maior = 100', () => expect(r.percentis([10, 20, 30])).toEqual([0, 50, 100]))
  it('empates recebem o posto médio', () => expect(r.percentis([5, 5, 5, 10])[0]).toBeCloseTo(100 / 3, 5))
  it('nulos continuam nulos', () => expect(r.percentis([1, null, 3])).toEqual([0, null, 100]))
  it('um só valor fica em 50', () => expect(r.percentis([7])).toEqual([50]))
  it('lista sem valores', () => expect(r.percentis([null, NaN])).toEqual([null, null]))
  it('mantém a ordem da lista original', () => expect(r.percentis([30, 10, 20])).toEqual([100, 0, 50]))
})

describe('estatística simples', () => {
  it('mediana de quantidade par e ímpar', () => { expect(r.mediana([1, 3, 2])).toBe(2); expect(r.mediana([1, 2, 3, 4])).toBe(2.5); expect(r.mediana([])).toBeNull() })
  it('média ignora nulos', () => { expect(r.media([2, 4, null])).toBe(3); expect(r.media([null])).toBeNull() })
})

describe('nota de prioridade', () => {
  const pesos = { des: 1, ivs: 1, hid: 1, coop: 1 }
  it('média simples quando os pesos são iguais', () => expect(r.notaPrioridade({ des: 100, ivs: 50, hid: 0, coop: 50 }, pesos)).toBe(50))
  it('respeita os pesos', () => expect(r.notaPrioridade({ des: 100, ivs: 0, hid: 0, coop: 0 }, { ...pesos, des: 3 })).toBe(50))
  it('reescala os pesos quando falta um componente', () => expect(r.notaPrioridade({ des: 90, ivs: 60, hid: 30, coop: null }, pesos)).toBe(60))
  it('com menos de 3 componentes não há nota', () => expect(r.notaPrioridade({ des: 90, ivs: 60, hid: null, coop: null }, pesos)).toBeNull())
  it('pesos todos zero não geram nota', () => expect(r.notaPrioridade({ des: 90, ivs: 60, hid: 30, coop: 10 }, { des: 0, ivs: 0, hid: 0, coop: 0 })).toBeNull())
  it('fica entre 0 e 100', () => { const n = r.notaPrioridade({ des: 100, ivs: 100, hid: 100, coop: 100 }, pesos); expect(n).toBe(100) })
})

describe('cores e formatação', () => {
  it('rampa tem o número pedido de cores e inverte no escuro', () => {
    const c = r.rampa(5); expect(c).toHaveLength(5); expect(r.rampa(5, true)).toEqual([...c].reverse())
  })
  it('rampa de uma classe', () => expect(r.rampa(1)).toHaveLength(1))
  it('valores em reais', () => { expect(r.fmtReais(2.5e9)).toBe('R$ 2,5 bi'); expect(r.fmtReais(3.2e6)).toBe('R$ 3,2 mi'); expect(r.fmtReais(1500)).toBe('R$ 2 mil'); expect(r.fmtReais(null)).toBe('—') })
  it('formata com unidade e casas decimais', () => {
    expect(r.formatar({ dec: 1, unidade: '%' }, 12.34)).toBe('12,3 %'); expect(r.formatar({ unidade: 'hab.' }, 1500)).toBe('1.500 hab.'); expect(r.formatar({}, null)).toBe('—')
  })
})

describe('catálogo de indicadores', () => {
  it('ids únicos e todos os temas existem', () => {
    expect(new Set(r.INDICADORES.map((i) => i.id)).size).toBe(r.INDICADORES.length)
    const temas = new Set(r.TEMAS.map((t) => t.id)); expect(r.INDICADORES.every((i) => temas.has(i.tema))).toBe(true)
  })
  it('todo indicador tem rótulo e coluna', () => expect(r.INDICADORES.every((i) => i.rotulo && i.col)).toBe(true))
})
