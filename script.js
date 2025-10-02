'use strict';

// ------------------ Helpers ------------------
function $(sel, ctx){ return (ctx||document).querySelector(sel); }
function $$(sel, ctx){ return Array.prototype.slice.call((ctx||document).querySelectorAll(sel)); }
function on(el, ev, fn, opts){ if (el) el.addEventListener(ev, fn, opts); }
function debounce(fn, delay){
  var t; return function(){ clearTimeout(t); var a=arguments; t=setTimeout(function(){ fn.apply(null,a); }, delay||150); };
}
var REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('DOMContentLoaded', function(){

  // =========================
  // Lazy loader p/ data-src / data-srcset
  // =========================
  (function(){
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function(entries, obs){
      entries.forEach(function(entry){
        if (!entry.isIntersecting) return;
        var el = entry.target;

        if (el.dataset && el.dataset.src)    el.src    = el.dataset.src;
        if (el.dataset && el.dataset.srcset) el.srcset = el.dataset.srcset;

        if (el.tagName === 'SOURCE') {
          var img = el.parentElement && el.parentElement.querySelector('img');
          if (img) img.src = img.currentSrc || img.src;
        }

        el.addEventListener('load', function(){ el.classList.add('loaded'); }, { once: true });
        obs.unobserve(el);
      });
    }, { rootMargin: '400px' });
    $$('.lazy[data-src], img[data-src], source[data-srcset]').forEach(function(el){ io.observe(el); });
  })();

  // =========================
  // Mapa sob demanda (com fallbacks)
  // =========================
  (function(){
    var embed = $('#mapa-embed');
    if (!embed) return;

    var shell = $('#mapa-shell');
    var btn = $('#carregar-mapa');

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
      var iframe = document.createElement('iframe');
      iframe.title = 'Mapa de localização';
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.allowFullscreen = true;
      iframe.style.cssText = 'width:100%;height:min(70vh,600px);border:0;border-radius:10px;overflow:hidden';
      iframe.src = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3823.60435661718!2d-39.0988038!3d-16.596411!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x7369d0c3a51b683%3A0x24628b28ec2f9bdc!2sCorais%20de%20Trancoso%20Boutique!5e0!3m2!1spt-BR!2sbr!4v1757190368070!5m2!1spt-BR!2sbr';
      embed.appendChild(iframe);
      if (!embed.dataset) embed.dataset = {};
      embed.dataset.loaded = '1';
      if (shell) shell.style.display = 'none';
    }

    on(btn, 'click', loadMap);

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function(entries){
        if (entries[0].isIntersecting) { loadMap(); io.disconnect(); }
      }, { rootMargin: '200px' });
      io.observe(embed);
    }
  })();

  // =========================
  // HEADER: carrossel fade
  // =========================
  (function(){
    var imgs = $$('.carousel-background img, .carousel-background picture > img');
    if (!imgs.length) return;

    var idx = 0, timer = null, DURATION = 4000;
    var preloaded = {};
    function preloadURL(href){
      if (!href || preloaded[href]) return;
      var l = document.createElement('link');
      l.rel = 'preload'; l.as = 'image'; l.href = href;
      document.head.appendChild(l);
      preloaded[href] = 1;
    }
    function candidateSrc(el){
      return (el && el.dataset && el.dataset.src) || (el && el.currentSrc) || (el && el.src) || '';
    }

    imgs.forEach(function(img, i){
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
      var current = imgs[idx];
      var next = imgs[(nextIndex + imgs.length) % imgs.length];

      preloadURL(candidateSrc(next));

      var done = function(){
        current.style.opacity = '0';
        next.style.opacity = '1';
        idx = (nextIndex + imgs.length) % imgs.length;
        var ahead = imgs[(idx + 1) % imgs.length];
        preloadURL(candidateSrc(ahead));
      };
      if (next.decode) next.decode().then(done).catch(done); else done();
    }
    function nextSlide(){ fadeTo(idx + 1); }

    function start(){ if (!REDUCED_MOTION && imgs.length > 1) { stop(); timer = setInterval(nextSlide, DURATION); } }
    function stop(){ if (timer){ clearInterval(timer); timer = null; } }

    var container = $('.carousel-container');
    if (container){
      on(container, 'mouseenter', stop);
      on(container, 'mouseleave', start);
    }
    on(document, 'visibilitychange', function(){ document.hidden ? stop() : start(); });
    on(window, 'resize', debounce(function(){ imgs.forEach(function(img){ img.style.height = '100%'; }); }, 120));

    preloadURL(candidateSrc(imgs[1]));
    start();
  })();

  // =========================
  // DESTINOS: carrossel com criação de dots/botões + swipe/teclas
  // =========================
  (function(){
    var wrap = $('.praia-carousel');
    if (!wrap) return;

    var prev = $('.prev', wrap);
    var next = $('.next', wrap);
    var dotsBox = $('.dots-container', wrap);

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

    var slides = $$('.destino-slide', wrap);
    if (slides.length <= 1) return;

    var current = 0, auto = null, AUTO_MS = 5000;

    slides.forEach(function(s, i){
      var img = $('img', s);
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
    slides.forEach(function(_, i){
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Ir ao slide ' + (i+1));
      if (i === 0) b.classList.add('active');
      on(b, 'click', function(){ show(i); resetAuto(); });
      dotsBox.appendChild(b);
    });
    var dots = $$('button', dotsBox);

    function show(i){
      if (i === current) return;
      var out = slides[current];
      var nextIdx = (i + slides.length) % slides.length;
      var into = slides[nextIdx];

      out.style.opacity = '0';
      out.setAttribute('aria-hidden', 'true');
      setTimeout(function(){ out.style.display = 'none'; }, 600);

      into.style.display = 'block';
      requestAnimationFrame(function(){ into.style.opacity = '1'; });
      into.setAttribute('aria-hidden', 'false');

      if (dots[current]) dots[current].classList.remove('active');
      if (dots[nextIdx]) dots[nextIdx].classList.add('active');

      current = nextIdx;
    }
    function goNext(){ show(current + 1); }
    function goPrev(){ show(current - 1); }

    on(next, 'click', function(){ goNext(); resetAuto(); });
    on(prev, 'click', function(){ goPrev(); resetAuto(); });

    function isInViewport(el){
      var r = el.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    }
    on(document, 'keydown', function(e){
      if (!isInViewport(wrap)) return;
      if (e.key === 'ArrowRight') { goNext(); resetAuto(); }
      if (e.key === 'ArrowLeft')  { goPrev(); resetAuto(); }
    });

    var startX = 0, startY = 0, deltaX = 0, dragging = false, blocked = false;
    var THRESHOLD = 50, ANGLE_LOCK = 25;
    function angleDeg(dx, dy){ return Math.atan2(Math.abs(dy), Math.abs(dx)) * 180 / Math.PI; }

    on(wrap, 'touchstart', function(e){
      var t = e.changedTouches[0];
      startX = t.clientX; startY = t.clientY; deltaX = 0; dragging = true; blocked = false;
      stopAuto();
    }, { passive: true });

    on(wrap, 'touchmove', function(e){
      if (!dragging || blocked) return;
      var t = e.changedTouches[0];
      var dx = t.clientX - startX, dy = t.clientY - startY;
      if (angleDeg(dx, dy) > ANGLE_LOCK) { blocked = true; resetAuto(); return; }
      deltaX = dx;
    }, { passive: true });

    function endSwipe(){
      if (!dragging) return;
      if (Math.abs(deltaX) > THRESHOLD) { if (deltaX < 0) goNext(); else goPrev(); }
      dragging = false; blocked = false; deltaX = 0;
      resetAuto();
    }
    on(wrap, 'touchend', endSwipe, { passive: true });
    on(wrap, 'touchcancel', endSwipe, { passive: true });

    on(wrap, 'mouseenter', stopAuto);
    on(wrap, 'mouseleave', startAuto);

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function(entries){
        if (entries[0].isIntersecting) startAuto(); else stopAuto();
      }, { threshold: 0.1 });
      io.observe(wrap);
    }

    function startAuto(){ if (!REDUCED_MOTION) { stopAuto(); auto = setInterval(goNext, AUTO_MS); } }
    function stopAuto(){ if (auto){ clearInterval(auto); auto = null; } }
    function resetAuto(){ stopAuto(); startAuto(); }

    on(window, 'resize', debounce(function(){
      var img = $('img', slides[current]);
      if (img) img.style.height = '100%';
    }, 120));

    startAuto();
  })();

  // =========================
  // Carrossel genérico (.carousel > .slides)
  // =========================
  (function(){
    $$('.carousel').forEach(function(carousel){
      var track  = $('.slides', carousel);
      var imgs   = $$('img', track);
      var prev   = $('.prev', carousel);
      var next   = $('.next', carousel);
      if (!track || !imgs.length || !prev || !next) return;

      var index = 0;
      track.style.display = 'flex';
      track.style.willChange = 'transform';
      track.style.transition = 'transform .45s ease';

      imgs.forEach(function(img, i){
        img.style.flexShrink = '0';
        img.style.width = '100%';
        img.style.objectFit = 'cover';
        img.decoding = 'async';
        img.loading  = i === 0 ? 'eager' : 'lazy';
      });

      function show(i){
        index = (i + imgs.length) % imgs.length;
        track.style.transform = 'translateX(' + (index * -100) + '%)';
      }

      on(prev, 'click', function(){ show(index - 1); });
      on(next, 'click', function(){ show(index + 1); });

      var startX = 0, swiping = false;
      on(carousel, 'touchstart', function(e){ startX = e.touches[0].clientX; swiping = true; }, { passive: true });
      on(carousel, 'touchend', function(e){
        if (!swiping) return;
        var dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 40) { if (dx < 0) show(index + 1); else show(index - 1); }
        swiping = false;
      }, { passive: true });

      show(index);
    });
  })();

  // =========================
  // Menu mobile (hambúrguer + dropdown)
  // =========================
  (function(){
    var hamburger = $('.hamburger');
    var links = $('.menu-links');
    if (!hamburger || !links) return;

    function lockScroll(lock){ document.body.style.overflow = lock ? 'hidden' : ''; }
    function toggle(force){
      var open = typeof force === 'boolean' ? force : !links.classList.contains('aberto');
      links.classList.toggle('aberto', open);
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
      lockScroll(open);
    }

    on(hamburger, 'click', function(){ toggle(); });

    on(document, 'click', function(e){
      if (!links.classList.contains('aberto')) return;
      if (e.target.closest && e.target.closest('.topo-menu')) return;
      toggle(false);
    });

    on(document, 'keydown', function(e){ if (e.key === 'Escape' && links.classList.contains('aberto')) toggle(false); });

    $$('.menu-links .dropdown > a').forEach(function(a){
      on(a, 'click', function(e){
        if (window.matchMedia && window.matchMedia('(max-width: 900px)').matches) {
          e.preventDefault();
          a.parentElement.classList.toggle('open');
        }
      });
    });

    $$('.menu-links a').forEach(function(a){ on(a, 'click', function(){ toggle(false); }); });
  })();

  // =========================
  // Modal de Reserva (acessível) + Omnibees
  // =========================
  (function(){
    // Modal
    var modal    = $('#modalReserva');
    var openBtn  = $('.abrir-reserva');
    var closeBtn = modal ? $('.fechar', modal) : null;
    var content  = modal ? $('.modal-content', modal) : null;

    if (modal && openBtn && closeBtn && content){
      function open(){
        modal.classList.add('show');
        modal.style.display = 'flex';
        var firstInput = $('input, select, textarea, button', content);
        if (firstInput) setTimeout(function(){ firstInput.focus(); }, 80);
        document.addEventListener('keydown', trapHandler);
      }
      function close(){
        modal.classList.remove('show');
        setTimeout(function(){ modal.style.display = 'none'; }, 250);
        document.removeEventListener('keydown', trapHandler);
        openBtn.focus();
      }
      function trapHandler(e){
        if (e.key !== 'Tab' || !modal.classList.contains('show')) return;
        var focusables = $$('a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])', content)
          .filter(function(el){ return !el.disabled && el.offsetParent !== null; });
        if (!focusables.length) return;
        var first = focusables[0];
        var last  = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first)  { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }

      on(openBtn, 'click', open);
      on(closeBtn, 'click', close);
      on(window, 'click', function(e){ if (e.target === modal) close(); });
      on(window, 'keydown', function(e){ if (e.key === 'Escape') close(); });
    }

    // Omnibees
    var form = $('#formReserva');
    if (!form) return;

    var checkin  = $('#checkin');
    var checkout = $('#checkout');
    var HOTEL_ID = '22031';

    function toISO(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
    var today = new Date();
    if (checkin)  checkin.min  = toISO(today);
    if (checkout){ var c = new Date(today); c.setDate(today.getDate()+1); checkout.min = toISO(c); }

    on(checkin, 'change', function(){
      if (!checkin.value || !checkout) return;
      var ci = new Date(checkin.value);
      var co = new Date(ci); co.setDate(ci.getDate()+1);
      var min = toISO(co);
      if (checkout.value < min) checkout.value = min;
      checkout.min = min;
    });

    function toDDMMYYYY(str){
      if (!str) return '';
      if (str.indexOf('-') !== -1){ var p=str.split('-'); return p[2]+p[1]+p[0]; }
      if (str.indexOf('/') !== -1){ var q=str.split('/'); return q[0]+q[1]+q[2]; }
      return '';
    }

    on(form, 'submit', function(e){
      e.preventDefault();
      var ci = toDDMMYYYY(checkin ? checkin.value : '');
      var co = toDDMMYYYY(checkout ? checkout.value : '');
      var ad = parseInt(($('#adultos') || {}).value || '1', 10);
      var ch = parseInt(($('#criancas') || {}).value || '0', 10);

      if (!ci || !co){ alert('Selecione as datas de check-in e check-out.'); return; }

      var url = new URL('https://book.omnibees.com/hotelresults');
      url.searchParams.set('CheckIn',  ci);
      url.searchParams.set('CheckOut', co);
      url.searchParams.set('NRooms',   '1');
      url.searchParams.set('ad',       String(ad));
      url.searchParams.set('ch',       String(ch));
      url.searchParams.set('lang',     'pt-BR');
      url.searchParams.set('q',        HOTEL_ID);

      window.open(url.toString(), '_blank', 'noopener');
      if (modal) modal.classList.remove('show');
    });
  })();

}); // DOMContentLoaded
