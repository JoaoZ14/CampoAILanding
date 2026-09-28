(() => {
  const examples = {
    plantio: {
      user: 'Plantei milho no Talhão Norte hoje.',
      answer: 'Entendi: plantio de milho no Talhão Norte hoje. Vou vincular o registro à propriedade e à safra correspondente.',
      receipt: 'Registro ilustrativo · Talhão Norte'
    },
    gasto: {
      user: 'Gastei R$ 850 com diesel.',
      answer: 'Anotei o gasto de R$ 850 com diesel. Você poderá consultar as despesas da propriedade quando precisar.',
      receipt: 'Registro ilustrativo · Despesa'
    },
    historico: {
      user: 'Quando plantei aquele milho?',
      answer: 'Vou procurar o plantio de milho nos registros da sua propriedade e mostrar a data e o talhão correspondentes.',
      receipt: 'Consulta ilustrativa · Histórico'
    },
    lembrete: {
      user: 'Lembre-me de revisar a bomba amanhã.',
      answer: 'Vou criar o lembrete para amanhã e confirmar o horário com você antes de agendar.',
      receipt: 'Agendamento ilustrativo · Lembrete'
    }
  };

  const buttons = [...document.querySelectorAll('.experience-option')];
  const user = document.getElementById('example-user');
  const answer = document.getElementById('example-answer');
  const receipt = document.getElementById('example-receipt');
  if (!buttons.length || !user || !answer || !receipt) return;

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const example = examples[button.dataset.example];
      if (!example) return;
      buttons.forEach((item) => {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      user.textContent = example.user;
      answer.textContent = example.answer;
      receipt.textContent = example.receipt;
    });
  });
})();
