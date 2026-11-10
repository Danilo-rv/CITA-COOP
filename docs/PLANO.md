# CITA-COOP — Plano da Plataforma Web

Plano de construção da plataforma web do **Centro de Inteligência Territorial Analítica em Cooperativas (CITA-COOP)**, elaborado a partir do documento de ideação do projeto. Este documento ainda não descreve código implementado; é o guia para o desenvolvimento.

---

## 1. Princípios de organização

- **Duas áreas**, por exigência da LGPD:
  - **Portal público (sem login):** mapas, índices e dados abertos sempre **agregados por território**.
  - **Área restrita (com login):** dados individuais de cooperativas e cooperados, sujeitos a termo de consentimento e acordo de cooperação.
- **Uma base territorial única** (PostgreSQL + PostGIS) compartilhada por todos os módulos.
- **Menu por perfil:** cada usuário vê apenas o que seu papel permite.
- **Escala nacional desde a base:** a base de cooperativas e o ICPP cobrem o Brasil inteiro; o piloto em Goiás concentra os módulos que dependem de parceria local (dados primários, assessoria, ATER).

### Perfis de usuário

| Perfil | Uso principal |
|---|---|
| Visitante (público) | Mapas, índices e dados abertos agregados |
| Equipe do Centro (admin / analista) | Gestão da plataforma, cargas de dados, sala de situação |
| Gestor público (federal, estadual, municipal) | ICPP, mapa de lacunas, demandas, focalização de políticas |
| Dirigente de cooperativa | Gestão, conformidade, mercados, demandas |
| Técnico de ATER | Fila da ATER virtual, demandas encaminhadas |
| Analista do Núcleo PPGADM (docente/mestrando) | IMGC, assessoria, carteira de cooperativas |
| Pesquisador | Observatório, dados abertos, avaliações de impacto |
| Cooperado | Principalmente via WhatsApp (ATER virtual, demandas) |

---

## 2. Itens do menu e telas

### 1. Início
- Dashboard por perfil (números-chave, alertas, pendências, atalhos)
- Página pública de apresentação do CITA-COOP

### 2. Geoportal
- Mapa interativo com camadas: cooperativas, escritórios de ATER, assentamentos (INCRA), ICPP, IMGC, NDVI, chuva, uso da terra
- Busca e filtros (UF, município, cadeia produtiva, porte, situação no CAF)
- Ficha da cooperativa: sede, área de abrangência real (vínculos CAF), nº de cooperados, cadeias, ATER disponível, políticas acessadas, IMGC, semáforo de conformidade
- Ficha do município / território: perfil agrícola (Censo), ICPP, clima, cooperativas, ATER
- Diretório de escritórios de ATER e ficha do escritório

### 3. Sala de Situação
- Painel de monitoramento: alertas ativos, mapa de risco, preços, editais abertos
- Clima e seca: precipitação e anomalia, temperatura, Monitor de Secas, Cemaden
- Vegetação e solo: séries NDVI/EVI, umidade do solo, uso da terra (MapBiomas), gráficos por território
- Central de alertas: lista, detalhe e regras automáticas (ex.: NDVI negativo + déficit de chuva)
- Calendário agrícola / ZARC por município

### 4. Políticas Públicas (ICPP)
- Ranking e mapa do ICPP por município e território
- Detalhe do município com os 6 componentes (Cadastro, Crédito, ATER, PNAE, PAA, Proteção)
- Mapa de lacunas: ICPP × vulnerabilidade (CadÚnico, IDHM, risco climático)
- Comparador de municípios e evolução temporal
- Metodologia e pesos (AHP) — página pública

### 5. Demandas (escuta de dores)
- Registrar demanda (formulário com localização no mapa; entrada também via WhatsApp)
- Lista e quadro kanban: nova → classificada → encaminhada → resolvida
- Detalhe da demanda: classificação por IA, responsável, histórico
- Mapa e estatísticas de demandas por tema e território

### 6. ATER Virtual
- Painel de atendimentos (WhatsApp e web)
- Fila de escalonamento para o técnico local e tela de atendimento da conversa
- Base de conhecimento (conteúdos Embrapa / Emater)
- Diagnósticos por foto para revisão do técnico

### 7. Mercados
- Chamadas públicas abertas (PNAE / PAA)
- Matching: chamadas × oferta das cooperativas próximas
- Oferta de produção da cooperativa (cadastro e calendário)
- Histórico de vendas institucionais e preços de referência (Conab)

