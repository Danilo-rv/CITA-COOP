# Dossiê de comprovação do TRL 4

Este dossiê reúne os documentos que comprovam que a plataforma **CITA-COOP**, versão {{versao}}, atingiu o nível de maturidade tecnológica 4: componentes implementados, integrados e verificados em ambiente de laboratório, com dados reais.

# Documentos

| Nº | Documento | O que comprova |
|---|---|---|
| 1 | Relatório de Maturidade Tecnológica (TRL 4) | A avaliação nível a nível e a conclusão |
| 2 | Requisitos e Matriz de Rastreabilidade | Que cada requisito tem um teste e um resultado |
| 3 | Arquitetura e Descrição Técnica | Como a plataforma é construída e como reproduzi-la |
| 4 | Plano e Relatório de Testes | Os testes executados, os registros e os defeitos corrigidos |
| 5 | Relatório de Validação dos Dados | Que a base é real, íntegra e coerente com as fontes |
| 6 | Plano de Evolução do TRL 5 ao TRL 7 | O caminho até a operação |
| 7 | Declaração de Maturidade (modelo) | Texto para assinatura da instituição |
| A | Manual de Utilização | A plataforma em uso, tela a tela |
| B | Vídeo de apresentação (1 minuto) | A plataforma em execução |

# Evidências brutas

Os registros originais ficam no repositório, na pasta `docs/trl4/evidencias/`:

| Arquivo | Conteúdo |
|---|---|
| `ambiente.txt` | Sistema, versões e dependências usados nos testes |
| `build.txt` | Registro da compilação da aplicação |
| `testes_unitarios.txt` | Saída dos {{n_unit}} testes unitários |
| `testes_e2e.txt` | Saída dos {{n_e2e}} testes de ponta a ponta |
| `validacao_dados.txt` | Saída das {{n_dados}} verificações de dados |

As 26 capturas de tela estão em `docs/manual/img/`. O histórico de alterações do código está no próprio repositório Git.

# Números principais

| Indicador | Valor |
|---|---|
| Cooperativas ativas na base | {{ativas}} |
| Registros de cooperativas processados | {{total}} |
| Municípios com dados do Censo Agropecuário | 5.572 |
| Cobertura da geocodificação | {{geo}}% |
| Telas implementadas | 13 |
| Testes unitários aprovados | {{n_unit}} de {{n_unit}} |
| Testes de ponta a ponta aprovados | {{n_e2e}} de {{n_e2e}} |
| Verificações de dados aprovadas | {{n_dados}} de {{n_dados}} |

# O que a instituição precisa completar

- Preencher e **assinar** a Declaração (documento 7). Sem assinatura, ela é apenas um modelo.
- Preencher instituição e coordenação no Relatório (documento 1).
- Conferir se a tabela de TRL do edital coincide com a referência usada (ABNT NBR ISO 16290:2015).
- Anexar, se o edital pedir, comprovantes institucionais (vínculo da equipe, termos de parceria).

# Alcance e limites

O dossiê comprova o que foi construído e verificado em laboratório até {{data}}. Ele **não** afirma uso por usuários finais, operação em produção nem integração com dados de parceiros, que são etapas dos níveis 5 a 7.
