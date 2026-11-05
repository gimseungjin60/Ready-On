/* BLACK-OUT : MARS — 화성 재난 행동수칙 (누구나 이해하기 쉬운 말로)
   국제우주정거장 비상 대응 순서와 NASA 공개 화성 자료를 바탕으로 한 시연용 콘텐츠입니다.
   재난마다: 어떤 재난인지 · 이럴 때 알아채요 · 기억할 3가지 · 지금/5분 후/1시간 후 · 하면 안 돼요 · 어려운 말 풀이
   행동 하나 = 짧은 제목(t) + 한두 문장 설명(d) + 조심할 점(c) + 로봇 있을 때(bot)/없을 때(solo) + 있으면 좋은 물건(items) */
(function (RO) {
  const STAGES = [
    { key: 'now', no: '01', label: '지금 바로', time: '경보 직후', hint: '가장 먼저, 몸부터 지켜요' },
    { key: 'min5', no: '02', label: '5분 뒤에', time: '5분 후', hint: '안전해졌으면 이어서 해요' },
    { key: 'hour1', no: '03', label: '1시간 뒤에', time: '1시간 후', hint: '상황이 가라앉으면 정리해요' }
  ];

  const DISASTERS = {
    dust: {
      label: '먼지 폭풍', en: 'DUST STORM', icon: 'tornado',
      what: '모래바람이 하늘을 덮어 해를 가리는 재난이에요. 태양광 전기가 줄어들고, 길게는 몇 주 동안 이어져요.',
      signs: ['하늘이 주황색으로 뿌옇게 변해요', '관제에서 "먼지 폭풍 경보"가 와요', '태양광 전기 숫자가 계속 떨어져요'],
      key: [['home', '안으로 들어오기'], ['wind', '먼지 털고 들어오기'], ['battery-low', '전기 아끼기']],
      now: [
        { t: '하던 일 멈추고 안으로', d: '밖에 있다면 바로 거주구로 돌아와요. 곧 앞이 몇 미터밖에 안 보이게 돼요.', c: '로버(화성 자동차)를 타고 멀리 가지 마세요.', items: ['item-headlamp'], bot: '구조 로봇에게 내 위치를 보내면 돌아오는 길을 알려 줘요.', solo: '왔던 길의 표지판을 따라 천천히 걸어요. 길을 잃으면 그 자리에서 신호기를 켜요.' },
        { make: 'dustseal', t: '먼지 털고 들어오기', d: '바깥과 집 사이의 작은 방(에어록)에서 옷과 장비의 먼지를 털고 들어와요.', c: '화성 먼지는 몸에 해로워요. 먼지가 들어왔다면 방진 마스크를 써요.', items: ['item-dustmask'] }
      ],
      min5: [
        { t: '안 쓰는 전기 끄기', d: '해가 가려져 전기가 부족해져요. 조명과 쓰지 않는 장비부터 꺼요.', c: '숨 쉬는 공기, 난방, 물 장치는 절대 끄지 않아요.', items: ['item-battery'], bot: 'AI 도우미에게 "절전 모드 켜 줘"라고 말해요.', solo: '벽에 붙은 전기 계획표 순서대로 하나씩 꺼요.' }
      ],
      hour1: [
        { t: '며칠 버틸지 계산하기', d: '남은 배터리로 며칠 버틸 수 있는지 보고 하루에 쓸 전기를 정해요. 2018년 화성 먼지 폭풍은 몇 달 동안 이어졌어요.', items: ['item-battery'] },
        { make: 'lamp', t: '불은 한 방에서만 켜기', d: '방마다 불을 켜지 말고 한 방에 모여 비상 라이트 하나를 같이 써요.', items: ['item-headlamp'] }
      ],
      dont: ['폭풍 속으로 로버를 타고 나가기', '먼지를 털지 않고 집 안으로 들어오기', '배터리 양을 생각하지 않고 전기 쓰기'],
      words: [['에어록', '바깥과 집 사이의 작은 방. 공기가 새지 않게 문이 두 겹이에요.'], ['신호기(비콘)', '버튼을 누르면 내 위치를 자동으로 알려 주는 기계'], ['솔', '화성의 하루. 지구의 하루보다 40분 길어요.']]
    },
    solar: {
      label: '태양 방사선 폭풍', en: 'SOLAR STORM', icon: 'sun',
      what: '태양이 크게 폭발하면 몸에 해로운 보이지 않는 입자(방사선)가 쏟아져요. 눈에 보이지 않아서 경보가 가장 중요해요.',
      signs: ['관제에서 "태양 방사선 경보"가 와요', '선량계(방사선 측정기) 숫자가 빠르게 올라가요', '무전기가 갑자기 지지직거려요'],
      key: [['shield', '두꺼운 벽 뒤로'], ['shirt', '차폐 조끼 입기'], ['clock', '해제까지 기다리기']],
      now: [
        { t: '지하 대피소로 가기', d: '흙과 바위로 두껍게 덮인 지하 방사선 대피소로 가요. 벽이 두꺼울수록 안전해요.', c: '창문 쪽이나 얇은 벽 쪽에 있지 마세요.', items: [], bot: '구조 로봇에게 가장 가까운 대피소까지 길 안내를 부탁해요.', solo: '비상 카드에 적어 둔 대피소로 바로 가요.' },
        { t: '밖에 있다면 바로 들어오기', d: '밖에서 일하고 있었다면 멈추고 가장 가까운 건물로 들어와요.', c: '로버 안은 벽이 얇아서 안전하지 않아요.', items: [] }
      ],
      min5: [
        { t: '차폐 조끼 입고 선량계 달기', d: '방사선을 막는 조끼로 가슴과 배를 지켜요. 선량계는 내가 받은 방사선 양을 알려 줘요.', c: '피부 케어 크림은 피부를 보호할 뿐, 방사선을 막지는 못해요.', items: ['item-vest', 'item-dosimeter', 'item-cream'] },
        { make: 'waterwall', t: '물 팩으로 벽 더 두껍게', d: '물은 방사선을 잘 막아요. 물을 채운 팩을 누울 자리 주변에 쌓아요.', items: ['item-waterbag'] }
      ],
      hour1: [
        { t: '"해제" 안내까지 기다리기', d: '몇 시간에서 하루 넘게 걸릴 수 있어요. 관제에서 "해제"라고 할 때까지 밖에 나가지 않아요.', c: '선량계 숫자를 적어 두었다가 의료진에게 알려 줘요.', items: ['item-ration'] }
      ],
      dont: ['"괜찮아 보여서" 밖에 나가기', '로버 안에서 기다리기', '크림만 바르고 안심하기'],
      words: [['방사선', '눈에 보이지 않지만 몸을 해칠 수 있는 작은 입자'], ['선량계', '내가 방사선을 얼마나 받았는지 재는 작은 기계'], ['차폐', '물·흙·바위처럼 두꺼운 것으로 막는 것']]
    },
    quake: {
      label: '화성 지진', en: 'MARSQUAKE', icon: 'activity',
      what: '화성 땅이 흔들리는 재난이에요. 흔들림보다, 그 뒤에 벽에 금이 가서 공기가 새는 게 더 위험해요.',
      signs: ['바닥과 물건이 흔들려요', '"쿵" 하는 큰 소리가 나요', '관제에서 지진 알림이 와요'],
      key: [['shield', '몸 낮추고 머리 보호'], ['gauge', '공기 새는지 확인'], ['door-open', '나갈 문 열어 두기']],
      now: [
        { t: '몸 낮추고 머리 보호', d: '바닥에 몸을 낮추고 손잡이를 꼭 잡은 채 팔이나 헬멧으로 머리를 지켜요.', c: '화성은 중력이 약해서 물건이 천천히, 멀리 튕겨요. 선반 근처는 피해요.', items: ['item-helmet'] }
      ],
      min5: [
        { t: '공기가 새는지 확인', d: '흔들림이 멈추면 기압계(공기 압력 측정기) 숫자를 보고, "쉬익" 소리가 나는지 들어 봐요.', c: '숫자가 떨어지면 바로 [공기 누출] 행동수칙을 따라요.', items: ['item-gauge'], bot: '구조 로봇에게 집 전체를 점검해 달라고 맡겨요.', solo: '문과 창 주변을 천천히 돌며 소리를 들어 봐요. 구멍에 손은 대지 마세요.' },
        { t: '나갈 문 열어 두기', d: '문이 비틀어져 안 열리기 전에 미리 열어서 나갈 길을 만들어 둬요.', items: [] }
      ],
      hour1: [
        { t: '금 간 곳 알리기', d: '금이 가거나 기울어진 곳을 관제에 알리고, 점검이 끝날 때까지 그 방을 쓰지 않아요.', items: ['item-beacon'] }
      ],
      dont: ['흔들리는 중에 뛰어다니기', '금 간 벽에 기대거나 만지기', '점검 전에 그 방 다시 쓰기'],
      words: [['기압계', '방 안 공기의 압력을 재는 기계. 숫자가 떨어지면 공기가 새고 있어요.'], ['중력', '물건을 아래로 당기는 힘. 화성은 지구의 38%예요.']]
    },
    meteor: {
      label: '운석 충돌', en: 'METEORITE', icon: 'zap',
      what: '우주에서 돌덩이(운석)가 떨어지는 재난이에요. 화성은 공기가 얇아서 작은 운석도 땅까지 떨어져요.',
      signs: ['관제에서 "충돌 경보"가 와요', '큰 충격음과 함께 땅이 울려요', '멀리서 먼지 기둥이 솟아올라요'],
      key: [['arrow-down-to-line', '지하로 내려가기'], ['wind', '산소호흡기 쓰기'], ['door-closed', '문 닫아 막기']],
      now: [
        { t: '경보가 오면 지하로', d: '충돌 경보가 오면 가장 깊은 지하 공간으로 내려가요.', items: [], bot: '구조 로봇이 대피 길을 안내하고 남은 사람을 찾아요.', solo: '이웃에게 무전으로 알리고 함께 내려가요.' },
        { t: '충격 뒤엔 산소호흡기부터', d: '가까이 떨어졌다면 벽에 구멍이 났을 수 있어요. 바로 산소호흡기를 써요.', items: ['item-o2mask'] }
      ],
      min5: [
        { make: 'leakpatch', t: '공기·연기 확인하고 문 닫기', d: '기압계로 공기가 새는지, 측정기로 연기가 나는지 보고 문을 닫아 그 방을 막아요.', items: ['item-gauge', 'item-comask'] }
      ],
      hour1: [
        { t: '바깥 확인은 구조팀에게', d: '어디가 부서졌는지 관제에 알리고, 밖에 나가 확인하는 일은 구조팀에게 맡겨요.', items: ['item-beacon'] }
      ],
      dont: ['떨어진 운석을 구경하러 나가기', '충돌 지점 1km 안으로 들어가기', '산소호흡기 없이 부서진 방에 들어가기'],
      words: [['운석', '우주에서 떨어지는 돌덩이'], ['크레이터', '운석이 떨어져서 생긴 둥근 구덩이']]
    },
    depress: {
      label: '공기 누출', en: 'AIR LEAK', icon: 'gauge',
      what: '집 벽에 구멍이 나서 숨 쉴 공기가 밖으로 빠져나가는 재난이에요. 가장 빨리 움직여야 해요.',
      signs: ['경보음이 크게 울려요', '귀가 먹먹하고 "쉬익" 소리가 나요', '종이나 먼지가 한쪽으로 빨려가요'],
      key: [['wind', '산소호흡기 쓰기'], ['users', '사람 모아 대피'], ['door-closed', '뒤의 문 닫기']],
      now: [
        { t: '산소호흡기부터 쓰기', d: '경보가 울리면 가장 가까운 산소호흡기를 바로 써요. 숨이 제일 먼저예요.', c: '산소호흡기를 쓰기 전에 짐을 챙기지 마세요.', items: ['item-o2mask', 'item-o2cyl'] },
        { t: '사람 모아 대피 구역으로', d: '같이 있는 사람을 크게 불러 모으고, 공기가 새지 않는 비상 대피 구역으로 함께 가요.', c: '혼자 남거나 다시 들어가지 마세요.', items: [], bot: '구조 로봇을 불러 남은 사람을 찾고 문을 닫게 해요.', solo: '신호기를 켜서 위치를 알린 뒤 이동해요.' },
        { t: '뒤의 문 닫기', d: '모두 나오면 뒤쪽 문을 닫아서 공기가 새는 방을 막아요.', c: '문이 안 닫히면 무리하지 말고 다음 문까지 물러나요.', items: [] }
      ],
      min5: [
        { t: '얼마나 빨리 새는지 보기', d: '기압계 숫자가 얼마나 빨리 떨어지는지 보고 관제에 알려요. 압력 조절기로 산소호흡기를 내 몸에 맞춰요.', c: '숫자가 빠르게 떨어지면 고치려 하지 말고 대피해요.', items: ['item-gauge', 'item-regulator'] },
        { make: 'leakpatch', t: '작은 구멍이면 막기', d: '손바닥보다 작은 구멍이면 패치와 테이프로 막아요. 우주정거장 우주인들도 실제로 테이프로 막았어요.', c: '구멍에 손이나 몸을 대지 마세요. 빨려 들어가 다칠 수 있어요.', items: ['item-leak', 'item-patch'] }
      ],
      hour1: [
        { t: '우주복 점검하며 기다리기', d: '대피 구역에서 비상 우주복과 남은 산소를 확인하며 수리팀을 기다려요.', c: '막아 둔 방은 수리팀이 괜찮다고 할 때까지 들어가지 않아요.', items: ['item-suit'] }
      ],
      dont: ['짐부터 챙기기', '구멍에 손이나 몸 대기', '닫아 둔 문을 혼자 다시 열기'],
      words: [['기압', '공기가 누르는 힘. 낮아지면 숨쉬기 어려워요.'], ['해치', '우주선·거주구의 두꺼운 문'], ['산소호흡기', '얼굴에 쓰고 산소를 마시는 마스크']]
    },
    fire: {
      label: '내부 화재', en: 'HAB FIRE', icon: 'flame',
      what: '집 안에서 불이 나는 재난이에요. 공간이 좁아서 연기가 금방 가득 차요.',
      signs: ['화재 경보가 울려요', '타는 냄새가 나거나 연기가 보여요', '장비가 뜨거워지거나 불꽃이 튀어요'],
      key: [['megaphone', '크게 알리기'], ['wind', '산소호흡기 쓰기'], ['power', '전기·바람 끄기']],
      now: [
        { t: '"불이야!" 외치고 산소호흡기', d: '크게 외치고 화재 경보 버튼을 누른 뒤 산소호흡기를 써요.', c: '연기를 그냥 마시면 안 돼요.', items: ['item-o2mask'] },
        { t: '환기팬과 전기 끄기', d: '바람은 불을 더 키워요. 불난 방의 환기팬과 전기를 꺼요.', items: [], bot: 'AI 도우미에게 "그 방 전기랑 환기 꺼 줘"라고 말해요.', solo: '벽에 있는 빨간 비상 차단 스위치를 직접 내려요.' },
        { t: '작은 불만 소화기로', d: '불이 작고 어디서 났는지 보이면 CO₂ 소화기로 꺼요. 크거나 번지면 바로 나가요.', c: '전기 장비에는 물을 뿌리지 마세요.', items: ['item-extinguisher'] }
      ],
      min5: [
        { t: '문 닫고 사람 수 세기', d: '모두 나오면 문을 닫아 연기를 가두고, 모인 곳에서 사람 수를 세요.', c: '아무도 안 남았는지 꼭 확인하고 닫아요.', items: ['item-beacon'] }
      ],
      hour1: [
        { t: '"안전" 확인까지 마스크 쓰기', d: '불이 꺼져도 해로운 가스가 남아 있어요. 측정기가 안전하다고 할 때까지 산소호흡기를 벗지 않아요.', items: ['item-comask'] }
      ],
      dont: ['전기 장비에 물 뿌리기', '큰 불을 혼자 끄려고 하기', '연기 속에서 마스크 없이 숨쉬기'],
      words: [['CO₂ 소화기', '이산화탄소 가스로 불을 끄는 소화기. 전기 장비에 써도 돼요.'], ['환기팬', '공기를 돌려 주는 선풍기 같은 장치']]
    },
    life: {
      label: '공기 장치 고장', en: 'LIFE SUPPORT', icon: 'heart-pulse',
      what: '숨 쉴 공기를 만들고 깨끗하게 하는 장치가 멈추는 재난이에요. 눈에 안 보여서 몸의 신호로 알아채야 해요.',
      signs: ['머리가 아프고 자꾸 졸려요', '숨이 차고 답답해요', '공기 경보 숫자가 올라가요'],
      key: [['bell-ring', '바로 알리기'], ['filter', '카트리지 끼우기'], ['armchair', '움직임 줄이기']],
      now: [
        { t: '두통·졸림은 위험 신호', d: '머리가 아프고 숨이 차고 졸리면 내쉰 숨(이산화탄소)이 쌓이는 신호예요. 경보가 없어도 바로 알려요.', c: '참고 버티지 마세요.', items: [], bot: 'AI 도우미에게 공기 상태를 물어보고 관제에 알리게 해요.', solo: '무전으로 이웃과 관제에 직접 알려요.' },
        { make: 'co2adapter', t: '비상 카트리지 끼우기', d: '공기 정화 장치가 멈추면 비상 CO₂ 카트리지를 끼워요. 아폴로 13호 우주인들도 이렇게 해서 살아 돌아왔어요.', items: ['item-co2'] }
      ],
      min5: [
        { t: '산소가 부족하면 산소 캔들', d: '산소를 만드는 장치가 멈추면 비상 산소 캔들을 켜요.', c: '어른만 다루고, 불붙기 쉬운 물건과 떨어뜨려요.', items: ['item-o2candle'] },
        { t: '움직임 줄이기', d: '뛰거나 운동하면 산소를 더 많이 써요. 앉아서 천천히 숨 쉬어요.', items: [] }
      ],
      hour1: [
        { t: '수리 기다리거나 대피하기', d: '관제 안내에 따라 수리를 기다리거나, 공기 장치가 따로 있는 대피 구역으로 옮겨요.', items: ['item-o2cyl'] }
      ],
      dont: ['두통을 그냥 참기', '운동하거나 뛰어다니기', '산소 캔들 옆에 불붙는 물건 두기'],
      words: [['이산화탄소(CO₂)', '우리가 내쉬는 숨. 많이 쌓이면 머리가 아프고 위험해요.'], ['카트리지', '이산화탄소를 빨아들이는 필터 통']]
    },
    power: {
      label: '전기 끊김', en: 'POWER LOSS', icon: 'zap-off',
      what: '집 전기가 끊기는 재난이에요. 공기·물·난방을 모두 전기로 만들기 때문에 순서대로 지켜야 해요.',
      signs: ['불이 꺼지거나 깜빡여요', '"비상 배터리로 바뀌었어요" 알림이 와요', '늘 들리던 팬 소리가 멈춰요'],
      key: [['flashlight', '라이트 켜기'], ['heart-pulse', '공기 장치 확인'], ['list-ordered', '전기 순서 정하기']],
      now: [
        { t: '비상 라이트부터 켜기', d: '어둠 속에서 움직이지 말고 비상 라이트부터 켜요.', items: ['item-headlamp'] },
        { t: '공기 장치가 켜져 있는지 확인', d: '숨 쉬는 공기를 만드는 장치에 비상 전기가 들어가는지 초록 표시등을 봐요.', c: '표시등이 꺼져 있으면 바로 관제에 알려요.', items: ['item-battery'], bot: 'AI 도우미가 비상 전기로 바뀌었는지 확인하고 남은 시간을 알려 줘요.', solo: '배터리 표시를 보고 남은 시간을 직접 계산해요.' }
      ],
      min5: [
        { t: '전기 쓰는 순서 정하기', d: '1번 공기, 2번 난방, 3번 물 장치만 남기고 나머지는 모두 꺼요.', items: [] }
      ],
      hour1: [
        { t: '전기 도움 요청하기', d: '정착지 배터리 창고나 이웃 집에 전기를 나눠 달라고 하고, 오래 걸리면 대피 구역으로 옮겨요.', items: ['item-beacon'] }
      ],
      dont: ['어두운 곳에서 더듬으며 다니기', '공기 장치 전원 끄기', '배터리를 다 쓸 때까지 기다리기'],
      words: [['비상 배터리', '전기가 끊기면 저절로 켜지는 큰 배터리'], ['표시등', '장치가 켜졌는지 알려 주는 작은 불빛']]
    },
    cold: {
      label: '난방 고장', en: 'EXTREME COLD', icon: 'snowflake',
      what: '난방이 멈춰 집이 꽁꽁 얼어붙는 재난이에요. 화성의 밤은 영하 70~100℃까지 내려가요.',
      signs: ['방이 점점 추워져요', '난방 고장 알림이 와요', '물병의 물이 얼기 시작해요'],
      key: [['home', '작은 방에 모이기'], ['layers', '담요로 감싸기'], ['eye', '서로 살피기']],
      now: [
        { t: '가장 작은 방에 모이기', d: '모두 가장 작은 방으로 모이고 문을 닫아 남은 따뜻함을 지켜요.', items: [], bot: '구조 로봇에게 난방이 되는 이웃 집을 찾아 달라고 해요.', solo: '무전으로 이웃에게 알리고 함께 지낼 수 있는지 물어봐요.' },
        { make: 'warmlayer', t: '보온 담요로 몸 감싸기', d: '은박 보온 담요의 반짝이는 쪽이 몸에 닿게 두르고, 그 위에 담요를 덮어요.', items: ['item-blanket'] }
      ],
      min5: [
        { make: 'mat', t: '바닥 냉기 막고 껴입기', d: '바닥에 상자나 담요를 깔고 옷을 여러 겹 입어요. 물은 얼지 않게 몸 가까이 둬요.', items: ['item-blanket'] }
      ],
      hour1: [
        { t: '몸이 너무 차가운지 살피기', d: '심하게 떨리거나 말이 느려지면 위험 신호예요. 서로 살피고, 오래가면 따뜻한 대피 구역으로 옮겨요.', items: ['item-aid'] }
      ],
      dont: ['혼자 떨어져 있기', '맨바닥에 그냥 눕기', '불을 피워 몸 녹이기'],
      words: [['저체온증', '몸이 너무 차가워져서 심하게 떨리고 말이 느려지는 위험한 상태'], ['은박 담요', '몸의 열을 되돌려 주는 얇고 반짝이는 담요']]
    }
  };

  // 비상 카드(A4)에 들어갈 재난별 3줄 = 기억할 3가지
  const CORE = Object.fromEntries(Object.entries(DISASTERS).map(([k, d]) => [k, d.key.map(([, t]) => t)]));

  let active = 'dust';
  let hasBot = true; // 주변 구조 로봇·AI 도우미 유무 (테스트 결과로 시작값을 정함)
  let stage = 'now';

  function actionCard(a, i) {
    const prods = a.items.map(RO.products.find).filter(Boolean);
    const help = hasBot ? a.bot : a.solo;
    return `
      <article class="act-card" style="--i:${i}">
        <header class="act-head">
          <span class="act-num" aria-hidden="true">${i + 1}</span>
          <h4 class="act-title">${a.t}</h4>
        </header>
        <p class="act-desc">${a.d}</p>
        ${help ? `<p class="act-bot ${hasBot ? '' : 'is-solo'}"><i data-lucide="${hasBot ? 'bot' : 'user'}" aria-hidden="true"></i><span><b>${hasBot ? '도와줄 로봇이 있으면' : '도와줄 로봇이 없으면'}</b>${help}</span></p>` : ''}
        ${a.c ? `<p class="act-caution"><i data-lucide="alert-triangle" aria-hidden="true"></i><span><b>조심하세요</b>${a.c}</span></p>` : ''}
        <footer class="act-foot">
          ${prods.length ? `
            <div class="act-items">
              <span class="act-items-label">있으면 좋은 물건</span>
              <ul>${prods.map((p) => `<li><i data-lucide="${p.icon}" aria-hidden="true"></i>${p.name}</li>`).join('')}</ul>
            </div>
            <button class="btn btn-primary btn-xs act-add" data-add="${prods.map((p) => p.id).join(',')}"
              aria-label="${a.t}에 필요한 물건 키트에 담기"><i data-lucide="plus" aria-hidden="true"></i>키트에 담기</button>`
          : '<p class="act-noitem"><i data-lucide="check-circle-2" aria-hidden="true"></i>준비물 없이 바로 하면 돼요</p>'}
          ${a.make ? `<a class="act-make" href="make.html#${a.make}"><i data-lucide="hammer" aria-hidden="true"></i>집에 있는 물건으로 만들기</a>` : ''}
        </footer>
      </article>`;
  }

  function stepperHTML(d) {
    const idx = STAGES.findIndex((s) => s.key === stage);
    return `
      <div class="stepper" role="tablist" aria-label="시간 순서" style="--p:${idx}">
        <span class="stepper-track" aria-hidden="true"><span class="stepper-fill"></span></span>
        ${STAGES.map((s, i) => `
          <button class="step ${s.key === stage ? 'is-active' : ''} ${i < idx ? 'is-past' : ''}" role="tab" id="step-${s.key}"
            aria-selected="${s.key === stage}" aria-controls="stagePanel" data-stage="${s.key}">
            <span class="step-dot" aria-hidden="true">${s.no}</span>
            <span class="step-time">${s.time}</span>
            <span class="step-label">${s.label}</span>
            <span class="step-count">할 일 ${d[s.key].length}가지</span>
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
            <h3>${s.label} 할 일</h3>
          </div>
        </header>
        <div class="act-grid cols-${cols}">${list.map(actionCard).join('')}</div>
      </div>`;
  }

  function render() {
    const d = DISASTERS[active];
    const panel = document.getElementById('guidePanel');
    panel.setAttribute('aria-labelledby', 'gtab-' + active);
    panel.innerHTML = `
      <section class="g-top">
        <div class="g-what">
          <p class="g-en">${d.en}</p>
          <h3 class="g-title"><i data-lucide="${d.icon}" aria-hidden="true"></i>${d.label} 대처법</h3>
          <p class="g-desc">${d.what}</p>
          <p class="g-key-label">이것만 기억하세요</p>
          <ol class="g-key">${d.key.map(([ic, t], i) => `
            <li><span class="g-key-no">${i + 1}</span><i data-lucide="${ic}" aria-hidden="true"></i><b>${t}</b></li>`).join('')}</ol>
        </div>
        <div class="g-signs">
          <h4><i data-lucide="eye" aria-hidden="true"></i>이럴 때 알아채요</h4>
          <ul>${d.signs.map((x) => `<li><i data-lucide="check" aria-hidden="true"></i>${x}</li>`).join('')}</ul>
        </div>
      </section>

      <div class="g-controls">
        <div class="bot-toggle" role="group" aria-label="주변 구조 로봇·AI 도우미">
          <span><i data-lucide="bot" aria-hidden="true"></i>내 주변에 도와줄 로봇이</span>
          <button type="button" data-bot="1" aria-pressed="${hasBot}" class="${hasBot ? 'is-on' : ''}">있어요</button>
          <button type="button" data-bot="0" aria-pressed="${!hasBot}" class="${!hasBot ? 'is-on' : ''}">없어요</button>
        </div>
      </div>
      ${stepperHTML(d)}
      ${stageHTML(d)}

      <section class="g-bottom">
        <div class="g-dont">
          <h4><i data-lucide="ban" aria-hidden="true"></i>이건 하면 안 돼요</h4>
          <ul>${d.dont.map((x) => `<li><i data-lucide="x" aria-hidden="true"></i>${x}</li>`).join('')}</ul>
        </div>
        <div class="g-words">
          <h4><i data-lucide="book-open" aria-hidden="true"></i>어려운 말 풀이</h4>
          <dl>${d.words.map(([w, m]) => `<div><dt>${w}</dt><dd>${m}</dd></div>`).join('')}</dl>
        </div>
      </section>

      <section class="scn" id="scn" aria-live="polite"><p class="scn-loading"><span class="spinner" aria-hidden="true"></span>지금 정착지 상황을 받아오고 있어요… (DEMO)</p></section>`;
    RO.icons();
    renderScenario();
  }

  // 지금 정착지 상황: 가상 API(js/mars-api.js)의 진행 중 경보. 자세한 수치·진행 순서는 펼쳐서 봄
  const LV = { 심각: 'crit', 경보: 'warn', 주의: 'caution', 정보: 'info', 해제: 'done' };
  let scnNo = 0;
  const scnCache = {};
  async function renderScenario() {
    const no = ++scnNo, hz = active;
    if (scnCache[hz]) { document.getElementById('scn').innerHTML = scnCache[hz]; RO.icons(); return; }
    const { data, fetchedAt } = await RO.marsApi.getScenario(hz);
    const el = document.getElementById('scn');
    if (!el || no !== scnNo) return;
    const a = data.alert;
    el.innerHTML = `
      <div class="scn-main">
        <p class="scn-head"><b class="demo-chip">DEMO</b> 지금 정착지 상황 · ${fetchedAt}</p>
        ${a ? `<h3><em class="lv lv-${LV[a.level]}">${a.level}</em>${a.title}</h3>
          <p class="scn-area"><i data-lucide="map-pin" aria-hidden="true"></i>${a.area}</p>
          <p class="scn-msg">${a.message}</p>
          <p class="scn-do"><b>지금 할 일</b>${a.action}</p>`
        : `<h3><em class="lv lv-info">예시</em>${DISASTERS[hz].label}</h3><p class="scn-msg">지금 진행 중인 경보는 없어요. 아래는 이 재난이 일어났을 때의 예시예요.</p>`}
        <div class="scn-actions">
          <button type="button" class="btn btn-outline btn-sm" data-onmap="${hz}"><i data-lucide="map" aria-hidden="true"></i>지도에서 보기</button>
        </div>
      </div>
      <details class="scn-more">
        <summary>숫자로 보는 상황 · 어떻게 흘러가나요?</summary>
        <div class="scn-more-body">
          <dl class="scn-metrics">${data.metrics.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
          <ol class="scn-time">${data.timeline.map((t) => { const [h, r] = t.split('|'); return `<li><b>${h}</b>${r}</li>`; }).join('')}</ol>
        </div>
      </details>`;
    scnCache[hz] = el.innerHTML;
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
      stage = 'now'; // 다른 재난을 고르면 "지금 바로"부터
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
      const om = e.target.closest('[data-onmap]');
      if (om) { RO.emit('setHazards', [om.dataset.onmap]); RO.go('shelter'); return; }
      const t = e.target.closest('[data-bot]');
      if (t) { hasBot = t.dataset.bot === '1'; render(); return; }
      const b = e.target.closest('[data-stage]');
      if (!b || b.dataset.stage === stage) return;
      stage = b.dataset.stage;
      render();
      document.getElementById('step-' + stage).focus();
    });
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
