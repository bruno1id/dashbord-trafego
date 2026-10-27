"""Gera data/dados.js a partir dos CSVs em data/.

Uso:  python3 scripts/build.py [--atualizado "2026-10-27T20:49:00-03:00"]

- data/diario.csv     : uma linha por dia e conta (base dos cards, gráficos,
                        tabela por conta e comparação com o período anterior)
- data/conjuntos.csv  : uma linha por conjunto de anúncios, últimos 30 dias
                        (base das tabelas de campanhas e conjuntos)
"""
import argparse
import csv
import json
import pathlib
from datetime import datetime, timedelta, timezone

RAIZ = pathlib.Path(__file__).resolve().parent.parent
DADOS = RAIZ / "data"
FORTALEZA = timezone(timedelta(hours=-3))

TEXTO = {"data", "conta", "campanha", "conjunto_id", "conjunto", "status"}


def ler(nome):
    linhas = []
    with open(DADOS / nome, newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            out = {}
            for k, v in r.items():
                if k in TEXTO:
                    out[k] = v
                elif v in ("", "null", None):
                    out[k] = None
                else:
                    out[k] = float(v) if any(c in v for c in ".eE") else int(v)
            linhas.append(out)
    return linhas


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--atualizado", help="momento da coleta (ISO 8601)")
    a = ap.parse_args()

    atualizado = a.atualizado or datetime.now(FORTALEZA).isoformat(timespec="minutes")
    hoje = atualizado[:10]
    diario = ler("diario.csv")
    conjuntos = ler("conjuntos.csv")
    fim_cj = (datetime.fromisoformat(hoje) - timedelta(days=1)).date().isoformat()
    ini_cj = (datetime.fromisoformat(hoje) - timedelta(days=30)).date().isoformat()

    meta = {
        "atualizado": atualizado,
        "hoje": hoje,
        "primeiro_dia": min(r["data"] for r in diario),
        "conjuntos": {"inicio": ini_cj, "fim": fim_cj},
    }
    js = (
        "/* Gerado por scripts/build.py — não edite à mão. */\n"
        f"window.MX_META = {json.dumps(meta, ensure_ascii=False)};\n"
        f"window.MX_DIARIO = {json.dumps(diario, ensure_ascii=False)};\n"
        f"window.MX_CONJUNTOS = {json.dumps(conjuntos, ensure_ascii=False)};\n"
    )
    (DADOS / "dados.js").write_text(js, encoding="utf-8")
    print(f"dados.js: {len(diario)} linhas diárias, {len(conjuntos)} conjuntos, atualizado {atualizado}")


if __name__ == "__main__":
    main()
