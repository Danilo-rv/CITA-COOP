#!/usr/bin/env python3
"""Monta os documentos do dossiê de TRL 4: fontes/*.md -> html/*.html (depois convertidos em PDF por docs/gerar_pdfs.cjs).
Os números vêm dos registros reais em evidencias/ e de app/public/dados/resumo.json.
Uso: python3 docs/trl4/gerar_dossie.py
"""
import json, os, re, subprocess, markdown
AQUI = os.path.dirname(os.path.abspath(__file__)); RAIZ = os.path.join(AQUI, "..", "..")
EV = os.path.join(AQUI, "evidencias"); os.makedirs(os.path.join(AQUI, "html"), exist_ok=True)
ler = lambda n: open(os.path.join(EV, n), encoding="utf-8").read().strip()
resumo = json.load(open(os.path.join(RAIZ, "app/public/dados/resumo.json")))
br = lambda n: f"{n:,}".replace(",", ".")
git = lambda *a: subprocess.run(["git", "-C", RAIZ, *a], capture_output=True, text=True).stdout.strip()
V = {
    "versao": json.load(open(os.path.join(RAIZ, "app/package.json")))["version"],
    "commit": git("log", "-1", "--format=%h", "--", "app"), "ramo": git("rev-parse", "--abbrev-ref", "HEAD"),
    "data": re.search(r"Data da execução: (\d{4})-(\d\d)-(\d\d)", ler("ambiente.txt")).expand(r"\3/\2/\1"),
    "ativas": br(resumo["ativas"]), "total": br(resumo["estabelecimentos_total"]), "matrizes": br(resumo["matrizes_ativas"]),
    "mun_coop": br(resumo["municipios_com_cooperativa"]), "geo": str(resumo["geocodificadas_pct"]).replace(".", ","),
    "n_unit": re.search(r"Tests\s+(\d+) passed", ler("testes_unitarios.txt")).group(1),
    "n_e2e": re.search(r"pass (\d+)", ler("testes_e2e.txt")).group(1),
    "n_dados": str(ler("validacao_dados.txt").count("[OK ]")),
}
assert "fail 0" in ler("testes_e2e.txt") and "FALHA" not in ler("validacao_dados.txt"), "há testes reprovados: não gerar o dossiê"

def arquivo(m):
    nome, _, opc = m.group(1).partition("|")
    t = ler(nome)
    if opc.startswith("tail="): t = "\n".join(t.splitlines()[-int(opc[5:]):])
    return t

TITULOS = {"00": "Índice do dossiê", "01": "Relatório de Maturidade Tecnológica", "02": "Requisitos e Matriz de Rastreabilidade", "03": "Arquitetura e Descrição Técnica",
           "04": "Plano e Relatório de Testes", "05": "Relatório de Validação dos Dados", "06": "Plano de Evolução do TRL 5 ao TRL 7", "07": "Declaração de Maturidade Tecnológica"}
for f in sorted(os.listdir(os.path.join(AQUI, "fontes"))):
    n = f[:2]; md = open(os.path.join(AQUI, "fontes", f), encoding="utf-8").read()
    md = re.sub(r"\{\{arquivo:([^}]+)\}\}", arquivo, md)
    md = re.sub(r"\{\{(\w+)\}\}", lambda m: V[m.group(1)], md)
    corpo = markdown.markdown(md, extensions=["tables", "fenced_code", "md_in_html"])
    corpo = re.sub(r'<p><img alt="([^"]*)" src="([^"]+)" /></p>\s*<p><em>(.*?)</em></p>', r'<figure class="fig"><img src="../\2" alt="\1"><figcaption>\3</figcaption></figure>', corpo)
    capa = "" if n == "07" else f'''<section class="capa"><div class="marca"><i>◎</i> CITA-COOP</div>
<div><div class="tipo">Dossiê de comprovação do TRL 4 · documento {int(n) if n != "00" else "índice"}</div><div class="titulo">{TITULOS[n]}</div>
<div class="sub">Centro de Inteligência Territorial Analítica em Cooperativas — plataforma web, versão {V["versao"]}</div></div>
<div class="pe"><span>Nível de maturidade tecnológica 4 · validação em laboratório</span><span>{V["data"]}</span></div></section>'''
    html = f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>{TITULOS[n]} — CITA-COOP</title>
<link rel="stylesheet" href="../../../app/node_modules/@fontsource-variable/inter/index.css">
<link rel="stylesheet" href="../../../app/node_modules/@fontsource-variable/space-grotesk/index.css">
<link rel="stylesheet" href="../../estilo-doc.css"></head><body class="dossie{" declaracao" if n == "07" else ""}">{capa}{corpo}</body></html>'''
    open(os.path.join(AQUI, "html", f[:-3] + ".html"), "w", encoding="utf-8").write(html)
    print("html", f[:-3])
print(V)
