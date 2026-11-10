# 1. Identificação

| Item | Descrição |
|---|---|
| Tecnologia | **CITA-COOP — Centro de Inteligência Territorial Analítica em Cooperativas** (plataforma web) |
| Natureza | Software: plataforma de inteligência territorial, com base de dados georreferenciada, indicadores e serviços digitais |
| Versão avaliada | {{versao}} (commit `{{commit}}`) |
| Repositório | `github.com/Danilo-rv/CITA-COOP`, ramo `{{ramo}}` |
| Data da avaliação | {{data}} |
| Instituição proponente | <span class="campo-preencher">preencher</span> |
| Coordenação | <span class="campo-preencher">preencher</span> |
| Nível declarado | **TRL 4 — validação funcional dos componentes em ambiente de laboratório** |

## Resumo

Este relatório demonstra que a plataforma CITA-COOP atingiu o nível de maturidade tecnológica 4. Os componentes principais foram **construídos, integrados e verificados em ambiente controlado**, com **dados reais** de fontes oficiais:

- base nacional com **{{ativas}} cooperativas ativas** ({{total}} registros de cooperativas processados), obtida dos dados abertos do CNPJ (Receita Federal) e localizada por município com cobertura de **{{geo}}%**;
- **5.572 municípios** com o número de estabelecimentos da agricultura familiar do Censo Agropecuário 2017 (IBGE);
- **13 telas** em funcionamento, integradas em uma única aplicação;
- **{{n_unit}} testes unitários**, **{{n_e2e}} testes de ponta a ponta** em navegador e **{{n_dados}} verificações de dados**, todos aprovados;
- recursos de acessibilidade, incluindo o **VLibras** (gov.br), verificados em execução.

A plataforma **não** foi ainda testada com usuários finais nem com dados de parceiros em ambiente representativo. Essas atividades caracterizam os níveis 5 e 6 e estão planejadas no documento 6.

# 2. Referência adotada

A avaliação segue a escala de níveis de maturidade tecnológica (TRL, *Technology Readiness Levels*) descrita na norma **ABNT NBR ISO 16290:2015**, adotada por órgãos de fomento brasileiros. Como a norma nasceu no setor espacial, os critérios foram interpretados para software, conforme o quadro abaixo.

| TRL | Definição geral (resumo) | Interpretação para esta plataforma |
|---|---|---|
| 1 | Princípios básicos observados e relatados | Problema e fundamentos descritos |
| 2 | Conceito e aplicação da tecnologia formulados | Conceito, módulos e fontes de dados definidos |
| 3 | Prova de conceito analítica e experimental | Obtenção e cruzamento dos dados demonstrados na prática |
| **4** | **Verificação funcional de componentes em ambiente de laboratório** | **Módulos construídos e integrados, funcionando com dados reais em ambiente controlado de desenvolvimento e teste** |
| 5 | Verificação em ambiente relevante | Plataforma hospedada, com banco central e usuários do piloto |
| 6 | Demonstração de protótipo em ambiente relevante | Piloto em Goiás com cooperativas e parceiros |
| 7 a 9 | Demonstração e operação em ambiente real | Operação nacional contínua |

> **Observação.** Cada edital pode trazer a sua própria tabela de TRL e os seus formulários. Antes de submeter, confira se a redação do edital coincide com a deste quadro.

# 3. Avaliação nível a nível

## TRL 1 — Princípios básicos · atendido

| Critério | Evidência |
|---|---|
| Problema e justificativa descritos | Documento de ideação do CITA-COOP: fragmentação dos dados, ATER insuficiente, demandas invisíveis, ausência de medição territorial das políticas |
| Fundamentos identificados | Fontes públicas mapeadas (CAF, CNPJ, Censo, SICOR, FNDE, satélites) e base legal (Lei 5.764/1971, Lei 11.947/2009, LGPD) |

## TRL 2 — Conceito formulado · atendido

| Critério | Evidência |
|---|---|
| Conceito da solução definido | Três funções (observatório, sala de situação, serviço) e seis módulos descritos na ideação |
| Aplicação e usuários definidos | `docs/PLANO.md`: perfis de usuário, 12 itens de menu e telas |
| Indicadores formulados | ICPP (seis componentes, média ponderada) e IMGC (sete dimensões) |

## TRL 3 — Prova de conceito · atendido

