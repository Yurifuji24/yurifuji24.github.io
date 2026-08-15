# yurifuji24.github.io

Portfólio de **Yuri Vitorino** — análise de dados com SQL, Python e Power BI,
com projetos aplicados ao setor de energia.

🔗 **https://yurifuji24.github.io**

Site estático, bilíngue (PT/EN), com tema claro/escuro. Sem framework, sem build,
sem dependência de runtime: é HTML, CSS e JavaScript puro servido direto pelo
GitHub Pages.

---

## Estrutura

```
.
├── index.html                     # home: hero, sobre, competências, projetos, contato
├── 404.html
├── data/
│   └── projects.json              # ← lista de projetos da home (fonte de verdade)
├── assets/
│   ├── css/style.css              # design system: tokens, tema, componentes
│   ├── js/
│   │   ├── i18n.js                # troca PT/EN sem recarregar a página
│   │   ├── main.js                # tema, menu mobile, header, scrollspy
│   │   ├── projects.js            # lê projects.json e monta o grid + filtros
│   │   └── charts.js              # gráficos SVG (linha, barras, heatmap)
│   └── images/
├── projects/
│   ├── _template/                 # ← copie esta pasta para criar um projeto
│   └── consumo-energia-brasil/    # estudo de caso publicado
│       ├── index.html
│       ├── README.md
│       ├── notebooks/
│       ├── data/{raw,processed,aggregated}/
│       └── images/
└── scripts/
    └── build_aggregates.py        # CSV pesado → JSON leve para os gráficos
```

---

## Como adicionar um projeto novo

São três passos. Nenhum deles exige mexer em JavaScript.

### 1. Crie a pasta do projeto

```bash
cp -r projects/_template projects/meu-projeto
```

No Windows (PowerShell):

```powershell
Copy-Item -Recurse projects/_template projects/meu-projeto
```

### 2. Edite `projects/meu-projeto/index.html`

O template tem comentários `[EDITE]` em cada ponto que precisa de atenção:
título, resumo, fichas técnicas, KPIs, gráficos, conclusões e método.

Para os gráficos há duas opções, ambas já preparadas no template:

- **Opção A — imagens.** Exporte PNGs do notebook para `images/` e use os blocos
  `<figure class="figure">`. Mais rápido.
- **Opção B — gráficos interativos.** Gere um JSON pequeno com os agregados e use
  `Charts.line/bars/heatmap`. Os gráficos ficam em SVG, acompanham o tema
  claro/escuro e trazem tooltip nativo. Veja o exemplo completo em
  `projects/consumo-energia-brasil/index.html`.

### 3. Registre o projeto em `data/projects.json`

Acrescente um objeto ao array `projects`:

```json
{
  "slug": "meu-projeto",
  "url": "projects/meu-projeto/",
  "title":   { "pt": "Título em português", "en": "Title in English" },
  "summary": { "pt": "Duas linhas sobre o projeto.", "en": "Two lines about the project." },
  "category": "data-analysis",
  "categoryLabel": { "pt": "Análise de dados", "en": "Data analysis" },
  "tags": ["Python", "pandas", "SQL"],
  "date": "2026-03",
  "status": "concluido",
  "cover": "projects/meu-projeto/images/capa.png",
  "coverAlt": { "pt": "Descrição da imagem", "en": "Image description" },
  "links": { "repo": "https://github.com/..." }
}
```

| Campo | Obrigatório | Observação |
|---|---|---|
| `slug` | sim | Identificador único, igual ao nome da pasta. |
| `url` | sim | Caminho relativo à raiz do site. |
| `title`, `summary` | sim | Objetos `{ pt, en }`. |
| `category`, `categoryLabel` | sim | Gera os botões de filtro da home. Com uma categoria só, os filtros ficam ocultos. |
| `tags` | não | Chips exibidos no card. |
| `date` | não | `AAAA-MM`. Formatado conforme o idioma. |
| `status` | não | `destaque`, `concluido` ou `andamento`. |
| `cover` | não | Sem imagem, o card mostra um monograma com as iniciais do título. |
| `links` | não | Referência para você; a home usa apenas `url`. |

Os cards aparecem na home **na ordem do array**.

---

## Idiomas (PT/EN)

Todo o conteúdo existe nos dois idiomas. Três formas de traduzir, escolha a mais
confortável em cada caso:

| Situação | Como escrever |
|---|---|
| Texto repetido no site todo (menu, botões) | `<a data-i18n="nav.projects">Projetos</a>` — a chave vem do dicionário em `assets/js/i18n.js` |
| Texto curto de uma página só | `<h1 data-pt="Olá" data-en="Hello">Olá</h1>` |
| Bloco inteiro (parágrafos, listas) | `<div data-lang="pt">…</div>` + `<div data-lang="en">…</div>` |

A escolha do visitante fica salva em `localStorage` e vale para o site inteiro.

---

## Rodando localmente

O site usa `fetch()` para ler os JSONs, o que **não funciona abrindo o HTML direto
do disco** (`file://`). Suba um servidor local:

```bash
python -m http.server 8000
```

E acesse http://localhost:8000.

---

## Regerando os dados dos gráficos

O projeto de curva de carga desenha os gráficos a partir de um resumo de 8 KB, e
não do CSV de 1,8 MB. Para regerar esse resumo depois de atualizar a base:

```bash
python scripts/build_aggregates.py
```

O script lê `projects/consumo-energia-brasil/data/processed/curva_carga_2025_tratada.csv`
e escreve `projects/consumo-energia-brasil/data/aggregated/curva_carga.json`.
Requer `pandas`.

---

## Contato

- E-mail: yurifuji.vitorino@gmail.com
- GitHub: [@Yurifuji24](https://github.com/Yurifuji24)
- LinkedIn: [yuri-vitorino](https://www.linkedin.com/in/yuri-vitorino/)
