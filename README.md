# CITA-COOP

**Centro de Inteligência Territorial Analítica em Cooperativas** — plataforma web que reúne as cooperativas do Brasil, a agricultura familiar e as políticas públicas para apoiar decisões territoriais.

Versão 0.4 · protótipo validado em laboratório (**TRL 4**).

## O que há aqui

| Pasta | Conteúdo |
|---|---|
| `app/` | A plataforma web (React + Vite + Leaflet), com 13 telas, testes e os dados publicados em `app/public/dados/` |
| `scripts/etl/` | Rotinas que baixam e tratam os dados (Receita Federal e IBGE) e o script de validação |
| `dados/` | Base nacional de cooperativas ativas em CSV compactado |
| `supabase/schema.sql` | Esquema do banco PostgreSQL/PostGIS projetado para a próxima etapa (ainda não aplicado) |
| `docs/PLANO.md` | Plano da plataforma: menu, telas, arquitetura e evolução |
| `docs/manual/` | Manual de utilização (PDF e fonte) e capturas de tela |
| `docs/trl4/` | Dossiê de comprovação do TRL 4: PDFs em `pdf/`, fontes em `fontes/`, registros em `evidencias/` |
| `docs/video/` | Vídeo de apresentação (1 minuto) e o roteiro que o grava |

## Como executar

Requisitos: Node.js 20 ou superior.

```bash
cd app
npm install
npm run dev          # desenvolvimento, em http://localhost:5173
# ou
npm run build && npm run preview   # versão compilada, em http://localhost:4173
```

A pasta `app/dist/`, gerada pelo `npm run build`, é um site estático: pode ser publicada em qualquer hospedagem de arquivos.

## Como testar

```bash
cd app
npm test             # 44 testes unitários das regras de cálculo
npm run test:e2e     # 19 testes de ponta a ponta (com `npm run preview` em execução; requer Playwright)
cd .. && python3 scripts/etl/validar_dados.py   # 25 verificações da base (requer a pasta data/, gerada pela carga)
```

## Como atualizar os dados

```bash
python3 scripts/etl/cooperativas_cnpj.py AAAA-MM            # baixa cerca de 7 GB da Receita Federal
python3 scripts/etl/municipios_ibge.py <pasta>/BR_Municipios_2022.shp
python3 scripts/etl/geocodificar_cooperativas.py
python3 scripts/etl/gerar_dados_app.py <pasta com BR_UF_2022.shp e cnaes.csv> AAAA-MM
python3 scripts/etl/validar_dados.py
```

Dependências Python: `pyshp`, `shapely`.

## Como regerar os documentos

```bash
node docs/manual/capturas.cjs                 # capturas de tela (plataforma em execução)
node docs/gerar_pdfs.cjs docs/manual/manual.html docs/manual/Manual_CITA-COOP.pdf "CITA-COOP · Manual de utilização"
python3 docs/trl4/gerar_dossie.py             # monta os HTML do dossiê a partir das evidências
node docs/video/gravar_video.cjs              # grava o vídeo (requer ffmpeg)
```

## Fontes dos dados

- Receita Federal — dados abertos do CNPJ (carga de outubro de 2026).
- IBGE — malhas territoriais 2022 e Censo Agropecuário 2017 (SIDRA, tabela 6778).

## Limites desta versão

- A base reúne cooperativas de todos os ramos; o recorte da agricultura familiar depende do CAF (MDA).
- A localização é pela sede do município.
- Os registros feitos pelo usuário ficam no navegador; não há login nem banco central.
- Sala de Situação e Formação usam conteúdo ilustrativo ou planejado, indicado na tela.