| Critério | Evidência |
|---|---|
| Viabilidade de obter os dados | Extração de {{total}} registros de cooperativas a partir de cerca de 7 GB de arquivos da Receita Federal (`scripts/etl/cooperativas_cnpj.py`) |
| Viabilidade do cruzamento territorial | Geocodificação por município com {{geo}}% de cobertura (`scripts/etl/geocodificar_cooperativas.py`) |
| Viabilidade do denominador do ICPP | Carga do Censo Agropecuário pela API SIDRA, conferida com os totais oficiais (5.073.324 estabelecimentos; 3.897.408 familiares) |
| Limites identificados | Consulta do CAF protegida por captcha: fonte dependente de acordo ou de pedido via LAI |

## TRL 4 — Validação em laboratório · atendido

| Critério | Situação | Evidência |
|---|---|---|
| Componentes básicos implementados | Sim | 13 telas, biblioteca de cálculo, rotinas de carga de dados (documento 3) |
| Componentes integrados entre si | Sim | Aplicação única; os módulos compartilham a mesma base territorial (Geoportal, Políticas Públicas, Mercados e Observatório usam os mesmos arquivos) |
| Funcionamento com dados reais | Sim | Base nacional da Receita Federal e do IBGE (documento 5) |
| Requisitos definidos e rastreados | Sim | 19 requisitos, cada um ligado a um teste (documento 2) |
| Testes em ambiente controlado | Sim | {{n_unit}} testes unitários e {{n_e2e}} de ponta a ponta, 100% aprovados (documento 4) |
| Desempenho medido | Sim | Mapa nacional pronto em menos de 1 segundo no ambiente de teste (limite adotado: 5 s) |
| Defeitos registrados e corrigidos | Sim | Seis defeitos encontrados nos testes e corrigidos (documento 4, seção 6) |
| Acessibilidade verificada | Sim | VLibras em execução, alto contraste, teclado, texto ampliável (documento 4) |
| Documentação de uso | Sim | Manual de utilização, 38 páginas (anexo A) |
| Reprodutibilidade | Sim | Código, scripts e testes versionados; passo a passo no `README.md` |

**Conclusão: os critérios do TRL 4 estão atendidos.**

## TRL 5 — Ambiente relevante · não atendido (próxima etapa)

| Critério | Situação |
|---|---|
| Hospedagem em servidor acessível aos usuários | Não realizado |
| Banco de dados central (PostgreSQL/PostGIS) com login por perfil | Esquema projetado (`supabase/schema.sql`), não aplicado |
| Integração com dados de parceiros (CAF/MDA, SICOR, FNDE, ANATER, satélites) | Não realizado |
| Testes com usuários reais (cooperativas, ATER, gestores) | Não realizado |
| Localização por endereço | Não realizado (precisão atual: município) |

# 4. O que é dado real e o que é demonstração

Para preservar a fidelidade deste relatório, registra-se o estado de cada módulo.

| Módulo | Funcionalidade verificada | Dados |
|---|---|---|
| Início | Indicadores e gráfico por ramo | Reais |
| Geoportal | Mapa, filtros, busca, ficha, camada de vazios | Reais |
| Políticas Públicas | Presença cooperativa e fila de vazios; calculadora do ICPP | Reais; na calculadora, denominador real e numeradores informados pelo usuário |
| Mercados | Cooperativas por raio de distância; cadastro de chamadas | Reais (cooperativas); chamadas registradas localmente |
| Observatório | Demografia, downloads, catálogo de dados | Reais |
| Demandas | Registro, classificação por regras, quadro de etapas | Registro local no navegador |
| ATER Virtual | Respostas por regras com fonte; fila para o técnico | Base de conhecimento curada; registro local |
| Gestão Cooperativa | IMGC, regularidade, indicadores financeiros | Registro local |
| Sala de Situação | Motor de regras de alerta | Cenário ilustrativo |
| Formação | Catálogo de trilhas | Conteúdo planejado |
| Resultados, Administração, Ajuda | Painéis e acessibilidade | Reais e registro local |

A própria plataforma exibe uma etiqueta de origem em cada bloco (“Dados reais”, “Registro local” ou “Demonstração”).

# 5. Conclusão

Com base nas evidências reunidas neste dossiê, a plataforma CITA-COOP encontra-se no **nível de maturidade tecnológica 4**: seus componentes foram implementados, integrados e verificados funcionalmente em ambiente de laboratório, com dados reais de fontes oficiais.

O passo seguinte, descrito no documento 6, é a verificação em ambiente relevante (TRL 5), com hospedagem, banco de dados central e os primeiros usuários do piloto em Goiás.
