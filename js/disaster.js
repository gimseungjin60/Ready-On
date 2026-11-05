/* READY : ON — 재난별 행동수칙 데이터 + 탭 UI
   출처: 행정안전부 국민재난안전포털 「국민행동요령」, 소방청 화재 대피 안내(2024 「살펴서 대피」 포함), 한국전력 정전 안내.
   공식 지침에 없는 행동은 만들지 않았고, 해당 시간 구간에 공식 지침이 없으면 비워 둡니다. */
(function (RO) {
  const STAGES = [
    { key: 'now', no: '01', label: '지금 해야 할 일', time: '즉시', hint: '위험한 순간, 가장 먼저 할 일' },
    { key: 'min5', no: '02', label: '5분 후 해야 할 일', time: '5분 후', hint: '몸을 지킨 다음 할 일' },
    { key: 'hour1', no: '03', label: '1시간 후 해야 할 일', time: '1시간 후', hint: '상황이 가라앉은 뒤 할 일' }
  ];

  const DISASTERS = {
    earthquake: {
      label: '지진', en: 'EARTHQUAKE', icon: 'activity',
      intro: '흔들리는 동안에는 이동보다 몸을 보호하는 것이 먼저입니다.',
      now: [
        { t: '튼튼한 탁자 아래로 몸 보호', d: '탁자 아래로 들어가 탁자 다리를 꼭 잡고 머리와 몸을 보호합니다.', c: '흔들리는 중에 밖으로 뛰어나가지 마세요. 낙하물에 다칠 수 있습니다.', items: ['item-helmet'] },
        { t: '흔들림이 멈추면 전기·가스 차단', d: '흔들림이 멈춘 뒤 전기와 가스를 차단하고, 문을 열어 출구를 확보합니다.', c: '불을 사용 중이었다면 흔들림이 멈춘 후 침착하게 끕니다.', items: ['item-gloves'] }
      ],
      min5: [
        { t: '계단을 이용해 건물 밖으로', d: '건물 밖으로 나갈 때는 계단을 이용해 신속하게 이동합니다.', c: '엘리베이터는 절대 이용하지 마세요. 갇히면 비상벨로 구조를 요청합니다.', items: ['item-flashlight'] },
        { t: '머리를 보호하며 넓은 곳으로', d: '가방이나 손으로 머리를 보호하고, 건물·담장과 거리를 두며 운동장·공원 같은 넓은 공간으로 대피합니다.', c: '대피할 때 차량은 이용하지 않고 걸어서 이동합니다.', items: ['item-helmet', 'item-whistle'] }
      ],
      hour1: [
        { t: '공식 안내에 따라 행동', d: '라디오나 공공기관의 안내방송 등 올바른 정보에 따라 행동합니다.', c: '확인되지 않은 소문은 퍼뜨리지 마세요. 여진에 대비합니다.', items: ['item-radio', 'item-powerbank'] },
        { t: '부상자 확인과 응급처치', d: '함께 있는 사람의 부상 여부를 확인하고, 필요하면 응급처치 후 119에 도움을 요청합니다.', c: '심하게 파손된 건물에는 안전이 확인될 때까지 들어가지 않습니다.', items: ['item-firstaid'] }
      ]
    },
    fire: {
      label: '화재', en: 'FIRE', icon: 'flame',
      intro: '불을 발견하면 알리고, 연기를 피해 낮은 자세로, 계단으로 대피합니다.',
      now: [
        { t: '"불이야!" 알리고 비상벨 누르기', d: '큰 소리로 주변에 알리고 화재경보 비상벨을 누릅니다.', c: '불길이 작을 때만 소화기로 초기 진화를 시도하고, 어렵다면 즉시 대피합니다.', items: ['item-extinguisher', 'item-whistle'] },
        { t: '젖은 수건으로 코·입 막고 낮은 자세로', d: '연기를 마시지 않도록 코와 입을 막고, 자세를 낮춰 계단을 통해 밖으로 대피합니다.', c: '엘리베이터는 이용하지 않습니다.', items: ['item-firemask', 'item-flashlight'] },
        { t: '문을 열기 전 손잡이 확인', d: '손등으로 문손잡이를 만져 뜨거우면 문을 열지 말고 다른 길을 찾습니다.', c: '대피가 어려우면 연기가 들어오지 않게 문틈을 막고 창문으로 구조를 요청합니다.', items: [] },
        { t: '아파트 다른 세대 화재라면 "살펴서 대피"', d: '우리 집이 아닌 곳에서 불이 났고 집 안으로 불길·연기가 들어오지 않는다면, 무리하게 이동하지 말고 창문을 닫고 안내방송을 들으며 119에 신고합니다.', c: '집 안으로 불길이나 연기가 들어오면 가능할 때 계단으로 대피하고, 어렵다면 대피공간·경량칸막이를 이용해 구조를 요청합니다.', items: [] }
      ],
      min5: [
        { t: '밖으로 나왔다면 119 신고', d: '안전한 곳에서 119에 주소와 상황을 알리고, 아직 안에 있는 사람이 있다면 알립니다.', c: '물건을 챙기러 다시 들어가지 마세요.', items: [] },
        { t: '구조 요청 시 위치 알리기', d: '대피하지 못했다면 창문으로 손전등·호루라기 등을 이용해 내 위치를 알립니다.', c: '불길을 피해 뛰어내리는 등 무리한 행동은 하지 않습니다.', items: ['item-flashlight', 'item-whistle'] }
      ],
      hour1: [] // 이후 조치는 소방·관계기관의 현장 안내를 따릅니다.
    },
    blackout: {
      label: '정전', en: 'BLACKOUT', icon: 'zap-off',
      intro: '정전은 당황하지 않고 안전한 조명부터 확보하는 것이 시작입니다.',
      now: [
        { t: '손전등으로 안전한 이동 경로 확보', d: '촛불 대신 손전등이나 랜턴을 사용해 넘어지지 않도록 이동합니다.', c: '촛불은 화재 위험이 있어 사용을 자제합니다.', items: ['item-flashlight', 'item-headlamp'] },
        { t: '엘리베이터 이용하지 않기', d: '정전 중에는 계단을 이용합니다. 엘리베이터에 갇혔다면 비상통화 버튼으로 구조를 요청합니다.', c: '문을 억지로 열고 나오지 마세요.', items: [] },
        { t: '냉장고 문을 불필요하게 열지 않기', d: '문을 닫아 두면 내부 온도가 더 오래 유지됩니다.', c: '', items: ['item-cooler'] }
      ],
      min5: [
        { t: '우리 집만 정전인지 확인', d: '이웃집도 정전인지 확인하고, 우리 집만이라면 누전차단기를 점검하거나 관리사무소·한국전력(국번 없이 123)에 문의합니다.', c: '젖은 손으로 차단기를 만지지 않습니다.', items: [] },
        { t: '전기제품 플러그 뽑기', d: '전기가 다시 들어올 때 과부하를 막기 위해 사용 중이던 전기제품의 플러그를 뽑아 둡니다.', c: '', items: [] },
        { t: '휴대전화 배터리 절약 · 상황 공유', d: '화면 밝기를 낮추고 불필요한 앱을 종료한 뒤, 가족과 지인에게 짧게 상황을 전달합니다.', c: '통화보다 문자가 연결될 가능성이 높습니다.', items: ['item-powerbank', 'item-radio'] }
      ],
      hour1: [
        { t: '전력 복구 여부 확인', d: '라디오 등으로 복구 예정 안내를 확인하고, 복구되면 플러그를 하나씩 순서대로 꽂습니다.', c: '', items: ['item-radio'] },
        { t: '식수 및 비상식량 점검', d: '단수가 함께 올 수 있으므로 식수와 바로 먹을 수 있는 식량을 확인합니다.', c: '오래 상온에 둔 냉장 식품은 상태를 확인한 뒤 섭취합니다.', items: ['item-water', 'item-food'] },
        { t: '장시간 정전 시 대피 필요성 판단', d: '한파·폭염 등으로 실내에 머물기 어렵다면 지자체 안내에 따라 대피소 이동을 검토합니다.', c: '', items: [] }
      ]
    },
    flood: {
      label: '침수', en: 'FLOOD', icon: 'waves',
      intro: '물이 차오를 때는 지하를 벗어나 높은 곳으로. 물속을 걷거나 운전하지 않습니다.',
      now: [
        { t: '지하 공간에서 즉시 벗어나기', d: '지하주차장·지하실·반지하에 있다면 물이 들어오기 시작할 때 바로 지상으로 이동합니다.', c: '차량을 옮기러 지하주차장에 들어가지 마세요.', items: [] },
        { t: '높은 곳으로 이동', d: '물이 차오르면 건물 위층 등 높은 곳으로 이동합니다.', c: '물에 잠긴 도로나 하천변은 걷거나 운전하지 않습니다. 얕아 보여도 휩쓸릴 수 있습니다.', items: ['item-boots', 'item-raincoat'] },
        { t: '집 안에 물이 들어오면 전기·가스 차단', d: '감전과 가스 누출을 막기 위해 차단합니다.', c: '물에 젖은 상태로 전기 설비를 만지지 않습니다.', items: [] }
      ],
      min5: [
        { t: '재난문자·방송 확인 후 대피', d: '대피 권고가 있으면 지자체가 안내하는 대피 장소로 이동합니다.', c: '맨홀·배수구·전신주·끊어진 전선 근처는 피합니다.', items: ['item-radio', 'item-drybag'] },
        { t: '고립 시 구조 요청', d: '고립되면 119에 위치를 알리고 높은 곳에서 구조를 기다립니다.', c: '', items: ['item-whistle', 'item-flashlight'] }
      ],
      hour1: [
        { t: '물이 빠지기 전 접근 금지', d: '침수 지역은 물이 빠지고 안전이 확인될 때까지 들어가지 않습니다.', c: '', items: [] },
        { t: '귀가 후 점검하고 사용', d: '전기·가스는 전문가 점검 후 사용하고, 물에 잠겼던 음식은 먹지 않습니다.', c: '수돗물은 안전하다는 안내가 있기 전까지 마시지 않습니다.', items: ['item-water'] }
      ]
    },
    typhoon: {
      label: '태풍', en: 'TYPHOON', icon: 'wind',
      intro: '태풍 영향권에서는 외출을 자제하고 창문에서 떨어져 머뭅니다.',
      now: [
        { t: '외출 자제 · 창문에서 떨어지기', d: '태풍이 영향을 주는 동안에는 실내에 머물고, 창문이나 유리문에서 떨어진 곳에 있습니다.', c: '하천·해안·공사장·산사태 위험 지역에는 접근하지 않습니다.', items: [] },
        { t: '창문과 출입문 닫아 고정', d: '바람에 흔들리지 않도록 창문을 잠그고 고정합니다.', c: '', items: ['item-tape'] },
        { t: '정전에 대비해 조명 준비', d: '손전등과 충전된 보조배터리를 가까이 둡니다.', c: '', items: ['item-flashlight', 'item-powerbank'] }
      ],
      min5: [
        { t: '기상 정보와 대피 안내 확인', d: '라디오·TV·재난문자로 태풍 경로와 대피 안내를 확인하고, 대피 권고 시 따릅니다.', c: '', items: ['item-radio'] }
      ],
      hour1: [
        { t: '끊어진 전선에 접근 금지', d: '태풍이 지나간 뒤 쓰러진 전신주나 끊어진 전선을 보면 가까이 가지 말고 한국전력(123) 또는 119에 신고합니다.', c: '', items: [] },
        { t: '파손·침수 확인 후 사용', d: '집이 침수되었다면 전기·가스 시설을 점검받은 뒤 사용합니다.', c: '', items: [] }
      ]
    }
  };

  // 오프라인 카드에 들어갈 재난별 핵심 3줄
  const CORE = {
    earthquake: ['흔들릴 때: 탁자 아래에서 머리 보호', '멈추면: 전기·가스 차단, 문 열어 출구 확보', '대피: 계단 이용, 넓은 공간으로'],
    fire: ['"불이야" 알리고 119 신고', '젖은 수건으로 코·입 막고 낮은 자세로 계단 대피', '문손잡이가 뜨거우면 열지 않기'],
    blackout: ['촛불 대신 손전등', '엘리베이터 이용 금지, 플러그 뽑기', '우리 집만 정전이면 한전 123'],
    flood: ['지하 공간에서 즉시 벗어나기', '물에 잠긴 길 걷거나 운전 금지', '높은 곳으로 이동, 고립 시 119'],
    typhoon: ['외출 자제, 창문에서 떨어지기', '라디오·재난문자로 대피 안내 확인', '끊어진 전선 접근 금지']
  };

  let active = 'earthquake';
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
             <p><b>이 단계는 소방·관계기관의 현장 안내를 따라요.</b><br>임의로 판단해서 다시 들어가거나 이동하지 마세요.</p></div>`}
      </div>`;
  }

  function render() {
    const d = DISASTERS[active];
    const panel = document.getElementById('guidePanel');
    panel.setAttribute('aria-labelledby', 'gtab-' + active);
    panel.innerHTML = `
      <p class="guide-intro"><span class="guide-en">${d.en}</span>${d.intro}</p>
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
    render();
  }

  RO.disaster = { DISASTERS, CORE, init };
})(window.RO);