### 8. Gestão Cooperativa
- Visão da cooperativa (painel com IMGC, conformidade e finanças)
- Diagnóstico IMGC: questionário das 7 dimensões, resultado em radar, comparação antes/depois, mapa de maturidade
- Regularidade e conformidade: semáforo (CNPJ, CAF, certidões federal/FGTS/trabalhista, AGO, mandatos) com alertas de vencimento
- Contábil e financeiro: DRE e balanço (NBC ITG 2004), Fundo de Reserva, FATES e sobras (Lei 5.764/71), indicadores, benchmarking anonimizado, relatórios para AGO e conselho fiscal
- Planejamento: plano estratégico, estudos de viabilidade, precificação e contratos, plano de gestão (Mais Gestão)
- Assessoria virtual (chat com IA, encaminhamento ao Núcleo)
- Biblioteca de modelos (atas, estatuto, regimento, planilhas)
- Núcleo de Assessoria: carteira de cooperativas e agenda de visitas (perfil PPGADM)
- Integração com o software de gestão: status de sincronização

### 9. Formação
- Catálogo de trilhas EAD
- Página do curso e progresso
- Certificados (IF Goiano)

### 10. Observatório e Pesquisa
- Dados abertos agregados (consulta e download, API)
- Publicações e produtos técnico-tecnológicos (dissertações, artigos)
- Avaliações de impacto (cooperativas atendidas × não atendidas)

### 11. Resultados
- Painel dos indicadores de resultado do projeto, por eixo (território, políticas, gestão, conformidade, mercado, formação, serviços, pesquisa)

### 12. Administração (equipe do Centro)
- Usuários, perfis e permissões
- Instituições parceiras e acordos
- Fontes de dados e cargas (CAF, CNPJ, SIDRA, SICOR, FNDE, Conab, Earth Engine…): status e última atualização
- Termos de consentimento (LGPD)
- Configuração dos pesos do ICPP e do IMGC (comitê gestor)
- Regras de alerta e log de auditoria

---

## 3. Arquitetura técnica (proposta)

| Camada | Tecnologia |
|---|---|
| Banco territorial | Supabase (PostgreSQL + PostGIS) |
| Autenticação e permissões | Supabase Auth + Row Level Security por perfil; futuramente Login Único gov.br |
| Frontend | Next.js (React) + MapLibre GL (mapas vetoriais) |
| Ingestão de dados | Rotinas ETL (Python) para fontes públicas; Google Earth Engine para índices de satélite gravados como séries por território |
| Serviços geográficos | API REST + serviços OGC (WMS/WFS) para interoperar com a INDE |
| Canais e IA | Integração WhatsApp; IA para ATER virtual, classificação de demandas e assessoria virtual |

---

## 4. Base nacional de cooperativas (localização)

Estratégia para georreferenciar **todas** as cooperativas do país, e não apenas as de Goiás:

1. **Universo:** dados abertos do CNPJ (Receita Federal) — estabelecimentos com natureza jurídica **214-3 (Cooperativa)**, com CNAE, endereço, CEP, município e situação cadastral.
2. **Recorte agricultura familiar:** cruzamento com o **CAF Jurídico** (MDA). Como não há download em massa, o caminho é solicitar a lista via acordo com o MDA ou **pedido LAI**; enquanto isso, usar CNAE agropecuário como aproximação.
3. **Geocodificação em camadas** (cada registro guarda a precisão obtida):
   - Nível 1 — centroide do município (código IBGE): 100% dos registros, imediato
   - Nível 2 — centroide do CEP
   - Nível 3 — endereço completo (geocodificador com volume adequado; Nominatim próprio ou serviço pago)
   - Nível 4 — validação manual / pela própria cooperativa na plataforma
4. **Área de abrangência:** a partir dos vínculos cooperado–cooperativa no CAF (desde 08/2025), quando o MDA disponibilizar os dados.
5. **Atualização:** carga mensal automática, acompanhando a publicação da Receita.

### Status (carga de 2026-10 — nível 1 concluído)

| Item | Resultado |
|---|---|
| Estabelecimentos de cooperativas (natureza 214-3) no CNPJ | 84.776 |
| **Ativos** | **38.668** (15.646 matrizes); 38.658 localizados e publicados, em 27 UFs e 4.467 municípios |
| Geocodificados no nível 1 (centroide do município) | 99,99% (12 sem município casado) |
| Goiás (ativos) | 1.609 |

