#!/usr/bin/env python3
"""Água por município: ISH (ANA), bacias, rios e lagos (HydroSHEDS).

parte "ish":    Índice de Segurança Hídrica da ANA, diagnóstico 2017 e projeção 2035 (polígonos de ottobacias).
                As classes Mínimo/Baixo/Médio/Alto/Máximo viram 1 a 5 (maior = mais segurança hídrica); média ponderada pela área.
parte "bacias": HydroBASINS (níveis 5 e 7): bacia dominante e número de bacias de cada município.
parte "rios":   HydroRIVERS: extensão da rede de drenagem, maior ordem de Strahler e maior vazão média (trecho atribuído ao
                município que contém o seu ponto médio).
parte "lagos":  HydroLAKES: número e área de lagos e reservatórios (atribuídos ao município do ponto representativo).
Saídas: data/risco/{ish,bacias,rios,lagos}.csv
Uso: python3 scripts/etl/risco_hidro.py <parte> <pasta com os dados brutos> <BR_Municipios_2022.shp>
"""
import csv, glob, os, sys, time
import numpy as np
import pandas as pd
import pyogrio, shapely
from rasterio.features import rasterize
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _grade import DADOS, NCOL, NROW, grade_municipios, ids_em, pesos_area, transform

PARTE, BRUTO, SHP = sys.argv[1], sys.argv[2], sys.argv[3]
t0 = time.time(); log = lambda *a: print(f"[{time.time() - t0:5.0f}s]", *a, flush=True)
ids, codigos = grade_municipios(SHP); n = len(codigos); alvo = ids.ravel()
PESO = np.broadcast_to(pesos_area()[:, None], (NROW, NCOL)).ravel()
BBOX = (-74.2, -34.0, -28.6, 5.5)

