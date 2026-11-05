/* BLACK-OUT — 상품 데이터 + 안전키트 섹션 렌더링 + 맞춤 추천 정렬
   가격은 모두 MVP 시연용 가상 가격입니다. 백엔드 연결 시 RO.products.kits/items를 API 응답으로 교체하세요. */
(function (RO) {
  const CATEGORIES = [
    { id: 'all', label: '전체' },
    { id: 'depress', label: '공기 누출' },
    { id: 'dust', label: '먼지 폭풍' },
    { id: 'solar', label: '태양 방사선' },
    { id: 'fire', label: '내부 화재' },
    { id: 'life', label: '생명유지·전력·난방' },
    { id: 'solo', label: '1인 모듈' }
  ];

  // 화성 거주자용 키트. 구성은 NASA·ISS에서 실제로 쓰거나 시험한 장비를 본떴고, 가격은 시연용 가상 가격입니다.
  const kits = [
    {
      id: 'kit-depress', cats: ['depress', 'life'], name: '공기 누출 대응 키트', price: 189000,
      img: 'assets/mars/kit-depress.svg',
      desc: '공기가 새는 순간 숨을 지키고, 새는 곳을 찾아 막고, 대피를 판단하는 세트.',
      items: ['산소호흡기 2개', '휴대용 산소통(1인 6시간)', '휴대용 압력 조절기', '초음파 누출 탐지기', '누출 패치 시트·고압 테이프'],
      target: '돔 도시·개인 거주 모듈 거주자, 공기 누출 행동요령이 익숙하지 않은 분'
    },
    {
      id: 'kit-dust', cats: ['dust', 'life'], name: '먼지 폭풍 대비 30솔 키트', price: 249000,
      img: 'assets/mars/kit-dust.svg',
      desc: '태양광 발전이 몇 주 줄어드는 동안 조명·전력·공기를 지키는 장기전 세트.',
      items: ['비상 배터리팩 2kWh', '초고휘도 비상 라이트', '방진 필터 마스크', 'CO₂ 흡착 카트리지 30개(1인 1솔 1개)', '비상 보온 담요'],
      target: '이동형 로버·외곽 연구 기지 거주자, 태양광 의존 거주구'
    },
    {
      id: 'kit-solar', cats: ['solar'], name: '태양 방사선 대피 키트', price: 329000,
      img: 'assets/mars/kit-solar.svg',
      desc: '고에너지 입자가 쏟아지는 몇 시간에서 하루, 차폐 대피 모듈에서 버티는 세트.',
      items: ['방사선 차폐 조끼', '개인 선량계', '물 차폐 팩 6개(채우면 몸 주위 차폐벽)', '방사선 피부 케어 크림 (보조: 입자 차단 효과 없음)', '비상식 2솔분'],
      target: '이동형 로버·돔 도시 거주자, 선외활동이 잦은 분'
    },
    {
      id: 'kit-suit', cats: ['depress', 'life'], name: '비상 우주복 세트', price: 890000,
      img: 'assets/mars/kit-suit.svg',
      desc: '거주구 전체가 기압을 잃어도 대피소까지 갈 수 있게 몸을 감싸는 비상 우주복.',
      items: ['비상 우주복(내부용 여압복)', '헬멧·초고휘도 헬멧 라이트', '휴대 산소팩(6시간)', '휴대용 압력 조절기'],
      target: '가족 거주자, 돔 비상 대피 구역과 거리가 먼 분'
    },
    {
      id: 'kit-solo', cats: ['solo', 'life'], name: '개인 거주 모듈 미니 키트', price: 129000,
      img: 'assets/mars/kit-solo.svg',
      desc: '좁은 1인 모듈에도 들어가는 크기로 첫 10분을 버틸 것만 담았어요.',
      items: ['소형 산소호흡기(2시간)', '초고휘도 비상 라이트', '비상 보온 담요', '비상식 3솔분', '위치 신호 비콘'],
      target: '혼자 사는 분, 보관 공간이 좁은 분'
    },
    {
      id: 'kit-orbit', cats: ['life'], name: '선외활동 자가구조 키트', price: 1290000,
      img: 'assets/mars/kit-orbit.svg',
      desc: '외곽 기지·궤도 작업 중 안전줄이 끊어졌을 때 스스로 돌아오기 위한 소형 추진기 세트.',
      items: ['자가구조 추진 장치(NASA SAFER 방식)', '예비 안전줄·후크', '손목 제어기', '사용 훈련 카드'],
      target: '외곽 연구 기지 거주자, 선외활동 작업자'
    },
    {
      id: 'kit-aid', cats: ['fire', 'life'], name: '저중력 응급 의료 키트', price: 99000,
      img: 'assets/mars/kit-aid.svg',
      desc: '중력이 지구의 38%라 물건이 덜 떨어져요. 고정 끈으로 정리한 응급 세트.',
      items: ['고정 끈 정리 하드케이스', '붕대·거즈·반창고', '화상 드레싱', '맥박산소측정기', '응급처치 안내 카드'],
      target: '모든 거주구'
    },
    {
      id: 'kit-comm', cats: ['dust', 'solo'], name: '비상 통신 비콘 세트', price: 159000,
      img: 'assets/mars/kit-comm.svg',
      desc: '기지망이 끊겨도 내 위치와 상태를 이웃·구조 로봇에게 알리는 세트.',
      items: ['조난 신호 비콘', '휴대용 무전기 2대', '점멸 신호등', '비상 주파수 카드'],
      target: '혼자 사는 분, 로버·전초기지 거주자'
    }
  ];

  // 행동수칙 카드의 '키트에 담기'에서 쓰는 개별 물품
  const items = [
    { id: 'item-o2mask', name: '산소호흡기', price: 39000, icon: 'wind' },
    { id: 'item-o2cyl', name: '휴대용 산소통(6시간)', price: 59000, icon: 'cylinder' },
    { id: 'item-gauge', name: '휴대용 기압계', price: 24000, icon: 'gauge' },
    { id: 'item-leak', name: '초음파 누출 탐지기', price: 69000, icon: 'radar' },
    { id: 'item-patch', name: '누출 패치 시트·고압 테이프', price: 18000, icon: 'sticky-note' },
    { id: 'item-dosimeter', name: '개인 선량계', price: 49000, icon: 'radiation' },
    { id: 'item-vest', name: '방사선 차폐 조끼', price: 259000, icon: 'shield' },
    { id: 'item-waterbag', name: '물 차폐 팩 6개', price: 29000, icon: 'droplets' },
    { id: 'item-headlamp', name: '초고휘도 비상 라이트', price: 19000, icon: 'flashlight' },
    { id: 'item-battery', name: '비상 배터리팩 2kWh', price: 149000, icon: 'battery-charging' },
    { id: 'item-dustmask', name: '방진 필터 마스크', price: 22000, icon: 'shield-half' },
    { id: 'item-co2', name: 'CO₂ 흡착 카트리지', price: 9000, icon: 'filter' },
    { id: 'item-o2candle', name: '비상 산소 발생 캔들', price: 35000, icon: 'flame-kindling' },
    { id: 'item-extinguisher', name: '거주구용 CO₂ 소화기', price: 59000, icon: 'fire-extinguisher' },
    { id: 'item-comask', name: '일산화탄소·연기 측정기', price: 39000, icon: 'activity' },
    { id: 'item-beacon', name: '조난 신호 비콘', price: 79000, icon: 'radio-tower' },
    { id: 'item-ration', name: '비상식 3솔분', price: 27000, icon: 'package' },
    { id: 'item-cream', name: '방사선 피부 케어 크림 (보조)', price: 19000, icon: 'droplet' },
    { id: 'item-regulator', name: '휴대용 압력 조절기', price: 89000, icon: 'gauge' },
    { id: 'item-helmet', name: '충격 보호 헬멧', price: 39000, icon: 'hard-hat' },
    { id: 'item-blanket', name: '비상 보온 담요 (은박)', price: 9000, icon: 'layers' },
    { id: 'item-suit', name: '비상 우주복', price: 890000, icon: 'shirt' },
    { id: 'item-aid', name: '저중력 응급 의료 키트', price: 99000, icon: 'cross' }
  ];

  const all = [...kits, ...items];
  const find = (id) => all.find((p) => p.id === id);

  let activeCat = 'all';
  let recommended = []; // 테스트 결과에서 계산된 키트 id 순서

  function cardHTML(p, i) {
    const isRec = recommended.includes(p.id);
    return `
      <article class="kit-card ${isRec ? 'is-rec' : ''}" style="--i:${i}">
        <div class="kit-media">
          <img src="${p.img}" alt="${RO.esc(p.name)} 대표 이미지" loading="lazy" width="640" height="420">
          ${isRec ? '<span class="badge badge-red">내 결과 추천</span>' : ''}
        </div>
        <div class="kit-body">
          <h3 class="kit-name">${RO.esc(p.name)}</h3>
          <p class="kit-desc">${RO.esc(p.desc)}</p>
          <details class="kit-items">
            <summary>구성 물품 ${p.items.length}종</summary>
            <ul>${p.items.map((i) => `<li>${RO.esc(i)}</li>`).join('')}</ul>
          </details>
          <p class="kit-target"><i data-lucide="user-check" aria-hidden="true"></i>${RO.esc(p.target)}</p>
          <div class="kit-foot">
            <p class="kit-price">${RO.won(p.price)}<small>가상 가격</small></p>
            <button class="btn btn-primary btn-sm" data-add="${p.id}" aria-label="${RO.esc(p.name)} 장바구니에 담기">
              <i data-lucide="shopping-bag" aria-hidden="true"></i>담기
            </button>
          </div>
        </div>
      </article>`;
  }

  function render() {
    const grid = document.getElementById('kitGrid');
    if (!grid) return;
    let list = activeCat === 'all' ? kits.slice() : kits.filter((k) => k.cats.includes(activeCat));
    // 추천 키트를 앞으로
    list.sort((a, b) => rank(a) - rank(b));
    const done = recommended.length > 0;
    grid.innerHTML = list.map(cardHTML).join('') + `
      <article class="kit-card kit-cta" style="--i:${list.length}">
        <p class="eyebrow eyebrow-red">${done ? '나만의 키트 완성하기' : '잘 모르겠다면?'}</p>
        <h3>${done ? '추천 키트에 행동수칙 물품까지 더해 나만의 키트를 완성하세요.' : '어떤 키트가 필요한지 모르겠다면, 2분 테스트로 시작하세요.'}</h3>
        ${done
          ? '<a class="btn btn-ghost-dark btn-sm" href="#guide">행동수칙에서 물품 담기</a>'
          : '<button class="btn btn-primary btn-sm" data-action="start-test">테스트하고 추천받기</button>'}
      </article>`;
    RO.icons();
  }
  const rank = (p) => (recommended.includes(p.id) ? recommended.indexOf(p.id) : 99);

  function renderTabs() {
    const tabs = document.getElementById('kitTabs');
    tabs.innerHTML = CATEGORIES.map((c) => `
      <button class="chip ${c.id === activeCat ? 'is-active' : ''}" role="tab"
        aria-selected="${c.id === activeCat}" data-cat="${c.id}">${c.label}</button>`).join('');
  }

  function renderRecBanner(result) {
    const el = document.getElementById('kitRecBanner');
    if (!result) {
      el.innerHTML = `
        <div class="rec-banner">
          <p><b>아직 테스트 전이에요.</b> 2분 테스트로 나에게 필요한 키트만 골라 보세요.</p>
          <button class="btn btn-primary btn-sm" data-action="start-test">테스트하고 추천받기</button>
        </div>`;
      return;
    }
    const names = recommended.slice(0, 3).map((id) => find(id).name);
    el.innerHTML = `
      <div class="rec-banner is-done">
        <p><span class="badge badge-red">${result.score}점 · ${RO.esc(result.type.name)}</span>
        내 결과 기반 추천: <b>${names.map(RO.esc).join(', ')}</b></p>
        <a class="btn btn-outline btn-sm" href="#result">결과 다시 보기</a>
      </div>`;
  }

  function init() {
    renderTabs();
    document.getElementById('kitTabs').addEventListener('click', (e) => {
      const b = e.target.closest('[data-cat]');
      if (!b) return;
      activeCat = b.dataset.cat;
      renderTabs();
      render();
    });
    const result = RO.test && RO.test.getResult();
    recommended = result ? result.kits : [];
    renderRecBanner(result);
    render();
    RO.on('result', (r) => {
      recommended = r ? r.kits : [];
      renderRecBanner(r);
      render();
    });
  }

  // 다른 모듈(우리 동네 키트 계산)이 구매 단위 상품을 등록할 때 사용
  const addItems = (list) => list.forEach((p) => { if (!find(p.id)) all.push(p); });

  RO.products = { kits, items, find, init, addItems };
})(window.RO);
