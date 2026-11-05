/* BLACK-OUT : MARS — 가상(더미) API
   실제 서버가 없으므로, 기지 관제 API가 돌려줄 데이터를 이 파일에서 만들어 비동기로 돌려줍니다.
   모든 응답은 { source: 'DEMO', fetchedAt, data } 형태이며, 화면에는 "DEMO 데이터"로 표시합니다.
   실제 API로 바꿀 때는 아래 api.* 함수 안쪽만 fetch()로 교체하면 됩니다.

   좌표: 지도 사진(게일 크레이터) 기준 0~1 비율 (x: 왼→오, y: 위→아래). 축척: 사진 가로 = 45km (시연용 가정)
   시간: 화성 1솔 = 24시간 40분. 시연을 위해 실제 1초 = 화성 1분으로 흐릅니다. */
(function (RO) {
  const MAP = { kmWidth: 45, aspect: 1700 / 2200 };
  const CORE = { x: 0.45, y: 0.66 };
  const km = (a, b) => Math.hypot((a.x - b.x) * MAP.kmWidth, (a.y - b.y) * MAP.kmWidth * MAP.aspect);
  const dir = (from, to) => {
    const dx = to.x - from.x, dy = from.y - to.y; // 위쪽이 북
    const a = (Math.atan2(dx, dy) * 180) / Math.PI;
    return ['북', '북동', '동', '남동', '남', '남서', '서', '북서'][Math.round(((a + 360) % 360) / 45) % 8];
  };
  const round1 = (n) => Math.round(n * 10) / 10;

  /* ---------- 정착지 시설 (정적 데이터) ---------- */
  const FACILITIES = [
    { id: 'p1', type: 'pressure', name: '중앙 돔 비상 대피 구역 P-1', x: 0.4567, y: 0.6543, cap: 120 },
    { id: 'p2', type: 'pressure', name: '서쪽 돔 비상 대피 구역 P-2', x: 0.4145, y: 0.6256, cap: 60 },
    { id: 'p3', type: 'pressure', name: '남부 돔 비상 대피 구역 P-3', x: 0.4811, y: 0.7031, cap: 80 },
    { id: 'p4', type: 'pressure', name: '연구동 비상 대피 구역 P-4', x: 0.5320, y: 0.7380, cap: 40 },
    { id: 's1', type: 'shield', name: '지하 방사선 대피소 S-1 (암반 8m)', x: 0.4678, y: 0.6083, cap: 200 },
    { id: 's2', type: 'shield', name: '레골리스 방사선 벙커 S-2', x: 0.4012, y: 0.6772, cap: 50 },
    { id: 's3', type: 'shield', name: '용암동굴 대피소 S-3', x: 0.5050, y: 0.5800, cap: 150 },
    { id: 'r1', type: 'robot', name: '구조 로봇 R-1', x: 0.4411, y: 0.6428 },
    { id: 'r2', type: 'robot', name: '구조 로봇 R-2', x: 0.3834, y: 0.6169 },
    { id: 'r3', type: 'robot', name: '구조 로봇 R-3', x: 0.5033, y: 0.6944 },
    { id: 'r4', type: 'robot', name: '수리 로봇 M-4', x: 0.4900, y: 0.6300 },
    { id: 'h1', type: 'people', name: '이웃 거주민 HAB-03', x: 0.4722, y: 0.6428, members: 6 },
    { id: 'h2', type: 'people', name: '이웃 거주민 HAB-11', x: 0.4167, y: 0.6657, members: 4 },
    { id: 'h3', type: 'people', name: '연구팀 거주민 HAB-19', x: 0.4944, y: 0.7231, members: 9 },
    { id: 'h4', type: 'people', name: '의료진 거주구 HAB-05', x: 0.4633, y: 0.6715, members: 3 },
    { id: 'v1', type: 'rover', name: '대피 로버 차고 V-1', x: 0.5210, y: 0.6370, seats: 12 },
    { id: 'v2', type: 'rover', name: '대피 로버 정류장 V-2', x: 0.4278, y: 0.7117, seats: 4 },
    { id: 'v3', type: 'rover', name: '장거리 대피 로버 V-3', x: 0.5610, y: 0.7461, seats: 8 }
  ];
  const ZONES = [
    { id: 'HAB-07', name: '돔 도시 중앙 HAB-07', x: 0.4522, y: 0.6629, housing: '돔 도시' },
    { id: 'HAB-12', name: '지하 거주 구역 HAB-12', x: 0.4722, y: 0.5969, housing: '지하 거주 구역' },
    { id: 'HAB-21', name: '개인 거주 모듈 HAB-21', x: 0.5499, y: 0.7748, housing: '개인 거주 모듈' },
    { id: 'RV-25', name: '이동형 로버 정류장 RV-25', x: 0.3168, y: 0.8035, housing: '이동형 로버' },
    { id: 'OUT-30', name: '외곽 연구 기지 OUT-30', x: 0.1392, y: 0.3730, housing: '외곽 연구 기지' }
  ];
  const F = (id) => FACILITIES.find((f) => f.id === id);
  const Z = (id) => ZONES.find((z) => z.id === id);

  /* ---------- 시계 (실제 1초 = 화성 1분) ---------- */
  const T0 = Date.now();
  const START = { sol: 1284, min: 14 * 60 + 32 };
  function clock() {
    const m = START.min + Math.floor((Date.now() - T0) / 1000);
    const day = 24 * 60 + 40;
    const sol = START.sol + Math.floor(m / day), mm = m % day;
    return { sol, min: mm, text: `SOL ${sol.toLocaleString('en-US')} · ${String(Math.floor(mm / 60) % 25).padStart(2, '0')}:${String(mm % 60).padStart(2, '0')}` };
  }
  const elapsedMin = () => Math.floor((Date.now() - T0) / 1000);
  const wobble = (seed, amp) => Math.sin(Date.now() / 4000 + seed) * amp;

  /* ---------- 진행 중인 재난 상황 (시간이 흐르며 변함) ---------- */
  // 먼지 폭풍 전선: 서쪽에서 시속 18km로 다가옴 (지도 비율 x 기준)
  const DUST = { startX: 0.08, kmh: 18 };
  function dustFrontX() {
    const kmMoved = (DUST.kmh * elapsedMin()) / 60;
    let x = DUST.startX + kmMoved / MAP.kmWidth;
    if (x > 0.62) x = DUST.startX + ((x - DUST.startX) % (0.62 - DUST.startX)); // 시연용 반복
    return x;
  }
  const QUAKE = { x: 0.62, y: 0.72, mag: 3.1, depth: 24 };
  const METEOR = { x: 0.80, y: 0.47, size: 6 };
  const LEAK_AT = 'h2', LIFE_AT = 'h4', COLD_AT = 'HAB-21', POWER_AT = 'RV-25', FIRE_AT = 'h3';

  function alerts() {
    const c = clock();
    const fx = dustFrontX();
    const frontKm = Math.max(0, (CORE.x - fx) * MAP.kmWidth);
    const eta = Math.round((frontKm / DUST.kmh) * 60);
    const q = km(QUAKE, F('s1')), m = km(METEOR, CORE);
    return [
      { id: 'ALT-DUST', hazard: 'dust', level: frontKm > 0 ? '경보' : '심각', title: '먼지 폭풍 경보', area: '게일 정착지 전역',
        issued: `SOL ${c.sol} 13:50`, at: { x: fx, y: 0.6 },
        message: frontKm > 0 ? `서쪽에서 먼지 폭풍이 시속 ${DUST.kmh}km로 다가오고 있어요. 약 ${round1(frontKm)}km 남았고, 약 ${eta}분 뒤 정착지에 도착해요. 일주일쯤 이어질 거예요.`
          : '먼지 폭풍이 정착지를 덮었어요. 앞이 50m도 안 보이고, 태양광 전기가 크게 줄었어요.',
        action: '밖에 있다면 바로 들어오고, 들어올 때 먼지를 털어요. 안 쓰는 전기는 꺼요.' },
      { id: 'ALT-LEAK', hazard: 'depress', level: '경보', title: `${F(LEAK_AT).name.split(' ').pop()} 공기 누출`, area: F(LEAK_AT).name,
        issued: `SOL ${c.sol} 14:05`, at: F(LEAK_AT),
        message: `B모듈 공기가 1분마다 조금씩 빠져나가고 있어요. 사는 사람 ${F(LEAK_AT).members}명은 ${F('p2').name.split(' ').pop()} 대피 구역으로 옮겼고, 구조 로봇 R-2가 구멍을 막고 있어요.`,
        action: '근처에 사는 사람은 산소호흡기를 손 가까이 두고 문을 닫아 두세요.' },
      { id: 'ALT-SOLAR', hazard: 'solar', level: '주의', title: '태양 방사선 주의', area: '화성 전역',
        issued: `SOL ${c.sol} 09:12`, at: { x: 0.86, y: 0.16 },
        message: '태양에서 아주 큰 폭발이 일어났어요. 몸에 해로운 방사선이 약 11시간 뒤 화성에 도착할 수 있어요. 지금은 평소와 같아요.',
        action: '지하 방사선 대피소 위치를 확인하고, 내일 밖에서 할 일은 미뤄 두세요.' },
      { id: 'ALT-LIFE', hazard: 'life', level: '주의', title: 'HAB-05 이산화탄소 상승', area: F(LIFE_AT).name,
        issued: `SOL ${c.sol} 14:20`, at: F(LIFE_AT),
        message: '공기를 깨끗하게 하는 장치가 약해져서 내쉰 숨(이산화탄소)이 평소의 2배로 늘었어요. 수리 로봇 M-4가 가고 있어요.',
        action: '머리가 아프거나 졸리면 비상 카트리지를 끼우고 관제에 알려요.' },
      { id: 'ALT-POWER', hazard: 'power', level: '주의', title: 'RV-25 전력 저하', area: Z(POWER_AT).name,
        issued: `SOL ${c.sol} 13:58`, at: Z(POWER_AT),
        message: '먼지가 태양광 판을 덮어서 전기가 평소의 38%로 줄었어요. 비상 배터리로 약 3.5솔 버틸 수 있어요.',
        action: '공기·난방 말고는 전기를 끄고, 필요하면 대피 로버 V-2를 타고 정착지 가운데로 옮겨요.' },
      { id: 'ALT-COLD', hazard: 'cold', level: '주의', title: 'HAB-21 난방 고장', area: Z(COLD_AT).name,
        issued: `SOL ${c.sol} 12:44`, at: Z(COLD_AT),
        message: '히터 1대가 멈춰서 집 안이 14℃까지 내려갔어요. 오늘 밤 바깥은 영하 82℃까지 떨어져요.',
        action: '가장 작은 방에 모이고 보온 담요를 준비해요. 이웃 HAB-19에서 함께 지낼 수 있어요.' },
      { id: 'ALT-QUAKE', hazard: 'quake', level: '정보', title: `화성 지진 M${QUAKE.mag} 감지`, area: `${F('s1').name.split(' ').pop()} ${dir(F('s1'), QUAKE)}쪽 약 ${round1(q)}km`,
        issued: `SOL ${c.sol} 11:31`, at: QUAKE,
        message: `땅속 ${QUAKE.depth}km에서 규모 ${QUAKE.mag}의 약한 화성 지진이 있었어요. 피해는 없지만 한 번 더 흔들릴 수 있어요.`,
        action: '흔들림이 멈추면 기압계로 공기가 새는지부터 확인해요.' },
      { id: 'ALT-METEOR', hazard: 'meteor', level: '해제', title: '운석 충돌 (상황 종료)', area: `정착지 ${dir(CORE, METEOR)}쪽 약 ${round1(m)}km`,
        issued: `SOL ${c.sol - 1} 03:12`, at: METEOR,
        message: `작은 운석이 떨어져 지름 약 ${METEOR.size}m 구덩이가 생겼어요. 정착지 피해는 없고, 주변 1km는 들어가지 못하게 막았어요.`,
        action: '그 근처로 나갈 때는 관제의 허락을 먼저 받아요.' },
      { id: 'ALT-FIRE', hazard: 'fire', level: '해제', title: 'HAB-19 주방 화재 (진화 완료)', area: F(FIRE_AT).name,
        issued: `SOL ${c.sol - 1} 19:40`, at: F(FIRE_AT),
        message: '요리 기계가 너무 뜨거워져 작은 불이 났지만 소화기로 1분 만에 껐어요. 다친 사람은 없어요.',
        action: '뜨거워진 기계는 전원을 뽑아 두고, 측정기로 공기가 안전한지 확인해요.' }
    ];
  }

  /* ---------- 시설 실시간 상태 ---------- */
  function facilityStatus() {
    const a = alerts();
    const leak = a.find((x) => x.id === 'ALT-LEAK');
    return FACILITIES.map((f) => {
      const n = Math.abs(wobble(f.x * 50, 1));
      if (f.type === 'pressure' || f.type === 'shield') {
        let used = Math.round(f.cap * (0.12 + n * 0.15));
        if (f.id === 'p2' && leak) used = Math.min(f.cap, used + F(LEAK_AT).members + 38);
        const ratio = used / f.cap;
        const st = f.id === 's2' ? { key: 'check', label: '점검 중', note: '환기 장치 점검 · 16:00 재개방' }
          : ratio > 0.85 ? { key: 'full', label: '거의 만원', note: `${used}/${f.cap}명` }
          : ratio > 0.6 ? { key: 'busy', label: '혼잡', note: `${used}/${f.cap}명` }
          : { key: 'open', label: '개방', note: `${used}/${f.cap}명 · 여유 있음` };
        return { ...f, status: st, used };
      }
      if (f.type === 'robot') {
        const battery = Math.round(55 + n * 40);
        const st = f.id === 'r2' ? { key: 'busy', label: '출동 중', note: `HAB-11 누출 대응 · 배터리 ${battery}%` }
          : f.id === 'r4' ? { key: 'busy', label: '출동 중', note: `HAB-05 공기 정화 장치 수리 · 배터리 ${battery}%` }
          : f.id === 'r3' ? { key: 'check', label: '충전 중', note: `배터리 ${Math.round(30 + n * 20)}% · 약 40분 뒤 대기` }
          : { key: 'open', label: '호출 가능', note: `배터리 ${battery}% · 바로 출발` };
        return { ...f, status: st };
      }
      if (f.type === 'rover') {
        const free = Math.max(0, Math.round(f.seats * (0.4 + n * 0.5)));
        const st = free === 0 ? { key: 'full', label: '만석', note: '다음 운행 30분 뒤' } : { key: 'open', label: '탑승 가능', note: `${free}/${f.seats}석 남음` };
        return { ...f, status: st, free };
      }
      // people
      const st = f.id === 'h2' ? { key: 'busy', label: '대피 중', note: '공기 누출로 P-2에 대피' }
        : f.id === 'h3' ? { key: 'open', label: '도움 가능', note: `${f.members}명 · 2명까지 함께 지낼 수 있어요` }
        : { key: 'open', label: '응답 가능', note: `${f.members}명 거주 · 비상 채널 16` };
      return { ...f, status: st };
    });
  }

  /* ---------- 거주구 환경 (히어로 상태판) ---------- */
  function environment() {
    const fx = dustFrontX();
    const covered = fx >= CORE.x;
    const tau = round1((covered ? 5.6 : 4.2) + wobble(1, 0.2));
    return {
      clock: clock().text,
      delaySec: Math.round(12 * 60 + 41 + wobble(2, 8)),
      pressurePa: Math.round(610 + wobble(3, 6)),
      tempC: Math.round(-63 + wobble(4, 3)),
      o2: round1(20.9 + wobble(5, 0.15)),
      tau,
      solarPower: Math.round(Math.max(12, 62 - tau * 6 + wobble(6, 2))),
      radiation: round1(0.7 + wobble(7, 0.05))
    };
  }

  /* ---------- 재난별 상황 시나리오 (행동수칙 화면) ---------- */
  const SCENARIOS = {
    dust: { metrics: [['먼지 짙기', '보통의 8배 → 11배'], ['바람', '최대 시속 100km'], ['얼마나 오래', '6~9솔 (약 일주일)'], ['태양광 전기', '38% → 15%']],
      timeline: ['경보 직후|서쪽 하늘에 먼지 벽이 보여요', '40분 뒤|정착지를 덮어요. 앞이 50m도 안 보여요', '1솔 뒤|전기가 가장 적어요. 배터리로 버텨요', '7솔 뒤|먼지가 가라앉기 시작해요'] },
    solar: { metrics: [['태양 폭발 크기', '아주 큼 (5단계 중 5)'], ['도착까지', '약 11시간'], ['방사선 양', '평소의 30배 예상'], ['대피 시간', '반나절~하루 반']],
      timeline: ['지금|태양 폭발이 관측돼 "주의"가 떠요', '10시간 뒤|"경보"로 바뀌어요. 대피소로 가요', '11시간 뒤|방사선이 도착해요', '하루 반 뒤|"해제" 안내가 와요'] },
    quake: { metrics: [['세기', '규모 3.1 (약하게 흔들림)'], ['흔들린 시간', '약 10초'], ['피해', '신고 없음'], ['여진', '하루 안에 올 수 있어요']],
      timeline: ['흔들릴 때|몸을 낮추고 머리를 지켜요', '1분 뒤|기계가 자동으로 공기 새는지 점검해요', '10분 뒤|금 간 곳 신고를 받아요', '1솔 뒤|여진 감시를 마쳐요'] },
    meteor: { metrics: [['구덩이 크기', '지름 약 6m'], ['위험 범위', '반경 1km 출입 금지'], ['경보 시간', '몇 초~몇 분 전'], ['정착지 피해', '없음']],
      timeline: ['충돌 순간|큰 소리와 함께 땅이 울려요', '1분 뒤|벽과 공기를 점검해요', '30분 뒤|떨어진 곳 근처 출입을 막아요', '1솔 뒤|상황이 끝나요'] },
    depress: { metrics: [['공기 빠지는 속도', '1분마다 조금씩'], ['버틸 수 있는 시간', '약 40분'], ['대피한 사람', '4명'], ['도우러 간 로봇', '구조 로봇 R-2']],
      timeline: ['경보 직후|산소호흡기를 써요', '5분 뒤|대피 구역으로 옮기고 문을 닫아요', '20분 뒤|로봇이 구멍을 막아요', '2시간 뒤|공기가 돌아오면 집으로 가요'] },
    fire: { metrics: [['원인', '요리 기계가 너무 뜨거워짐'], ['끈 시간', '소화기로 1분'], ['막아 둔 곳', 'B모듈 문'], ['다친 사람', '없음']],
      timeline: ['연기 경보|산소호흡기를 써요', '1분 뒤|전기를 끄고 불을 꺼요', '5분 뒤|문을 닫고 사람 수를 세요', '1시간 뒤|공기를 재고 "안전"을 확인해요'] },
    life: { metrics: [['이산화탄소', '평소의 2배'], ['산소', '조금 낮음 (20.4%)'], ['원인', '공기 정화 장치가 약해짐'], ['도우러 간 로봇', '수리 로봇 M-4']],
      timeline: ['알림 직후|비상 카트리지를 끼워요', '5분 뒤|움직임을 줄이고 쉬어요', '30분 뒤|수리 로봇이 도착해요', '3시간 뒤|공기가 정상으로 돌아와요'] },
    power: { metrics: [['태양광 전기', '평소의 38%'], ['배터리로 버티는 시간', '약 3.5솔'], ['지켜야 할 순서', '공기 > 난방 > 물'], ['도움 받을 곳', '배터리 창고 B-2']],
      timeline: ['전기 끊김|비상 라이트를 켜요', '5분 뒤|안 쓰는 전기를 꺼요', '1시간 뒤|전기 도움을 요청해요', '3솔 안에|배터리가 떨어지기 전에 대피를 정해요'] },
    cold: { metrics: [['집 안 온도', '14℃, 계속 내려가요'], ['오늘 밤 바깥', '영하 82℃'], ['원인', '히터 1대 고장'], ['함께 지낼 수 있는 곳', 'HAB-19 (2명)']],
      timeline: ['알림 직후|작은 방에 모여요', '5분 뒤|담요로 감싸고 껴입어요', '1시간 뒤|이웃 집으로 갈지 정해요', '8시간 뒤|수리가 끝날 예정이에요'] }
  };

  /* ---------- API (가상 지연 후 응답) ---------- */
  const respond = (data, ms = 220 + Math.random() * 260) => new Promise((resolve) => setTimeout(() => resolve({ source: 'DEMO', fetchedAt: clock().text, data }), ms));
  const api = {
    getFacilities: () => respond(facilityStatus()),
    getZones: () => respond(ZONES),
    getAlerts: () => respond(alerts()),
    getEnvironment: () => respond(environment(), 120),
    getScenario: (hazard) => respond({ ...SCENARIOS[hazard], alert: alerts().find((a) => a.hazard === hazard) || null }),
    // 지도 위 재난 상황 그리기용 (먼지 전선 위치 등)
    getIncidents: () => respond({ dustFrontX: dustFrontX(), quake: QUAKE, meteor: METEOR, alerts: alerts() })
  };

  RO.marsApi = { ...api, FACILITIES, ZONES, CORE, MAP, km, facilityStatus, alerts };
})(window.RO);
