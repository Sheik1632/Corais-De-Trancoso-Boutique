'use strict';

/* =========================================
   CONFIGURAÇÃO OMNIBEES
========================================= */
const OMNIBEES_HOTEL_ID = '22031';           // <<< troque para o ID correto do hotel
const OMNIBEES_BASE_URL = 'https://book.omnibees.com/hotelresults';
const OMNIBEES_LANG     = 'pt-BR';
const OMNIBEES_CURRENCY = 'BRL';

/* Helpers de datas */
function todayISO(){
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0,10);
}
function addDays(iso, days){
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0,10);
}
function toDDMMYYYY(iso){
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return d + m + y; // Omnibees recebe DDMMAAAA sem separador
}

/* URL builder (sempre use objeto) */
function buildOmnibeesURL({ checkinISO, checkoutISO, adultos = 2, criancas = 0 } = {}){
  if (!checkinISO)  checkinISO  = todayISO();
  if (!checkoutISO) checkoutISO = addDays(checkinISO, 1);

  const url = new URL(OMNIBEES_BASE_URL);
  url.searchParams.set('q',        OMNIBEES_HOTEL_ID);
  url.searchParams.set('CheckIn',  toDDMMYYYY(checkinISO));
  url.searchParams.set('CheckOut', toDDMMYYYY(checkoutISO));
  url.searchParams.set('NRooms',   '1');
  url.searchParams.set('ad',       String(adultos));
  url.searchParams.set('ch',       String(criancas));
  url.searchParams.set('lang',     OMNIBEES_LANG);
  url.searchParams.set('cur',      OMNIBEES_CURRENCY);
  return url.toString();
}

/* =========================================
   HELPERS GERAIS
========================================= */
const $  = (sel, ctx) => (ctx || document).querySelector(sel);
const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts || false);
const debounce = (fn, delay = 150) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), delay); }; };
const REDUCED_MOTION = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

/* Habilita regras html.js do CSS */
document.documentElement.classList.add('js');

