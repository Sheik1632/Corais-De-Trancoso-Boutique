'use strict';

/* =========================================
   CONFIGURAÇÃO (editada com seus dados)
========================================= */
const OMNIBEES_HOTEL_ID = '22031';     // seu ID
const OMNIBEES_LANG     = 'pt-BR';
const OMNIBEES_CURRENCY = 'BRL';

// Monta a URL clássica do Omnibees (abre resultados)
function buildOmnibeesURL(checkInISO, checkOutISO, adults, children){
  const toDDMMYYYY = (iso) => {
    if (!iso) return '';
    const [y,m,d] = iso.split('-');
    return d + m + y;
  };
  const url = new URL('https://book.omnibees.com/hotelresults');
  url.searchParams.set('CheckIn',  toDDMMYYYY(checkInISO));
  url.searchParams.set('CheckOut', toDDMMYYYY(checkOutISO));
  url.searchParams.set('NRooms',   '1');
  url.searchParams.set('ad',       String(adults || 1));
  url.searchParams.set('ch',       String(children || 0));
  url.searchParams.set('lang',     OMNIBEES_LANG);
  url.searchParams.set('currency', OMNIBEES_CURRENCY);
  url.searchParams.set('q',        OMNIBEES_HOTEL_ID); // id do hotel
  return url.toString();
}

// Seu embed do Google Maps (apenas o src do <iframe>)
const MAPS_EMBED_SRC =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3823.6043569321937!2d-39.101378724852744!3d-16.596410984162116!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x7369d0c3a51b683%3A0x24628b28ec2f9bdc!2sCorais%20de%20Trancoso%20Boutique!5e0!3m2!1spt-BR!2sbr!4v1759438391051!5m2!1spt-BR!2sbr';


/* =========================================
   HELPERS
========================================= */
function $(sel, ctx){ return (ctx||document).querySelector(sel); }
function $$(sel, ctx){ return Array.prototype.slice.call((ctx||document).querySelectorAll(sel)); }
function on(el, ev, fn, opts){ if (el) el.addEventListener(ev, fn, opts || false); }
function debounce(fn, delay){
  let t; return function(){ clearTimeout(t); const a=arguments; t=setTimeout(()=>fn.apply(null,a), delay||150); };
}
const REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.classList.add('js'); // habilita regras html.js do CSS

