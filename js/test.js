/* BLACK-OUT — 재난 대비력 테스트 (10문항) + 결과 산출 + 결과 섹션 렌더링
   Q1~Q3(거주 형태·동거·층수)은 점수 없이 맞춤 추천에만 사용, Q4~Q10은 0~2점 → 100점 환산 */
(function (RO) {
  // 화성 거주자용. id는 내부 키(예: food=비상 산소, quake=기압 손실 행동요령)로 결과·대피 카드와 연결됩니다.
  const QUESTIONS = [
    { id: 'housing', q: '화성 어디에서 살고 있나요?', opts: ['돔 도시', '지하 거주 구역', '개인 거주 모듈', '이동형 로버', '외곽 연구 기지'] },
    { id: 'living', q: '누구와 함께 살고 있나요?', opts: ['혼자', '가족과 함께', '연구팀 동료와 함께'] },
    { id: 'floor', q: '주변에 구조 로봇이나 AI 보조 도우미가 있나요?', opts: ['둘 다 있음', '하나만 있음', '없음'] },
    { id: 'food', q: '산소호흡기(비상 산소)가 몇 시간분 있나요?', opts: ['1인당 24시간 이상', '몇 시간분만 있음', '없음'], scores: [2, 1, 0] },
    { id: 'power', q: '전력이 끊길 때 쓸 비상 전원과 초고휘도 비상 라이트가 있나요?', opts: ['둘 다 있음', '하나만 있음', '둘 다 없음'], scores: [2, 1, 0] },
    { id: 'info', q: '비상 우주복을 바로 꺼내 입을 수 있나요?', opts: ['바로 입을 수 있음', '있지만 점검을 안 했음', '없음'], scores: [2, 1, 0] },
    { id: 'shelter', q: '가장 가까운 대피소와 대피 경로를 알고 있나요?', opts: ['정확히 알고 있음', '대략 알고 있음', '전혀 모름'], scores: [2, 1, 0] },
    { id: 'quake', q: '공기 누출 경보가 울리면 무엇부터 해야 하는지 알고 있나요?', opts: ['정확히 알고 있음', '일부 알고 있음', '잘 모름'], scores: [2, 1, 0] },
    { id: 'contact', q: '구조 로봇 호출 방법과 이웃과의 비상 연락 순서를 정해 두었나요?', opts: ['정해 두었음', '일부만 정했음', '정하지 않았음'], scores: [2, 1, 0] },
    { id: 'kit', q: '나만의 화성 비상 키트가 있나요?', opts: ['완성된 키트가 있음', '일부만 있음', '전혀 없음'], scores: [2, 1, 0] }
  ];

  const TYPES = [
    { min: 90, name: '레드 플래닛 생존 마스터', en: 'RED PLANET MASTER', desc: '통신이 끊긴 먼지 폭풍 속에서도 스스로 판단하고 움직일 수 있어요. 이제 이웃 거주민의 준비를 도와줄 차례예요.' },
    { min: 70, name: '준비된 개척자형', en: 'READY PIONEER', desc: '기본은 갖췄어요. 빈틈 몇 가지만 채우면 거주구 경보가 울려도 흔들리지 않을 거예요.' },
    { min: 40, name: '적응 중인 정착민형', en: 'SETTLING IN', desc: '준비를 시작했지만 경보가 울리는 순간 빠진 것이 생길 수 있어요. 부족한 것부터 하나씩 채워요.' },
    { min: 0, name: '화성 미아형', en: 'LOST ON MARS', desc: '지구에 물어볼 수 없는 22분 동안 길을 잃을 수 있어요. 오늘 하나만 준비해도 결과는 달라져요.' }
  ];

  // 점수 문항별 "부족할 때" 안내. kits: 추천 가중치
  const GAPS = {
    food: { label: '산소호흡기', icon: 'wind', action: '1인당 24시간분 이상의 산소호흡기와 휴대용 산소를 침실과 작업 공간 가까이에 두세요.', kits: { 'kit-depress': 3, 'kit-suit': 1, 'kit-solo': 1 }, link: '#kit', linkLabel: '공기 누출 대응 키트 보기' },
    power: { label: '비상 전원·라이트', icon: 'battery-charging', action: '먼지 폭풍으로 태양광 발전이 몇 주 줄어도 버틸 비상 배터리와 초고휘도 비상 라이트를 준비하세요.', kits: { 'kit-dust': 3 }, link: '#kit', linkLabel: '먼지 폭풍 대비 키트 보기' },
    info: { label: '비상 우주복', icon: 'shirt', action: '비상 우주복은 한 달에 한 번 꺼내 입어 보고, 산소 연결부와 헬멧 씰을 점검하세요.', kits: { 'kit-suit': 3 }, link: '#kit', linkLabel: '비상 우주복 세트 보기' },
    shelter: { label: '대피소·대피 경로', icon: 'map-pin', action: '가장 가까운 지하 방사선 대피소와 돔 비상 대피 구역까지 가는 길을 미리 걸어 보세요.', kits: { 'kit-solar': 1 }, link: '#shelter', linkLabel: '정착지 지도 보기' },
    quake: { label: '공기 누출 행동요령', icon: 'gauge', action: '경보가 울리면 산소호흡기 착용 → 사람 모으기 → 해치 닫아 격리. 이 순서를 몸에 익혀 두세요.', kits: { 'kit-depress': 2 }, link: '#guide', linkLabel: '공기 누출 행동수칙 보기' },
    contact: { label: '구조 로봇·이웃 연락', icon: 'bot', action: '구조 로봇 호출 코드와 이웃 거주민 연락 순서를 정하고, 통신이 끊기면 만날 대피소를 약속하세요.', kits: { 'kit-comm': 3 }, link: '#offline-card', linkLabel: '비상 연락 카드 만들기' },
    kit: { label: '개인 비상 키트', icon: 'backpack', action: '산소호흡기·라이트·보온 담요가 든 개인 비상 키트를 해치 가까이에 두세요.', kits: { 'kit-solo': 2, 'kit-aid': 2, 'kit-suit': 1 }, link: '#kit', linkLabel: '맞춤 키트 보기' }
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
    const H = { '돔 도시': ['돔 도시 거주', '돔에 구멍이 나면 넓은 공간의 공기가 한꺼번에 빠져요. 가장 가까운 돔 비상 대피 구역과 산소호흡기 위치를 꼭 알아 두세요.', { 'kit-depress': 3 }],
      '지하 거주 구역': ['지하 거주', '방사선에는 가장 안전하지만 화성 지진 때 출구가 막힐 수 있어요. 지상으로 나가는 비상 통로 두 곳을 확인하세요.', { 'kit-aid': 1, 'kit-comm': 1 }],
      '개인 거주 모듈': ['개인 거주 모듈', '공간이 작아 산소가 빨리 줄어요. 산소호흡기를 손 닿는 곳에 두고, 이웃 모듈과 체크인을 약속하세요.', { 'kit-solo': 3, 'kit-depress': 1 }],
      '이동형 로버': ['이동형 로버 거주', '로버는 차폐가 얇아요. 태양 방사선 경보가 오면 가까운 지하 대피소로 가고, 산소·전력은 귀환 거리보다 넉넉히 실어 두세요.', { 'kit-solar': 2, 'kit-dust': 2 }],
      '외곽 연구 기지': ['외곽 연구 기지', '구조가 오기까지 며칠이 걸릴 수 있어요. 통신 비콘과 선외활동 자가구조 장비를 준비하고, 비축은 14솔 이상으로 잡으세요.', { 'kit-comm': 2, 'kit-orbit': 2, 'kit-dust': 1 }] };
    if (H[housing]) { tips.push({ t: H[housing][0], d: H[housing][1] }); addW(H[housing][2]); }
    if (floor === 2) { tips.push({ t: '구조 로봇·AI 도우미 없음', d: '도와줄 로봇이 없으면 모든 판단을 내가 해야 해요. 조난 신호 비콘을 늘 충전해 두고, 이웃 1명과 하루 한 번 체크인하세요.' }); addW({ 'kit-comm': 2 }); }
    if (living === 0) { tips.push({ t: '혼자 거주', d: '쓰러지면 알려 줄 사람이 없어요. 구조 로봇의 자동 안부 확인을 켜 두고, 이웃과 체크인을 약속하세요.' }); addW({ 'kit-solo': 2 }); }
    if (living === 1) { tips.push({ t: '가족과 거주', d: '아이에게 맞는 소형 산소호흡기를 따로 준비하고, 경보가 울리면 모일 대피소를 가족 모두가 알게 하세요.' }); addW({ 'kit-suit': 1 }); }
    if (living === 2) { tips.push({ t: '연구팀 동료와 거주', d: '누가 해치를 닫고 누가 인원을 확인할지 역할을 미리 나눠 두면 경보 때 우왕좌왕하지 않아요.' }); }

    // 기본 응급처치 키트는 항상 후보
    addW({ 'kit-aid': 0.5 });
    const kits = Object.entries(weights).sort((a, b) => b[1] - a[1]).map(([k]) => k).slice(0, 3);

    return { score, type, gaps, checks, tips: tips.slice(0, 3), kits, housing, robot: floor !== 2, livingLabel: QUESTIONS[1].opts[living], floorLabel: '구조 로봇·AI ' + QUESTIONS[2].opts[floor], date: new Date().toISOString() };
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
