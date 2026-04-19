/**
 * Atualiza noticias.json com a GNews em modo arquivo rolante:
 * - A cada execução busca GNEWS_MAX_ARTICLES (padrão 10) notícias novas.
 * - Junta com o que já está em noticias.json, deduplica por URL.
 * - Ordena por data de publicação (mais recentes primeiro).
 * - Mantém no máximo GNEWS_ARCHIVE_MAX itens (padrão 60), removendo as mais antigas.
 *
 * Uso local (PowerShell):
 *   $env:GNEWS_API_KEY="sua_chave"; node scripts/fetch-gnews.mjs
 *
 * Variáveis opcionais: GNEWS_MAX_ARTICLES, GNEWS_PAGE_SIZE, GNEWS_ARCHIVE_MAX
 *
 * GitHub Actions: secret GNEWS_API_KEY + workflow update-noticias.yml
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outPath = path.join(root, "noticias.json");

const key = (process.env.GNEWS_API_KEY || "").trim();
if (!key) {
  console.error("Defina a variável de ambiente GNEWS_API_KEY.");
  process.exit(1);
}

/** Quantas notícias buscar nesta execução (ex.: 10 por dia). */
const FETCH_BATCH = Math.min(
  100,
  Math.max(1, Number.parseInt(process.env.GNEWS_MAX_ARTICLES || "10", 10) || 10)
);

/** Tamanho máximo do arquivo acumulado (remove as mais antigas por publishedAt). */
const ARCHIVE_MAX = Math.min(
  200,
  Math.max(1, Number.parseInt(process.env.GNEWS_ARCHIVE_MAX || "60", 10) || 60)
);

const PAGE_SIZE = Math.min(
  100,
  Math.max(1, Number.parseInt(process.env.GNEWS_PAGE_SIZE || "10", 10) || 10)
);

const query = encodeURIComponent("agronegócio OR agricultura OR pecuária");
const baseUrl =
  "https://gnews.io/api/v4/search?q=" +
  query +
  "&lang=pt&country=br&sortby=publishedAt&nullable=image&max=" +
  PAGE_SIZE +
  "&apikey=" +
  encodeURIComponent(key);

function normUrl(u) {
  try {
    const p = new URL(String(u || "").trim());
    p.hash = "";
    return p.href.toLowerCase();
  } catch {
    return String(u || "")
      .trim()
      .toLowerCase();
  }
}

function pubTime(item) {
  const t = Date.parse(item.publishedAt || "");
  return Number.isFinite(t) ? t : 0;
}

function mapArticle(a) {
  let src = "";
  if (a.source) {
    if (typeof a.source === "string") src = a.source;
    else if (a.source.name) src = a.source.name;
  }
  return {
    title: a.title || "",
    url: a.url || "",
    source: src || "GNews",
    publishedAt: a.publishedAt || "",
    image: a.image || ""
  };
}

async function fetchPage(page) {
  const url = baseUrl + "&page=" + page;
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data || data.errors || !Array.isArray(data.articles)) {
    const err = new Error("GNews erro: " + (data.errors ? JSON.stringify(data.errors) : res.status));
    err.data = data;
    err.status = res.status;
    throw err;
  }
  return data.articles;
}

async function fetchFreshFromApi() {
  const items = [];
  const seen = new Set();
  const maxPages = Math.min(20, Math.ceil(FETCH_BATCH / PAGE_SIZE) + 2);

  for (let page = 1; page <= maxPages && items.length < FETCH_BATCH; page++) {
    const articles = await fetchPage(page);
    if (!articles.length) break;

    for (const a of articles) {
      const x = mapArticle(a);
      if (!x.title || !x.url) continue;
      const k = normUrl(x.url);
      if (seen.has(k)) continue;
      seen.add(k);
      items.push(x);
      if (items.length >= FETCH_BATCH) break;
    }

    if (articles.length < PAGE_SIZE) break;

    await new Promise(function (r) {
      setTimeout(r, 300);
    });
  }
  return items;
}

function loadExistingItems() {
  if (!fs.existsSync(outPath)) return [];
  try {
    const raw = fs.readFileSync(outPath, "utf8");
    const prev = JSON.parse(raw);
    if (prev && Array.isArray(prev.items)) {
      return prev.items.filter(function (it) {
        return it && it.url && it.title;
      });
    }
  } catch {
    /* mantém vazio */
  }
  return [];
}

function mergeArchive(existing, incoming) {
  const map = new Map();

  for (const it of existing) {
    const k = normUrl(it.url);
    if (!k) continue;
    map.set(k, {
      title: it.title,
      url: it.url,
      source: it.source || "GNews",
      publishedAt: it.publishedAt || "",
      image: it.image || ""
    });
  }

  for (const it of incoming) {
    const k = normUrl(it.url);
    if (!k) continue;
    map.set(k, {
      title: it.title,
      url: it.url,
      source: it.source || "GNews",
      publishedAt: it.publishedAt || "",
      image: it.image || ""
    });
  }

  let arr = Array.from(map.values());
  arr.sort(function (a, b) {
    return pubTime(b) - pubTime(a);
  });
  if (arr.length > ARCHIVE_MAX) {
    arr = arr.slice(0, ARCHIVE_MAX);
  }
  return arr;
}

let incoming;
try {
  incoming = await fetchFreshFromApi();
} catch (e) {
  console.error(e.message || e);
  process.exit(1);
}

if (!incoming.length) {
  console.error("Nenhum artigo novo retornado pela API.");
  process.exit(1);
}

const existing = loadExistingItems();
const beforeUrls = new Set(existing.map((x) => normUrl(x.url)));
const merged = mergeArchive(existing, incoming);
const added = incoming.filter((x) => !beforeUrls.has(normUrl(x.url))).length;

const payload = {
  items: merged,
  fetchedAt: new Date().toISOString(),
  source: "gnews",
  archiveMax: ARCHIVE_MAX,
  lastFetchCount: incoming.length
};

fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
console.log(
  "Gravado:",
  outPath,
  "→",
  merged.length,
  "itens (máx.",
  ARCHIVE_MAX +
    "); +" +
    added +
    " URL(s) novas nesta execução; " +
    incoming.length +
    " buscadas na API."
);
