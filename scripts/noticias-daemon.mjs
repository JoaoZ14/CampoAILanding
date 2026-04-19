/**
 * Processo Node que fica rodando e executa fetch-gnews.mjs todo dia ao meio-dia
 * (America/Sao_Paulo), igual à ideia do GitHub Actions — sem depender do GitHub.
 *
 * Uso:
 *   npm install
 *   Copie .env.example para .env e preencha GNEWS_API_KEY
 *   npm run noticias:daemon
 *
 * Variáveis opcionais:
 *   RUN_ON_START=0   — não roda fetch ao subir o daemon (só no cron)
 *   CRON="0 12 * * *" — outro horário (padrão meio-dia em São Paulo)
 */

import "dotenv/config";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import cron from "node-cron";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const fetchScript = path.join(__dirname, "fetch-gnews.mjs");

const cronExpr = (process.env.NOTICIAS_CRON || "0 12 * * *").trim();
const tz = (process.env.NOTICIAS_TZ || "America/Sao_Paulo").trim();
const runOnStart = process.env.RUN_ON_START !== "0" && process.env.RUN_ON_START !== "false";

function runFetch() {
  return new Promise(function (resolve, reject) {
    console.log("\n[" + new Date().toISOString() + "] Iniciando fetch-gnews.mjs …");
    const child = spawn(process.execPath, [fetchScript], {
      cwd: root,
      env: process.env,
      stdio: "inherit"
    });
    child.on("error", reject);
    child.on("close", function (code) {
      if (code === 0) {
        console.log("[" + new Date().toISOString() + "] fetch-gnews concluído (ok).");
        resolve();
      } else {
        reject(new Error("fetch-gnews saiu com código " + code));
      }
    });
  });
}

if (!(process.env.GNEWS_API_KEY || "").trim()) {
  console.error("Defina GNEWS_API_KEY no .env ou no ambiente antes de subir o daemon.");
  process.exit(1);
}

console.log("Daemon de notícias ativo.");
console.log("  Agendamento:", cronExpr, "| fuso:", tz);
console.log("  Projeto:", root);

cron.schedule(
  cronExpr,
  function () {
    runFetch().catch(function (err) {
      console.error("[cron]", err.message || err);
    });
  },
  { timezone: tz }
);

if (runOnStart) {
  runFetch().catch(function (err) {
    console.error("[início]", err.message || err);
  });
}
