#!/usr/bin/env python3
"""IVS (Ipea) por município, a partir da API pública do portal https://ivs.ipea.gov.br.

O IVS (Índice de Vulnerabilidade Social) vai de 0 (menor) a 1 (maior vulnerabilidade) e tem três dimensões:
Infraestrutura Urbana, Capital Humano, Renda e Trabalho. Anos disponíveis por município: 2000 e 2010 (Censo).
Saída: data/risco/ivs.csv  (cod_ibge;ano;ivs;infra;capital_humano;renda_trabalho)
Uso: python3 scripts/etl/risco_ivs.py
"""
import csv, json, os, ssl, sys, time, urllib.request, collections

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
OUT = os.path.join(RAIZ, "data", "risco"); os.makedirs(OUT, exist_ok=True)
API = "https://ivs.ipea.gov.br/api/api/dadosMapa"
CTX = ssl.create_default_context(cafile="/root/.ccr/ca-bundle.crt") if os.path.exists("/root/.ccr/ca-bundle.crt") else ssl.create_default_context()
ANOS = {13: 2000, 14: 2010}                     # id_ano da API -> ano do Censo
INDICADORES = {1: "ivs", 2: "infra", 3: "capital_humano", 4: "renda_trabalho"}

def consulta(id_ano, id_ind):
    corpo = json.dumps({"id_ano": id_ano, "cod_indicadores": id_ind, "id_camada": 2, "desagregador": None,
                        "tabela": "municipio", "tabela_camada": "municipio", "pesq_id": False, "id_territorialidade": None}).encode()
    req = urllib.request.Request(API, data=corpo, headers={"Content-Type": "application/json", "User-Agent": "CITA-COOP/0.5 (pesquisa)", "Accept": "application/json"})
    for t in range(4):
        try:
            return json.load(urllib.request.urlopen(req, timeout=240, context=CTX))
        except Exception as e:
            print("  tentativa", t + 1, "falhou:", str(e)[:80], file=sys.stderr)
            time.sleep(20 * (t + 1))          # o portal recusa chamadas muito seguidas: espera cada vez mais
    raise RuntimeError("API do IVS indisponível")

tab = collections.defaultdict(dict)
for id_ano, ano in ANOS.items():
    for id_ind, nome in INDICADORES.items():
        time.sleep(8)                        # intervalo educado entre as chamadas
        dados = consulta(id_ano, id_ind)
        feats = dados["shapesCamadaFeatures"][0]["features"]
        nomes = {f["properties"]["nome_ind"] for f in feats}
        print(f"{ano} {nome}: {len(feats)} municípios · indicador na API: {nomes}", flush=True)
        for f in feats:
            p = f["properties"]
            try: v = float(p["valor"])
            except (TypeError, ValueError): continue
            tab[(p["codigo_ibge"], ano)][nome] = v

with open(os.path.join(OUT, "ivs.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f, delimiter=";"); w.writerow(["cod_ibge", "ano"] + list(INDICADORES.values()))
    for (cod, ano), v in sorted(tab.items()):
        w.writerow([cod, ano] + [v.get(n, "") for n in INDICADORES.values()])
print("gravado:", len(tab), "linhas município-ano")
