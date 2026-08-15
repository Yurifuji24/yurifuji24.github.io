/**
 * projects.js — lê data/projects.json e monta o grid de projetos da home,
 * incluindo os filtros por categoria. Nada aqui precisa ser editado para
 * publicar um projeto novo: basta acrescentar o objeto no JSON.
 */
(function () {
  "use strict";

  var grid = document.querySelector("[data-project-grid]");
  if (!grid) return;

  var filtersBox = document.querySelector("[data-project-filters]");
  var countBox = document.querySelector("[data-project-count]");
  var src = grid.getAttribute("data-projects-src") || "data/projects.json";

  var projects = [];
  var activeFilter = "all";

  var MONTHS = {
    pt: ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"],
    en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  };

  var ARROW =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatDate(value) {
    if (!value) return "";
    var lang = window.i18n ? window.i18n.lang : "pt";
    var parts = String(value).split("-");
    var year = parts[0];
    var month = parseInt(parts[1], 10);
    if (!month || isNaN(month)) return year;
    return MONTHS[lang][month - 1] + " " + year;
  }

  function initials(title) {
    return title
      .replace(/[^\p{L}\s]/gu, " ")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(function (word) {
        return word.charAt(0).toUpperCase();
      })
      .join("");
  }

  function coverMarkup(project, title) {
    if (project.cover) {
      var alt = window.i18n ? window.i18n.pick(project.coverAlt) : "";
      return (
        '<img src="' +
        escapeHtml(project.cover) +
        '" alt="' +
        escapeHtml(alt || title) +
        '" loading="lazy" decoding="async">'
      );
    }
    return '<div class="project-card__fallback" aria-hidden="true">' + escapeHtml(initials(title)) + "</div>";
  }

  function cardMarkup(project) {
    var t = window.i18n.t;
    var pick = window.i18n.pick;
    var title = pick(project.title);
    var category = pick(project.categoryLabel) || project.category || "";
    var status = project.status || "";
    var tags = (project.tags || [])
      .map(function (tag) {
        return '<li class="tag">' + escapeHtml(tag) + "</li>";
      })
      .join("");

    return (
      '<article class="project-card" data-category="' +
      escapeHtml(project.category || "") +
      '">' +
      '<div class="project-card__cover">' +
      coverMarkup(project, title) +
      (status
        ? '<span class="project-card__status" data-status="' +
          escapeHtml(status) +
          '">' +
          escapeHtml(t("status." + status)) +
          "</span>"
        : "") +
      "</div>" +
      '<div class="project-card__body">' +
      '<p class="project-card__meta"><span>' +
      escapeHtml(category) +
      "</span>" +
      (project.date ? "<span aria-hidden=\"true\">·</span><span>" + escapeHtml(formatDate(project.date)) + "</span>" : "") +
      "</p>" +
      '<h3 class="project-card__title"><a href="' +
      escapeHtml(project.url || "#") +
      '">' +
      escapeHtml(title) +
      "</a></h3>" +
      '<p class="project-card__summary">' +
      escapeHtml(pick(project.summary)) +
      "</p>" +
      (tags ? '<ul class="project-card__tags">' + tags + "</ul>" : "") +
      '<span class="project-card__cta">' +
      escapeHtml(t("cta.caseStudy")) +
      ARROW +
      "</span>" +
      "</div>" +
      "</article>"
    );
  }

  function renderFilters() {
    if (!filtersBox) return;

    var seen = {};
    var categories = [];
    projects.forEach(function (project) {
      var key = project.category || "outros";
      if (seen[key]) return;
      seen[key] = true;
      categories.push({ key: key, label: window.i18n.pick(project.categoryLabel) || key });
    });

    // Com uma categoria só, o filtro não acrescenta nada.
    if (categories.length < 2) {
      filtersBox.innerHTML = "";
      filtersBox.hidden = true;
      return;
    }

    filtersBox.hidden = false;
    var all = [{ key: "all", label: window.i18n.t("projects.filterAll") }].concat(categories);
    filtersBox.innerHTML = all
      .map(function (item) {
        return (
          '<button type="button" class="filter" data-filter="' +
          escapeHtml(item.key) +
          '" aria-pressed="' +
          (item.key === activeFilter) +
          '">' +
          escapeHtml(item.label) +
          "</button>"
        );
      })
      .join("");
  }

  function applyFilter() {
    var visible = 0;
    grid.querySelectorAll(".project-card").forEach(function (card) {
      var match = activeFilter === "all" || card.getAttribute("data-category") === activeFilter;
      card.classList.toggle("is-hidden", !match);
      if (match) visible++;
    });

    var empty = grid.querySelector(".empty-state");
    if (!visible && !empty) {
      grid.insertAdjacentHTML(
        "beforeend",
        '<p class="empty-state">' + escapeHtml(window.i18n.t("projects.empty")) + "</p>"
      );
    } else if (visible && empty) {
      empty.remove();
    }

    if (countBox) countBox.textContent = String(visible);
  }

  function render() {
    if (!projects.length) {
      grid.innerHTML = '<p class="empty-state">' + escapeHtml(window.i18n.t("projects.empty")) + "</p>";
      if (countBox) countBox.textContent = "0";
      return;
    }
    grid.innerHTML = projects.map(cardMarkup).join("");
    renderFilters();
    applyFilter();
  }

  if (filtersBox) {
    filtersBox.addEventListener("click", function (event) {
      var button = event.target.closest("[data-filter]");
      if (!button) return;
      activeFilter = button.getAttribute("data-filter");
      filtersBox.querySelectorAll("[data-filter]").forEach(function (item) {
        item.setAttribute("aria-pressed", String(item === button));
      });
      applyFilter();
    });
  }

  document.addEventListener("langchange", render);

  grid.innerHTML = '<p class="loading-state">' + escapeHtml(window.i18n.t("projects.loading")) + "</p>";

  fetch(src, { cache: "no-cache" })
    .then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    })
    .then(function (data) {
      projects = Array.isArray(data) ? data : data.projects || [];
      render();
    })
    .catch(function (error) {
      console.error("[projects] falha ao carregar " + src, error);
      grid.innerHTML = '<p class="empty-state">' + escapeHtml(window.i18n.t("projects.error")) + "</p>";
      if (countBox) countBox.textContent = "0";
    });
})();
