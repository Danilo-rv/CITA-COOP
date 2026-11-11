import { useEffect, useState } from 'react'

export const cssVar = (nome) => getComputedStyle(document.documentElement).getPropertyValue(nome).trim()
export const ehEscuro = () => document.documentElement.dataset.theme === 'dark' || document.documentElement.dataset.contraste === 'alto'

/** Muda de valor sempre que o tema (claro, escuro ou alto contraste) muda, para redesenhar mapas e gráficos. */
export function useTemaVersao() {
  const [v, setV] = useState(0)
  useEffect(() => {
    const o = new MutationObserver(() => setV((x) => x + 1))
    o.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-contraste'] })
    return () => o.disconnect()
  }, [])
  return v
}
