# Catálogo da landing

A seção de planos consulta o endpoint definido no meta `agassist-plans-json`
de `index.html`, atualmente `https://campoai-production-b7c7.up.railway.app/api/plans`.

As notícias também consultam o backend do Railway. `app.useaggi.com` é usado
nos links de acesso, cadastro e contratação, não nas chamadas da API da landing.

Não há catálogo de ofertas, preços ou franquias no HTML ou JavaScript da landing.
Os cartões seguem a quantidade e a ordem dos planos retornados pela API. Nomes,
preços mensais, descrições (`summary`), benefícios (`bullets`), destaques e notas
também vêm da API. Os códigos não precisam fazer parte de uma lista fixa.

Para mudar uma oferta, atualize `product_plans` e `plan_catalog` no backend,
conforme o SQL de alteração do catálogo. O backend usa as linhas ativas de
`product_plans` para confirmar preço e limites. Ao abrir novamente a landing,
ela busca a oferta atual sem exigir novo deploy para alterar valores.

## Carregamento e indisponibilidade

A consulta acontece quando a seção se aproxima da tela, com timeout de seis
segundos e `cache: no-store`. Alternar entre Pessoal e Empresa usa a mesma
resposta. Uma nova visita ou o botão de tentar novamente faz outra consulta.

Falhas HTTP, timeout, JSON inválido, ofertas inválidas ou duplicadas e respostas
marcadas pelo backend como `catalogSource: fallback` mostram uma mensagem com
botão de tentar novamente e link para a página de contratação. Não são exibidos
preços antigos, valores alternativos ou ofertas inventadas. Catálogos ou segmentos
sem ofertas mostram um estado vazio. Sem JavaScript, há um link de contratação.

O backend precisa permitir CORS para a origem da landing. As requisições são
públicas, somente de leitura, e não levam cookies nem credenciais do cliente.

## Validação

`npm run test:landing` verifica o catálogo recebido, alterações de preços e
benefícios, códigos novos, ordenação, mudanças de quantidade, indisponibilidade,
recuperação, timeout, estados vazios e layouts de desktop e celular. Os testes
substituem a API por respostas locais e não criam assinaturas ou pagamentos.

Se Playwright não estiver instalado no projeto, defina `PLAYWRIGHT_MODULE` com o
caminho de uma instalação disponível antes de executar o comando.
