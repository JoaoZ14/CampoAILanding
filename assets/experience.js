(() => {
  'use strict';
  const examples = {
    gasto: {
      user: '“Lida, registre os R$ 350 de diesel que gastei hoje.”',
      answer: 'O gasto fica registrado na propriedade, com valor, categoria e data. A Lida confirma o que foi salvo.',
      correction: 'Informou o valor errado? Peça: “Corrija esse gasto para R$ 320.”',
      icon: 'payments', title: 'Diesel', value: 'R$ 350,00',
      fields: [['Categoria', 'Combustível'], ['Data', 'Hoje'], ['Propriedade', 'Sítio Boa Vista']],
      receipt: 'Uma despesa para consultar e corrigir.'
    },
    agenda: {
      user: '“Lida, agende a revisão da bomba para amanhã às 9h.”',
      answer: 'A tarefa fica na agenda, com o dia e o horário informados. Se faltar algum detalhe, a Lida pergunta antes de concluir.',
      correction: 'Mudou o plano? Peça: “Mude a revisão da bomba para amanhã às 11h.”',
      icon: 'calendar_today', title: 'Revisar a bomba', value: 'Amanhã, às 9h',
      fields: [['Tipo', 'Tarefa'], ['Situação', 'Pendente'], ['Propriedade', 'Sítio Boa Vista']],
      receipt: 'O compromisso pode ser reagendado.'
    },
    producao: {
      user: '“Lida, registre 20 maços de cebolinha colhidos hoje no Canteiro 3.”',
      answer: 'A colheita fica vinculada ao canteiro e à atividade, com a quantidade e a unidade que você informou.',
      correction: 'Colheu mais depois? Registre a nova colheita. Os lançamentos ficam no histórico.',
      icon: 'eco', title: 'Colheita de cebolinha', value: '20 maços',
      fields: [['Local', 'Canteiro 3'], ['Atividade', 'Horticultura'], ['Data', 'Hoje']],
      receipt: 'Maços não são convertidos para kg ou caixas.'
    },
    estoque: {
      user: '“Lida, quanto tenho da Ração Crescimento no estoque?”',
      answer: 'A Lida consulta o saldo registrado desse item. Entradas e consumos informados mantêm o controle atualizado.',
      correction: 'O saldo representa o que você registrou. Informe também novas compras e consumos.',
      icon: 'inventory_2', title: 'Ração Crescimento', value: '7 kg',
      fields: [['Entradas registradas', '10 kg'], ['Consumo registrado', '3 kg'], ['Saldo disponível', '7 kg']],
      receipt: 'Consulta ao estoque, sem criar uma movimentação.'
    },
    historico: {
      user: '“Lida, mostre as despesas de diesel que registrei.”',
      answer: 'Ela procura as despesas existentes e apresenta o histórico. Você também pode consultar os lançamentos no app.',
      correction: 'Quer corrigir um deles? Indique qual lançamento e o novo valor. Se houver dúvida, a Lida pergunta.',
      icon: 'history', title: 'Despesas de diesel', value: '2 registros',
      fields: [['Lançamento de hoje', 'R$ 350,00'], ['Lançamento anterior', 'R$ 200,00'], ['Propriedade', 'Sítio Boa Vista']],
      receipt: 'Uma consulta aos gastos que já foram salvos.'
    },
    duvida: {
      user: '“Lida, as folhas da minha alface estão amarelando. O que devo observar?”',
      answer: 'A Lida pede contexto e ajuda a organizar o que observar. Você pode enviar fotos para apoiar a conversa.',
      correction: 'Se o problema continuar ou se agravar, procure um agrônomo para avaliar a causa no local.',
      icon: 'chat', title: 'Apoio para sua observação', value: 'Entender primeiro', label: '03 / UM PRÓXIMO PASSO MAIS CLARO',
      fields: [['Onde aparece?', 'Folhas novas ou antigas'], ['Como está a água?', 'Irrigação e drenagem'], ['Desde quando?', 'Início e evolução']],
      receipt: 'Orientação não é diagnóstico nem registro automático.'
    }
  };
  const activityExamples = {
    agricultura: {
      kicker: 'HORTA, LAVOURA E FRUTICULTURA', title: 'Cada área, com sua história.',
      description: 'Guarde o que plantou, colheu e cuidou em cada canteiro, área ou pomar. Consulte depois sem depender da memória.',
      features: ['Plantios e colheitas, inclusive parciais', 'Quantidades com a unidade informada', 'Tarefas, cuidados e despesas vinculadas'],
      message: '“Registre 20 maços de cebolinha colhidos hoje no Canteiro 3.”',
      limit: 'Kg, maços e caixas ficam separados. Nenhuma conversão é presumida.'
    },
    bovinos: {
      kicker: 'GADO DE CORTE E LEITE', title: 'Conheça o histórico do rebanho.',
      description: 'Acompanhe um animal ou um lote. Guarde pesagens, produção de leite, movimentações e os cuidados da rotina.',
      features: ['Pesagens por animal e produção de leite em litros', 'Entradas, saídas e mortes registradas nos lotes', 'Alimentação, ocorrências, tarefas e despesas'],
      message: '“Anote 85 litros de leite na ordenha da manhã do Lote Leiteiro.”',
      limit: 'A ordenha parcial e o total do dia não são somados em duplicidade. Pesagens comparáveis ajudam a acompanhar o ganho de peso por animal.'
    },
    equinos: {
      kicker: 'CAVALOS E CENTROS DE TREINAMENTO', title: 'A rotina de cada cavalo, à mão.',
      description: 'Monte a ficha de cada cavalo e acompanhe cuidados, alimentação e treinos. A memória do CT deixa de depender de mensagens espalhadas.',
      features: ['Treinos com duração e observações por cavalo', 'Passadas com tempo em segundos e penalidades separadas', 'Cuidados, alimentação, agenda e serviços prestados'],
      message: '“Registre 30 minutos de treino da Estrela hoje, com foco em condicionamento.”',
      limit: 'Os tempos e observações compõem seu histórico de treino. Não geram classificação oficial de provas nem prescrição veterinária.'
    },
    criacoes: {
      kicker: 'AVES, SUÍNOS, OVINOS E CAPRINOS', title: 'Organize os cuidados da criação.',
      description: 'Acompanhe grupos ou animais, conforme sua operação. Registre os cuidados do dia e consulte a evolução sem misturar as criações.',
      features: ['Fichas de animais e controle de movimentações dos grupos', 'Coleta de ovos em unidades e pesagens em kg', 'Alimentação, ocorrências, vendas e tarefas'],
      message: '“Anote a coleta de 42 ovos hoje no Galinheiro 1.”',
      limit: 'Uma produção, uma venda e um recebimento são registros diferentes. Cada quantidade mantém sua unidade.'
    },
    agua: {
      kicker: 'AQUICULTURA E APICULTURA', title: 'Viveiros e colmeias bem acompanhados.',
      description: 'Separe os registros por viveiro, lote ou colmeia. Tenha à mão produção, alimentação e o que aconteceu em cada unidade.',
      features: ['Despesca e colheita de mel registradas em kg', 'Alimentação e movimentações dos grupos', 'Cuidados, ocorrências, tarefas e despesas'],
      message: '“Registre 18 kg de mel colhidos hoje na Colmeia 4.”',
      limit: 'Uma despesca em kg não reduz automaticamente a quantidade de peixes do lote. Informe as movimentações de animais separadamente.'
    },
    outras: {
      kicker: 'FLORESTAS E OUTRAS ATIVIDADES RURAIS', title: 'Também cabe o que faz parte da sua lida.',
      description: 'Organize áreas florestais e outras atividades com fichas, tarefas e registros próprios. Comece pelo que precisa acompanhar hoje.',
      features: ['Produção florestal com a unidade informada', 'Tarefas, despesas e ocorrências por atividade', 'Vendas, serviços e recebimentos separados'],
      message: '“Agende a revisão da cerca da Área Norte para sexta às 8h.”',
      limit: 'Receita não é lucro, e um recebimento não é uma nova venda. O controle depende dos registros que você informa.'
    }
  };
  function setText(id, value) { const node = document.getElementById(id); if (node) node.textContent = value; }
  function animate(node) { node.classList.remove('changed'); void node.offsetWidth; node.classList.add('changed'); }
  const exampleButtons = [...document.querySelectorAll('[data-example]')];
  const examplePanel = document.getElementById('example-panel');
  function selectExample(button) {
    const example = examples[button.dataset.example];
    if (!example || !examplePanel) return;
    exampleButtons.forEach((item) => { const active = item === button; item.setAttribute('aria-selected', String(active)); item.tabIndex = active ? 0 : -1; });
    examplePanel.setAttribute('aria-labelledby', button.id);
    ['user', 'answer', 'correction', 'value', 'receipt'].forEach((field) => setText(`example-${field}`, example[field]));
    setText('example-result-title', example.title);
    setText('example-result-label', example.label || '03 / VOCÊ CONFERE NO APP');
    const exampleIcon = document.getElementById('example-icon');
    if (exampleIcon) exampleIcon.textContent = example.icon;
    document.getElementById('example-fields').replaceChildren(...example.fields.map(([label, value]) => {
      const row = document.createElement('div');
      const term = document.createElement('dt');
      const definition = document.createElement('dd');
      term.textContent = label; definition.textContent = value; row.append(term, definition); return row;
    }));
    animate(examplePanel);
  }
  exampleButtons.forEach((button, index) => {
    button.addEventListener('click', () => selectExample(button));
    button.addEventListener('keydown', (event) => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % exampleButtons.length;
      if (event.key === 'ArrowLeft') next = (index + exampleButtons.length - 1) % exampleButtons.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = exampleButtons.length - 1;
      if (next === undefined) return;
      event.preventDefault(); selectExample(exampleButtons[next]); exampleButtons[next].focus();
    });
  });
  const activityButtons = [...document.querySelectorAll('[data-activity]')];
  activityButtons.forEach((button) => button.addEventListener('click', () => {
    const example = activityExamples[button.dataset.activity];
    if (!example) return;
    activityButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    ['kicker', 'title', 'description', 'message', 'limit'].forEach((field) => setText(`activity-${field}`, example[field]));
    document.getElementById('activity-features').replaceChildren(...example.features.map((feature) => { const item = document.createElement('li'); item.textContent = feature; return item; }));
    const detail = document.querySelector('.activity-detail');
    animate(detail);
    if (window.matchMedia('(max-width: 620px)').matches) {
      detail.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }
  }));
  const copyButton = document.getElementById('copy-first-message');
  copyButton?.addEventListener('click', async () => {
    const label = copyButton.querySelector('span');
    const message = document.getElementById('first-message-text');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(message.textContent.trim());
      label.textContent = 'Mensagem copiada';
      setText('copy-status', 'Mensagem copiada. Cole na sua conversa com a Lida.');
      setTimeout(() => { label.textContent = 'Copiar mensagem'; }, 3000);
    } catch {
      const range = document.createRange(); range.selectNodeContents(message);
      window.getSelection()?.removeAllRanges(); window.getSelection()?.addRange(range);
      label.textContent = 'Selecione e copie';
      setText('copy-status', 'A cópia automática não está disponível. A mensagem foi selecionada para você copiar.');
    }
  });
  // Snapshot checked against the public catalog on 2026-10-01; refreshed lazily below.
  const fallbackPlans = [
    { code: 'lite', name: 'Essencial', priceBrl: 29, customerSegment: 'personal', seats: 1, highlight: false, bullets: ['Até 35 análises por mês'] },
    { code: 'basic', name: 'Starter', priceBrl: 49, customerSegment: 'personal', seats: 1, highlight: true, bullets: ['Análises ilimitadas (uso justo)'] },
    { code: 'premium', name: 'Team', priceBrl: 119, customerSegment: 'personal', seats: 3, highlight: false, bullets: [] },
    { code: 'premium', name: 'Business', priceBrl: 199, customerSegment: 'company', seats: 5, highlight: true, bullets: [] }
  ];
  const presentations = {
    lite: { tag: 'PARA COMEÇAR', description: 'Para usar no seu ritmo, com um limite mensal definido.' },
    basic: { tag: 'PARA USAR COM FREQUÊNCIA', description: 'Mais liberdade para as perguntas e tarefas da rotina.' },
    premium: { tag: 'PARA DIVIDIR O USO', description: 'Uma assinatura para quem usa com equipe ou família.' },
    company: { tag: 'PARA SUA EMPRESA', description: 'Cadastro com CNPJ e uma assinatura para a equipe.' }
  };
  const grid = document.getElementById('plans-grid');
  const segments = [...document.querySelectorAll('[data-plan-segment]')];
  const checkoutUrl = 'https://campoai-production-b7c7.up.railway.app/planos';
  const paymentNote = 'A contratação e as opções de pagamento ficam na página de planos. Confira ali os limites e condições finais, incluindo a política de uso justo.';
  let plans = fallbackPlans;
  let segment = 'personal';
  let catalogUnavailable = false;
  function element(tag, className, text) {
    const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node;
  }
  function renderPlans() {
    if (!grid) return;
    grid.dataset.segment = segment;
    segments.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.planSegment === segment)));
    grid.replaceChildren(...plans.filter((plan) => plan.customerSegment === segment).map((plan) => {
      const presentation = presentations[segment === 'company' ? 'company' : plan.code];
      const article = element('article', `plan${plan.highlight ? ' plan-featured' : ''}`);
      article.append(element('span', 'plan-tag', presentation.tag), element('h3', '', plan.name), element('p', 'plan-description', presentation.description));
      const price = element('p', 'price');
      const decimals = Number.isInteger(plan.priceBrl) ? 0 : 2;
      price.append(element('span', '', 'R$'), element('strong', '', plan.priceBrl.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: 2 })), element('span', '', '/mês'));
      const list = element('ul', 'check-list');
      const analysisBullet = plan.bullets.find((bullet) => /análises/i.test(bullet));
      const limit = analysisBullet?.match(/até\s+(\d+)\s+análises/i);
      const bullets = [];
      if (limit) bullets.push(`Até ${limit[1]} análises por mês`);
      else if (analysisBullet && /ilimitad/i.test(analysisBullet)) bullets.push('Análises ilimitadas, com uso justo');
      bullets.push(plan.seats === 1 ? '1 número de WhatsApp' : `Até ${plan.seats} números de WhatsApp`);
      if (segment === 'company') bullets.push('Cadastro e contratação com CNPJ');
      else if (plan.seats > 1) bullets.push('Uma assinatura centralizada');
      bullets.push('Texto, fotos e áudios');
      list.append(...bullets.map((bullet) => element('li', '', bullet)));
      const link = element('a', `btn ${plan.highlight ? 'btn-primary' : 'btn-outline'}`, `Ver ${plan.name}`);
      link.href = checkoutUrl;
      const icon = document.createElement('span');
      icon.className = 'icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = 'arrow_forward';
      link.append(icon);
      article.append(price, list, link); return article;
    }));
    setText('plans-note', catalogUnavailable ? `Não foi possível atualizar os valores agora. Confira o catálogo na página de planos antes de contratar. ${paymentNote}` : paymentNote);
  }
  segments.forEach((button) => button.addEventListener('click', () => { segment = button.dataset.planSegment; renderPlans(); }));
  function validPlan(plan) {
    return plan && ['lite', 'basic', 'premium'].includes(plan.code) && ['personal', 'company'].includes(plan.customerSegment)
      && typeof plan.name === 'string' && plan.name.trim().length > 0 && plan.name.length <= 60
      && Number.isFinite(plan.priceBrl) && plan.priceBrl > 0 && Number.isInteger(plan.seats) && plan.seats > 0 && plan.seats <= 100
      && Array.isArray(plan.bullets) && plan.bullets.every((bullet) => typeof bullet === 'string');
  }
  async function updatePlans() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
      const url = new URL(document.querySelector('meta[name="agassist-plans-json"]')?.content);
      if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Invalid catalog URL');
      const response = await fetch(url.href, { signal: controller.signal, credentials: 'omit' });
      if (!response.ok) throw new Error('Catalog unavailable');
      const catalog = await response.json();
      if (!catalog.ok || catalog.currency !== 'BRL' || !Array.isArray(catalog.plans)) throw new Error('Invalid catalog');
      const verified = catalog.plans.filter(validPlan);
      if (verified.length !== catalog.plans.length || verified.length > 12 || !verified.some((plan) => plan.customerSegment === 'personal') || !verified.some((plan) => plan.customerSegment === 'company')) throw new Error('Incomplete catalog');
      if (verified.some((plan) => plan.period && plan.period !== 'mês')) throw new Error('Unsupported period');
      const order = { lite: 0, basic: 1, premium: 2 };
      plans = verified.sort((a, b) => order[a.code] - order[b.code]); catalogUnavailable = false;
    } catch { catalogUnavailable = true; }
    finally { clearTimeout(timer); renderPlans(); }
  }
  if (grid) {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => { if (!entries.some((entry) => entry.isIntersecting)) return; observer.disconnect(); updatePlans(); }, { rootMargin: '300px' });
      observer.observe(document.getElementById('planos'));
    } else updatePlans();
  }
})();
