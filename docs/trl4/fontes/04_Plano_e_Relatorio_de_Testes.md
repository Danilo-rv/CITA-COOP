# 1. Objetivo e escopo

Verificar, em ambiente de laboratório, que os componentes da plataforma CITA-COOP versão {{versao}} funcionam de forma integrada e atendem aos requisitos do documento 2. Estão no escopo as 13 telas, a biblioteca de cálculo e a base de dados publicada. Estão fora do escopo os testes com usuários, os testes de carga e os testes de segurança de servidor, que pertencem aos níveis seguintes.

# 2. Ambiente de laboratório

Ambiente controlado de desenvolvimento e teste: a aplicação compilada é servida localmente e exercitada por um navegador real (Chromium) comandado por roteiros automatizados.

```
{{arquivo:ambiente.txt}}
```

# 3. Estratégia

| Nível | O que verifica | Ferramenta | Quantidade |
|---|---|---|---|
| Unitário | Regras de cálculo, isoladas da interface | Vitest | {{n_unit}} testes |
| Ponta a ponta | Fluxos completos na interface, com os dados reais | Playwright + node:test | {{n_e2e}} testes |
| Dados | Integridade e coerência da base | Script Python | {{n_dados}} verificações |
| Inspeção visual | Aparência das telas em computador, celular, alto contraste e tema escuro | Capturas de tela | 26 capturas |

Critério de aprovação: 100% dos testes aprovados e nenhum erro de execução no navegador.

# 4. Resultado resumido

| Conjunto | Executados | Aprovados | Reprovados |
|---|---|---|---|
| Testes unitários | {{n_unit}} | {{n_unit}} | 0 |
| Testes de ponta a ponta | {{n_e2e}} | {{n_e2e}} | 0 |
| Verificações de dados | {{n_dados}} | {{n_dados}} | 0 |

**Resultado: aprovado.** Execução em {{data}}.

# 5. Registros de execução

## 5.1 Testes de ponta a ponta

```
{{arquivo:testes_e2e.txt}}
```

## 5.2 Testes unitários

```
{{arquivo:testes_unitarios.txt}}
```

## 5.3 Compilação da aplicação

```
{{arquivo:build.txt|tail=6}}
```

# 6. Defeitos encontrados e corrigidos

Os testes cumpriram o seu papel: revelaram defeitos, que foram corrigidos antes da execução final.

| # | Onde | Defeito | Como foi detectado | Correção |
|---|---|---|---|---|
| 1 | Interface | Ao abrir a plataforma, o foco ia direto para o conteúdo e o atalho “Pular para o conteúdo” não era o primeiro item do teclado | Teste RNF-02 | O foco só é levado ao conteúdo nas trocas de tela, não na primeira carga |
| 2 | Interface | Em tela de 390 px a barra superior gerava 114 px de rolagem horizontal | Teste RNF-04 | Seletor de perfil flexível e botão de ajuda oculto no celular |
| 3 | Carga do CNPJ | O maior arquivo (2,2 GB, formato ZIP64) não era lido pelo descompactador em fluxo | Falha na execução da carga | Troca para descompactador com suporte a ZIP64 |
| 4 | Carga do CNPJ | Queda de conexão no download do maior arquivo interrompia toda a carga | Falha na execução da carga | Download com retomada e armazenamento dos resultados parciais |
| 5 | Geocodificação | Municípios de mesmo nome em estados diferentes eram confundidos | Revisão do resultado | Cruzamento por UF e nome |
| 6 | Geocodificação | 201 registros sem município por diferenças de grafia entre Receita e IBGE | Relatório de não casados | Tabela de equivalências; cobertura passou de 99,76% para {{geo}}% |

# 7. Verificação da acessibilidade

| Item | Como foi verificado | Resultado |
|---|---|---|
| VLibras (gov.br) | Script oficial carregado; botão presente; intérprete virtual aberto e sinalizando (figura abaixo) | Conforme |
| Alto contraste | Fundo preto e destaques em amarelo conferidos por teste e captura | Conforme |
| Tamanho do texto | Dois níveis de ampliação conferidos por teste | Conforme |
| Teclado | Atalho de conteúdo, foco visível e fechamento de janelas com Esc | Conforme |
| Nomes acessíveis | Nenhum botão ou campo sem rótulo nas telas verificadas | Conforme |
| Celular | Cinco telas sem rolagem horizontal em 390 px | Conforme |

![VLibras em execução na plataforma](../manual/img/22-vlibras.jpg)

*Figura 1 — VLibras aberto na tela de ajuda, com o intérprete virtual em execução.*

![Alto contraste](../manual/img/23-alto-contraste.jpg)

*Figura 2 — Geoportal em modo de alto contraste.*

Uma auditoria completa segundo o eMAG e a WCAG, com pessoas com deficiência, está prevista para o TRL 5.

# 8. Evidências visuais do funcionamento

![Geoportal](../manual/img/02-geoportal.jpg)

*Figura 3 — Geoportal com as {{ativas}} cooperativas ativas (dados reais).*

![Município e lista](../manual/img/03-geoportal-municipio.jpg)

*Figura 4 — Filtro por estado e lista de cooperativas de um município.*

![Políticas Públicas](../manual/img/08-politicas-vazios.jpg)

*Figura 5 — Fila de vazios de atendimento, calculada com Receita Federal e IBGE.*

![Gestão](../manual/img/13-gestao-imgc.jpg)

*Figura 6 — Diagnóstico IMGC com pontuação e gráfico das sete dimensões.*

![Observatório](../manual/img/17-observatorio.jpg)

*Figura 7 — Demografia das cooperativas.*

O conjunto completo de capturas está em `docs/manual/img/` e no manual de utilização. O vídeo `docs/video/CITA-COOP_apresentacao.mp4` foi gravado sobre a plataforma em execução.

# 9. Limitações dos testes

- Não houve teste com usuários finais.
- O navegador usado foi o Chromium; Firefox e Safari serão incluídos no TRL 5.
- Não houve teste de carga, pois ainda não há servidor de aplicação.
- O intérprete do VLibras depende de serviço externo (`vlibras.gov.br`); o teste confere a integração, não o serviço.
