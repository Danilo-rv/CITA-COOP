# 1. Objetivo

Este documento lista os requisitos verificados na versão {{versao}} e liga cada um ao módulo que o implementa e ao teste que o comprova. Os identificadores são os mesmos usados nos testes automatizados (`app/e2e/plataforma.test.cjs`).

# 2. Requisitos funcionais

| ID | Requisito | Módulo | Teste | Resultado |
|---|---|---|---|---|
| RF-01 | As 13 telas abrem com título e sem erro de execução | Todos | RF-01 | Aprovado |
| RF-02 | A tela inicial apresenta os totais reais da base nacional | Início | RF-02 | Aprovado |
| RF-03 | O mapa nacional é desenhado e responde aos filtros de estado e ramo | Geoportal | RF-03 | Aprovado |
| RF-04 | O usuário abre a lista de cooperativas de um município e a ficha de cada uma | Geoportal | RF-04 | Aprovado |
| RF-05 | A busca por nome ou CNPJ localiza a cooperativa e abre a ficha | Geoportal | RF-05 | Aprovado |
| RF-06 | A lista de vazios de atendimento responde ao limite mínimo de estabelecimentos | Políticas Públicas | RF-06 | Aprovado |
| RF-07 | O ICPP é calculado com o denominador do Censo e a média ponderada dos componentes | Políticas Públicas | RF-07 | Aprovado |
| RF-08 | A demanda é registrada, classificada por tema, movida entre etapas e mantida após recarregar | Demandas | RF-08 | Aprovado |
| RF-09 | O assistente responde com a fonte e encaminha ao técnico o que não sabe | ATER Virtual | RF-09 | Aprovado |
| RF-10 | O sistema lista cooperativas reais dentro de um raio de distância | Mercados | RF-10 | Aprovado |
| RF-11 | O IMGC é pontuado e o módulo financeiro aplica os fundos legais | Gestão Cooperativa | RF-11 | Aprovado |
| RF-12 | O semáforo de regularidade muda conforme a validade dos documentos | Gestão Cooperativa | RF-12 | Aprovado |
| RF-13 | O Observatório apresenta demografia, arquivos para download e catálogo de dados | Observatório | RF-13 | Aprovado |

# 3. Requisitos não funcionais

| ID | Requisito | Critério de aceitação | Teste | Resultado |
|---|---|---|---|---|
| RNF-01 | Acessibilidade | Idioma declarado, VLibras oficial carregado, atalho de conteúdo, texto ampliável, alto contraste, tema escuro e nome acessível em todos os controles | RNF-01 | Aprovado |
| RNF-02 | Uso por teclado | O primeiro Tab alcança o atalho e o Enter leva o foco ao conteúdo | RNF-02 | Aprovado |
| RNF-03 | Menu por perfil | O menu mostra apenas os módulos do perfil escolhido | RNF-03 | Aprovado |
| RNF-04 | Responsividade | Sem rolagem horizontal em tela de 390 px; menu recolhível | RNF-04 | Aprovado |
| RNF-05 | Desempenho | Mapa nacional pronto em menos de 5 s | RNF-05 | Aprovado |

# 4. Requisito de dados

| ID | Requisito | Critério de aceitação | Teste | Resultado |
|---|---|---|---|---|
| RD-01 | Integridade dos dados publicados | Somas por município, UF e ramo iguais ao total nacional; 5.572 municípios; 27 UFs; coordenadas no território nacional; CNPJ com 14 dígitos | RD-01 e `scripts/etl/validar_dados.py` | Aprovado |

# 5. Regras de cálculo e testes unitários

As regras de negócio ficam em uma biblioteca separada da interface (`app/src/lib/calc.js`) e são verificadas por {{n_unit}} testes unitários (`app/tests/calc.test.js`).

| Regra | O que os testes verificam | Testes |
|---|---|---|
| Distância entre pontos (haversine) | Zero no mesmo ponto, simetria, valor conhecido Goiânia–Brasília | 3 |
| ICPP | Normalização, limite em 1, denominador zero, pesos, faixas | 8 |
| Presença cooperativa | Densidade por 10 mil e regra de vazio de atendimento | 3 |
| IMGC | Estrutura (7 × 3), notas máxima, mínima e parcial, valores inválidos, níveis | 7 |
| Regularidade | Em dia, a vencer, vencido, sem data, pior situação | 6 |
| Financeiro | Indicadores, mínimos legais de 10% e 5%, perdas, campos vazios | 6 |
| Classificação de demandas | Temas, acentos, texto desconhecido, urgência | 4 |
| Motor de alertas | Condições combinadas, ordenação, regra desativada | 3 |
| Formatação | CNPJ, CEP, nomes, valores ausentes, percentuais | 4 |

# 6. Requisitos previstos e ainda não implementados

Registrados para transparência; pertencem aos níveis seguintes.

| Requisito | Depende de |
|---|---|
| Login e permissões por perfil | Banco central e autenticação |
| Recorte da agricultura familiar e área de abrangência | CAF Jurídico (MDA) |
| ICPP automático para todos os municípios | SICOR, FNDE, ANATER, MDA |
| Alertas com dados reais de clima e vegetação | Google Earth Engine |
| Entrada de demandas e atendimento por WhatsApp; uso de IA | Integração de mensageria |
| Localização por endereço | Serviço de geocodificação |
| Demonstrações contábeis completas (ITG 2004) | Integração com o software de gestão |
