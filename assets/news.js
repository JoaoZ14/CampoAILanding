(function () {
  var grid = document.getElementById("noticias-grid");
  var statusEl = document.getElementById("noticias-status");
  var wrapEl = document.getElementById("noticias-wrap");
  var fadeEl = document.getElementById("noticias-fade");
  var verMaisEl = document.getElementById("noticias-ver-mais");
  var sectionEl = document.getElementById("noticias");
  var refreshEl = document.getElementById("noticias-atualizar");
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

  function noticiasJsonUrls() {
    var w = typeof window.__CAMPOAI_NOTICIAS_JSON__ === "string" ? window.__CAMPOAI_NOTICIAS_JSON__.trim() : "";
    if (w && /^https?:\/\//i.test(w)) return [w];
    var urls = [];
    ['campoai-noticias-json', 'campoai-noticias-fallback'].forEach(function (name) {
      var meta = document.querySelector('meta[name="' + name + '"]');
      var url = meta && meta.getAttribute("content") ? meta.getAttribute("content").trim() : "";
      if (/^https?:\/\//i.test(url) && urls.indexOf(url) === -1) urls.push(url);
    });
    return urls.length ? urls : ["noticias.json"];
  }

  var newsUrls = noticiasJsonUrls();
  var NOTICIAS_LS = "campoai-noticias-cache::" + newsUrls[0];
  var CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

  function normalizePayload(data) {
    if (!data || !Array.isArray(data.items)) throw new Error("Formato de notícias inválido.");
    var items = data.items.filter(function (item) {
      if (!item || typeof item.title !== 'string' || !item.title.trim() || typeof item.url !== 'string') return false;
      try { return /^https?:$/.test(new URL(item.url).protocol); } catch (e) { return false; }
    }).slice(0, 60);
    var fetchedAt = typeof data.fetchedAt === 'string' && Number.isFinite(Date.parse(data.fetchedAt)) ? data.fetchedAt : null;
    return { items: items, fetchedAt: fetchedAt };
  }

  function fetchPayload(url) {
    return new Promise(function (resolve, reject) {
      var controller = typeof AbortController === 'function' ? new AbortController() : null;
      var timer = setTimeout(function () {
        reject(new Error("Tempo limite das notícias."));
        if (controller) controller.abort();
      }, 4000);
      fetch(url, { cache: "no-store", credentials: "omit", signal: controller ? controller.signal : undefined })
        .then(function (r) { if (!r.ok) throw new Error("Notícias indisponíveis."); return r.json(); })
        .then(normalizePayload)
        .then(function (data) { clearTimeout(timer); resolve(data); })
        .catch(function (error) { clearTimeout(timer); reject(error); });
    });
  }

  function fetchFromEndpoint(index) {
    return fetchPayload(newsUrls[index]).catch(function (error) {
      if (index + 1 < newsUrls.length) return fetchFromEndpoint(index + 1);
      throw error;
    });
  }

  function loadFromJson() {
    return fetchFromEndpoint(0)
      .then(function (data) {
        try {
          if (data.items.length) {
            localStorage.setItem(NOTICIAS_LS, JSON.stringify({ payload: data, savedAt: Date.now() }));
          }
        } catch (e) {}
        return { items: data.items.length ? data.items : fallbackItems, fetchedAt: data.fetchedAt, mode: data.items.length ? 'live' : 'empty' };
      })
      .catch(function () {
        try {
          var raw = localStorage.getItem(NOTICIAS_LS);
          if (raw) {
            var stored = JSON.parse(raw);
            var data = normalizePayload(stored.payload || stored);
            // Do not renew the age of an old feed just because it was cached again.
            var storedAt = data.fetchedAt ? Date.parse(data.fetchedAt) : stored.savedAt;
            if (data.items.length && Number.isFinite(storedAt) && storedAt <= Date.now() && Date.now() - storedAt <= CACHE_MAX_AGE_MS) {
              return { items: data.items, fetchedAt: data.fetchedAt, mode: 'cached' };
            }
          }
        } catch (e) {}
        return { items: fallbackItems, fetchedAt: null, mode: 'unavailable' };
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

  var initialized = false;
  var loading = false;
  function loadNews() {
    if (loading) return;
    loading = true;
    initialized = true;
    grid.setAttribute('aria-busy', 'true');
    if (statusEl) { statusEl.hidden = false; statusEl.textContent = 'Carregando notícias…'; }
    if (refreshEl) { refreshEl.hidden = false; refreshEl.disabled = true; refreshEl.textContent = 'Atualizando…'; }
    loadFromJson().then(function (res) {
      render(res.items);
      if (statusEl) {
        var date = formatDate(res.fetchedAt);
        if (res.mode === 'cached') statusEl.textContent = 'Não conseguimos atualizar agora. Mostrando notícias salvas' + (date ? ' em ' + date : '') + '.';
        else if (res.mode === 'unavailable') statusEl.textContent = 'Não conseguimos carregar as notícias agora. Você pode tentar novamente ou acessar as fontes abaixo.';
        else if (res.mode === 'empty') statusEl.textContent = 'Ainda não há notícias disponíveis. Enquanto isso, consulte as fontes abaixo.';
        else statusEl.textContent = date ? 'Última atualização: ' + date + '.' : 'Notícias das fontes abaixo.';
      }
    }).finally(function () {
      loading = false;
      if (refreshEl) { refreshEl.disabled = false; refreshEl.textContent = 'Atualizar'; }
    });
  }

  if (refreshEl) refreshEl.addEventListener('click', loadNews);
  if (sectionEl) {
    sectionEl.addEventListener('toggle', function () { if (sectionEl.open && !initialized) loadNews(); });
    if (sectionEl.open) loadNews();
  } else loadNews();
})();
