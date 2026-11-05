/* BLACK-OUT — make.html: 재료를 조합대에 올려 생존 용품을 만드는 페이지
   맞는 조합이면 완성되어 '나의 조합 도감'에 저장되고, 표시한 것(최대 4개)이 대피 카드 뒷면에 들어갑니다. */
(function (RO) {
  const SLOTS = 3;
  const R = () => RO.recipes;
  const $ = (id) => document.getElementById(id);
  let bench = [];          // 조합대에 올린 재료 id
  let lastResult = null;   // 방금 만든 조합법 id

  // 재료 선반: 주방 / 욕실·청소 / 생활용품
  function renderPantry() {
    const cats = [...new Set(R().INGREDIENTS.map((i) => i.cat))];
    $('pantry').innerHTML = cats.map((c) => `
      <p class="pantry-cat">${c}</p>
      ${R().INGREDIENTS.filter((i) => i.cat === c).map((i) => `
        <button type="button" class="ing ${bench.includes(i.id) ? 'is-on' : ''}" data-ing="${i.id}" aria-pressed="${bench.includes(i.id)}">
          <span class="ing-icon"><i data-lucide="${i.icon}" aria-hidden="true"></i></span>
          <span class="ing-name">${i.name}</span>
          <span class="ing-check" aria-hidden="true"><i data-lucide="check" aria-hidden="true"></i></span>
        </button>`).join('')}`).join('');
  }

  function renderBench() {
    $('slots').innerHTML = Array.from({ length: SLOTS }, (_, k) => {
      const ing = bench[k] && R().ingredient(bench[k]);
      return `${k ? '<span class="slot-plus" aria-hidden="true">+</span>' : ''}
        ${ing
          ? `<button type="button" class="slot is-filled" data-slot="${ing.id}" aria-label="${ing.name} 조합대에서 내리기">
               <i data-lucide="${ing.icon}" aria-hidden="true"></i><span>${ing.name}</span></button>`
          : `<span class="slot" aria-hidden="true"><span>재료 ${k + 1}</span></span>`}`;
    }).join('');
    const r = lastResult && R().byId(lastResult);
    $('benchResult').innerHTML = r
      ? `<button type="button" class="result is-done" data-open="${r.id}">
           <i data-lucide="${r.icon}" aria-hidden="true"></i><b>${r.name}</b><span>만드는 법 보기</span></button>`
      : '<span class="result"><i data-lucide="help-circle" aria-hidden="true"></i><span>무엇이 나올까요?</span></span>';
    $('combineBtn').disabled = !bench.length;
    RO.icons();
  }

  function renderBook() {
    const made = R().made();
    const all = R().RECIPES;
    $('bookCount').textContent = `${made.length} / ${all.length}`;
    $('bookBar').style.width = (made.length / all.length) * 100 + '%';
    // 만든 것 먼저(만든 순서), 그다음 아직 못 만든 것
    const order = [...made.map(R().byId), ...all.filter((r) => !made.includes(r.id))];
    $('book').innerHTML = order.map((r) => {
      const got = made.includes(r.id);
      if (!got) {
        return `
          <article class="book-card is-locked">
            <span class="book-icon" aria-hidden="true">?</span>
            <p class="book-name">아직 못 찾은 조합</p>
            <p class="book-hint">재료 ${r.need.length}개 · ${r.use}에 쓰여요${r.adult ? ' · 어른과 함께' : ''}</p>
          </article>`;
      }
      const on = R().isOnCard(r.id);
      return `
        <article class="book-card ${r.id === lastResult ? 'is-new' : ''}">
          <span class="book-icon" aria-hidden="true"><i data-lucide="${r.icon}"></i></span>
          <p class="book-name">${r.name}</p>
          <p class="book-hint">${r.need.map(R().slotName).join(' + ')}</p>
          <div class="book-actions">
            <button type="button" class="link-act" data-open="${r.id}"><i data-lucide="book-open" aria-hidden="true"></i>만드는 법</button>
            <button type="button" class="card-toggle ${on ? 'is-on' : ''}" data-card="${r.id}" aria-pressed="${on}">
              <i data-lucide="${on ? 'check' : 'plus'}" aria-hidden="true"></i>대피 카드</button>
          </div>
        </article>`;
    }).join('');
    RO.icons();
  }

  function msg(text, kind = '') {
    const el = $('benchMsg');
    el.className = 'bench-msg ' + (kind ? 'is-' + kind : '');
    el.innerHTML = text;
  }

  function toggleIngredient(id) {
    lastResult = null;
    if (bench.includes(id)) bench = bench.filter((x) => x !== id);
    else if (bench.length >= SLOTS) { msg('조합대가 가득 찼어요. 재료를 하나 내려 주세요.', 'warn'); return; }
    else bench.push(id);
    msg(bench.length ? '좋아요! 다 올렸으면 <b>조합하기</b>를 눌러요.' : '재료를 골라 조합대에 올려 보세요.');
    renderPantry();
    renderBench();
  }

  function combine() {
    const r = R().combine(bench);
    const benchEl = $('bench');
    if (!r) {
      const miss = R().hint(bench);
      msg(miss
        ? `조금 모자라요. <b>${miss.map(R().slotName).join(', ')}</b>을(를) 더 올려 보세요.`
        : '이 재료들은 함께 쓰지 않아요. 다른 재료로 바꿔 볼까요?', 'fail');
      benchEl.classList.remove('is-fail'); void benchEl.offsetWidth; benchEl.classList.add('is-fail');
      return;
    }
    const isNew = R().addMade(r.id);
    lastResult = r.id;
    bench = [];
    msg(isNew ? `완성! <b>${r.name}</b>을(를) 도감에 담았어요.` : `<b>${r.name}</b>은(는) 이미 도감에 있어요.`, 'ok');
    benchEl.classList.remove('is-success'); void benchEl.offsetWidth; benchEl.classList.add('is-success');
    renderPantry();
    renderBench();
    renderBook();
    if (isNew) setTimeout(() => openRecipe(r.id), 650);
  }

  function openRecipe(id) {
    const r = R().byId(id);
    const on = R().isOnCard(id);
    $('recipeBody').innerHTML = `
      <p class="rd-use"><i data-lucide="${r.icon}" aria-hidden="true"></i>${r.use}에 쓰여요${r.adult ? ' · <b>어른과 함께 만들어요</b>' : ''}</p>
      <h2 id="recipeTitle">${r.name}</h2>
      <p class="rd-why">${r.why}</p>
      <div class="rd-formula" aria-label="조합식">
        ${r.need.map((slot) => `<span class="rd-ing has"><i data-lucide="${R().ingredient(slot[0]).icon}" aria-hidden="true"></i>${R().slotName(slot)}</span>`).join('<span class="rd-plus" aria-hidden="true">+</span>')}
        <span class="rd-plus" aria-hidden="true">=</span>
        <span class="rd-ing rd-result"><i data-lucide="${r.icon}" aria-hidden="true"></i>${r.name}</span>
      </div>
      <ol class="rd-steps">${r.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
      <p class="rd-tip"><i data-lucide="alert-triangle" aria-hidden="true"></i>${r.tip}</p>
      <p class="rd-src">근거: ${r.src.map((x) => (x.u ? `<a href="${x.u}" target="_blank" rel="noopener">${x.t}</a>` : x.t)).join(' · ')}</p>
      <div class="modal-actions">
        ${R().made().includes(r.id)
          ? `<button class="btn ${on ? 'btn-outline' : 'btn-primary'}" data-card="${r.id}">${on ? '대피 카드에서 빼기' : '대피 카드에 넣기'}</button>`
          : `<button class="btn btn-primary" data-try="${r.id}"><i data-lucide="sparkles" aria-hidden="true"></i>조합대에 재료 올려 보기</button>`}
        <button class="btn btn-outline" data-close>닫기</button>
      </div>`;
    RO.icons();
    if (!$('recipeDialog').open) $('recipeDialog').showModal();
  }

  // 만든 조합법(없으면 전체)의 만드는 법을 모아 A4로 인쇄·PDF 저장 (팀원 khg/blackout '제작 가이드 PDF' 방식)
  function printGuides() {
    const list = R().made().length ? R().made().map(R().byId) : R().RECIPES;
    $('guidePrintArea').innerHTML = `
      <h1>BLACK-OUT · 우리집 재료로 만들기</h1>
      <p class="gp-sub">${R().made().length ? '내가 만든 조합법' : '전체 조합법'} ${list.length}가지 · 출력일 ${new Date().toLocaleDateString('ko-KR')}</p>
      ${list.map((r) => `
        <section class="gp-item">
          <h2>${r.name}<span>${r.use}${r.adult ? ' · 어른과 함께' : ''}</span></h2>
          <p class="gp-need"><b>재료</b> ${r.need.map(R().slotName).join(' + ')}</p>
          <ol>${r.steps.map((st) => `<li>${st}</li>`).join('')}</ol>
          <p class="gp-tip">! ${r.tip}</p>
          <p class="gp-src">근거: ${r.src.map((x) => x.t).join(' · ')}</p>
        </section>`).join('')}
      <p class="gp-foot">불과 칼은 쓰지 않아요. 실제 재난 시에는 정부·소방의 공식 안내를 먼저 따르세요.</p>`;
    RO.print('print-guides');
  }

  function toggleCard(id) {
    const wasOn = R().isOnCard(id);
    if (!R().toggleCard(id)) { RO.toast(`대피 카드에는 ${R().CARD_MAX}개까지 넣을 수 있어요. 하나를 먼저 빼 주세요.`); return; }
    RO.toast(wasOn ? '대피 카드에서 뺐어요' : '대피 카드에 넣었어요');
    renderBook();
    if ($('recipeDialog').open) openRecipe(id);
  }

  function init() {
    if (!$('bench')) return;
    renderPantry();
    renderBench();
    renderBook();
    $('pantry').addEventListener('click', (e) => { const b = e.target.closest('[data-ing]'); if (b) toggleIngredient(b.dataset.ing); });
    $('slots').addEventListener('click', (e) => { const b = e.target.closest('[data-slot]'); if (b) toggleIngredient(b.dataset.slot); });
    $('combineBtn').addEventListener('click', combine);
    $('clearBtn').addEventListener('click', () => { bench = []; lastResult = null; msg('재료를 골라 조합대에 올려 보세요.'); renderPantry(); renderBench(); });
    document.addEventListener('click', (e) => {
      const o = e.target.closest('[data-open]');
      if (o) openRecipe(o.dataset.open);
      const c = e.target.closest('[data-card]');
      if (c) toggleCard(c.dataset.card);
      // 아직 못 만든 조합법: 각 칸의 첫 재료를 조합대에 올려 줌
      const t = e.target.closest('[data-try]');
      if (t) {
        bench = R().byId(t.dataset.try).need.map((slot) => slot[0]);
        lastResult = null;
        $('recipeDialog').close();
        msg('재료를 올려 두었어요. <b>조합하기</b>를 눌러 완성해 보세요!');
        renderPantry();
        renderBench();
        $('bench').scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    $('printGuides').addEventListener('click', printGuides);
    // make.html#lantern 처럼 들어오면 그 만드는 법을 바로 보여 줌 (행동수칙의 '집에서 만들기' 링크)
    const fromLink = R().byId(location.hash.slice(1));
    if (fromLink) openRecipe(fromLink.id);
    $('resetBook').addEventListener('click', () => {
      R().reset(); lastResult = null; bench = [];
      renderPantry(); renderBench(); renderBook();
      msg('도감을 비웠어요. 처음부터 다시 조합해 보세요.');
    });
  }

  RO.make = { init };
})(window.RO);
