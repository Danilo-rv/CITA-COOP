#!/usr/bin/env python3
"""Validação dos dados publicados na plataforma (evidência de TRL 4).
Confere a base bruta (data/) e os arquivos servidos (app/public/dados). Sai com código 1 se alguma verificação falhar.
Uso: python3 scripts/etl/validar_dados.py
"""
import csv, json, os, sys, collections
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
D, P = os.path.join(R, "data"), os.path.join(R, "app", "public", "dados")
falhas = 0
def chk(nome, ok, detalhe=""):
    global falhas
    print(f"[{'OK ' if ok else 'FALHA'}] {nome}{' — ' + str(detalhe) if detalhe != '' else ''}")
    if not ok: falhas += 1

def cnpj_valido(c):
    if len(c) != 14 or not c.isdigit(): return False
    def dv(base, pesos): 
        r = sum(int(a) * b for a, b in zip(base, pesos)) % 11
        return "0" if r < 2 else str(11 - r)
    d1 = dv(c[:12], [5,4,3,2,9,8,7,6,5,4,3,2]); d2 = dv(c[:12] + d1, [6,5,4,3,2,9,8,7,6,5,4,3,2])
    return c[12:] == d1 + d2

UF_COD = {"11":"RO","12":"AC","13":"AM","14":"RR","15":"PA","16":"AP","17":"TO","21":"MA","22":"PI","23":"CE","24":"RN","25":"PB","26":"PE","27":"AL","28":"SE","29":"BA","31":"MG","32":"ES","33":"RJ","35":"SP","41":"PR","42":"SC","43":"RS","50":"MS","51":"MT","52":"GO","53":"DF"}

print("== 1. Base bruta (data/cooperativas_brasil.csv) ==")
rows = list(csv.DictReader(open(f"{D}/cooperativas_brasil.csv", encoding="utf-8"), delimiter=";"))
chk("registros carregados", len(rows) > 80000, len(rows))
chk("CNPJ sem duplicidade", len({r["cnpj"] for r in rows}) == len(rows))
inval = [r["cnpj"] for r in rows if not cnpj_valido(r["cnpj"])]
chk("dígitos verificadores do CNPJ válidos em 100% dos registros", not inval, f"{len(rows) - len(inval)} de {len(rows)}")
geo = [r for r in rows if r["cod_ibge"]]
chk("geocodificação nível município >= 99,9%", len(geo) / len(rows) >= 0.999, f"{100 * len(geo) / len(rows):.3f}% ({len(rows) - len(geo)} sem município)")
chk("UF do registro coincide com a UF do código IBGE", all(UF_COD.get(r["cod_ibge"][:2]) == r["uf"] for r in geo))
chk("coordenadas dentro do território brasileiro", all(-34 < float(r["lat"]) < 5.5 and -74.5 < float(r["lon"]) < -28 for r in geo))
sit = collections.Counter(r["situacao"] for r in rows)
chk("situações cadastrais reconhecidas", set(sit) <= {"ATIVA", "BAIXADA", "INAPTA", "SUSPENSA", "01"}, dict(sit))
ativas = [r for r in geo if r["situacao"] == "ATIVA"]
chk("27 UFs com cooperativas ativas", len({r["uf"] for r in ativas}) == 27)
chk("datas de início plausíveis (1900–2026) em >= 99,9% das ativas", sum(1 for r in ativas if r["data_inicio"][:4].isdigit() and 1900 <= int(r["data_inicio"][:4]) <= 2026) / len(ativas) >= 0.999)

print("== 2. Arquivos publicados (app/public/dados) ==")
J = lambda n: json.load(open(os.path.join(P, n), encoding="utf-8"))
resumo, mun, uf, dem = J("resumo.json"), J("municipios.json"), J("uf.geojson"), J("demografia.json")
chk("total de ativas publicado = base bruta", resumo["ativas"] == len(ativas), resumo["ativas"])
chk("5.572 municípios publicados", len(mun) == 5572)
chk("27 UFs na malha", len(uf["features"]) == 27)
chk("soma por município = total nacional", sum(sum(m[5]) for m in mun) == resumo["ativas"])
chk("soma por UF = total nacional", sum(resumo["por_uf"].values()) == resumo["ativas"])
chk("soma por ramo = total nacional", sum(resumo["por_ramo"]) == resumo["ativas"])
tot = 0
for u in resumo["por_uf"]:
    lst = J(f"coops/{u}.json"); tot += len(lst)
    if len(lst) != resumo["por_uf"][u] or any(UF_COD.get(c[6][:2]) != u for c in lst): chk(f"arquivo coops/{u}.json consistente", False)
chk("27 arquivos por UF somam o total nacional", tot == resumo["ativas"], tot)
chk("índice de busca cobre todas as ativas", len(J("busca.json")) == resumo["ativas"])
chk("nenhum telefone ou e-mail publicado", all(len(c) == 11 for c in J("coops/GO.json")) and "email" not in open(os.path.join(P, "coops/GO.json")).read().lower())

print("== 3. Censo Agropecuário 2017 (SIDRA 6778) ==")
fam, total = sum(m[7] for m in mun), sum(m[6] for m in mun)
chk("estabelecimentos agropecuários = total oficial do Censo (5.073.324)", total == 5073324, total)
chk("estabelecimentos da agricultura familiar = total oficial (3.897.408)", fam == 3897408, fam)
chk("familiar <= total em todos os municípios", all(m[7] <= m[6] for m in mun))
chk("municípios com dado do Censo >= 99%", sum(1 for m in mun if m[6] > 0) / len(mun) >= 0.99, sum(1 for m in mun if m[6] > 0))

print("== 4. Demografia ==")
chk("série anual contínua 1990–2026", [s["ano"] for s in dem["serie"]] == list(range(1990, 2027)))
chk("percentuais de sobrevivência entre 0 e 100", all(0 <= c["pct_ativas"] <= 100 for c in dem["coortes"]))
chk("27 UFs na tabela de demografia", len(dem["uf"]) == 27)

print(f"\nRESULTADO: {'TODAS AS VERIFICAÇÕES PASSARAM' if not falhas else str(falhas) + ' FALHA(S)'}")
sys.exit(1 if falhas else 0)
