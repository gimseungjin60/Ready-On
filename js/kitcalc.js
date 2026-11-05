/* BLACK-OUT — 우리 동네 맞춤 키트 계산 (대피소 화면의 '필요 물품' 탭)
   계산의 뼈대는 팀원 readykit/dist/engine.mjs의 calculateKit를 그대로 씁니다.
   - 비축 기간: 시·구 3일 / 군 7일 / 울릉군 14일 / 지역 미확인 임시 7일 (서비스 계획 가정, 재난 예측 아님)
   - 여러 재난을 골라도 같은 물품은 큰 값 하나만 (중복 합산 안 함)
   - 소모품만 기간에 비례, 공동 장비(라디오·소화기 등)는 기간·인원과 무관
   이 파일이 더하는 것: 인원 수, 이미 있는 수량 차감, 구매 단위(팩) 변환, 추천과 구매의 차이, 장바구니 연결
   가격·무게는 MVP용 가상 값입니다. */
(function (RO) {
  // 구매 단위(SKU): pack = 한 개 살 때 들어 있는 양(engine 단위 기준), price(원)·kg은 가상 값
  const SKU = {
    water: { pack: 2, label: '생수 2L', price: 1000, kg: 2.05 },
    food: { pack: 0.5, label: '건조식량 500g', price: 6000, kg: 0.55 },
    bottle: { pack: 1, label: '접이식 물통 10L', price: 8000, kg: 0.3 },
    torch: { pack: 1, label: 'LED 손전등', price: 12000, kg: 0.2 },
    cells: { pack: 1, label: '건전지 세트(AA 4개)', price: 4000, kg: 0.1 },
    powerbank: { pack: 1, label: '보조배터리 20,000mAh', price: 29000, kg: 0.4 },
    radio: { pack: 1, label: '휴대용 라디오', price: 25000, kg: 0.4 },
    cable: { pack: 1, label: '충전 케이블', price: 5000, kg: 0.05 },
    firstaid: { pack: 1, label: '구급용품 세트', price: 15000, kg: 0.4 },
    wipes: { pack: 80, label: '물티슈 80매', price: 2000, kg: 0.5 },
    bags: { pack: 20, label: '폐기물 봉투 20매', price: 2000, kg: 0.2 },
    mask: { pack: 10, label: '분진용 마스크 10개', price: 8000, kg: 0.1 },
    gloves: { pack: 1, label: '작업용 장갑', price: 3000, kg: 0.1 },
    blanket: { pack: 1, label: '보온 담요', price: 9000, kg: 0.3 },
    whistle: { pack: 1, label: '호루라기', price: 3000, kg: 0.02 },
    pouch: { pack: 1, label: '방수 파우치', price: 4000, kg: 0.05 },
    extinguisher: { pack: 1, label: '가정용 소화기 3.3kg', price: 28000, kg: 4.5 },
    raincoat: { pack: 1, label: '우의', price: 7000, kg: 0.2 },
    waterproof: { pack: 1, label: '방수 보관함', price: 15000, kg: 1.0 },
    helmet: { pack: 1, label: '안전모', price: 14000, kg: 0.4 },
    goggles: { pack: 1, label: '보호안경', price: 6000, kg: 0.05 },
    fireblanket: { pack: 1, label: '소화포', price: 18000, kg: 0.6 },
    warmers: { pack: 10, label: '보온팩 10개', price: 5000, kg: 0.5 },
    sleeping: { pack: 1, label: '침낭', price: 39000, kg: 1.2 },
    hat: { pack: 1, label: '차양 모자', price: 9000, kg: 0.1 },
    toilet: { pack: 10, label: '비상 화장실 처리팩 10개', price: 12000, kg: 0.6 }
  };
  const RULE_LABEL = { 소모품: '소모품', 개인: '개인 장비', 기간: '기간 장비', 공동: '공동 장비' };
  const PID = (id) => 'sk-' + id; // 장바구니 상품 id

  // 장바구니가 이 상품들을 알 수 있도록 등록 (페이지 로드 시)
  RO.products.addItems(Object.entries(SKU).map(([id, s]) => ({ id: PID(id), name: s.label, price: s.price, icon: 'package-check' })));

  const $ = (id) => document.getElementById(id);
  const state = {
    hazards: RO.store.get('kitHazards', ['all']),
    people: RO.store.get('kitPeople', 1),
    extraDays: RO.store.get('kitDays', 0), // 0 = 자동
    owned: RO.store.get('kitOwned', {}),   // { itemId: 보유량(engine 단위) }
    buy: {},                               // { itemId: 구매 팩 수 } (사용자가 바꾼 것만)
    loc: null, kit: null, regionNote: null, HAZARDS: []
  };
  const save = () => { RO.store.set('kitHazards', state.hazards); RO.store.set('kitPeople', state.people); RO.store.set('kitDays', state.extraDays); RO.store.set('kitOwned', state.owned); };
  const num = (n) => (Math.round(n * 100) / 100).toLocaleString('ko-KR');

  /* ---------- 계산 ---------- */
  // engine 결과(1인)를 인원 수에 맞추고 보유량·구매 팩을 붙임
  function lines(kit) {
    const people = state.people;
    return kit.items.map((it) => {
      const perPerson = it.rule !== '공동';
      const need = perPerson ? it.required * people : it.required;           // 계획 필요량
      const owned = Math.max(0, +state.owned[it.id] || 0);                    // 유효 보유량
      const lack = Math.max(0, need - owned);                                 // 추가로 필요한 양
      const sku = SKU[it.id] || { pack: 1, label: it.name, price: 0, kg: 0 };
      const recPacks = Math.ceil(lack / sku.pack - 1e-9);                     // 추천 구매 팩
      const packs = state.buy[it.id] ?? recPacks;                              // 실제 구매 팩
      const formula = it.rule === '소모품' ? `1인 하루 ${num(it.required / kit.days)}${it.unit} × ${kit.days}일 × ${people}명`
        : it.rule === '기간' ? `${kit.days}일 기준 ${num(it.required)}${it.unit} × ${people}명`
        : it.rule === '개인' ? `1인 ${num(it.required)}${it.unit} × ${people}명`
        : `가구당 ${num(it.required)}${it.unit} · 기간·인원과 무관`;
      return { ...it, need, owned, lack, sku, recPacks, packs, formula, diff: packs - recPacks };
    });
  }

  async function compute() {
    if (!state.loc) return;
    const panel = $('kitResult');
    panel.innerHTML = '<p class="kit-loading"><span class="spinner" aria-hidden="true"></span>지역을 확인하고 필요한 물품을 계산하고 있어요…</p>';
    let m;
    try { m = await RO.readykit.engine; } catch { panel.innerHTML = '<p class="kit-error">계산 엔진을 불러오지 못했어요. 새로고침해 주세요.</p>'; return; }
    state.HAZARDS = m.HAZARDS;
    // 지역: 시·군·구를 직접 고른 경우 그 지역, 아니면 좌표로 경계 판정. 경계 자료 실패는 '임시 기준'으로 따로 표시.
    let region = null, approximate = false, regionError = false;
    try {
      const list = await RO.readykit.regions();
      if (state.loc.regionCode) region = list.find((r) => r.code === state.loc.regionCode) || null;
      else ({ region, approximate } = m.resolveRegion({ lat: state.loc.lat, lng: state.loc.lng }, list));
    } catch { regionError = true; }
    state.kit = m.calculateKit({ hazards: state.hazards, region, policy: state.extraDays ? { minimumDays: state.extraDays } : {} });
    state.regionNote = { region, approximate, regionError };
    render();
  }

  /* ---------- 화면 ---------- */
  function renderHazards() {
    const H = state.HAZARDS.length ? state.HAZARDS : [{ id: 'all', name: '종합 대비' }];
    $('hazardChips').innerHTML = H.map((h) => `
      <button type="button" class="hz-chip ${state.hazards.includes(h.id) ? 'is-on' : ''}" data-hz="${h.id}" aria-pressed="${state.hazards.includes(h.id)}">${h.name}</button>`).join('');
  }

  function render() {
    const kit = state.kit;
    const L = lines(kit);
    const { region, approximate, regionError } = state.regionNote;
    const plan = kit.plan;
    const recDays = plan.days;
    const cost = L.reduce((s, l) => s + l.packs * l.sku.price, 0);
    const kg = L.reduce((s, l) => s + l.packs * l.sku.kg, 0);
    const changed = L.filter((l) => l.diff !== 0).length;
    const cats = Object.entries({ food: '식량·물', power: '조명·전원', care: '응급·위생', protect: '보온·보호', fire: '화재 대비' });

    $('kitResult').innerHTML = `
      <div class="kit-basis">
        <p class="kb-days"><b>${kit.days}일</b> 대비 · ${state.people}명 ${state.extraDays && state.extraDays > recDays ? `<em>추천 ${recDays}일에서 직접 늘림</em>` : ''}</p>
        <p class="kb-why">${regionError
          ? '<span class="tag-temp">임시 기준</span> 지역 경계 자료를 불러오지 못해 임시 7일 기준을 적용했어요.'
          : `${region ? `<b>${RO.esc(region.label || region.name)}</b> · ` : ''}${RO.esc(plan.label)} — ${RO.esc(plan.reason)}${approximate ? ' (경계 자료 기준 추정)' : ''}`}</p>
        <p class="kb-note">서비스 계획 가정이에요. 재난 발생 확률이나 구조 시간을 예측한 값이 아니에요.</p>
      </div>
      ${cats.map(([cat, label]) => {
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
                <p class="kl-formula">${l.formula}${l.reasons.length > 1 || l.reasons[0] !== '공통 기본 물품' ? ` · 반영: ${[...new Set(l.reasons)].join(', ')}` : ''}</p>
                <div class="kl-row">
                  <label class="kl-own">있어요 <input type="number" min="0" step="any" inputmode="decimal" value="${l.owned || ''}" placeholder="0" data-own="${l.id}" aria-label="${l.name} 이미 있는 양(${l.unit})">${l.unit}</label>
                  <div class="kl-buy">
                    <span class="kl-sku">${RO.esc(l.sku.label)}</span>
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
      <ul class="kit-notes">${kit.notes.map((n) => `<li>${RO.esc(n.replace('1인분 계획용 기본값이며', `${state.people}명분으로 늘린 계획값이며`))}</li>`).join('')}</ul>`;

    $('kitTotal').innerHTML = `<span>${L.reduce((s, l) => s + l.packs, 0)}개 · 약 ${num(kg)}kg</span><b>${RO.won(cost)}</b>${changed ? `<em>추천에서 ${changed}개 품목 바꿈</em>` : '<em>추천 그대로</em>'}`;
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
    RO.readykit.engine.then((m) => { state.HAZARDS = m.HAZARDS; renderHazards(); }).catch(() => {});
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

  RO.kitcalc = { init, lines: () => (state.kit ? lines(state.kit) : []), state, SKU };
})(window.RO);
