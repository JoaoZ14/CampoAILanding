/**
 * O site NÃO usa chave no navegador.
 *
 * Atualizar notícias:
 *   1) Copie .env.example para .env e preencha GNEWS_API_KEY (não commite .env).
 *   2) npm install
 *   3) npm run noticias:fetch   — uma vez manual
 *   4) npm run noticias:daemon  — Node fica rodando; todo dia ~12h (Brasília) roda o fetch
 *
 * GitHub Actions (opcional): secret GNEWS_API_KEY + workflow update-noticias.yml
 */
