(function () {
  var grid = document.getElementById("cotacoes-grid");
  var statusEl = document.getElementById("cotacoes-status");
  var updatedEl = document.getElementById("cotacoes-updated");
  var commoditySel = document.getElementById("cotacoes-commodity");
  var ufSel = document.getElementById("cotacoes-uf");
  if (!grid || !commoditySel || !ufSel) return;

  var fallbackItems = [
    { commodity: "Soja", uf: "PR", price: 0, currency: "BRL", unit: "sc 60kg", date: "", source: "Agrobr" },
    { commodity: "Milho", uf: "MT", price: 0, currency: "BRL", unit: "sc 60kg", date: "", source: "Agrobr" },
    { commodity: "Boi gordo", uf: "SP", price: 0, currency: "BRL", unit: "@ 15kg", date: "", source: "Agrobr" },
    { commodity: "Café arábica", uf: "MG", price: 0, currency: "BRL", unit: "sc 60kg", date: "", source: "Agrobr" },
    { commodity: "Algodão", uf: "BA", price: 0, currency: "BRL", unit: "lp", date: "", source: "Agrobr" },
    { commodity: "Trigo", uf: "RS", price: 0, currency: "BRL", unit: "sc 60kg", date: "", source: "Agrobr" }
  ];

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatMoney(value, currency) {
    var n = Number(value);
    if (!isFinite(n) || n <= 0) return null;
    try {
      return n.toLocaleString("pt-BR", { style: "currency", currency: currency || "BRL" });
    } catch (e) {
      return "R$ " + n.toFixed(2).replace(".", ",");
    }
  }

  function formatDate(iso) {
    if (!iso) return "";
    try {
      var d = new Date(iso);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
    } catch (e) {
      return "";
    }
  }

  function cotacoesJsonUrl() {
    var meta = document.querySelector('meta[name="campoai-cotacoes-json"]');
    var c = meta && meta.getAttribute("content") ? meta.getAttribute("content").trim() : "";
    return c || "cotacoes.json";
  }

  var COTACOES_LS = "campoai-cotacoes-cache::" + cotacoesJsonUrl();

  function loadFromJson() {
    return fetch(cotacoesJsonUrl(), { cache: "no-store", credentials: "omit" })
      .then(function (r) {
        if (!r.ok) throw new Error("cotacoes");
        return r.json();
      })
      .then(function (data) {
        try {
          if (data && Array.isArray(data.items) && data.items.length) {
            localStorage.setItem(COTACOES_LS, JSON.stringify(data));
          }
        } catch (e) {}
        var items = data && Array.isArray(data.items) ? data.items : [];
        return { items: items.length ? items : fallbackItems, fetchedAt: data && data.fetchedAt ? data.fetchedAt : null };
      })
      .catch(function () {
        try {
          var raw = localStorage.getItem(COTACOES_LS);
          if (raw) {
            var data = JSON.parse(raw);
            var items = data && Array.isArray(data.items) ? data.items : [];
            if (items.length) return { items: items, fetchedAt: data.fetchedAt || null };
          }
        } catch (e) {}
        return { items: fallbackItems, fetchedAt: null };
      });
  }

  function uniqueSorted(arr) {
    var seen = Object.create(null);
    var out = [];
    arr.forEach(function (v) {
      var s = String(v || "").trim();
      if (!s) return;
      if (seen[s]) return;
      seen[s] = true;
      out.push(s);
    });
    out.sort(function (a, b) { return a.localeCompare(b, "pt-BR"); });
    return out;
  }

  function setSelectOptions(select, options) {
    select.innerHTML = options.map(function (o) {
      return '<option value="' + escapeHtml(o.value) + '">' + escapeHtml(o.label) + "</option>";
    }).join("");
  }

  function buildFilters(items) {
    var commodities = uniqueSorted(items.map(function (i) { return i.commodity; }));
    var ufs = uniqueSorted(items.map(function (i) { return i.uf; }));

    setSelectOptions(commoditySel, [{ value: "ALL", label: "Produto: todos" }].concat(
      commodities.map(function (c) { return { value: c, label: c }; })
    ));
    setSelectOptions(ufSel, [{ value: "ALL", label: "UF: todas" }].concat(
      ufs.map(function (u) { return { value: u, label: u }; })
    ));
  }

  function applyFilters(items) {
    var c = commoditySel.value || "ALL";
    var u = ufSel.value || "ALL";
    return items.filter(function (it) {
      if (c !== "ALL" && String(it.commodity || "") !== c) return false;
      if (u !== "ALL" && String(it.uf || "") !== u) return false;
      return true;
    });
  }

  function render(items) {
    if (!items.length) {
      grid.innerHTML = '<li class="news-empty">Nenhuma cotação disponível no momento.</li>';
      grid.setAttribute("aria-busy", "false");
      return;
    }

    grid.innerHTML = items.map(function (item) {
      var commodity = escapeHtml(item.commodity || "Produto");
      var uf = escapeHtml(item.uf || "");
      var source = escapeHtml(item.source || "Fonte");
      var unit = escapeHtml(item.unit || "");
      var dateStr = formatDate(item.date);
      var price = formatMoney(item.price, item.currency || "BRL");
      var priceUnavailable = !price;
      var recordTime = item.date ? new Date(item.date).getTime() : NaN;
      var isHistorical = isFinite(recordTime) && Date.now() - recordTime > 3 * 24 * 60 * 60 * 1000;

      var pills = (uf ? '<span class="quote-pill" aria-label="UF">' + uf + "</span>" : "") +
                  (source ? '<span class="quote-pill" aria-label="Fonte">' + source + "</span>" : "") +
                  (isHistorical ? '<span class="quote-pill" aria-label="Cotação histórica">Histórico</span>' : '');

      var meta = [];
      if (dateStr) meta.push("Data: " + escapeHtml(dateStr));
      if (unit && !priceUnavailable) meta.push("Unidade: " + unit);

      return (
        '<li class="quote-card">' +
          '<div class="quote-card__body">' +
            '<h3 class="quote-card__title">' + commodity + "</h3>" +
            '<div class="quote-card__meta">' + pills + "</div>" +
            '<div class="quote-card__price' + (priceUnavailable ? " quote-card__price--unavailable" : "") + '"><strong>' +
              (priceUnavailable ? "Indisponível" : escapeHtml(price)) +
            '</strong>' +
              (!priceUnavailable && unit ? '<span class="quote-card__unit">' + unit + "</span>" : "") +
            "</div>" +
            (meta.length ? '<p class="quote-card__meta">' + meta.join(" · ") + "</p>" : "") +
          "</div>" +
        "</li>"
      );
    }).join("");

    grid.setAttribute("aria-busy", "false");
  }

  function doneLoading() {
    if (statusEl) statusEl.hidden = true;
  }

  var allItems = [];
  var usingFallback = false;
  loadFromJson().then(function (res) {
    allItems = Array.isArray(res.items) ? res.items : [];
    usingFallback = !res.fetchedAt && allItems.every(function (it) {
      return !Number(it.price) || Number(it.price) <= 0;
    });

    buildFilters(allItems);
    render(applyFilters(allItems));

    commoditySel.addEventListener("change", function () {
      render(applyFilters(allItems));
    });
    ufSel.addEventListener("change", function () {
      render(applyFilters(allItems));
    });

    if (updatedEl) {
      if (res.fetchedAt) {
        var updated = formatDate(res.fetchedAt);
        updatedEl.textContent = updated ? ("Arquivo recebido em " + updated + ". Veja a data de cada cotação; valores antigos são marcados como históricos.") : "Confira a data de cada cotação.";
        updatedEl.hidden = false;
      } else if (usingFallback) {
        updatedEl.textContent = "Valores indisponíveis no momento. Mostrando produtos de referência sem cotação.";
        updatedEl.hidden = false;
      } else {
        updatedEl.hidden = true;
      }
    }

    doneLoading();
  });
})();
