/* ============================================================
   블랙아웃 (BLACKOUT) — 캐릭터 · 60초 훈련 · 72시간 시뮬레이터
   콘텐츠는 scenario.js, 재난 수칙·품목은 data.js, 나머지 화면은 app.js.
   app.js가 window.BLACKOUT_APP 으로 열어 둔 API만 사용한다.
   ============================================================ */

(function () {
  'use strict';

  var SC = window.BLACKOUT_SCENARIO;
  var APP = window.BLACKOUT_APP;
  if (!SC || !APP) { console.error('[블랙아웃] scenario.js / app.js 로드 순서를 확인하세요.'); return; }

  var CH = SC.CHARACTER, DRILL = SC.DRILL, SIM = SC.SIM, SCAV = SC.SCAV;
  var S = APP.state, el = APP.el, esc = APP.esc;
  var $ = function (s) { return document.querySelector(s); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };

  /* ====================== 안내 문구 ======================
     캐릭터 말풍선을 없애고, 각 게임 화면의 안내 줄에 바로 쓴다. */

  function tip(text) {
    var line = document.querySelector('.panel.active .tipline') || document.getElementById('svTip');
    if (!line) return;
    line.textContent = text;
    line.hidden = false;
    window.clearTimeout(tip._t);
    tip._t = window.setTimeout(function () { line.hidden = true; }, 5200);
  }
  function say(text) { tip(text); }

  /* ====================== 60초 훈련 ====================== */

  var D = { i: 0, score: 0, log: [], timer: null, left: 60, running: false };
  var dStage = $('#dStage');
  var CIRC = 2 * Math.PI * 20;

  function dReset() {
    window.clearInterval(D.timer);
    D = { i: 0, score: 0, log: [], timer: null, left: 60, running: false };
    dPaint();
  }

  function dPaint() {
    $('#dScore').textContent = D.score;
    $('#dOf').textContent = '/ ' + DRILL.length + ' 정답';
    $('#dBar').style.width = Math.round(D.score / DRILL.length * 100) + '%';
    var note = $('#dNote');
    if (!D.running && D.i === 0) note.textContent = '아직 훈련 전입니다. 60초는 생각보다 짧습니다.';
    else if (D.i >= DRILL.length) note.textContent = '훈련 완료. 아래 정밀 진단까지 하면 내 집 상태까지 나옵니다.';
    else note.textContent = D.i + '번째 상황까지 진행했습니다.';

    var log = $('#dLog');
    log.innerHTML = '<div class="label">오답 기록</div>';
    if (!D.log.length) {
      log.appendChild(el('p', 'note', '틀린 상황이 여기 쌓이고, 해당 수칙·제작 가이드로 바로 넘어갈 수 있습니다.'));
      log.querySelector('.note').style.marginTop = '8px';
      return;
    }
    D.log.forEach(function (x) {
      var row = el('div', 'dlogitem', '<span class="tag bad">오답</span><span class="lt">' + esc(x.t) + ' — ' + esc(x.pick) + '</span>');
      var b = el('button', 'btn sm ghost');
      b.type = 'button';
      b.textContent = '보기';
      b.addEventListener('click', function () {
        if (x.go && x.go.guide) APP.openGuide(x.go.guide);
        else APP.goTab((x.go && x.go.tab) || 'action');
      });
      row.appendChild(b);
      log.appendChild(row);
    });
  }

  function dRing(left) {
    var off = CIRC * (1 - left / 60);
    var ring = $('#dRing');
    if (!ring) return;
    ring.querySelector('.rfg').style.strokeDashoffset = off;
    ring.classList.toggle('hot', left <= 15);
    var sec = $('#dSec');
    if (sec) sec.textContent = left;
  }

  function dQuestion() {
    if (D.i >= DRILL.length) return dEnd();
    var q = DRILL[D.i];
    D.left = 60;
    D.running = true;

    dStage.innerHTML =
      '<div class="dq">' +
        '<div class="dqtop">' +
          '<div class="ringwrap">' +
            '<svg class="ring" id="dRing" viewBox="0 0 46 46" aria-hidden="true">' +
              '<circle class="rbg" cx="23" cy="23" r="20"></circle>' +
              '<circle class="rfg" cx="23" cy="23" r="20" stroke-dasharray="' + CIRC + '" stroke-dashoffset="0"></circle>' +
            '</svg>' +
            '<span class="rsec" id="dSec">60</span>' +
          '</div>' +
          '<span class="dtag">' + esc(q.t) + '</span>' +
          '<span class="dnum">' + (D.i + 1) + ' / ' + DRILL.length + '</span>' +
        '</div>' +
        '<h3>' + esc(q.q) + '</h3>' +
        '<div class="dopts" id="dOpts"></div>' +
      '</div>';

    var wrap = $('#dOpts');
    q.opts.forEach(function (o, j) {
      var b = el('button', 'dopt', '<span class="ok">' + String.fromCharCode(9312 + j) + '</span><span>' + esc(o.t) + '</span>');
      b.type = 'button';
      b.addEventListener('click', function () { dAnswer(j); });
      wrap.appendChild(b);
    });

    say(pick(['상황 들어갑니다. 침착하게요.', '60초예요. 먼저 뭘 할까요?', '지금 판단해 봐요.']), 'warn', 1500);

    window.clearInterval(D.timer);
    D.timer = window.setInterval(function () {
      D.left--;
      dRing(D.left);
      if (D.left <= 0) { window.clearInterval(D.timer); dAnswer(-1); }
    }, 1000);
  }

  function dAnswer(j) {
    window.clearInterval(D.timer);
    if (!D.running) return;
    D.running = false;
    var q = DRILL[D.i];
    var timeout = j < 0;
    var o = timeout ? null : q.opts[j];
    var ok = !!(o && o.ok);
    var correct = q.opts.filter(function (x) { return x.ok; })[0];

    if (ok) D.score++;
    else D.log.push({ t: q.t, pick: timeout ? '시간 초과' : o.t, go: q.go });

    /* 4축 진단 점수에 반영 — 맞히면 해당 축 2점 */
    if (q.ax) {
      S.drill = S.drill || {};
      S.drill[D.i] = ok ? 2 : 0;
      APP.save();
    }

    var fxClass = ok ? 'ok' : (o && o.fx ? o.fx : 'smoke');
    var why = timeout
      ? '60초를 넘겼습니다. 실제 상황에서 망설인 60초는 불이 번지는 60초입니다. 정답은 "' + correct.t + '" 입니다. ' + correct.why
      : o.why;

    dStage.innerHTML =
      '<div class="dres">' +
        '<div class="rv ' + (ok ? 'good' : 'bad') + '">' +
          '<b>' + (ok ? '정답' : (timeout ? '시간 초과' : '오답')) + '</b>' +
          '<span class="tag">' + esc(q.t) + '</span>' +
          (ok ? '' : '<span class="tag ok">정답: ' + esc(correct.t) + '</span>') +
        '</div>' +
        '<p class="why">' + esc(why) + '</p>' +
        '<div class="rbtns" id="dBtns"></div>' +
      '</div>' +
      (reduce ? '' : '<span class="fx ' + fxClass + '"></span>');

    var btns = $('#dBtns');
    var next = el('button', 'btn primary');
    next.type = 'button';
    next.textContent = D.i + 1 >= DRILL.length ? '결과 보기' : '다음 상황';
    next.addEventListener('click', function () { D.i++; dPaint(); dQuestion(); });
    btns.appendChild(next);

    if (!ok && q.go) {
      var go = el('button', 'btn ghost');
      go.type = 'button';
      go.textContent = q.go.guide ? '제작 가이드 보기' : '행동수칙 보기';
      go.addEventListener('click', function () {
        if (q.go.guide) APP.openGuide(q.go.guide); else APP.goTab(q.go.tab);
      });
      btns.appendChild(go);
    }

    say(ok ? pick(CH.react.good) : pick(CH.react.bad), ok ? 'good' : 'bad', 3000);
    dPaint();
  }

  function dEnd() {
    var pct = Math.round(D.score / DRILL.length * 100);
    var grade = pct >= 84 ? '상황 판단 양호' : pct >= 50 ? '절반은 위험한 선택' : '지금 상태로는 위험';
    dStage.innerHTML =
      '<div class="dres">' +
        '<div class="rv ' + (pct >= 84 ? 'good' : 'bad') + '">' +
          '<b>' + D.score + ' / ' + DRILL.length + ' 정답</b><span class="tag warn">' + grade + '</span>' +
        '</div>' +
        '<p class="why">' +
          (D.log.length
            ? '틀린 상황 ' + D.log.length + '건이 오른쪽에 기록됐습니다. 그 수칙만 다시 읽으면 됩니다. 아래 정밀 진단까지 하면 내 집의 준비 상태까지 함께 나옵니다.'
            : '전부 맞혔습니다. 지식은 충분하니 이제 물건과 종이를 갖추는 문제입니다. 아래 정밀 진단으로 내 집 상태를 확인하십시오.') +
        '</p><div class="rbtns" id="dBtns"></div></div>';
    var btns = $('#dBtns');
    var again = el('button', 'btn');
    again.type = 'button'; again.textContent = '다시 훈련';
    again.addEventListener('click', function () { dReset(); dQuestion(); });
    var sim = el('button', 'btn primary');
    sim.type = 'button'; sim.textContent = '72시간 버티기 해 보기';
    sim.addEventListener('click', function () { APP.goTab('sim'); });
    btns.appendChild(sim); btns.appendChild(again);
    say(pick(CH.react.end), 'good', 3200);
    dPaint();
  }

  $('#dStart').addEventListener('click', function () { dReset(); dQuestion(); });

  /* ====================== 60초 대피 — three.js 3D ======================
     진짜 3D(WebGL). 평면 좌표(SCAV.zones, px)를 월드 좌표로 환산해 쓴다.
       worldX = (px - 480) / 40      worldZ = (py - 340) / 40
     조작: WASD / 방향키 이동, Q 버리기, F 대피. 물건에 닿으면 자동 수집.
     ===================================================================== */

  var T = window.THREE;
  var U = 40;                                  // 1 월드 유닛 = 평면 40px
  var W2 = SCAV.world.w / U, H2 = SCAV.world.h / U;   // 24 x 17
  var HALFW = W2 / 2, HALFH = H2 / 2;

  function toWorld(px, py) { return { x: (px - SCAV.world.w / 2) / U, z: (py - SCAV.world.h / 2) / U }; }

  var B = {
    bag: {}, slots: 0, left: SCAV.sec, running: false, done: false, start: null, exited: false,
    px: 0, pz: HALFH - 1.3, vx: 0, vz: 0, face: 1,
    items: [], keys: {}, raf: null, last: 0,
    scene: null, cam: null, ren: null, player: null, itemGroup: null, host: null, doorMesh: null
  };

  var SVCIRC = 2 * Math.PI * 31;
  var WALLS = [];   // 충돌용 AABB {x1,z1,x2,z2}

  /* ---------- 물건 배치 (방 구역 안 격자) ---------- */
  function svLayout() {
    var list = [];
    SCAV.rooms.forEach(function (room) {
      var z = SCAV.zones.filter(function (x) { return x.id === room.id; })[0];
      if (!z) return;
      var n = room.items.length;
      var cols = Math.ceil(Math.sqrt(n * 1.5));
      var rows = Math.ceil(n / cols);
      var padX = 64, padY = 74;
      var stepX = (z.w - padX * 2) / Math.max(1, cols - 1);
      var stepY = (z.h - padY * 2) / Math.max(1, rows - 1);
      room.items.forEach(function (it, i) {
        var c = i % cols, r = Math.floor(i / cols);
        var p = toWorld(z.x + padX + c * (cols > 1 ? stepX : 0), z.y + padY + r * (rows > 1 ? stepY : 0));
        list.push({ it: it, room: room, x: p.x, z: p.z, mesh: null, label: null, taken: false });
      });
    });
    return list;
  }

  /* ---------- 라벨 스프라이트 (한글 캔버스 텍스처) ---------- */
  function makeLabel(text, sub, hot) {
    var c = document.createElement('canvas');
    c.width = 256; c.height = 72;
    var g = c.getContext('2d');
    g.fillStyle = 'rgba(16,22,29,.86)';
    g.strokeStyle = hot ? '#FFB01F' : '#3A4656';
    g.lineWidth = 3;
    g.beginPath();
    if (g.roundRect) g.roundRect(3, 3, 250, 66, 8); else g.rect(3, 3, 250, 66);
    g.fill(); g.stroke();
    g.textAlign = 'center';
    g.fillStyle = hot ? '#FFCF72' : '#E8EDF3';
    g.font = '600 26px "IBM Plex Sans KR", "Malgun Gothic", sans-serif';
    g.fillText(text, 128, 33, 236);
    g.fillStyle = '#8FA0B3';
    g.font = '400 19px "IBM Plex Mono", monospace';
    g.fillText(sub, 128, 58, 236);
    var tex = new T.CanvasTexture(c);
    tex.anisotropy = 2;
    var sp = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    sp.scale.set(2.1, 0.59, 1);
    return sp;
  }

  function addWall(x1, z1, x2, z2, h) {
    var w = Math.abs(x2 - x1), d = Math.abs(z2 - z1);
    var m = new T.Mesh(
      new T.BoxGeometry(w, h || 1.5, d),
      new T.MeshStandardMaterial({ color: 0x222c38, roughness: .9, metalness: .05 })
    );
    m.position.set((x1 + x2) / 2, (h || 1.5) / 2, (z1 + z2) / 2);
    B.scene.add(m);
    WALLS.push({ x1: Math.min(x1, x2), x2: Math.max(x1, x2), z1: Math.min(z1, z2), z2: Math.max(z1, z2) });
    return m;
  }

  /* ---------- 장면 ---------- */
  function buildScene() {
    WALLS = [];
    B.scene = new T.Scene();
    B.scene.background = new T.Color(0x0a0e13);
    B.scene.fog = new T.Fog(0x0a0e13, 20, 46);

    B.cam = new T.PerspectiveCamera(50, 16 / 9, .1, 200);
    B.cam.position.set(0, 10, HALFH + 10);
    B.cam.lookAt(0, .8, 0);

    B.scene.add(new T.HemisphereLight(0xcfe3ff, 0x1a222c, .85));
    var dir = new T.DirectionalLight(0xffd8a4, .9);
    dir.position.set(7, 14, 5);
    B.scene.add(dir);
    var amber = new T.PointLight(0xffb01f, .6, 16);
    amber.position.set(0, 3.4, HALFH - 1);
    B.scene.add(amber);

    /* 바닥 */
    var floor = new T.Mesh(
      new T.PlaneGeometry(W2, H2),
      new T.MeshStandardMaterial({ color: 0x151c24, roughness: .98 })
    );
    floor.rotation.x = -Math.PI / 2;
    B.scene.add(floor);
    var grid = new T.GridHelper(Math.max(W2, H2), Math.max(W2, H2), 0x2b3645, 0x1d2630);
    grid.position.y = .01;
    B.scene.add(grid);

    /* 외벽 — 아래쪽 가운데는 현관으로 비운다 */
    var t = .3;
    addWall(-HALFW, -HALFH, HALFW, -HALFH + t, 1.9);          // 위
    addWall(-HALFW, -HALFH, -HALFW + t, HALFH, 1.9);          // 왼
    addWall(HALFW - t, -HALFH, HALFW, HALFH, 1.9);            // 오른
    addWall(-HALFW, HALFH - t, -1.6, HALFH, 1.9);             // 아래 왼
    addWall(1.6, HALFH - t, HALFW, HALFH, 1.9);               // 아래 오른

    /* 내부 칸막이 — 십자, 가운데 통로 */
    addWall(-t / 2, -HALFH + t, t / 2, -1.8, 1.3);
    addWall(-t / 2, 1.8, t / 2, 5.4, 1.3);        // 현관 앞(z>5.4)은 통로로 비운다
    addWall(-HALFW + t, -t / 2, -2.4, t / 2, 1.3);
    addWall(2.4, -t / 2, HALFW - t, t / 2, 1.3);

    /* 방 이름 */
    SCAV.rooms.forEach(function (room) {
      var z = SCAV.zones.filter(function (x) { return x.id === room.id; })[0];
      if (!z) return;
      var p = toWorld(z.x + z.w / 2, z.y + 34);
      var sp = makeLabel(room.n, '', false);
      sp.scale.set(2.6, .73, 1);
      sp.material.opacity = .5;
      sp.position.set(p.x, 2.5, p.z);
      B.scene.add(sp);
    });

    /* 현관 */
    var dp = toWorld(SCAV.door.x, SCAV.door.y);
    B.doorMesh = new T.Mesh(
      new T.CircleGeometry(1.5, 32),
      new T.MeshBasicMaterial({ color: 0xffb01f, transparent: true, opacity: .22 })
    );
    B.doorMesh.rotation.x = -Math.PI / 2;
    B.doorMesh.position.set(dp.x, .02, dp.z);
    B.scene.add(B.doorMesh);
    var dl = makeLabel('현관 · 대피', 'F', true);
    dl.position.set(dp.x, 1.5, dp.z);
    B.scene.add(dl);

    /* 물건 */
    B.itemGroup = new T.Group();
    B.scene.add(B.itemGroup);
    B.items.forEach(function (o) { spawnItem(o); });

    /* 플레이어 */
    B.player = new T.Group();
    var bodyMat = new T.MeshStandardMaterial({ color: 0x2c3a4c, roughness: .6 });
    var body = new T.Mesh(new T.CylinderGeometry(.33, .38, .9, 12), bodyMat);
    body.position.y = .62;
    var head = new T.Mesh(new T.SphereGeometry(.3, 16, 12), new T.MeshStandardMaterial({ color: 0xffe2c4, roughness: .7 }));
    head.position.y = 1.32;
    var helmet = new T.Mesh(new T.SphereGeometry(.33, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      new T.MeshStandardMaterial({ color: 0xffb01f, roughness: .4, metalness: .2 }));
    helmet.position.y = 1.36;
    var bag = new T.Mesh(new T.BoxGeometry(.5, .5, .26), new T.MeshStandardMaterial({ color: 0x3c4a5e, roughness: .8 }));
    bag.position.set(0, .78, -.34);
    B.player.add(body, head, helmet, bag);
    B.player.position.set(B.px, 0, B.pz);
    B.scene.add(B.player);

    /* character.png 가 있으면 그 그림을 빌보드로 세운다 */
    new T.TextureLoader().load(CH.img, function (tex) {
      var sp = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true }));
      var ar = (tex.image && tex.image.width && tex.image.height) ? tex.image.width / tex.image.height : .7;
      sp.scale.set(1.9 * ar, 1.9, 1);
      sp.position.y = .95;
      B.player.clear ? B.player.clear() : B.player.children.slice().forEach(function (c) { B.player.remove(c); });
      B.player.add(sp);
    }, undefined, function () { /* 파일 없음 — 기본 모델 유지 */ });

    /* 렌더러 */
    B.ren = new T.WebGLRenderer({ antialias: true });
    B.ren.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    B.host.appendChild(B.ren.domElement);
    fit3d();
  }

  function spawnItem(o) {
    var must = SCAV.must.indexOf(o.it.id) >= 0;
    var bulk = o.it.slot >= 3;
    var h = bulk ? .72 : .46;
    var mat = new T.MeshStandardMaterial({
      color: must ? 0xffb01f : (bulk ? 0x5a95ff : 0x6e7e91),
      roughness: .55, metalness: .15,
      emissive: must ? 0x3a2600 : 0x000000
    });
    var m = new T.Mesh(new T.BoxGeometry(bulk ? .72 : .5, h, bulk ? .52 : .42), mat);
    m.position.set(o.x, h / 2, o.z);
    m.rotation.y = (o.x + o.z) % 1;
    B.itemGroup.add(m);
    var lb = makeLabel(o.it.n, o.it.slot + '칸', must);
    lb.position.set(o.x, h + .62, o.z);
    B.itemGroup.add(lb);
    o.mesh = m; o.label = lb; o.taken = false;
  }

  function removeItem(o) {
    if (o.mesh) { B.itemGroup.remove(o.mesh); o.mesh.geometry.dispose(); o.mesh.material.dispose(); o.mesh = null; }
    if (o.label) { B.itemGroup.remove(o.label); o.label.material.map.dispose(); o.label.material.dispose(); o.label = null; }
  }

  function fit3d() {
    if (!B.ren || !B.host) return;
    var w = B.host.clientWidth, h = B.host.clientHeight;
    if (!w || !h) return;
    B.ren.setSize(w, h, false);
    B.cam.aspect = w / h;
    B.cam.updateProjectionMatrix();
  }
  window.addEventListener('resize', fit3d);

  /* ---------- HUD ---------- */
  function svPaint() {
    var sec = document.getElementById('svSec');
    if (sec) sec.textContent = Math.max(0, Math.ceil(B.left));
    var ring = document.getElementById('svRing');
    if (ring) {
      var fg = ring.querySelector('.rfg');
      fg.setAttribute('stroke-dasharray', SVCIRC);
      fg.style.strokeDashoffset = SVCIRC * (1 - Math.max(0, B.left) / SCAV.sec);
    }
    var scav = document.getElementById('scav');
    if (scav) scav.classList.toggle('panic', B.running && B.left <= 10);

    document.getElementById('svSlots').textContent = B.slots + ' / ' + SCAV.slots;
    var bar = document.getElementById('svSlotBar');
    bar.innerHTML = '';
    for (var i = 0; i < SCAV.slots; i++) {
      var s = el('i');
      if (i < B.slots) s.className = 'on';
      bar.appendChild(s);
    }
    var list = document.getElementById('svBag');
    var ids = Object.keys(B.bag);
    list.innerHTML = '';
    if (!ids.length) { list.appendChild(el('li', 'note', '아직 비어 있습니다.')); return; }
    ids.forEach(function (id) {
      var li = el('li', '', '<b>' + esc(B.bag[id].n) + '</b><span>' + B.bag[id].slot + '칸</span>');
      if (B.running) {
        var d = el('button', 'dropb');
        d.type = 'button';
        d.textContent = '버리기';
        d.setAttribute('aria-label', B.bag[id].n + ' 버리기');
        d.addEventListener('click', function () { svDrop(id); });
        li.appendChild(d);
      }
      list.appendChild(li);
    });
  }

  /* ---------- 수집 / 버리기 ---------- */
  function svTake(o) {
    var it = o.it;
    if (B.bag[it.id]) return;
    if (B.slots + it.slot > SCAV.slots) {
      tip('가방이 꽉 찼습니다 — 남은 칸 ' + (SCAV.slots - B.slots) + '개. Q 로 버리거나 F 로 대피하십시오.');
      return;
    }
    B.bag[it.id] = it;
    B.slots += it.slot;
    o.taken = true;
    removeItem(o);
    tip('담음: ' + it.n + ' (' + it.slot + '칸) · 남은 칸 ' + (SCAV.slots - B.slots));
    svPaint();
  }

  /* 가방에서 빼서 발 앞에 내려놓는다 — 다시 주울 수 있다 */
  function svDrop(id) {
    if (!B.running) return;
    var ids = id ? [id] : Object.keys(B.bag);
    if (!ids.length) { tip('가방이 비어 있습니다.'); return; }
    var target = id || ids[ids.length - 1];   // Q 는 마지막에 담은 것부터
    var it = B.bag[target];
    if (!it) return;
    delete B.bag[target];
    B.slots -= it.slot;

    var o = null;
    for (var i = 0; i < B.items.length; i++) { if (B.items[i].it.id === target) { o = B.items[i]; break; } }
    if (o) {
      o.x = B.px + B.face * .9;
      o.z = B.pz + .5;
      spawnItem(o);
    }
    tip('버림: ' + it.n + ' (' + it.slot + '칸 비움) · 발 앞에 두었습니다');
    svPaint();
  }

  /* ---------- 충돌 ---------- */
  function blocked(x, z) {
    var r = .34;
    for (var i = 0; i < WALLS.length; i++) {
      var w = WALLS[i];
      if (x + r > w.x1 && x - r < w.x2 && z + r > w.z1 && z - r < w.z2) return true;
    }
    return false;
  }

  /* ---------- 루프 ---------- */
  function svTick(ts) {
    if (!B.running) return;
    if (!B.last) B.last = ts;
    var dt = Math.min(.05, (ts - B.last) / 1000);
    B.last = ts;

    B.left -= dt;
    if (B.left <= 0) { B.left = 0; svPaint(); return svEnd(false); }

    /* WASD */
    var k = B.keys;
    var ix = (k.d ? 1 : 0) - (k.a ? 1 : 0);
    var iz = (k.s ? 1 : 0) - (k.w ? 1 : 0);
    var len = Math.sqrt(ix * ix + iz * iz) || 1;
    var speed = (SCAV.speed / U) * (1 - Math.min(.35, B.slots / SCAV.slots * .35));  // 무거우면 느려진다
    var nx = B.px + (ix / len) * speed * dt;
    var nz = B.pz + (iz / len) * speed * dt;

    if (ix || iz) {
      var stuck = blocked(B.px, B.pz);        // 벽에 끼었으면 그냥 통과시켜 탈출
      if (stuck) { B.px = nx; B.pz = nz; }
      else {
        if (!blocked(nx, B.pz)) B.px = nx;
        if (!blocked(B.px, nz)) B.pz = nz;
      }
      B.px = Math.max(-HALFW + .5, Math.min(HALFW - .5, B.px));
      B.pz = Math.max(-HALFH + .5, Math.min(HALFH + 1.2, B.pz));
      if (ix) B.face = ix > 0 ? 1 : -1;
      B.player.rotation.y = Math.atan2(ix, iz) + Math.PI;
      B.player.position.y = Math.abs(Math.sin(ts / 90)) * .07;
    } else {
      B.player.position.y = 0;
    }
    B.player.position.x = B.px;
    B.player.position.z = B.pz;

    /* 카메라 추적 */
    var tx = B.px * .55, tz = B.pz + 9.4;
    B.cam.position.x += (tx - B.cam.position.x) * Math.min(1, dt * 4);
    B.cam.position.z += (tz - B.cam.position.z) * Math.min(1, dt * 4);
    B.cam.position.y = 9.4;
    B.cam.lookAt(B.px * .7, .9, B.pz - 1.6);

    /* 수집 판정 + 가까운 물건 강조 */
    var reach = SCAV.reach / U;
    B.items.forEach(function (o) {
      if (!o.mesh) return;
      var dx = o.x - B.px, dz = o.z - B.pz;
      var d = Math.sqrt(dx * dx + dz * dz);
      var near = d < reach * 2.4;
      o.mesh.material.emissiveIntensity = 1;
      o.mesh.material.emissive.setHex(near ? 0x6a4a00 : (SCAV.must.indexOf(o.it.id) >= 0 ? 0x3a2600 : 0x000000));
      o.mesh.rotation.y += near ? dt * 2.2 : dt * .25;
      o.mesh.position.y = (o.it.slot >= 3 ? .36 : .23) + (near ? Math.abs(Math.sin(ts / 220)) * .12 : 0);
      if (o.label) o.label.material.opacity = near ? 1 : .72;
      if (d < reach) svTake(o);
    });

    /* 현관 */
    var dp = toWorld(SCAV.door.x, SCAV.door.y);
    var dd = Math.sqrt((dp.x - B.px) * (dp.x - B.px) + (dp.z - B.pz) * (dp.z - B.pz));
    B.doorMesh.material.opacity = dd < 2.2 ? .5 : .22;
    var bagN = Object.keys(B.bag).length;
    if (dd < 1.6 && !bagN) tip('가방이 비어 있습니다. 물건을 챙긴 뒤 F 로 대피하십시오.');
    if (dd < 1.5 && ((B.keys.f && bagN) || B.slots >= SCAV.slots)) { B.exited = true; return svEnd(true); }

    B.ren.render(B.scene, B.cam);
    svPaint();
    B.raf = window.requestAnimationFrame(svTick);
  }

  /* ---------- 시작 / 종료 ---------- */
  /* 한글 입력 모드에서도 같은 자리의 키가 먹어야 하므로 ev.code 로 판정한다.
     (한글 모드에서 ev.key 는 'w' 가 아니라 'ㅈ' 로 들어온다) */
  var KEYMAP = {
    KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd', KeyQ: 'q', KeyF: 'f',
    ArrowUp: 'w', ArrowLeft: 'a', ArrowDown: 's', ArrowRight: 'd',
    Space: 'f', Enter: 'f'
  };
  function onKey(ev) {
    if (!B.running) return;
    var k = KEYMAP[ev.code];
    if (!k && ev.key) {                       // code 를 못 주는 환경 대비
      var kk = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
      if ('wasdqf'.indexOf(kk) >= 0) k = kk;
    }
    if (!k) return;
    ev.preventDefault();
    if (ev.type === 'keydown') {
      if (!B.keys[k] && k === 'q') svDrop(null);
      B.keys[k] = true;
    } else {
      B.keys[k] = false;
    }
  }

  function svTeardown() {
    window.cancelAnimationFrame(B.raf);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('keyup', onKey);
    if (B.ren) { B.ren.dispose(); if (B.ren.domElement && B.ren.domElement.parentNode) B.ren.domElement.parentNode.removeChild(B.ren.domElement); }
    B.ren = null; B.scene = null;
  }

  function svStart() {
    if (!T) {
      document.getElementById('svStage').innerHTML =
        '<div class="dstart"><div class="dsn">3D 로드 실패</div><h3>WebGL 라이브러리를 불러오지 못했습니다</h3>' +
        '<p>네트워크가 차단된 환경일 수 있습니다. 페이지를 새로 고쳐 주십시오. ' +
        '다른 기능(행동수칙·제작 가이드·PDF 저장)은 그대로 작동합니다.</p></div>';
      return;
    }
    svTeardown();
    B.bag = {}; B.slots = 0; B.left = SCAV.sec;
    B.done = false; B.exited = false; B.keys = {}; B.last = 0;
    B.px = 0; B.pz = HALFH - 1.3;
    B.items = svLayout();

    document.getElementById('svStage').innerHTML =
      '<div class="stage3d" id="sv3d"></div>' +
      '<div class="scavbar">' +
        '<p class="note"><b class="kbd">W A S D</b> 이동 · <b class="kbd">Q</b> 마지막 물건 버리기 · ' +
        '<b class="kbd">F</b> 현관에서 대피 · 물건에 닿으면 자동 수집</p>' +
        '<button class="btn" id="svLeave">여기서 대피</button>' +
      '</div>';
    B.host = document.getElementById('sv3d');

    buildScene();
    document.getElementById('svLeave').addEventListener('click', function () { svEnd(true); });
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    B.host.setAttribute('tabindex', '0');
    B.host.focus({ preventScroll: true });

    B.running = true;
    tip('W A S D 로 이동 · Q 버리기 · F 대피. 물 · 담요 · 구급상자가 우선입니다.');
    B.raf = window.requestAnimationFrame(svTick);
    svPaint();
  }

  function svEnd(early) {
    if (B.done) return;
    B.running = false;
    B.done = true;
    svTeardown();
    var scav = document.getElementById('scav');
    if (scav) scav.classList.remove('panic');

    var start = {};
    SIM.res.forEach(function (r) { start[r.id] = SCAV.base; });
    Object.keys(B.bag).forEach(function (id) {
      var res = B.bag[id].res;
      Object.keys(res).forEach(function (k) { start[k] += res[k]; });
    });
    if (early && B.left > 0) start.body += Math.round(B.left * 0.4);
    SIM.res.forEach(function (r) { start[r.id] = Math.max(5, Math.min(100, Math.round(start[r.id]))); });
    B.start = start;

    var n = Object.keys(B.bag).length;
    var grade = SCAV.grades.filter(function (g) { return n >= g.min; })[0] || SCAV.grades[SCAV.grades.length - 1];
    var missing = SCAV.must.filter(function (id) { return !B.bag[id]; });

    document.getElementById('svStage').innerHTML =
      '<div class="scavend">' +
        '<div class="label">' +
          (B.exited ? '현관으로 대피 · ' + Math.ceil(B.left) + '초 남김'
                    : early ? '그 자리에서 대피 · ' + Math.ceil(B.left) + '초 남김'
                            : '60초 종료 · 더 챙길 시간이 없었습니다') +
        '</div>' +
        '<div class="et">' + esc(grade.t) + '</div>' +
        '<p class="ed">' + esc(grade.d) + ' 가방에 ' + n + '종 ' + B.slots + '칸을 담았습니다.</p>' +
        (missing.length
          ? '<div class="missing">' + missing.map(function (id) { return '<div>' + esc(SCAV.miss[id]) + '</div>'; }).join('') + '</div>'
          : '<div class="missing"><div style="border-left-color:var(--green-dim)">필수 여섯 가지를 모두 챙겼습니다. 이 가방으로 72시간을 시작합니다.</div></div>') +
        '<div class="startres" id="svRes"></div>' +
        '<div class="rbtns" id="svBtns"></div>' +
      '</div>';

    var rw = document.getElementById('svRes');
    SIM.res.forEach(function (r) {
      rw.appendChild(el('div', '', '<div class="sk">' + esc(r.n) + ' 시작</div><div class="sv" style="color:' + r.c + '">' + start[r.id] + '</div>'));
    });

    var btns = document.getElementById('svBtns');
    var go = el('button', 'btn primary');
    go.type = 'button'; go.textContent = '이 가방으로 72시간 시작';
    go.addEventListener('click', function () {
      gInit(B.start); gTurn();
      document.getElementById('simHead').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
    var again = el('button', 'btn');
    again.type = 'button'; again.textContent = '60초 다시';
    again.addEventListener('click', svStart);
    btns.appendChild(go); btns.appendChild(again);

    tip(missing.length ? '빠뜨린 필수품이 ' + missing.length + '종 있습니다.' : '필수품을 모두 챙겼습니다.');
    svPaint();
  }

  document.getElementById('svStart').addEventListener('click', svStart);
  svPaint();

  /* ====================== 72시간 시뮬레이터 ====================== */

  var G = { t: 0, res: {}, over: false, started: false };

  /* start 를 주면(60초 대피 결과) 그 값으로 시작한다. 없으면 집에 그대로 있는 상황 = 100 */
  function gInit(start) {
    G = { t: 0, res: {}, over: false, started: true };
    SIM.res.forEach(function (r) { G.res[r.id] = start ? start[r.id] : 100; });
    gGauges();
    gClock();
  }

  function gGauges() {
    var w = $('#simGauges');
    w.innerHTML = '';
    SIM.res.forEach(function (r) {
      var v = G.res[r.id] == null ? 100 : Math.max(0, Math.min(100, G.res[r.id]));
      var box = el('div', 'ga' + (v <= 25 ? ' crit' : ''),
        '<div class="gh"><span>' + esc(r.n) + '</span><span class="gv">' + v + '</span></div>' +
        '<div class="gtrack"><i style="width:' + v + '%;background:' + r.c + '"></i></div>');
      w.appendChild(box);
    });
  }

  function gClock() {
    $('#simClock').textContent = (G.t * 12) + 'h';
    $('#simTurnLabel').textContent = !G.started ? '대기 중'
      : G.over ? '종료' : (SIM.turns[G.t] ? SIM.turns[G.t].h : '종료');
  }

  /* 선택지의 need 재료가 집(§03 보유) 또는 키트(§04 담김)에 있는지 */
  function hasNeed(need) {
    if (!need || !need.length) return true;
    return need.some(function (id) {
      if (B.bag[id]) return true;            // 60초 동안 가방에 챈 것
      if (S.inv && S.inv[id]) return true;   // §03 집 재료
      if (S.cart && S.cart[id]) return true; // §04 키트에 담은 것
      return false;
    });
  }
  function needLabel(need) {
    return need.map(function (id) {
      var it = APP.item(id);
      if (it) return it.n;
      var found = '';
      (window.BLACKOUT_DATA.MATCATS || []).forEach(function (c) {
        c.items.forEach(function (m) { if (m[0] === id) found = m[1]; });
      });
      return found || id;
    }).join(' 또는 ');
  }

  function gTurn() {
    var turn = SIM.turns[G.t];
    if (!turn) return gEnd();
    var body = $('#simBody');

    body.innerHTML =
      '<div class="simturn">' +
        '<div class="sh">' + esc(turn.h) + ' · ' + (G.t + 1) + ' / ' + SIM.turns.length + '</div>' +
        '<h3>' + esc(turn.t) + '</h3>' +
        '<p class="ss">' + esc(turn.s) + '</p>' +
        '<div class="sopts" id="sOpts"></div>' +
      '</div>';

    var wrap = $('#sOpts');
    turn.opts.forEach(function (o, j) {
      var need = o.need || [];
      var have = hasNeed(need);
      if (need.length && !have) {
        var locked = el('div', 'sopt', '<span class="st" style="color:var(--fg-faint)">' + esc(o.t) + '</span>' +
          '<span class="sb"><span class="tag">재료 없음 · ' + esc(needLabel(need)) + '</span></span>');
        wrap.appendChild(locked);
        return;
      }
      var cls = 'sopt' + (need.length ? ' have' : '') + (o.danger ? ' risk' : '');
      var badge = need.length ? '<span class="tag ok">내 재료로 가능</span>'
        : (o.danger ? '<span class="tag bad">위험</span>' : '');
      var b = el('button', cls, '<span class="st">' + esc(o.t) + '</span><span class="sb">' + badge + '</span>');
      b.type = 'button';
      b.addEventListener('click', function () { gChoose(o); });
      wrap.appendChild(b);
    });

    say(pick(['어떻게 하시겠습니까?', '여기서 갈립니다.', '자원을 보고 고르십시오.']));
    gClock();
  }

  function gChoose(o) {
    var turn = SIM.turns[G.t];
    var deltas = [];

    /* 턴마다 기본 소모 */
    SIM.res.forEach(function (r) {
      var drop = r.d;
      G.res[r.id] -= drop;
    });
    /* 선택 효과 */
    Object.keys(o.e || {}).forEach(function (k) {
      G.res[k] = (G.res[k] || 0) + o.e[k];
      deltas.push({ k: k, v: o.e[k] });
    });
    SIM.res.forEach(function (r) {
      G.res[r.id] = Math.max(0, Math.min(100, G.res[r.id]));
    });
    gGauges();

    var dead = SIM.res.filter(function (r) { return G.res[r.id] <= 0; });
    var body = $('#simBody');
    var res = el('div', 'simres');
    res.innerHTML = '<p class="rr">' + esc(o.r) + '</p>' +
      '<div class="deltas">' + deltas.map(function (d) {
        var r = SIM.res.filter(function (x) { return x.id === d.k; })[0];
        return '<span class="' + (d.v > 0 ? 'up' : 'dn') + '">' + esc(r ? r.n : d.k) + ' ' + (d.v > 0 ? '+' : '') + d.v + '</span>';
      }).join('') + '</div>';
    body.appendChild(res);

    document.querySelectorAll('#sOpts .sopt').forEach(function (b) {
      b.setAttribute('disabled', 'disabled');
      b.style.pointerEvents = 'none';
      b.style.opacity = '.5';
    });

    say(o.danger ? pick(CH.react.warn) : (deltas.some(function (d) { return d.v > 0; }) ? pick(CH.react.good) : pick(CH.react.bad)),
      o.danger ? 'warn' : 'good', 2600);

    var btn = el('button', 'btn primary');
    btn.type = 'button';
    btn.style.marginTop = '18px';
    if (dead.length) {
      btn.textContent = '결과 보기';
      btn.addEventListener('click', function () { G.over = true; gEnd(dead[0]); });
    } else {
      btn.textContent = G.t + 1 >= SIM.turns.length ? '72시간 결과 보기' : '다음 12시간';
      btn.addEventListener('click', function () { G.t++; gClock(); gTurn(); });
    }
    res.appendChild(btn);
    res.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
  }

  function gEnd(dead) {
    G.over = true;
    G.t = Math.min(G.t, SIM.turns.length);
    var vals = SIM.res.map(function (r) { return G.res[r.id]; });
    var avg = Math.round(vals.reduce(function (a, b) { return a + b; }, 0) / vals.length);
    if (dead) avg = Math.min(avg, 20);

    var end = SIM.ends.filter(function (e) { return avg >= e.min; })[0] || SIM.ends[SIM.ends.length - 1];
    var lowest = SIM.res.slice().sort(function (a, b) { return G.res[a.id] - G.res[b.id]; })[0];

    $('#simBody').innerHTML =
      '<div class="simend">' +
        '<div class="label">72시간 결과 · 평균 ' + avg + '</div>' +
        '<div class="et">' + esc(end.t) + '</div>' +
        '<p class="ed">' + esc(end.d) + '</p>' +
        '<div class="ex">' + esc(SIM.low[lowest.id] || '') + '</div>' +
        '<div class="rbtns" id="sBtns"></div>' +
      '</div>';

    var btns = $('#sBtns');
    var again = el('button', 'btn');
    again.type = 'button'; again.textContent = '다시 걷기';
    again.addEventListener('click', function () { gInit(); gTurn(); });

    var fix = el('button', 'btn primary');
    fix.type = 'button'; fix.textContent = '약한 자원 보완하러 가기';
    fix.addEventListener('click', function () {
      var map = { water: 'make', heat: 'make', info: 'kit', body: 'kit' };
      APP.goTab(map[lowest.id] || 'kit');
    });

    var pdf = el('button', 'btn ghost');
    pdf.type = 'button'; pdf.textContent = '대피 카드 만들기';
    pdf.addEventListener('click', function () { APP.goTab('card'); });

    btns.appendChild(fix); btns.appendChild(again); btns.appendChild(pdf);
    say(dead ? '여기서 끝났어요. 어느 자원이 먼저 바닥났는지 꼭 보세요.' : '72시간 완주했어요. 이제 종이로 남기면 끝이에요.',
      dead ? 'bad' : 'good', 3400);
    gClock();
  }

  $('#simStart').addEventListener('click', function () { gInit(); gTurn(); });
  $('#simToMake').addEventListener('click', function () { APP.goTab('make'); });

  /* 처음 화면 — 자원 게이지는 만점 상태로 보여 둔다 */
  SIM.res.forEach(function (r) { G.res[r.id] = 100; });
  gGauges();
  gClock();
  dPaint();
})();
