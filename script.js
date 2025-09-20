/* =========================
   Corais de Trancoso - script.js
   Responsivo, acessível e estável (PC + Celular)
   ========================= */

// Helpers
const $  = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

// Debounce simples
const debounce = (fn, delay=150) => {
  let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), delay); };
};

// =========================
// HEADER: carrossel fade
// =========================
(function headerCarousel(){
  const imgs = $$('.carousel-background img');
  if (!imgs.length) return;

  let idx = 0;
  let timer = null;
  const DURATION = 4000;

  // Garantir que as imagens sempre cubram toda a área
  imgs.forEach(img => {
    img.style.objectFit = 'cover';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.opacity = '0';
    img.style.transition = 'opacity .8s ease';
    img.decoding = 'async';
    img.loading = 'eager';
  });
  imgs[0].style.opacity = '1';

  const next = () => {
    imgs[idx].style.opacity = '0';
    idx = (idx + 1) % imgs.length;
    imgs[idx].style.opacity = '1';
  };

  const start = () => { stop(); timer = setInterval(next, DURATION); };
  const stop  = () => { if (timer) clearInterval(timer); };

  start();

  // Pausa no hover (desktop)
  const container = $('.carousel-container');
  if (container){
    on(container, 'mouseenter', stop);
    on(container, 'mouseleave', start);
  }

  // Ajuste em redimensionamento para prevenir “pulos”
  on(window, 'resize', debounce(()=>{
    imgs.forEach(img => { img.style.height = '100%'; });
  }, 120));
})();


// =========================
// DESTINOS: carrossel com dots/teclas/swipe
// =========================
(function destinosCarousel(){
  const wrap = $('.praia-carousel');
  const slides = $$('.destino-slide', wrap);
  const prev = $('.prev', wrap);
  const next = $('.next', wrap);
  const dotsBox = $('.dots-container');
  if (!wrap || !slides.length || !prev || !next || !dotsBox) return;

  let current = 0;
  let auto = null;
  const AUTO_MS = 5000;

  // Configuração visual segura
  slides.forEach((s, i) => {
    const img = $('img', s);
    if (img){
      img.style.objectFit = 'cover';
      img.style.width = '100%';
      img.style.height = '100%';
      img.decoding = 'async';
      img.loading = i === 0 ? 'eager' : 'lazy';
    }
    s.style.display = i === 0 ? 'block' : 'none';
    s.style.opacity = i === 0 ? '1' : '0';
    s.style.transition = 'opacity .6s ease';
  });

  // Dots
  dotsBox.innerHTML = '';
  slides.forEach((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `Ir ao slide ${i+1}`);
    if (i === 0) b.classList.add('active');
    on(b, 'click', () => { show(i); resetAuto(); });
    dotsBox.appendChild(b);
  });
  const dots = $$('button', dotsBox);

  function show(i){
    if (i === current) return;
    slides[current].style.opacity = '0';
    setTimeout(()=>{ slides[current].style.display = 'none'; }, 600);

    current = (i + slides.length) % slides.length;
    slides[current].style.display = 'block';
    requestAnimationFrame(()=>{ slides[current].style.opacity = '1'; });

    dots.forEach(d => d.classList.remove('active'));
    dots[current].classList.add('active');
  }

  const goNext = () => show(current + 1);
  const goPrev = () => show(current - 1);

  on(next, 'click', ()=>{ goNext(); resetAuto(); });
  on(prev, 'click', ()=>{ goPrev(); resetAuto(); });

  // Teclado (acessibilidade)
  on(document, 'keydown', (e)=>{
    if (!isInViewport(wrap)) return;
    if (e.key === 'ArrowRight') { goNext(); resetAuto(); }
    if (e.key === 'ArrowLeft')  { goPrev(); resetAuto(); }
  });

  // Swipe (touch)
  let startX = 0, swiping = false;
  on(wrap, 'touchstart', (e)=>{ startX = e.touches[0].clientX; swiping = true; stopAuto(); }, {passive:true});
  on(wrap, 'touchmove',  ()=>{}, {passive:true});
  on(wrap, 'touchend', (e)=>{
    if (!swiping) return;
    const endX = e.changedTouches[0].clientX;
    const dx = endX - startX;
    if (Math.abs(dx) > 40) { dx < 0 ? goNext() : goPrev(); }
    swiping = false; resetAuto();
  });

  // Pause no hover (desktop)
  on(wrap, 'mouseenter', stopAuto);
  on(wrap, 'mouseleave', startAuto);

  function startAuto(){ stopAuto(); auto = setInterval(goNext, AUTO_MS); }
  function stopAuto(){ if (auto) clearInterval(auto); }
  function resetAuto(){ stopAuto(); startAuto(); }
  function isInViewport(el) {
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0;
  }

  startAuto();

  // Ajusta a altura suavemente ao redimensionar
  on(window, 'resize', debounce(()=>{
    const img = $('img', slides[current]);
    if (img){ img.style.height = '100%'; }
  }, 120));
})();