/* =========================================
   MAIN
========================================= */
document.documentElement.classList.add('js'); // habilita regras html.js do CSS
document.addEventListener('DOMContentLoaded', function(){

  /* =========================
     1) LAZY LOADER (data-src / data-srcset)
  ========================= */
  (function(){
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries, obs)=>{
      entries.forEach(entry=>{
        if (!entry.isIntersecting) return;
        const el = entry.target;

        if (el.dataset && el.dataset.src)    el.src    = el.dataset.src;
        if (el.dataset && el.dataset.srcset) el.srcset = el.dataset.srcset;

        if (el.tagName === 'SOURCE') {
          const img = el.parentElement && el.parentElement.querySelector('img');
          if (img) img.src = img.currentSrc || img.src;
        }

        el.addEventListener('load', ()=>{ el.classList.add('loaded'); }, { once: true });
        obs.unobserve(el);
      });
    }, { rootMargin: '400px' });
    $$('.lazy[data-src], img[data-src], source[data-srcset]').forEach(el=>io.observe(el));
  })();


  /* =========================
     2) MAPA SOB DEMANDA (com fallback)
  ========================= */
  (function(){
    const embed = $('#mapa-embed');
    if (!embed) return;

    const shell = $('#mapa-shell');
    let btn = $('#carregar-mapa');

    if (!btn && shell) {
      btn = document.createElement('button');
      btn.id = 'carregar-mapa';
      btn.className = 'btn btn-primary';
      btn.type = 'button';
      btn.textContent = 'Ver mapa';
      shell.appendChild(btn);
    }

    function loadMap(){
      if (embed.dataset && embed.dataset.loaded) return;
      const iframe = document.createElement('iframe');
      iframe.title = 'Mapa de localização';
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.allowFullscreen = true;
      iframe.style.cssText = 'width:100%;height:min(70vh,600px);border:0;border-radius:10px;overflow:hidden';
      iframe.src = MAPS_EMBED_SRC;
      embed.appendChild(iframe);
      if (!embed.dataset) embed.dataset = {};
      embed.dataset.loaded = '1';
      if (shell) shell.style.display = 'none';
    }

    on(btn, 'click', loadMap, { passive: true });

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries)=>{
        if (entries[0].isIntersecting) { loadMap(); io.disconnect(); }
      }, { rootMargin: '200px' });
      io.observe(embed);
    }
  })();


  /* =========================
     3) CARROSSEL DO HEADER (fade suave)
  ========================= */
  (function(){
    const imgs = $$('.carousel-background img, .carousel-background picture > img');
    if (!imgs.length) return;

    let idx = 0, timer = null;
    const DURATION = 4000;
    const preloaded = Object.create(null);

    function preloadURL(href){
      if (!href || preloaded[href]) return;
      const l = document.createElement('link');
      l.rel = 'preload'; l.as = 'image'; l.href = href;
      document.head.appendChild(l);
      preloaded[href] = 1;
    }
    function candidateSrc(el){
      return (el && el.dataset && el.dataset.src) || (el && el.currentSrc) || (el && el.src) || '';
    }

    imgs.forEach((img, i)=>{
      img.style.objectFit = 'cover';
      img.style.width = '100%';
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

      preloadURL(candidateSrc(next));

      const done = ()=>{
        current.style.opacity = '0';
        next.style.opacity = '1';
        idx = (nextIndex + imgs.length) % imgs.length;
        const ahead = imgs[(idx + 1) % imgs.length];
        preloadURL(candidateSrc(ahead));
      };
      if (next.decode) next.decode().then(done).catch(done); else done();
    }
    function nextSlide(){ fadeTo(idx + 1); }

    function start(){ if (!REDUCED_MOTION && imgs.length > 1) { stop(); timer = setInterval(nextSlide, DURATION); } }
    function stop(){ if (timer){ clearInterval(timer); timer = null; } }

    const container = $('.carousel-container');
    if (container){
      on(container, 'mouseenter', stop,   { passive: true });
      on(container, 'mouseleave', start,  { passive: true });
    }
    on(document, 'visibilitychange', ()=>{ document.hidden ? stop() : start(); });
    on(window, 'resize', debounce(()=>{ imgs.forEach(img=>{ img.style.height = '100%'; }); }, 120));

    preloadURL(candidateSrc(imgs[1]));
    start();
  })();


  /* =========================
     4) DESTINOS (carrossel com dots + swipe + teclas)
  ========================= */
  (function(){
    const wrap = $('.praia-carousel');
    if (!wrap) return;

    let prev = $('.prev', wrap);
    let next = $('.next', wrap);
    let dotsBox = $('.dots-container', wrap);

    if (!prev) {
      prev = document.createElement('button');
      prev.className = 'prev'; prev.type = 'button';
      prev.setAttribute('aria-label', 'Slide anterior');
      prev.textContent = '❮';
      wrap.appendChild(prev);
    }
    if (!next) {
      next = document.createElement('button');
      next.className = 'next'; next.type = 'button';
      next.setAttribute('aria-label', 'Próximo slide');
      next.textContent = '❯';
      wrap.appendChild(next);
    }
    if (!dotsBox) {
      dotsBox = document.createElement('div');
      dotsBox.className = 'dots-container';
      dotsBox.setAttribute('aria-label', 'Navegação de slides');
      wrap.appendChild(dotsBox);
    }

    const slides = $$('.destino-slide', wrap);
    if (slides.length <= 1) return;

    let current = 0, auto = null;
    const AUTO_MS = 5000;

    slides.forEach((s, i)=>{
      const img = $('img', s);
      if (img){
        img.style.objectFit = 'cover';
        img.style.width = '100%';
        img.style.height = '100%';
        img.decoding = 'async';
        img.loading  = i === 0 ? 'eager' : 'lazy';
      }
      s.style.display   = i === 0 ? 'block' : 'none';
      s.style.opacity   = i === 0 ? '1' : '0';
      s.style.transition= 'opacity .6s ease';
      s.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
    });

    dotsBox.innerHTML = '';
    slides.forEach((_, i)=>{
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Ir ao slide ' + (i+1));
      if (i === 0) b.classList.add('active');
      on(b, 'click', ()=>{ show(i); resetAuto(); });
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
      setTimeout(()=>{ out.style.display = 'none'; }, 600);

      into.style.display = 'block';
      requestAnimationFrame(()=>{ into.style.opacity = '1'; });
      into.setAttribute('aria-hidden', 'false');

      if (dots[current]) dots[current].classList.remove('active');
      if (dots[nextIdx]) dots[nextIdx].classList.add('active');

      current = nextIdx;
    }
    function goNext(){ show(current + 1); }
    function goPrev(){ show(current - 1); }

    on(next, 'click', ()=>{ goNext(); resetAuto(); });
    on(prev, 'click', ()=>{ goPrev(); resetAuto(); });

    function isInViewport(el){
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    }
    on(document, 'keydown', (e)=>{
      if (!isInViewport(wrap)) return;
      if (e.key === 'ArrowRight') { goNext(); resetAuto(); }
      if (e.key === 'ArrowLeft')  { goPrev(); resetAuto(); }
    });

    // Swipe (mobile)
    let startX = 0, startY = 0, deltaX = 0, dragging = false, blocked = false;
    const THRESHOLD = 50, ANGLE_LOCK = 25;
    const angleDeg = (dx, dy)=> Math.atan2(Math.abs(dy), Math.abs(dx)) * 180 / Math.PI;

    on(wrap, 'touchstart', (e)=>{
      const t = e.changedTouches[0];
      startX = t.clientX; startY = t.clientY; deltaX = 0; dragging = true; blocked = false;
      stopAuto();
    }, { passive: true });

    on(wrap, 'touchmove', (e)=>{
      if (!dragging || blocked) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX, dy = t.clientY - startY;
      if (angleDeg(dx, dy) > ANGLE_LOCK) { blocked = true; resetAuto(); return; } // rolagem vertical
      deltaX = dx;
    }, { passive: true });

    function endSwipe(){
      if (!dragging) return;
      if (Math.abs(deltaX) > THRESHOLD) { if (deltaX < 0) goNext(); else goPrev(); }
      dragging = false; blocked = false; deltaX = 0;
      resetAuto();
    }
    on(wrap, 'touchend', endSwipe,   { passive: true });
    on(wrap, 'touchcancel', endSwipe,{ passive: true });

    on(wrap, 'mouseenter', stopAuto);
    on(wrap, 'mouseleave', startAuto);

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries)=>{
        if (entries[0].isIntersecting) startAuto(); else stopAuto();
      }, { threshold: 0.1 });
      io.observe(wrap);
    }

    function startAuto(){ if (!REDUCED_MOTION) { stopAuto(); auto = setInterval(goNext, AUTO_MS); } }
    function stopAuto(){ if (auto){ clearInterval(auto); auto = null; } }
    function resetAuto(){ stopAuto(); startAuto(); }

    on(window, 'resize', debounce(()=>{
      const img = $('img', slides[current]);
      if (img) img.style.height = '100%';
    }, 120));

    startAuto();
  })();


  /* =========================
     5) MENU MOBILE (hambúrguer + dropdown)
  ========================= */
  (function(){
    const hamburger = $('.hamburger');
    const links = $('.menu-links');
    if (!hamburger || !links) return;

    function lockScroll(lock){ document.body.style.overflow = lock ? 'hidden' : ''; }
    function toggle(force){
      const open = typeof force === 'boolean' ? force : !links.classList.contains('aberto');
      links.classList.toggle('aberto', open);
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
      lockScroll(open);
    }

    on(hamburger, 'click', ()=>{ toggle(); });

    on(document, 'click', (e)=>{
      if (!links.classList.contains('aberto')) return;
      if (e.target.closest && e.target.closest('.topo-menu')) return;
      toggle(false);
    });

    on(document, 'keydown', (e)=>{ if (e.key === 'Escape' && links.classList.contains('aberto')) toggle(false); });

    $$('.menu-links .dropdown > a').forEach((a)=>{
      on(a, 'click', (e)=>{
        if (window.matchMedia && window.matchMedia('(max-width: 900px)').matches) {
          e.preventDefault();
          a.parentElement.classList.toggle('open');
        }
      });
    });

    $$('.menu-links a').forEach((a)=> on(a, 'click', ()=> toggle(false)));
  })();


