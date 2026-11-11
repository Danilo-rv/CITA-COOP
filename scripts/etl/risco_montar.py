#!/usr/bin/env python3
"""Junta as camadas de risco territorial por município e gera os arquivos da tela "Risco Territorial".

Entradas (data/risco/): atlas.json, ivs.csv, ish.csv, solo_*.csv, ghsl.csv, bacias.csv, rios.csv, lagos.csv
Saídas (app/public/dados/):
  risco.json              colunas alinhadas por município (cod_ibge) com todos os indicadores
  risco_serie.json        histórico anual de desastres por UF e no Brasil
  risco_municipios.json   contorno simplificado dos municípios para o mapa
Uso: python3 scripts/etl/risco_montar.py <BR_Municipios_2022.shp>
"""
import csv, glob, json, os, sys
import numpy as np
import shapefile
from shapely.geometry import shape, mapping

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
D, OUT = os.path.join(RAIZ, "data", "risco"), os.path.join(RAIZ, "app", "public", "dados")
SHP = sys.argv[1]

rd = lambda arq: {r["cod_ibge"]: r for r in csv.DictReader(open(os.path.join(D, arq), encoding="utf-8"), delimiter=";")}
def num(x, nd=3):
    try: v = float(x)
    except (TypeError, ValueError): return None
    return None if v != v else round(v, nd)

# --- municípios e áreas
r = shapefile.Reader(SHP, encoding="utf-8"); campos = [f[0] for f in r.fields[1:]]
base = {}
for sr in r.iterShapeRecords():
    p = dict(zip(campos, sr.record)); base[str(p["CD_MUN"])] = {"area": float(p["AREA_KM2"])}
cods = sorted(base)

# --- fontes
atlas = json.load(open(os.path.join(D, "atlas.json"), encoding="utf-8"))
at = {m[0]: m for m in atlas["municipios"]}
ivs = {}
for linha in csv.DictReader(open(os.path.join(D, "ivs.csv"), encoding="utf-8"), delimiter=";"):
    ivs[(linha["cod_ibge"], linha["ano"])] = linha
ish, ghsl, bac, rios, lagos = rd("ish.csv"), rd("ghsl.csv"), rd("bacias.csv"), rd("rios.csv"), rd("lagos.csv")
solo = {c: {} for c in cods}
for arq in glob.glob(os.path.join(D, "solo_*.csv")):
    for linha in csv.DictReader(open(arq, encoding="utf-8"), delimiter=";"):
        solo[linha.pop("cod_ibge")].update(linha)

C = {}                                                   # nome do indicador -> lista alinhada com `cods`
def col(nome, f): C[nome] = [f(c) for c in cods]
ivs_ok = lambda v: None if v is None or v < 0 else v    # a API do IVS usa -1 para "sem dado"
# Atlas: [cod, total, [n por grupo], recentes, pessoas, mortos, perda_agro, perda_total]
col("des_total", lambda c: at[c][1] if c in at else 0)
for i, nome in enumerate(["seca", "cheias", "tempestades", "incendio", "massa", "outros"]):
    col(f"des_{nome}", lambda c, i=i: at[c][2][i] if c in at else 0)
col("des_recentes", lambda c: at[c][3] if c in at else 0)
col("pessoas_afetadas", lambda c: at[c][4] if c in at else 0)
col("mortos", lambda c: at[c][5] if c in at else 0)
col("perda_agro", lambda c: at[c][6] if c in at else 0)
col("perda_total", lambda c: at[c][7] if c in at else 0)
# IVS
col("ivs2000", lambda c: ivs_ok(num(ivs.get((c, "2000"), {}).get("ivs"))))
for k, nome in [("ivs", "ivs2010"), ("infra", "ivs_infra"), ("capital_humano", "ivs_capital"), ("renda_trabalho", "ivs_renda")]:
    col(nome, lambda c, k=k: ivs_ok(num(ivs.get((c, "2010"), {}).get(k))))
# ISH
for k in ["ish2017_geral", "ish2017_humana", "ish2017_economica", "ish2017_ecossistemica", "ish2017_resiliencia", "ish2017_pct_area_baixa",
          "ish2035_geral", "ish2035_humana", "ish2035_economica", "ish2035_ecossistemica", "ish2035_resiliencia", "ish2035_pct_area_baixa"]:
    col(k, lambda c, k=k: num(ish.get(c, {}).get(k), 2))
# solo
for k in ["ph", "argila_pct", "areia_pct", "carbono_g_kg", "ctc_cmolc_kg"]:
    col(k, lambda c, k=k: num(solo[c].get(k), 1))
