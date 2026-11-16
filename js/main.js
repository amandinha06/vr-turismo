gsap.registerPlugin(ScrollTrigger);

// >>> Troque pelo número oficial: código do país + DDD + número, só dígitos (ex.: 5524999999999)
const WHATSAPP = '5500000000000';

/* ---------- Carrega um componente no lugar do marcador ---------- */
async function loadComponent(name) {
  const slot = document.querySelector(`[data-include="${name}"]`);
  if (!slot) return;
  try {
    const res = await fetch(`components/${name}.html`);
    if (!res.ok) throw new Error(res.status);
    slot.outerHTML = await res.text();
  } catch (err) {
    console.error(`Não consegui carregar components/${name}.html`, err);
  }
}

function init() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('.header');
  let lenis = null;

  const norm = (path) => path.replace(/index\.html$/, '');
  const formatDate = (iso) => (iso ? iso.split('-').reverse().join('/') : 'a definir');

  // Marca no menu a página atual
  const menuLinks = document.querySelectorAll('.header__cats a');
  menuLinks.forEach((a) => a.classList.remove('is-active'));  // limpa o que estiver fixo no HTML

  menuLinks.forEach((a) => {
    const href = a.getAttribute('href');
    if (!href || href === '#') return;
    const url = new URL(a.href, location.href);
    if (url.hash) return;
    if (norm(url.pathname) === norm(location.pathname)) a.classList.add('is-active');
  });

  // Links do WhatsApp
  const greeting = 'Olá, VR Turismo! Gostaria de falar com a equipe.';
  document.querySelectorAll('[data-whats]').forEach((a) => {
    a.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(greeting)}`;
  });

  /* ---------- Popup com a mensagem do WhatsApp (usado pelos formulários) ---------- */
  const modal = document.getElementById('modal');
  const modalMsg = document.getElementById('modal-msg');
  const modalSend = document.getElementById('modal-send');

  function openWhatsModal(message) {
    modalMsg.textContent = message;
    modalSend.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
    modal.showModal();
    if (lenis) lenis.stop();
  }

  if (modal) {
    modal.addEventListener('close', () => { if (lenis) lenis.start(); });
    modal.querySelectorAll('[data-close]').forEach((btn) => btn.addEventListener('click', () => modal.close()));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });
  }

  /* ---------- Formulário rápido da home ---------- */
  const quick = document.querySelector('.quote');
  if (quick) {
    quick.elements.ida.addEventListener('change', (e) => { quick.elements.volta.min = e.target.value; });

    quick.addEventListener('submit', (e) => {
      e.preventDefault();
      const f = quick.elements;
      openWhatsModal([
        'Olá, VR Turismo! Gostaria de solicitar um orçamento.',
        '',
        `Destino: ${f.destino.value.trim() || 'a definir'}`,
        `Ida: ${formatDate(f.ida.value)}`,
        `Volta: ${formatDate(f.volta.value)}`,
        `Viajantes: ${f.viajantes.value || '1'}`,
        '',
        'Aguardo o contato. Obrigado(a)!'
      ].join('\n'));
    });
  }

  /* ---------- Formulário completo (orcamento.html) ---------- */
  const budget = document.getElementById('budget-form');
  if (budget) {
    const f = budget.elements;
    const val = (name) => f[name].value.trim();

        // Veio de uma oferta? Preenche destino, tipo de viagem e mensagem
    const params = new URLSearchParams(location.search);
    if (params.get('oferta')) {
      if (params.get('destino')) f.destino.value = params.get('destino');
      const tipoParam = params.get('tipo');
      if (tipoParam) {
        const radio = budget.querySelector(`input[name="tipo"][value="${tipoParam}"]`);
        if (radio) radio.checked = true;
      }
      f.mensagem.value = `Tenho interesse na oferta "${params.get('oferta')}".`;
    }

    f.ida.addEventListener('change', (e) => { f.volta.min = e.target.value; });

    budget.addEventListener('submit', (e) => {
      e.preventDefault();  // a validação nativa (campos obrigatórios) roda antes deste evento

      const tipo = budget.querySelector('input[name="tipo"]:checked');
      const servicos = [...budget.querySelectorAll('input[name="servicos"]:checked')].map((c) => c.value);

      const linhas = [
        'Olá, VR Turismo! Gostaria de solicitar um orçamento.',
        '',
        'CONTATO',
        `Nome: ${val('nome')}`,
        ...(val('email') ? [`E-mail: ${val('email')}`] : []),
        `WhatsApp/telefone: ${val('telefone')}`,
        '',
        'VIAGEM',
        `Destino: ${val('destino') || 'a definir'}`,
        `Ida (aprox.): ${formatDate(f.ida.value)}`,
        `Volta (aprox.): ${formatDate(f.volta.value)}`,
        ...(tipo ? [`Tipo de viagem: ${tipo.value}`] : []),
        ...(f.orcamento.value ? [`Faixa de orçamento: ${f.orcamento.value}`] : []),
        '',
        'VIAJANTES',
        `Adultos: ${f.adultos.value || 1}`,
        `Crianças: ${f.criancas.value || 0}`,
        ...(val('idades') ? [`Idades/faixas etárias: ${val('idades')}`] : [])
      ];

      if (servicos.length) linhas.push('', 'SERVIÇOS DE INTERESSE', ...servicos.map((s) => `- ${s}`));
      if (val('mensagem')) linhas.push('', 'MENSAGEM', val('mensagem'));
      linhas.push('', 'Aguardo o contato. Obrigado(a)!');

      openWhatsModal(linhas.join('\n'));
    });
  }

  /* ---------- Links para uma seção da mesma página ---------- */
  document.querySelectorAll('a[href*="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const url = new URL(link.href, location.href);
      if (!url.hash || url.hash.length < 2) return;
      if (norm(url.pathname) !== norm(location.pathname)) return;
      const target = document.querySelector(url.hash);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -header.offsetHeight });
      else target.scrollIntoView();
    });
  });

  // Se a URL tem #seção (vindo de outra página), vai até ela depois do header carregar
  if (location.hash) {
    const alvo = document.querySelector(location.hash);
    if (alvo) alvo.scrollIntoView();
  }

  /* ---------- Animações ---------- */
  if (!reduceMotion) {
    lenis = new Lenis();
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 1.2 } });
    tl.from('.header',     { y: -30, opacity: 0, duration: 1 })
      .from('[data-hero]', { y: 50, opacity: 0, stagger: 0.15 }, '-=0.6');

    gsap.utils.toArray('.reveal').forEach((el, i) => {
      gsap.from(el, {
        y: 60,
        opacity: 0,
        duration: 1.2,
        delay: (i % 3) * 0.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });
  }
}

Promise.all([loadComponent('header'), loadComponent('footer')]).then(init);