/* =========================
   6) MODAL DE RESERVA + OMNIBEES (MOBILE UX)
========================= */
(function(){
  const modal     = $('#modalReserva');
  const openBtn   = $('.abrir-reserva');
  const closeBtn  = modal ? $('.fechar', modal) : null;
  const content   = modal ? $('.modal-content', modal) : null;
  const form      = $('#formReserva');
  const ci        = $('#checkin');
  const co        = $('#checkout');
  const adultsEl  = $('#adultos');
  const kidsEl    = $('#criancas');

  const iframe    = $('#omnibeesFrame');       // opcional
  const aLink     = $('#omnibeesLink');        // opcional
  const resultBox = $('#resultadoDisponivel'); // opcional

  if (!modal || !openBtn) return;

  // ===== Datas mínimas =====
  const pad = (n)=> String(n).padStart(2,'0');
  const today = new Date();
  const yyyy = today.getFullYear(), mm = pad(today.getMonth()+1), dd = pad(today.getDate());
  if (ci) ci.min = `${yyyy}-${mm}-${dd}`;
  if (ci && co){
    on(ci, 'change', ()=>{
      const d = ci.value ? new Date(ci.value) : new Date();
      d.setDate(d.getDate()+1);
      const min = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
      co.min = min;
      if(!co.value || co.value <= ci.value) co.value = min;
    });
  }

  // ===== Clamp de quantidades (NEW) =====
  function clamp(el){
    if (!el) return;
    const min = el.min ? parseInt(el.min,10) : -Infinity;
    const max = el.max ? parseInt(el.max,10) : Infinity;
    let v = parseInt(el.value || (min>0?min:0), 10);
    if (Number.isNaN(v)) v = min>0 ? min : 0;
    el.value = Math.min(Math.max(v, min), max);
  }
  [adultsEl, kidsEl].forEach(el=>{
    el && on(el, 'change', ()=>clamp(el));
    el && on(el, 'blur',   ()=>clamp(el));
  });

  // ===== Abrir/fechar modal =====
  let touchBlocker = null; // (NEW) para iOS impedir overscroll do fundo

  function trapHandler(e){
    if (e.key !== 'Tab') return;
    const focusables = $$(
      'a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])',
      content
    ).filter(el => !el.disabled && el.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last  = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first)      { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function lockPageScroll(lock){
    document.body.classList.toggle('modal-open', !!lock);
    document.documentElement.style.overscrollBehavior = lock ? 'none' : '';
    // (NEW) Bloqueia touchmove fora do conteúdo no iOS
    if (lock && !touchBlocker){
      touchBlocker = (e)=>{
        if (!content.contains(e.target)) e.preventDefault();
      };
      document.addEventListener('touchmove', touchBlocker, { passive:false });
    } else if (!lock && touchBlocker){
      document.removeEventListener('touchmove', touchBlocker);
      touchBlocker = null;
    }
  }

  function openModal(){
    modal.classList.add('is-open','show');
    modal.style.display = 'flex';
    lockPageScroll(true);
    // foca no check-in (NEW: pequeno atraso p/ iOS subir teclado)
    setTimeout(()=> ci?.focus(), 60);
    document.addEventListener('keydown', trapHandler);
  }

  function closeModal(){
    modal.classList.remove('is-open','show');
    setTimeout(()=>{ if (!modal.classList.contains('is-open') && !modal.classList.contains('show')) modal.style.display = 'none'; }, 200);
    document.removeEventListener('keydown', trapHandler);
    lockPageScroll(false);
    openBtn.focus();
  }

  on(openBtn,  'click', openModal);
  on(closeBtn, 'click', closeModal);
  on(modal, 'click', (e)=>{ if (e.target === modal) closeModal(); }, { passive: true });
  on(window, 'keydown', (e)=>{ if (e.key === 'Escape' && (modal.classList.contains('is-open') || modal.classList.contains('show'))) closeModal(); });

  // ===== UX mobile: rolar campo focado para o centro (NEW) =====
  const focusScroll = debounce((el)=>{
    try { el.scrollIntoView({ behavior:'smooth', block:'center' }); } catch(_) {}
  }, 80);
  on(form, 'focusin', (e)=>{
    const el = e.target;
    if (/input|select|textarea/i.test(el.tagName)) focusScroll(el);
  });

  // ===== Submit → URL do Omnibees =====
  on(form, 'submit', (e)=>{
    e.preventDefault();

    clamp(adultsEl); clamp(kidsEl);

    const adults   = parseInt((adultsEl && adultsEl.value) || '2', 10);
    const children = parseInt((kidsEl    && kidsEl.value)  || '0', 10);
    const checkIn  = ci && ci.value ? ci.value : '';
    const checkOut = co && co.value ? co.value : '';

    if (!checkIn || !checkOut){
      alert('Selecione as datas de check-in e check-out.');
      return;
    }

    const url = buildOmnibeesURL(checkIn, checkOut, adults, children);

    if (iframe && aLink && resultBox){
      iframe.src = url;
      aLink.href = url;
      resultBox.style.display = 'block';
      // Mantém modal aberto mostrando o iframe (sua lógica atual)
    } else {
      window.open(url, '_blank', 'noopener');
      closeModal();
    }
  });
})();


}); // DOMContentLoaded
