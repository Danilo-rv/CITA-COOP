#!/usr/bin/env python3
"""Gera data/municipios_ibge.csv (codigo IBGE, nome, UF, lat, lon do ponto representativo)
a partir da malha municipal do IBGE (BR_Municipios_2022.shp) e a tabela de municipios da Receita (cod_rfb -> nome), para o cruzamento por UF + nome.

Uso: python3 scripts/etl/municipios_ibge.py caminho/BR_Municipios_2022.shp
Requer: pip install pyshp shapely
"""
import csv, sys, os, subprocess, unicodedata, io
import shapefile
from shapely.geometry import shape

def norm(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().upper()
    return " ".join(s.replace("'", " ").replace("-", " ").split())

UF = {"11":"RO","12":"AC","13":"AM","14":"RR","15":"PA","16":"AP","17":"TO","21":"MA","22":"PI","23":"CE","24":"RN",
      "25":"PB","26":"PE","27":"AL","28":"SE","29":"BA","31":"MG","32":"ES","33":"RJ","35":"SP","41":"PR","42":"SC",
      "43":"RS","50":"MS","51":"MT","52":"GO","53":"DF"}
out = os.path.join(os.path.dirname(__file__), "..", "..", "data"); os.makedirs(out, exist_ok=True)
r = shapefile.Reader(sys.argv[1], encoding="utf-8")
campos = [f[0] for f in r.fields[1:]]
ibge = []
for sr in r.iterShapeRecords():
    d = dict(zip(campos, sr.record))
    p = shape(sr.shape.__geo_interface__).representative_point()
    cod = str(d["CD_MUN"])
    ibge.append((cod, d["NM_MUN"], UF[cod[:2]], round(p.y, 6), round(p.x, 6)))

# de-para Receita -> IBGE (por UF + nome normalizado)
BASE = "https://arquivos.receitafederal.gov.br/public.php/webdav/Dados/Cadastros/CNPJ"
mes = sys.argv[2] if len(sys.argv) > 2 else "2026-10"
raw = subprocess.run(f'curl -sS --fail -u "gn672Ad4CF8N6TK:" "{BASE}/{mes}/Municipios.zip" | funzip',
                     shell=True, capture_output=True, check=True).stdout.decode("latin-1")
rfb = list(csv.reader(io.StringIO(raw), delimiter=";"))
with open(os.path.join(out, "municipios_rfb.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f, delimiter=";"); w.writerow(["cod_rfb", "municipio_rfb"]); w.writerows(rfb)
with open(os.path.join(out, "municipios_ibge.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f, delimiter=";"); w.writerow(["cod_ibge", "municipio", "uf", "lat", "lon"])
    for cod, nm, uf, la, lo in ibge:
        w.writerow([cod, nm, uf, la, lo])
print(f"{len(ibge)} municipios IBGE; {len(rfb)} municipios Receita")
