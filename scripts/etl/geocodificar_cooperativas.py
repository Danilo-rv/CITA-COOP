#!/usr/bin/env python3
"""Geocodificacao nivel 1 (centroide do municipio) das cooperativas.

Entrada: data/cooperativas_cnpj.csv, data/municipios_ibge.csv, data/municipios_rfb.csv
Saida:   data/cooperativas_brasil.csv e data/cooperativas_brasil.geojson
Cada registro traz `precisao_geo` = 'municipio' (nivel 1). Niveis 2-4 (CEP, endereco, validacao manual)
sao etapas posteriores.
"""
import csv, json, os, unicodedata
D = os.path.join(os.path.dirname(__file__), "..", "..", "data")

def norm(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().upper()
    return " ".join(s.replace("'", " ").replace("-", " ").split())

rfb = {r["cod_rfb"]: r["municipio_rfb"] for r in csv.DictReader(open(f"{D}/municipios_rfb.csv", encoding="utf-8"), delimiter=";")}
ibge = {}
for r in csv.DictReader(open(f"{D}/municipios_ibge.csv", encoding="utf-8"), delimiter=";"):
    ibge[(r["uf"], norm(r["municipio"]))] = r
# apelidos de grafia que diferem entre Receita e IBGE (acrescentar conforme o relatorio de nao casados)
APELIDOS = {}

SIT = {"01": "NULA", "2": "ATIVA", "3": "SUSPENSA", "4": "INAPTA", "8": "BAIXADA"}
ok, falha, linhas, feats = 0, {}, [], []
for r in csv.DictReader(open(f"{D}/cooperativas_cnpj.csv", encoding="utf-8"), delimiter=";"):
    nome = rfb.get(r["municipio_cod_rfb"], "")
    chave = (r["uf"], APELIDOS.get((r["uf"], norm(nome)), norm(nome)))
    m = ibge.get(chave)
    r["situacao"] = SIT.get(r["situacao_cadastral"].lstrip("0") or r["situacao_cadastral"], r["situacao_cadastral"])
    if m:
        r.update(cod_ibge=m["cod_ibge"], municipio=m["municipio"], lat=m["lat"], lon=m["lon"], precisao_geo="municipio")
        ok += 1
        feats.append({"type": "Feature", "geometry": {"type": "Point", "coordinates": [float(m["lon"]), float(m["lat"])]},
                      "properties": {k: r[k] for k in ("cnpj", "razao_social", "uf", "municipio", "cod_ibge", "situacao", "cnae_principal", "precisao_geo")}})
    else:
        r.update(cod_ibge="", municipio=nome, lat="", lon="", precisao_geo="")
        falha[(r["uf"], nome)] = falha.get((r["uf"], nome), 0) + 1
    linhas.append(r)

campos = list(linhas[0].keys())
with open(f"{D}/cooperativas_brasil.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=campos, delimiter=";"); w.writeheader(); w.writerows(linhas)
json.dump({"type": "FeatureCollection", "features": feats}, open(f"{D}/cooperativas_brasil.geojson", "w"), ensure_ascii=False)
print(f"{len(linhas)} estabelecimentos; {ok} geocodificados ({100*ok/len(linhas):.2f}%); {len(linhas)-ok} sem municipio casado")
for k, v in sorted(falha.items(), key=lambda x: -x[1])[:25]: print("  nao casado:", k, v)
