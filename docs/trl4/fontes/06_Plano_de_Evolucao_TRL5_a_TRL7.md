# 1. Objetivo

Indicar o caminho da plataforma do nível atual (TRL 4) até a demonstração em ambiente operacional (TRL 7), com as entregas que comprovam cada nível.

# 2. Situação de partida

A versão {{versao}} tem a base nacional de cooperativas, 13 telas integradas e testes automatizados aprovados em laboratório. Faltam a infraestrutura de produção, as fontes que dependem de convênio e o uso por pessoas reais.

# 3. Etapas

## TRL 5 — Verificação em ambiente relevante

| Entrega | Como será comprovada |
|---|---|
| Hospedagem institucional e endereço público | Plataforma acessível pela internet; registro de disponibilidade |
| Banco de dados central (PostgreSQL/PostGIS) com o esquema já projetado | Carga das tabelas e consultas espaciais em funcionamento |
| Login e permissões por perfil | Testes de acesso por perfil |
| Carga mensal automática do CNPJ | Histórico de cargas na tela Administração |
| Geocodificação por CEP e endereço | Percentual de cooperativas com precisão de endereço |
| Primeiros numeradores do ICPP (SICOR e FNDE, fontes abertas) | ICPP parcial calculado para os municípios de Goiás |
| Sala de Situação com séries reais (chuva e vegetação) | Alertas gerados a partir de dados de satélite |
| Teste com usuários do piloto (cooperativa parceira, Emater-GO, Núcleo PPGADM) | Relatório de teste de usabilidade e lista de ajustes |
| Auditoria de acessibilidade (eMAG/WCAG) | Relatório de conformidade |

## TRL 6 — Demonstração do protótipo em ambiente relevante

| Entrega | Como será comprovada |
|---|---|
| Piloto em Goiás com cooperativas em uso contínuo | Registros de uso, demandas e diagnósticos reais |
| IMGC aplicado no início e no fim da assessoria | Evolução medida por cooperativa |
| Integração com o software de gestão da cooperativa | Indicadores financeiros gerados sem digitação |
| Recorte da agricultura familiar (CAF) | Acordo com o MDA ou resposta a pedido via LAI; base atualizada |
| Atendimento por WhatsApp na ATER Virtual e nas Demandas | Atendimentos registrados |
| Comitê gestor instalado | Atas e definição dos pesos do ICPP e do IMGC |

## TRL 7 — Demonstração em ambiente operacional

| Entrega | Como será comprovada |
|---|---|
| Operação em mais de um estado, com as Emater e os Institutos Federais | Termos de cooperação e uso registrado |
| ICPP completo e mapa de lacunas para o país | Publicação dos índices |
| Serviços de dados para outros órgãos (API e padrões da INDE) | Sistemas externos consumindo a base |
| Avaliação de impacto com grupo de comparação | Relatório técnico e publicações |

# 4. Riscos e respostas

| Risco | Efeito | Resposta |
|---|---|---|
| Fontes que dependem de acordo não serem liberadas | ICPP incompleto; sem recorte da agricultura familiar | Iniciar pelos dados abertos; pedidos via LAI; articulação com MDA e ASBRAER |
| Baixa adesão das cooperativas | Dados primários insuficientes | Entregar retorno imediato (documentos, mercados) e apoio do Núcleo |
| Proteção de dados pessoais | Risco jurídico | Dados individuais só com consentimento; encarregado de dados; agregação mínima |
| Sustentabilidade após o fomento | Descontinuidade | Hospedagem institucional e modelo de serviços, definidos no comitê gestor |
| Conectividade no campo | Dificuldade de uso | Versão para uso sem internet e canal por WhatsApp |

# 5. Questões que dependem da instituição

- Instituição que sedia o Centro e responde pelos dados.
- Edital de fomento escolhido e cronograma correspondente.
- Equipe e orçamento de cada etapa.
