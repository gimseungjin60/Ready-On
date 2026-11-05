/* READY : ON — 오프라인 대피 카드 (입력 → A4 미리보기 → 인쇄)
   입력값은 사용자가 "이 브라우저에 저장"을 누를 때만 localStorage에 저장되며, 서버로 전송하지 않습니다. */
(function (RO) {
  const KEY = 'offlineCard';
  const CHECKLIST = ['식수 (1인 하루 3L × 3일)', '비상식량 3일분', '손전등·여분 건전지', '보조배터리 (충전 상태)', '휴대용 라디오', '응급처치 키트·상비약', '호루라기', '현금 소액·신분증 사본', '마스크·장갑', '이 카드 사본'];
  const DIS_LABEL = { earthquake: '지진', fire: '화재', blackout: '정전', flood: '침수', typhoon: '태풍' };
  const $ = (id) => document.getElementById(id);

  const fields = ['cName', 'cAddress', 'cHousing', 'cShelterName', 'cShelterAddr', 'cMeet', 'cNotes', 'c1Name', 'c1Phone', 'c2Name', 'c2Phone', 'c3Name', 'c3Phone'];

  function read() {
    const d = {};
    fields.forEach((f) => { d[f] = $(f).value.trim(); });
    return d;
  }
  function fill(d) {
    fields.forEach((f) => { if (d[f] != null) $(f).value = d[f]; });
  }

  function preview() {
    const d = read();
    const e = RO.esc;
    const result = RO.test.getResult();
    const contacts = [[d.c1Name, d.c1Phone], [d.c2Name, d.c2Phone], [d.c3Name, d.c3Phone]].filter(([n, p]) => n || p);
    const gaps = result ? result.gaps.map((g) => g.label) : [];
    const blank = (v, w = '') => (v ? e(v) : `<span class="oc-blank">${w}</span>`);

    $('cardSheet').innerHTML = `
      <header class="oc-head">
        <div>
          <p class="oc-brand">READY : ON</p>
          <h3 class="oc-title">오프라인 대피 카드</h3>
        </div>
        <div class="oc-emer">
          <p><b>119</b> 화재·구조·구급</p>
          <p><b>112</b> 경찰</p>
          <p><b>123</b> 정전 (한국전력)</p>
        </div>
      </header>

      <section class="oc-row oc-who">
        <div><span class="oc-k">이름</span><span class="oc-v">${blank(d.cName)}</span></div>
        <div><span class="oc-k">거주 형태</span><span class="oc-v">${blank(d.cHousing)}</span></div>
        <div class="oc-wide"><span class="oc-k">주소</span><span class="oc-v">${blank(d.cAddress)}</span></div>
      </section>

      <section class="oc-row oc-shelter">
        <div class="oc-wide">
          <span class="oc-k">주요 대피소</span>
          <span class="oc-v oc-big">${blank(d.cShelterName)}</span>
          <span class="oc-v">${blank(d.cShelterAddr)}</span>
        </div>
        <div class="oc-wide"><span class="oc-k">가족·지인 만남 장소</span><span class="oc-v">${blank(d.cMeet)}</span></div>
      </section>

      <section class="oc-block">
        <h4>비상 연락처</h4>
        <table class="oc-contacts"><tbody>
          ${(contacts.length ? contacts : [['', ''], ['', '']]).map(([n, p]) => `<tr><td>${blank(n)}</td><td>${blank(p)}</td></tr>`).join('')}
        </tbody></table>
      </section>

      <section class="oc-block">
        <h4>재난별 핵심 행동수칙</h4>
        <div class="oc-rules">
          ${Object.entries(RO.disaster.CORE).map(([k, lines]) => `
            <div class="oc-rule"><b>${DIS_LABEL[k]}</b><ol>${lines.map((l) => `<li>${l}</li>`).join('')}</ol></div>`).join('')}
        </div>
      </section>

      <section class="oc-block oc-split">
        <div>
          <h4>비상용품 체크리스트</h4>
          <ul class="oc-check">${CHECKLIST.map((c) => `<li><span class="oc-box"></span>${c}</li>`).join('')}</ul>
        </div>
        <div>
          <h4>개인별 주의사항</h4>
          <p class="oc-notes">${d.cNotes ? e(d.cNotes).replace(/\n/g, '<br>') : '<span class="oc-blank oc-lines"></span>'}</p>
          ${gaps.length ? `<p class="oc-gaps"><b>내 테스트 결과 보완 항목</b> ${gaps.map(e).join(' · ')}</p>` : ''}
        </div>
      </section>

      <footer class="oc-foot">
        실제 재난 시에는 정부·지자체·소방의 공식 안내와 현장 지침을 우선 따르세요. · 작성일 ${new Date().toLocaleDateString('ko-KR')}
      </footer>`;
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
    form.addEventListener('submit', (e) => { e.preventDefault(); RO.print('print-card'); });
    $('cardSave').addEventListener('click', () => {
      RO.toast(RO.store.set(KEY, read()) ? '이 브라우저에만 저장했습니다' : '저장할 수 없는 환경입니다 (시크릿 모드 등)');
    });
    $('cardReset').addEventListener('click', () => {
      RO.store.remove(KEY);
      form.reset();
      preview();
      RO.toast('입력 내용과 저장된 정보를 삭제했습니다');
    });
    RO.on('shelter', (s) => {
      $('cShelterName').value = s.name;
      $('cShelterAddr').value = s.address;
      preview();
    });
    RO.on('result', (r) => { if (r && !$('cHousing').value) { $('cHousing').value = r.housing; } preview(); });
    preview();
  }

  RO.card = { init };
})(window.RO);
