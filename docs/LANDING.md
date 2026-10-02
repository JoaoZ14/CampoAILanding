# Landing AG Assist

A página apresenta o AG Assist como o sistema de controle e a Lida como sua assistente no WhatsApp. As atividades são mostradas como disponíveis, conforme confirmação de ativação em produção.

## Conteúdo e interação

- Proposta principal e acesso ao cadastro ou app.
- Explicação dos dois canais, com a mesma conta.
- Seis exemplos interativos: gastos, tarefas, produção, estoque, histórico e dúvidas.
- Seis grupos que apresentam agricultura, bovinos, equinos, pequenas criações, aquicultura/apicultura e florestas/outras atividades.
- Três passos para começar, com uma primeira mensagem que pode ser copiada.
- Teste gratuito separado dos planos, perguntas frequentes e contato legível.
- Cotações e notícias preservadas como conteúdo opcional, em seções expansíveis.

As demonstrações usam dados fictícios. Não enviam WhatsApp, não salvam registros e não fazem chamadas à IA.

## Arquivos

- `index.html`: conteúdo e estrutura acessível, com um exemplo inicial legível sem JavaScript.
- `assets/modern.css`: estilos, estados de foco, responsividade e movimento reduzido.
- `assets/navigation.js`: menu com foco contido, âncoras e seções expansíveis.
- `assets/experience.js`: exemplos, atividades, cópia e catálogo de planos.
- `assets/quotes.js` e `assets/news.js`: feeds extraídos da implementação anterior.

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
