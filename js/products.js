/* READY : ON — 상품 데이터 + 안전키트 섹션 렌더링 + 맞춤 추천 정렬
   가격은 모두 MVP 시연용 가상 가격입니다. 백엔드 연결 시 RO.products.kits/items를 API 응답으로 교체하세요. */
(function (RO) {
  const CATEGORIES = [
    { id: 'all', label: '전체' },
    { id: 'earthquake', label: '지진 대비' },
    { id: 'blackout', label: '정전 대비' },
    { id: 'fire', label: '화재 대비' },
    { id: 'flood', label: '침수 대비' },
    { id: '72h', label: '72시간 생존' },
    { id: 'solo', label: '1인 가구 미니' }
  ];

  const kits = [
    {
      id: 'kit-quake', cats: ['earthquake', '72h'], name: '지진 대비 72시간 키트', price: 89000,
      img: 'assets/images/kit-earthquake.jpg',
      desc: '흔들림이 멈춘 뒤 대피하고 사흘을 버티는 데 필요한 기본 구성.',
      items: ['안전모', '호루라기', '방진 마스크 2매', '작업용 장갑', '생수 500ml × 6', '비상식량 3일분', 'LED 손전등', '기본 응급 파우치'],
      target: '아파트·고층 거주자, 지진 행동요령이 익숙하지 않은 분'
    },
    {
      id: 'kit-night', cats: ['blackout'], name: '정전 대비 나이트 키트', price: 39000,
      img: 'assets/images/kit-blackout.jpg',
      desc: '불이 꺼진 집에서 이동하고, 소식을 듣고, 연락을 유지하는 조명·전원 세트.',
      items: ['LED 랜턴', '헤드랜턴', '보조배터리 10,000mAh', '수동 충전 라디오', 'AA 건전지 8개'],
      target: '손전등·보조배터리가 없는 분'
    },
    {
      id: 'kit-fire', cats: ['fire'], name: '화재 대피 키트', price: 59000,
      img: 'assets/images/kit-fire.jpg',
      desc: '초기 대응과 연기 속 대피를 돕는 가정용 화재 대비 구성.',
      items: ['가정용 분말 소화기 3.3kg', '화재 대피용 마스크 2개', 'LED 손전등', '호루라기', '사용법 안내 카드'],
      target: '소화기가 없는 가정, 고층·오피스텔 거주자'
    },
    {
      id: 'kit-flood', cats: ['flood'], name: '침수 대비 안전 키트', price: 69000,
      img: 'assets/images/kit-flood.jpg',
      desc: '집중호우와 침수 상황에서 몸과 중요한 물건을 지키는 방수 구성.',
      items: ['방수 드라이백 20L', '우비', '미끄럼 방지 장화', '방수 손전등', '호루라기', '생수 500ml × 4'],
      target: '저층·반지하·단독주택 거주자'
    },
    {
      id: 'kit-72h', cats: ['72h'], name: '72시간 생존 키트', price: 129000,
      img: 'assets/images/kit-72h.jpg',
      desc: '외부 지원이 닿기 전 최소 3일을 스스로 버티기 위한 종합 구성.',
      items: ['생수 2L × 3', '비상식량 3일분', 'LED 랜턴', '수동 충전 라디오', '응급처치 키트', '은박 담요 2매', '위생용품 세트', '방수 백팩'],
      target: '가족 단위 가구, 비상식량·식수가 부족한 분'
    },
    {
      id: 'kit-solo', cats: ['solo'], name: '1인 가구 미니 생존 키트', price: 49000,
      img: 'assets/images/kit-solo.jpg',
      desc: '원룸·오피스텔에도 부담 없는 크기로 꼭 필요한 것만 담았습니다.',
      items: ['생수 500ml × 3', '비상식량 1일분 × 3', '미니 랜턴', '보조배터리 5,000mAh', '호루라기', '은박 담요', '미니 응급 파우치', '대피 카드 방수 홀더'],
      target: '혼자 사는 분, 보관 공간이 좁은 분'
    },
    {
      id: 'kit-aid', cats: ['72h', 'solo'], name: '기본 응급처치 키트', price: 29000,
      img: 'assets/images/kit-firstaid.jpg',
      desc: '작은 상처부터 응급 상황 초기 대응까지, 모든 키트의 기본.',
      items: ['멸균 거즈·붕대', '반창고 세트', '소독 용품', '압박 붕대', '의료용 테이프', '일회용 장갑', '응급처치 안내 카드'],
      target: '응급용품이 없는 모든 가정'
    }
  ];

  // 행동수칙 카드의 '키트에 담기'에서 쓰는 개별 물품
  const items = [
    { id: 'item-flashlight', name: 'LED 손전등', price: 12000, icon: 'flashlight' },
    { id: 'item-headlamp', name: '헤드랜턴', price: 15000, icon: 'lamp' },
    { id: 'item-powerbank', name: '보조배터리 10,000mAh', price: 19000, icon: 'battery-charging' },
    { id: 'item-radio', name: '수동 충전 라디오', price: 25000, icon: 'radio' },
    { id: 'item-water', name: '생수 2L × 6', price: 6000, icon: 'droplets' },
    { id: 'item-food', name: '비상식량 3일분', price: 24000, icon: 'package' },
    { id: 'item-helmet', name: '안전모', price: 14000, icon: 'hard-hat' },
    { id: 'item-whistle', name: '호루라기', price: 3000, icon: 'megaphone' },
    { id: 'item-gloves', name: '작업용 장갑', price: 4000, icon: 'hand' },
    { id: 'item-firemask', name: '화재 대피용 마스크', price: 18000, icon: 'shield' },
    { id: 'item-extinguisher', name: '가정용 분말 소화기 3.3kg', price: 28000, icon: 'fire-extinguisher' },
    { id: 'item-firstaid', name: '응급처치 키트', price: 29000, icon: 'cross' },
    { id: 'item-raincoat', name: '우비', price: 7000, icon: 'umbrella' },
    { id: 'item-boots', name: '미끄럼 방지 장화', price: 22000, icon: 'footprints' },
    { id: 'item-drybag', name: '방수 드라이백 20L', price: 16000, icon: 'briefcase' },
    { id: 'item-tape', name: '창문 고정용 테이프', price: 5000, icon: 'square-dashed' },
    { id: 'item-cooler', name: '보냉 가방·아이스팩', price: 13000, icon: 'snowflake' }
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

  RO.products = { kits, items, find, init };
})(window.RO);
