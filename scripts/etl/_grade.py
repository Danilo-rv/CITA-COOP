"""Grade comum para cruzar camadas diferentes por município.

Todas as fontes (vetoriais e rasters, em projeções diferentes) são levadas a uma grade regular em latitude e
longitude de 0,01° (cerca de 1,1 km) que cobre o Brasil. Cada célula recebe o código do município em que está.
Médias e somas por município são calculadas contando as células (ou os pixels) de cada um.
"""
import os
import numpy as np

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
DADOS = os.path.join(RAIZ, "data", "risco")
LON0, LAT0, PASSO = -74.1, 5.4, 0.01
NCOL, NROW = 4540, 3930           # cobre de -74,1 a -28,7 (lon) e de 5,4 a -33,9 (lat)
os.makedirs(DADOS, exist_ok=True)

def transform():
    from rasterio.transform import from_origin
    return from_origin(LON0, LAT0, PASSO, PASSO)

def centros():
    """Longitude e latitude do centro de cada coluna e de cada linha da grade."""
    lon = LON0 + (np.arange(NCOL) + 0.5) * PASSO
    lat = LAT0 - (np.arange(NROW) + 0.5) * PASSO
    return lon, lat

def grade_municipios(shp):
    """(ids, codigos): ids[linha, coluna] = posição do município em `codigos` + 1 (0 = fora do Brasil)."""
    cache = os.path.join(DADOS, "grade_municipios.npz")
    if os.path.exists(cache):
        z = np.load(cache, allow_pickle=True); return z["ids"], list(z["codigos"])
    import shapefile
    from shapely.geometry import shape
    from rasterio.features import rasterize
    r = shapefile.Reader(shp, encoding="utf-8"); campos = [f[0] for f in r.fields[1:]]
    codigos, formas = [], []
    for i, sr in enumerate(r.iterShapeRecords()):
        codigos.append(str(dict(zip(campos, sr.record))["CD_MUN"]))
        formas.append((sr.shape.__geo_interface__, i + 1))
    ids = rasterize(formas, out_shape=(NROW, NCOL), transform=transform(), fill=0, dtype="int32")
    np.savez_compressed(cache, ids=ids, codigos=np.array(codigos))
    return ids, codigos

def ids_em(ids, lon, lat):
    """Código (posição + 1) do município em cada ponto lon/lat; 0 fora da grade ou do Brasil."""
    c = np.floor((np.asarray(lon) - LON0) / PASSO).astype("int64")
    l = np.floor((LAT0 - np.asarray(lat)) / PASSO).astype("int64")
    dentro = (c >= 0) & (c < NCOL) & (l >= 0) & (l < NROW)
    out = np.zeros(c.shape, dtype="int32")
    out[dentro] = ids[l[dentro], c[dentro]]
    return out

def pesos_area():
    """Peso de cada linha da grade proporcional à área da célula (diminui com a latitude)."""
    _, lat = centros()
    return np.cos(np.radians(lat))
