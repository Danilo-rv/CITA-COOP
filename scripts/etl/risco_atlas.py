#!/usr/bin/env python3
"""Atlas Digital de Desastres (MDR): agrega o histórico 1991–2025 por município.

Fonte: https://atlasdigital.mdr.gov.br/paginas/downloads.xhtml (base completa, CSV).
Entrada: caminho do CSV baixado.  Saída: data/risco/atlas.json
Uso: python3 scripts/etl/risco_atlas.py <BD_Atlas_*.csv>
"""
import csv, json, os, re, sys, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _grade import DADOS

GRUPOS = ["Estiagem e seca", "Enxurradas e inundações", "Tempestades", "Incêndio florestal", "Movimentos de massa", "Outros"]
TIPOLOGIA = {"Estiagem e Seca": 0, "Enxurradas": 1, "Inundações": 1, "Alagamentos": 1,
             "Chuvas Intensas": 2, "Vendavais e Ciclones": 2, "Granizo": 2, "Tornado": 2,
             "Incêndio Florestal": 3, "Movimento de Massa": 4, "Erosão": 4}   # o resto vai para "Outros" (5)
ANO_INI, ANO_FIM, JANELA = 1991, 2025, 10
num = lambda s: float(s) if re.fullmatch(r"-?\d+(\.\d+)?", (s or "").strip()) else 0.0

csv.field_size_limit(10**7)
mun = collections.defaultdict(lambda: {"n": [0] * 6, "recente": 0, "pessoas": 0.0, "mortos": 0.0, "agro": 0.0, "total": 0.0})
serie = collections.defaultdict(lambda: [[0] * 6 for _ in range(ANO_FIM - ANO_INI + 1)])   # UF -> ano -> grupo
n_reg = 0
for r in csv.DictReader(open(sys.argv[1], encoding="latin-1"), delimiter=";"):
    cod = r["Cod_IBGE_Mun"].strip(); ano = r["Data_Evento"].strip()[-4:]
    if not cod or not ano.isdigit() or not ANO_INI <= int(ano) <= ANO_FIM: continue
    g = TIPOLOGIA.get(r["descricao_tipologia"], 5); m = mun[cod]; n_reg += 1
    m["n"][g] += 1
    if int(ano) > ANO_FIM - JANELA: m["recente"] += 1
    m["pessoas"] += num(r["DH_total_danos_humanos_diretos"]); m["mortos"] += num(r["DH_MORTOS"])
    m["agro"] += num(r["PEPR_Agricultura (R$)"]) + num(r["PEPR_Pecuária (R$)"]); m["total"] += num(r["PE_PLePR"])
    serie[r["Sigla_UF"]][int(ano) - ANO_INI][g] += 1

saida = {
    "fonte": "Atlas Digital de Desastres no Brasil (MDR), base consolidada v1.1, 1991–2025", "grupos": GRUPOS,
    "anos": [ANO_INI, ANO_FIM], "janela_recente": f"{ANO_FIM - JANELA + 1}–{ANO_FIM}", "registros": n_reg,
    # [cod_ibge, total, [n por grupo], n_recentes, pessoas_afetadas, mortos, perda_agro_R$, perda_total_R$]
    "municipios": [[c, sum(m["n"]), m["n"], m["recente"], round(m["pessoas"]), round(m["mortos"]), round(m["agro"]), round(m["total"])] for c, m in sorted(mun.items())],
    "serie_uf": dict(sorted(serie.items())),
}
json.dump(saida, open(os.path.join(DADOS, "atlas.json"), "w"), ensure_ascii=False, separators=(",", ":"))
print(f"{n_reg} registros · {len(mun)} municípios · grupos: " + ", ".join(f"{g}={sum(m['n'][i] for m in mun.values())}" for i, g in enumerate(GRUPOS)))
