#!/usr/bin/env python3
"""Gera os arquivos JSON consumidos pela plataforma web (app/public/dados).

Entradas:
  data/cooperativas_brasil.csv   (scripts/etl/geocodificar_cooperativas.py)
  data/municipios_ibge.csv       (scripts/etl/municipios_ibge.py)
  <dir>/BR_UF_2022.shp           malha de UFs do IBGE
  <dir>/cnaes.csv                tabela de CNAEs da Receita
  SIDRA/IBGE tabela 6778         estabelecimentos agropecuarios e da agricultura familiar (Censo Agro 2017)

Uso: python3 scripts/etl/gerar_dados_app.py <dir_com_shp_e_cnaes> [AAAA-MM]
"""
import csv, json, os, sys, collections, urllib.request, time
import shapefile
from shapely.geometry import shape, mapping

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
D = os.path.join(RAIZ, "data"); OUT = os.path.join(RAIZ, "app", "public", "dados")
PREP = sys.argv[1]; CARGA = sys.argv[2] if len(sys.argv) > 2 else "2026-10"
os.makedirs(os.path.join(OUT, "coops"), exist_ok=True)

RAMOS = ["Agropecuário", "Crédito", "Saúde", "Transporte", "Infraestrutura", "Consumo", "Trabalho, produção e serviços", "Outros"]

def ramo(cnae):
    """Ramo estimado a partir do CNAE principal (aproximacao; o ramo oficial e o do registro na OCB)."""
    d, c4 = cnae[:2], cnae[:4]
    if c4 in ("6550", "6520") or d in ("86", "87", "88"): return 2
    if d in ("64", "65", "66"): return 1
    if d in ("01", "02", "03", "10", "11", "12") or c4 in ("4621", "4622", "4623", "4631", "4632", "4633", "4634", "4683"): return 0
    if d in ("49", "50", "51", "52", "53"): return 3
    if d in ("35", "36", "37", "38", "41", "42", "43", "61", "68"): return 4
    if d in ("47", "85") or c4 in ("4691", "4692", "4693"): return 5
    if d == "94" or not cnae.strip(): return 7
    return 6

def dump(nome, obj):
    p = os.path.join(OUT, nome)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
    print(f"  {nome}: {os.path.getsize(p)/1024:.0f} kB")

# ---------- SIDRA: estabelecimentos (total e agricultura familiar) por municipio ----------
def sidra():
    cache = os.path.join(D, "sidra_6778.json")
    if os.path.exists(cache):
        return json.load(open(cache))
    res = {}
    ufs = [11,12,13,14,15,16,17,21,22,23,24,25,26,27,28,29,31,32,33,35,41,42,43,50,51,52,53]
    for uf in ufs:
        url = f"https://apisidra.ibge.gov.br/values/t/6778/n6/in%20n3%20{uf}/v/183/p/2017/c829/46302,46304"
        for tent in range(5):
            try:
                dados = json.load(urllib.request.urlopen(url, timeout=90)); break
            except Exception as e:
                time.sleep(3)
        else:
            raise RuntimeError(f"SIDRA falhou para UF {uf}")
        for r in dados[1:]:
            v = int(r["V"]) if r["V"].isdigit() else 0
            res.setdefault(r["D1C"], [0, 0])[0 if r["D4C"] == "46302" else 1] = v
        print(f"  sidra UF {uf}: ok", flush=True)
    json.dump(res, open(cache, "w"))
    return res

print("SIDRA (Censo Agro 2017, tabela 6778)...")
estab = sidra()

# ---------- cooperativas ----------
rows = list(csv.DictReader(open(f"{D}/cooperativas_brasil.csv", encoding="utf-8"), delimiter=";"))
cn = {c: n for c, n in csv.reader(open(f"{PREP}/cnaes.csv", encoding="utf-8"), delimiter=";")}
muni = {r["cod_ibge"]: r for r in csv.DictReader(open(f"{D}/municipios_ibge.csv", encoding="utf-8"), delimiter=";")}

ativas = [r for r in rows if r["situacao"] == "ATIVA" and r["cod_ibge"]]
por_mun = collections.defaultdict(lambda: [0] * len(RAMOS))
por_uf = collections.defaultdict(list); busca = []; cnaes_usados = {}
for r in ativas:
    ri = ramo(r["cnae_principal"])
    por_mun[r["cod_ibge"]][ri] += 1
    cnaes_usados[r["cnae_principal"]] = cn.get(r["cnae_principal"], "")
    end = " ".join(x for x in [r["tipo_logradouro"], r["logradouro"], r["numero"]] if x and x != "SN").strip()
    por_uf[r["uf"]].append([r["cnpj"], r["razao_social"], r["nome_fantasia"], int(r["matriz_filial"] or 1),
                            int(r["data_inicio"][:4] or 0), r["cnae_principal"], r["cod_ibge"], end, r["bairro"], r["cep"], ri])
    busca.append([r["cnpj"], r["razao_social"], r["uf"], r["cod_ibge"]])

