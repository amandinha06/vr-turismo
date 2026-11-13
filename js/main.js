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
    slot.outerHTML = await res.text();  // troca o marcador pelo conteúdo (sem div sobrando)
  } catch (err) {
    console.error(`Não consegui carregar components/${name}.html`, err);
  }
}

/* ---------- Tudo que depende da página já montada ---------- */
function init() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('.header');
  let lenis = null;

  // "index.html" e "/" são a mesma página
  const norm = (path) => path.replace(/index\.html$/, '');

  // Marca no menu a página em que você está
  document.querySelectorAll('.header__cats a').forEach((a) => {
    if (a.getAttribute('href') === '#') return;
    const url = new URL(a.href, location.href);
    if (!url.hash && norm(url.pathname) === norm(location.pathname)) {
      a.classList.add('is-active');
    }
  });

  // Links do WhatsApp
  const greeting = 'Olá, VR Turismo! Gostaria de falar com a equipe.';
  document.querySelectorAll('[data-whats]').forEach((a) => {
    a.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(greeting)}`;
  });

  // Formulário de orçamento (só existe na home)
  const form = document.querySelector('.quote');
  if (form) {
    const modal = document.getElementById('modal');
    const modalMsg = document.getElementById('modal-msg');
    const modalSend = document.getElementById('modal-send');

    const formatDate = (iso) => (iso ? iso.split('-').reverse().join('/') : 'a definir');

    form.elements.ida.addEventListener('change', (e) => {
      form.elements.volta.min = e.target.value;
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const destino   = form.elements.destino.value.trim() || 'a definir';
      const ida       = formatDate(form.elements.ida.value);
      const volta     = formatDate(form.elements.volta.value);
      const viajantes = form.elements.viajantes.value || '1';

      const message = [
        'Olá, VR Turismo! Gostaria de solicitar um orçamento.',
        '',
        `Destino: ${destino}`,
        `Ida: ${ida}`,
        `Volta: ${volta}`,
        `Viajantes: ${viajantes}`,
        '',
        'Aguardo o contato. Obrigado(a)!'
      ].join('\n');

      modalMsg.textContent = message;
      modalSend.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;

      modal.showModal();
      if (lenis) lenis.stop();
    });

    modal.addEventListener('close', () => { if (lenis) lenis.start(); });
    modal.querySelectorAll('[data-close]').forEach((btn) => btn.addEventListener('click', () => modal.close()));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });
  }

  // Links para uma seção da MESMA página (#orcamento ou index.html#orcamento estando na home)
  document.querySelectorAll('a[href*="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const url = new URL(link.href, location.href);
      if (!url.hash || url.hash.length < 2) return;
      if (norm(url.pathname) !== norm(location.pathname)) return;  // é outra página: segue normal
      const target = document.querySelector(url.hash);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -header.offsetHeight });
      else target.scrollIntoView();
    });
  });

  // Animações
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

/* ---------- Ordem: carrega header e footer, depois inicia o resto ---------- */
Promise.all([loadComponent('header'), loadComponent('footer')]).then(init);