// =========================
// Carrossel genérico (Passeios/Beach Clubs) - por .carousel
// =========================
(function genericCarousels(){
  $$('.carousel').forEach(carousel => {
    const track  = $('.slides', carousel);
    const imgs   = $$('img', track);
    const prev   = $('.prev', carousel);
    const next   = $('.next', carousel);

    if (!track || !imgs.length || !prev || !next) return;

    let index = 0;

    // layout seguro
    track.style.display = 'flex';
    track.style.willChange = 'transform';
    track.style.transition = 'transform .45s ease';

    imgs.forEach((img, i) => {
      img.style.flexShrink = '0';
      img.style.width = '100%';
      img.style.objectFit = 'cover';
      img.decoding = 'async';
      img.loading  = i === 0 ? 'eager' : 'lazy';
    });

    const show = (i) => {
      index = (i + imgs.length) % imgs.length;
      track.style.transform = `translateX(${index * -100}%)`;
    };

    on(prev, 'click', ()=> show(index - 1));
    on(next, 'click', ()=> show(index + 1));

    // Swipe
    let startX = 0, swiping = false;
    on(carousel, 'touchstart', (e)=>{ startX = e.touches[0].clientX; swiping = true; }, {passive:true});
    on(carousel, 'touchend', (e)=>{
      if (!swiping) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) { dx < 0 ? show(index + 1) : show(index - 1); }
      swiping = false;
    });

    show(index);
  });
})();


// =========================
// Menu mobile (hambúrguer + dropdown)
// =========================
(function mobileMenu(){
  // Este botão deve existir no HTML para mobile (ex.: <button class="hamburger" aria-label="Menu">☰</button>)
  const hamburger = $('.hamburger');
  const links = $('.menu-links');
  if (!hamburger || !links) return;

  on(hamburger, 'click', ()=>{
    links.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', links.classList.contains('open') ? 'true' : 'false');
  });

  // Dropdown no toque (mobile)
  $$('.menu-links .dropdown > a').forEach(a=>{
    on(a, 'click', (e)=>{
      if (window.matchMedia('(hover: none)').matches){
        e.preventDefault();
        a.parentElement.classList.toggle('open');
      }
    });
  });

  // Fecha menu ao clicar em um link (melhor UX)
  $$('.menu-links a').forEach(a=>{
    on(a, 'click', ()=> links.classList.remove('open'));
  });
})();


// =========================
/* Modal de Reserva (mantém sua estrutura) */
// =========================
(function reservaModal(){
  const modal    = $('#modalReserva');
  const openBtn  = $('.abrir-reserva');
  const closeBtn = $('.fechar');
  const content  = $('.modal-content', modal || document);

  if (!modal || !openBtn || !closeBtn) return;

  function open(){
    modal.classList.add('show');
    modal.style.display = 'flex';
    // foca o primeiro campo do form
    const firstInput = $('input, select, textarea, button', content);
    if (firstInput) setTimeout(()=> firstInput.focus(), 80);
    trapFocus(true);
  }
  function close(){
    modal.classList.remove('show');
    setTimeout(()=> modal.style.display = 'none', 250);
    trapFocus(false);
    openBtn.focus();
  }

  on(openBtn, 'click', open);
  on(closeBtn, 'click', close);
  on(window, 'click', (e)=>{ if (e.target === modal) close(); });
  on(window, 'keydown', (e)=>{ if (e.key === 'Escape') close(); });

  // Trap focus acessível dentro do modal
  function trapFocus(enable){
    if (!enable) { on(document, 'keydown', trapHandler); return document.removeEventListener('keydown', trapHandler); }
    on(document, 'keydown', trapHandler);
  }
  function trapHandler(e){
    if (e.key !== 'Tab' || !modal.classList.contains('show')) return;
    const focusables = $$('a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])', content)
      .filter(el => !el.disabled && el.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last  = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first)  { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
})();


// =========================
// Omnibees (se você já tem a IIFE no HTML, pode remover essa seção)
// Mantém a mesma lógica de abrir em nova aba e fechar modal
// =========================
(function omnibeesHook(){
  const form = $('#formReserva');
  if (!form) return;

  const checkin  = $('#checkin');
  const checkout = $('#checkout');
  const HOTEL_ID = '22031';

  // Datas mínimas seguras
  const toISO = (d)=> `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const today = new Date();
  if (checkin)  checkin.min  = toISO(today);
  if (checkout) { const c = new Date(today); c.setDate(today.getDate()+1); checkout.min = toISO(c); }

  on(checkin, 'change', ()=>{
    if (!checkin.value || !checkout) return;
    const ci = new Date(checkin.value);
    const co = new Date(ci); co.setDate(ci.getDate()+1);
    const min = toISO(co);
    if (checkout.value < min) checkout.value = min;
    checkout.min = min;
  });

  const toDDMMYYYY = (str)=>{
    if (!str) return '';
    if (str.includes('-')) { const [y,m,d]=str.split('-'); return `${d}${m}${y}`; }
    if (str.includes('/')) { const [d,m,y]=str.split('/'); return `${d}${m}${y}`; }
    return '';
  };

  on(form, 'submit', (e)=>{
    e.preventDefault();
    const ci = toDDMMYYYY(checkin?.value || '');
    const co = toDDMMYYYY(checkout?.value || '');
    const ad = parseInt($('#adultos')?.value || '1', 10);
    const ch = parseInt($('#criancas')?.value || '0', 10);

    if (!ci || !co){ alert('Selecione as datas de check-in e check-out.'); return; }

    const url = new URL('https://book.omnibees.com/hotelresults');
    url.searchParams.set('CheckIn',  ci);
    url.searchParams.set('CheckOut', co);
    url.searchParams.set('NRooms',   '1');
    url.searchParams.set('ad',       String(ad));
    url.searchParams.set('ch',       String(ch));
    url.searchParams.set('lang',     'pt-BR');
    url.searchParams.set('q',        HOTEL_ID);

    window.open(url.toString(), '_blank', 'noopener');
    // fecha modal se estiver aberto
    const modal = $('#modalReserva');
    if (modal) modal.classList.remove('show');
  });
})();