print("Arquivos:")
for uf, lst in por_uf.items():
    lst.sort(key=lambda x: x[1]); dump(f"coops/{uf}.json", lst)
dump("busca.json", busca)
dump("cnaes.json", cnaes_usados)

# municipios: [cod, nome, uf, lat, lon, [contagem por ramo], estab_total, estab_familiar]
municipios = []
for cod, m in muni.items():
    e = estab.get(cod, [0, 0])
    municipios.append([cod, m["municipio"], m["uf"], round(float(m["lat"]), 4), round(float(m["lon"]), 4), por_mun.get(cod, [0] * len(RAMOS)), e[0], e[1]])
dump("municipios.json", municipios)

# ---------- demografia (matrizes) ----------
mat = [r for r in rows if r["matriz_filial"] == "1"]
ano = lambda s: int(s[:4]) if s[:4].isdigit() else 0
abert = collections.Counter(ano(r["data_inicio"]) for r in mat)
baix = collections.Counter(ano(r["data_situacao"]) for r in mat if r["situacao"] == "BAIXADA")
serie = [{"ano": a, "abertas": abert.get(a, 0), "baixadas": baix.get(a, 0)} for a in range(1990, int(CARGA[:4]) + 1)]
coortes = []
for ini in range(1990, 2025, 5):
    grupo = [r for r in mat if ini <= ano(r["data_inicio"]) < ini + 5]
    at = sum(r["situacao"] == "ATIVA" for r in grupo)
    coortes.append({"periodo": f"{ini}–{ini+4}", "abertas": len(grupo), "ativas": at, "pct_ativas": round(100 * at / len(grupo), 1) if grupo else 0})
dem_uf = []
for uf in sorted({r["uf"] for r in mat if r["uf"] != "EX"}):
    g = [r for r in mat if r["uf"] == uf]; c = collections.Counter(r["situacao"] for r in g)
    dem_uf.append({"uf": uf, "total": len(g), "ativas": c["ATIVA"], "baixadas": c["BAIXADA"], "inaptas": c["INAPTA"], "pct_ativas": round(100 * c["ATIVA"] / len(g), 1)})
dem_ramo = []
for i, nome in enumerate(RAMOS):
    g = [r for r in mat if ramo(r["cnae_principal"]) == i]; at = sum(r["situacao"] == "ATIVA" for r in g)
    dem_ramo.append({"ramo": nome, "total": len(g), "ativas": at, "pct_ativas": round(100 * at / len(g), 1) if g else 0})
dump("demografia.json", {"serie": serie, "coortes": coortes, "uf": dem_uf, "ramo": dem_ramo})

# ---------- resumo ----------
sit = collections.Counter(r["situacao"] for r in rows)
uf_at = collections.Counter(r["uf"] for r in ativas)
ramo_at = collections.Counter(ramo(r["cnae_principal"]) for r in ativas)
dump("resumo.json", {
    "carga": CARGA, "gerado_em": time.strftime("%Y-%m-%d"), "ramos": RAMOS,
    "estabelecimentos_total": len(rows), "ativas": len(ativas),
    "matrizes_ativas": sum(r["matriz_filial"] == "1" for r in ativas),
    "municipios_com_cooperativa": len(por_mun), "municipios_total": len(muni),
    "geocodificadas_pct": round(100 * sum(1 for r in rows if r["cod_ibge"]) / len(rows), 2),
    "situacao": dict(sit), "por_uf": dict(uf_at), "por_ramo": [ramo_at.get(i, 0) for i in range(len(RAMOS))],
    "estab_familiares_brasil": sum(e[1] for e in estab.values()), "estab_total_brasil": sum(e[0] for e in estab.values()),
})

# ---------- malha das UFs simplificada ----------
rd = shapefile.Reader(os.path.join(PREP, "BR_UF_2022.shp"), encoding="utf-8")
campos = [f[0] for f in rd.fields[1:]]; feats = []
def arred(g):
    if isinstance(g, (list, tuple)) and g and isinstance(g[0], (int, float)): return [round(g[0], 3), round(g[1], 3)]
    return [arred(x) for x in g]
for sr in rd.iterShapeRecords():
    p = dict(zip(campos, sr.record)); g = shape(sr.shape.__geo_interface__).simplify(0.03, preserve_topology=True)
    gj = mapping(g); gj = {"type": gj["type"], "coordinates": arred(gj["coordinates"])}
    feats.append({"type": "Feature", "properties": {"uf": p["SIGLA_UF"], "nome": p["NM_UF"], "regiao": p.get("NM_REGIAO", "")}, "geometry": gj})
dump("uf.geojson", {"type": "FeatureCollection", "features": feats})
print("ok")
