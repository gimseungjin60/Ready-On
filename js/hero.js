/* BLACK-OUT — 히어로 효과: 떠오르는 불씨·재 파티클 + 마우스를 따라가는 손전등 불빛
   마우스가 없거나 멈춰 있으면 불빛이 천천히 스스로 움직입니다(발표 화면용). */
(function (RO) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init() {
    const hero = document.querySelector('.hero');
    const canvas = document.getElementById('heroFx');
    if (!hero || !canvas || reduce) return;
    const ctx = canvas.getContext('2d');
    let w, h, dpr, parts = [], running = false, lastMove = 0;
    const mouse = { x: 0.68, y: 0.42 }, light = { x: 0.68, y: 0.42 };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = hero.clientWidth; h = hero.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(140, w / 9));
      parts = Array.from({ length: n }, () => spawn(true));
    };
    // ember: 붉게 빛나는 불씨, ash: 회색 재
    const spawn = (anywhere) => {
      const ember = Math.random() < 0.55;
      return {
        x: Math.random() * w, y: anywhere ? Math.random() * h : h + 10,
        r: ember ? 0.8 + Math.random() * 2.2 : 1 + Math.random() * 2.5,
        vy: -(0.25 + Math.random() * (ember ? 1.4 : 0.6)), vx: (Math.random() - 0.5) * 0.4,
        life: Math.random() * Math.PI * 2, ember
      };
    };

    function frame(t) {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (const p of parts) {
        p.life += 0.03;
        p.x += p.vx + Math.sin(p.life) * 0.35 + 0.15; // 바람에 살짝 흔들리며
        p.y += p.vy;
        if (p.y < -10 || p.x > w + 10) Object.assign(p, spawn(false));
        const a = p.ember ? 0.55 + Math.sin(p.life * 3) * 0.35 : 0.18;
        if (p.ember) {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
          g.addColorStop(0, `rgba(255,190,120,${a})`);
          g.addColorStop(0.4, `rgba(230,40,0,${a * 0.6})`);
          g.addColorStop(1, 'rgba(230,0,0,0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.fillStyle = `rgba(200,190,185,${a})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        }
      }
      // 손전등: 마우스가 3초 이상 멈추면 스스로 천천히 움직임
      if (t - lastMove > 3000) {
        mouse.x = 0.62 + Math.sin(t / 2600) * 0.22;
        mouse.y = 0.42 + Math.sin(t / 1900) * 0.14;
      }
      light.x += (mouse.x - light.x) * 0.06;
      light.y += (mouse.y - light.y) * 0.06;
      hero.style.setProperty('--mx', (light.x * 100).toFixed(2) + '%');
      hero.style.setProperty('--my', (light.y * 100).toFixed(2) + '%');
      requestAnimationFrame(frame);
    }

    const start = () => { if (!running) { running = true; requestAnimationFrame(frame); } };
    const stop = () => { running = false; };

    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) / r.width;
      mouse.y = (e.clientY - r.top) / r.height;
      lastMove = performance.now();
    });
    window.addEventListener('resize', resize);
    // 홈 화면이 보일 때만 그리기 (다른 페이지에서는 CPU 아끼기)
    RO.on('view', (id) => { if (id === 'top') { resize(); start(); } else stop(); });
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : hero.classList.contains('is-active') && start()));
    if (hero.classList.contains('is-active')) { resize(); start(); }
  }

  RO.hero = { init };
})(window.RO);
