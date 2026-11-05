/* BLACK-OUT : MARS — 거주구 DIY 재료 조합 데이터 + '내가 만든 조합법' 저장 (make.html과 대피 카드가 함께 사용)
   원칙: 아이도 따라 할 수 있게 3단계 이하, 불·칼 사용 없음. 가위가 필요한 것은 "어른과 함께" 표시.
   행정안전부·소방청 안내(젖은 수건으로 코·입 막기, 식수 비축, 구조 요청 등)와 일반적인 생활 안전 요령을 바탕으로 했습니다. */
(function (RO) {
  // 거주구에 흔히 있는 물품 (분류별)
  const INGREDIENTS = [
    { id: 'tape', name: '고압 테이프', icon: 'sticky-note', cat: '정비·수리' },
    { id: 'sheet', name: '비닐 시트', icon: 'layers', cat: '정비·수리' },
    { id: 'clip', name: '집게', icon: 'paperclip', cat: '정비·수리' },
    { id: 'cartridge', name: 'CO₂ 카트리지', icon: 'filter', cat: '정비·수리' },
    { id: 'cardboard', name: '보급품 상자', icon: 'box', cat: '정비·수리' },
    { id: 'bag', name: '비닐봉지·지퍼백', icon: 'package', cat: '생활' },
    { id: 'waterpack', name: '물 팩', icon: 'droplet', cat: '생활' },
    { id: 'towel', name: '수건·천', icon: 'shirt', cat: '생활' },
    { id: 'blanket', name: '담요', icon: 'bed-double', cat: '생활' },
    { id: 'foil', name: '은박 보온 시트', icon: 'sun', cat: '생활' },
    { id: 'headlamp', name: '헤드램프', icon: 'flashlight', cat: '비상 장비' },
    { id: 'marker', name: '종이·마커', icon: 'pencil', cat: '비상 장비' },
    { id: 'string', name: '끈', icon: 'cable', cat: '비상 장비' }
  ];

  const RECIPES = [
    {
      id: 'leakpatch', name: '임시 누출 패치', icon: 'gauge', use: '기압 손실', need: ['sheet', 'tape'],
      why: '작은 구멍으로 공기가 새는 것을 수리팀이 올 때까지 늦춰요.',
      steps: ['새는 곳보다 넓게 비닐 시트를 잘라 둬요.', '시트를 구멍 위에 대고 가장자리를 손으로 꾹 눌러요.', '고압 테이프로 네 변을 겹쳐 붙여 틈이 없게 해요.'],
      tip: '손바닥보다 큰 구멍이면 막으려 하지 말고 대피해요. 구멍에 손이나 몸을 대지 마세요.'
    },
    {
      id: 'waterwall', name: '물 차폐벽', icon: 'shield', use: '태양폭풍', need: ['waterpack', 'blanket'],
      why: '물은 방사선을 막는 좋은 방패예요. 두꺼울수록 더 많이 막아요.',
      steps: ['물 팩을 가득 채워 여러 개 준비해요.', '누울 자리의 머리·가슴 쪽에 물 팩을 벽처럼 쌓아요.', '담요로 덮어 무너지지 않게 고정해요.'],
      tip: '차폐 대피 모듈이 가까우면 그곳으로 먼저 가요. 물 차폐벽은 보조 수단이에요.'
    },
    {
      id: 'dustseal', name: '에어록 먼지 커튼', icon: 'wind', use: '먼지폭풍', need: ['sheet', 'clip'],
      why: '해로운 화성 먼지가 생활 공간으로 들어오는 것을 막아요.',
      steps: ['에어록 안쪽 문 앞에 비닐 시트를 걸 자리를 정해요.', '시트를 천장 쪽 손잡이에 집게로 고정해 커튼처럼 내려요.', '들어올 때 커튼 앞에서 옷과 장비의 먼지를 털어요.'],
      tip: '먼지가 이미 들어왔다면 먼지 필터 마스크를 써요.'
    },
    {
      id: 'co2adapter', name: '아폴로식 CO₂ 필터 연결', icon: 'filter', use: '생명유지 고장', need: ['cartridge', 'bag', 'tape'], adult: true,
      why: '모양이 맞지 않는 CO₂ 카트리지를 다른 장치에 연결해 쓸 수 있어요. 1970년 아폴로 13호 우주인들이 실제로 이렇게 살아 돌아왔어요.',
      steps: ['어른이 카트리지에 비닐봉지를 씌워요.', '봉지 입구를 공기 순환구에 대고 고압 테이프로 감아 틈을 막아요.', '봉지가 살짝 부풀며 공기가 지나가는지 확인해요.'],
      tip: '기지 관제의 안내와 함께 하세요. 실제 아폴로 13호에서는 상자·양말·호스도 썼어요.'
    },
    {
      id: 'lamp', name: '물 팩 랜턴', icon: 'lamp', use: '먼지폭풍·정전', need: ['headlamp', 'waterpack'],
      why: '헤드램프 하나로 방 전체를 밝혀 전력을 아껴요.',
      steps: ['물 팩을 가득 채워요.', '헤드램프 불빛이 위를 향하게 바닥에 놓아요.', '그 위에 물 팩을 올리면 빛이 방 안에 퍼져요.'],
      tip: '조명을 하나로 모으면 배터리를 오래 쓸 수 있어요.'
    },
    {
      id: 'warmlayer', name: '은박 보온 겹이불', icon: 'thermometer', use: '난방 정지', need: ['foil', 'blanket'],
      why: '은박이 몸에서 나가는 열을 되돌려 줘서 더 따뜻해요.',
      steps: ['은박 보온 시트를 반짝이는 면이 몸 쪽으로 오게 펼쳐요.', '그 위에 담요를 덮어요.', '은박과 담요 사이에 들어가 머리까지 감싸요.'],
      tip: '화성의 밤은 영하 70℃ 아래로 내려가요. 난방이 멈추면 가장 작은 방에 모여요.'
    },
    {
      id: 'mask', name: '젖은 수건 마스크', icon: 'wind', use: '거주구 화재', need: ['towel', 'waterpack'],
      why: '비상 산소마스크가 없을 때 연기를 조금이라도 덜 마시게 도와줘요.',
      steps: ['수건을 물 팩의 물로 적셔요.', '물이 뚝뚝 떨어지지 않게 살짝 짜요.', '코와 입을 막고 몸을 낮춰 해치 밖으로 대피해요.'],
      tip: '비상 산소마스크가 있다면 그것이 먼저예요. 대피가 가장 중요해요.'
    },
    {
      id: 'reflector', name: '반사판 구조 신호', icon: 'sun', use: '고립', need: ['foil', 'cardboard', 'tape'],
      why: '햇빛을 반짝여 멀리 있는 로버와 구조 로봇에게 내 위치를 알려요.',
      steps: ['보급품 상자를 손바닥 두 개 크기로 준비해요.', '은박 시트로 감싸고 반짝이는 면이 밖으로 오게 해요.', '테이프로 고정하고 해를 비춰 구조대 쪽으로 반짝여요.'],
      tip: '먼지폭풍으로 해가 가려지면 헤드램프 깜빡임으로 대신해요.'
    },
    {
      id: 'mat', name: '상자 단열 깔개', icon: 'square', use: '난방 정지', need: ['cardboard', 'blanket', 'tape'],
      why: '차가운 바닥의 냉기를 막아 몸이 덜 추워요.',
      steps: ['보급품 상자를 펼쳐 바닥에 깔아요.', '그 위에 담요를 한 겹 더 깔아요.', '상자끼리 테이프로 이어 붙여 넓게 만들어요.'],
      tip: '대피 모듈 바닥에 깔고 앉으면 훨씬 따뜻해요.'
    },
    {
      id: 'toilet', name: '비상 위생 상자', icon: 'package', use: '생명유지 고장', need: ['cardboard', 'bag'],
      why: '물 재생 장치가 멈춰도 위생을 지킬 수 있어요.',
      steps: ['보급품 상자 안쪽에 비닐봉지를 두 겹으로 씌워요.', '바닥에 잘게 찢은 종이를 넉넉히 넣어요.', '쓴 뒤에는 위쪽 봉지만 꽁꽁 묶어 정해진 곳에 모아요.'],
      tip: '냄새가 퍼지지 않게 쓴 봉지는 바로 묶어요.'
    },
    {
      id: 'tag', name: '비상 이름표', icon: 'id-card', use: '모든 재난', need: ['marker', 'bag', 'string'],
      why: '여압복을 입고 있어도 구조 로봇과 사람이 나를 알아볼 수 있어요.',
      steps: ['종이에 이름, 거주구 번호, 보호자 채널을 크게 적어요.', '작은 지퍼백에 넣고 닫아요.', '끈을 달아 여압복 가슴이나 팔에 묶어요.'],
      tip: '거주구 번호와 비상 채널은 외워 두는 것이 가장 좋아요.'
    },
    {
      id: 'flag', name: '구조 로봇 표시 천', icon: 'flag', use: '고립', need: ['towel'],
      why: '구조 로봇의 카메라가 사람이 있는 곳을 찾기 쉬워요.',
      steps: ['가장 밝은 색 수건이나 천을 골라요.', '창문이나 해치 유리 안쪽에 걸어요.', '밤에는 헤드램프를 그 옆에서 깜빡여요.'],
      tip: '창문 쪽에 오래 머물지 말고, 표시만 하고 안쪽으로 들어가요.'
    },
    {
      id: 'pouch', name: '먼지 차단 장비 주머니', icon: 'smartphone', use: '먼지폭풍', need: ['bag'],
      why: '고운 화성 먼지가 통신기와 장비 틈에 들어가는 것을 막아요.',
      steps: ['무전기·비콘을 지퍼백에 넣어요.', '공기를 빼고 꼭 닫아요.', '한 번 더 봉지에 넣어 두 겹으로 보관해요.'],
      tip: '봉지에 넣은 채로도 버튼은 누를 수 있게 넉넉한 크기를 골라요.'
    }
  ];


  // 근거 자료 (2026-11-05 확인). 공식 출처를 찾지 못한 것은 '일반 생활 안전 요령'으로 표시
  const SOURCES = {
    nasaIss: { t: 'NASA 국제우주정거장 운영 기록 (2018년 소유즈 누출을 테이프·접착제로 수리)', u: 'https://www.nasa.gov/international-space-station/' },
    apollo13: { t: 'NASA 아폴로 13호 기록 (1970년 CO₂ 필터 개조)', u: 'https://www.nasa.gov/' },
    shielding: { t: 'NASA 우주 방사선 차폐 연구 (물·수소가 많은 물질이 효과적)', u: 'https://www.nasa.gov/' },
    marsDust: { t: 'NASA 화성 먼지 자료 (과염소산염 함유)', u: 'https://science.nasa.gov/mars/' },
    tokyo: { t: "東京都 「東京防災」 p.199 (상자·비닐봉지 비상 화장실)", u: 'https://www.bousai.metro.tokyo.lg.jp/book/pdf/jp/20p7o413.pdf' },
    safekorea: { t: '행정안전부 국민재난안전포털 (화재 시 젖은 수건으로 코·입 막기)', u: 'https://www.safekorea.go.kr' },
    bepal: { t: 'BE-PAL 「페트병 랜턴 만들기」 (아웃도어 매체)', u: 'https://www.bepal.net/archives/302494' },
    general: { t: '일반 생존·안전 요령 (공식 출처 미확인)', u: '' }
  };
  const SRC_OF = { leakpatch: ['nasaIss'], co2adapter: ['apollo13'], waterwall: ['shielding'], dustseal: ['marsDust'], lamp: ['bepal'], mask: ['safekorea'], toilet: ['tokyo'], warmlayer: ['general'], reflector: ['general'], mat: ['general'], tag: ['general'], flag: ['general'], pouch: ['marsDust'] };
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
