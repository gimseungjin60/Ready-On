/* BLACK-OUT : MARS — 거주구 맞춤 키트 계산 (정착지 지도 화면의 '필요 물품' 탭)
   계산 구조는 팀원 readykit 엔진과 같습니다: 공통 기본 + 재난별 모듈, 같은 물품은 큰 값 하나만(중복 합산 없음),
   소모품만 기간에 비례하고 공동 장비는 기간·인원과 무관.
   1인 1솔(화성의 하루, 약 24시간 40분) 소비량은 NASA 생명유지 기준 문서(BVAD)의 대표값을 참고한 계획값입니다.
     산소 0.84kg · 물 3L(마실 물 + 음식 조리) · 식량 1.8kg(포장 포함)
   비축 기간은 shelter.js의 정착지 거리 정책(3/7/14/30솔). 가격·무게는 시연용 가상 값. */
(function (RO) {
  const HAZARDS = [
    { id: 'all', name: '종합 대비' },
    { id: 'dust', name: '먼지 폭풍' },
    { id: 'solar', name: '태양 방사선' },
    { id: 'quake', name: '화성 지진' },
    { id: 'meteor', name: '운석 충돌' },
    { id: 'depress', name: '공기 누출' },
    { id: 'fire', name: '내부 화재' },
    { id: 'life', name: '생명유지 고장' },
    { id: 'power', name: '전력 차단' },
    { id: 'cold', name: '난방 고장' }
  ];
  const CATS = { air: '산소·물·식량', power: '전력·조명', care: '생명유지·응급', protect: '보호 장비', leak: '누출·화재 대응' };

  // [id, 이름, 단위, 분류, 규칙, 값, 설명]  규칙: 소모품(1인 1솔당) / 개인(1인당) / 공동(가구당 고정) / 공동기간(가구당, N솔마다 1개)
  const COMMON = [
    ['o2', '비상 산소', 'kg', 'air', '소모품', 0.84, 'NASA 기준 1인 1솔 0.84kg'],
    ['water', '비상 식수', 'L', 'air', '소모품', 3, '마실 물·음식 조리용 계획값'],
    ['food', '비상식', 'kg', 'air', '소모품', 1.8, '조리 없이 먹는 식품, 포장 포함'],
    ['co2', 'CO₂ 흡착 카트리지', '개', 'care', '소모품', 1, '1인 1솔 1개 계획값'],
    ['o2mask', '산소호흡기', '개', 'care', '개인', 1, '침실·작업 공간 가까이'],
    ['headlamp', '초고휘도 비상 라이트', '개', 'power', '개인', 1, '두 손을 쓸 수 있는 머리띠형'],
    ['firstaid', '저중력 응급 의료 키트', '세트', 'care', '공동', 1, '고정 끈 정리형'],
    ['beacon', '조난 신호 비콘', '개', 'care', '공동', 1, '기지망이 끊겨도 위치 송신'],
    ['battery', '비상 배터리팩 2kWh', '개', 'power', '공동기간', 7, '7솔마다 1개 계획값']
  ];
  const MODULES = {
    depress: [['o2cyl', '휴대용 산소통(6시간)', '개', 'care', '개인', 1, '대피 구역까지 이동용'], ['regulator', '휴대용 압력 조절기', '개', 'leak', '개인', 1, '산소 공급 압력 조절'], ['gauge', '휴대용 기압계', '개', 'leak', '공동', 1, '새는 속도 확인'], ['leak', '초음파 누출 탐지기', '개', 'leak', '공동', 1, '새는 곳 찾기'], ['patch', '누출 패치 키트', '세트', 'leak', '공동기간', 7, '7솔마다 1세트'], ['suit', '비상 우주복', '벌', 'protect', '개인', 1, '내부용 여압복']],
    quake: [['helmet', '충격 보호 헬멧', '개', 'protect', '개인', 1, '낙하물 대비'], ['gauge', '휴대용 기압계', '개', 'leak', '공동', 1, '흔들린 뒤 누출 확인']],
    meteor: [['patch', '누출 패치 키트', '세트', 'leak', '공동기간', 7, '7솔마다 1세트'], ['gauge', '휴대용 기압계', '개', 'leak', '공동', 1, '충격 뒤 누출 확인'], ['helmet', '충격 보호 헬멧', '개', 'protect', '개인', 1, '파편 대비']],
    power: [['battery', '비상 배터리팩 2kWh', '개', 'power', '공동기간', 3.5, '전력 차단 시 3.5솔마다 1개']],
    cold: [['blanket', '비상 보온 담요(은박)', '장', 'protect', '개인', 2, '1인 2장'], ['warmers', '보온팩', '개', 'protect', '소모품', 2, '1인 1솔 2개']],
    solar: [['dosimeter', '개인 선량계', '개', 'protect', '개인', 1, '누적 방사선 기록'], ['vest', '방사선 차폐 조끼', '벌', 'protect', '개인', 1, '가슴·배 장기 보호'], ['waterbag', '물 차폐 팩 세트', '세트', 'protect', '개인', 1, '누울 자리 주변 차폐'], ['cream', '방사선 피부 케어 크림 (보조)', '개', 'protect', '개인', 1, '피부 건조·자극 완화용, 입자 차단 효과 없음']],
    fire: [['extinguisher', '거주구용 CO₂ 소화기', '대', 'leak', '공동', 1, '작은 초기 화재용'], ['comask', '일산화탄소·연기 측정기', '개', 'leak', '공동', 1, '마스크 벗기 전 확인']],
    dust: [['dustmask', '방진 필터 마스크', '개', 'protect', '개인', 1, '과염소산염 먼지 차단'], ['battery', '비상 배터리팩 2kWh', '개', 'power', '공동기간', 3.5, '먼지폭풍 시 3.5솔마다 1개']],
    life: [['o2candle', '비상 산소 발생 캔들', '개', 'care', '공동', 2, '산소 발생 장치 고장 대비'], ['co2', 'CO₂ 흡착 카트리지', '개', 'care', '소모품', 1.5, '고장 시 1인 1솔 1.5개']]
  };

  // 구매 단위(SKU): pack = 한 개에 든 양, price(원)·kg은 시연용 가상 값
  const SKU = {
    o2: { pack: 1.68, label: '산소 캐니스터 1.68kg (1인 2솔분)', price: 45000, kg: 3.5 },
    water: { pack: 3, label: '비상 식수 팩 3L', price: 3000, kg: 3.1 },
    food: { pack: 1.8, label: '비상식 1솔분 1.8kg', price: 9000, kg: 1.8 },
    co2: { pack: 1, label: 'CO₂ 흡착 카트리지', price: 9000, kg: 1.2 },
    o2mask: { pack: 1, label: '산소호흡기', price: 39000, kg: 0.6 },
    headlamp: { pack: 1, label: '초고휘도 비상 라이트', price: 19000, kg: 0.2 },
    firstaid: { pack: 1, label: '저중력 응급 의료 키트', price: 99000, kg: 1.4 },
    beacon: { pack: 1, label: '조난 신호 비콘', price: 79000, kg: 0.8 },
    battery: { pack: 1, label: '비상 배터리팩 2kWh', price: 149000, kg: 12 },
    o2cyl: { pack: 1, label: '휴대용 산소통 6시간', price: 59000, kg: 3 },
    gauge: { pack: 1, label: '휴대용 기압계', price: 24000, kg: 0.3 },
    leak: { pack: 1, label: '초음파 누출 탐지기', price: 69000, kg: 0.5 },
    patch: { pack: 1, label: '누출 패치 키트', price: 18000, kg: 0.4 },
    suit: { pack: 1, label: '비상 우주복', price: 890000, kg: 8 },
    regulator: { pack: 1, label: '휴대용 압력 조절기', price: 89000, kg: 0.7 },
    helmet: { pack: 1, label: '충격 보호 헬멧', price: 39000, kg: 0.6 },
    blanket: { pack: 1, label: '비상 보온 담요(은박)', price: 9000, kg: 0.1 },
    warmers: { pack: 10, label: '보온팩 10개', price: 6000, kg: 0.5 },
    cream: { pack: 1, label: '방사선 피부 케어 크림 (보조)', price: 19000, kg: 0.15 },
    dosimeter: { pack: 1, label: '개인 선량계', price: 49000, kg: 0.1 },
    vest: { pack: 1, label: '방사선 차폐 조끼', price: 259000, kg: 12 },
    waterbag: { pack: 1, label: '물 차폐 팩 6개 세트', price: 29000, kg: 0.6 },
    extinguisher: { pack: 1, label: '거주구용 CO₂ 소화기', price: 59000, kg: 4.5 },
    comask: { pack: 1, label: '일산화탄소·연기 측정기', price: 39000, kg: 0.2 },
    dustmask: { pack: 1, label: '방진 필터 마스크', price: 22000, kg: 0.3 },
    o2candle: { pack: 1, label: '비상 산소 발생 캔들', price: 35000, kg: 1.2 }
  };
  const RULE_LABEL = { 소모품: '소모품', 개인: '개인 장비', 공동: '공동 장비', 공동기간: '공동 장비' };
  const PID = (id) => 'sk-' + id;
  RO.products.addItems(Object.entries(SKU).map(([id, s]) => ({ id: PID(id), name: s.label, price: s.price, icon: 'package-check' })));

  // 계산 엔진 (순수 함수): 1인 기준 required, 공동은 가구 기준
  function calculate({ hazards, days }) {
    const active = hazards.includes('all') ? Object.keys(MODULES) : hazards;
    const items = new Map();
    const add = ([id, name, unit, category, rule, value, spec], reason) => {
      const required = rule === '소모품' ? value * days : rule === '공동기간' ? Math.ceil(days / value) : value;
      const ex = items.get(id);
      if (ex) { // 같은 물품은 큰 값 하나만 (중복 합산 안 함)
        if (required > ex.required) Object.assign(ex, { required, rule, value, spec });
        ex.reasons.push(reason);
        return;
      }
      items.set(id, { id, name, unit, category, rule, value, spec, required, storage: rule.startsWith('공동') ? '거주구 비치' : '개인 휴대', reasons: [reason] });
    };
    COMMON.forEach((row) => add(row, '공통 기본'));
    active.forEach((h) => (MODULES[h] || []).forEach((row) => add(row, HAZARDS.find((x) => x.id === h).name)));
    return [...items.values()];
  }

  const $ = (id) => document.getElementById(id);
  const state = {
    hazards: RO.store.get('kitHazards', ['all']).filter((h) => HAZARDS.some((x) => x.id === h)),
    people: RO.store.get('kitPeople', 1),
    extraDays: RO.store.get('kitDays', 0),
    owned: RO.store.get('kitOwned', {}),
    buy: {}, loc: null, kit: null
  };
  if (!state.hazards.length) state.hazards = ['all'];
  const save = () => { RO.store.set('kitHazards', state.hazards); RO.store.set('kitPeople', state.people); RO.store.set('kitDays', state.extraDays); RO.store.set('kitOwned', state.owned); };
  const num = (n) => (Math.round(n * 100) / 100).toLocaleString('ko-KR');

  function lines(kit) {
    const people = state.people;
    return kit.items.map((it) => {
      const shared = it.rule.startsWith('공동');
      const need = shared ? it.required : it.required * people;
      const owned = Math.max(0, +state.owned[it.id] || 0);
      const lack = Math.max(0, need - owned);
      const sku = SKU[it.id];
      const recPacks = Math.ceil(lack / sku.pack - 1e-9);
      const packs = state.buy[it.id] ?? recPacks;
      const formula = it.rule === '소모품' ? `1인 1솔 ${num(it.value)}${it.unit} × ${kit.days}솔 × ${people}명`
        : it.rule === '개인' ? `1인 ${num(it.value)}${it.unit} × ${people}명`
        : it.rule === '공동기간' ? `${kit.days}솔 ÷ ${num(it.value)}솔마다 1개 · 가구 공용`
        : `가구당 ${num(it.value)}${it.unit} · 기간·인원과 무관`;
      return { ...it, need, owned, lack, sku, recPacks, packs, formula, diff: packs - recPacks };
    });
  }

  function compute() {
    if (!state.loc) return;
    const plan = state.loc.plan;
    const days = Math.max(plan.days, state.extraDays || 0);
    state.kit = { days, plan, items: calculate({ hazards: state.hazards, days }) };
    render();
  }

  function renderHazards() {
    $('hazardChips').innerHTML = HAZARDS.map((h) => `
      <button type="button" class="hz-chip ${state.hazards.includes(h.id) ? 'is-on' : ''}" data-hz="${h.id}" aria-pressed="${state.hazards.includes(h.id)}">${h.name}</button>`).join('');
  }

  function render() {
    const kit = state.kit;
    const L = lines(kit);
    const cost = L.reduce((s, l) => s + l.packs * l.sku.price, 0);
    const kg = L.reduce((s, l) => s + l.packs * l.sku.kg, 0);
    const changed = L.filter((l) => l.diff !== 0).length;
    $('kitResult').innerHTML = `
      <div class="kit-basis">
        <p class="kb-days"><b>${kit.days}솔</b> 대비 · ${state.people}명 ${state.extraDays > kit.plan.days ? `<em>추천 ${kit.plan.days}솔에서 직접 늘림</em>` : ''}</p>
        <p class="kb-why"><b>${RO.esc(state.loc.label)}</b> · ${kit.plan.label} — ${kit.plan.reason}</p>
        <p class="kb-note">1솔 = 화성의 하루(약 24시간 40분). 서비스 계획 가정이며 재난 확률이나 구조 시간을 예측한 값이 아니에요.</p>
      </div>
      ${Object.entries(CATS).map(([cat, label]) => {
        const rows = L.filter((l) => l.category === cat);
        if (!rows.length) return '';
        return `
          <section class="kit-cat">
            <h4>${label}</h4>
            <ul>${rows.map((l) => `
              <li class="kl ${l.diff < 0 ? 'is-short' : ''}" data-item="${l.id}">
                <div class="kl-top">
                  <p class="kl-name">${l.name}<span class="kl-rule">${RULE_LABEL[l.rule]} · ${l.storage}</span></p>
                  <p class="kl-need"><b>${num(l.need)}${l.unit}</b> 필요</p>
                </div>
                <p class="kl-formula">${l.formula}${l.reasons.length > 1 || l.reasons[0] !== '공통 기본' ? ` · 반영: ${[...new Set(l.reasons)].join(', ')}` : ''}</p>
                <div class="kl-row">
                  <label class="kl-own">있어요 <input type="number" min="0" step="any" inputmode="decimal" value="${l.owned || ''}" placeholder="0" data-own="${l.id}" aria-label="${l.name} 이미 있는 양(${l.unit})">${l.unit}</label>
                  <div class="kl-buy">
                    <span class="kl-sku">${l.sku.label}</span>
                    <div class="qty" role="group" aria-label="${l.name} 구매 수량">
                      <button type="button" data-buy="${l.id}" data-d="-1" aria-label="줄이기"><i data-lucide="minus" aria-hidden="true"></i></button>
                      <span class="kl-packs">${l.packs}</span>
                      <button type="button" data-buy="${l.id}" data-d="1" aria-label="늘리기"><i data-lucide="plus" aria-hidden="true"></i></button>
                    </div>
                  </div>
                </div>
                ${l.diff ? `<p class="kl-diff">${l.diff < 0
                  ? `추천보다 ${-l.diff}개 적어요 · <b>${num(Math.max(0, l.lack - l.packs * l.sku.pack))}${l.unit} 부족</b>`
                  : `추천보다 ${l.diff}개 많아요`} <button type="button" class="link-btn" data-reset="${l.id}">추천대로</button></p>` : ''}
              </li>`).join('')}</ul>
          </section>`;
      }).join('')}
      <ul class="kit-notes">
        <li>${state.people}명 기준 계획값이에요. 개인 장비는 인원만큼, 공동 장비는 가구당 고정이에요.</li>
        <li>재난을 여러 개 골라도 같은 물품은 가장 큰 필요량 하나만 반영해요.</li>
        <li>산소 0.84kg·식량 1.8kg은 NASA 생명유지 기준 문서의 1인 하루 대표값을 참고했어요. 나머지는 서비스 가정값이에요.</li>
      </ul>`;
    $('kitTotal').innerHTML = `<span>${L.reduce((s, l) => s + l.packs, 0)}개 · 약 ${num(kg)}kg (지구 무게 기준)</span><b>${RO.won(cost)}</b>${changed ? `<em>추천에서 ${changed}개 품목 바꿈</em>` : '<em>추천 그대로</em>'}`;
    $('kitToCart').disabled = !L.some((l) => l.packs > 0);
    RO.icons();
  }

  function addToCart() {
    const L = lines(state.kit).filter((l) => l.packs > 0);
    RO.cart.addMany(L.map((l) => ({ id: PID(l.id), qty: l.packs })), $('kitToCart'));
    RO.toast(`${L.length}개 품목을 장바구니에 담았어요 · 실제 결제는 되지 않아요`);
  }

  function init() {
    if (!$('kitResult')) return;
    renderHazards();
    $('kitPeople').textContent = state.people;
    $('kitDays').value = String(state.extraDays);
    $('hazardChips').addEventListener('click', (e) => {
      const b = e.target.closest('[data-hz]');
      if (!b) return;
      const id = b.dataset.hz;
      if (id === 'all') state.hazards = ['all'];
      else {
        const set = new Set(state.hazards.filter((h) => h !== 'all'));
        set.has(id) ? set.delete(id) : set.add(id);
        state.hazards = set.size ? [...set] : ['all'];
      }
      state.buy = {};
      save(); renderHazards(); RO.emit('hazards', state.hazards); compute();
    });
    $('kitPeopleBox').addEventListener('click', (e) => {
      const b = e.target.closest('[data-people]');
      if (!b) return;
      state.people = Math.min(20, Math.max(1, state.people + Number(b.dataset.people)));
      $('kitPeople').textContent = state.people;
      state.buy = {};
      save(); if (state.kit) render();
    });
    $('kitDays').addEventListener('change', (e) => { state.extraDays = Number(e.target.value); state.buy = {}; save(); compute(); });
    $('kitResult').addEventListener('click', (e) => {
      const b = e.target.closest('[data-buy]');
      if (b) {
        const l = lines(state.kit).find((x) => x.id === b.dataset.buy);
        state.buy[l.id] = Math.max(0, l.packs + Number(b.dataset.d));
        render();
      }
      const r = e.target.closest('[data-reset]');
      if (r) { delete state.buy[r.dataset.reset]; render(); }
    });
    $('kitResult').addEventListener('change', (e) => {
      const inp = e.target.closest('[data-own]');
      if (!inp) return;
      const v = parseFloat(inp.value);
      if (Number.isFinite(v) && v > 0) state.owned[inp.dataset.own] = v; else delete state.owned[inp.dataset.own];
      delete state.buy[inp.dataset.own];
      save(); render();
    });
    $('kitToCart').addEventListener('click', addToCart);
    RO.on('location', (loc) => { state.loc = loc; compute(); });
    RO.emit('hazards', state.hazards);
  }

  RO.kitcalc = { init, lines: () => (state.kit ? lines(state.kit) : []), state, SKU, calculate };
})(window.RO);
