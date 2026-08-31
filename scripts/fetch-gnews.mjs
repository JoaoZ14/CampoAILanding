/**
 * Atualiza noticias.json com a GNews em modo arquivo rolante:
 * - A cada execução busca GNEWS_MAX_ARTICLES (padrão 10) notícias novas.
 * - Junta com o que já está em noticias.json, deduplica por URL.
 * - Ordena por data de publicação (mais recentes primeiro).
 * - Mantém no máximo GNEWS_ARCHIVE_MAX itens (padrão 60), removendo as mais antigas.
 * - Filtra matérias políticas e prioriza termos do agro (ver agro-news-filter.mjs).
 *
 * Uso local (PowerShell):
 *   $env:GNEWS_API_KEY="sua_chave"; node scripts/fetch-gnews.mjs
 *
 * Variáveis opcionais: GNEWS_MAX_ARTICLES, GNEWS_PAGE_SIZE, GNEWS_ARCHIVE_MAX,
 *   GNEWS_QUERY, GNEWS_EXCLUDE_TERMS, GNEWS_FILTER_AGRO
 *
 * GitHub Actions: secret GNEWS_API_KEY + workflow update-noticias.yml
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  filterAgroNews,
  isAgroFilterEnabled,
  resolveExtraBlocklist,
  resolveGNewsQuery
} from "./agro-news-filter.mjs";

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

const FILTER_ENABLED = isAgroFilterEnabled();
const EXTRA_BLOCKLIST = resolveExtraBlocklist();
const GNEWS_QUERY = resolveGNewsQuery();

const query = encodeURIComponent(GNEWS_QUERY);
const baseUrl =
  "https://gnews.io/api/v4/search?q=" +
  query +
  "&lang=pt&country=br&sortby=publishedAt&nullable=image&max=" +
  PAGE_SIZE +
  "&in=title,description&apikey=" +
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

function applyAgroFilter(items) {
  if (!FILTER_ENABLED) return items;
  return filterAgroNews(items, { extraBlocklist: EXTRA_BLOCKLIST, enabled: true });
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
  const rawItems = [];
  const seen = new Set();
  const maxPages = FILTER_ENABLED
    ? Math.min(30, Math.ceil((FETCH_BATCH * 4) / PAGE_SIZE) + 2)
    : Math.min(20, Math.ceil(FETCH_BATCH / PAGE_SIZE) + 2);

  for (let page = 1; page <= maxPages; page++) {
    const articles = await fetchPage(page);
    if (!articles.length) break;

    for (const a of articles) {
      const x = mapArticle(a);
      if (!x.title || !x.url) continue;
      const k = normUrl(x.url);
      if (seen.has(k)) continue;
      seen.add(k);
      rawItems.push(x);
    }

    const filtered = applyAgroFilter(rawItems);
    if (filtered.length >= FETCH_BATCH) break;
    if (articles.length < PAGE_SIZE) break;

    await new Promise(function (r) {
      setTimeout(r, 300);
    });
  }

  const filtered = applyAgroFilter(rawItems);
  const result = filtered.slice(0, FETCH_BATCH);

  if (FILTER_ENABLED && rawItems.length > result.length) {
    console.log(
      "Filtro agro:",
      rawItems.length - filtered.length,
      "descartada(s);",
      result.length,
      "mantida(s) nesta execução."
    );
  }

  return result;
}

function loadExistingItems() {
  if (!fs.existsSync(outPath)) return [];
  try {
    const raw = fs.readFileSync(outPath, "utf8");
    const prev = JSON.parse(raw);
    if (prev && Array.isArray(prev.items)) {
      const items = prev.items.filter(function (it) {
        return it && it.url && it.title;
      });
      return applyAgroFilter(items);
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

  let arr = applyAgroFilter(Array.from(map.values()));
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
  console.error("Nenhum artigo relevante retornado pela API (após filtro agro).");
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
  lastFetchCount: incoming.length,
  query: GNEWS_QUERY,
  filterAgro: FILTER_ENABLED
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
