# Landing AGGI

A página apresenta o AGGI como o sistema de controle e a Lida como sua assistente no WhatsApp. As atividades são mostradas como disponíveis, conforme confirmação de ativação em produção.

## Conteúdo e interação

- Proposta principal e acesso ao cadastro ou app.
- Explicação dos dois canais, com a mesma conta.
- Visão dos seis grupos de funções, com pedidos curtos: gastos/vendas/recebimentos, agenda, plantio/produção, fichas/cuidados, estoque/consumo e acontecimentos/dúvidas.
- O app é apresentado como acesso no navegador, com resumo da propriedade, detalhes e correções. Não há promessa de publicação em loja de aplicativos.
- Seis exemplos interativos: gastos, tarefas, produção, estoque, histórico e dúvidas.
- Seis grupos que apresentam agricultura, bovinos, criação de equinos, pequenas criações, aquicultura/apicultura e florestas/outras atividades.
- Três passos para começar (e-mail/senha e confirmação por SMS, cadastro da propriedade, primeiro registro), com uma primeira mensagem que pode ser copiada.
- Teste gratuito separado dos planos, perguntas frequentes e contato legível.
- Cotações e notícias preservadas como conteúdo opcional, em seções expansíveis.

### Notícias

As notícias são buscadas somente quando a seção é aberta, inclusive na prévia local. A URL principal está no meta campoai-noticias-json. O meta campoai-noticias-fallback aponta temporariamente para o endpoint público do Railway; em 11/10/2026, o novo subdomínio app.useaggi.com ainda não resolvia no DNS, enquanto o Railway retornava o arquivo atual com 60 notícias. Remova a alternativa quando o novo domínio estiver configurado e validado.

Cada consulta tem prazo de quatro segundos. Se o endpoint principal falhar, a página tenta o alternativo. Ela mostra a data de atualização do feed, oferece um botão Atualizar e identifica quando usa notícias salvas. O cache do navegador expira em sete dias a partir da atualização do feed; gravá-lo novamente não renova a idade dos artigos. Sem artigos ou com todas as fontes indisponíveis, a página explica a situação e mostra links dos portais, sem apresentá-los como notícias novas. O antigo noticias.json não é usado automaticamente na prévia com os metas configurados.

O conteúdo diferencia uma conversa de um registro confirmado, tarefa de lembrete, venda de recebimento e gasto de movimentação de estoque. O FAQ explica esses pontos, correções, conexão, uso por áudio, atividades, teste e limites do apoio técnico. Previsão do tempo, relatórios e lembretes são apresentados conforme disponibilidade, sem prometer envio automático para toda tarefa. CTs, treino e desempenho esportivo não aparecem como funcionalidades atuais ou futuras.

As demonstrações usam dados fictícios. Não enviam WhatsApp, não salvam registros e não fazem chamadas à IA.

## Arquivos

- `index.html`: conteúdo e estrutura acessível, com um exemplo inicial legível sem JavaScript.
- `assets/modern.css`: estilos, estados de foco, responsividade e movimento reduzido.
- `assets/navigation.js`: menu com foco contido, âncoras e seções expansíveis.
- `assets/experience.js`: exemplos, atividades, cópia e catálogo de planos.
- `assets/quotes.js` e `assets/news.js`: feeds extraídos da implementação anterior.

Os ícones usam Material Symbols Outlined, incluindo os exemplos interativos, os cartões de planos e os indicadores dos feeds. A fonte é carregada pelo Google Fonts com somente os ícones utilizados. Ao adicionar outro ícone, inclua seu nome em `icon_names` no `index.html`.

## Planos e condições

O catálogo público é consultado em `/api/plans` do backend quando a seção de planos se aproxima da tela. Não exige autenticação e não usa Gemini. Nome, preço, quantidade de números e limite de análises são derivados do catálogo.

O fallback foi conferido em **01/10/2026**: Essencial R$ 29, Starter R$ 49, Team R$ 119 e Business R$ 199 por mês. Business permite **até** cinco números. Quando a consulta falha, o site avisa para conferir os valores na página de contratação. Mantenha o fallback e os cartões iniciais em HTML atualizados caso o catálogo comercial mude.

O catálogo público disponibiliza valores mensais. A landing não calcula preço anual. Os links dos cartões abrem a página de planos, que é responsável pela escolha final e pelo pagamento; a página atual não suporta pré-seleção por código na URL.

O texto do teste segue as condições atuais do produto: 14 dias ou 10 análises, o que acabar primeiro, sem cartão no cadastro e sem cobrança automática ao terminar. Se a configuração do teste mudar, revise o texto na landing.

## Executar e verificar

```powershell
npm run dev
```

Prévia em `http://127.0.0.1:8765/`. Use `LANDING_PORT` para outra porta. O servidor serve apenas o HTML, os feeds e arquivos públicos de `assets`.

```powershell
# Aponte para uma instalação existente do Playwright, caso não esteja no projeto.
$env:PLAYWRIGHT_MODULE = 'caminho/para/node_modules/playwright'
$env:BROWSER_CHANNEL = 'chrome'
npm run test:landing
```

O teste abre um servidor temporário e verifica desktop de 1440 px, tablet de 768 px e celulares de 390 e 320 px. Verifica exemplos, teclado, atividades, planos, falha do catálogo, cópia, menu, FAQ, feeds, âncoras, imagens, erros de JavaScript e transbordamento horizontal. Os catálogos de teste são interceptados; nenhum cadastro, mensagem ou pagamento é enviado. Capturas ficam em `test-artifacts/`, fora do Git.

As mudanças são locais. Publicar a landing no ambiente de hospedagem é uma etapa separada.

## Domínios

A landing usa `https://useaggi.com/` como endereço canônico. Entrar abre `https://app.useaggi.com/`; Criar conta abre `https://app.useaggi.com/cadastro?origin=landing`. Planos, termos e privacidade continuam nas páginas do backend, agora sob `app.useaggi.com`. Tanto os links estáticos quanto os cartões de planos gerados por JavaScript usam o novo domínio. Os feeds públicos de planos e notícias também usam a API desse subdomínio.

A publicação exige configurar o domínio raiz na hospedagem da landing e o subdomínio no Railway. O código e as instruções de DNS, variáveis e Supabase Auth estão em `CampoAI/docs/DOMAINS.md`. Publicar os links novos depois que o app/API estiver disponível com HTTPS no novo domínio.


Escopo atualizado em 11/10/2026: agricultura e criação de animais. A apresentação de equinos trata de identificação, alimentação, pesagens, cuidados e despesas; não oferece CT, treino ou prova.