Arquivos: `dados/cooperativas_ativas_brasil.csv.gz` (sem telefone e e-mail). Scripts reproduzíveis em `scripts/etl/` (`cooperativas_cnpj.py`, `municipios_ibge.py`, `geocodificar_cooperativas.py`).

**Limitações conhecidas:** o recorte atual é *todas as cooperativas* (não só da agricultura familiar — falta o CAF Jurídico/MDA; o CNAE ajuda a filtrar, mas não substitui); a posição é a do município, não do endereço; Boa Esperança do Norte (MT) e um Santa Teresinha (BA) ficaram sem coordenada.

---

## 5. Como tornar a plataforma indispensável para a gestão pública nacional

1. **Ser a base oficial de referência.** Acordo com o MDA para que o CITA-COOP seja o cadastro georreferenciado de cooperativas da agricultura familiar e de escritórios de ATER, consumido por API pelos sistemas do MDA, ANATER, Conab e FNDE.
2. **Entrar no ciclo das políticas.** Oferecer o ICPP e o mapa de lacunas como critério de focalização em editais (chamadas da ANATER, Mais Gestão, Garantia-Safra) e um simulador de cenários ("onde investir para aumentar a cobertura").
3. **Resolver um problema concreto dos municípios: os 30% do PNAE.** Para cada prefeitura abaixo da meta legal, mostrar as cooperativas aptas próximas, o que produzem e se estão regulares — e avisar as cooperativas da oportunidade. Une gestão pública e mercado num mesmo fluxo.
4. **Apoiar emergência climática.** A sala de situação gera listas de municípios e cooperativas afetados por seca ou chuva extrema, úteis para Defesa Civil, decretos de emergência, Garantia-Safra e renegociação de crédito.
5. **Abastecer o crédito rural.** Mapas de lacuna de Pronaf por município para bancos públicos e para o Plano Safra.
6. **Interoperar com o governo digital.** Login gov.br, dados abertos no dados.gov.br, serviços OGC integrados à INDE, padrão visual gov.br (DSGOV), acessibilidade e-MAG.
7. **Relatórios prontos para controle e planejamento.** Indicadores no formato do PPA, dos ODS e de prestação de contas a TCU/CGU, gerados automaticamente.
8. **Dados que se atualizam sozinhos.** As cooperativas mantêm seus dados porque recebem algo em troca (alertas de documentos vencidos, oportunidades de venda, diagnóstico de gestão) — a base fica mais atual do que os registros oficiais.
9. **Capilaridade pela Rede Federal.** Replicar o Núcleo de Assessoria nos Institutos Federais de cada estado, com o IF Goiano como coordenador nacional.
10. **Evidência de impacto.** Publicar avaliações com grupo de comparação e custo-benefício; é isso que garante orçamento e continuidade.
11. **Funcionar onde a internet é fraca.** PWA com modo offline e canal WhatsApp.
12. **Governança e continuidade.** Hospedagem institucional (IF Goiano / RNP), comitê gestor, SLA e plano de financiamento pós-fomento.

---

## 6. Dinamismo e robustez analítica

### 6.1 Plataforma dinâmica
- **Carga automática com data visível:** cada fonte atualiza no seu ritmo e toda tela mostra a data dos dados.
- **Filtros cruzados:** mapa, gráficos e ranking respondem juntos a filtros de cadeia, porte e período.
- **Linha do tempo:** controle deslizante para ver a evolução de qualquer indicador.
- **Alertas por assinatura:** o usuário escolhe território e tema e é avisado por e-mail ou WhatsApp.
- **Painéis montáveis:** cada usuário monta, salva e compartilha seu painel.
- **Perguntas em linguagem natural:** a IA consulta a base e devolve mapa e tabela.
- **Dados vindos do campo:** cooperativas e técnicos corrigem endereço, produção e demandas, com reflexo imediato no mapa.

