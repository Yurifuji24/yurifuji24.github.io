"""
Gera os agregados leves (JSON) que alimentam os graficos da pagina do projeto
"consumo-energia-brasil".

O CSV tratado tem ~1,8 MB e nao deve ser baixado pelo navegador. Este script
reduz a base a algumas dezenas de numeros, publicados em:

    projects/consumo-energia-brasil/data/aggregated/curva_carga.json

Uso:
    python scripts/build_aggregates.py
"""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT / "projects" / "consumo-energia-brasil"
SOURCE = PROJECT / "data" / "processed" / "curva_carga_2025_tratada.csv"
TARGET = PROJECT / "data" / "aggregated" / "curva_carga.json"

DIAS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
DIAS_PT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"]
DIAS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
MESES_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
            "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
MESES_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def r(value: float, digits: int = 1) -> float:
    """Arredonda mantendo o JSON pequeno e legivel."""
    return round(float(value), digits)


def main() -> None:
    df = pd.read_csv(SOURCE, parse_dates=["data_hora"])

    # Carga total do SIN em cada instante: soma dos quatro subsistemas.
    sin = (
        df.groupby("data_hora", as_index=False)
        .agg(carga_mw=("carga_mw_media", "sum"))
    )
    sin["hora"] = sin["data_hora"].dt.hour
    sin["mes"] = sin["data_hora"].dt.month
    sin["dia_semana"] = pd.Categorical(
        sin["data_hora"].dt.day_name(), categories=DIAS, ordered=True
    )
    sin["fim_de_semana"] = sin["dia_semana"].isin(["Saturday", "Sunday"])

    # 1. Curva media diaria do SIN (24 pontos).
    curva_sin = sin.groupby("hora")["carga_mw"].mean()

    # 2. Curva media diaria por subsistema (4 x 24).
    curva_sub = (
        df.groupby(["subsistema", "hora"])["carga_mw_media"].mean().unstack("hora")
    )

    # 3. Carga media por subsistema (4 valores) e participacao no total.
    media_sub = df.groupby("subsistema")["carga_mw_media"].mean().sort_values(
        ascending=False
    )
    total_sub = media_sub.sum()

    # 4. Heatmap dia da semana x hora (7 x 24).
    heatmap = sin.groupby(["dia_semana", "hora"], observed=True)["carga_mw"].mean()
    heatmap = heatmap.unstack("hora").reindex(DIAS)

    # 5. Sazonalidade mensal (12 pontos).
    mensal = sin.groupby("mes")["carga_mw"].mean().reindex(range(1, 13))

    # 6. Indicadores de destaque.
    hora_pico = int(curva_sin.idxmax())
    hora_vale = int(curva_sin.idxmin())
    media_util = sin.loc[~sin["fim_de_semana"], "carga_mw"].mean()
    media_fds = sin.loc[sin["fim_de_semana"], "carga_mw"].mean()

    payload = {
        "meta": {
            "fonte": "ONS - Operador Nacional do Sistema Eletrico",
            "periodo": {
                "inicio": sin["data_hora"].min().strftime("%Y-%m-%d"),
                "fim": sin["data_hora"].max().strftime("%Y-%m-%d"),
            },
            "registros": int(len(df)),
            "unidade": "MW medio",
        },
        "kpis": {
            "carga_media_sin": r(sin["carga_mw"].mean()),
            "pico_medio": r(curva_sin.max()),
            "hora_pico": hora_pico,
            "vale_medio": r(curva_sin.min()),
            "hora_vale": hora_vale,
            "amplitude_pct": r((curva_sin.max() / curva_sin.min() - 1) * 100),
            "share_sudeste_pct": r(media_sub.iloc[0] / total_sub * 100),
            "lider_subsistema": str(media_sub.index[0]),
            "queda_fim_semana_pct": r((1 - media_fds / media_util) * 100),
        },
        "curva_sin": {
            "horas": list(range(24)),
            "carga_mw": [r(v) for v in curva_sin.tolist()],
        },
        "curva_por_subsistema": {
            "horas": list(range(24)),
            "series": [
                {"nome": str(nome), "carga_mw": [r(v) for v in linha.tolist()]}
                for nome, linha in curva_sub.iterrows()
            ],
        },
        "media_por_subsistema": [
            {
                "nome": str(nome),
                "carga_mw": r(valor),
                "share_pct": r(valor / total_sub * 100),
            }
            for nome, valor in media_sub.items()
        ],
        "heatmap_semana": {
            "horas": list(range(24)),
            "dias_pt": DIAS_PT,
            "dias_en": DIAS_EN,
            "valores": [[r(v) for v in linha.tolist()] for _, linha in heatmap.iterrows()],
        },
        "sazonalidade_mensal": {
            "meses_pt": MESES_PT,
            "meses_en": MESES_EN,
            "carga_mw": [None if pd.isna(v) else r(v) for v in mensal.tolist()],
        },
    }

    TARGET.parent.mkdir(parents=True, exist_ok=True)
    TARGET.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(f"OK -> {TARGET.relative_to(ROOT)} ({TARGET.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
