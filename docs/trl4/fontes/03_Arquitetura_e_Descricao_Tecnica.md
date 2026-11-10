# 1. Visão geral

A plataforma é formada por três blocos: as **rotinas de carga**, que buscam e tratam os dados das fontes oficiais; a **base publicada**, um conjunto de arquivos gerados por essas rotinas; e a **aplicação web**, que o usuário abre no navegador.

```
 FONTES OFICIAIS              ROTINAS DE CARGA (Python)              BASE PUBLICADA            APLICAÇÃO WEB
 Receita Federal (CNPJ) ──►  cooperativas_cnpj.py                                              React + Vite
 IBGE (malha municipal) ──►  municipios_ibge.py                      app/public/dados/         13 telas
 IBGE (SIDRA 6778)      ──►  geocodificar_cooperativas.py  ──►       resumo, municípios,  ──►  mapa (Leaflet)
 Receita (CNAE)         ──►  gerar_dados_app.py                      cooperativas por UF,      gráficos (SVG)
                             validar_dados.py (conferência)          demografia, malha         acessibilidade
```

No TRL 4 a aplicação lê arquivos estáticos e guarda no navegador o que o usuário registra. O banco de dados central está projetado (seção 5) e será implantado no TRL 5.

# 2. Componentes

| Componente | Função | Tecnologia | Local no repositório |
|---|---|---|---|
| Carga do CNPJ | Baixa os arquivos da Receita, filtra a natureza jurídica 214-3 e extrai os estabelecimentos | Python 3 | `scripts/etl/cooperativas_cnpj.py` |
| Municípios | Calcula um ponto representativo para cada município a partir da malha do IBGE | Python, pyshp, shapely | `scripts/etl/municipios_ibge.py` |
| Geocodificação | Liga cada cooperativa ao município (UF + nome) e grava a precisão obtida | Python | `scripts/etl/geocodificar_cooperativas.py` |
| Geração da base publicada | Agrega por município, UF e ramo; busca o Censo; simplifica a malha | Python | `scripts/etl/gerar_dados_app.py` |
| Validação dos dados | Conferências automáticas da base | Python | `scripts/etl/validar_dados.py` |
| Biblioteca de cálculo | ICPP, IMGC, regularidade, finanças, classificação, alertas, distância | JavaScript | `app/src/lib/calc.js` |
| Interface | 13 telas, menu por perfil, acessibilidade | React 18, React Router | `app/src/` |
| Mapa | Mapa interativo com círculos por município | Leaflet 1.9 | `app/src/pages/Geoportal.jsx` |
| Gráficos | Barras, linhas, colunas e radar | SVG próprio | `app/src/components/charts.jsx` |
| Acessibilidade em Libras | Tradução para Libras | VLibras (gov.br) | `app/index.html` |
| Testes | Unitários e de ponta a ponta | Vitest, Playwright, node:test | `app/tests/`, `app/e2e/` |

# 3. Telas e integração entre módulos

| Tela | Rota | Usa a base publicada |
|---|---|---|
| Início | `/` | resumo |
| Geoportal | `/geoportal` | municípios, malha, cooperativas por UF, índice de busca, CNAE |
| Sala de Situação | `/sala-de-situacao` | — (cenário ilustrativo) |
| Políticas Públicas | `/politicas-publicas` | municípios |
| Demandas | `/demandas` | — |
| ATER Virtual | `/ater-virtual` | — |
| Mercados | `/mercados` | municípios, cooperativas por UF |
| Gestão Cooperativa | `/gestao` | — |
| Formação | `/formacao` | — |
| Observatório | `/observatorio` | demografia, resumo, catálogo |
| Resultados | `/resultados` | resumo e registros locais |
| Administração | `/administracao` | catálogo |
| Ajuda e acessibilidade | `/ajuda` | — |

A integração acontece pela **base territorial comum**: o mesmo código de município (IBGE) liga cooperativas, estabelecimentos do Censo, distâncias e indicadores. Assim, o município selecionado no Geoportal, o comprador escolhido em Mercados e o território do ICPP referem-se à mesma entidade.

# 4. Fluxo de dados da base de cooperativas

1. **Extração.** Os dez arquivos *Empresas* são lidos em fluxo; ficam os CNPJ com natureza jurídica 214-3 (cooperativa).
2. **Junção.** Os dez arquivos *Estabelecimentos* são lidos e ficam os registros desses CNPJ, com endereço, CNAE e situação.
3. **Robustez.** Cada arquivo é baixado com retomada e o resultado parcial é guardado; uma nova execução continua de onde parou. Arquivos ZIP64 são tratados.
4. **Geocodificação.** O código de município da Receita é convertido em nome e ligado ao IBGE por UF e nome normalizado; treze grafias divergentes são resolvidas por uma tabela de equivalências.
5. **Publicação.** Apenas as cooperativas ativas são publicadas; telefone e e-mail são descartados.
6. **Conferência.** O script de validação verifica a base antes da publicação (documento 5).

# 5. Banco de dados projetado

O esquema em `supabase/schema.sql` (PostgreSQL com PostGIS) prevê as tabelas `municipio`, `cooperativa`, `fonte_dados`, `carga_dados`, `demanda`, `diagnostico_imgc`, `documento_regularidade` e `icpp_municipio`, com índices espaciais e segurança por linha para os dados individuais. **O esquema ainda não foi aplicado**; a implantação é atividade do TRL 5.

# 6. Segurança e proteção de dados

- A plataforma publica apenas dados de **pessoas jurídicas** e agregados territoriais de fontes abertas.
- Telefone e e-mail presentes no CNPJ **não são publicados** (verificado automaticamente).
- Nenhum dado pessoal de cooperados é coletado ou armazenado em servidor nesta versão.
- Os registros do usuário ficam no armazenamento local do navegador e podem ser apagados na tela Administração.
- A consulta do CAF, protegida por captcha, **não foi automatizada**; o acesso dependerá de acordo com o MDA ou de pedido via Lei de Acesso à Informação.

# 7. Como reproduzir

```
# 1. Dados (opcional: os arquivos publicados já estão no repositório)
python3 scripts/etl/cooperativas_cnpj.py 2026-10
python3 scripts/etl/municipios_ibge.py <pasta>/BR_Municipios_2022.shp
python3 scripts/etl/geocodificar_cooperativas.py
python3 scripts/etl/gerar_dados_app.py <pasta> 2026-10
python3 scripts/etl/validar_dados.py

# 2. Aplicação
cd app
npm install
npm run build && npm run preview      # http://localhost:4173

# 3. Testes
npm test                              # testes unitários
npm run test:e2e                      # testes de ponta a ponta (com a aplicação em execução)
```

# 8. Ambiente utilizado

```
{{arquivo:ambiente.txt}}
```
