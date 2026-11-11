#!/usr/bin/env python3
"""SoilGrids 2.0 (ISRIC) por município: média de pH, argila, areia, carbono orgânico e CTC na camada de 0 a 30 cm.

Os mapas originais têm 250 m e cerca de 5 GB cada. Aqui se lê, pela rede e só na área do Brasil, a versão de 1 km
(pirâmide .ovr publicada junto com cada mapa), sem baixar os arquivos inteiros. A camada de 0–30 cm é a média ponderada
pela espessura de 0–5 cm (peso 5), 5–15 cm (peso 10) e 15–30 cm (peso 15).
Saída: data/risco/solo_<propriedade>.csv  (cod_ibge;<propriedade>), um arquivo por propriedade, para poder rodar em paralelo.
Uso: python3 scripts/etl/risco_solo.py <BR_Municipios_2022.shp> [ph argila_pct areia_pct carbono_g_kg ctc_cmolc_kg]
"""
import csv, os, sys, time
import numpy as np
import rasterio
from rasterio.windows import Window
from rasterio.enums import Resampling
from pyproj import Transformer
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _grade import DADOS, grade_municipios, ids_em, LON0, LAT0

BASE = "/vsicurl/https://files.isric.org/soilgrids/latest/data/{p}/{p}_{d}_mean.vrt"
PROPS = {"ph": ("phh2o", 10.0), "argila_pct": ("clay", 10.0), "areia_pct": ("sand", 10.0), "carbono_g_kg": ("soc", 10.0), "ctc_cmolc_kg": ("cec", 10.0)}
PROFUNDIDADES = [("0-5cm", 5), ("5-15cm", 10), ("15-30cm", 15)]
FATOR = 4                                       # camada de 1 km (pirâmide com redução 4x sobre os 250 m)
NODATA = -32768
t0 = time.time(); log = lambda *a: print(f"[{time.time() - t0:5.0f}s]", *a, flush=True)

ids, codigos = grade_municipios(sys.argv[1])
env = rasterio.Env(GDAL_HTTP_CAINFO="/root/.ccr/ca-bundle.crt", GDAL_HTTP_TIMEOUT="120", GDAL_HTTP_MAX_RETRY="4", GDAL_HTTP_RETRY_DELAY="3",
                   CPL_VSIL_CURL_ALLOWED_EXTENSIONS=".vrt,.ovr,.tif", GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR", VSI_CACHE="TRUE")
with env:
    with rasterio.open(BASE.format(p="phh2o", d="0-5cm")) as d:
        crs, tr, W, H = d.crs, d.transform, d.width, d.height
    # janela do Brasil na projeção do mapa (Goode interrompida): caixa que contém uma malha de pontos sobre o país
    ida = Transformer.from_crs(4326, crs, always_xy=True)
    gx, gy = np.meshgrid(np.arange(-74.1, -28.6, 0.5), np.arange(5.4, -34.0, -0.5))
    x, y = ida.transform(gx.ravel(), gy.ravel())
    c0 = max(0, int((np.min(x) - tr.c) / tr.a) - 40); c1 = min(W, int((np.max(x) - tr.c) / tr.a) + 40)
    r0 = max(0, int((np.max(y) - tr.f) / tr.e) - 40); r1 = min(H, int((np.min(y) - tr.f) / tr.e) + 40)
    c0 -= c0 % FATOR; r0 -= r0 % FATOR; w = (c1 - c0) // FATOR * FATOR; h = (r1 - r0) // FATOR * FATOR
    janela = Window(c0, r0, w, h); oh, ow = h // FATOR, w // FATOR
    log(f"janela do Brasil: {w}x{h} px a 250 m -> {ow}x{oh} px a 1 km")

    # município de cada pixel de 1 km (centro do pixel -> lon/lat -> grade de municípios)
    cache = os.path.join(DADOS, "solo_pixels_municipio.npy")
    if os.path.exists(cache) and np.load(cache, mmap_mode="r").shape == (oh, ow):
        mun = np.load(cache)
    else:
        volta = Transformer.from_crs(crs, 4326, always_xy=True)
        xs = tr.c + (c0 + (np.arange(ow) + 0.5) * FATOR) * tr.a
        mun = np.zeros((oh, ow), dtype="int32")
        for i in range(oh):                    # linha a linha, para não estourar a memória
            ys = np.full(ow, tr.f + (r0 + (i + 0.5) * FATOR) * tr.e)
            lon, lat = volta.transform(xs, ys)
            lon, lat = np.nan_to_num(lon, nan=0, posinf=0, neginf=0), np.nan_to_num(lat, nan=0, posinf=0, neginf=0)
            mun[i] = ids_em(ids, lon, lat)
        np.save(cache, mun)
    log(f"pixels sobre municípios: {(mun > 0).sum():,}")

    n = len(codigos); alvo = mun.ravel()
    contagem = np.bincount(alvo, minlength=n + 1)[1:]
    resultado = {}
    escolhidas = sys.argv[2:] or list(PROPS)
    for campo, (prop, escala) in ((c, PROPS[c]) for c in escolhidas):
        soma = np.zeros(n); peso = np.zeros(n)
        for prof, esp in PROFUNDIDADES:
            for tentativa in range(5):             # a leitura pela rede pode falhar; tenta de novo com espera crescente
                try:
                    with rasterio.open(BASE.format(p=prop, d=prof)) as d:
                        a = d.read(1, window=janela, out_shape=(oh, ow), resampling=Resampling.nearest).ravel()
                    break
                except rasterio.errors.RasterioIOError as e:
                    log(f"{prop} {prof}: leitura falhou ({tentativa + 1}/5): {str(e)[:60]}"); time.sleep(20 * (tentativa + 1))
            else:
                raise RuntimeError(f"não foi possível ler {prop} {prof}")
            ok = (a != NODATA) & (alvo > 0)
            s = np.bincount(alvo[ok], weights=a[ok].astype("float64"), minlength=n + 1)[1:]
            q = np.bincount(alvo[ok], minlength=n + 1)[1:]
            soma += np.divide(s, q, out=np.zeros(n), where=q > 0) / escala * esp
            peso += np.where(q > 0, esp, 0)
            log(f"{prop} {prof}: {ok.sum():,} pixels válidos")
        resultado[campo] = np.divide(soma, peso, out=np.full(n, np.nan), where=peso > 0)

for campo in resultado:
    with open(os.path.join(DADOS, f"solo_{campo}.csv"), "w", newline="", encoding="utf-8") as f:
        w_ = csv.writer(f, delimiter=";"); w_.writerow(["cod_ibge", campo])
        for i, c in enumerate(codigos):
            w_.writerow([c, "" if np.isnan(resultado[campo][i]) else round(float(resultado[campo][i]), 2)])
    log(f"gravado solo_{campo}.csv · sem dado em", int(np.isnan(resultado[campo]).sum()), "municípios")
