/* BLACK-OUT — 우리 동네 맞춤 키트 + 대피소 (위치 · 지도 · 대피시설)
   팀원 브랜치 sjw/feature(readykit)를 이어받아 확장했습니다.
   - 위치: 현재 위치(동의 후 1회) / 주소·장소 검색 / 지도 클릭·핀 이동 / 위·경도 입력 / 시·군·구 선택
   - 대피시설: 행정안전부 국민안전24 안전지도 공개 데이터 스냅샷(readykit/dist/data), 가까운 시설 계산은 engine.mjs
   - 지역 경계: readykit/dist/data/regions.json (시·군·구 비축 기간 정책에 사용)
   - 실시간 개방·혼잡 여부는 알 수 없고, 거리는 직선거리입니다. 길찾기 결과를 안전한 대피 경로로 표현하지 않습니다.
   - 위치는 서버로 보내지 않습니다. 주소 검색어만 OpenStreetMap Nominatim에 보냅니다. */
(function (RO) {
  const CONFIG = {
    dataUrl: 'readykit/dist/data/',
    radiusKm: 30,
    limit: 8,
    poorAccuracyM: 1000 // 이보다 오차가 크면 수동 확인 안내
  };
  const SAMPLE = { lat: 37.5663, lng: 126.9779, label: '서울시청', source: 'sample' };

  /* ---------- readykit 데이터·엔진 (공용) ---------- */
  const getJSON = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('데이터 오류 ' + res.status);
    return res.json();
  };
  // .mjs를 text/plain으로 보내는 서버에서도 동작하도록 받아서 JS 모듈로 불러옴 (engine.mjs는 import 없는 순수 모듈)
  const engine = fetch('readykit/dist/engine.mjs')
    .then((r) => { if (!r.ok) throw new Error('engine'); return r.text(); })
    .then((code) => import(URL.createObjectURL(new Blob([code], { type: 'text/javascript' }))));
  let regionsP = null;
  const regions = () => (regionsP = regionsP || getJSON(CONFIG.dataUrl + 'regions.json').then((d) => d.regions).catch((e) => { regionsP = null; throw e; }));
  let indexP = null;
  const shelterIndex = () => (indexP = indexP || getJSON(CONFIG.dataUrl + 'shelters-index.json').catch((e) => { indexP = null; throw e; }));
  const cellCache = new Map();
  RO.readykit = { engine, regions, shelterIndex };

  const ShelterService = {
    // 반경 안에 걸치는 1도 단위 구역 파일만 불러와서 가까운 순으로 정렬
    async search(lat, lng, types) {
      const [{ nearestShelters }, idx] = await Promise.all([engine, shelterIndex()]);
      const r = CONFIG.radiusKm;
      const dLat = r / 111.2, dLng = r / (111.2 * Math.max(0.05, Math.cos(lat * Math.PI / 180)));
      const cells = idx.cells.filter(({ bbox: [x1, y1, x2, y2] }) => lng + dLng >= x1 && lng - dLng <= x2 && lat + dLat >= y1 && lat - dLat <= y2);
      const chunks = await Promise.all(cells.map((c) => {
        if (!cellCache.has(c.id)) cellCache.set(c.id, getJSON(`${CONFIG.dataUrl}shelters-${c.id}.json`).catch((e) => { cellCache.delete(c.id); throw e; }));
        return cellCache.get(c.id);
      }));
      return nearestShelters(chunks.flat(), { lat, lng }, { types, limit: CONFIG.limit, radiusKm: r });
    }
  };

  // 주소 → 좌표: 사용자가 검색 버튼을 눌렀을 때만 Nominatim에 검색어를 보냅니다.
  async function geocode(q) {
    const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=kr&accept-language=ko&q=' + encodeURIComponent(q);
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('geocode');
    const [hit] = await res.json();
    return hit ? { lat: +hit.lat, lng: +hit.lon } : null;
  }

  const fmtDist = (km) => (km < 1 ? Math.round(km * 1000) + 'm' : km.toFixed(1) + 'km');
  const round5 = (n) => Math.round(n * 1e5) / 1e5;
  const $ = (id) => document.getElementById(id);

  /* ---------- 상태 ---------- */
  let map, layer, pinMarker;
  let loc = null;            // { lat, lng, label, source, accuracy, at, regionCode }
  let results = [], selected = null, types = null, shelterType = null, allowedTypes = null;

  function setLocStatus(kind, html) {
    const el = $('locStatus');
    el.className = 'loc-status is-' + kind;
    el.innerHTML = html;
    el.hidden = !html;
    RO.icons();
  }
  function setShelterStatus(kind, html) {
    const el = $('shelterStatus');
    el.className = 'shelter-status is-' + kind;
    el.innerHTML = html;
    el.hidden = !html;
    RO.icons();
  }
  const typeInfo = () => types?.[shelterType] || { name: '대피시설', for: '' };

  /* ---------- 지도 ---------- */
  const pin = (html, cls) => L.divIcon({ className: 'pin ' + cls, html, iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -28] });
  const fitPad = () => {
    const panel = document.querySelector('.map-panel');
    const wide = window.matchMedia('(min-width: 1081px)').matches && panel;
    return { paddingTopLeft: [60, 60], paddingBottomRight: [wide ? panel.offsetWidth + 60 : 40, 40], maxZoom: 16 };
  };

  function initMap() {
    if (!window.L) {
      $('shelterMap').innerHTML = '<div class="map-fallback"><i data-lucide="map" aria-hidden="true"></i><p>지도를 불러오지 못했어요.<br>주소 검색·좌표·시군구 선택으로 계속 계산할 수 있어요.</p></div>';
      RO.icons();
      return;
    }
    map = L.map('shelterMap', { zoomControl: false, scrollWheelZoom: true }).setView([SAMPLE.lat, SAMPLE.lng], 14);
    L.control.zoom({ position: 'bottomleft' }).addTo(map);
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; OpenStreetMap contributors · 대피시설: 행정안전부 국민안전24'
    }).addTo(map);
    let tileErrors = 0;
    tiles.on('tileerror', () => { if (++tileErrors === 3) setLocStatus('error', '<i data-lucide="map" aria-hidden="true"></i>배경 지도를 불러오지 못했어요. 위치 지정과 키트 계산은 계속할 수 있어요.'); });
    layer = L.layerGroup().addTo(map);
    // 지도를 누르면 그 자리를 대비 장소로
    map.on('click', (e) => setLocation({ lat: e.latlng.lat, lng: e.latlng.lng, label: '지도에서 고른 위치', source: 'map' }));
  }

  function drawPin() {
    if (!map || !loc) return;
    if (!pinMarker) {
      pinMarker = L.marker([loc.lat, loc.lng], { icon: pin('<span></span>', 'pin-me'), draggable: true, title: '대비 장소 (끌어서 옮길 수 있어요)', zIndexOffset: 1000 }).addTo(map);
      pinMarker.on('dragend', () => { const p = pinMarker.getLatLng(); setLocation({ lat: p.lat, lng: p.lng, label: '지도에서 옮긴 위치', source: 'map' }); });
    } else pinMarker.setLatLng([loc.lat, loc.lng]);
    pinMarker.bindPopup(RO.esc(loc.label));
  }

  function drawShelters() {
    const list = $('shelterList');
    if (layer) layer.clearLayers();
    list.innerHTML = results.map((s, i) => `
      <li class="sh-item ${selected === s.id ? 'is-active' : ''}" data-id="${RO.esc(s.id)}">
        <button class="sh-main" data-focus="${RO.esc(s.id)}" aria-label="${RO.esc(s.name)} 지도에서 보기">
          <span class="sh-no">${i + 1}</span>
          <span class="sh-text">
            <span class="sh-name">${RO.esc(s.name)}</span>
            <span class="sh-addr">${RO.esc(s.address || '상세주소 미제공 · 지도 위치로 확인')}</span>
          </span>
          <span class="sh-dist">${fmtDist(s.distanceKm)}</span>
        </button>
        <div class="sh-actions">
          <a class="link-act" target="_blank" rel="noopener"
             href="https://map.kakao.com/link/to/${encodeURIComponent(s.name)},${s.lat},${s.lng}"
             aria-label="${RO.esc(s.name)} 카카오맵 일반 길찾기 (새 창)"><i data-lucide="navigation" aria-hidden="true"></i>일반 길찾기</a>
          <button class="link-act" data-tocard="${RO.esc(s.id)}"><i data-lucide="bookmark-plus" aria-hidden="true"></i>대피 카드에 저장</button>
        </div>
      </li>`).join('');
    RO.icons();
    if (!map || !loc) return;
    const bounds = [[loc.lat, loc.lng]];
    results.forEach((s, i) => {
      const m = L.marker([s.lat, s.lng], { icon: pin(`<span>${i + 1}</span>`, 'pin-real'), title: s.name, keyboard: true }).addTo(layer);
      m.bindPopup(`<b>${RO.esc(s.name)}</b><br>${RO.esc(typeInfo().name)} · 직선 ${fmtDist(s.distanceKm)}<br><small>${RO.esc(s.address || '상세주소 미제공')} · 개방 여부 미확인</small>`);
      m.on('click', () => selectShelter(s.id, false));
      s._m = m;
      bounds.push([s.lat, s.lng]);
    });
    map.fitBounds(bounds, fitPad());
  }

  function selectShelter(id, fromList) {
    selected = id;
    document.querySelectorAll('.sh-item').forEach((li) => li.classList.toggle('is-active', li.dataset.id === id));
    const s = results.find((x) => x.id === id);
    if (!s) return;
    if (fromList && map) { map.flyTo([s.lat, s.lng], 16, { duration: 0.6 }); s._m.openPopup(); }
    if (!fromList) document.querySelector(`.sh-item[data-id="${CSS.escape(id)}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  async function loadShelters() {
    if (!loc || !shelterType) return;
    setShelterStatus('loading', '<span class="spinner" aria-hidden="true"></span>주변 대피시설을 찾고 있어요…');
    try {
      results = await ShelterService.search(loc.lat, loc.lng, [shelterType]);
    } catch {
      results = [];
      drawShelters();
      setShelterStatus('error', '<i data-lucide="alert-circle" aria-hidden="true"></i>대피시설 자료를 불러오지 못했어요. 공식 안전지도에서 확인해 주세요.');
      return;
    }
    selected = null;
    drawShelters();
    $('shelterPrint').disabled = !results.length;
    setShelterStatus(results.length ? 'ok' : 'empty', results.length
      ? `<i data-lucide="map-pin" aria-hidden="true"></i><span>가까운 ${RO.esc(typeInfo().name)} ${results.length}곳<br><small>직선거리 순 · 지도에 있어도 지금 열려 있다는 뜻은 아니에요</small></span>`
      : `<i data-lucide="search-x" aria-hidden="true"></i>반경 ${CONFIG.radiusKm}km 안에 ${RO.esc(typeInfo().name)} 자료가 없어요. '없음'이 아니라 자료 부족일 수 있어요.`);
  }

  /* ---------- 위치 ---------- */
  function setLocation(next) {
    loc = { ...next, lat: round5(next.lat), lng: round5(next.lng) };
    drawPin();
    if (map && next.source !== 'map') map.setView([loc.lat, loc.lng], Math.max(map.getZoom(), 14));
    const acc = loc.accuracy ? ` · 오차 약 ±${Math.round(loc.accuracy)}m · ${new Date(loc.at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 측정` : '';
    $('locLabel').textContent = loc.label + (loc.source === 'sample' ? ' (예시 기준점 · 내 위치 아님)' : '');
    $('locMeta').textContent = `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}${acc}`;
    if (loc.accuracy > CONFIG.poorAccuracyM) setLocStatus('warn', `<i data-lucide="crosshair" aria-hidden="true"></i>위치 오차가 커요(±${Math.round(loc.accuracy)}m). 지도에서 핀을 옮기거나 주소로 다시 지정해 주세요.`);
    else setLocStatus('', '');
    RO.emit('location', loc);
    loadShelters();
  }

  async function onSearch(e) {
    e.preventDefault();
    const q = $('shelterQuery').value.trim();
    if (!q) { setLocStatus('error', '<i data-lucide="alert-circle" aria-hidden="true"></i>주소나 장소 이름을 입력해 주세요.'); $('shelterQuery').focus(); return; }
    setLocStatus('loading', '<span class="spinner" aria-hidden="true"></span>주소를 찾고 있어요…');
    try {
      const hit = await geocode(q);
      if (!hit) { setLocStatus('empty', `<i data-lucide="search-x" aria-hidden="true"></i>"${RO.esc(q)}" 검색 결과가 없어요. 도로명 주소나 동 이름, 또는 시·군·구 선택을 이용해 주세요.`); return; }
      setLocation({ ...hit, label: q, source: 'search' });
    } catch {
      setLocStatus('error', '<i data-lucide="wifi-off" aria-hidden="true"></i>주소 검색 서비스에 연결하지 못했어요. 지도 클릭·좌표·시군구 선택으로 계속할 수 있어요.');
    }
  }

  function useGeolocation() {
    $('geoDialog').close();
    setLocStatus('loading', '<span class="spinner" aria-hidden="true"></span>현재 위치를 확인하고 있어요…');
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: '현재 위치', source: 'gps', accuracy: pos.coords.accuracy, at: pos.timestamp }),
      (err) => {
        const why = err.code === 1 ? '위치 접근이 거부되었어요' : err.code === 3 ? '위치 확인 시간이 초과되었어요' : '현재 위치를 확인하지 못했어요';
        setLocStatus('denied', `<i data-lucide="map-pin-off" aria-hidden="true"></i><span><b>${why}.</b> 주소 검색, 지도 클릭, 좌표, 시·군·구 선택으로 계속할 수 있어요.</span>`);
        $('shelterQuery').focus();
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }

  function onCoords(e) {
    e.preventDefault();
    const lat = parseFloat($('coordLat').value), lng = parseFloat($('coordLng').value);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < 32 || lat > 39.5 || lng < 124 || lng > 132.5) {
      setLocStatus('error', '<i data-lucide="alert-circle" aria-hidden="true"></i>대한민국 범위의 위도(32~39.5)와 경도(124~132.5)를 숫자로 입력해 주세요.');
      return;
    }
    setLocation({ lat, lng, label: '직접 입력한 좌표', source: 'coords' });
  }

  async function fillRegions() {
    try {
      const list = (await regions()).slice().sort((a, b) => a.label.localeCompare(b.label, 'ko'));
      $('regionSelect').innerHTML = '<option value="">시·군·구 선택</option>' + list.map((r) => `<option value="${r.code}">${RO.esc(r.label)}</option>`).join('');
    } catch {
      $('regionSelect').innerHTML = '<option value="">지역 목록을 불러오지 못했어요</option>';
    }
  }

  /* ---------- 대피시설 유형 (선택한 재난에 맞춰) ---------- */
  function renderTypes() {
    const ids = allowedTypes || ['earthquake', 'temporary', 'civil', 'heat', 'cold'];
    $('shelterTypes').innerHTML = ids.map((t) => `
      <button type="button" class="type-chip ${t === shelterType ? 'is-active' : ''}" aria-pressed="${t === shelterType}" data-type="${t}">
        ${types?.[t]?.name || t}<small>${types?.[t]?.for || ''}</small>
      </button>`).join('');
    engine.then((m) => { $('shelterSource').href = m.officialShelterUrl(shelterType); }).catch(() => {});
  }

  function printList() {
    if (!results.length) return;
    $('shelterPrintArea').innerHTML = `
      <h1>BLACK-OUT 주변 대피시설 — ${RO.esc(typeInfo().name)}</h1>
      <p>기준: ${RO.esc(loc?.label || '')} (${loc?.lat}, ${loc?.lng}) · 출력일 ${new Date().toLocaleDateString('ko-KR')}</p>
      <table><thead><tr><th>번호</th><th>이름</th><th>주소</th><th>직선거리</th></tr></thead>
      <tbody>${results.map((s, i) => `<tr><td>${i + 1}</td><td>${RO.esc(s.name)}</td><td>${RO.esc(s.address || '상세주소 미제공')}</td><td>${fmtDist(s.distanceKm)}</td></tr>`).join('')}</tbody></table>
      <p>출처: 행정안전부 국민안전24 안전지도 공개 데이터. 실제 개방·수용 여부는 알 수 없으며, 재난 시에는 정부·지자체 안내를 먼저 따르세요.</p>`;
    RO.print('print-shelters');
  }

  function init() {
    initMap();
    engine.then((m) => { types = m.SHELTER_TYPES; renderTypes(); }).catch(() => {
      setShelterStatus('error', '<i data-lucide="alert-circle" aria-hidden="true"></i>계산 엔진을 불러오지 못했어요. 새로고침해 주세요.');
    });
    shelterIndex().then((i) => { $('shelterDate').textContent = i.retrievedAt; }).catch(() => {});
    fillRegions();

    $('shelterForm').addEventListener('submit', onSearch);
    $('coordForm').addEventListener('submit', onCoords);
    $('regionSelect').addEventListener('change', async (e) => {
      const r = (await regions().catch(() => [])).find((x) => x.code === e.target.value);
      if (r) setLocation({ lat: r.center.lat, lng: r.center.lng, label: `${r.label} (시·군·구 중심, 상세 위치 없음)`, source: 'region', regionCode: r.code });
    });
    $('shelterGeo').addEventListener('click', () => {
      if (!('geolocation' in navigator)) { setLocStatus('error', '<i data-lucide="alert-circle" aria-hidden="true"></i>이 브라우저는 위치 기능을 지원하지 않아요. 주소나 시·군·구로 지정해 주세요.'); return; }
      $('geoDialog').showModal();
    });
    $('geoAllow').addEventListener('click', useGeolocation);
    $('geoDeny').addEventListener('click', () => {
      $('geoDialog').close();
      setLocStatus('denied', '<i data-lucide="keyboard" aria-hidden="true"></i>위치 정보를 쓰지 않아요. 주소 검색·지도 클릭·시군구 선택으로 지정해 주세요.');
      $('shelterQuery').focus();
    });
    $('shelterPrint').addEventListener('click', printList);
    $('shelterTypes').addEventListener('click', (e) => {
      const b = e.target.closest('[data-type]');
      if (!b || b.dataset.type === shelterType) return;
      shelterType = b.dataset.type;
      renderTypes();
      loadShelters();
    });
    $('shelterList').addEventListener('click', (e) => {
      const f = e.target.closest('[data-focus]');
      if (f) selectShelter(f.dataset.focus, true);
      const c = e.target.closest('[data-tocard]');
      if (c) {
        const s = results.find((x) => x.id === c.dataset.tocard);
        RO.emit('shelter', { name: s.name, address: s.address || '상세주소 미제공', type: typeInfo().name });
        RO.toast('대피 카드에 대피소를 저장했어요');
      }
    });
    // 패널 탭: 필요 물품 / 대피소
    document.querySelector('.mp-tabs').addEventListener('click', (e) => {
      const b = e.target.closest('[data-tab]');
      if (!b) return;
      document.querySelectorAll('.mp-tabs [data-tab]').forEach((t) => { const on = t === b; t.classList.toggle('is-active', on); t.setAttribute('aria-selected', on); });
      $('tabKit').hidden = b.dataset.tab !== 'kit';
      $('tabShelter').hidden = b.dataset.tab !== 'shelter';
      if (b.dataset.tab === 'shelter' && results.length) drawShelters();
    });
    // 재난 선택이 바뀌면 그 재난에 맞는 대피시설 유형으로
    RO.on('hazards', async (hz) => {
      const m = await engine.catch(() => null);
      if (!m) return;
      allowedTypes = m.shelterTypesFor(hz);
      if (!allowedTypes.includes(shelterType)) { shelterType = allowedTypes[0]; renderTypes(); loadShelters(); } else renderTypes();
    });
    // 화면에 들어올 때 지도 크기 재계산, 처음이면 예시 기준점(서울시청)
    RO.on('view', (id) => {
      if (id !== 'shelter') return;
      setTimeout(() => {
        map?.invalidateSize();
        if (!loc) setLocation(SAMPLE);
        else if (results.length) drawShelters();
      }, 80);
    });
  }

  RO.shelter = { init, ShelterService, setLocation, getLocation: () => loc, CONFIG };
})(window.RO);
