gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
document.querySelector('.quote').addEventListener('submit', (e) => {
  e.preventDefault();
});

if (!reduceMotion) {
  const lenis = new Lenis();
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 1.2 } });
  tl.from('.header',      { y: -30, opacity: 0, duration: 1 })
    .from('.hero__title', { y: 50, opacity: 0 }, '-=0.6')
    .from('.quote',       { y: 60, opacity: 0 }, '-=0.8');

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