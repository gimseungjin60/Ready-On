/* READY : ON — 재난 대비력 테스트 (10문항) + 결과 산출 + 결과 섹션 렌더링
   Q1~Q3(거주 형태·동거·층수)은 점수 없이 맞춤 추천에만 사용, Q4~Q10은 0~2점 → 100점 환산 */
(function (RO) {
  const QUESTIONS = [
    { id: 'housing', q: '현재 거주 형태는 무엇인가요?', opts: ['아파트', '오피스텔', '원룸', '단독주택', '기타'] },
    { id: 'living', q: '현재 혼자 거주하고 있나요?', opts: ['혼자 거주', '가족과 거주', '룸메이트와 거주'] },
    { id: 'floor', q: '현재 거주하는 층수는?', opts: ['저층 (1~3층)', '중층 (4~10층)', '고층 (11층 이상)', '해당 없음'] },
    { id: 'food', q: '집에 비상식량과 식수가 준비되어 있나요?', opts: ['충분히 준비되어 있음', '일부만 준비되어 있음', '전혀 없음'], scores: [2, 1, 0] },
    { id: 'power', q: '정전이 발생했을 때 사용할 손전등이나 보조배터리가 있나요?', opts: ['둘 다 있음', '하나만 있음', '둘 다 없음'], scores: [2, 1, 0] },
    { id: 'info', q: '인터넷과 휴대전화 통신이 끊기면 필요한 정보를 어떻게 확인할 수 있나요?', opts: ['오프라인 자료가 준비되어 있음', '주변 사람에게 물어볼 것', '어떻게 해야 할지 모르겠음'], scores: [2, 1, 0] },
    { id: 'shelter', q: '집 주변 대피소 위치를 알고 있나요?', opts: ['정확히 알고 있음', '대략 알고 있음', '전혀 모름'], scores: [2, 1, 0] },
    { id: 'quake', q: '지진이 발생했을 때 올바른 행동수칙을 알고 있나요?', opts: ['정확히 알고 있음', '일부 알고 있음', '잘 모름'], scores: [2, 1, 0] },
    { id: 'contact', q: '가족이나 지인과 재난 발생 시 연락 및 만남 방법을 정해 두었나요?', opts: ['정해 두었음', '일부 정해 두었음', '정하지 않았음'], scores: [2, 1, 0] },
    { id: 'kit', q: '현재 나만의 재난 대비 키트가 있나요?', opts: ['완성된 키트가 있음', '필요한 물품 일부만 있음', '전혀 없음'], scores: [2, 1, 0] }
  ];

  const TYPES = [
    { min: 90, name: '생존 마스터형', en: 'SURVIVAL MASTER', desc: '인터넷이 끊겨도 스스로 판단하고 움직일 준비가 되어 있어요. 이제 주변 사람의 준비를 도와줄 차례입니다.' },
    { min: 70, name: '준비된 생존형', en: 'READY SURVIVOR', desc: '기본기는 탄탄합니다. 빈틈 몇 가지만 채우면 어떤 상황에서도 흔들리지 않을 수 있어요.' },
    { min: 40, name: '아직 준비 중인 생존형', en: 'GEARING UP', desc: '준비를 시작했지만 결정적인 순간에 빠진 것이 생길 수 있어요. 부족한 항목부터 하나씩 채워 보세요.' },
    { min: 0, name: 'AI 없으면 얼음형', en: 'FROZEN OFFLINE', desc: '스마트폰과 인터넷이 멈추는 순간 판단도 멈출 수 있어요. 오늘 하나만 준비해도 결과는 달라집니다.' }
  ];

  // 점수 문항별 "부족할 때" 안내. kits: 추천 가중치
  const GAPS = {
    food: { label: '비상식량·식수', icon: 'droplets', action: '1인당 3일분의 식수와 바로 먹을 수 있는 비상식량을 준비하세요.', kits: { 'kit-72h': 3, 'kit-solo': 2, 'kit-quake': 1 }, link: '#kit', linkLabel: '식량·식수 키트 보기' },
    power: { label: '조명·보조전원', icon: 'flashlight', action: '손전등과 충전된 보조배터리를 손이 닿는 곳에 두세요. 촛불은 화재 위험이 있습니다.', kits: { 'kit-night': 3 }, link: '#kit', linkLabel: '정전 대비 키트 보기' },
    info: { label: '오프라인 정보', icon: 'wifi-off', action: '오프라인 대피 카드를 출력해 현관·냉장고에 붙여 두세요. 휴대용 라디오도 도움이 됩니다.', kits: { 'kit-night': 1 }, link: '#offline-card', linkLabel: '대피 카드 만들기' },
    shelter: { label: '대피소 위치', icon: 'map-pin', action: '집·직장 주변 대피소를 미리 확인하고 걸어서 가는 길을 한 번 걸어 보세요.', kits: {}, link: '#shelter', linkLabel: '대피소 찾기' },
    quake: { label: '지진 행동요령', icon: 'activity', action: '흔들릴 땐 탁자 아래, 멈추면 전기·가스 차단 후 계단으로. 핵심 순서를 익혀 두세요.', kits: { 'kit-quake': 2 }, link: '#guide', linkLabel: '지진 행동수칙 보기' },
    contact: { label: '연락·만남 계획', icon: 'users', action: '통신이 끊길 때를 대비해 만날 장소 두 곳과 연락 순서를 가족·지인과 정해 두세요.', kits: {}, link: '#offline-card', linkLabel: '비상 연락처 카드 만들기' },
    kit: { label: '비상 키트', icon: 'backpack', action: '현관 가까이에 바로 들고 나갈 수 있는 비상 가방을 하나 만들어 두세요.', kits: { 'kit-72h': 2, 'kit-solo': 2, 'kit-aid': 2 }, link: '#kit', linkLabel: '맞춤 키트 보기' }
  };

  let answers = RO.store.get('testAnswers', {}) || {};
  let step = 0;

  function compute(ans) {
    const scored = QUESTIONS.filter((q) => q.scores);
    const raw = scored.reduce((s, q) => s + q.scores[ans[q.id]], 0);
    const score = Math.round((raw / (scored.length * 2)) * 100);
    const type = TYPES.find((t) => score >= t.min);

    // 부족 항목: 점수 낮은 순, 동점이면 문항 순서 (생존 직결 항목이 앞)
    const gaps = scored
      .filter((q) => q.scores[ans[q.id]] < 2)
      .map((q) => ({ id: q.id, pts: q.scores[ans[q.id]] }))
      .sort((a, b) => a.pts - b.pts)
      .slice(0, 3)
      .map((g) => ({ ...GAPS[g.id], id: g.id, pts: g.pts, answer: QUESTIONS.find((q) => q.id === g.id).opts[ans[g.id]] }));
    const checks = scored.map((q) => ({ id: q.id, label: GAPS[q.id].label, pts: q.scores[ans[q.id]] }));

    // 프로필 기반 맞춤 (Q1~Q3)
    const housing = QUESTIONS[0].opts[ans.housing];
    const living = ans.living;
    const floor = ans.floor;
    const weights = {};
    const addW = (map) => Object.entries(map).forEach(([k, v]) => { weights[k] = (weights[k] || 0) + v; });
    scored.forEach((q) => { if (q.scores[ans[q.id]] < 2) addW(GAPS[q.id].kits); });

    const tips = [];
    if (floor === 2) { tips.push({ t: '고층 거주', d: '지진·화재 시 엘리베이터 대신 계단으로 대피합니다. 비상계단 위치와 우리 층 대피 경로를 미리 걸어 보세요.' }); addW({ 'kit-quake': 2, 'kit-fire': 2 }); }
    if (floor === 0 || housing === '단독주택') { tips.push({ t: '저층·단독주택 거주', d: '집중호우 때 침수 위험이 상대적으로 큽니다. 물이 들어오면 지하·반지하에서 즉시 벗어나 높은 곳으로 이동하세요.' }); addW({ 'kit-flood': 3 }); }
    if (housing === '아파트' && floor !== 2) { tips.push({ t: '아파트 거주', d: '다른 세대 화재 시 연기가 들어오지 않으면 무리하게 이동하지 말고 안내방송을 확인하는 "살펴서 대피" 요령을 알아 두세요.' }); addW({ 'kit-fire': 1 }); }
    if (living === 0) { tips.push({ t: '1인 가구', d: '내 상황을 대신 알려 줄 사람이 없습니다. 지인 1명과 재난 시 안부 확인 방법을 약속하고, 비상 연락처를 종이로 보관하세요.' }); addW({ 'kit-solo': 3 }); }
    if (living === 1) { tips.push({ t: '가족과 거주', d: '가족이 흩어져 있을 때 만날 장소 두 곳(집 근처·동네 밖)을 정하고, 키트는 인원수에 맞춰 준비하세요.' }); addW({ 'kit-72h': 2 }); }
    if (living === 2) { tips.push({ t: '룸메이트와 거주', d: '비상용품 위치와 대피 장소를 함께 공유해 두세요. 한 사람만 알고 있으면 소용이 없습니다.' }); }
    if (housing === '원룸' || housing === '오피스텔') addW({ 'kit-solo': 1 });

    // 기본 응급처치 키트는 항상 후보
    addW({ 'kit-aid': 0.5 });
    const kits = Object.entries(weights).sort((a, b) => b[1] - a[1]).map(([k]) => k).slice(0, 3);

    return { score, type, gaps, checks, tips: tips.slice(0, 3), kits, housing, livingLabel: QUESTIONS[1].opts[living], floorLabel: QUESTIONS[2].opts[floor], date: new Date().toISOString() };
  }

  const getResult = () => {
    const a = RO.store.get('testAnswers', null);
    return a && QUESTIONS.every((q) => Number.isInteger(a[q.id])) ? compute(a) : null;
  };

  /* ---------- 테스트 모달 ---------- */
  const dlg = () => document.getElementById('testDialog');

  function renderStep() {
    const q = QUESTIONS[step];
    const d = dlg();
    d.querySelector('#qNum').textContent = String(step + 1).padStart(2, '0');
    d.querySelector('#testTitle').textContent = q.q;
    const bar = d.querySelector('.progress');
    bar.setAttribute('aria-valuenow', step + 1);
    bar.firstElementChild.style.width = ((step + 1) / QUESTIONS.length) * 100 + '%';
    d.querySelector('.test-options').innerHTML = q.opts.map((o, i) => `
      <label class="opt">
        <input type="radio" name="opt" value="${i}" ${answers[q.id] === i ? 'checked' : ''}>
        <span class="opt-key">${String.fromCharCode(65 + i)}</span>
        <span class="opt-label">${o}</span>
      </label>`).join('');
    d.querySelector('#testPrev').disabled = step === 0;
    const next = d.querySelector('#testNext');
    next.disabled = !Number.isInteger(answers[q.id]);
    next.innerHTML = step === QUESTIONS.length - 1 ? '결과 보기 <i data-lucide="sparkles" aria-hidden="true"></i>' : '다음 <i data-lucide="arrow-right" aria-hidden="true"></i>';
    RO.icons();
    const body = d.querySelector('.test-body');
    body.classList.remove('is-swap'); void body.offsetWidth; body.classList.add('is-swap');
  }

  function start() {
    answers = {};
    step = 0;
    renderStep();
    dlg().showModal();
  }

  function finish() {
    RO.store.set('testAnswers', answers);
    dlg().close();
    const r = getResult();
    renderResult(r);
    RO.emit('result', r);
    RO.go('result');
  }

  /* ---------- 결과 섹션 ---------- */
  function renderResult(r) {
    const sec = document.getElementById('result');
    const testCta = document.getElementById('testReview');
    if (!r) { sec.hidden = true; testCta.hidden = true; return; }
    sec.hidden = false;
    testCta.hidden = false;
    const C = 2 * Math.PI * 88;
    const kits = r.kits.map(RO.products.find).filter(Boolean);
    document.getElementById('resultBody').innerHTML = `
      <div class="result-hero">
        <div class="gauge" role="img" aria-label="재난 대비 점수 100점 만점에 ${r.score}점">
          <svg viewBox="0 0 200 200" aria-hidden="true">
            <circle cx="100" cy="100" r="88" class="gauge-track"/>
            <circle cx="100" cy="100" r="88" class="gauge-fill" style="stroke-dasharray:${C};stroke-dashoffset:${C}" data-offset="${C * (1 - r.score / 100)}"/>
          </svg>
          <div class="gauge-num"><b data-count="${r.score}">${r.score}</b><span>/ 100</span></div>
        </div>
        <div class="result-type">
          <p class="result-en">${r.type.en}</p>
          <h3 class="result-name">${r.type.name}</h3>
          <p class="result-desc">${r.type.desc}</p>
          <p class="result-profile">${r.housing}<span aria-hidden="true">/</span>${r.livingLabel}<span aria-hidden="true">/</span>${r.floorLabel}</p>
          <div class="scale" aria-hidden="true">
            ${[...TYPES].reverse().map((t) => `<span class="${t === r.type ? 'is-on' : ''}">${t.name}</span>`).join('')}
          </div>
        </div>
      </div>

      <div class="diag">
        <section class="diag-main" aria-labelledby="prioTitle">
          <header class="diag-head">
            <p class="diag-kicker">PRIORITY</p>
            <h3 id="prioTitle">가장 먼저 채울 ${r.gaps.length || ''}가지</h3>
          </header>
          ${r.gaps.length ? `<ol class="prio">${r.gaps.map((g, i) => `
            <li class="prio-row ${i === 0 ? 'is-first' : ''}">
              <span class="prio-no" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
              <div class="prio-body">
                <h4 class="prio-label">${g.label}</h4>
                <p class="prio-answer">내 답변 · ${g.answer}</p>
                <p class="prio-action">${g.action}</p>
              </div>
              <a class="prio-link" href="${g.link}">${g.linkLabel}<i data-lucide="arrow-up-right" aria-hidden="true"></i></a>
            </li>`).join('')}</ol>`
          : '<p class="prio-empty">비어 있는 항목이 없어요. 지금처럼 유지하면서 키트 속 식량·배터리의 유통기한만 6개월마다 확인해 주세요.</p>'}
        </section>

        <aside class="diag-side" aria-labelledby="checkTitle">
          <header class="diag-head">
            <p class="diag-kicker">CHECKLIST</p>
            <h3 id="checkTitle">7개 항목 진단</h3>
          </header>
          <ul class="meter">${r.checks.map((c) => `
            <li class="meter-row is-v${c.pts}">
              <span class="meter-label">${c.label}</span>
              <span class="meter-bar" aria-hidden="true"><i></i><i></i></span>
              <span class="meter-state">${['준비 안 됨', '일부만', '준비됨'][c.pts]}</span>
            </li>`).join('')}</ul>
          <p class="meter-sum"><b>${r.checks.filter((c) => c.pts === 2).length}</b> / 7 항목 준비 완료</p>
        </aside>
      </div>

      ${r.tips.length ? `
      <section class="fit" aria-labelledby="fitTitle">
        <header class="diag-head">
          <p class="diag-kicker">FOR MY HOME</p>
          <h3 id="fitTitle">우리 집 상황에 맞춘 행동수칙</h3>
        </header>
        <ul class="fit-list">${r.tips.map((t) => `
          <li><p class="fit-tag">${t.t}</p><p class="fit-text">${t.d}</p></li>`).join('')}</ul>
      </section>` : ''}

      <section class="result-kits">
        <div class="result-kits-head">
          <header class="diag-head">
            <p class="diag-kicker">RECOMMENDED KIT</p>
            <h3>내 결과에 맞춘 추천 키트</h3>
          </header>
          <button class="btn btn-outline btn-sm" data-add="${kits.map((k) => k.id).join(',')}">추천 키트 모두 담기</button>
        </div>
        <div class="mini-kits">${kits.map((k) => `
          <article class="mini-kit">
            <img src="${k.img}" alt="" loading="lazy" width="160" height="120">
            <div>
              <p class="mini-kit-name">${k.name}</p>
              <p class="mini-kit-price">${RO.won(k.price)} <small>가상 가격</small></p>
            </div>
            <button class="icon-btn icon-btn-red" data-add="${k.id}" aria-label="${k.name} 담기"><i data-lucide="plus" aria-hidden="true"></i></button>
          </article>`).join('')}</div>
      </section>

      <div class="result-actions">
        <a class="btn btn-primary" href="#kit">맞춤 키트 확인하기</a>
        <a class="btn btn-ghost-dark" href="#offline-card">오프라인 대피 카드 만들기</a>
        <button class="btn btn-ghost-dark" data-action="start-test"><i data-lucide="rotate-ccw" aria-hidden="true"></i>테스트 다시 하기</button>
      </div>
      <p class="result-note">이 결과는 평상시 대비 수준을 점검하기 위한 참고용입니다. 실제 재난 시에는 정부·관계기관의 공식 안내를 따르세요.</p>`;
    RO.icons();
    if (sec.classList.contains('is-active')) animateGauge();
  }

  // 결과 화면에 들어올 때마다 게이지·점수 애니메이션
  function animateGauge() {
    const sec = document.getElementById('result');
    const f = sec.querySelector('.gauge-fill');
    if (!f) return;
    f.style.transition = 'none';
    f.style.strokeDashoffset = f.style.strokeDasharray;
    void f.getBoundingClientRect();
    f.style.transition = '';
    setTimeout(() => { f.style.strokeDashoffset = f.dataset.offset; }, 250);
    RO.countUp(sec.querySelector('.gauge-num'));
  }

  function init() {
    const d = dlg();
    d.querySelector('.test-options').addEventListener('change', (e) => {
      answers[QUESTIONS[step].id] = Number(e.target.value);
      d.querySelector('#testNext').disabled = false;
    });
    // 옵션 더블클릭/엔터로 빠르게 다음
    d.querySelector('.test-options').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && Number.isInteger(answers[QUESTIONS[step].id])) d.querySelector('#testNext').click();
    });
    d.querySelector('#testPrev').addEventListener('click', () => { if (step > 0) { step--; renderStep(); } });
    d.querySelector('#testNext').addEventListener('click', () => {
      if (!Number.isInteger(answers[QUESTIONS[step].id])) return;
      if (step < QUESTIONS.length - 1) { step++; renderStep(); d.querySelector('.test-options input')?.focus(); }
      else finish();
    });
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="start-test"]')) {
        document.querySelectorAll('dialog[open]').forEach((x) => x !== d && x.close());
        start();
      }
    });
    renderResult(getResult());
    RO.on('view', (id) => id === 'result' && animateGauge());
  }

  RO.test = { init, getResult, compute, QUESTIONS };
})(window.RO);
