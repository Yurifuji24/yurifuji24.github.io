/**
 * main.js — comportamentos comuns a todas as páginas:
 * tema claro/escuro, menu mobile, header ao rolar, ano do rodapé e
 * destaque do link de navegação da seção visível.
 */
(function () {
  "use strict";

  var THEME_KEY = "portfolio:theme";

  /* --- Tema ------------------------------------------------------------- */

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") || "dark";
  }

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      /* sem persistência */
    }
    document.dispatchEvent(new CustomEvent("themechange", { detail: { theme: theme } }));
  }

  function initTheme() {
    document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setTheme(currentTheme() === "dark" ? "light" : "dark");
      });
    });
  }

  /* --- Menu mobile ------------------------------------------------------ */

  function initNav() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var nav = document.querySelector("[data-nav]");
    if (!toggle || !nav) return;

    function close() {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }

    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) close();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") close();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 860) close();
    });
  }

  /* --- Header ao rolar -------------------------------------------------- */

  function initHeader() {
    var header = document.querySelector("[data-header]");
    if (!header) return;
    var update = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  /* --- Link ativo conforme a seção visível ------------------------------ */

  function initScrollSpy() {
    var links = Array.prototype.slice.call(
      document.querySelectorAll('[data-nav] a[href^="#"]')
    );
    if (!links.length || !("IntersectionObserver" in window)) return;

    var sections = links
      .map(function (link) {
        return document.querySelector(link.getAttribute("href"));
      })
      .filter(Boolean);

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (link) {
            link.classList.toggle(
              "is-active",
              link.getAttribute("href") === "#" + entry.target.id
            );
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  /* --- Ano no rodapé ---------------------------------------------------- */

  function initYear() {
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    initNav();
    initHeader();
    initScrollSpy();
    initYear();
  });
})();
