(async function () {
  // true: esconde automaticamente as ofertas com validade vencida (a documentação pede isso no site real).
  // Deixei false para o protótipo não ficar vazio quando as datas fictícias passarem.
  const OCULTAR_VENCIDAS = false;

  const grid = document.getElementById('offers-grid');
  const count = document.getElementById('offers-count');
  const empty = document.getElementById('offers-empty');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const CATEGORIAS = { pacote: 'Pacote', viagem: 'Voo + hotel', grupo: 'Viagem em grupo', cruzeiro: 'Cruzeiro', intercambio: 'Intercâmbio' };
  const ALCANCE = { nacional: 'Brasil', internacional: 'Exterior' };
  const TIPO_ORCAMENTO = { grupo: 'Em grupo', cruzeiro: 'Cruzeiro', intercambio: 'Intercâmbio' };

  const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  const dataBR = (iso) => iso.split('-').reverse().join('/');
  const ul = (itens) => `<ul>${itens.map((i) => `<li>${i}</li>`).join('')}</ul>`;

  /* ---------- Carrega os dados ---------- */
  let ofertas = [];
  try {
    const res = await fetch('data/ofertas.json');
    if (!res.ok) throw new Error(res.status);
    ofertas = await res.json();
  } catch (err) {
    console.error('Não consegui carregar data/ofertas.json', err);
    grid.innerHTML = '<p>Não foi possível carregar as ofertas agora. Tente novamente em instantes.</p>';
    return;
  }

  const hoje = new Date().toLocaleDateString('sv-SE');  // AAAA-MM-DD no horário local
  if (OCULTAR_VENCIDAS) ofertas = ofertas.filter((o) => o.validade >= hoje);

  /* ---------- Monta um cartão ---------- */
  
function card(o) {
  const params = new URLSearchParams({
    oferta: o.titulo,
    destino: o.destino
  });

  if (TIPO_ORCAMENTO[o.categoria]) {
    params.set('tipo', TIPO_ORCAMENTO[o.categoria]);
  }

  const detalhes = new URLSearchParams({
    id: o.id
  });

  return `
    <article class="offer">

      <div class="offer__media">
        <img src="${o.imagem}" alt="${o.destino}" loading="lazy">
        <span class="offer__badge">${ALCANCE[o.alcance]}</span>
      </div>

      <div class="offer__body">

        <span class="card__tag">${CATEGORIAS[o.categoria]}</span>

        <h3 class="offer__title">${o.titulo}</h3>

        <ul class="offer__meta">
          <li><span>Período</span>${o.periodo}</li>
          <li><span>Duração</span>${o.duracao}</li>
        </ul>

        <p class="offer__price">
          A partir de<strong>${brl.format(o.preco)}</strong>por pessoa
        </p>

        <a class="btn btn--ghost"
           href="viagem.html?${detalhes.toString()}">
          Ver detalhes da viagem
        </a>

        <a class="btn"
           href="orcamento.html?${params.toString()}">
          Tenho interesse nesta oferta
        </a>

      </div>
    </article>
  `;
}


  /* ---------- Animação dos cartões ao rolar ---------- */
  let triggers = [];
  function animar() {
    triggers.forEach((t) => t.kill());
    triggers = [];
    const cards = grid.querySelectorAll('.offer');
    if (reduceMotion || !cards.length) return;

    gsap.set(cards, { opacity: 0, y: 50 });
    triggers = ScrollTrigger.batch(cards, {
      start: 'top 92%',
      once: true,
      onEnter: (lote) => gsap.to(lote, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.1, overwrite: true })
    });
  }

  /* ---------- Filtros ---------- */
  const filtros = { alcance: 'todos', categoria: 'todas' };

  function render() {
    const visiveis = ofertas.filter((o) =>
      (filtros.alcance === 'todos' || o.alcance === filtros.alcance) &&
      (filtros.categoria === 'todas' || o.categoria === filtros.categoria)
    );

    grid.innerHTML = visiveis.map(card).join('');

    count.textContent = visiveis.length === 1 ? '1 oferta encontrada' : `${visiveis.length} ofertas encontradas`;
    empty.hidden = visiveis.length > 0;
    animar();
  }

  document.querySelectorAll('.filter').forEach((btn) => {
    btn.addEventListener('click', () => {
      const { grupo, valor } = btn.dataset;
      filtros[grupo] = valor;
      document.querySelectorAll(`.filter[data-grupo="${grupo}"]`).forEach((b) => {
        const ativo = b === btn;
        b.classList.toggle('is-on', ativo);
        b.setAttribute('aria-pressed', ativo);
      });
      render();
    });
  });

  document.getElementById('offers-reset').addEventListener('click', () => {
    document.querySelector('.filter[data-valor="todos"]').click();
    document.querySelector('.filter[data-valor="todas"]').click();
  });

  render();
  window.addEventListener('load', () => ScrollTrigger.refresh());  // recalcula depois que as fotos carregam
})();