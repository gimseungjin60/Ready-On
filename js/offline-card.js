/* BLACK-OUT — 오프라인 대피 카드 (A4 2장: 앞면 정보·대피 장소·연락처·지갑 카드 / 뒷면 행동수칙·만들기·체크리스트)
   화면 미리보기는 실제 A4 크기로 그린 뒤 축소해서 보여 주므로 PDF와 똑같이 보입니다.
   입력값은 "이 브라우저에 저장"을 누를 때만 localStorage에 저장되며, 서버로 전송하지 않습니다. */
(function (RO) {
  const KEY = 'offlineCard';
  const CHECKLIST = ['비상 산소 (1인 1솔 0.84kg)', '비상 산소마스크 · 휴대용 산소통', '비상 식수 (1인 1솔 3L)', '비상식 (1인 1솔 1.8kg)', 'CO₂ 흡착 카트리지', '고휘도 헤드램프 · 비상 배터리', '조난 신호 비콘', '여압복 · 헬멧 (점검일 기록)', '저중력 응급 의료 키트', '이 카드 사본'];
  const COMMON = ['마스크 먼저, 짐은 나중에', '닫힌 해치는 혼자 다시 열지 않아요', '기지 관제의 지시를 그대로 따라요'];
  const fields = ['cName', 'cAddress', 'cHousing', 'cBlood', 'cMedical', 'cShelterName', 'cShelterAddr', 'cMeet', 'cNotes', 'c1Name', 'c1Phone', 'c2Name', 'c2Phone', 'c3Name', 'c3Phone'];
  // 거주 형태별로 비상 카드 뒷면에 넣을 재난 5가지
  const BY_HOUSING = {
    '돔 도시': ['depress', 'meteor', 'solar', 'fire', 'dust'],
    '지하 거주 구역': ['quake', 'fire', 'life', 'power', 'depress'],
    '개인 거주 모듈': ['depress', 'fire', 'life', 'cold', 'power'],
    '이동형 로버': ['dust', 'solar', 'power', 'cold', 'depress'],
    '외곽 연구 기지': ['dust', 'solar', 'cold', 'power', 'life']
  };
  const DEFAULT_HZ = ['depress', 'solar', 'fire', 'dust', 'life'];
  const $ = (id) => document.getElementById(id);
  const e = (v) => RO.esc(v);

  const read = () => Object.fromEntries(fields.map((f) => [f, $(f).value.trim()]));
  const fill = (d) => fields.forEach((f) => { if (d[f] != null) $(f).value = d[f]; });
  // 비어 있으면 손으로 적을 수 있게 밑줄 칸
  const v = (val, cls = '') => (val ? `<span class="${cls}">${e(val)}</span>` : '<span class="blank"></span>');

  function head(page, title) {
    return `
      <header class="sh-head">
        <div>
          <p class="sh-brand">BLACK-OUT</p>
          <h3 class="sh-title">${title}</h3>
        </div>
        <p class="sh-page">${page}</p>
      </header>`;
  }

  function wallet(d, contacts) {
    return `
      <div class="wallet">
        <p class="wl-top"><b>비상 연락 카드</b><span>BLACK-OUT</span></p>
        <dl class="wl-info">
          <div><dt>이름</dt><dd>${v(d.cName)}</dd></div>
          <div><dt>혈액형</dt><dd>${v(d.cBlood)}</dd></div>
          <div class="wl-wide"><dt>연락처 1</dt><dd>${v([contacts[0]?.[0], contacts[0]?.[1]].filter(Boolean).join(' '))}</dd></div>
          <div class="wl-wide"><dt>연락처 2</dt><dd>${v([contacts[1]?.[0], contacts[1]?.[1]].filter(Boolean).join(' '))}</dd></div>
          <div class="wl-wide"><dt>대피 모듈</dt><dd>${v(d.cShelterName)}</dd></div>
          <div class="wl-wide"><dt>만남 모듈</dt><dd>${v(d.cMeet)}</dd></div>
        </dl>
        <p class="wl-foot">비상 <b>CH 1</b> 관제 · <b>CH 9</b> 구조 로봇</p>
      </div>`;
  }

  // 가까운 대피·구조 수단: 정착지 지도에서 고른 위치, 없으면 거주 형태의 대표 구역 기준
  function rescue(d) {
    const loc = RO.shelter.getLocation() || RO.shelter.zoneLoc(d.cHousing);
    const rows = RO.shelter.nearestAll(loc);
    if (!rows.length) return '';
    return `
        <section class="sh-block">
          <h4>가까운 대피·구조 수단 <small>${e(loc.label)} 기준 · 직선거리</small></h4>
          <table class="sh-rescue"><tbody>
            ${rows.map((r) => `<tr><th>${r.type}</th><td>${r.name}</td><td>${RO.shelter.fmtKm(r.km)} · 우주복 도보 ${r.walk}</td></tr>`).join('')}
          </tbody></table>
        </section>`;
  }

  function front(d) {
    const contacts = [[d.c1Name, d.c1Phone], [d.c2Name, d.c2Phone], [d.c3Name, d.c3Phone]].filter(([n, p]) => n || p);
    const rows = [...contacts, ...Array(Math.max(0, 3 - contacts.length)).fill(['', ''])].slice(0, 3);
    return `
      <article class="sheet" aria-label="대피 카드 앞면">
        ${head('1 / 2 · 앞면', '화성 거주구 비상 카드')}
        <p class="sh-lead">기지망이 끊겨도 이 카드를 보고 움직여요. 해치 옆, 침실 벽처럼 잘 보이는 곳에 붙여 두세요.</p>

        <section class="sh-calls" aria-label="긴급 전화">
          <div><b>CH 1</b><span>기지 관제</span></div>
          <div><b>CH 9</b><span>구조 로봇</span></div>
          <div><b>CH 16</b><span>이웃 거주구</span></div>
          <div class="sh-calls-note"><span>통신이 끊기면</span><b>비콘 켜고 가까운 대피 모듈로</b></div>
        </section>

        <section class="sh-block">
          <h4>나의 정보</h4>
          <dl class="sh-info">
            <div><dt>이름</dt><dd>${v(d.cName)}</dd></div>
            <div><dt>혈액형</dt><dd>${v(d.cBlood)}</dd></div>
            <div><dt>거주 형태</dt><dd>${v(d.cHousing)}</dd></div>
            <div class="wide"><dt>거주 구역 · 모듈 번호</dt><dd>${v(d.cAddress)}</dd></div>
            <div class="wide"><dt>지병 · 알레르기 · 복용 약</dt><dd>${v(d.cMedical)}</dd></div>
          </dl>
        </section>

        <section class="sh-block">
          <h4>대피 모듈</h4>
          <div class="sh-places">
            <div class="sh-place">
              <span class="sh-num">1</span>
              <div><p class="k">가장 가까운 대피 모듈</p><p class="big">${v(d.cShelterName)}</p><p class="sub">${v(d.cShelterAddr)}</p></div>
            </div>
            <div class="sh-place">
              <span class="sh-num">2</span>
              <div><p class="k">가족 만남 모듈</p><p class="big">${v(d.cMeet)}</p><p class="sub">통신이 끊기면 여기서 기다려요</p></div>
            </div>
          </div>
        </section>

        ${rescue(d)}

        <section class="sh-two">
          <div class="sh-block">
            <h4>비상 연락처</h4>
            <table class="sh-contacts">
              <thead><tr><th>이름 · 관계</th><th>전화번호</th></tr></thead>
              <tbody>${rows.map(([n, p]) => `<tr><td>${v(n)}</td><td>${v(p)}</td></tr>`).join('')}</tbody>
            </table>
          </div>
          <div class="sh-block">
            <h4>대피 경로 그리기</h4>
            <div class="sh-route">
              <span class="pin-home">내 거주구</span>
              <span class="pin-dest">대피 모듈</span>
              <p>거주구에서 대피 모듈까지 가는 길을 그려 보세요.<br>해치·에어록 위치와 여압복 보관 장소도 표시해요.</p>
            </div>
          </div>
        </section>

        <section class="sh-cut">
          <p class="sh-cut-label">✂ 선을 따라 잘라 지갑과 가방에 하나씩 넣으세요</p>
          <div class="wallets">${wallet(d, contacts)}${wallet(d, contacts)}</div>
        </section>
      </article>`;
  }

  function back(d) {
    const D = RO.disaster.DISASTERS;
    const result = RO.test.getResult();
    const recipes = RO.recipes.forCard();
    return `
      <article class="sheet" aria-label="대피 카드 뒷면">
        ${head('2 / 2 · 뒷면', '경보가 울리면 이렇게')}

        <section class="sh-block">
          <h4>경보별 행동 순서 <small>${d.cHousing ? e(d.cHousing) + ' 기준' : '대표 재난'}</small></h4>
          <div class="sh-rules">
            ${(BY_HOUSING[d.cHousing] || DEFAULT_HZ).map((k) => [k, RO.disaster.CORE[k]]).map(([k, lines]) => `
              <div class="sh-rule">
                <p class="sh-rule-name"><i data-lucide="${D[k].icon}" aria-hidden="true"></i>${D[k].label}</p>
                <ol>${lines.map((l) => `<li>${l}</li>`).join('')}</ol>
              </div>`).join('')}
            <div class="sh-rule sh-rule-common">
              <p class="sh-rule-name"><i data-lucide="megaphone" aria-hidden="true"></i>언제나 기억해요</p>
              <ol>${COMMON.map((l) => `<li>${l}</li>`).join('')}</ol>
            </div>
          </div>
        </section>

        <section class="sh-block">
          <h4>내가 만든 거주구 DIY</h4>
          <div class="sh-makes">
            ${recipes.map((r) => `
              <div class="sh-make">
                <p class="sh-make-name"><i data-lucide="${r.icon}" aria-hidden="true"></i>${r.name}<span>${r.use}${r.adult ? ' · 어른과 함께' : ''}</span></p>
                <p class="sh-make-need">재료: ${r.need.map(RO.recipes.slotName).join(' + ')}</p>
                <ol>${r.steps.map((st) => `<li>${st}</li>`).join('')}</ol>
                <p class="sh-make-tip">! ${r.tip}</p>
              </div>`).join('')}
            ${Array.from({ length: 4 - recipes.length }, () => `
              <div class="sh-make sh-make-blank">
                <p class="sh-make-name">직접 적어 보세요<span>내 DIY</span></p>
                <p class="sh-make-need">재료:</p>
                <ol><li></li><li></li><li></li></ol>
              </div>`).join('')}
          </div>
        </section>

        <section class="sh-two">
          <div class="sh-block">
            <h4>비상 장비 체크리스트</h4>
            <ul class="sh-check">${CHECKLIST.map((c) => `<li><span class="box"></span>${c}</li>`).join('')}</ul>
          </div>
          <div class="sh-block">
            <h4>우리 거주구 메모</h4>
            <p class="sh-notes">${d.cNotes ? e(d.cNotes).replace(/\n/g, '<br>') : '<span class="lines"></span>'}</p>
            ${result?.gaps.length ? `<p class="sh-gaps"><b>테스트 결과 먼저 채울 것</b> ${result.gaps.map((g) => e(g.label)).join(' · ')}</p>` : ''}
            <p class="sh-review"><b>점검한 날</b><span></span><span></span><span></span></p>
          </div>
        </section>

        <footer class="sh-foot">
          실제 상황에서는 기지 관제와 구조팀의 지시를 먼저 따르세요. · 만든 날 ${new Date().toLocaleDateString('ko-KR')} · BLACK-OUT
        </footer>
      </article>`;
  }

  function preview() {
    const d = read();
    $('cardSheets').innerHTML = `<div class="sheet-frame">${front(d)}</div><div class="sheet-frame">${back(d)}</div>`;
    RO.icons();
    fit();
    const rs = RO.recipes.forCard();
    $('cardRecipes').innerHTML = rs.length
      ? `${rs.map((r) => `<span>${r.name}</span>`).join('')}<a class="text-link" href="make.html">DIY 바꾸기 →</a>`
      : '<em>아직 만든 DIY가 없어요. 카드에는 직접 적을 수 있는 빈칸이 들어가요.</em><a class="text-link" href="make.html">DIY 하러 가기 →</a>';
  }

  // 실제 A4 크기로 그린 시트를 미리보기 너비에 맞게 축소
  function fit() {
    document.querySelectorAll('#cardSheets .sheet-frame').forEach((f) => {
      const s = f.firstElementChild;
      const k = f.clientWidth / s.offsetWidth;
      s.style.transform = `scale(${k})`;
      f.style.height = s.offsetHeight * k + 'px';
    });
  }

  function printCard() {
    const name = $('cName').value.trim();
    const title = document.title;
    document.title = `BLACKOUT-MARS_비상카드${name ? '_' + name : ''}`; // PDF 파일 이름
    window.addEventListener('afterprint', () => { document.title = title; }, { once: true });
    RO.print('print-card');
  }

  function init() {
    const form = $('cardForm');
    const saved = RO.store.get(KEY, null);
    if (saved) fill(saved);
    else {
      const r = RO.test.getResult();
      if (r) $('cHousing').value = r.housing;
    }
    form.addEventListener('input', preview);
    form.addEventListener('submit', (ev) => { ev.preventDefault(); printCard(); });
    $('cardSave').addEventListener('click', () => {
      RO.toast(RO.store.set(KEY, read()) ? '이 브라우저에만 저장했어요' : '저장할 수 없는 환경이에요 (시크릿 모드 등)');
    });
    $('cardReset').addEventListener('click', () => {
      RO.store.remove(KEY);
      form.reset();
      preview();
      RO.toast('입력 내용과 저장된 정보를 지웠어요');
    });
    RO.on('shelter', (s) => {
      $('cShelterName').value = s.name;
      $('cShelterAddr').value = s.address;
      preview();
    });
    RO.on('result', (r) => { if (r && !$('cHousing').value) $('cHousing').value = r.housing; preview(); });
    RO.on('recipes', preview);
    RO.on('location', () => preview());
    RO.on('view', (id) => id === 'offline-card' && requestAnimationFrame(fit));
    window.addEventListener('resize', fit);
    preview();
  }

  RO.card = { init };
})(window.RO);