### 6.2 Análises de gestão territorial
- **Tipologia de territórios:** agrupamento de municípios por perfil, para comparar cada um com seus semelhantes.
- **Estatística espacial:** aglomerados de alta e baixa cobertura (Moran, hot spots).
- **Acessibilidade real:** tempo de viagem por estrada até ATER, armazém da Conab, escolas do PNAE e banco.
- **Vazios de atendimento:** áreas com muitos estabelecimentos familiares e nenhuma cooperativa ou ATER ao alcance.
- **Recortes múltiplos:** município, Território da Cidadania, região imediata, bacia, bioma, semiárido, Amazônia Legal.
- **Demografia das cooperativas:** taxa de sobrevivência por região e ramo, a partir das datas de abertura e de situação do CNPJ.
- **Risco composto:** exposição climática × capacidade de reação (IMGC, crédito, ATER).

### 6.3 Governança de dados
- **Catálogo e linhagem:** ficha de cada indicador com fonte, fórmula, data, responsável e limitações.
- **Selo de qualidade:** completude, atualidade e precisão geográfica por camada (`precisao_geo` já é gravada).
- **Versionamento:** cargas mensais preservadas, para reproduzir relatórios de datas passadas.
- **Classificação de acesso:** público, agregado, restrito e pessoal, aplicados no banco por perfil, com registro de consultas.
- **Anonimização:** não publicar agregados com menos de N cooperativas.
- **Papéis formais:** encarregado de dados (LGPD), curadores por fonte e comitê gestor para mudanças de metodologia.
- **Padrões abertos:** metadados no padrão da INDE, API documentada, publicação no dados.gov.br.

### 6.4 Administração pública
- **Simulador de cenários:** efeito e custo por família de uma intervenção em um conjunto de municípios.
- **Monitoramento de execução:** meta × realizado por programa e território, vinculado ao PPA e aos ODS.
- **Avaliação de impacto embutida:** territórios atendidos × semelhantes não atendidos.
- **Custo-efetividade:** valor investido × resultado, por política e município.
- **Relatórios automáticos:** nota técnica do município ou estado em PDF.
- **Painel de transparência:** versão pública para conselhos e controle social.
- **Fila de prioridades:** lista ordenada de onde agir primeiro, com justificativa.

### 6.5 Prioridade
1. Catálogo de dados com linhagem e selo de qualidade (nasce junto com o banco).
2. Tipologia de territórios e estatística espacial.
3. Demografia das cooperativas (já possível com a carga do CNPJ).
4. Simulador de cenários, depois do ICPP calculado.

---

## 7. Ordem de construção

| Fase | Entregas |
|---|---|
| 1 | Base territorial nacional (cooperativas pelo CNPJ, municípios IBGE), Geoportal, Administração de fontes, catálogo de dados e demografia das cooperativas |
| 2 | Gestão Cooperativa (IMGC, conformidade, contábil) no piloto em Goiás com a cooperativa que já usa o software de gestão |
| 3 | ICPP nacional, mapa de lacunas, tipologia de territórios, estatística espacial e simulador de cenários |
| 4 | Sala de Situação com dados de satélite |
| 5 | Demandas, ATER Virtual e Mercados (incluindo o fluxo PNAE 30%) |
| 6 | Formação, Observatório e Resultados |

## 8. Questões em aberto

- Qual instituição sedia o Centro e responde juridicamente pelos dados?
- Quais Emater aceitam compartilhar dados de atendimento?
- Como obter a lista do CAF Jurídico em massa (acordo com o MDA ou LAI)?
- Qual o modelo de financiamento após o fomento inicial?

## 9. Situação da construção (versão 0.4 — TRL 4)

A plataforma foi construída em `app/` e validada em laboratório. O que está pronto e o que fica para as próximas etapas está descrito em `docs/trl4/` (dossiê de maturidade) e no `README.md`.

| Item do plano | Situação na versão 0.4 |
|---|---|
| Geoportal nacional, busca e ficha | Pronto, com dados reais |
| Vazios de atendimento e presença cooperativa | Pronto, com dados reais |
| Demografia das cooperativas, dados abertos e catálogo de dados | Pronto, com dados reais |
| Mercados (cooperativas por raio) | Pronto, com dados reais; chamadas em registro local |
| Demandas, ATER Virtual, Gestão (IMGC, regularidade, financeiro) | Funcionais, com registro no navegador |
| Calculadora do ICPP | Funcional; numeradores digitados |
| Sala de Situação | Motor de alertas pronto; dados ilustrativos |
| Formação | Catálogo das trilhas |
| Acessibilidade (VLibras, contraste, teclado, texto) | Pronto e testado |
| Login, banco central, WhatsApp, IA, satélite, CAF | Próximas etapas (TRL 5 em diante) |
