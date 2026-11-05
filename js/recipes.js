/* BLACK-OUT — 우리집 재료 조합 데이터 + '내가 만든 조합법' 저장 (make.html과 대피 카드가 함께 사용)
   원칙: 아이도 따라 할 수 있게 3단계 이하, 불·칼 사용 없음. 가위가 필요한 것은 "어른과 함께" 표시.
   행정안전부·소방청 안내(젖은 수건으로 코·입 막기, 식수 비축, 구조 요청 등)와 일반적인 생활 안전 요령을 바탕으로 했습니다. */
(function (RO) {
  // 재료 선반: 카테고리로 묶음 (팀원 khg/blackout의 분류 방식 반영)
  const INGREDIENTS = [
    { id: 'bottle', name: '투명 페트병', icon: 'milk', cat: '주방' },
    { id: 'water', name: '물', icon: 'droplet', cat: '주방' },
    { id: 'ziplock', name: '지퍼백', icon: 'wallet', cat: '주방' },
    { id: 'foil', name: '알루미늄 포일', icon: 'layers', cat: '주방' },
    { id: 'kitchentowel', name: '키친타월', icon: 'scroll', cat: '주방' },
    { id: 'plasticbag', name: '작은 비닐봉지', icon: 'shopping-bag', cat: '주방' },
    { id: 'bigbag', name: '큰 비닐봉지(45L)', icon: 'package', cat: '주방' },
    { id: 'towel', name: '수건·헌 옷', icon: 'shirt', cat: '욕실·청소' },
    { id: 'newspaper', name: '신문지', icon: 'newspaper', cat: '욕실·청소' },
    { id: 'tape', name: '테이프', icon: 'sticky-note', cat: '욕실·청소' },
    { id: 'bucket', name: '양동이', icon: 'paint-bucket', cat: '욕실·청소' },
    { id: 'light', name: '손전등·휴대폰', icon: 'flashlight', cat: '생활용품' },
    { id: 'pen', name: '종이·펜', icon: 'pencil', cat: '생활용품' },
    { id: 'string', name: '끈', icon: 'cable', cat: '생활용품' },
    { id: 'rubberband', name: '고무줄', icon: 'circle-dashed', cat: '생활용품' },
    { id: 'cardboard', name: '골판지 박스', icon: 'box', cat: '생활용품' },
    { id: 'blanket', name: '담요', icon: 'bed-double', cat: '생활용품' },
    { id: 'backpack', name: '배낭·가방', icon: 'backpack', cat: '생활용품' },
    { id: 'scissors', name: '가위', icon: 'scissors', cat: '생활용품' }
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
      id: 'slipper', name: '종이 슬리퍼', icon: 'footprints', use: '지진', need: [['newspaper', 'cardboard'], 'tape'],
      why: '바닥에 떨어진 작은 조각으로부터 발을 지켜요.',
      steps: ['신문지 여러 장(또는 골판지)을 겹쳐 두껍게 만들어요.', '발을 올리고 종이로 발을 감싸요.', '테이프를 둘러 감아 벗겨지지 않게 해요.'],
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
      steps: ['변기 시트를 올리고 비닐봉지로 변기를 쏙 덮어요.', '그 위에 비닐봉지를 한 장 더 씌우고 잘게 찢은 신문지를 넣어요.', '쓴 뒤에는 위쪽 봉지만 꽁꽁 묶어서 정해진 곳에 버려요.'],
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
      id: 'flag', name: '구조 요청 깃발', icon: 'flag', use: '고립', need: [['towel', 'blanket']],
      why: '건물 안에 사람이 있다는 것을 밖에 알려요.',
      steps: ['밝은 색 수건·옷이나 담요를 준비해요.', '창문으로 흔들거나 창밖에 걸어 둬요.', '밤에는 손전등 불빛을 깜빡여서 알려요.'],
      tip: '몸을 창밖으로 내밀지 마세요.'
    },
    {
      id: 'mat', name: '골판지 단열 깔개', icon: 'square', use: '추위·대피소', need: ['cardboard', ['newspaper', 'blanket'], 'tape'],
      why: '차가운 바닥의 냉기를 막아 몸이 덜 추워요.',
      steps: ['골판지 박스를 펼쳐 바닥에 깔아요.', '그 위에 신문지나 담요를 한 겹 더 깔아요.', '골판지끼리 테이프로 이어 붙여 넓게 만들어요.'],
      tip: '대피소 바닥에 깔고 앉거나 누우면 훨씬 따뜻해요.'
    },
    {
      id: 'reflector', name: '반사판 구조 신호', icon: 'sun', use: '고립', need: ['foil', 'cardboard', 'tape'],
      why: '햇빛을 반짝 비춰 멀리 있는 사람에게 내 위치를 알려요.',
      steps: ['골판지를 손바닥 두 개 크기로 준비해요.', '알루미늄 포일로 감싸고, 반짝이는 면이 밖으로 오게 해요.', '테이프로 고정하고 햇빛을 비춰 구조대 쪽으로 반짝여요.'],
      tip: '사람 얼굴이나 운전하는 차 쪽으로는 비추지 마세요. 눈이 부셔 위험해요.'
    },
    {
      id: 'buckettoilet', name: '들고 다니는 비상 화장실', icon: 'paint-bucket', use: '단수·고립', need: [['bucket', 'cardboard'], 'bigbag', 'newspaper'],
      why: '변기를 쓸 수 없을 때도 화장실을 만들 수 있어요.',
      steps: ['양동이나 골판지 박스 안쪽에 큰 비닐봉지를 두 겹으로 씌워요.', '잘게 찢은 신문지를 봉지 바닥에 넉넉히 넣어요.', '쓴 뒤에는 위쪽 봉지만 꽁꽁 묶어 뚜껑 있는 곳에 모아 둬요.'],
      tip: '냄새가 나지 않게 쓴 봉지는 바로 묶어요.'
    },
    {
      id: 'watertank', name: '박스 물통', icon: 'container', use: '단수', need: ['cardboard', 'bigbag', 'tape'],
      why: '물통이 없어도 급수차에서 물을 받아 올 수 있어요.',
      steps: ['골판지 박스 안에 큰 비닐봉지를 넓게 깔아요.', '박스 바닥과 옆면을 테이프로 튼튼하게 감아요.', '봉지에 물을 받고 입구를 묶어서 옮겨요.'],
      tip: '물을 담으면 아주 무거워요. 어른이 옮기고, 마실 물은 깨끗한 통에 받아요.'
    },
    {
      id: 'waterpack', name: '물 배낭', icon: 'backpack', use: '단수', need: ['bottle', 'water', 'backpack'],
      why: '두 손이 자유로워서 울퉁불퉁한 길에서도 물을 나르기 쉬워요.',
      steps: ['작은 페트병 여러 개에 물을 받아 뚜껑을 꼭 닫아요.', '배낭에 페트병을 세워서 넣어요.', '내 힘에 맞는 무게만 메고 천천히 걸어요.'],
      tip: '어린이는 작은 병 1~2개만 들어요. 무거우면 어른에게 맡겨요.'
    },
    {
      id: 'paperbowl', name: '신문지 그릇', icon: 'soup', use: '단수', need: ['newspaper', 'plasticbag'],
      why: '설거지할 물이 없어도 깨끗하게 밥을 먹을 수 있어요.',
      steps: ['신문지를 접어서 상자 모양 그릇을 만들어요.', '그릇에 작은 비닐봉지를 씌워요.', '다 먹으면 비닐봉지만 바꿔 끼우면 다시 쓸 수 있어요.'],
      tip: '뜨거운 음식은 어른이 담아 줘요.'
    },
    {
      id: 'warmvest', name: '비닐 방한 조끼', icon: 'shirt', use: '추위·비', need: ['bigbag', 'scissors', 'newspaper'], adult: true,
      why: '비닐이 바람과 비를 막고, 신문지가 몸의 열을 지켜 줘요.',
      steps: ['어른이 45L 봉투 바닥 가운데와 양옆에 머리·팔 구멍을 내요.', '구겨서 부드럽게 만든 신문지를 옷 안 배와 등에 넣어요.', '그 위에 봉투를 머리부터 입고 얼굴이 꼭 밖으로 나오게 해요.'],
      tip: '봉지가 얼굴을 덮으면 숨을 못 쉬어 위험해요. 반드시 어른과 함께 만들어요.'
    },
    {
      id: 'papermask', name: '키친타월 마스크', icon: 'wind', use: '지진 뒤 먼지', need: ['kitchentowel', 'rubberband', 'tape'],
      why: '무너진 곳에서 날리는 먼지를 덜 마시게 해 줘요.',
      steps: ['키친타월 한 장을 병풍처럼 접어 코와 입을 덮을 크기로 만들어요.', '양 끝에 고무줄을 하나씩 걸어요.', '테이프로 고무줄을 단단히 붙이고 귀에 걸어요.'],
      tip: '먼지용이에요. 불이 났을 때의 연기나 가스는 막지 못하니 바로 대피해요.'
    }
  ];

  // 근거 자료 (2026-11-05 확인). 공식 출처를 찾지 못한 것은 '일반 생활 안전 요령'으로 표시
  const SOURCES = {
    tokyo: { t: '東京都 「東京防災」 もしもマニュアル p.198–199', u: 'https://www.bousai.metro.tokyo.lg.jp/book/pdf/jp/20p7o413.pdf' },
    naikaku: { t: '일본 내각부 방재 홍보지 「ぼうさい」 71호', u: 'https://www.bousai.go.jp/kohou/kouhoubousai/h25/71/bousaitaisaku.html' },
    police: { t: '일본 경시청 「広報けいしちょう」 74호 (요약 기사)', u: 'https://seijiyama.jp/article/publicity_papers/k20160314.html' },
    kumamoto: { t: '구마모토현 중학생 방재 교육 지도안', u: 'https://www.pref.kumamoto.jp/uploaded/attachment/167615.pdf' },
    saijo: { t: '사이조시 체험형 방재 강좌 목록', u: 'https://www.city.saijo.ehime.jp/uploaded/attachment/63029.pdf' },
    safekorea: { t: '행정안전부 국민재난안전포털 국민행동요령', u: 'https://www.safekorea.go.kr' },
    bepal: { t: 'BE-PAL 「페트병 랜턴 만들기」 (아웃도어 매체)', u: 'https://www.bepal.net/archives/302494' },
    general: { t: '일반 생활 안전 요령 (공식 출처 미확인)', u: '' },
  };
  const SRC_OF = {'lantern': ['bepal'], 'mask': ['safekorea'], 'warmer': ['naikaku', 'police'], 'slipper': ['saijo', 'kumamoto', 'police'], 'raincoat': ['police', 'naikaku'], 'toilet': ['tokyo'], 'pouch': ['general'], 'tag': ['general'], 'water': ['tokyo'], 'flag': ['safekorea'], 'mat': ['general'], 'reflector': ['general'], 'buckettoilet': ['tokyo', 'saijo'], 'watertank': ['tokyo', 'naikaku'], 'waterpack': ['tokyo'], 'paperbowl': ['naikaku', 'saijo'], 'warmvest': ['police', 'naikaku', 'kumamoto'], 'papermask': ['kumamoto']};
  RECIPES.forEach((r) => { r.src = (SRC_OF[r.id] || ['general']).map((k) => SOURCES[k]); });

  // 재료 칸: 'tape'처럼 하나이거나 ['towel', 'blanket']처럼 '이 중 하나'(팀원 any 방식)
  RECIPES.forEach((r) => { r.need = r.need.map((n) => (Array.isArray(n) ? n : [n])); });

  // 내가 조합에 성공한 것(만든 순서) / 그중 대피 카드에 넣을 것(최대 4개)
  const CARD_MAX = 4;
  let made = RO.store.get('madeRecipes', []).filter((id) => RECIPES.some((r) => r.id === id));
  let onCard = RO.store.get('cardRecipes', null);
  if (!Array.isArray(onCard)) onCard = made.slice(0, CARD_MAX);
  onCard = onCard.filter((id) => made.includes(id));

  const save = () => { RO.store.set('madeRecipes', made); RO.store.set('cardRecipes', onCard); RO.emit('recipes'); };
  const byId = (id) => RECIPES.find((r) => r.id === id);
  const ingredient = (id) => INGREDIENTS.find((i) => i.id === id);

  // 올린 재료를 서로 다른 칸에 하나씩 배정할 수 있는지 (칸 수 ≤ 3이라 모든 경우를 확인)
  function fits(ids, slots) {
    if (ids.length > slots.length) return false;
    const go = (i, used) => i === ids.length || slots.some((slot, k) => !used.has(k) && slot.includes(ids[i]) && go(i + 1, new Set([...used, k])));
    return go(0, new Set());
  }
  // 올린 재료와 칸이 정확히 맞는 조합법
  function combine(ids) {
    return RECIPES.find((r) => r.need.length === ids.length && fits(ids, r.need)) || null;
  }
  // 실패 힌트: 올린 재료를 모두 쓰는 가장 작은 조합법에서 아직 빈 칸들
  function hint(ids) {
    const near = RECIPES.filter((r) => r.need.length > ids.length && fits(ids, r.need)).sort((a, b) => a.need.length - b.need.length)[0];
    if (!near) return null;
    const left = near.need.slice();
    ids.forEach((id) => { const k = left.findIndex((slot) => slot.includes(id)); if (k > -1) left.splice(k, 1); });
    return left;
  }
  // 칸 이름: '수건·헌 옷 또는 담요'
  const slotName = (slot) => slot.map((id) => INGREDIENTS.find((i) => i.id === id).name).join(' 또는 ');

  function addMade(id) {
    const isNew = !made.includes(id);
    if (isNew) {
      made.push(id);
      if (onCard.length < CARD_MAX) onCard.push(id);
      save();
    }
    return isNew;
  }
  function toggleCard(id) {
    if (onCard.includes(id)) onCard = onCard.filter((x) => x !== id);
    else if (onCard.length >= CARD_MAX) return false;
    else onCard.push(id);
    save();
    return true;
  }
  function reset() { made = []; onCard = []; save(); }

  RO.recipes = {
    INGREDIENTS, RECIPES, CARD_MAX, byId, ingredient, combine, hint, slotName, addMade, toggleCard, reset,
    made: () => made.slice(),
    isOnCard: (id) => onCard.includes(id),
    forCard: () => onCard.map(byId)
  };
})(window.RO);
