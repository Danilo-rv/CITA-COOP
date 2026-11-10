// Persistência local (navegador). No protótipo TRL 4 os registros criados pelo usuário
// ficam no próprio dispositivo; a gravação em banco (Supabase/PostGIS) é etapa do TRL 5.
import { useCallback, useEffect, useState } from 'react'

const PREFIXO = 'citacoop:'

export function ler(chave, padrao) {
  try {
    const v = localStorage.getItem(PREFIXO + chave)
    return v == null ? padrao : JSON.parse(v)
  } catch { return padrao }
}
export function gravar(chave, valor) {
  try { localStorage.setItem(PREFIXO + chave, JSON.stringify(valor)) } catch { /* armazenamento indisponível */ }
}

export function useLocal(chave, padrao) {
  const [valor, setValor] = useState(() => ler(chave, padrao))
  useEffect(() => { gravar(chave, valor) }, [chave, valor])
  const limpar = useCallback(() => setValor(padrao), [padrao])
  return [valor, setValor, limpar]
}
