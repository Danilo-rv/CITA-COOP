#!/usr/bin/env python3
"""ETL: cooperativas do Brasil a partir dos dados abertos do CNPJ (Receita Federal).

Etapa 1  Empresas*.zip        -> cnpj_basico das empresas com natureza juridica 2143 (Cooperativa)
Etapa 2  Estabelecimentos*.zip -> endereco, CNAE, situacao dos estabelecimentos dessas empresas

Cada ZIP e baixado com retomada, descompactado em streaming (unzip -p, suporta ZIP64) e apagado; o resultado de
cada arquivo fica em data/parts/, entao uma nova execucao pula o que ja foi feito.
Saida: data/cooperativas_cnpj.csv  (UTF-8, separador ';')

Uso:  python3 scripts/etl/cooperativas_cnpj.py [AAAA-MM] [workers]
"""
import csv, subprocess, sys, os, time
from concurrent.futures import ThreadPoolExecutor

BASE = "https://arquivos.receitafederal.gov.br/public.php/webdav/Dados/Cadastros/CNPJ"
TOKEN = "gn672Ad4CF8N6TK"  # token publico do compartilhamento de dados abertos da Receita
MES = sys.argv[1] if len(sys.argv) > 1 else "2026-10"
WORKERS = int(sys.argv[2]) if len(sys.argv) > 2 else 5
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "data")
os.makedirs(OUT, exist_ok=True)
NATUREZA_COOP = "2143"

TMP = os.path.join(OUT, "tmp"); PARTS = os.path.join(OUT, "parts")
os.makedirs(TMP, exist_ok=True); os.makedirs(PARTS, exist_ok=True)

def baixar(nome):
    """Baixa o ZIP para disco com retomada (-C -) e varias tentativas."""
    destino = os.path.join(TMP, nome)
    for tentativa in range(30):
        r = subprocess.run(["curl", "-sS", "--fail", "-C", "-", "--connect-timeout", "30", "--max-time", "3600",
                            "-u", f"{TOKEN}:", "-o", destino, f"{BASE}/{MES}/{nome}"])
        if r.returncode in (0, 33):  # 33 = intervalo ja completo
            return destino
        time.sleep(5)
    raise RuntimeError(f"falha ao baixar {nome}")

def stream(nome):
    """Gera linhas (listas de campos) de um CSV dentro do ZIP remoto."""
    zip_local = baixar(nome)
    p = subprocess.Popen(["unzip", "-p", zip_local], stdout=subprocess.PIPE)
    yield from csv.reader((l.decode("latin-1") for l in p.stdout), delimiter=";", quotechar='"')
    if p.wait() != 0:
        raise RuntimeError(f"falha ao descompactar (unzip) {nome}")
    os.remove(zip_local)

def etapa1(i):
    cache = os.path.join(PARTS, f"empresas{i}.csv")
    if os.path.exists(cache):
        return dict(csv.reader(open(cache, encoding="utf-8"), delimiter=";"))
    achados = {}
    for r in stream(f"Empresas{i}.zip"):
        if r[2] == NATUREZA_COOP:
            achados[r[0]] = r[1]  # cnpj_basico -> razao social
    with open(cache + ".tmp", "w", newline="", encoding="utf-8") as f:
        csv.writer(f, delimiter=";").writerows(achados.items())
    os.replace(cache + ".tmp", cache)
    print(f"[empresas {i}] {len(achados)} cooperativas", flush=True)
    return achados

COLS = ["cnpj", "razao_social", "nome_fantasia", "matriz_filial", "situacao_cadastral",
        "data_situacao", "data_inicio", "cnae_principal", "cnae_secundario",
        "tipo_logradouro", "logradouro", "numero", "complemento", "bairro", "cep",
        "uf", "municipio_cod_rfb", "ddd1", "telefone1", "email"]

def etapa2(i, coops):
    cache = os.path.join(PARTS, f"estab{i}.csv")
    if os.path.exists(cache):
        return list(csv.reader(open(cache, encoding="utf-8"), delimiter=";"))
    n, rows = 0, []
    for r in stream(f"Estabelecimentos{i}.zip"):
        b = r[0]
        if b in coops:
            rows.append([b + r[1] + r[2], coops[b], r[4], r[3], r[5], r[6], r[10], r[11], r[12],
                         r[13], r[14], r[15], r[16], r[17], r[18], r[19], r[20], r[21], r[22], r[27]])
            n += 1
    with open(cache + ".tmp", "w", newline="", encoding="utf-8") as f:
        csv.writer(f, delimiter=";").writerows(rows)
    os.replace(cache + ".tmp", cache)
    print(f"[estabelecimentos {i}] {n} estabelecimentos", flush=True)
    return rows

if __name__ == "__main__":
    t0 = time.time()
    coops = {}
    with ThreadPoolExecutor(WORKERS) as ex:
        for d in ex.map(etapa1, range(10)):
            coops.update(d)
    print(f"Etapa 1 ok: {len(coops)} cooperativas (cnpj_basico) em {time.time()-t0:.0f}s", flush=True)
    todas = []
    with ThreadPoolExecutor(WORKERS) as ex:
        for rows in ex.map(lambda i: etapa2(i, coops), range(10)):
            todas.extend(rows)
    saida = os.path.join(OUT, "cooperativas_cnpj.csv")
    with open(saida, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(COLS)
        w.writerows(todas)
    print(f"Etapa 2 ok: {len(todas)} estabelecimentos -> {saida} ({time.time()-t0:.0f}s)", flush=True)
