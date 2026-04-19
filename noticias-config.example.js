/**
 * O site NÃO usa mais chave no navegador.
 *
 * Atualize as notícias assim:
 *   1) GitHub: secret GNEWS_API_KEY + workflow "Atualizar notícias (GNews)" (diário às 12h BRT).
 *   2) Local: na pasta do projeto, com Node 18+:
 *        PowerShell:  $env:GNEWS_API_KEY="sua_chave"; npm run noticias:fetch
 *        Depois faça commit do noticias.json se quiser publicar o cache.
 */
