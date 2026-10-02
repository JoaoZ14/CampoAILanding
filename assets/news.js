(function () {
  var grid = document.getElementById("noticias-grid");
  var statusEl = document.getElementById("noticias-status");
  var wrapEl = document.getElementById("noticias-wrap");
  var fadeEl = document.getElementById("noticias-fade");
  var verMaisEl = document.getElementById("noticias-ver-mais");
  if (!grid) return;

  var NOTICIAS_PREVIEW = 3;
  var noticiasExpanded = false;
  var collapseListenersBound = false;

  var fallbackItems = [
    {
      title: "Notícias e comunicados do Ministério da Agricultura",
      url: "https://www.gov.br/agricultura/pt-br/canais_atendimento/imprensa/noticias",
      source: "MAPA",
      publishedAt: "",
      image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad371?auto=format&fit=crop&w=800&q=70"
    },
    {
      title: "Pesquisa, tecnologia e notícias da Embrapa",
      url: "https://www.embrapa.br/",
      source: "Embrapa",
      publishedAt: "",
      image: ""
    },
    {
      title: "Informação e análise para o agronegócio",
      url: "https://www.canalrural.com.br/",
      source: "Canal Rural",
      publishedAt: "",
      image: ""
    }
  ];

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function safeUrl(u) {
    var s = String(u || "").trim();
    if (!/^https?:\/\//i.test(s)) return "https://www.gov.br/agricultura/";
    try {
      var parsed = new URL(s);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") return parsed.href;
    } catch (e) {}
    return "https://www.gov.br/agricultura/";
  }

  function safeImageUrl(u) {
    var s = String(u || "").trim();
    if (!/^https?:\/\//i.test(s)) return "";
    try {
      var parsed = new URL(s);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") return parsed.href;
    } catch (e) {}
    return "";
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

  function isLocalDevHost() {
    try {
      var h = String(location.hostname || "").toLowerCase();
      if (h === "localhost" || h === "127.0.0.1" || h === "[::1]" || h.endsWith(".localhost")) return true;
      if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
      if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
      if (/^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
      return false;
    } catch (e) {
      return false;
    }
  }

  function noticiasJsonUrl() {
    var w = typeof window.__CAMPOAI_NOTICIAS_JSON__ === "string" ? window.__CAMPOAI_NOTICIAS_JSON__.trim() : "";
    if (w && /^https?:\/\//i.test(w)) return w;
    var meta = document.querySelector('meta[name="campoai-noticias-json"]');
    var c = meta && meta.getAttribute("content") ? meta.getAttribute("content").trim() : "";
    if (c && /^https?:\/\//i.test(c) && !isLocalDevHost()) return c;
    return "noticias.json";
  }

  var NOTICIAS_LS = "campoai-noticias-cache::" + noticiasJsonUrl();

  function loadFromJson() {
    return fetch(noticiasJsonUrl(), { cache: "no-store", credentials: "omit" })
      .then(function (r) {
        if (!r.ok) throw new Error("noticias");
        return r.json();
      })
      .then(function (data) {
        try {
          if (data && Array.isArray(data.items) && data.items.length) {
            localStorage.setItem(NOTICIAS_LS, JSON.stringify(data));
          }
        } catch (e) {}
        var items = data && Array.isArray(data.items) ? data.items : [];
        var list = items.length ? items : fallbackItems;
        var fetchedAt = data && data.fetchedAt ? data.fetchedAt : null;
        return { items: list, fetchedAt: fetchedAt };
      })
      .catch(function () {
        try {
          var raw = localStorage.getItem(NOTICIAS_LS);
          if (raw) {
            var data = JSON.parse(raw);
            var items = data && Array.isArray(data.items) ? data.items : [];
            if (items.length) {
              return { items: items, fetchedAt: data.fetchedAt || null };
            }
          }
        } catch (e) {}
        return { items: fallbackItems, fetchedAt: null };
      });
  }

  function bindCollapseLayout() {
    if (collapseListenersBound || !wrapEl) return;
    collapseListenersBound = true;

    var remeasureTimer = null;
    function scheduleRemeasure() {
      if (noticiasExpanded) return;
      clearTimeout(remeasureTimer);
      remeasureTimer = setTimeout(function () {
        updateCollapsedMaxHeight();
      }, 80);
    }

    window.addEventListener("resize", scheduleRemeasure);
    grid.addEventListener("load", scheduleRemeasure, true);
  }

  function updateCollapsedMaxHeight() {
    if (!wrapEl || noticiasExpanded || !wrapEl.classList.contains("noticias-wrap--collapsed")) return;
    var cards = grid.querySelectorAll(".news-card");
    if (cards.length <= NOTICIAS_PREVIEW) return;
    var anchor = cards[NOTICIAS_PREVIEW - 1];
    var wrapTop = wrapEl.getBoundingClientRect().top;
    var bottom = anchor.getBoundingClientRect().bottom;
    var peekPx = 72;
    wrapEl.style.maxHeight = Math.max(180, Math.ceil(bottom - wrapTop + peekPx)) + "px";
  }

  function setOverflowAccessible(expanded) {
    grid.querySelectorAll('.news-card').forEach(function (card, index) {
      var clipped = !expanded && index >= NOTICIAS_PREVIEW;
      card.inert = clipped;
      if (clipped) card.setAttribute('aria-hidden', 'true');
      else card.removeAttribute('aria-hidden');
    });
  }

  function setupNoticiasCollapse() {
    if (!wrapEl || !fadeEl || !verMaisEl) return;

    noticiasExpanded = false;
    verMaisEl.onclick = null;
    wrapEl.classList.remove("noticias-wrap--collapsed");
    wrapEl.style.maxHeight = "";
    fadeEl.hidden = true;
    verMaisEl.hidden = true;
    verMaisEl.textContent = "Ver mais";
    verMaisEl.setAttribute("aria-expanded", "false");

    var cardCount = grid.querySelectorAll(".news-card").length;
    if (cardCount <= NOTICIAS_PREVIEW) return;

    setOverflowAccessible(false);

    wrapEl.classList.add("noticias-wrap--collapsed");
    fadeEl.hidden = false;
    verMaisEl.hidden = false;
    bindCollapseLayout();

    requestAnimationFrame(function () {
      requestAnimationFrame(updateCollapsedMaxHeight);
    });
    setTimeout(updateCollapsedMaxHeight, 400);

    verMaisEl.onclick = function () {
      noticiasExpanded = !noticiasExpanded;
      setOverflowAccessible(noticiasExpanded);
      if (noticiasExpanded) {
        verMaisEl.setAttribute("aria-expanded", "true");
        verMaisEl.textContent = "Ver menos";
        wrapEl.classList.remove("noticias-wrap--collapsed");
        wrapEl.style.maxHeight = "";
        fadeEl.hidden = true;
        try {
          var fourthCard = grid.querySelectorAll(".news-card")[NOTICIAS_PREVIEW];
          var fourthLink = fourthCard && fourthCard.querySelector(".news-card__link");
          if (fourthLink && typeof fourthLink.focus === "function") fourthLink.focus({ preventScroll: true });
        } catch (e) {}
      } else {
        verMaisEl.setAttribute("aria-expanded", "false");
        verMaisEl.textContent = "Ver mais";
        wrapEl.classList.add("noticias-wrap--collapsed");
        fadeEl.hidden = false;
        requestAnimationFrame(function () {
          requestAnimationFrame(updateCollapsedMaxHeight);
        });
        try {
          verMaisEl.focus({ preventScroll: true });
        } catch (e) {}
      }
    };
  }

  function render(items) {
    if (!items.length) {
      grid.innerHTML = '<li class="news-empty">Nenhuma notícia cadastrada no momento.</li>';
      grid.setAttribute("aria-busy", "false");
      setupNoticiasCollapse();
      return;
    }

    var html = items.map(function (item) {
      var url = safeUrl(item.url);
      var title = escapeHtml(item.title || "Sem título");
      var source = escapeHtml(item.source || "Fonte");
      var dateStr = formatDate(item.publishedAt);
      var meta = source + (dateStr ? " · " + dateStr : "");
      var imgUrl = safeImageUrl(item.image);
      var media = imgUrl
        ? '<div class="news-card__media"><img src="' + escapeHtml(imgUrl) + '" alt="" loading="lazy" decoding="async" width="640" height="400"></div>'
        : '<div class="news-card__media news-card__media--empty" aria-hidden="true"></div>';

      return (
        '<li class="news-card">' +
        '<a class="news-card__link" href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">' +
        media +
        '<div class="news-card__body">' +
        '<p class="news-card__meta">' + meta + "</p>" +
        '<h3 class="news-card__title">' + title + "</h3>" +
        '<span class="sr-only">Abre em nova aba.</span>' +
        '<span class="news-card__cta" aria-hidden="true">Ver na fonte</span>' +
        "</div></a></li>"
      );
    }).join("");

    grid.innerHTML = html;
    grid.querySelectorAll('.news-card__media img').forEach(function (img) {
      img.addEventListener('error', function () {
        img.hidden = true;
        img.parentElement.classList.add('news-card__media--empty');
      }, { once: true });
    });
    grid.setAttribute("aria-busy", "false");
    setupNoticiasCollapse();
  }

  function doneLoading() {
    if (statusEl) statusEl.hidden = true;
  }

  loadFromJson().then(function (res) {
    render(res.items);
    doneLoading();
  });
})();
