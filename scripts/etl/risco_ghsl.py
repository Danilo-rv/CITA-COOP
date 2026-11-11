#!/usr/bin/env python3
"""GHSL (Comissão Europeia, R2023A) por município: população 2000 e 2020, área construída 2020 e grau de urbanização.

Usa as grades de 1 km na projeção Mollweide (ESRI:54009): GHS-POP (2000 e 2020), GHS-BUILT-S (2020) e GHS-SMOD (2020,
classes do Grau de Urbanização). Cada pixel de 1 km é atribuído ao município onde está o seu centro.
Saída: data/risco/ghsl.csv
  (cod_ibge;pop2000;pop2020;built2020_km2;pop_rural2020;pop_urbana2020;pixels)
Uso: python3 scripts/etl/risco_ghsl.py <pasta com os .zip do GHSL> <BR_Municipios_2022.shp>
"""
import csv, glob, os, sys, time, zipfile
import numpy as np
import rasterio
from rasterio.windows import Window
from pyproj import Transformer
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _grade import DADOS, grade_municipios, ids_em

PASTA, SHP = sys.argv[1], sys.argv[2]
MOLL = "ESRI:54009"
t0 = time.time(); log = lambda *a: print(f"[{time.time() - t0:5.0f}s]", *a, flush=True)

def tif(padrao):
    z = glob.glob(os.path.join(PASTA, padrao))[0]; destino = os.path.join(PASTA, "tif_" + os.path.basename(z)[:-4])
    if not glob.glob(os.path.join(destino, "*.tif")):
        os.makedirs(destino, exist_ok=True); zipfile.ZipFile(z).extractall(destino)
    return glob.glob(os.path.join(destino, "*.tif"))[0]

arq = {"pop2000": tif("GHS_POP_E2000*.zip"), "pop2020": tif("GHS_POP_E2020*.zip"),
       "built": tif("GHS_BUILT_S_E2020*.zip"), "smod": tif("GHS_SMOD_E2020*.zip")}
ids, codigos = grade_municipios(SHP); n = len(codigos)

with rasterio.open(arq["pop2020"]) as d:
    tr, W, H = d.transform, d.width, d.height
    log(f"grade global: {W}x{H}, pixel {tr.a:.0f} m, crs {d.crs.to_string()[:30]}")
ida = Transformer.from_crs(4326, MOLL, always_xy=True); volta = Transformer.from_crs(MOLL, 4326, always_xy=True)
gx, gy = np.meshgrid(np.arange(-74.1, -28.6, 0.25), np.arange(5.4, -34.0, -0.25))
x, y = ida.transform(gx.ravel(), gy.ravel())
c0 = max(0, int((x.min() - tr.c) / tr.a) - 10); c1 = min(W, int((x.max() - tr.c) / tr.a) + 10)
r0 = max(0, int((y.max() - tr.f) / tr.e) - 10); r1 = min(H, int((y.min() - tr.f) / tr.e) + 10)
janela = Window(c0, r0, c1 - c0, r1 - r0); w, h = c1 - c0, r1 - r0
log(f"janela do Brasil: {w}x{h} px")

xs = tr.c + (c0 + np.arange(w) + 0.5) * tr.a
mun = np.zeros((h, w), dtype="int32")
for i in range(h):
    ys = np.full(w, tr.f + (r0 + i + 0.5) * tr.e)
    lon, lat = volta.transform(xs, ys); mun[i] = ids_em(ids, lon, lat)
alvo = mun.ravel(); log(f"pixels sobre municípios: {(alvo > 0).sum():,}")

def ler(nome):
    with rasterio.open(arq[nome]) as d:
        a = d.read(1, window=janela).astype("float64"); nd = d.nodata
    if nd is not None: a[a == nd] = 0
    a[a < 0] = 0
    return a.ravel()

soma = lambda v, mascara=None: np.bincount(alvo[(alvo > 0) & (mascara if mascara is not None else True)],
                                           weights=v[(alvo > 0) & (mascara if mascara is not None else True)], minlength=n + 1)[1:]
pop20, pop00, built, smod = ler("pop2020"), ler("pop2000"), ler("built"), ler("smod")
res = {"pop2000": soma(pop00), "pop2020": soma(pop20), "built2020_km2": soma(built) / 1e6,
       "pop_rural2020": soma(pop20, (smod >= 11) & (smod <= 13)), "pop_urbana2020": soma(pop20, smod >= 21)}
pixels = np.bincount(alvo[alvo > 0], minlength=n + 1)[1:]
log(f"população 2020 somada: {res['pop2020'].sum():,.0f} | 2000: {res['pop2000'].sum():,.0f} | área construída: {res['built2020_km2'].sum():,.0f} km²")

with open(os.path.join(DADOS, "ghsl.csv"), "w", newline="", encoding="utf-8") as f:
    wr = csv.writer(f, delimiter=";"); wr.writerow(["cod_ibge"] + list(res) + ["pixels"])
    for i, c in enumerate(codigos):
        wr.writerow([c] + [round(float(res[k][i]), 2) for k in res] + [int(pixels[i])])
log("gravado data/risco/ghsl.csv")
