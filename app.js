/* ============================================================
   블랙아웃 (BLACKOUT) — 재난 안전 대응체계
   화면 로직 전용 파일. 문구·품목은 data.js, 디자인은 style.css.
   외부 라이브러리 없음 · 네트워크 호출 없음 · 입력값은 이 브라우저에만 저장.
   ============================================================ */

(function () {
  'use strict';

  var D = window.BLACKOUT_DATA;
  if (!D) { console.error('[블랙아웃] data.js를 먼저 불러와야 합니다.'); return; }

  var RESPONSE = D.RESPONSE, PRINCIPLES = D.PRINCIPLES, DISASTERS = D.DISASTERS,
      MATCATS = D.MATCATS, PRESET = D.PRESET, RECIPES = D.RECIPES, CATS = D.CATS,
      ITEMS = D.ITEMS, KITS = D.KITS, AXES = D.AXES, AXCOLOR = D.AXCOLOR,
      QUIZ = D.QUIZ, AXFIX = D.AXFIX, TYPES = D.TYPES;

  /* ============================== 상태 ============================== */

  var KEY = 'blackout.v1';
  var S = { disaster: 'blackout', inv: {}, cart: {}, quiz: {}, filter: '전체', card: {}, result: null };

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var o = JSON.parse(raw);
        for (var k in o) { if (o[k] != null) S[k] = o[k]; }
      }
    } catch (e) { /* 저장소를 못 써도 페이지는 작동한다 */ }
    if (!S.inv || !Object.keys(S.inv).length) {
      S.inv = {};
      PRESET.forEach(function (id) { S.inv[id] = true; });
    }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function $(s) { return document.querySelector(s); }
  function item(id) { for (var i = 0; i < ITEMS.length; i++) { if (ITEMS[i].id === id) return ITEMS[i]; } return null; }
  function recipe(id) { for (var i = 0; i < RECIPES.length; i++) { if (RECIPES[i].id === id) return RECIPES[i]; } return null; }
  function dis(id) { for (var i = 0; i < DISASTERS.length; i++) { if (DISASTERS[i].id === id) return DISASTERS[i]; } return DISASTERS[0]; }
  function won(n) { return n.toLocaleString('ko-KR') + '원'; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  var smooth = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

  /* ============================== 탭 ============================== */

  function setTab(name) {
    document.querySelectorAll('nav.tabs button').forEach(function (b) {
      b.setAttribute('aria-selected', b.dataset.tab === name ? 'true' : 'false');
    });
    document.querySelectorAll('.panel').forEach(function (p) {
      var on = p.id === 'p-' + name;
      p.hidden = !on;
      p.classList.toggle('active', on);
    });
    /* 캐릭터가 탭마다 한마디 — game.js가 등록한다 */
    if (typeof window.BLACKOUT_ONTAB === 'function') window.BLACKOUT_ONTAB(name);
  }

  function goTab(name) {
    setTab(name);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  /* ============================== 00 대응체계 ============================== */

  function renderResponse() {
    var w = $('#respSteps'); w.innerHTML = '';
    RESPONSE.forEach(function (r) {
      var box = el('div', 'rstep',
        '<div class="rhead"><span class="rn">' + r.n + '</span><b>' + esc(r.t) + '</b><span class="rw">' + esc(r.w) + ' 안에</span></div>' +
        '<p class="rd">' + esc(r.d) + '</p>' +
        '<ul class="rk">' + r.k.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>');
      var b = el('button', 'btn sm ghost noprint');
      b.type = 'button';
      b.textContent = r.gl;
      b.addEventListener('click', function () { goTab(r.go); });
      box.appendChild(b);
      w.appendChild(box);
    });
  }

  function renderPrinciples() {
    var w = $('#respPrin'); w.innerHTML = '';
    PRINCIPLES.forEach(function (p) {
      w.appendChild(el('div', 'prin', '<b>' + esc(p.t) + '</b><p>' + esc(p.d) + '</p>'));
    });
  }


  function renderChoice() {
    var w = $('#dchoice'); w.innerHTML = '';
    DISASTERS.forEach(function (d) {
      var btn = el('button');
      btn.type = 'button';
      btn.setAttribute('aria-pressed', d.id === S.disaster ? 'true' : 'false');
      btn.innerHTML = '<span class="dc">' + d.code + '</span><span class="dn">' + esc(d.name) + '</span><span class="dd">' + esc(d.desc) + '</span>';
      btn.addEventListener('click', function () {
        S.disaster = d.id; save();
        renderChoice(); renderAction(); renderKits(); renderSheet();
        setTab('action');
        window.scrollTo({ top: 0, behavior: 'auto' });
      });
      w.appendChild(btn);
    });
  }

  /* ============================== 01 진단 ============================== */

  function renderQuiz() {
    var w = $('#quizlist'); w.innerHTML = '';
    QUIZ.forEach(function (q, i) {
      var box = el('div', 'qitem');
      box.innerHTML = '<div class="qq"><span class="qn">Q' + (i + 1) + '</span><span>' + esc(q.q) + '</span></div>';
      var opts = el('div', 'qopts');
      q.opts.forEach(function (o, j) {
        var id = 'q' + i + 'o' + j;
        var lab = el('label');
        lab.setAttribute('for', id);
        lab.innerHTML = '<input type="radio" id="' + id + '" name="q' + i + '"' + (S.quiz[i] === j ? ' checked' : '') + '><span>' + esc(o.t) + '</span>';
        lab.querySelector('input').addEventListener('change', function () { S.quiz[i] = j; save(); score(); });
        opts.appendChild(lab);
      });
      box.appendChild(opts);
      w.appendChild(box);
    });
  }

  function score() {
    var ax = { w: 0, e: 0, c: 0, s: 0 }, max = { w: 0, e: 0, c: 0, s: 0 }, profile = null, answered = 0;
    QUIZ.forEach(function (q, i) {
      if (q.ax) max[q.ax] += 2;
      var a = S.quiz[i];
      if (a == null) return;
      answered++;
      if (q.ax) ax[q.ax] += (q.opts[a].s || 0);
      else profile = q.opts[a].v;
    });
    var total = 0, tmax = 0, lowest = 's', lowv = 2;
    for (var k in ax) {
      total += ax[k]; tmax += max[k];
      var r = max[k] ? ax[k] / max[k] : 0;
      if (r < lowv) { lowv = r; lowest = k; }
    }
    S.result = { ax: ax, max: max, total: total, tmax: tmax, profile: profile, lowest: lowest,
      answered: answered, pct: tmax ? Math.round(total / tmax * 100) : 0 };
    save();
    renderResult();
    renderKits();
  }

  function renderResult() {
    var r = S.result, box = $('#quizResult'); box.innerHTML = '';
    var done = r.answered >= QUIZ.length;

    var head = el('div', 'card pad');
    head.appendChild(el('div', 'label', '진단 진행 ' + r.answered + ' / ' + QUIZ.length));
    var bar = el('div', 'scorebar'); bar.style.marginTop = '9px';
    var fill = el('i'); fill.style.width = Math.round(r.answered / QUIZ.length * 100) + '%';
    bar.appendChild(fill); head.appendChild(bar);
    var axw = el('div', 'axis');
    Object.keys(AXES).forEach(function (k) {
      var pct = r.max[k] ? Math.round(r.ax[k] / r.max[k] * 100) : 0;
      var row = el('div', 'axisrow');
      row.appendChild(el('div', 'an', AXES[k]));
      var m = el('div', 'mini'); var mi = el('i');
      mi.style.width = pct + '%'; mi.style.background = AXCOLOR[k];
      m.appendChild(mi); row.appendChild(m);
      row.appendChild(el('div', 'av', pct + '%'));
      axw.appendChild(row);
    });
    head.appendChild(axw);
    box.appendChild(head);

    if (!done) {
      box.appendChild(el('div', 'card pad',
        '<div class="label">결과 대기</div><p class="note" style="margin-top:8px">10문항을 모두 답하면 유형과 <b>부족한 것만</b> 추려 보여 줍니다. 물건을 먼저 권하지 않습니다.</p>'));
      return;
    }

    var T = TYPES[r.pct >= 75 ? 'hi' : r.lowest] || TYPES.s;
    box.appendChild(el('div', 'typecard',
      '<div class="label">진단 결과 · ' + r.pct + '점</div><div class="tt">' + esc(T.t) + '</div><div class="td">' + esc(T.d) + '</div>'));

    var fix = AXFIX[r.lowest];
    var rec = el('div', 'card pad',
      '<div class="label">가장 약한 고리 · ' + AXES[r.lowest] + '</div><p class="note" style="margin-top:8px">' + esc(fix.msg) + '</p>');
    var list = el('div');
    list.style.cssText = 'display:grid;gap:7px;margin-top:13px';
    fix.items.forEach(function (id) {
      var it = item(id); if (!it) return;
      var row = el('div');
      row.style.cssText = 'display:flex;gap:8px;align-items:center;font-size:13px';
      row.innerHTML = '<span style="flex:1">' + esc(it.n) + '</span><span class="mono" style="color:var(--fg-faint);font-size:12px">' + won(it.p) + '</span>';
      var b = el('button', 'btn sm'); b.type = 'button'; b.textContent = '담기';
      b.addEventListener('click', function () { addCart(id); b.textContent = '담김'; });
      row.appendChild(b);
      list.appendChild(row);
    });
    rec.appendChild(list);
    var mk = el('p', 'note');
    mk.style.marginTop = '13px';
    mk.innerHTML = '<b>돈을 안 쓰는 보완책:</b> ' + fix.makes.map(function (m) { var rr = recipe(m); return rr ? esc(rr.n) : m; }).join(' · ') + ' — 집 재료로 오늘 만들 수 있습니다.';
    rec.appendChild(mk);
    var go = el('button', 'btn sm ghost');
    go.type = 'button'; go.textContent = '제작 가이드 열기'; go.style.marginTop = '11px';
    go.addEventListener('click', function () { openGuide(recipe(fix.makes[0]).g); });
    rec.appendChild(go);
    box.appendChild(rec);

    var kitRec = r.profile === 'high' ? 'kit_high' : r.profile === 'mini' ? 'kit_mini' : 'kit_family';
    var kk = null;
    KITS.forEach(function (x) { if (x.id === kitRec) kk = x; });
    if (kk) {
      var kc = el('div', 'card pad',
        '<div class="label">거주 형태 맞춤 세트</div><div style="font-weight:600;margin-top:6px">' + esc(kk.n) + '</div><p class="note" style="margin-top:5px">' + esc(kk.d) + '</p>');
      var kb = el('button', 'btn sm primary');
      kb.type = 'button'; kb.textContent = '한 번에 담기'; kb.style.marginTop = '11px';
      kb.addEventListener('click', function () {
        kk.items.forEach(function (id) { if (!S.cart[id]) S.cart[id] = 1; });
        save(); renderCart(); renderItems(); renderSheet(); setTab('kit');
        window.scrollTo({ top: 0, behavior: 'auto' });
      });
      kc.appendChild(kb);
      box.appendChild(kc);
    }
  }

  /* ============================== 02 행동수칙 ============================== */

  function renderActSwitch() {
    var w = $('#actSwitch'); w.innerHTML = '';
    DISASTERS.forEach(function (d) {
      var b = el('button', 'chip');
      b.type = 'button';
      b.textContent = d.name;
      if (d.id === S.disaster) {
        b.style.borderColor = 'var(--amber-dim)';
        b.style.background = 'rgba(255,176,31,.12)';
        b.style.color = 'var(--fg)';
      }
      b.addEventListener('click', function () {
        S.disaster = d.id; save();
        renderAction(); renderKits(); renderSheet(); renderChoice();
      });
      w.appendChild(b);
    });
  }

  function actList(arr) {
    var ul = el('ul', 'acts');
    arr.forEach(function (a, i) {
      var li = el('li');
      li.appendChild(el('span', 'ai', String(i + 1).padStart(2, '0')));
      var tx = el('div', 'atx');
      tx.innerHTML = esc(a.t) + (a.why ? '<span class="why">' + esc(a.why) + '</span>' : '');
      if (a.item || a.make) {
        var wrap = el('div', 'addwrap');
        if (a.item) {
          var it = item(a.item);
          if (it) {
            wrap.appendChild(el('span', 'needs', '필요: ' + esc(it.n)));
            var b = el('button', 'btn sm');
            b.type = 'button';
            b.textContent = S.cart[a.item] ? '담김' : '키트에 담기';
            b.addEventListener('click', function () { addCart(a.item); b.textContent = '담김'; });
            wrap.appendChild(b);
          }
        }
        if (a.make) {
          var rr = recipe(a.make);
          if (rr) {
            var g = el('button', 'btn sm ghost');
            g.type = 'button';
            g.textContent = '직접 만들기';
            g.addEventListener('click', function () { openGuide(rr.g); });
            wrap.appendChild(g);
          }
        }
        tx.appendChild(wrap);
      }
      li.appendChild(tx);
      ul.appendChild(li);
    });
    return ul;
  }

  function renderAction() {
    var d = dis(S.disaster);
    $('#actTitle').textContent = d.name + ' 행동수칙';
    renderActSwitch();
    var cols = $('#actCols'); cols.innerHTML = '';
    [['now', '지금 즉시', '0분', d.now], ['m5', '5분 후', '+5분', d.m5], ['h1', '1시간 후', '+1시간', d.h1]].forEach(function (x) {
      var c = el('div', 'tcol ' + x[0]);
      c.appendChild(el('div', 'th', '<span class="tw">' + x[2] + '</span><b>' + x[1] + '</b>'));
      c.appendChild(actList(x[3]));
      cols.appendChild(c);
    });
    var dw = $('#actDonts'); dw.innerHTML = '';
    d.donts.forEach(function (x) {
      dw.appendChild(el('div', 'dont', '<b>' + esc(x.b) + '</b><p>' + esc(x.p) + '</p>'));
    });
  }

  /* ============================== 03 재료 스캐너 ============================== */

  function renderMats() {
    var w = $('#matGroups'); w.innerHTML = '';
    MATCATS.forEach(function (g) {
      var box = el('div', 'matgroup');
      box.appendChild(el('div', 'mg', '<b>' + esc(g.n) + '</b><span class="tag" data-cnt="' + g.id + '"></span>'));
      var chips = el('div', 'chips');
      g.items.forEach(function (m) {
        var id = 'm-' + m[0];
        var lab = el('label', 'chip');
        lab.setAttribute('for', id);
        lab.innerHTML = '<input type="checkbox" id="' + id + '"' + (S.inv[m[0]] ? ' checked' : '') + '><span>' + esc(m[1]) + '</span>';
        lab.querySelector('input').addEventListener('change', function (ev) {
          if (ev.target.checked) S.inv[m[0]] = true; else delete S.inv[m[0]];
          save(); matchAll();
        });
        chips.appendChild(lab);
      });
      box.appendChild(chips);
      w.appendChild(box);
    });
  }

  function evalRecipe(r) {
    var missing = [];
    r.req.forEach(function (g) {
      var has = g.any.some(function (id) { return !!S.inv[id]; });
      if (!has) missing.push(g.l);
    });
    return { ok: missing.length === 0, missing: missing, have: r.req.length - missing.length, total: r.req.length };
  }

  function matchAll() {
    var ok = 0;
    var list = $('#matchList'); list.innerHTML = '';
    var results = RECIPES.map(function (r) { return { r: r, e: evalRecipe(r) }; });
    results.sort(function (a, b) { return (b.e.have / b.e.total) - (a.e.have / a.e.total); });
    results.forEach(function (x) {
      if (x.e.ok) ok++;
      var row = el('div', 'mrow' + (x.e.ok ? ' ok' : ''));
      var t = el('div', 'mt', '<b>' + esc(x.r.n) + '</b>' +
        (x.e.ok ? '<span class="tag ok">제작 가능</span>' : '<span class="tag warn">' + x.e.missing.length + '개 부족</span>'));
      var btn = el('button', 'btn sm ghost');
      btn.type = 'button'; btn.textContent = '가이드';
      btn.addEventListener('click', function () { openGuide(x.r.g); });
      t.appendChild(btn);
      row.appendChild(t);
      if (!x.e.ok) row.appendChild(el('div', 'miss', '부족: <em>' + x.e.missing.map(esc).join(' · ') + '</em>'));
      list.appendChild(row);
    });

    $('#mkCount').textContent = ok;
    $('#mkTotal').textContent = '/ ' + RECIPES.length + ' 종';
    $('#mkBar').style.width = Math.round(ok / RECIPES.length * 100) + '%';

    MATCATS.forEach(function (g) {
      var n = g.items.filter(function (m) { return !!S.inv[m[0]]; }).length;
      var tag = document.querySelector('[data-cnt="' + g.id + '"]');
      if (tag) tag.textContent = n + ' / ' + g.items.length;
    });

    document.querySelectorAll('.matchtag').forEach(function (t) {
      var r = recipe(t.dataset.for);
      if (!r) return;
      var e = evalRecipe(r);
      t.className = 'matchtag tag ' + (e.ok ? 'ok' : 'warn');
      t.textContent = e.ok ? '재료 있음' : '재료 ' + e.missing.length + '개 부족';
    });
  }

  function openGuide(gid) {
    setTab('make');
    var g = document.getElementById(gid);
    if (!g) return;
    g.open = true;
    g.classList.remove('flash');
    requestAnimationFrame(function () {
      g.scrollIntoView({ behavior: smooth, block: 'start' });
      g.classList.add('flash');
    });
  }

  /* ============================== 04 키트 ============================== */

  function addCart(id) {
    if (!item(id)) return;
    S.cart[id] = (S.cart[id] || 0) + 1;
    save(); renderCart(); renderItems(); renderSheet();
  }
  function removeCart(id) {
    delete S.cart[id];
    save(); renderCart(); renderItems(); renderSheet();
  }

  function recommendedKit() {
    if (S.result && S.result.answered >= QUIZ.length) {
      return S.result.profile === 'high' ? 'kit_high' : S.result.profile === 'mini' ? 'kit_mini' : 'kit_family';
    }
    if (S.disaster === 'blackout') return 'kit_blackout';
    if (S.disaster === 'water') return 'kit_family';
    if (S.disaster === 'quake') return 'kit_solo';
    return 'kit_mini';
  }

  function renderKits() {
    var w = $('#kitsets'); w.innerHTML = '';
    var recId = recommendedKit();
    KITS.forEach(function (k) {
      var sum = k.items.reduce(function (a, id) { var it = item(id); return a + (it ? it.p : 0); }, 0);
      var box = el('div', 'kitset' + (k.id === recId ? ' rec' : ''),
        (k.id === recId ? '<span class="tag warn">추천</span>' : '') +
        '<b>' + esc(k.n) + '</b><div class="kp">' + won(sum) + ' · ' + k.items.length + '품목</div>' +
        '<p class="note">' + esc(k.d) + '</p><ul>' +
        k.items.slice(0, 4).map(function (id) { var it = item(id); return '<li>' + esc(it ? it.n : id) + '</li>'; }).join('') +
        (k.items.length > 4 ? '<li>외 ' + (k.items.length - 4) + '종</li>' : '') + '</ul>');
      var b = el('button', 'btn sm' + (k.id === recId ? ' primary' : ''));
      b.type = 'button'; b.textContent = '한 번에 담기';
      b.addEventListener('click', function () {
        k.items.forEach(function (id) { if (!S.cart[id]) S.cart[id] = 1; });
        save(); renderCart(); renderItems(); renderSheet();
      });
      box.appendChild(b);
      w.appendChild(box);
    });
  }

  function renderFilter() {
    var w = $('#itemFilter'); w.innerHTML = '';
    ['전체'].concat(CATS).forEach(function (c) {
      var b = el('button', 'chip');
      b.type = 'button'; b.textContent = c;
      if (c === S.filter) {
        b.style.borderColor = 'var(--amber-dim)';
        b.style.background = 'rgba(255,176,31,.12)';
        b.style.color = 'var(--fg)';
      }
      b.addEventListener('click', function () { S.filter = c; save(); renderFilter(); renderItems(); });
      w.appendChild(b);
    });
  }

  function renderItems() {
    var tb = $('#itemRows'); tb.innerHTML = '';
    var rows = ITEMS.filter(function (it) { return S.filter === '전체' || it.c === S.filter; });
    $('#itemCount').textContent = rows.length;
    rows.forEach(function (it) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td><span class="nm">' + esc(it.n) + '</span><span class="sp">' + esc(it.c) + '</span></td>' +
        '<td style="color:var(--fg-dim);font-size:13px">' + esc(it.s) + '</td>' +
        '<td></td><td class="pr">' + won(it.p) + '</td><td style="text-align:right"></td>';
      var mk = it.make ? recipe(it.make) : null;
      if (mk) {
        var e = evalRecipe(mk);
        var gb = el('button', 'btn sm ghost');
        gb.type = 'button';
        gb.textContent = e.ok ? '만들 수 있음' : '가이드';
        gb.style.cssText = 'font-size:11.5px;padding:4px 7px';
        if (e.ok) gb.style.color = '#7FE0AC';
        gb.addEventListener('click', function () { openGuide(mk.g); });
        tr.children[2].appendChild(gb);
      } else {
        tr.children[2].innerHTML = '<span class="note">—</span>';
      }
      var ab = el('button', 'btn sm' + (S.cart[it.id] ? '' : ' primary'));
      ab.type = 'button';
      ab.textContent = S.cart[it.id] ? '담김 ' + S.cart[it.id] : '담기';
      ab.addEventListener('click', function () { addCart(it.id); });
      tr.children[4].appendChild(ab);
      tb.appendChild(tr);
    });
  }

  function renderCart() {
    var ul = $('#cartList'); ul.innerHTML = '';
    var ids = Object.keys(S.cart).filter(function (id) { return !!item(id); });
    var sum = 0;
    if (!ids.length) {
      ul.appendChild(el('li', '', '<div class="empty">아직 비어 있습니다.<br>§01 진단이나 §02 행동수칙에서 필요한 것만 담으십시오.</div>'));
    }
    ids.forEach(function (id) {
      var it = item(id);
      var q = S.cart[id];
      sum += it.p * q;
      var li = el('li', '', '<span class="cn">' + esc(it.n) + '</span><span class="cq">×' + q + '</span>');
      var rm = el('button', 'rm');
      rm.type = 'button'; rm.textContent = '×';
      rm.setAttribute('aria-label', it.n + ' 빼기');
      rm.addEventListener('click', function () { removeCart(id); });
      li.appendChild(rm);
      ul.appendChild(li);
    });
    $('#cartN').textContent = ids.length + ' 품목';
    $('#cartSum').textContent = won(sum);
    var q = encodeURIComponent(ids.length ? item(ids[0]).n : '비상대피가방');
    $('#cartNaver').href = 'https://search.shopping.naver.com/search/all?query=' + q;
    $('#cartCoupang').href = 'https://www.coupang.com/np/search?q=' + q;
  }

  /* ============================== 05 대피 카드 ============================== */

  var FIELDS = ['addr', 'shelter', 'route', 'meet', 'contact', 'med'];

  function bindCard() {
    FIELDS.forEach(function (f) {
      var inp = document.getElementById('f-' + f);
      if (S.card[f]) inp.value = S.card[f];
      inp.addEventListener('input', function () { S.card[f] = inp.value; save(); renderSheet(); });
    });
  }
  function fillCardInputs() {
    FIELDS.forEach(function (f) { document.getElementById('f-' + f).value = S.card[f] || ''; });
  }

  function renderSheet() {
    var d = dis(S.disaster);
    var c = S.card;
    var v = function (k, ph) { return c[k] ? esc(c[k]) : '<span style="color:#9AA3AE">' + ph + '</span>'; };
    var cart = Object.keys(S.cart).slice(0, 12).map(function (id) {
      var it = item(id); return it ? esc(it.n) + ' ×' + S.cart[id] : '';
    }).filter(Boolean);
    var short = function (a) { return a.slice(0, 3).map(function (x) { return '<li>' + esc(x.t) + '</li>'; }).join(''); };

    $('#sheet').innerHTML =
      '<div class="sheadr"><h3>비상 대피 카드</h3><div class="sm">MANUAL MODE · 수동 모드 포털<br>' + d.code + ' ' + esc(d.name) + '</div></div>' +
      '<div class="srow"><div class="sl">우리 집</div><div class="sv">' + v('addr', '주소를 적어 두십시오') + '</div></div>' +
      '<div class="srow"><div class="sl">대피소</div><div class="sv">' + v('shelter', '국민재난안전포털에서 조회해 적기') + '</div></div>' +
      '<div class="srow"><div class="sl">걸어가는 길</div><div class="sv">' + v('route', '엘리베이터 없이 갈 수 있는 경로') + '</div></div>' +
      '<div class="srow"><div class="sl">집결지</div><div class="sv">' + v('meet', '1차 근거리 / 2차 원거리') + '</div></div>' +
      '<div class="srow"><div class="sl">연락처</div><div class="sv">' + v('contact', '가족·친척 번호') + '</div></div>' +
      '<div class="srow"><div class="sl">특이사항</div><div class="sv">' + v('med', '지병 · 상비약 · 반려동물') + '</div></div>' +
      '<div class="sgrid"><div><h4>지금 즉시</h4><ol>' + short(d.now) + '</ol>' +
      '<h4 style="margin-top:12px">5분 후</h4><ol>' + short(d.m5) + '</ol></div>' +
      '<div><h4>1시간 후</h4><ol>' + short(d.h1) + '</ol>' +
      '<h4 style="margin-top:12px">절대 금지</h4><ul>' +
      d.donts.slice(0, 3).map(function (x) { return '<li>' + esc(x.b) + '</li>'; }).join('') + '</ul></div></div>' +
      (cart.length ? '<div style="margin-top:14px"><h4>키트 점검 목록</h4><div style="font-size:11.5px;color:#2A313A">' + cart.join(' · ') + '</div></div>' : '') +
      '<div class="scall">119 화재·구조 · 112 범죄 · 1339 질병 · 131 기상</div>' +
      '<div class="sfoot">네트워크가 끊긴 상황을 위한 종이 사본입니다. 키트 바깥 주머니와 현관에 각각 두십시오. ' +
      '실제 재난 시에는 119 신고와 공식 재난 지침이 항상 우선합니다. 해커톤 시연용 교육 자료.</div>' +
      '<div class="cut">— 접는 선 —</div>';
  }


  /* ============================== 이벤트 결선 ============================== */

  document.querySelectorAll('nav.tabs button').forEach(function (b) {
    b.addEventListener('click', function () {
      setTab(b.dataset.tab);
      window.scrollTo({ top: 0, behavior: 'auto' });
    });
  });

  $('#quizDone').addEventListener('click', function () {
    score();
    $('#quizResult').scrollIntoView({ behavior: smooth, block: 'start' });
  });
  $('#quizReset').addEventListener('click', function () {
    S.quiz = {}; save();
    document.querySelectorAll('#quizlist input').forEach(function (i) { i.checked = false; });
    score();
  });

  $('#invPreset').addEventListener('click', function () {
    S.inv = {};
    PRESET.forEach(function (id) { S.inv[id] = true; });
    save(); renderMats(); matchAll();
  });
  $('#invClear').addEventListener('click', function () {
    S.inv = {}; save(); renderMats(); matchAll();
  });

  $('#cartClear').addEventListener('click', function () {
    S.cart = {}; save(); renderCart(); renderItems(); renderSheet();
  });
  $('#cartPrint').addEventListener('click', function () { printMode('kit'); });
  $('#shareKit').addEventListener('click', function () {
    var btn = $('#shareKit');
    var lines = Object.keys(S.cart).map(function (id) {
      var it = item(id);
      return it ? '- ' + it.n + ' ×' + S.cart[id] + ' (' + won(it.p) + ')' : '';
    }).filter(Boolean);
    var txt = '[수동 모드] 내 키트 구성 · ' + dis(S.disaster).name + '\n' + lines.join('\n');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(
        function () { btn.textContent = '복사됨'; setTimeout(function () { btn.textContent = '내 키트 구성 복사'; }, 1800); },
        function () { btn.textContent = '복사 실패 — 목록을 인쇄하십시오'; }
      );
    } else {
      btn.textContent = '복사 미지원 — 목록을 인쇄하십시오';
    }
  });

  $('#printCard').addEventListener('click', function () { printMode('card'); });
  $('#demoCard').addEventListener('click', function () {
    S.card = {
      addr: '○○시 ○○구 ○○로 12, 304호 (예시)',
      shelter: '○○초등학교 지하주차장 / ○○로 45 (예시 — 실제 주소는 직접 조회)',
      route: '현관 → 비상계단으로 1층 → 큰길 좌회전 300m → ○○초등학교 정문',
      meet: '1차: 아파트 놀이터 / 2차: ○○역 2번 출구',
      contact: '어머니 010-0000-0000 · 이모 010-0000-0000',
      med: '천식(흡입기 보유) · 반려견 1마리 · 고령자 1인'
    };
    save(); fillCardInputs(); renderSheet();
  });


  /* ============================== PDF · 인쇄 ============================== */
  /* 재난 때는 이 페이지가 열리지 않는다는 전제. 모든 화면은 종이로 떨어져야 한다.
     브라우저 인쇄 대화상자의 "PDF로 저장"을 거친다 — 외부 라이브러리 없이
     한글이 깨지지 않고, 레이아웃을 CSS로 그대로 통제할 수 있는 유일한 경로. */

  var PDFMODES = {
    all:    { label: '전체 매뉴얼',        open: true  },
    action: { label: '행동수칙 1장',       open: false },
    guides: { label: '제작 가이드 10종',   open: true  },
    kit:    { label: '키트 구매 목록',     open: false },
    card:   { label: '비상 대피 카드',     open: false }
  };

  function printMode(mode) {
    var cfg = PDFMODES[mode] || PDFMODES.all;
    var reopened = [];
    if (cfg.open) {
      document.querySelectorAll('details.guide').forEach(function (g) {
        if (!g.open) { g.open = true; reopened.push(g); }
      });
    }
    document.body.dataset.print = mode;
    var restore = function () {
      document.body.dataset.print = '';
      reopened.forEach(function (g) { g.open = false; });
      reopened = [];
    };
    window.addEventListener('afterprint', function once() {
      window.removeEventListener('afterprint', once);
      restore();
    });
    window.setTimeout(function () {
      try { window.print(); } catch (e) { restore(); }
    }, 60);
    hint(cfg.label);
  }

  function hint(what) {
    var h = $('#pdfHint');
    if (!h) return;
    h.textContent = what + ' — 인쇄 창의 "대상"에서 PDF로 저장을 선택하십시오.';
    h.hidden = false;
    window.clearTimeout(hint._t);
    hint._t = window.setTimeout(function () { h.hidden = true; }, 7000);
  }

  document.querySelectorAll('[data-pdf]').forEach(function (b) {
    b.addEventListener('click', function () { printMode(b.dataset.pdf); });
  });

  /* ============================== 부팅 ============================== */

  load();
  renderResponse();
  renderPrinciples();
  renderChoice();
  renderQuiz();
  score();
  renderAction();
  renderMats();
  matchAll();
  renderKits();
  renderFilter();
  renderItems();
  renderCart();
  bindCard();
  renderSheet();

  /* game.js(60초 훈련 · 72시간 시뮬레이터)가 쓰는 API */
  window.BLACKOUT_APP = {
    state: S, save: save, setTab: setTab, goTab: goTab,
    addCart: addCart, openGuide: openGuide,
    item: item, recipe: recipe, dis: dis, evalRecipe: evalRecipe,
    won: won, esc: esc, el: el,
    refresh: function () { renderCart(); renderItems(); renderSheet(); matchAll(); renderKits(); }
  };

  setTab('home');
})();