/* =========================================
   DOM READY
========================================= */
document.addEventListener('DOMContentLoaded', () => {

  /* =========================
     1) MENU MOBILE (hambúrguer + dropdown)
  ========================= */
  (function(){
    const hamburger = $('.hamburger');
    const links     = $('#menuLinks');
    const dropdownToggles = $$('.menu-links .dropdown > a');

    if (!hamburger || !links) return;

    function lockScroll(lock){ document.body.style.overflow = lock ? 'hidden' : ''; }
    function setOpen(open){
      links.classList.toggle('aberto', open);
      links.dataset.open = open ? 'true' : 'false';
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
      lockScroll(open);
    }

    on(hamburger, 'click', () => setOpen(!(links.dataset.open === 'true')));

    // Fechar clicando fora
    on(document, 'click', (e) => {
      if (innerWidth > 900) return; // só no mobile
      if (links.dataset.open !== 'true') return;
      if (e.target.closest('.topo-menu')) return;
      setOpen(false);
    });

    // Esc para fechar
    on(window, 'keydown', (e) => {
      if (e.key === 'Escape' && links.dataset.open === 'true') setOpen(false);
    });

    // Dropdown acessível no mobile (abre por clique)
    dropdownToggles.forEach(a => {
      on(a, 'click', (e) => {
        if (matchMedia('(max-width: 900px)').matches) {
          e.preventDefault();
          const li = a.parentElement;
          const menu = $('.dropdown-menu', li);
          if (!menu) return;
          const isHidden = menu.hasAttribute('hidden');
          // fecha todos os outros
          $$('.menu-links .dropdown .dropdown-menu').forEach(m => m.setAttribute('hidden', ''));
          if (isHidden) menu.removeAttribute('hidden'); else menu.setAttribute('hidden', '');
        }
      });
    });

    // Fechar menu ao clicar num link
    $$('.menu-links a').forEach(a => on(a, 'click', () => setOpen(false)));
  })();

  /* =========================
     2) MAPA on-demand (clique ou quando entrar no viewport)
  ========================= */
  (function(){
    const MAPS_EMBED_SRC =
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3823.6043569321937!2d-39.101378724852744!3d-16.596410984162116!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x7369d0c3a51b683%3A0x24628b28ec2f9bdc!2sCorais%20de%20Trancoso%20Boutique!5e0!3m2!1spt-BR!2sbr!4v1759438391051!5m2!1spt-BR!2sbr';

    const container = $('#mapa-embed');
    const shell     = $('#mapa-shell');
    const btn       = $('#carregar-mapa');
    if (!container) return;

    function loadMap(){
      if (container.dataset.loaded) return;
      const iframe = document.createElement('iframe');
      iframe.title = 'Mapa de localização';
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.allowFullscreen = true;
      iframe.style.cssText = 'width:100%;height:min(70vh,600px);border:0;border-radius:14px;overflow:hidden';
      iframe.src = MAPS_EMBED_SRC;
      container.appendChild(iframe);
      container.dataset.loaded = '1';
      if (shell) shell.style.display = 'none';
    }

    on(btn, 'click', loadMap, { passive: true });

    if ('IntersectionObserver' in window){
      const io = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) { loadMap(); io.disconnect(); }
      }, { rootMargin: '200px' });
      io.observe(container);
    }
  })();

  /* =========================
     3) HERO: fade simples entre <picture> imgs do topo
  ========================= */
  (function(){
    const imgs = $$('.carousel-background picture > img, .carousel-background > img');
    if (!imgs.length) return;

    let idx = 0, timer = null;
    const DURATION = 4000;

    imgs.forEach((img, i) => {
      img.style.objectFit = 'cover';
      img.style.width  = '100%';
      img.style.height = '100%';
      img.style.opacity = i === 0 ? '1' : '0';
      img.style.transition = 'opacity .8s ease';
      img.decoding = 'async';
      img.loading  = i === 0 ? 'eager' : 'lazy';
    });

    function fadeTo(nextIndex){
      if (nextIndex === idx) return;
      const current = imgs[idx];
      const next = imgs[(nextIndex + imgs.length) % imgs.length];
      const done = () => { current.style.opacity = '0'; next.style.opacity = '1'; idx = (nextIndex + imgs.length) % imgs.length; };
      next.decode ? next.decode().then(done).catch(done) : done();
    }
    const nextSlide = () => fadeTo(idx + 1);

    function start(){ if (!REDUCED_MOTION && imgs.length > 1){ stop(); timer = setInterval(nextSlide, DURATION); } }
    function stop(){ if (timer){ clearInterval(timer); timer = null; } }

    const container = $('.carousel-container');
    if (container){
      on(container, 'mouseenter', stop,  { passive: true });
      on(container, 'mouseleave', start, { passive: true });
    }
    on(document, 'visibilitychange', () => document.hidden ? stop() : start());
    on(window, 'resize', debounce(() => imgs.forEach(img => img.style.height = '100%'), 120));

    start();
  })();

  /* =========================
     4) CARROSSEL "Destinos" (dots + teclado + swipe)
  ========================= */
  (function(){
    const wrap = $('.praia-carousel');
    if (!wrap) return;

    const slides = $$('.destino-slide', wrap);
    if (slides.length <= 1) return;

    let prev = $('.prev', wrap);
    let next = $('.next', wrap);
    let dotsBox = $('.dots-container', wrap);

    if (!prev){ prev = Object.assign(document.createElement('button'), { className: 'prev', type: 'button', textContent: '❮', 'aria-label': 'Slide anterior' }); wrap.appendChild(prev); }
    if (!next){ next = Object.assign(document.createElement('button'), { className: 'next', type: 'button', textContent: '❯', 'aria-label': 'Próximo slide' }); wrap.appendChild(next); }
    if (!dotsBox){ dotsBox = Object.assign(document.createElement('div'), { className: 'dots-container', 'aria-label': 'Navegação de slides' }); wrap.appendChild(dotsBox); }

    slides.forEach((s, i) => {
      const img = $('img', s);
      if (img){
        img.style.objectFit = 'cover';
        img.style.width = '100%';
        img.style.height = '100%';
        img.decoding = 'async';
        img.loading  = i === 0 ? 'eager' : 'lazy';
      }
      s.style.display = i === 0 ? 'block' : 'none';
      s.style.opacity = i === 0 ? '1' : '0';
      s.style.transition = 'opacity .6s ease';
      s.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
    });

    let current = 0, auto = null;
    const AUTO_MS = 5000;

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
      const out = slides[current];
      const nextIdx = (i + slides.length) % slides.length;
      const into = slides[nextIdx];

      out.style.opacity = '0';
      out.setAttribute('aria-hidden', 'true');
      setTimeout(() => { out.style.display = 'none'; }, 600);

      into.style.display = 'block';
      requestAnimationFrame(() => { into.style.opacity = '1'; });
      into.setAttribute('aria-hidden', 'false');

      dots[current]?.classList.remove('active');
      dots[nextIdx]?.classList.add('active');

      current = nextIdx;
    }
    const goNext = () => show(current + 1);
    const goPrev = () => show(current - 1);

    on(next, 'click', () => { goNext(); resetAuto(); });
    on(prev, 'click', () => { goPrev(); resetAuto(); });

    // Teclado somente se visível na tela
    const isInViewport = (el) => { const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; };
    on(document, 'keydown', (e) => {
      if (!isInViewport(wrap)) return;
      if (e.key === 'ArrowRight') { goNext(); resetAuto(); }
      if (e.key === 'ArrowLeft')  { goPrev(); resetAuto(); }
    });

    // Swipe
    let startX = 0, startY = 0, deltaX = 0, dragging = false, blocked = false;
    const THRESHOLD = 50, ANGLE_LOCK = 25;
    const angleDeg = (dx,dy) => Math.atan2(Math.abs(dy), Math.abs(dx)) * 180 / Math.PI;

    on(wrap, 'touchstart', (e) => {
      const t = e.changedTouches[0];
      startX = t.clientX; startY = t.clientY; deltaX = 0; dragging = true; blocked = false;
      stopAuto();
    }, { passive: true });

    on(wrap, 'touchmove', (e) => {
      if (!dragging || blocked) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX, dy = t.clientY - startY;
      if (angleDeg(dx,dy) > ANGLE_LOCK){ blocked = true; resetAuto(); return; }
      deltaX = dx;
    }, { passive: true });

    const endSwipe = () => {
      if (!dragging) return;
      if (Math.abs(deltaX) > THRESHOLD) (deltaX < 0 ? goNext() : goPrev());
      dragging = false; blocked = false; deltaX = 0;
      resetAuto();
    };
    on(wrap, 'touchend', endSwipe,   { passive: true });
    on(wrap, 'touchcancel', endSwipe, { passive: true });

    function startAuto(){ if (!REDUCED_MOTION){ stopAuto(); auto = setInterval(goNext, AUTO_MS); } }
    function stopAuto(){ if (auto){ clearInterval(auto); auto = null; } }
    function resetAuto(){ stopAuto(); startAuto(); }

    on(wrap, 'mouseenter', stopAuto);
    on(wrap, 'mouseleave', startAuto);
    on(window, 'resize', debounce(() => { const img = $('img', slides[current]); if (img) img.style.height = '100%'; }, 120));

    startAuto();
  })();

  /* =========================
     5) MODAL DE RESERVA + OMNIBEES (iframe se existir, senão nova aba)
  ========================= */
  (function(){
    const modal     = $('#modalReserva');
    const openBtn   = $('.abrir-reserva');
    if (!modal || !openBtn) return;

    const closeBtn  = $('.fechar', modal);
    const content   = $('.modal-content', modal);
    const form      = $('#formReserva');

    const ci        = $('#checkin');
    const co        = $('#checkout');
    const adultosEl = $('#adultos');
    const kidsEl    = $('#criancas');

    const iframe    = $('#omnibeesFrame');   // opcional
    const aLink     = $('#omnibeesLink');    // opcional
    const resultBox = $('#resultadoDisponivel'); // opcional

    // Datas padrão + mínimas
    const t = todayISO();
    if (ci && co){
      ci.value = ci.value || t;
      co.value = co.value || addDays(ci.value, 1);
      ci.min = t;
      co.min = addDays(t, 1);

      on(ci, 'change', () => {
        const minCo = addDays(ci.value || todayISO(), 1);
        co.min = minCo;
        if (!co.value || co.value <= ci.value) co.value = minCo;
      });
    }

    // Focus trap
    function trapHandler(e){
      if (e.key !== 'Tab') return;
      const focusables = $$('a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])', content)
        .filter(el => !el.disabled && el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last  = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    }

    function openModal(){
      modal.classList.add('is-open','show');
      modal.style.display = 'flex';
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
      setTimeout(() => ci?.focus(), 60);
      document.addEventListener('keydown', trapHandler);
    }
    function closeModal(){
      modal.classList.remove('is-open','show');
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      setTimeout(() => { if (!modal.classList.contains('is-open') && !modal.classList.contains('show')) modal.style.display = 'none'; }, 250);
      document.removeEventListener('keydown', trapHandler);
      openBtn.focus();
    }

    on(openBtn,  'click', openModal);
    on(closeBtn, 'click', closeModal);
    on(modal, 'click', (e) => { if (e.target === modal) closeModal(); }, { passive: true });
    on(window, 'keydown', (e) => { if (e.key === 'Escape' && (modal.classList.contains('is-open') || modal.classList.contains('show'))) closeModal(); });

    // Sanitiza campos numéricos
    const clamp = (el) => {
      if (!el) return;
      const min = el.min ? parseInt(el.min, 10) : -Infinity;
      const max = el.max ? parseInt(el.max, 10) :  Infinity;
      let v = parseInt(el.value || (min > 0 ? min : 0), 10);
      if (Number.isNaN(v)) v = min > 0 ? min : 0;
      el.value = Math.min(Math.max(v, min), max);
    };
    [adultosEl, kidsEl].forEach(el => {
      if (!el) return;
      on(el, 'change', () => clamp(el));
      on(el, 'blur',   () => clamp(el));
    });

    // Centraliza campo focado (UX mobile)
    on(form, 'focusin', (e) => {
      const el = e.target;
      if (/input|select|textarea/i.test(el.tagName)){
        try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch(_){}
      }
    });

    // SUBMIT → abre no iframe (se existir) senão em nova aba
    on(form, 'submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()){ form.reportValidity(); return; }

      clamp(adultosEl); clamp(kidsEl);

      const checkinISO  = ci?.value || todayISO();
      let   checkoutISO = co?.value || addDays(checkinISO, 1);
      if (new Date(checkoutISO) <= new Date(checkinISO)){
        checkoutISO = addDays(checkinISO, 1);
        if (co) co.value = checkoutISO;
      }

      const adultos  = parseInt(adultosEl?.value || '2', 10);
      const criancas = parseInt(kidsEl?.value    || '0', 10);

      const url = buildOmnibeesURL({ checkinISO, checkoutISO, adultos, criancas });

      if (iframe && aLink && resultBox){
        resultBox.style.display = 'block';
        aLink.href = url;
        iframe.src = url;
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        const opened = window.open(url, '_blank', 'noopener,noreferrer');
        if (!opened) window.location.href = url;
        closeModal();
      }
    });
  })();

  /* =========================
     6) LAZY de data-src/srcset (opcional, caso use)
  ========================= */
  (function(){
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        if (el.dataset && el.dataset.src)    el.src    = el.dataset.src;
        if (el.dataset && el.dataset.srcset) el.srcset = el.dataset.srcset;

        if (el.tagName === 'SOURCE'){
          const img = el.parentElement?.querySelector('img');
          if (img) img.src = img.currentSrc || img.src;
        }
        el.addEventListener('load', () => el.classList.add('loaded'), { once: true });
        obs.unobserve(el);
      });
    }, { rootMargin: '400px' });
    $$('.lazy[data-src], img[data-src], source[data-srcset]').forEach(el => io.observe(el));
  })();

});
