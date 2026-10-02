(() => {
  const toggle = document.getElementById('menu-toggle');
  const menu = document.getElementById('menu');
  if (!toggle || !menu) return;
  const background = [...document.querySelectorAll('main, footer, .logo, .header-login, .header-cta, .header-nav-desktop, .skip-link')];
  const previousInert = new Map();
  let menuOpen = false;
  let savedScroll = 0;
  function setMenu(open, restoreFocus = true) {
    if (open === menuOpen) return;
    menuOpen = open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menu.classList.toggle('active', open);
    menu.setAttribute('aria-hidden', String(!open));
    menu.inert = !open;
    if (open) {
      savedScroll = window.scrollY;
      background.forEach((element) => { previousInert.set(element, element.inert); element.inert = true; });
      document.body.style.position = 'fixed';
      document.body.style.top = `-${savedScroll}px`;
      document.body.style.width = '100%';
      menu.querySelector('.nav-sheet a')?.focus({ preventScroll: true });
    } else {
      background.forEach((element) => { element.inert = previousInert.get(element) || false; });
      previousInert.clear();
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      const behavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, savedScroll);
      document.documentElement.style.scrollBehavior = behavior;
      if (restoreFocus) toggle.focus({ preventScroll: true });
    }
  }
  toggle.addEventListener('click', () => setMenu(!menuOpen));
  menu.querySelector('.nav-scrim').addEventListener('click', () => setMenu(false));
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false, false)));
  document.addEventListener('keydown', (event) => {
    if (!menuOpen) return;
    if (event.key === 'Escape') { event.preventDefault(); setMenu(false); }
    if (event.key !== 'Tab') return;
    const focusable = [toggle, ...menu.querySelectorAll('.nav-sheet a')];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  const desktop = window.matchMedia('(min-width: 1101px)');
  desktop.addEventListener('change', () => { if (desktop.matches) setMenu(false, false); });
  function openResource(hash, scroll = false) {
    if (!hash || !/^#[\w-]+$/.test(hash)) return;
    const target = document.getElementById(hash.slice(1));
    if (!target) return;
    if (target.matches('details.resource')) target.open = true;
    if (scroll) target.scrollIntoView({ block: 'start' });
  }
  document.querySelectorAll('a[href^="#"]').forEach((link) => link.addEventListener('click', () => {
    const hash = link.getAttribute('href');
    openResource(hash);
    if (link.closest('#menu')) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    }
  }));
  window.addEventListener('hashchange', () => openResource(window.location.hash));
  if (window.location.hash) requestAnimationFrame(() => openResource(window.location.hash, true));
  document.querySelectorAll('details.resource').forEach((detail) => detail.addEventListener('toggle', () => {
    if (detail.open) requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
  }));
  const navLinks = [...document.querySelectorAll('[data-nav-section]')];
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      const active = entries.find((entry) => entry.isIntersecting);
      if (!active) return;
      navLinks.forEach((link) => {
        if (link.dataset.navSection === active.target.id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-20% 0px -60% 0px' });
    ['experiencia', 'atividades', 'como', 'planos'].forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }
  const year = document.getElementById('current-year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