# população e urbanização
col("pop2000", lambda c: num(ghsl.get(c, {}).get("pop2000"), 0)); col("pop2020", lambda c: num(ghsl.get(c, {}).get("pop2020"), 0))
col("area_construida_km2", lambda c: num(ghsl.get(c, {}).get("built2020_km2"), 2))
def pct_rural(c):
    g = ghsl.get(c, {}); p = num(g.get("pop2020")); rr = num(g.get("pop_rural2020"))
    return round(100 * rr / p, 1) if p and p > 0 and rr is not None else None
col("pct_pop_rural", pct_rural)
col("cresc_pop_pct", lambda c: round(100 * (num(ghsl[c]["pop2020"]) / num(ghsl[c]["pop2000"]) - 1), 1) if c in ghsl and num(ghsl[c]["pop2000"]) else None)
col("densidade_hab_km2", lambda c: round(num(ghsl[c]["pop2020"]) / base[c]["area"], 1) if c in ghsl and base[c]["area"] > 0 else None)
# água
col("bacia5_id", lambda c: int(float(bac[c]["bacia5_id"])) if bac.get(c, {}).get("bacia5_id") else None)
col("n_bacias7", lambda c: int(float(bac[c]["n_bacias7"])) if bac.get(c, {}).get("n_bacias7") else None)
col("rios_km", lambda c: num(rios.get(c, {}).get("rios_km"), 1))
col("rios_km_km2", lambda c: round(num(rios[c]["rios_km"]) / base[c]["area"], 3) if c in rios and num(rios[c]["rios_km"]) is not None and base[c]["area"] > 0 else None)
col("rios_ordem_max", lambda c: int(float(rios[c]["rios_ordem_max"])) if rios.get(c, {}).get("rios_ordem_max") else None)
col("lagos_area_km2", lambda c: num(lagos.get(c, {}).get("lagos_area_km2"), 2))
col("reservatorios_n", lambda c: int(float(lagos[c]["reservatorios_n"])) if c in lagos and lagos[c]["reservatorios_n"] != "" else None)
col("reservatorios_area_km2", lambda c: num(lagos.get(c, {}).get("reservatorios_area_km2"), 2))
col("area_km2", lambda c: round(base[c]["area"], 1))

fontes = {
  "atlas": {"nome": "Atlas Digital de Desastres no Brasil", "orgao": "MDR", "periodo": f"{atlas['anos'][0]}–{atlas['anos'][1]}", "janela_recente": atlas["janela_recente"], "registros": atlas["registros"]},
  "ivs": {"nome": "Índice de Vulnerabilidade Social", "orgao": "Ipea", "periodo": "Censo 2000 e 2010"},
  "ish": {"nome": "Índice de Segurança Hídrica", "orgao": "ANA (SNIRH)", "periodo": "diagnóstico 2017 e projeção 2035"},
  "solo": {"nome": "SoilGrids 2.0", "orgao": "ISRIC", "periodo": "0–30 cm, 1 km"},
  "ghsl": {"nome": "Global Human Settlement Layer R2023A", "orgao": "Comissão Europeia (JRC)", "periodo": "2000 e 2020, 1 km"},
  "hydro": {"nome": "HydroSHEDS (HydroBASINS, HydroRIVERS, HydroLAKES)", "orgao": "WWF / HydroSHEDS", "periodo": "v1c / v10"},
}
os.makedirs(OUT, exist_ok=True)
json.dump({"fontes": fontes, "grupos_desastre": atlas["grupos"], "cod": cods, "col": C}, open(os.path.join(OUT, "risco.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"), allow_nan=False)
brasil = np.sum([np.array(v) for v in atlas["serie_uf"].values()], axis=0).tolist()
json.dump({"anos": atlas["anos"], "grupos": atlas["grupos"], "brasil": brasil, "uf": atlas["serie_uf"]}, open(os.path.join(OUT, "risco_serie.json"), "w"), separators=(",", ":"))

# --- contorno simplificado dos municípios (para o mapa em cores)
def arred(g):
    return [round(g[0], 3), round(g[1], 3)] if isinstance(g[0], (int, float)) else [arred(x) for x in g]
feats = []
for sr in r.iterShapeRecords():
    p = dict(zip(campos, sr.record)); geom = shape(sr.shape.__geo_interface__).simplify(0.01, preserve_topology=True)
    if geom.is_empty: geom = shape(sr.shape.__geo_interface__)
    gj = mapping(geom); feats.append({"type": "Feature", "properties": {"c": str(p["CD_MUN"])}, "geometry": {"type": gj["type"], "coordinates": arred(gj["coordinates"])}})
json.dump({"type": "FeatureCollection", "features": feats}, open(os.path.join(OUT, "risco_municipios.json"), "w"), separators=(",", ":"))

for f in ["risco.json", "risco_serie.json", "risco_municipios.json"]:
    print(f"{f}: {os.path.getsize(os.path.join(OUT, f)) / 1e6:.2f} MB")
print(len(cods), "municípios ·", len(C), "indicadores")
