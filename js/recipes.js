/* READY : ON — 우리집 재료로 만드는 생존 용품 (재료 조합)
   원칙: 아이도 따라 할 수 있게 3단계 이하, 불·칼 사용 없음. 가위가 필요한 것은 "어른과 함께" 표시.
   행정안전부·소방청 안내(젖은 수건으로 코·입 막기, 식수 비축, 구조 요청 등)와 일반적인 생활 안전 요령을 바탕으로 했습니다. */
(function (RO) {
  const INGREDIENTS = [
    { id: 'light', name: '손전등·휴대폰', icon: 'flashlight' },
    { id: 'bottle', name: '투명 페트병', icon: 'milk' },
    { id: 'water', name: '물', icon: 'droplet' },
    { id: 'towel', name: '수건', icon: 'shirt' },
    { id: 'newspaper', name: '신문지', icon: 'newspaper' },
    { id: 'tape', name: '테이프', icon: 'sticky-note' },
    { id: 'bigbag', name: '큰 비닐봉지', icon: 'package' },
    { id: 'scissors', name: '가위', icon: 'scissors' },
    { id: 'ziplock', name: '지퍼백', icon: 'wallet' },
    { id: 'pen', name: '종이·펜', icon: 'pencil' },
    { id: 'string', name: '끈', icon: 'cable' }
  ];

  const RECIPES = [
    {
      id: 'lantern', name: '물병 랜턴', icon: 'lamp', use: '정전', need: ['light', 'bottle', 'water'],
      why: '손전등 빛을 물이 퍼뜨려서 방 전체가 환해져요.',
      steps: ['투명한 페트병에 물을 가득 채우고 뚜껑을 닫아요.', '손전등(휴대폰 불빛)을 위로 향하게 바닥에 놓아요.', '그 위에 물병을 올리면 빛이 방 안에 퍼져요.'],
      tip: '촛불 대신 쓰면 불이 날 걱정이 없어요.'
    },
    {
      id: 'mask', name: '젖은 수건 마스크', icon: 'shield', use: '화재', need: ['towel', 'water'],
      why: '연기를 덜 마시게 도와줘요.',
      steps: ['수건을 물에 적셔요.', '물이 뚝뚝 떨어지지 않게 살짝 짜요.', '코와 입을 막고 몸을 낮춰 계단으로 대피해요.'],
      tip: '불이 나면 대피가 가장 먼저예요. 수건이 없으면 옷소매로 막고 바로 나가요.'
    },
    {
      id: 'warmer', name: '신문지 보온재', icon: 'thermometer', use: '정전·추위', need: ['newspaper'],
      why: '신문지 사이에 공기가 갇혀 몸을 따뜻하게 지켜 줘요.',
      steps: ['신문지를 한 장씩 구겨서 부드럽게 만들어요.', '다시 펴서 배와 등에 두르거나 옷과 옷 사이에 넣어요.', '발은 신문지로 감싸고 그 위에 양말을 신어요.'],
      tip: '대피소 바닥에 깔면 차가운 기운도 막아 줘요.'
    },
    {
      id: 'slipper', name: '신문지 슬리퍼', icon: 'footprints', use: '지진', need: ['newspaper', 'tape'],
      why: '바닥에 떨어진 작은 조각으로부터 발을 지켜요.',
      steps: ['신문지 여러 장을 겹쳐 두껍게 만들어요.', '발을 올리고 신문지로 발을 감싸요.', '테이프를 둘러 감아 벗겨지지 않게 해요.'],
      tip: '운동화가 있으면 운동화가 가장 안전해요. 깨진 유리 위를 일부러 걷지 마세요.'
    },
    {
      id: 'raincoat', name: '비닐 우비', icon: 'umbrella', use: '침수·태풍', need: ['bigbag', 'scissors'], adult: true,
      why: '비를 막고 체온이 떨어지지 않게 해 줘요.',
      steps: ['어른이 봉투 바닥 가운데에 얼굴이 나올 구멍을 크게 잘라요.', '봉투 양옆에 팔이 나올 구멍을 잘라요.', '머리부터 입고, 얼굴이 꼭 밖으로 나오게 해요.'],
      tip: '비닐봉지를 머리에 쓰거나 얼굴을 덮으면 숨을 못 쉬어 위험해요.'
    },
    {
      id: 'toilet', name: '비상 화장실', icon: 'toilet', use: '단수·지진', need: ['bigbag', 'newspaper'],
      why: '물이 끊겨도 화장실을 깨끗하게 쓸 수 있어요.',
      steps: ['변기 뚜껑을 올리고 비닐봉지를 변기에 씌워요.', '그 위에 비닐봉지를 한 장 더 씌우고 찢은 신문지를 넣어요.', '쓴 뒤에는 안쪽 봉지만 꽁꽁 묶어서 버려요.'],
      tip: '지진 뒤에는 배관이 망가졌을 수 있으니 물을 내리지 않아요.'
    },
    {
      id: 'pouch', name: '방수 주머니', icon: 'smartphone', use: '침수', need: ['ziplock'],
      why: '휴대폰과 중요한 종이가 물에 젖지 않아요.',
      steps: ['휴대폰과 중요한 종이(연락처, 신분증 사본)를 지퍼백에 넣어요.', '공기를 빼고 지퍼를 꼭 닫아요.', '지퍼백에 한 번 더 넣으면 더 튼튼해요.'],
      tip: '물에 들어갈 일이 생기면 주머니를 옷 안쪽이나 가방 깊은 곳에 넣어요.'
    },
    {
      id: 'tag', name: '비상 이름표 목걸이', icon: 'id-card', use: '모든 재난', need: ['pen', 'ziplock', 'string'],
      why: '가족과 떨어져도 나를 도와줄 사람이 연락할 수 있어요.',
      steps: ['종이에 내 이름, 보호자 전화번호, 만날 장소를 적어요.', '작은 지퍼백에 넣고 지퍼를 닫아요.', '끈을 달아 목에 걸거나 가방에 묶어요.'],
      tip: '전화번호는 외워 두는 것이 가장 좋아요.'
    },
    {
      id: 'water', name: '페트병 비상 식수', icon: 'droplets', use: '단수', need: ['bottle', 'water'],
      why: '물이 끊겼을 때 마실 물이 있어요.',
      steps: ['깨끗이 씻은 페트병에 수돗물을 입구까지 가득 받아요.', '뚜껑을 꼭 닫고 받은 날을 달력에 표시해요.', '햇빛이 없는 서늘한 곳에 두고 3일쯤 지나면 새 물로 바꿔요.'],
      tip: '수돗물은 오래 두면 상할 수 있어요. 오래 보관할 물은 사서 둔 생수를 써요.'
    },
    {
      id: 'flag', name: '구조 요청 깃발', icon: 'flag', use: '고립', need: ['towel'],
      why: '건물 안에 사람이 있다는 것을 밖에 알려요.',
      steps: ['밝은 색 수건이나 옷을 준비해요.', '창문으로 흔들거나 창밖에 걸어 둬요.', '밤에는 손전등 불빛을 깜빡여서 알려요.'],
      tip: '몸을 창밖으로 내밀지 마세요.'
    }
  ];

  const DEFAULT_CARD = ['lantern', 'mask', 'tag', 'warmer'];
  let have = new Set(RO.store.get('pantry', []));
  let onCard = new Set(RO.store.get('cardRecipes', []));

  const missing = (r) => r.need.filter((n) => !have.has(n));
  const ingName = (id) => INGREDIENTS.find((i) => i.id === id).name;
  const ingIcon = (id) => INGREDIENTS.find((i) => i.id === id).icon;

  // 카드에 넣을 만들기 4개: 직접 고른 것 → 지금 만들 수 있는 것 → 기본 추천 순으로 채움
  function forCard() {
    const ready = have.size ? RECIPES.filter((r) => !missing(r).length).map((r) => r.id) : [];
    const ids = [...new Set([...onCard, ...ready, ...DEFAULT_CARD])].slice(0, 4);
    return ids.map((id) => RECIPES.find((r) => r.id === id));
  }

  /* ---------- 화면 ---------- */
  const $ = (id) => document.getElementById(id);

  function renderPantry() {
    $('pantry').innerHTML = INGREDIENTS.map((i) => `
      <button type="button" class="ing ${have.has(i.id) ? 'is-on' : ''}" data-ing="${i.id}" aria-pressed="${have.has(i.id)}">
        <span class="ing-icon"><i data-lucide="${i.icon}" aria-hidden="true"></i></span>
        <span class="ing-name">${i.name}</span>
        <span class="ing-check" aria-hidden="true"><i data-lucide="check" aria-hidden="true"></i></span>
      </button>`).join('');
  }

  function renderRecipes(justUnlocked = []) {
    const list = [...RECIPES].sort((a, b) => missing(a).length - missing(b).length);
    const ready = RECIPES.filter((r) => !missing(r).length).length;
    $('makeSummary').innerHTML = `재료 <b>${have.size}</b>개 선택 · 지금 만들 수 있는 것 <b>${ready}</b>개`;
    $('recipeGrid').innerHTML = list.map((r) => {
      const miss = missing(r);
      const done = !miss.length;
      return `
        <button type="button" class="recipe ${done ? 'is-ready' : ''} ${justUnlocked.includes(r.id) ? 'is-new' : ''}" data-recipe="${r.id}"
          aria-label="${r.name} 만드는 법 보기${done ? ' (만들 수 있어요)' : ''}">
          <span class="recipe-top">
            <span class="recipe-icon"><i data-lucide="${r.icon}" aria-hidden="true"></i></span>
            <span class="recipe-use">${r.use}</span>
            ${r.adult ? '<span class="recipe-adult">어른과 함께</span>' : ''}
          </span>
          <span class="recipe-name">${r.name}</span>
          <span class="recipe-need">${r.need.map((n) => `<span class="${have.has(n) ? 'has' : ''}">${ingName(n)}</span>`).join('<em>+</em>')}</span>
          <span class="recipe-state">${done
            ? '<i data-lucide="circle-check" aria-hidden="true"></i>만들 수 있어요'
            : `${miss.map(ingName).join(', ')} 있으면 완성`}</span>
          ${onCard.has(r.id) ? '<span class="recipe-oncard">대피 카드에 넣음</span>' : ''}
        </button>`;
    }).join('');
    RO.icons();
  }

  function openRecipe(id) {
    const r = RECIPES.find((x) => x.id === id);
    const miss = missing(r);
    $('recipeBody').innerHTML = `
      <p class="rd-use"><i data-lucide="${r.icon}" aria-hidden="true"></i>${r.use}에 쓰여요${r.adult ? ' · <b>어른과 함께 만들어요</b>' : ''}</p>
      <h2 id="recipeTitle">${r.name}</h2>
      <p class="rd-why">${r.why}</p>
      <div class="rd-formula" aria-label="필요한 재료">
        ${r.need.map((n) => `<span class="rd-ing ${have.has(n) ? 'has' : ''}"><i data-lucide="${ingIcon(n)}" aria-hidden="true"></i>${ingName(n)}</span>`).join('<span class="rd-plus" aria-hidden="true">+</span>')}
        <span class="rd-plus" aria-hidden="true">=</span>
        <span class="rd-ing rd-result"><i data-lucide="${r.icon}" aria-hidden="true"></i>${r.name}</span>
      </div>
      ${miss.length ? `<p class="rd-missing">아직 없는 재료: <b>${miss.map(ingName).join(', ')}</b></p>` : ''}
      <ol class="rd-steps">${r.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
      <p class="rd-tip"><i data-lucide="alert-triangle" aria-hidden="true"></i>${r.tip}</p>
      <div class="modal-actions">
        <button class="btn ${onCard.has(r.id) ? 'btn-outline' : 'btn-primary'}" data-card-recipe="${r.id}">
          ${onCard.has(r.id) ? '대피 카드에서 빼기' : '대피 카드에 넣기'}
        </button>
        <button class="btn btn-outline" data-close>닫기</button>
      </div>`;
    RO.icons();
    $('recipeDialog').showModal();
  }

  function toggleIngredient(id) {
    const before = new Set(RECIPES.filter((r) => !missing(r).length).map((r) => r.id));
    have.has(id) ? have.delete(id) : have.add(id);
    RO.store.set('pantry', [...have]);
    const unlocked = RECIPES.filter((r) => !missing(r).length && !before.has(r.id)).map((r) => r.id);
    renderPantry();
    renderRecipes(unlocked);
    if (unlocked.length) RO.toast(`${RECIPES.find((r) => r.id === unlocked[0]).name}${unlocked.length > 1 ? ` 외 ${unlocked.length - 1}개를` : '을(를)'} 만들 수 있어요!`);
    RO.emit('recipes');
  }

  function init() {
    renderPantry();
    renderRecipes();
    $('pantry').addEventListener('click', (e) => {
      const b = e.target.closest('[data-ing]');
      if (b) toggleIngredient(b.dataset.ing);
    });
    $('recipeGrid').addEventListener('click', (e) => {
      const b = e.target.closest('[data-recipe]');
      if (b) openRecipe(b.dataset.recipe);
    });
    $('pantryAll').addEventListener('click', () => { INGREDIENTS.forEach((i) => have.add(i.id)); RO.store.set('pantry', [...have]); renderPantry(); renderRecipes(RECIPES.map((r) => r.id)); RO.emit('recipes'); });
    $('pantryReset').addEventListener('click', () => { have.clear(); RO.store.set('pantry', []); renderPantry(); renderRecipes(); RO.emit('recipes'); });
    $('recipeDialog').addEventListener('click', (e) => {
      const b = e.target.closest('[data-card-recipe]');
      if (!b) return;
      const id = b.dataset.cardRecipe;
      if (onCard.has(id)) onCard.delete(id);
      else if (onCard.size >= 4) { RO.toast('대피 카드에는 4개까지 넣을 수 있어요'); return; }
      else onCard.add(id);
      RO.store.set('cardRecipes', [...onCard]);
      RO.toast(onCard.has(id) ? '대피 카드에 넣었어요' : '대피 카드에서 뺐어요');
      openRecipe(id);
      renderRecipes();
      RO.emit('recipes');
    });
  }

  RO.recipes = { init, forCard, INGREDIENTS, RECIPES };
})(window.RO);