def gravar(nome, cabecalho, linhas):
    with open(os.path.join(DADOS, nome), "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, delimiter=";"); w.writerow(["cod_ibge"] + cabecalho)
        for c, l in zip(codigos, linhas): w.writerow([c] + l)
    log("gravado", nome)

def rasterizar(geoms):
    """Grade (NROW x NCOL) com a posição + 1 do polígono em cada célula (0 = nenhum)."""
    formas = ((g, i + 1) for i, g in enumerate(geoms))
    return rasterize(formas, out_shape=(NROW, NCOL), transform=transform(), fill=0, dtype="int32").ravel()

def media(vals_por_poligono, g):
    """Média por município, ponderada pela área da célula, ignorando NaN."""
    v = np.concatenate([[np.nan], vals_por_poligono])[g]
    ok = (alvo > 0) & ~np.isnan(v)
    s = np.bincount(alvo[ok], weights=v[ok] * PESO[ok], minlength=n + 1)[1:]
    q = np.bincount(alvo[ok], weights=PESO[ok], minlength=n + 1)[1:]
    return np.divide(s, q, out=np.full(n, np.nan), where=q > 0)

fmt = lambda x: "" if x is None or (isinstance(x, float) and np.isnan(x)) else round(float(x), 3)

if PARTE == "ish":
    CLASSE = {"Mínimo": 1, "Baixo": 2, "Médio": 3, "Alto": 4, "Máximo": 5}
    CAMPOS = {"2017": (glob.glob(f"{BRUTO}/ish17/x/ISH_2017.shp")[0], {"geral": "brasil", "humana": "humana", "economica": "economica", "ecossistemica": "ecossistem", "resiliencia": "resilienc"}),
              "2035": (glob.glob(f"{BRUTO}/ish/x/ISH_Brasil.shp")[0], {"geral": "ish_bra_gr", "humana": "gr_ish_hum", "economica": "gr_ish_eco", "ecossistemica": "gr_ish_amb", "resiliencia": "gr_ish_res"})}
    def ler_ish(arq, campos, bloco=40000):
        """Lê o shapefile em blocos (são 562 mil polígonos) e rasteriza cada bloco na mesma grade."""
        total = pyogrio.read_info(arq)["features"]; g = np.zeros((NROW, NCOL), dtype="int32"); vals = {k: [] for k in campos}
        for ini in range(0, total, bloco):
            gdf = pyogrio.read_dataframe(arq, columns=list(campos.values()), skip_features=ini, max_features=bloco)
            rasterize(((geom, ini + i + 1) for i, geom in enumerate(gdf.geometry.values)), out=g, transform=transform())
            for k, col in campos.items(): vals[k].append(gdf[col].map(CLASSE).astype("float64").to_numpy())
            log(f"  {min(ini + bloco, total):,} de {total:,} polígonos")
        return g.ravel(), {k: np.concatenate(v) for k, v in vals.items()}
    cab, cols = [], []
    for ano, (arq, campos) in CAMPOS.items():
        g, vv = ler_ish(arq, campos); log(f"ISH {ano}: rasterizado ({(g > 0).sum():,} células com ISH)")
        for nome in campos:
            v = vv[nome]                                                 # "Não se aplica" e vazio viram NaN
            cols.append(media(v, g)); cab.append(f"ish{ano}_{nome}")
            if nome == "geral":                                          # parte da área em segurança mínima ou baixa
                baixo = np.where(np.isnan(v), np.nan, (v <= 2).astype("float64"))
                cols.append(media(baixo, g) * 100); cab.append(f"ish{ano}_pct_area_baixa")
        del g, vv
    gravar("ish.csv", cab, [[fmt(c[i]) for c in cols] for i in range(n)])

elif PARTE == "bacias":
    saida = {}
    for nivel in ("05", "07"):
        gdf = pyogrio.read_dataframe(glob.glob(f"{BRUTO}/hybas/x/hybas_sa_lev{nivel}_v1c.shp")[0], columns=["HYBAS_ID", "UP_AREA", "SUB_AREA"])
        g = rasterizar(gdf.geometry.values); ok = (alvo > 0) & (g > 0)
        df = pd.DataFrame({"m": alvo[ok], "b": g[ok]}); cont = df.groupby(["m", "b"]).size().rename("c").reset_index()
        dom = cont.sort_values("c", ascending=False).drop_duplicates("m").set_index("m")
        tot = cont.groupby("m")["c"].sum(); nb = cont.groupby("m").size()
        saida[nivel] = (gdf, dom, tot, nb); log(f"HydroBASINS nível {nivel}: {len(gdf):,} bacias")
    g5, dom5, tot5, _ = saida["05"]; g7, dom7, _, nb7 = saida["07"]
    linhas = []
    for i in range(n):
        m = i + 1
        if m in dom5.index:
            b5 = g5.iloc[int(dom5.loc[m, "b"]) - 1]; p5 = dom5.loc[m, "c"] / tot5.loc[m] * 100
            b7 = g7.iloc[int(dom7.loc[m, "b"]) - 1] if m in dom7.index else None
            linhas.append([int(b5["HYBAS_ID"]), fmt(p5), int(nb7.get(m, 0)), fmt(b7["UP_AREA"]) if b7 is not None else "", fmt(b7["SUB_AREA"]) if b7 is not None else ""])
        else: linhas.append(["", "", "", "", ""])
    gravar("bacias.csv", ["bacia5_id", "bacia5_pct_area", "n_bacias7", "bacia7_area_montante_km2", "bacia7_area_km2"], linhas)

elif PARTE == "rios":
    gdf = pyogrio.read_dataframe(glob.glob(f"{BRUTO}/rios/x/**/HydroRIVERS_v10_sa.shp", recursive=True)[0], columns=["LENGTH_KM", "ORD_STRA", "DIS_AV_CMS"])
    log(f"HydroRIVERS: {len(gdf):,} trechos")
    pm = shapely.line_interpolate_point(gdf.geometry.values, 0.5, normalized=True)
    m = ids_em(ids, shapely.get_x(pm), shapely.get_y(pm)); ok = m > 0
    km = np.bincount(m[ok], weights=gdf["LENGTH_KM"].to_numpy()[ok], minlength=n + 1)[1:]
    df = pd.DataFrame({"m": m[ok], "ord": gdf["ORD_STRA"].to_numpy()[ok], "q": gdf["DIS_AV_CMS"].to_numpy()[ok]})
    mx = df.groupby("m").agg(ord=("ord", "max"), q=("q", "max"))
    gravar("rios.csv", ["rios_km", "rios_ordem_max", "rios_vazao_max_m3s"],
           [[fmt(km[i]), int(mx.loc[i + 1, "ord"]) if i + 1 in mx.index else "", fmt(mx.loc[i + 1, "q"]) if i + 1 in mx.index else ""] for i in range(n)])

elif PARTE == "lagos":
    gdf = pyogrio.read_dataframe(glob.glob(f"{BRUTO}/lagos/x/**/HydroLAKES_polys_v10.shp", recursive=True)[0], bbox=BBOX, columns=["Lake_type", "Lake_area", "Vol_total"])
    log(f"HydroLAKES na área do Brasil: {len(gdf):,} corpos d'água")
    pt = shapely.point_on_surface(gdf.geometry.values)
    m = ids_em(ids, shapely.get_x(pt), shapely.get_y(pt)); ok = m > 0
    d = pd.DataFrame({"m": m[ok], "tipo": gdf["Lake_type"].to_numpy()[ok], "area": gdf["Lake_area"].to_numpy()[ok], "vol": gdf["Vol_total"].to_numpy()[ok]})
    tot = d.groupby("m").agg(n=("area", "size"), area=("area", "sum"), vol=("vol", "sum"))
    res = d[d.tipo == 2].groupby("m").agg(nr=("area", "size"), ar=("area", "sum"))
    linhas = []
    for i in range(n):
        k = i + 1; t = tot.loc[k] if k in tot.index else None; r = res.loc[k] if k in res.index else None
        linhas.append([int(t["n"]) if t is not None else 0, fmt(t["area"]) if t is not None else 0, int(r["nr"]) if r is not None else 0,
                       fmt(r["ar"]) if r is not None else 0, fmt(t["vol"]) if t is not None else 0])
    gravar("lagos.csv", ["lagos_n", "lagos_area_km2", "reservatorios_n", "reservatorios_area_km2", "lagos_volume_milhoes_m3"], linhas)
