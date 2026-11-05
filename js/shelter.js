/* BLACK-OUT : MARS — 정착지 지도 (시설·상태·재난 상황은 가상 API js/mars-api.js에서 받음) (Leaflet, 좌표계 CRS.Simple + NASA 궤도 사진)
   - 지도 배경: NASA 마스 오디세이 THEMIS 게일 크레이터 궤도 사진(퍼블릭 도메인). 정착지·시설·축척은 시연용 가상 설정입니다.
   - 위치 지정: 거주 구역 선택 또는 지도 클릭·핀 끌기
   - 비축 기간(서비스 계획 가정): 정착지 중심에서 멀수록 길게 — 3km 안 3솔 / 10km 안 7솔 / 그 밖 14솔
     (팀원 readykit의 '시·구 3일 / 군 7일 / 섬 14일' 구조를 화성에 맞춘 것. 실제 보급·구조 시간을 예측한 값이 아닙니다)
   - 거리는 직선거리이며 이동 시간은 우주복 도보 3km/h, 로버 15km/h로 단순 환산한 참고값입니다. */
(function (RO) {
  const MAP = { img: 'assets/mars/gale-map.jpg', kmWidth: 45 }; // 시연용 축척: 사진 가로를 45km로 가정 (실제 게일 크레이터 지름은 약 154km)
  const W = 1000; // 지도 단위 가로 길이 (세로는 사진 비율로 계산)
  const CORE = { x: 0.45, y: 0.66 }; // 정착지 중심: 크레이터 바닥 평지, 샤프산 남쪽 기슭

  // 시설 종류 (기능 명세: 지하 방사선 대피소 · 돔 비상 대피 구역 · 호출 가능한 구조 로봇 · 이웃 거주민 · 대피 로버)
  const TYPES = {
    shield: { name: '지하 방사선 대피소', for: '태양 방사선·운석', icon: 'shield' },
    pressure: { name: '돔 비상 대피 구역', for: '공기 누출·화재·생명유지', icon: 'gauge' },
    robot: { name: '호출 가능한 구조 로봇', for: '모든 재난', icon: 'bot' },
    people: { name: '도움 줄 이웃 거주민', for: '모든 재난', icon: 'users' },
    rover: { name: '탑승 가능한 대피 로버', for: '장기 대피·전력·난방', icon: 'truck' }
  };
  const TYPES_FOR = {
    dust: ['rover', 'robot', 'people'], solar: ['shield', 'robot'], quake: ['pressure', 'robot', 'people'], meteor: ['shield', 'pressure', 'robot'],
    depress: ['pressure', 'robot', 'people'], fire: ['pressure', 'robot'], life: ['pressure', 'robot', 'people'], power: ['rover', 'people', 'robot'], cold: ['people', 'rover', 'robot']
  };
  const typesFor = (hz) => (hz.includes('all') ? Object.keys(TYPES) : [...new Set(hz.flatMap((h) => TYPES_FOR[h] || []))]);

  // 시설·거주 구역은 가상 API(js/mars-api.js)에서 받아옵니다
  const FACILITIES = RO.marsApi.FACILITIES;
  const ZONES = RO.marsApi.ZONES;
  const LEVEL_KEY = { 심각: 'crit', 경보: 'warn', 주의: 'caution', 정보: 'info', 해제: 'done' };

  const PLAN = [
    { maxKm: 3, days: 3, label: '정착지 중심 기준', reason: '정착지 중심 3km 안이라 보급·구조가 가까운 곳으로 보고 3솔 기준을 적용했어요.' },
    { maxKm: 10, days: 7, label: '정착지 외곽 기준', reason: '정착지 중심에서 3~10km 떨어져 7솔 기준을 적용했어요.' },
    { maxKm: Infinity, days: 14, label: '원거리 전초기지 기준', reason: '정착지 중심에서 10km 넘게 떨어져 14솔 기준을 적용했어요.' }
  ];
  const ORBIT_PLAN = { days: 30, label: '궤도 기지 기준', reason: '화성 궤도의 포보스 기지는 귀환선이 오기까지 오래 걸릴 수 있어 30솔 기준을 적용했어요.' };

  const $ = (id) => document.getElementById(id);
  const fmtKm = (km) => (km < 1 ? Math.round(km * 1000) + 'm' : km.toFixed(1) + 'km');
  const minutes = (km, kmh) => { const m = Math.round((km / kmh) * 60); return m < 60 ? `${m}분` : `${Math.floor(m / 60)}시간 ${m % 60}분`; };

  let hzLayer, hazards = ['all'], status = {}, alertList = [], timer = null;
  let map, layer, pinMarker, H = Math.round((W * 1700) / 2200), kmPerUnit = MAP.kmWidth / W;
  let loc = null, shelterType = 'pressure', allowed = Object.keys(TYPES), results = [], selected = null;
  const toLatLng = (x, y) => [(1 - y) * H, x * W];
  const dist = (a, b) => Math.hypot(a.lat - b.lat, a.lng - b.lng) * kmPerUnit;

  function planFor(l) {
    if (l.orbit) return { ...ORBIT_PLAN, km: null };
    const c = toLatLng(CORE.x, CORE.y);
    const km = dist(l, { lat: c[0], lng: c[1] });
    return { ...PLAN.find((p) => km < p.maxKm), km };
  }

  function setStatus(id, kind, html) {
    const el = $(id);
    el.className = (id === 'locStatus' ? 'loc-status' : 'shelter-status') + ' is-' + kind;
    el.innerHTML = html;
    el.hidden = !html;
    RO.icons();
  }

  const pin = (html, cls) => L.divIcon({ className: 'pin ' + cls, html, iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -28] });
  const fitPad = () => {
    const panel = document.querySelector('.map-panel');
    const wide = window.matchMedia('(min-width: 1081px)').matches && panel;
    return { paddingTopLeft: [60, 60], paddingBottomRight: [wide ? panel.offsetWidth + 60 : 40, 40], maxZoom: 2 };
  };

  function initMap() {
    if (!window.L) {
      $('shelterMap').innerHTML = '<div class="map-fallback"><i data-lucide="map" aria-hidden="true"></i><p>지도를 불러오지 못했어요.<br>거주 구역 선택으로 계속 계산할 수 있어요.</p></div>';
      RO.icons();
      return Promise.resolve();
    }
    return new Promise((done) => {
      const img = new Image();
      img.onload = () => { H = Math.round((W * img.naturalHeight) / img.naturalWidth); build(true); done(); };
      img.onerror = () => { build(false); done(); };
      img.src = MAP.img;
    });
    function build(ok) {
      const bounds = [[0, 0], [H, W]];
      map = L.map('shelterMap', { crs: L.CRS.Simple, zoomControl: false, minZoom: -2, maxZoom: 3, zoomSnap: 0.25, attributionControl: true, maxBounds: [[-H * 0.2, -W * 0.2], [H * 1.2, W * 1.2]] });
      L.control.zoom({ position: 'bottomleft' }).addTo(map);
      if (ok) L.imageOverlay(MAP.img, bounds, { attribution: '배경: NASA/JPL 게일 크레이터 (퍼블릭 도메인) · 정착지·시설·축척은 시연용 가상 설정' }).addTo(map);
      else $('shelterMap').classList.add('no-image');
      map.fitBounds(bounds);
      // 정착지 중심 표시
      L.circle(toLatLng(CORE.x, CORE.y), { radius: 3 / kmPerUnit, color: '#E0401A', weight: 1, dashArray: '4 6', fill: false, interactive: false }).addTo(map);
      L.circle(toLatLng(CORE.x, CORE.y), { radius: 10 / kmPerUnit, color: '#E0401A', weight: 1, dashArray: '2 8', opacity: 0.6, fill: false, interactive: false }).addTo(map);
      hzLayer = L.layerGroup().addTo(map);
      layer = L.layerGroup().addTo(map);
      map.on('click', (e) => setLocation({ lat: e.latlng.lat, lng: e.latlng.lng, label: '지도에서 고른 위치', source: 'map' }));
    }
  }

  function drawPin() {
    if (!map || !loc || loc.orbit) { if (pinMarker) { pinMarker.remove(); pinMarker = null; } return; }
    if (!pinMarker) {
      pinMarker = L.marker([loc.lat, loc.lng], { icon: pin('<span></span>', 'pin-me'), draggable: true, title: '내 거주구 (끌어서 옮길 수 있어요)', zIndexOffset: 1000 }).addTo(map);
      pinMarker.on('dragend', () => { const p = pinMarker.getLatLng(); setLocation({ lat: p.lat, lng: p.lng, label: '지도에서 옮긴 위치', source: 'map' }); });
    } else pinMarker.setLatLng([loc.lat, loc.lng]);
  }

  function draw() {
    const list = $('shelterList');
    if (layer) layer.clearLayers();
    list.innerHTML = results.map((s, i) => `
      <li class="sh-item ${selected === s.id ? 'is-active' : ''}" data-id="${s.id}">
        <button class="sh-main" data-focus="${s.id}" aria-label="${s.name} 지도에서 보기">
          <span class="sh-no">${i + 1}</span>
          <span class="sh-text">
            <span class="sh-name">${s.name}${s.status ? ` <em class="st st-${s.status.key}">${s.status.label}</em>` : ''}</span>
            <span class="sh-addr">${s.status ? s.status.note + ' · ' : ''}${loc.orbit ? '궤도에서는 셔틀로 이동해야 해요' : `우주복 도보 약 ${minutes(s.km, 3)}`}</span>
          </span>
          <span class="sh-dist">${loc.orbit ? '-' : fmtKm(s.km)}</span>
        </button>
        <div class="sh-actions">
          <button class="link-act" data-tocard="${s.id}"><i data-lucide="bookmark-plus" aria-hidden="true"></i>비상 카드에 저장</button>
        </div>
      </li>`).join('');
    RO.icons();
    if (!map) return;
    // 모든 시설을 흐리게, 선택한 종류는 번호 핀으로
    FACILITIES.forEach((f) => {
      if (results.some((r) => r.id === f.id)) return;
      L.circleMarker(toLatLng(f.x, f.y), { radius: 4, color: '#fff', weight: 1, fillColor: '#999', fillOpacity: 0.8 }).addTo(layer).bindTooltip(`${f.name} · ${TYPES[f.type].name}`);
    });
    const bounds = loc && !loc.orbit ? [[loc.lat, loc.lng]] : [];
    results.forEach((s, i) => {
      const m = L.marker(toLatLng(s.x, s.y), { icon: pin(`<span>${i + 1}</span>`, 'pin-real'), title: s.name, keyboard: true }).addTo(layer);
      m.bindPopup(`<b>${s.name}</b><br>${TYPES[s.type].name}${loc.orbit ? '' : ` · 직선 ${fmtKm(s.km)}`}${s.status ? `<br><b class="st st-${s.status.key}">${s.status.label}</b> ${s.status.note}` : ''}<br><small>DEMO 데이터 · ${statusAt}</small>`);
      m.on('click', () => select(s.id, false));
      s._m = m;
      bounds.push(toLatLng(s.x, s.y));
    });
    if (bounds.length) map.fitBounds(bounds, fitPad());
  }

  function select(id, fromList) {
    selected = id;
    document.querySelectorAll('.sh-item').forEach((li) => li.classList.toggle('is-active', li.dataset.id === id));
    const s = results.find((x) => x.id === id);
    if (!s) return;
    if (fromList && map) { map.flyTo(toLatLng(s.x, s.y), 1.5, { duration: 0.6 }); s._m.openPopup(); }
    if (!fromList) document.querySelector(`.sh-item[data-id="${id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  let statusAt = '';
  let reqNo = 0;
  async function loadFacilities() {
    if (!loc) return;
    const no = ++reqNo;
    setStatus('shelterStatus', 'loading', '<span class="spinner" aria-hidden="true"></span>기지 관제에서 시설 상태를 받아오고 있어요… (DEMO)');
    const res = await RO.marsApi.getFacilities();
    if (no !== reqNo) return; // 더 최근 요청이 있으면 무시
    statusAt = res.fetchedAt;
    res.data.forEach((f) => { status[f.id] = f.status; });
    results = res.data.filter((f) => f.type === shelterType).map((f) => {
      const ll = toLatLng(f.x, f.y);
      return { ...f, km: loc.orbit ? 0 : dist(loc, { lat: ll[0], lng: ll[1] }) };
    }).sort((a, b) => (b.status.key === 'open') - (a.status.key === 'open') || a.km - b.km); // 이용 가능한 곳 먼저, 그다음 가까운 곳
    selected = null;
    draw();
    $('shelterPrint').disabled = !results.length;
    const ok = results.filter((r) => r.status.key === 'open').length;
    setStatus('shelterStatus', results.length ? 'ok' : 'empty', results.length
      ? `<i data-lucide="${TYPES[shelterType].icon}" aria-hidden="true"></i><span>${TYPES[shelterType].name} ${results.length}곳 · 바로 이용 가능 ${ok}곳<br><small><b class="demo-chip">DEMO</b> 가상 관제 데이터 · ${res.fetchedAt} 기준 · 이용 가능한 곳·가까운 곳 순</small></span>`
      : `<i data-lucide="search-x" aria-hidden="true"></i>${TYPES[shelterType].name} 자료가 없어요.`);
  }

  /* ---------- 재난 상황: 지도 위 표시 + 상황판 ---------- */
  const xy = (o) => toLatLng(o.x, o.y);
  const active = (hz) => hazards.includes('all') || hazards.includes(hz);
  async function drawIncidents() {
    if (!map || !hzLayer) return;
    const { data } = await RO.marsApi.getIncidents();
    hzLayer.clearLayers();
    alertList = data.alerts;
    if (active('dust')) {
      const fx = data.dustFrontX;
      const pts = [];
      for (let i = 0; i <= 24; i++) { const y = i / 24; pts.push(toLatLng(fx + Math.sin(i * 1.3) * 0.012, y)); }
      L.polygon([toLatLng(-0.2, 0), ...pts, toLatLng(-0.2, 1)], { stroke: false, fillColor: '#C2410C', fillOpacity: 0.32, interactive: false, className: 'hz-dust' }).addTo(hzLayer);
      L.polyline(pts, { color: '#FF8A5C', weight: 2, dashArray: '6 6', interactive: false }).addTo(hzLayer);
      L.marker(toLatLng(fx, 0.5), { icon: L.divIcon({ className: 'hz-label', html: '<span>먼지 폭풍 전선 →</span>' }), interactive: false }).addTo(hzLayer);
    }
    if (active('quake')) {
      [2, 5, 9].forEach((r, i) => L.circle(xy(data.quake), { radius: r / kmPerUnit, color: '#FFB347', weight: 1.5, opacity: 0.8 - i * 0.2, fill: i === 0, fillOpacity: 0.12, interactive: false, className: 'hz-ring' }).addTo(hzLayer));
      L.marker(xy(data.quake), { icon: L.divIcon({ className: 'hz-label', html: `<span>진앙 M${data.quake.mag}</span>` }), interactive: false }).addTo(hzLayer);
    }
    if (active('meteor')) {
      L.circle(xy(data.meteor), { radius: 1 / kmPerUnit, color: '#FF6A3D', weight: 1.5, dashArray: '3 5', fillColor: '#FF6A3D', fillOpacity: 0.12, interactive: false }).addTo(hzLayer);
      L.marker(xy(data.meteor), { icon: L.divIcon({ className: 'hz-label', html: '<span>운석 충돌 지점 · 출입 통제 1km</span>' }), interactive: false }).addTo(hzLayer);
    }
    if (active('solar')) L.marker(toLatLng(0.82, 0.14), { icon: L.divIcon({ className: 'hz-label hz-solar', html: '<span>☀ 태양 방사선 주의 · 입자 도달 약 11시간 뒤</span>' }), interactive: false }).addTo(hzLayer);
    data.alerts.filter((a) => a.level !== '해제' && ['depress', 'life', 'power', 'cold', 'fire'].includes(a.hazard) && active(a.hazard)).forEach((a) => {
      L.marker(xy(a.at), { icon: L.divIcon({ className: `hz-pulse hzp-${LEVEL_KEY[a.level]}`, html: '<i></i>', iconSize: [22, 22], iconAnchor: [11, 11] }), title: a.title, zIndexOffset: 500 })
        .addTo(hzLayer).bindPopup(`<b>${a.title}</b> <em class="lv lv-${LEVEL_KEY[a.level]}">${a.level}</em><br>${a.message}<br><small>DEMO 데이터 · ${a.issued}</small>`);
    });
    renderBoard();
  }

  function renderBoard() {
    const order = { 심각: 0, 경보: 1, 주의: 2, 정보: 3, 해제: 4 };
    const list = alertList.slice().sort((a, b) => order[a.level] - order[b.level]);
    const live = list.filter((a) => a.level !== '해제').length;
    $('alertBoard').innerHTML = `
      <p class="ab-head"><span class="ab-dot" aria-hidden="true"></span>기지 관제 상황판 · 진행 중 ${live}건 <b class="demo-chip">DEMO</b></p>
      <ul>${list.map((a) => `
        <li><button type="button" class="ab-item" data-alert="${a.id}">
          <em class="lv lv-${LEVEL_KEY[a.level]}">${a.level}</em><span>${a.title}</span>
        </button></li>`).join('')}</ul>`;
  }

  function focusAlert(id) {
    const a = alertList.find((x) => x.id === id);
    if (!a) return;
    RO.emit('setHazards', [a.hazard]);
    setTimeout(() => {
      if (map) map.flyTo(xy(a.at), 1, { duration: 0.8 });
      setStatus('locStatus', 'alert', `<i data-lucide="siren" aria-hidden="true"></i><span><b>${a.title}</b> · ${a.area}<br>${a.message}<br><small>할 일: ${a.action}</small></span>`);
    }, 120);
  }

  function setLocation(next) {
    loc = { ...next };
    const plan = planFor(loc);
    loc.plan = plan;
    drawPin();
    $('locLabel').textContent = loc.label;
    $('locMeta').textContent = loc.orbit ? '화성 궤도 · 정착지 지도 밖' : `정착지 중심에서 직선 ${fmtKm(plan.km)} · ${plan.label}`;
    setStatus('locStatus', '', '');
    RO.emit('location', loc);
    loadFacilities();
  }

  function renderTypes() {
    $('shelterTypes').innerHTML = allowed.map((t) => `
      <button type="button" class="type-chip ${t === shelterType ? 'is-active' : ''}" aria-pressed="${t === shelterType}" data-type="${t}">
        ${TYPES[t].name}<small>${TYPES[t].for}</small>
      </button>`).join('');
  }

  function printList() {
    if (!results.length) return;
    $('shelterPrintArea').innerHTML = `
      <h1>BLACK-OUT : MARS 주변 시설 — ${TYPES[shelterType].name}</h1>
      <p>기준: ${RO.esc(loc?.label || '')} · 출력 ${new Date().toLocaleDateString('ko-KR')}</p>
      <table><thead><tr><th>번호</th><th>이름</th><th>직선거리</th><th>우주복 도보</th></tr></thead>
      <tbody>${results.map((s, i) => `<tr><td>${i + 1}</td><td>${s.name}</td><td>${loc.orbit ? '-' : fmtKm(s.km)}</td><td>${loc.orbit ? '셔틀 이동' : minutes(s.km, 3)}</td></tr>`).join('')}</tbody></table>
      <p>시연용 가상 정착지 자료예요. 실제 상황에서는 기지 관제의 안내를 먼저 따르세요.</p>`;
    RO.print('print-shelters');
  }

  let ready = Promise.resolve();
  function init() {
    ready = initMap(); // 사진 크기를 알아야 좌표를 계산할 수 있으므로, 좌표가 필요한 동작은 ready 이후에
    $('regionSelect').innerHTML = '<option value="">거주 구역 선택</option>' + ZONES.map((z) => `<option value="${z.id}">${z.name}</option>`).join('');
    $('regionSelect').addEventListener('change', async (e) => {
      const z = ZONES.find((x) => x.id === e.target.value);
      if (!z) return;
      await ready;
      if (z.orbit) setLocation({ lat: 0, lng: 0, label: z.name, source: 'zone', zone: z.id, orbit: true });
      else { const [lat, lng] = toLatLng(z.x, z.y); setLocation({ lat, lng, label: z.name, source: 'zone', zone: z.id }); }
    });
    renderTypes();
    $('shelterPrint').addEventListener('click', printList);
    $('shelterTypes').addEventListener('click', (e) => {
      const b = e.target.closest('[data-type]');
      if (!b || b.dataset.type === shelterType) return;
      shelterType = b.dataset.type;
      renderTypes();
      loadFacilities();
    });
    $('shelterList').addEventListener('click', (e) => {
      const f = e.target.closest('[data-focus]');
      if (f) select(f.dataset.focus, true);
      const c = e.target.closest('[data-tocard]');
      if (c) {
        const s = results.find((x) => x.id === c.dataset.tocard);
        RO.emit('shelter', { name: s.name, address: `${TYPES[s.type].name}${loc.orbit ? '' : ` · 직선 ${fmtKm(s.km)}`}`, type: TYPES[s.type].name });
        RO.toast('비상 카드에 시설을 저장했어요');
      }
    });
    document.querySelector('.mp-tabs').addEventListener('click', (e) => {
      const b = e.target.closest('[data-tab]');
      if (!b) return;
      document.querySelectorAll('.mp-tabs [data-tab]').forEach((t) => { const on = t === b; t.classList.toggle('is-active', on); t.setAttribute('aria-selected', on); });
      $('tabKit').hidden = b.dataset.tab !== 'kit';
      $('tabShelter').hidden = b.dataset.tab !== 'shelter';
      if (b.dataset.tab === 'shelter' && results.length) draw();
    });
    $('alertBoard').addEventListener('click', (e) => { const b = e.target.closest('[data-alert]'); if (b) focusAlert(b.dataset.alert); });
    RO.on('hazards', (hz) => {
      hazards = hz;
      drawIncidents();
      allowed = typesFor(hz);
      if (!allowed.includes(shelterType)) { shelterType = allowed[0]; loadFacilities(); }
      renderTypes();
    });
    RO.on('view', (id) => {
      if (id !== 'shelter') return;
      ready.then(() => setTimeout(() => {
        map?.invalidateSize();
        if (!loc) { $('regionSelect').value = 'HAB-07'; $('regionSelect').dispatchEvent(new Event('change')); }
        else if (results.length) draw();
        drawIncidents();
        // 화면을 보고 있는 동안 10초마다 가상 API를 다시 불러 상황(먼지 전선·시설 상태)을 갱신
        clearInterval(timer);
        timer = setInterval(() => { if (document.getElementById('shelter').classList.contains('is-active')) { drawIncidents(); loadFacilities(); } else clearInterval(timer); }, 10000);
      }, 80));
    });
  }

  // 비상 카드용: 시설 종류별로 가장 가까운 한 곳
  function nearestAll(l = loc) {
    if (!l || l.orbit) return [];
    return Object.keys(TYPES).map((t) => {
      const best = RO.marsApi.facilityStatus().filter((f) => f.type === t && f.status.key !== 'check').map((f) => { const ll = toLatLng(f.x, f.y); return { ...f, km: dist(l, { lat: ll[0], lng: ll[1] }) }; }).sort((a, b) => a.km - b.km)[0];
      return best && { type: TYPES[t].name, name: best.name, km: best.km, walk: minutes(best.km, 3) };
    }).filter(Boolean);
  }

  // 거주 형태 → 대표 거주 구역 (비상 카드에서 지도를 안 열었을 때 사용)
  const ZONE_OF = { '돔 도시': 'HAB-07', '지하 거주 구역': 'HAB-12', '개인 거주 모듈': 'HAB-21', '이동형 로버': 'RV-25', '외곽 연구 기지': 'OUT-30' };
  function zoneLoc(housing) {
    const z = ZONES.find((x) => x.id === (ZONE_OF[housing] || 'HAB-07'));
    const [lat, lng] = toLatLng(z.x, z.y);
    return { lat, lng, label: z.name };
  }

  RO.shelter = { init, nearestAll, zoneLoc, fmtKm, ready: () => ready, setLocation, getLocation: () => loc, planFor, ZONES, FACILITIES, TYPES };
})(window.RO);
