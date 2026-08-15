/**
 * charts.js — gráficos SVG mínimos, sem nenhuma dependência externa.
 *
 * As cores saem das variáveis CSS via `style="fill: var(--accent)"`, então os
 * gráficos acompanham a troca de tema claro/escuro sozinhos, sem redesenhar.
 * Cada elemento de dado carrega um <title>, que o navegador mostra como
 * tooltip e os leitores de tela anunciam.
 *
 * API:
 *   Charts.line(el, { labels, series, formatValue, yTicks, markers })
 *   Charts.bars(el, { items, formatValue })
 *   Charts.heatmap(el, { rows, cols, values, formatValue })
 */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var PALETTE = ["var(--accent)", "var(--amber)", "var(--green)", "var(--violet)", "var(--rose)"];

  function el(name, attrs, parent) {
    var node = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (key) {
      node.setAttribute(key, attrs[key]);
    });
    if (parent) parent.appendChild(node);
    return node;
  }

  function titled(node, text) {
    var title = el("title", {}, node);
    title.textContent = text;
    return node;
  }

  function niceBounds(min, max) {
    var span = max - min || Math.abs(max) || 1;
    var pad = span * 0.12;
    var lo = min - pad;
    var hi = max + pad;
    var step = Math.pow(10, Math.floor(Math.log10(hi - lo))) / 2;
    return { min: Math.floor(lo / step) * step, max: Math.ceil(hi / step) * step };
  }

  function defaultFormat(value) {
    return Math.round(value).toLocaleString();
  }

  function frame(target, width, height) {
    target.innerHTML = "";
    var svg = el(
      "svg",
      {
        viewBox: "0 0 " + width + " " + height,
        role: "img",
        preserveAspectRatio: "xMidYMid meet",
      },
      target
    );
    return svg;
  }

  /* --- Linhas ------------------------------------------------------------ */

  function line(target, opts) {
    var labels = opts.labels || [];
    var series = opts.series || [];
    var format = opts.formatValue || defaultFormat;
    var W = 760;
    var H = opts.height || 320;
    var pad = { top: 18, right: 18, bottom: 34, left: 62 };

    var all = [];
    series.forEach(function (s) {
      s.values.forEach(function (v) {
        if (v != null) all.push(v);
      });
    });
    if (!all.length) return;

    var bounds = niceBounds(Math.min.apply(null, all), Math.max.apply(null, all));
    var innerW = W - pad.left - pad.right;
    var innerH = H - pad.top - pad.bottom;

    var x = function (i) {
      return pad.left + (labels.length < 2 ? innerW / 2 : (i / (labels.length - 1)) * innerW);
    };
    var y = function (v) {
      return pad.top + innerH - ((v - bounds.min) / (bounds.max - bounds.min)) * innerH;
    };

    var svg = frame(target, W, H);
    if (opts.ariaLabel) svg.setAttribute("aria-label", opts.ariaLabel);

    // Grade horizontal + rótulos do eixo Y
    var ticks = opts.yTicks || 5;
    var grid = el("g", { class: "chart-grid" }, svg);
    var labelsG = el("g", { class: "chart-label" }, svg);
    for (var t = 0; t <= ticks; t++) {
      var value = bounds.min + ((bounds.max - bounds.min) * t) / ticks;
      var yy = y(value);
      el("line", { x1: pad.left, x2: W - pad.right, y1: yy, y2: yy }, grid);
      var text = el("text", { x: pad.left - 10, y: yy + 4, "text-anchor": "end" }, labelsG);
      text.textContent = format(value);
    }

    // Rótulos do eixo X
    var every = opts.labelEvery || Math.ceil(labels.length / 12);
    labels.forEach(function (label, i) {
      if (i % every !== 0 && i !== labels.length - 1) return;
      var text = el(
        "text",
        { x: x(i), y: H - pad.bottom + 20, "text-anchor": "middle" },
        labelsG
      );
      text.textContent = label;
    });

    el(
      "line",
      { x1: pad.left, x2: W - pad.right, y1: pad.top + innerH, y2: pad.top + innerH, class: "chart-axis" },
      svg
    ).setAttribute("style", "stroke: var(--border-strong)");

    // Séries
    series.forEach(function (s, index) {
      var color = s.color || PALETTE[index % PALETTE.length];
      var points = s.values
        .map(function (v, i) {
          return v == null ? null : x(i) + "," + y(v);
        })
        .filter(Boolean);
      if (!points.length) return;

      if (series.length === 1 && opts.area !== false) {
        el(
          "polygon",
          {
            class: "chart-area",
            points:
              x(0) + "," + (pad.top + innerH) + " " + points.join(" ") + " " +
              x(s.values.length - 1) + "," + (pad.top + innerH),
            style: "fill: " + color,
          },
          svg
        );
      }

      el(
        "polyline",
        { class: "chart-line", points: points.join(" "), style: "stroke: " + color },
        svg
      );

      // Pontos interativos (tooltip nativo via <title>)
      s.values.forEach(function (v, i) {
        if (v == null) return;
        var showDot = series.length === 1 || (opts.markers && opts.markers.indexOf(i) > -1);
        var dot = el(
          "circle",
          {
            cx: x(i),
            cy: y(v),
            r: showDot ? 3.5 : 8,
            class: showDot ? "chart-dot" : "",
            style: showDot ? "fill: " + color : "fill: transparent",
          },
          svg
        );
        titled(dot, (s.name ? s.name + " · " : "") + labels[i] + ": " + format(v));
      });
    });
  }

  /* --- Barras horizontais ------------------------------------------------ */

  function bars(target, opts) {
    var items = opts.items || [];
    var format = opts.formatValue || defaultFormat;
    if (!items.length) return;

    var W = 760;
    var rowH = 52;
    var pad = { top: 10, right: 96, bottom: 10, left: 132 };
    var H = pad.top + pad.bottom + items.length * rowH;

    var max = Math.max.apply(
      null,
      items.map(function (item) {
        return item.value;
      })
    );
    var innerW = W - pad.left - pad.right;

    var svg = frame(target, W, H);
    if (opts.ariaLabel) svg.setAttribute("aria-label", opts.ariaLabel);

    items.forEach(function (item, index) {
      var y = pad.top + index * rowH + rowH / 2;
      var barH = 22;
      var width = Math.max(2, (item.value / max) * innerW);
      var color = item.color || PALETTE[index % PALETTE.length];

      var label = el(
        "text",
        { x: pad.left - 14, y: y + 4, "text-anchor": "end", class: "chart-label" },
        svg
      );
      label.textContent = item.label;

      el(
        "rect",
        {
          x: pad.left, y: y - barH / 2, width: innerW, height: barH, rx: 6,
          style: "fill: var(--surface-2)",
        },
        svg
      );

      var bar = el(
        "rect",
        { x: pad.left, y: y - barH / 2, width: width, height: barH, rx: 6, style: "fill: " + color },
        svg
      );
      titled(bar, item.label + ": " + format(item.value));

      var value = el(
        "text",
        { x: pad.left + width + 12, y: y + 4, class: "chart-value" },
        svg
      );
      value.textContent = format(item.value) + (item.suffix || "");
    });
  }

  /* --- Heatmap ----------------------------------------------------------- */

  function heatmap(target, opts) {
    var rows = opts.rows || [];
    var cols = opts.cols || [];
    var values = opts.values || [];
    var format = opts.formatValue || defaultFormat;
    if (!rows.length || !cols.length) return;

    var pad = { top: 8, right: 8, bottom: 30, left: 46 };
    var cell = 28;
    var gap = 2;
    var W = pad.left + pad.right + cols.length * cell;
    var H = pad.top + pad.bottom + rows.length * cell;

    var flat = [];
    values.forEach(function (row) {
      row.forEach(function (v) {
        if (v != null) flat.push(v);
      });
    });
    var min = Math.min.apply(null, flat);
    var max = Math.max.apply(null, flat);

    var svg = frame(target, W, H);
    if (opts.ariaLabel) svg.setAttribute("aria-label", opts.ariaLabel);

    rows.forEach(function (rowLabel, r) {
      var label = el(
        "text",
        {
          x: pad.left - 10,
          y: pad.top + r * cell + cell / 2 + 4,
          "text-anchor": "end",
          class: "chart-label",
        },
        svg
      );
      label.textContent = rowLabel;

      (values[r] || []).forEach(function (v, c) {
        if (v == null) return;
        var ratio = max === min ? 0.5 : (v - min) / (max - min);
        // 8% a 100% de accent misturado com a superfície: legível nos dois temas.
        var pct = Math.round(8 + ratio * 92);
        var rect = el(
          "rect",
          {
            x: pad.left + c * cell + gap / 2,
            y: pad.top + r * cell + gap / 2,
            width: cell - gap,
            height: cell - gap,
            rx: 4,
            style: "fill: color-mix(in srgb, var(--accent) " + pct + "%, var(--surface-2))",
          },
          svg
        );
        titled(rect, rowLabel + " · " + cols[c] + ": " + format(v));
      });
    });

    cols.forEach(function (colLabel, c) {
      if (c % 2 !== 0) return;
      var label = el(
        "text",
        {
          x: pad.left + c * cell + cell / 2,
          y: H - pad.bottom + 18,
          "text-anchor": "middle",
          class: "chart-label",
        },
        svg
      );
      label.textContent = colLabel;
    });
  }

  window.Charts = { line: line, bars: bars, heatmap: heatmap, palette: PALETTE };
})();
