# Curva de carga de energia elétrica no Brasil (2025)

Análise exploratória do comportamento da carga de energia elétrica no Sistema
Interligado Nacional (SIN), a partir dos dados horários oficiais do ONS.

📄 **Estudo de caso publicado:** https://yurifuji24.github.io/projects/consumo-energia-brasil/

---

## Pergunta de negócio

Quando o Brasil consome mais energia, quem consome e quão previsível é esse padrão?

## Dados

| | |
|---|---|
| Fonte | ONS — Operador Nacional do Sistema Elétrico |
| Base | Curva de Carga Horária, 2025 |
| Período | 01/01/2025 a 22/12/2025 |
| Registros | 34.176 linhas (uma por subsistema por hora) |
| Granularidade | Horária, por subsistema (Norte, Nordeste, Sudeste/CO, Sul) |
| Unidade | MW médio |

## Ferramentas

Python · pandas · NumPy · matplotlib · Jupyter · Git

## Principais conclusões

1. **O pico médio é às 19h.** A carga vai de ~68,5 GW na madrugada a ~90 GW no
   início da noite — uma variação de 31% dentro do mesmo dia.
2. **Sudeste/CO concentra 55,5% da carga do SIN**, mais que os outros três
   subsistemas somados.
3. **Norte e Nordeste têm curva quase plana**, com amplitude bem menor entre vale
   e pico que a do Sudeste/CO.
4. **O fim de semana reduz a carga em 10,8%** em relação aos dias úteis, de forma
   consistente ao longo do ano.

## Nota metodológica

A carga do SIN **não** é a média das linhas da tabela: cada instante tem quatro
linhas, uma por subsistema. Calcular a média direto retorna a carga de um
subsistema típico, não a do país. O agregado correto soma os subsistemas dentro
de cada `data_hora` e só então tira a média por hora — é o que
`scripts/build_aggregates.py` faz.

## Limitações

- A base cobre 2025 até 22 de dezembro; o fechamento do ano não estava disponível.
- A análise é descritiva: não isola efeitos de temperatura, feriados ou atividade econômica.
- Sem ajuste de fuso por subsistema — o ONS publica em horário de Brasília.

## Estrutura

```
consumo-energia-brasil/
├── index.html                              # estudo de caso (página do site)
├── notebooks/
│   └── consumo_energia_eda.ipynb           # análise exploratória completa
├── data/
│   ├── raw/CURVA_CARGA_2025.csv            # base original do ONS (1,35 MB)
│   ├── processed/curva_carga_2025_tratada.csv  # base tratada (1,86 MB)
│   └── aggregated/curva_carga.json         # agregados que alimentam os gráficos (8 KB)
└── images/                                 # figuras exportadas do notebook
```

## Reproduzindo

```bash
pip install pandas numpy matplotlib jupyter
jupyter notebook notebooks/consumo_energia_eda.ipynb
```

Para regerar o JSON dos gráficos do site, a partir da raiz do repositório:

```bash
python scripts/build_aggregates.py
```
