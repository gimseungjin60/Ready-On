/* BLACK-OUT — 페이지(뷰) 라우터 + 공통 동작 + 모듈 초기화
   발표용: 한 번에 한 화면만 보여 주고 상단 메뉴로 이동합니다. 주소의 #해시가 현재 화면입니다. */
(function (RO) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 인쇄 대상 지정: body 클래스로 print.css에서 해당 영역만 출력
  RO.print = (cls) => {
    document.body.classList.add(cls);
    const done = () => { document.body.classList.remove(cls); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    window.print();
  };

  /* ---------- 등장 애니메이션 ---------- */
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      io.unobserve(en.target);
      countUp(en.target);
    }), { rootMargin: '0px 0px -6% 0px' })
    : null;
  RO.reveal = (root = document) => {
    root.querySelectorAll('.stagger').forEach((g) => [...g.children].forEach((c, i) => c.style.setProperty('--i', i)));
    root.querySelectorAll('.reveal:not(.is-in), .stagger:not(.is-in)').forEach((el) => (io ? io.observe(el) : el.classList.add('is-in')));
  };

  // 숫자 카운트업: data-count
  function countUp(root) {
    const els = root.matches?.('[data-count]') ? [root] : root.querySelectorAll?.('[data-count]') || [];
    els.forEach((el) => {
      const to = Number(el.dataset.count);
      if (reduce) { el.textContent = to; return; }
      const t0 = performance.now(), dur = 1200;
      const step = (t) => {
        const k = Math.min(1, (t - t0) / dur);
        el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }
  RO.countUp = countUp;

  /* ---------- 뷰 라우터 ---------- */
  let views = [], current = null, busy = false;

  function resolve(id) {
    let v = document.getElementById(id);
    if (!v) return views[0];
    if (!v.classList.contains('view')) v = v.closest('.view') || views[0];
    if (v.hidden) v = document.getElementById('test'); // 결과가 아직 없으면 테스트 화면으로
    return v;
  }

  function activate(v) {
    if (current) current.classList.remove('is-active');
    current = v;
    v.classList.add('is-active');
    window.scrollTo(0, 0);
    document.body.classList.toggle('on-home', v.id === 'top');
    // 화면에 들어올 때마다 등장 효과 다시 재생
    v.querySelectorAll('.reveal.is-in, .stagger.is-in').forEach((el) => el.classList.remove('is-in'));
    RO.reveal(v);
    updateChrome();
    RO.emit('view', v.id);
  }

  async function go(id, push = true) {
    const v = resolve(id);
    if (!v || v === current || busy) return;
    if (push && location.hash.slice(1) !== v.id) history.pushState(null, '', '#' + v.id);
    if (!current || reduce) { activate(v); return; }
    busy = true;
    const c = document.getElementById('curtain');
    const opts = { duration: 420, easing: 'cubic-bezier(.7,0,.3,1)', fill: 'forwards' };
    await c.animate([{ transform: 'translateX(-101%)' }, { transform: 'translateX(0)' }], opts).finished;
    activate(v);
    await c.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(101%)' }], { ...opts, delay: 120 }).finished;
    c.getAnimations().forEach((a) => a.cancel());
    busy = false;
  }
  RO.go = go;

  function updateChrome() {
    document.querySelectorAll('#nav a[href^="#"]').forEach((a) => {
      const on = a.getAttribute('href') === '#' + current.id || (current.id === 'result' && a.getAttribute('href') === '#test');
      a.classList.toggle('is-current', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  function initRouter() {
    views = [...document.querySelectorAll('.view')];
    // 페이지 내 링크(#...)는 모두 화면 전환으로 처리
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || a.getAttribute('href') === '#') return;
      e.preventDefault();
      const dlg = a.closest('dialog');
      if (dlg) dlg.close();
      go(a.getAttribute('href').slice(1));
    });
    window.addEventListener('popstate', () => go(location.hash.slice(1) || 'top', false));
    go(location.hash.slice(1) || 'top', false);
  }

  /* ---------- 헤더 ---------- */
  function initHeader() {
    const header = document.getElementById('header');
    const toggle = document.getElementById('navToggle');
    const nav = document.getElementById('nav');
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', open);
      toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
      header.classList.toggle('is-open', open);
      document.body.classList.toggle('no-scroll', open);
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (e) => { if (e.target.closest('a, button')) setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && header.classList.contains('is-open')) { setOpen(false); toggle.focus(); } });
    window.matchMedia('(min-width: 1081px)').addEventListener('change', (m) => m.matches && setOpen(false));
  }

  function initDialogs() {
    document.addEventListener('click', (e) => {
      const c = e.target.closest('[data-close]');
      if (c) c.closest('dialog').close();
      if (e.target.closest('[data-action="privacy"]')) document.getElementById('privacyDialog').showModal();
    });
    document.querySelectorAll('dialog.modal').forEach((d) => d.addEventListener('click', (e) => { if (e.target === d) d.close(); }));
  }

  /* ---------- 키트 카드 3D 기울기 ---------- */
  function initTilt() {
    if (reduce || !window.matchMedia('(hover: hover)').matches) return;
    const grid = document.getElementById('kitGrid');
    grid.addEventListener('pointermove', (e) => {
      const card = e.target.closest('.kit-card:not(.kit-cta)');
      grid.querySelectorAll('.kit-card.is-tilt').forEach((c) => c !== card && c.classList.remove('is-tilt'));
      if (!card) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.classList.add('is-tilt');
      card.style.setProperty('--ry', ((x - 0.5) * 10).toFixed(2) + 'deg');
      card.style.setProperty('--rx', ((0.5 - y) * 8).toFixed(2) + 'deg');
      card.style.setProperty('--gx', x * 100 + '%');
      card.style.setProperty('--gy', y * 100 + '%');
    });
    grid.addEventListener('pointerleave', () => grid.querySelectorAll('.is-tilt').forEach((c) => c.classList.remove('is-tilt')));
  }

  // 이미지 로드 실패 시 빈 회색 대신 브랜드 톤 배경
  document.addEventListener('error', (e) => {
    if (e.target.tagName === 'IMG') e.target.classList.add('img-missing');
  }, true);

  document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    initDialogs();
    if (document.querySelector('.view')) {
      // index.html: 화면(뷰) 기반 메인 페이지
      RO.test.init();
      RO.products.init();
      RO.disaster.init();
      RO.cart.init();
      RO.shelter.init();
      RO.card.init();
      RO.hero.init();
      initTilt();
      initRouter();
    }
    if (RO.make) RO.make.init(); // make.html: 우리집 재료로 만들기
    RO.icons();
    const y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
  });
})(window.RO);
