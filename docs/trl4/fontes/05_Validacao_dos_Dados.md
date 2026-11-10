# 1. Objetivo

Demonstrar que a base de dados usada pela plataforma é real, íntegra e coerente com as fontes oficiais.

# 2. Fontes e tratamento

| Fonte | Órgão | Referência | Forma de acesso | Uso |
|---|---|---|---|---|
| Cadastro Nacional da Pessoa Jurídica | Receita Federal | Outubro de 2026 | Dados abertos (download) | Cooperativas: identificação, endereço, atividade, situação |
| Malha municipal e estadual | IBGE | 2022 | Dados abertos (download) | Localização dos municípios e contorno das UFs |
| Censo Agropecuário, tabela 6778 | IBGE (SIDRA) | 2017 | API pública | Estabelecimentos agropecuários e da agricultura familiar |
| Tabela de CNAE | Receita Federal | Outubro de 2026 | Dados abertos | Descrição da atividade e estimativa do ramo |

# 3. Números da base

| Indicador | Valor |
|---|---|
| Registros de cooperativas (natureza jurídica 214-3), todas as situações | {{total}} |
| CNPJ raiz de cooperativas identificados | 46.940 |
| Estabelecimentos ativos | 38.668 |
| Estabelecimentos ativos localizados e publicados | **{{ativas}}** |
| Matrizes ativas | {{matrizes}} |
| Municípios com ao menos uma cooperativa ativa | {{mun_coop}} de 5.572 |
| Unidades da Federação cobertas | 27 |
| Cobertura da geocodificação (nível município) | {{geo}}% |
| Registros sem município identificado | 12 |

Os 12 registros sem município são: 7 em Boa Esperança do Norte (MT), município instalado depois da malha de 2022; 3 em Santa Teresinha (BA), com grafia divergente entre as fontes; e 2 no exterior.

# 4. Verificações automáticas

O script `scripts/etl/validar_dados.py` executa {{n_dados}} verificações. Resultado da execução:

```
{{arquivo:validacao_dados.txt}}
```

Destaques:

- **100% dos CNPJ têm dígitos verificadores válidos**, o que confirma a integridade da extração.
- Os totais do Censo carregados (**5.073.324** estabelecimentos; **3.897.408** da agricultura familiar) coincidem com os totais nacionais divulgados pelo IBGE.
- As somas por município, por UF e por ramo fecham com o total nacional.
- Nenhum telefone ou e-mail é publicado.

# 5. Linhagem

Cada conjunto tem a sua ficha no **Catálogo de dados** da plataforma (Observatório), com origem, atualização, cobertura, caminho percorrido até a tela e limitações. A figura mostra a ficha do CNPJ.

![Catálogo de dados](../manual/img/19-observatorio-catalogo.jpg)

*Figura 1 — Ficha de linhagem no catálogo de dados.*

# 6. Limitações conhecidas

| Limitação | Consequência | Encaminhamento |
|---|---|---|
| A base reúne cooperativas de todos os ramos | Não isola as cooperativas da agricultura familiar | Integração do CAF Jurídico por acordo com o MDA ou pedido via LAI |
| Localização pela sede do município | Não permite análise dentro do município | Geocodificação por CEP e endereço |
| Ramo estimado pelo CNAE principal | Pode divergir do ramo registrado na OCB | Parceria com o Sistema OCB |
| O indicador usa a sede da cooperativa | Cooperativas que atuam em municípios vizinhos não aparecem neles | Área de abrangência pelos vínculos do CAF |
| Censo Agropecuário de 2017 | Denominador com alguns anos de defasagem | Atualização quando houver novo censo |
| O CNPJ guarda só a situação atual | A série de baixas concentra registros em 2008 e 2015 | Leitura cautelosa, indicada na própria tela |
| Consulta pública do CAF protegida por captcha | Percentual de cooperados com CAF não verificado | Não automatizar; obter por via institucional |
