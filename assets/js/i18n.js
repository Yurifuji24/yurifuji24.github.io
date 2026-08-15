/**
 * i18n — troca de idioma PT/EN sem recarregar a página.
 *
 * Três formas de traduzir, use a que for mais confortável:
 *
 *   1. Texto curto e repetido (menu, botões, rodapé):
 *        <a data-i18n="nav.projects">Projetos</a>
 *      A chave vem do dicionário DICT abaixo.
 *
 *   2. Texto curto e específico de uma página:
 *        <h1 data-pt="Olá" data-en="Hello">Olá</h1>
 *
 *   3. Bloco inteiro de conteúdo (parágrafos, listas):
 *        <div data-lang="pt"> ...português... </div>
 *        <div data-lang="en"> ...english... </div>
 *
 * O idioma escolhido fica em localStorage e vale para o site todo.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "portfolio:lang";
  var DEFAULT = "pt";

  /* Dicionário do "chrome" do site — o que se repete em todas as páginas. */
  var DICT = {
    pt: {
      "nav.about": "Sobre",
      "nav.projects": "Projetos",
      "nav.skills": "Competências",
      "nav.contact": "Contato",
      "nav.home": "Início",
      "nav.menu": "Abrir menu",
      "nav.theme": "Alternar tema claro/escuro",

      "cta.viewProjects": "Ver projetos",
      "cta.github": "GitHub",
      "cta.linkedin": "LinkedIn",
      "cta.email": "E-mail",
      "cta.caseStudy": "Ver estudo de caso",
      "cta.notebook": "Notebook",
      "cta.repo": "Repositório",
      "cta.backHome": "Voltar para a home",
      "cta.allProjects": "Todos os projetos",

      "projects.filterAll": "Todos",
      "projects.loading": "Carregando projetos…",
      "projects.empty": "Nenhum projeto nesta categoria ainda.",
      "projects.error":
        "Não foi possível carregar a lista de projetos. Se você abriu o arquivo direto do disco, use um servidor local (python -m http.server).",

      "status.destaque": "Destaque",
      "status.andamento": "Em andamento",
      "status.concluido": "Concluído",

      "footer.built": "Feito com HTML, CSS e JavaScript puro.",
      "footer.source": "Código-fonte",
    },
    en: {
      "nav.about": "About",
      "nav.projects": "Projects",
      "nav.skills": "Skills",
      "nav.contact": "Contact",
      "nav.home": "Home",
      "nav.menu": "Open menu",
      "nav.theme": "Toggle light/dark theme",

      "cta.viewProjects": "View projects",
      "cta.github": "GitHub",
      "cta.linkedin": "LinkedIn",
      "cta.email": "Email",
      "cta.caseStudy": "Read case study",
      "cta.notebook": "Notebook",
      "cta.repo": "Repository",
      "cta.backHome": "Back to home",
      "cta.allProjects": "All projects",

      "projects.filterAll": "All",
      "projects.loading": "Loading projects…",
      "projects.empty": "No projects in this category yet.",
      "projects.error":
        "Could not load the project list. If you opened the file straight from disk, serve it locally (python -m http.server).",

      "status.destaque": "Featured",
      "status.andamento": "In progress",
      "status.concluido": "Completed",

      "footer.built": "Built with plain HTML, CSS and JavaScript.",
      "footer.source": "Source code",
    },
  };

  function detect() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "pt" || saved === "en") return saved;
    } catch (e) {
      /* localStorage bloqueado — segue com a detecção do navegador */
    }
    var nav = (navigator.language || "").toLowerCase();
    return nav.indexOf("pt") === 0 ? "pt" : nav ? "en" : DEFAULT;
  }

  var current = detect();

  function t(key, lang) {
    var table = DICT[lang || current] || DICT[DEFAULT];
    return Object.prototype.hasOwnProperty.call(table, key) ? table[key] : key;
  }

  function apply(root) {
    var scope = root || document;

    // 1. Chaves do dicionário
    scope.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });

    // 1b. Atributos traduzíveis: data-i18n-aria-label="nav.menu"
    scope.querySelectorAll("[data-i18n-aria-label]").forEach(function (el) {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria-label")));
    });
    scope.querySelectorAll("[data-i18n-title]").forEach(function (el) {
      el.setAttribute("title", t(el.getAttribute("data-i18n-title")));
    });

    // 2. Pares data-pt / data-en
    scope.querySelectorAll("[data-pt][data-en]").forEach(function (el) {
      el.textContent = el.getAttribute("data-" + current) || "";
    });

    // 3. Blocos por idioma
    scope.querySelectorAll("[data-lang]").forEach(function (el) {
      el.classList.toggle("is-visible", el.getAttribute("data-lang") === current);
    });

    document.documentElement.lang = current === "pt" ? "pt-BR" : "en";

    document.querySelectorAll("[data-lang-btn]").forEach(function (btn) {
      btn.setAttribute(
        "aria-pressed",
        String(btn.getAttribute("data-lang-btn") === current)
      );
    });
  }

  function set(lang) {
    if (lang !== "pt" && lang !== "en") return;
    if (lang === current) return;
    current = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      /* sem persistência, mas a troca funciona na sessão */
    }
    apply();
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: lang } }));
  }

  window.i18n = {
    get lang() {
      return current;
    },
    t: t,
    set: set,
    apply: apply,
    /** Escolhe o campo certo de um objeto {pt: "...", en: "..."}. */
    pick: function (value) {
      if (value == null) return "";
      if (typeof value === "string") return value;
      return value[current] != null ? value[current] : value[DEFAULT] || "";
    },
  };

  // Aplica o idioma antes da primeira pintura para evitar "flash" de PT em EN.
  document.documentElement.lang = current === "pt" ? "pt-BR" : "en";
  document.addEventListener("DOMContentLoaded", function () {
    apply();
    document.querySelectorAll("[data-lang-btn]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        set(btn.getAttribute("data-lang-btn"));
      });
    });
  });
})();
