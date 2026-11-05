/* BLACK-OUT : MARS — 히어로 효과: 바람에 흐르는 파란 입자 + 거주구 상태 HUD
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
      const n = Math.round(Math.min(220, w / 6));
      parts = Array.from({ length: n }, () => spawn(true));
    };
    // 화성 먼지폭풍: 바람에 날리는 붉은 먼지(대부분) + 빛을 받아 반짝이는 입자(일부)
    const spawn = (anywhere) => {
      const ember = Math.random() < 0.18;
      return {
        x: anywhere ? Math.random() * w : -10, y: Math.random() * h,
        r: ember ? 0.8 + Math.random() * 1.8 : 0.8 + Math.random() * 2.6,
        vy: (Math.random() - 0.6) * 0.5, vx: 0.8 + Math.random() * 2.2,
        life: Math.random() * Math.PI * 2, ember
      };
    };

    function frame(t) {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
      for (const p of parts) {
        p.life += 0.03;
        p.x += p.vx + Math.sin(p.life) * 0.4; // 강한 바람에 옆으로 날림
        p.y += p.vy;
        if (p.y < -10 || p.y > h + 10 || p.x > w + 10) Object.assign(p, spawn(false));
        const a = p.ember ? 0.55 + Math.sin(p.life * 3) * 0.35 : 0.18;
        if (p.ember) {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
          g.addColorStop(0, `rgba(124,196,255,${a})`);
          g.addColorStop(0.4, `rgba(2,74,216,${a * 0.45})`);
          g.addColorStop(1, 'rgba(2,74,216,0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.fillStyle = `rgba(2,74,216,${a * 0.9})`;
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

    // 거주구 상태 HUD (시연용 가상 수치): 신호 지연 카운트, 산소·먼지·발전량이 조금씩 변함
    let delay = 12 * 60 + 41, tau = 4.2, power = 38;
    const $ = (id) => document.getElementById(id);
    setInterval(() => {
      if (!running) return;
      delay = Math.max(180, delay + (Math.random() < 0.5 ? -1 : 1));
      tau = Math.min(6.5, Math.max(3.4, tau + (Math.random() - 0.45) * 0.08));
      power = Math.round(Math.max(18, Math.min(45, 62 - tau * 6 + (Math.random() - 0.5) * 2)));
      if ($('hudDelay')) {
        $('hudDelay').textContent = `${Math.floor(delay / 60)}:${String(delay % 60).padStart(2, '0')}`;
        $('hudTau').textContent = tau.toFixed(1);
        $('hudO2').textContent = (20.8 + Math.random() * 0.2).toFixed(1);
        $('hudPower').style.width = power + '%';
        $('hudPowerTxt').textContent = power + '%';
      }
    }, 1000);
  }

  RO.hero = { init };
})(window.RO);
