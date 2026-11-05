/* BLACK-OUT : MARS — 화성 거주구 재난별 행동수칙 데이터 + 탭 UI
   국제우주정거장 비상 대응 순서와 NASA 공개 화성 환경 자료를 바탕으로 한 시연용 콘텐츠입니다. */
(function (RO) {
  const STAGES = [
    { key: 'now', no: '01', label: '지금 해야 할 일', time: '즉시', hint: '위험한 순간, 가장 먼저 할 일' },
    { key: 'min5', no: '02', label: '5분 후 해야 할 일', time: '5분 후', hint: '몸을 지킨 다음 할 일' },
    { key: 'hour1', no: '03', label: '1시간 후 해야 할 일', time: '1시간 후', hint: '상황이 가라앉은 뒤 할 일' }
  ];

  // 화성 재난 9종. ISS 비상 대응 순서와 NASA 공개 화성 관측(인사이트의 화성 지진·운석 충돌 기록, 2018년 먼지 폭풍 등)을 바탕으로 한 시연용 수칙.
  // bot: 주변 구조 로봇·AI 보조 도우미가 있을 때 / solo: 없을 때 하는 일
  const DISASTERS = {
    dust: {
      label: '먼지 폭풍', en: 'DUST STORM', icon: 'tornado',
      intro: '먼지가 해를 가리면 전기가 줄어요. 밖에서 돌아오고, 먼지를 막고, 전기를 아껴요.',
      now: [
        { t: '밖의 작업 멈추고 거주구로', d: '먼지 폭풍 경보가 오면 밖에서 하던 일을 멈추고 돌아와요. 시야가 몇 미터로 줄 수 있어요.', c: '로버로 먼 거리를 이동하지 마세요.', items: ['item-headlamp'], bot: '구조 로봇에게 내 위치를 보내고 귀환 경로 안내를 받아요.', solo: '왔던 길의 표지를 따라 천천히 돌아오고, 길을 잃으면 그 자리에서 비콘을 켜요.' },
        { make: 'dustseal', t: '에어록에서 먼지 털기', d: '들어올 때 에어록에서 옷과 장비의 먼지를 털어요. 화성 흙에는 몸에 해로운 과염소산염이 섞여 있어요.', c: '먼지가 들어왔다면 방진 필터 마스크를 써요.', items: ['item-dustmask'] }
      ],
      min5: [
        { t: '꼭 필요하지 않은 전기 끄기', d: '태양광 발전이 크게 줄어요. 생명유지에 필요 없는 조명·장비부터 꺼요.', c: '산소 생성·물 재생·난방은 마지막까지 지켜요.', items: ['item-battery'], bot: 'AI 도우미에게 전력 절약 모드를 켜 달라고 해요.', solo: '전력 계획 카드를 보고 끌 장비를 순서대로 꺼요.' }
      ],
      hour1: [
        { t: '며칠~몇 주 전력 계획 세우기', d: '2018년 화성 전체를 덮은 먼지 폭풍은 몇 달 이어졌고, 태양광 로버 오퍼튜니티가 그때 멈췄어요. 남은 배터리로 며칠 버틸지 계산해 하루 사용량을 정해요.', c: '', items: ['item-battery'] },
        { make: 'lamp', t: '조명은 하나로 모아 쓰기', d: '방마다 불을 켜지 말고 비상 라이트 하나를 물 팩 랜턴으로 바꿔 함께 써요.', c: '', items: ['item-headlamp'] }
      ]
    },
    solar: {
      label: '태양 방사선 폭풍', en: 'SOLAR STORM', icon: 'sun',
      intro: '태양에서 고에너지 입자가 쏟아지면 두꺼운 벽 뒤로. 물과 흙이 방패예요.',
      now: [
        { t: '경보가 오면 지하 방사선 대피소로', d: '태양 방사선 경보가 오면 암반·물탱크·레골리스로 두껍게 둘러싼 지하 방사선 대피소로 이동해요.', c: '창가와 얇은 외벽 쪽은 피하세요.', items: [], bot: '구조 로봇에게 가장 가까운 대피소까지 길 안내를 요청해요.', solo: '비상 카드에 적어 둔 대피소로 바로 가요.' },
        { t: '밖에 있다면 즉시 복귀', d: '거주구 밖에서 작업 중이면 멈추고 가장 가까운 에어록으로 돌아와요.', c: '로버 안은 차폐가 얇아요. 로버에서 기다리지 말고 건물 안으로 들어가요.', items: [] }
      ],
      min5: [
        { t: '선량계 달고 차폐 조끼 입기', d: '개인 선량계를 달고 차폐 조끼를 입어 가슴과 배를 보호해요. 비슷한 조끼가 2022년 NASA 아르테미스 1호에서 시험됐어요.', c: '방사선 피부 케어 크림은 피부 건조·자극 완화용이에요. 입자를 막지는 못해요.', items: ['item-dosimeter', 'item-vest', 'item-cream'] },
        { make: 'waterwall', t: '물 차폐 팩으로 벽 보강', d: '물을 채운 차폐 팩을 누울 자리 주변에 쌓으면 차폐가 더 두꺼워져요.', c: '', items: ['item-waterbag'] }
      ],
      hour1: [
        { t: '해제될 때까지 대피소에서 대기', d: '태양 입자 사건은 몇 시간에서 하루 넘게 이어질 수 있어요. 기지가 해제를 알릴 때까지 기다려요.', c: '선량계 수치는 기록해 두고 의료 담당에게 알려요.', items: ['item-ration'] }
      ]
    },
    quake: {
      label: '화성 지진', en: 'MARSQUAKE', icon: 'activity',
      intro: '화성도 흔들려요. NASA 인사이트는 4년 동안 1,300번 넘는 화성 지진을 기록했어요.',
      now: [
        { t: '몸을 낮추고 머리 보호', d: '흔들리면 바닥에 몸을 낮추고 손잡이를 잡은 채 머리를 보호해요.', c: '중력이 지구의 38%라 물건이 천천히, 멀리 튕겨요. 선반 가까이에 있지 마세요.', items: ['item-helmet'] }
      ],
      min5: [
        { t: '흔들림이 멈추면 기압부터 확인', d: '벽에 금이 가면 공기가 샐 수 있어요. 기압계와 누출 경보를 먼저 확인해요.', c: '기압이 떨어지면 바로 공기 누출 행동수칙으로 넘어가요.', items: ['item-gauge'], bot: '구조 로봇에게 거주구 전체 기압·구조 점검을 맡겨요.', solo: '해치와 창 둘레에 손을 대지 말고 소리(쉬익)를 들어 보며 둘러봐요.' },
        { t: '출구 확보', d: '해치가 틀어져 안 열리기 전에 열어 두고, 대피할 통로를 확인해요.', c: '', items: [] }
      ],
      hour1: [
        { t: '구조물 이상 보고', d: '금 간 곳, 기울어진 장비를 기지에 알리고 점검이 끝날 때까지 그 구역을 쓰지 않아요.', c: '', items: ['item-beacon'] }
      ]
    },
    meteor: {
      label: '운석 충돌', en: 'METEORITE IMPACT', icon: 'zap',
      intro: '화성은 대기가 얇아 작은 운석도 땅까지 떨어져요. 인사이트는 2021년 운석이 만든 150m 크레이터를 지진계로 감지했어요.',
      now: [
        { t: '충돌 경보가 오면 지하로', d: '궤도 감시에서 충돌 경보가 오면 가장 두꺼운 지하 구역으로 이동해요.', c: '', items: [], bot: '구조 로봇이 대피를 안내하고 남은 사람을 찾아요.', solo: '이웃에게 무전으로 알리고 함께 지하로 내려가요.' },
        { t: '충격 직후 산소호흡기 착용', d: '근처에 떨어졌다면 외벽이 뚫렸을 수 있어요. 바로 산소호흡기를 써요.', c: '', items: ['item-o2mask'] }
      ],
      min5: [
        { make: 'leakpatch', t: '누출과 화재 함께 확인', d: '구멍이 났는지 기압계로, 불꽃이 튀었는지 연기 측정기로 확인하고 해치를 닫아 격리해요.', c: '', items: ['item-gauge', 'item-comask'] }
      ],
      hour1: [
        { t: '외벽 점검은 구조팀에게', d: '손상 위치를 기지에 보고하고, 밖에 나가 확인하는 일은 구조팀에게 맡겨요.', c: '', items: ['item-beacon'] }
      ]
    },
    depress: {
      label: '공기 누출', en: 'AIR LEAK', icon: 'gauge',
      intro: '공기가 새면 숨부터 지키고, 사람을 모으고, 새는 곳을 막거나 떠나요.',
      now: [
        { t: '경보가 울리면 산소호흡기부터', d: '경보음이 울리고 귀가 먹먹해지면 기압이 떨어지는 중이에요. 가장 가까운 산소호흡기를 바로 써요.', c: '산소호흡기를 쓰기 전에 짐을 챙기지 마세요. 숨이 먼저예요.', items: ['item-o2mask', 'item-o2cyl'] },
        { t: '사람을 모아 돔 비상 대피 구역으로', d: '같은 거주구 사람을 소리쳐 부르고 공기가 새지 않는 비상 대피 구역으로 함께 이동해요.', c: '혼자 누출 구역에 남거나 다시 들어가지 마세요.', items: [], bot: '구조 로봇을 호출해 남은 사람 수색과 해치 닫기를 맡겨요.', solo: '비콘을 켜서 이웃과 기지에 위치를 알린 뒤 이동해요.' },
        { t: '해치를 닫아 새는 구역 격리', d: '모두 나오면 뒤쪽 해치를 닫아 공기가 새는 구역을 막아요.', c: '해치가 닫히지 않으면 무리하지 말고 다음 해치까지 물러나요.', items: [] }
      ],
      min5: [
        { t: '압력 확인하고 조절', d: '기압계로 기압이 얼마나 빨리 떨어지는지 보고, 휴대용 압력 조절기로 산소호흡기 공급 압력을 맞춰요. 국제우주정거장도 새는 속도로 "버틸 수 있는 시간"을 계산해 대피를 정해요.', c: '기압이 빠르게 떨어지면 수리보다 대피가 먼저예요.', items: ['item-gauge', 'item-regulator'] },
        { make: 'leakpatch', t: '작은 누출이면 찾아서 막기', d: '초음파 누출 탐지기로 새는 곳을 찾고, 손바닥보다 작으면 패치와 고압 테이프로 막아요. 2018년 우주정거장 우주인들도 테이프로 구멍을 막았어요.', c: '구멍에 손이나 몸을 대지 마세요.', items: ['item-leak', 'item-patch'] }
      ],
      hour1: [
        { t: '비상 우주복 점검 후 대기', d: '대피 구역에서 비상 우주복과 산소 잔량을 점검하며 수리팀을 기다려요.', c: '격리 구역은 수리팀이 확인하기 전까지 들어가지 않아요.', items: ['item-suit'] }
      ]
    },
    fire: {
      label: '내부 화재', en: 'HAB FIRE', icon: 'flame',
      intro: '좁은 거주구는 연기가 금방 차요. 알리고, 숨을 지키고, 바람과 전기를 끊어요.',
      now: [
        { t: '"불이야!" 알리고 산소호흡기 착용', d: '크게 외치고 화재 경보를 누른 뒤 산소호흡기를 써요.', c: '연기 속에서 그냥 숨 쉬지 마세요.', items: ['item-o2mask'] },
        { t: '환기 팬과 그 구역 전원 끄기', d: '바람이 불을 키우니 불난 구역의 환기 팬과 전원을 꺼요. 국제우주정거장의 화재 대응도 같은 순서예요.', c: '', items: [], bot: 'AI 도우미에게 그 구역 전원·환기 차단을 바로 요청해요.', solo: '벽의 비상 차단 스위치를 직접 내려요.' },
        { t: '작은 불만 CO₂ 소화기로', d: '불이 작고 원인이 보이면 CO₂ 소화기로 꺼요. 크거나 번지면 바로 대피해요.', c: '전기 장비에 물을 쓰지 마세요.', items: ['item-extinguisher'] }
      ],
      min5: [
        { t: '해치 닫아 격리, 인원 확인', d: '모두 빠져나오면 해치를 닫아 연기를 가두고, 모인 곳에서 인원을 세요.', c: '사람이 남았는지 꼭 세어 보고 닫아요.', items: ['item-beacon'] }
      ],
      hour1: [
        { t: '공기 안전 확인 전 마스크 유지', d: '불이 꺼져도 일산화탄소 같은 유독 가스가 남아요. 측정기가 안전하다고 할 때까지 산소호흡기를 벗지 마세요.', c: '', items: ['item-comask'] }
      ]
    },
    life: {
      label: '생명유지장치 고장', en: 'LIFE SUPPORT', icon: 'heart-pulse',
      intro: '공기를 만드는 장치가 멈추면 숨이 가빠져요. 몸의 신호를 먼저 알아채요.',
      now: [
        { t: '두통·숨참은 이산화탄소 신호', d: '머리가 아프고 숨이 차고 졸리면 이산화탄소가 쌓이는 신호예요. 경보가 없어도 바로 기지에 알려요.', c: '참고 버티지 마세요.', items: [], bot: 'AI 도우미에게 공기 성분을 물어보고 기지에 자동 보고하게 해요.', solo: '무전으로 이웃과 기지에 직접 알려요.' },
        { make: 'co2adapter', t: '비상 CO₂ 흡착 카트리지 끼우기', d: 'CO₂ 제거 장치가 멈추면 비상 흡착 카트리지를 끼워요. 아폴로 13호 우주인들도 이 카트리지로 버텼어요.', c: '', items: ['item-co2'] }
      ],
      min5: [
        { t: '산소가 모자라면 비상 산소 캔들', d: '산소 발생 장치가 멈추면 비상 산소 발생 캔들을 켜요. 국제우주정거장에도 같은 방식의 비상 산소 장치가 있어요.', c: '어른만 다루고, 타기 쉬운 물건과 떨어뜨려요.', items: ['item-o2candle'] },
        { t: '움직임을 줄여 산소 아끼기', d: '뛰거나 운동하면 산소를 더 써요. 앉아서 천천히 숨 쉬어요.', c: '', items: [] }
      ],
      hour1: [
        { t: '수리를 기다리거나 대피 구역으로', d: '기지 안내에 따라 수리를 기다리거나, 생명유지장치가 따로 있는 비상 대피 구역으로 옮겨요.', c: '', items: ['item-o2cyl'] }
      ]
    },
    power: {
      label: '전력 차단', en: 'POWER LOSS', icon: 'zap-off',
      intro: '전기가 끊기면 산소·물·난방이 모두 멈춰요. 빛부터 켜고, 생명유지 전원부터 지켜요.',
      now: [
        { t: '초고휘도 비상 라이트 켜기', d: '어둠 속에서 움직이지 말고 비상 라이트부터 켜요.', c: '', items: ['item-headlamp'] },
        { t: '생명유지 장치 비상 전원 확인', d: '산소 생성·공기 순환 장치가 비상 배터리로 넘어갔는지 표시등을 확인해요.', c: '표시등이 꺼져 있으면 바로 기지에 알려요.', items: ['item-battery'], bot: 'AI 도우미가 비상 전원 전환을 확인하고 남은 시간을 알려 줘요.', solo: '배터리 잔량 표시를 보고 남은 시간을 직접 계산해요.' }
      ],
      min5: [
        { t: '전기 우선순위 정하기', d: '1순위 산소·공기, 2순위 난방, 3순위 물 재생 순으로 남기고 나머지는 꺼요.', c: '', items: [] }
      ],
      hour1: [
        { t: '전력 지원 요청', d: '정착지 배터리 저장고나 다른 거주구에 전력 지원을 요청하고, 오래 걸리면 대피 구역으로 옮겨요.', c: '', items: ['item-beacon'] }
      ]
    },
    cold: {
      label: '난방 고장 (극저온)', en: 'EXTREME COLD', icon: 'snowflake',
      intro: '화성의 밤은 영하 70~100℃까지 내려가요. 열을 한곳에 모으고 몸을 감싸요.',
      now: [
        { t: '가장 작은 방에 모이기', d: '모두 가장 작은 방으로 모이고 해치를 닫아 남은 열을 지켜요.', c: '', items: [], bot: '구조 로봇에게 이웃 거주민 중 난방이 되는 곳을 찾게 해요.', solo: '무전으로 이웃에게 상황을 알리고 함께 지낼 수 있는지 물어요.' },
        { make: 'warmlayer', t: '비상 보온 담요로 몸 감싸기', d: '은박 비상 보온 담요를 반짝이는 면이 몸 쪽으로 오게 두르고 그 위에 담요를 덮어요.', c: '', items: ['item-blanket'] }
      ],
      min5: [
        { make: 'mat', t: '바닥 냉기 막고 겹쳐 입기', d: '바닥에 상자나 담요를 깔고, 옷을 여러 겹 입어요. 물은 얼지 않게 몸 가까이 둬요.', c: '', items: ['item-blanket'] }
      ],
      hour1: [
        { t: '저체온 신호 살피기', d: '심하게 떨리거나 말이 어눌해지면 저체온 신호예요. 서로 살피고, 오래가면 난방이 되는 대피 구역으로 옮겨요.', c: '', items: ['item-aid'] }
      ]
    }
  };

  // 오프라인 카드에 들어갈 재난별 핵심 3줄
  const CORE = {
    dust: ['밖의 작업 멈추고 복귀', '에어록에서 먼지 털기', '필요 없는 전기부터 끄기'],
    solar: ['경보 → 지하 방사선 대피소로', '선량계·차폐 조끼 착용', '해제될 때까지 대기'],
    quake: ['몸 낮추고 머리 보호', '멈추면 기압·누출부터 확인', '해치 열어 출구 확보'],
    meteor: ['경보 → 지하로', '충격 직후 산소호흡기', '누출·화재 확인 후 격리'],
    depress: ['경보 → 산소호흡기부터', '사람 모아 비상 대피 구역으로', '해치 닫아 새는 구역 격리'],
    fire: ['"불이야" 알리고 산소호흡기', '환기 팬·전원 끄기, 작은 불만 소화', '해치 닫아 격리, 인원 확인'],
    life: ['두통·숨참 = CO₂ 신호, 바로 보고', '비상 CO₂ 카트리지 끼우기', '움직임 줄여 산소 아끼기'],
    power: ['비상 라이트부터 켜기', '생명유지 비상 전원 확인', '산소 > 난방 > 물 순서로 전기 남기기'],
    cold: ['가장 작은 방에 모이기', '보온 담요·겹쳐 입기', '저체온 신호 서로 살피기']
  };

  let active = 'dust';
  // 주변 구조 로봇·AI 보조 도우미 유무 (테스트 결과로 시작값을 정함)
  let hasBot = true;

  let stage = 'now';

  function actionCard(a, i) {
    const prods = a.items.map(RO.products.find).filter(Boolean);
    return `
      <article class="act-card" style="--i:${i}">
        <header class="act-head">
          <span class="act-num" aria-hidden="true">${i + 1}</span>
          <h4 class="act-title">${a.t}</h4>
        </header>
        <p class="act-desc">${a.d}</p>
        ${hasBot && a.bot ? `<p class="act-bot"><i data-lucide="bot" aria-hidden="true"></i><span><b>구조 로봇·AI 도우미가 있으면</b> ${a.bot}</span></p>` : ''}
        ${!hasBot && a.solo ? `<p class="act-bot is-solo"><i data-lucide="user" aria-hidden="true"></i><span><b>도와줄 로봇이 없으면</b> ${a.solo}</span></p>` : ''}
        ${a.c ? `<div class="act-caution"><span class="act-caution-label"><i data-lucide="alert-triangle" aria-hidden="true"></i>주의</span><p>${a.c}</p></div>` : ''}
        <footer class="act-foot">
          ${prods.length ? `
            <div class="act-items">
              <span class="act-items-label">필요한 물품</span>
              <ul>${prods.map((p) => `<li><i data-lucide="${p.icon}" aria-hidden="true"></i>${p.name}</li>`).join('')}</ul>
            </div>
            <button class="btn btn-primary btn-xs act-add" data-add="${prods.map((p) => p.id).join(',')}"
              aria-label="${a.t} 관련 물품 키트에 담기"><i data-lucide="plus" aria-hidden="true"></i>키트에 담기</button>`
          : '<p class="act-noitem"><i data-lucide="check-circle-2" aria-hidden="true"></i>준비물 없이 바로 행동하면 돼요</p>'}
          ${a.make ? `<a class="act-make" href="make.html#${a.make}"><i data-lucide="hammer" aria-hidden="true"></i>거주구 재료로 직접 만들기</a>` : ''}
        </footer>
      </article>`;
  }

  // 시간 단계 선택: 01 지금 → 02 5분 후 → 03 1시간 후
  function stepperHTML(d) {
    const idx = STAGES.findIndex((s) => s.key === stage);
    return `
      <div class="stepper" role="tablist" aria-label="시간 단계" style="--p:${idx}">
        <span class="stepper-track" aria-hidden="true"><span class="stepper-fill"></span></span>
        ${STAGES.map((s, i) => `
          <button class="step ${s.key === stage ? 'is-active' : ''} ${i < idx ? 'is-past' : ''}" role="tab" id="step-${s.key}"
            aria-selected="${s.key === stage}" aria-controls="stagePanel" data-stage="${s.key}">
            <span class="step-dot" aria-hidden="true">${s.no}</span>
            <span class="step-time">${s.time}</span>
            <span class="step-label">${s.label}</span>
            <span class="step-count">${d[s.key].length ? d[s.key].length + '가지 행동' : '관계기관 안내'}</span>
          </button>`).join('')}
      </div>`;
  }

  function stageHTML(d) {
    const s = STAGES.find((x) => x.key === stage);
    const list = d[stage];
    const cols = list.length === 4 ? 2 : Math.min(list.length, 3);
    return `
      <div class="stage-panel" id="stagePanel" role="tabpanel" aria-labelledby="step-${stage}">
        <header class="stage-title">
          <span class="stage-big" aria-hidden="true">${s.no}</span>
          <div>
            <p class="stage-hint">${d.label} · ${s.hint}</p>
            <h3>${s.label}</h3>
          </div>
        </header>
        ${list.length
          ? `<div class="act-grid cols-${cols}">${list.map(actionCard).join('')}</div>`
          : `<div class="stage-empty"><i data-lucide="siren" aria-hidden="true"></i>
             <p><b>이 단계는 기지 관제·구조팀의 안내를 따라요.</b><br>임의로 판단해서 다시 들어가거나 이동하지 마세요.</p></div>`}
      </div>`;
  }

  function render() {
    const d = DISASTERS[active];
    const panel = document.getElementById('guidePanel');
    panel.setAttribute('aria-labelledby', 'gtab-' + active);
    panel.innerHTML = `
      <p class="guide-intro"><span class="guide-en">${d.en}</span>${d.intro}</p>
      <div class="bot-toggle" role="group" aria-label="주변 구조 로봇·AI 보조 도우미">
        <span><i data-lucide="bot" aria-hidden="true"></i>주변 구조 로봇·AI 도우미</span>
        <button type="button" data-bot="1" aria-pressed="${hasBot}" class="${hasBot ? 'is-on' : ''}">있을 때</button>
        <button type="button" data-bot="0" aria-pressed="${!hasBot}" class="${!hasBot ? 'is-on' : ''}">없을 때</button>
      </div>
      ${stepperHTML(d)}
      ${stageHTML(d)}`;
    RO.icons();
  }

  function init() {
    const tabs = document.getElementById('guideTabs');
    tabs.innerHTML = Object.entries(DISASTERS).map(([k, d]) => `
      <button class="gtab ${k === active ? 'is-active' : ''}" role="tab" id="gtab-${k}"
        aria-selected="${k === active}" aria-controls="guidePanel" tabindex="${k === active ? 0 : -1}" data-dis="${k}">
        <i data-lucide="${d.icon}" aria-hidden="true"></i>${d.label}
      </button>`).join('');
    const select = (k, focus) => {
      active = k;
      tabs.querySelectorAll('.gtab').forEach((b) => {
        const on = b.dataset.dis === k;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', on);
        b.tabIndex = on ? 0 : -1;
        if (on && focus) b.focus();
      });
      render();
    };
    tabs.addEventListener('click', (e) => {
      const b = e.target.closest('[data-dis]');
      if (b) select(b.dataset.dis);
    });
    document.getElementById('guidePanel').addEventListener('click', (e) => {
      const t = e.target.closest('[data-bot]');
      if (t) { hasBot = t.dataset.bot === '1'; render(); return; }
      const b = e.target.closest('[data-stage]');
      if (!b || b.dataset.stage === stage) return;
      stage = b.dataset.stage;
      render();
      document.getElementById('step-' + stage).focus();
    });
    // 탭 키보드 이동 (←/→)
    tabs.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const keys = Object.keys(DISASTERS);
      const i = keys.indexOf(active) + (e.key === 'ArrowRight' ? 1 : -1);
      select(keys[(i + keys.length) % keys.length], true);
    });
    hasBot = RO.test.getResult()?.robot ?? true;
    RO.on('result', (r) => { if (r) { hasBot = r.robot; render(); } });
    render();
  }

  RO.disaster = { DISASTERS, CORE, init };
})(window.RO);
