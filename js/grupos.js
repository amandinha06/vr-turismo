
(async function () {
  const lista = document.getElementById('trips-grid');
  const detalhe = document.getElementById('trip');

  if (!lista && !detalhe) return;

  const reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  const ALCANCE = {
    nacional: 'Brasil',
    internacional: 'Exterior'
  };

  const CATEGORIAS = {
    pacote: 'Pacote',
    viagem: 'Voo + hotel',
    grupo: 'Viagem em grupo',
    cruzeiro: 'Cruzeiro',
    intercambio: 'Intercâmbio'
  };

  const POLITICA_PADRAO = [
    'Cancelamento até 60 dias antes da saída: reembolso dos valores pagos, descontadas as despesas já repassadas a fornecedores.',
    'De 59 a 30 dias antes da saída: retenção de 30% do valor total.',
    'Com menos de 30 dias: retenção de até 100%, conforme as regras dos fornecedores.',
    'Alterações de data ou de nome estão sujeitas à disponibilidade e às regras de cada fornecedor.',
    'Se o número mínimo de participantes não for atingido, a VR Turismo avisa o grupo e devolve os valores pagos.',
    'A política completa consta no contrato de contratação.'
  ];

  const brl = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  });

  const toDate = (iso) => new Date(`${iso}T12:00:00`);

  const dataBR = (iso) =>
    iso ? iso.split('-').reverse().join('/') : 'A consultar';

  const dataLonga = (iso) =>
    iso
      ? toDate(iso).toLocaleDateString('pt-BR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      : 'A consultar';

  const ul = (itens = []) => {
    if (!Array.isArray(itens) || !itens.length) {
      return '<p>Consulte a equipe da VR Turismo para mais informações.</p>';
    }

    return `<ul>${itens.map((item) => `<li>${item}</li>`).join('')}</ul>`;
  };

  function periodo(ini, fim) {
    if (!ini || !fim) return 'Datas a consultar';

    const a = toDate(ini);
    const b = toDate(fim);

    const dia = (d) => String(d.getDate()).padStart(2, '0');

    const mes = (d) =>
      d.toLocaleDateString('pt-BR', { month: 'long' });

    if (a.getMonth() === b.getMonth()) {
      return `${dia(a)} a ${dia(b)} de ${mes(b)} de ${b.getFullYear()}`;
    }

    return `${dia(a)} de ${mes(a)} a ${dia(b)} de ${mes(b)} de ${b.getFullYear()}`;
  }

  function semFoto(container) {
    if (!container) return;

    container.querySelectorAll('img').forEach((img) => {
      img.addEventListener('error', () => {
        img.style.display = 'none';
      }, { once: true });
    });
  }

  function revelar(elementos) {
    if (
      reduceMotion ||
      !elementos.length ||
      typeof gsap === 'undefined' ||
      typeof ScrollTrigger === 'undefined'
    ) return;

    gsap.set(elementos, { opacity: 0, y: 50 });

    ScrollTrigger.batch(elementos, {
      start: 'top 92%',
      once: true,
      onEnter: (lote) => gsap.to(lote, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.1,
        overwrite: true
      })
    });
  }

  async function carregarJson(caminho) {
    try {
      const resposta = await fetch(caminho);

      if (!resposta.ok) {
        throw new Error(`HTTP ${resposta.status}`);
      }

      return await resposta.json();

    } catch (erro) {
      console.error(`Não foi possível carregar ${caminho}:`, erro);
      return [];
    }
  }

  /* ---------- CARTÕES DE VIAGENS EM GRUPO ---------- */

  function cardViagem(v) {
    return `
      <article class="trip">

        <div class="trip__media">
          <img src="${v.imagem || ''}" alt="${v.titulo || 'Viagem em grupo'}" loading="lazy">

          <div class="trip__badges">
            <span class="badge">${ALCANCE[v.alcance] || ''}</span>
            <span class="badge badge--green">${v.vagas || ''}</span>
          </div>
        </div>

        <div class="trip__body">

          <h3 class="trip__title">${v.titulo || ''}</h3>

          <p class="trip__resumo">${v.resumo || ''}</p>

          <ul class="trip__facts">
            <li><span>Datas</span>${periodo(v.saida, v.retorno)}</li>
            <li><span>Duração</span>${v.duracao || 'A consultar'}</li>
            <li><span>Embarque</span>${v.embarque || 'A consultar'}</li>
            <li><span>Acompanhamento</span>${v.acompanhamento?.resumo || 'Consulte a equipe'}</li>
          </ul>

          <div class="trip__foot">

            <p class="offer__price">
              A partir de
              <strong>${brl.format(Number(v.preco) || 0)}</strong>
              por pessoa
            </p>

            <a class="btn btn--sm" href="viagem.html?id=${encodeURIComponent(v.id)}">
              Ver detalhes da viagem
            </a>

          </div>

        </div>
      </article>
    `;
  }

  /* ---------- DETALHES DE VIAGEM EM GRUPO ---------- */

  function paginaViagem(v) {
    const params = new URLSearchParams({
      oferta: v.titulo || '',
      destino: v.destino || '',
      tipo: 'Em grupo'
    });

    const roteiro = Array.isArray(v.roteiro) ? v.roteiro : [];
    const acompanhamento = v.acompanhamento || {};

    return `
      <section class="page-hero page-hero--short trip-hero">

        <div class="page-hero__img">
          <img src="${v.imagem || ''}" alt="${v.titulo || ''}">
        </div>

        <div class="page-hero__content">
          <p class="eyebrow">
            Viagem em grupo · ${ALCANCE[v.alcance] || ''}
          </p>

          <h1 class="page-hero__title">${v.titulo || ''}</h1>

          <p class="page-hero__text">${v.resumo || ''}</p>
        </div>

      </section>

      <section class="trip-facts" aria-label="Resumo da viagem">
        <div><span>Saída</span>${dataLonga(v.saida)}</div>
        <div><span>Retorno</span>${dataLonga(v.retorno)}</div>
        <div><span>Duração</span>${v.duracao || 'A consultar'}</div>
        <div><span>Ponto de embarque</span>${v.embarque || 'A consultar'}</div>
      </section>

      <div class="trip-layout">

        <div class="trip-main">

          <section class="trip-block">
            <h2>Sobre a viagem</h2>
            <p>${v.descricao || v.resumo || ''}</p>
          </section>

          <section class="trip-block">
            <h2>Roteiro</h2>

            ${
              roteiro.length
                ? `
                  <ol class="trip-days">
                    ${roteiro.map((d) => `
                      <li>
                        <small>${d.dia || ''}</small>
                        <strong>${d.titulo || ''}</strong>
                        ${d.texto || ''}
                      </li>
                    `).join('')}
                  </ol>
                `
                : '<p>Consulte a equipe para conhecer o roteiro completo.</p>'
            }

          </section>

          <section class="trip-block">
            <h2>O que está incluído</h2>

            <div class="trip-cols">
              <div>
                <h3>Inclui</h3>
                ${ul(v.inclui)}
              </div>

              <div>
                <h3>Não inclui</h3>
                ${ul(v.naoInclui)}
              </div>
            </div>
          </section>

          <section class="trip-block">
            <h2>Documentação e requisitos</h2>
            ${ul(v.documentacao)}
          </section>

          ${
            v.acessibilidade
              ? `
                <section class="trip-block">
                  <h2>Acessibilidade</h2>
                  <p>${v.acessibilidade}</p>
                </section>
              `
              : ''
          }

          <section class="trip-block">
            <h2>Acompanhamento</h2>
            <p>
              ${acompanhamento.detalhes || acompanhamento.resumo || 'Consulte a equipe da VR Turismo.'}
            </p>
          </section>

          <section class="trip-block">
            <h2>Cancelamento, alteração e reembolso</h2>
            ${ul(v.cancelamento || POLITICA_PADRAO)}
          </section>

        </div>

        <aside class="trip-side">

          <p class="offer__price">
            A partir de
            <strong>${brl.format(Number(v.preco) || 0)}</strong>
            por pessoa
          </p>

          <ul class="trip-side__list">
            <li><span>Acomodação</span>${v.acomodacao || 'A consultar'}</li>
            <li><span>Pagamento</span>${v.pagamento || 'A consultar'}</li>

            ${
              v.minimo
                ? `<li><span>Participantes</span>Saída confirmada com no mínimo ${v.minimo} pessoas</li>`
                : ''
            }

            <li><span>Vagas</span>${v.vagas || 'A consultar'}</li>
            <li><span>Validade da oferta</span>Até ${dataBR(v.validade)}</li>
          </ul>

          <p class="trip-side__aviso">
            Valor e disponibilidade devem ser confirmados antes da reserva.
          </p>

          <a class="btn" href="orcamento.html?${params.toString()}">
            Tenho interesse nesta viagem
          </a>

          <a class="btn btn--ghost" href="viagens-em-grupo.html#saidas">
            Ver outras viagens
          </a>

        </aside>
      </div>
    `;
  }

  /* ---------- DETALHES DAS OFERTAS ---------- */

  function paginaOferta(o) {
    const params = new URLSearchParams({
      oferta: o.titulo || '',
      destino: o.destino || ''
    });

    if (o.categoria === 'grupo') {
      params.set('tipo', 'Em grupo');
    } else if (o.categoria === 'cruzeiro') {
      params.set('tipo', 'Cruzeiro');
    } else if (o.categoria === 'intercambio') {
      params.set('tipo', 'Intercâmbio');
    }

    return `
      <section class="page-hero page-hero--short trip-hero">

        <div class="page-hero__img">
          <img src="${o.imagem || ''}" alt="${o.destino || o.titulo || ''}">
        </div>

        <div class="page-hero__content">
          <p class="eyebrow">
            ${CATEGORIAS[o.categoria] || 'Oferta'} · ${ALCANCE[o.alcance] || ''}
          </p>

          <h1 class="page-hero__title">${o.titulo || ''}</h1>

          <p class="page-hero__text">${o.destino || ''}</p>
        </div>

      </section>

      <section class="trip-facts" aria-label="Resumo da oferta">
        <div><span>Destino</span>${o.destino || 'A consultar'}</div>
        <div><span>Período</span>${o.periodo || 'A consultar'}</div>
        <div><span>Duração</span>${o.duracao || 'A consultar'}</div>
        <div><span>Categoria</span>${CATEGORIAS[o.categoria] || 'Oferta'}</div>
      </section>

      <div class="trip-layout">

        <div class="trip-main">

          <section class="trip-block">
            <h2>Sobre esta viagem</h2>

            <p>
              Confira as informações da oferta para ${o.destino || 'este destino'}.
              A equipe da VR Turismo pode ajudar você a esclarecer dúvidas
              e planejar sua viagem.
            </p>
          </section>

          <section class="trip-block">
            <h2>O que está incluído</h2>

            <div class="trip-cols">
              <div>
                <h3>Inclui</h3>
                ${ul(o.inclui)}
              </div>

              <div>
                <h3>Não inclui</h3>
                ${ul(o.naoInclui)}
              </div>
            </div>
          </section>

          <section class="trip-block">
            <h2>Condições da oferta</h2>

            <p><strong>Pagamento:</strong> ${o.pagamento || 'Consulte a equipe'}</p>

            <p><strong>Validade:</strong> ${dataBR(o.validade)}</p>

            <p>
              <strong>Condições:</strong>
              ${o.condicoes || 'Sujeito à disponibilidade. Consulte a equipe da VR Turismo.'}
            </p>
          </section>

        </div>

        <aside class="trip-side">

          <p class="offer__price">
            A partir de
            <strong>${brl.format(Number(o.preco) || 0)}</strong>
            por pessoa
          </p>

          <ul class="trip-side__list">
            <li><span>Destino</span>${o.destino || 'A consultar'}</li>
            <li><span>Período</span>${o.periodo || 'A consultar'}</li>
            <li><span>Duração</span>${o.duracao || 'A consultar'}</li>
            <li><span>Pagamento</span>${o.pagamento || 'A consultar'}</li>
          </ul>

          <p class="trip-side__aviso">
            Preço e disponibilidade sujeitos à confirmação no momento da reserva.
          </p>

          <a class="btn" href="orcamento.html?${params.toString()}">
            Tenho interesse nesta oferta
          </a>

          <a class="btn btn--ghost" href="ofertas.html">
            Ver outras ofertas
          </a>

        </aside>

      </div>
    `;
  }

  /* ---------- CARREGAMENTO DAS PÁGINAS ---------- */

  if (lista) {
    const viagens = await carregarJson('data/viagens-em-grupo.json');

    if (!viagens.length) {
      lista.innerHTML = `
        <p class="trip-loading">
          Não foi possível carregar as próximas saídas.
          Tente novamente em instantes.
        </p>
      `;
      return;
    }

    lista.innerHTML = viagens.map(cardViagem).join('');

    semFoto(lista);
    revelar(lista.querySelectorAll('.trip'));
  }

  if (detalhe) {
    const id = new URLSearchParams(location.search).get('id');

    if (!id) {
      detalhe.innerHTML = `
        <div class="trip-loading">
          <p>Nenhuma viagem foi selecionada.</p>
          <a class="btn" href="ofertas.html">Ver ofertas</a>
        </div>
      `;
      return;
    }

    // Busca nos dois arquivos JSON
    const [viagens, ofertas] = await Promise.all([
      carregarJson('data/viagens-em-grupo.json'),
      carregarJson('data/ofertas.json')
    ]);

    const viagem = viagens.find(
      (item) => String(item.id) === String(id)
    );

    const oferta = ofertas.find(
      (item) => String(item.id) === String(id)
    );

    if (viagem) {
      document.title = `${viagem.titulo} | VR Turismo`;
      detalhe.innerHTML = paginaViagem(viagem);

    } else if (oferta) {
      document.title = `${oferta.titulo} | VR Turismo`;
      detalhe.innerHTML = paginaOferta(oferta);

    } else {
      detalhe.innerHTML = `
        <div class="trip-loading">
          <p>Não encontramos essa viagem.</p>
          <a class="btn" href="ofertas.html">
            Ver todas as ofertas
          </a>
        </div>
      `;
      return;
    }

    semFoto(detalhe);

    if (!reduceMotion && typeof gsap !== 'undefined') {
      gsap.from('.trip-hero .page-hero__content > *', {
        y: 40,
        opacity: 0,
        duration: 1.1,
        ease: 'power3.out',
        stagger: 0.12
      });
    }

    revelar(detalhe.querySelectorAll('.trip-block'));
  }

  window.addEventListener('load', () => {
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh();
    }
  });

})();
