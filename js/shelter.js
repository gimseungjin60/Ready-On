/* BLACK-OUT — 대피소 지도 (Leaflet + OpenStreetMap)
   데이터: 팀원 브랜치(readykit)의 행정안전부 국민안전24 안전지도 공개 데이터 스냅샷(2026-11-05 수집).
   가까운 시설 계산과 시설 유형 정의는 readykit/dist/engine.mjs를 그대로 불러 씁니다.
   - 실시간 개방·혼잡 여부는 알 수 없으며, 거리는 직선거리입니다.
   - 위치 정보는 사용자가 동의한 경우에만 브라우저에서 1회 조회하며 서버로 전송하지 않습니다. */
(function (RO) {
  const SHELTER_CONFIG = {
    dataUrl: 'readykit/dist/data/', // shelters-index.json + shelters-{위도}_{경도}.json
    radiusKm: 30,
    limit: 8
  };
  const SAMPLE = { lat: 37.5663, lng: 126.9779, label: '서울시청 (예시 기준점)' };
  // 재난 → 시설 유형 (readykit shelterTypesFor 기준과 동일)
  const TYPE_TABS = [
    { type: 'earthquake', label: '지진' },
    { type: 'temporary', label: '홍수·태풍·화재' },
    { type: 'civil', label: '전쟁·공습' },
    { type: 'heat', label: '폭염' },
    { type: 'cold', label: '한파' }
  ];

  // .mjs를 text/plain으로 보내는 서버(파이썬 개발 서버, 일부 호스팅)에서도 동작하도록 직접 받아 JS 모듈로 불러옴.
  // engine.mjs는 다른 파일을 import하지 않는 순수 모듈이라 이 방식이 안전합니다.
  const engine = fetch('readykit/dist/engine.mjs')
    .then((r) => { if (!r.ok) throw new Error('engine'); return r.text(); })
    .then((code) => import(URL.createObjectURL(new Blob([code], { type: 'text/javascript' }))));
  let index = null;
  const cellCache = new Map();
  const getJSON = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('데이터 오류 ' + res.status);
    return res.json();
  };

  const ShelterService = {
    async index() {
      index = index || await getJSON(SHELTER_CONFIG.dataUrl + 'shelters-index.json');
      return index;
    },
    // 반경 안에 걸치는 1도 단위 구역 파일만 불러와서 가까운 순으로 정렬
    async search(lat, lng, type) {
      const [{ nearestShelters }, idx] = await Promise.all([engine, this.index()]);
      const r = SHELTER_CONFIG.radiusKm;
      const dLat = r / 111.2, dLng = r / (111.2 * Math.max(0.05, Math.cos(lat * Math.PI / 180)));
      const cells = idx.cells.filter(({ bbox: [x1, y1, x2, y2] }) => lng + dLng >= x1 && lng - dLng <= x2 && lat + dLat >= y1 && lat - dLat <= y2);
      const chunks = await Promise.all(cells.map((c) => {
        if (!cellCache.has(c.id)) cellCache.set(c.id, getJSON(`${SHELTER_CONFIG.dataUrl}shelters-${c.id}.json`).catch((e) => { cellCache.delete(c.id); throw e; }));
        return cellCache.get(c.id);
      }));
      return nearestShelters(chunks.flat(), { lat, lng }, { types: [type], limit: SHELTER_CONFIG.limit, radiusKm: r });
    }
  };

  // 주소 → 좌표: 사용자가 검색 버튼을 눌렀을 때만 OpenStreetMap Nominatim에 검색어를 보냅니다.
  async function geocode(q) {
    const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=kr&accept-language=ko&q=' + encodeURIComponent(q);
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('geocode');
    const [hit] = await res.json();
    return hit ? { lat: +hit.lat, lng: +hit.lon } : null;
  }

  const fmtDist = (km) => (km < 1 ? Math.round(km * 1000) + 'm' : km.toFixed(1) + 'km');

  /* ---------- UI ---------- */
  let map, layer, results = [], selected = null, origin = null, type = 'earthquake', types = null;
  const $ = (id) => document.getElementById(id);
  const typeInfo = () => types?.[type] || { name: '대피시설', for: '' };

  function setStatus(kind, html) {
    const el = $('shelterStatus');
    el.className = 'shelter-status is-' + kind;
    el.innerHTML = html;
    el.hidden = !html;
    RO.icons();
  }

  function initMap() {
    if (!window.L) {
      $('shelterMap').innerHTML = '<div class="map-fallback"><i data-lucide="map" aria-hidden="true"></i><p>지도를 불러오지 못했어요.<br>목록은 계속 볼 수 있어요.</p></div>';
      RO.icons();
      return;
    }
    map = L.map('shelterMap', { zoomControl: false, scrollWheelZoom: true }).setView([SAMPLE.lat, SAMPLE.lng], 14);
    L.control.zoom({ position: 'bottomleft' }).addTo(map);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; OpenStreetMap contributors · 대피시설: 행정안전부 국민안전24'
    }).addTo(map);
    layer = L.layerGroup().addTo(map);
  }

  const pin = (html, cls) => L.divIcon({ className: 'pin ' + cls, html, iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -28] });
  // 오른쪽 패널에 가리지 않게 지도 범위 맞추기
  const fitPad = () => {
    const panel = document.querySelector('.map-panel');
    const wide = window.matchMedia('(min-width: 1081px)').matches && panel;
    return { paddingTopLeft: [60, 60], paddingBottomRight: [wide ? panel.offsetWidth + 60 : 40, 40], maxZoom: 16 };
  };

  function draw() {
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
             aria-label="${RO.esc(s.name)} 카카오맵 길찾기 (새 창)"><i data-lucide="navigation" aria-hidden="true"></i>길찾기</a>
          <button class="link-act" data-tocard="${RO.esc(s.id)}"><i data-lucide="bookmark-plus" aria-hidden="true"></i>대피 카드에 저장</button>
        </div>
      </li>`).join('');
    RO.icons();

    if (!map || !origin) return;
    const bounds = [[origin.lat, origin.lng]];
    L.marker([origin.lat, origin.lng], { icon: pin('<span></span>', 'pin-me'), title: '기준 위치', zIndexOffset: 1000 }).addTo(layer).bindPopup(RO.esc(origin.label));
    results.forEach((s, i) => {
      const m = L.marker([s.lat, s.lng], { icon: pin(`<span>${i + 1}</span>`, 'pin-real'), title: s.name, keyboard: true }).addTo(layer);
      m.bindPopup(`<b>${RO.esc(s.name)}</b><br>${RO.esc(typeInfo().name)} · ${fmtDist(s.distanceKm)}<br><small>${RO.esc(s.address || '상세주소 미제공')} · 개방 여부 미확인</small>`);
      m.on('click', () => select(s.id, false));
      s._m = m;
      bounds.push([s.lat, s.lng]);
    });
    map.fitBounds(bounds, fitPad());
  }

  function select(id, fromList) {
    selected = id;
    document.querySelectorAll('.sh-item').forEach((li) => li.classList.toggle('is-active', li.dataset.id === id));
    const s = results.find((x) => x.id === id);
    if (!s) return;
    if (fromList && map) { map.flyTo([s.lat, s.lng], 16, { duration: 0.6 }); s._m.openPopup(); }
    if (!fromList) document.querySelector(`.sh-item[data-id="${CSS.escape(id)}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  async function load(lat, lng, label) {
    origin = { lat, lng, label };
    setStatus('loading', '<span class="spinner" aria-hidden="true"></span>주변 대피시설을 찾고 있어요…');
    try {
      results = await ShelterService.search(lat, lng, type);
    } catch {
      results = [];
      draw();
      setStatus('error', '<i data-lucide="alert-circle" aria-hidden="true"></i>대피시설 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
      return;
    }
    selected = null;
    draw();
    $('shelterPrint').disabled = !results.length;
    if (!results.length) {
      setStatus('empty', `<i data-lucide="search-x" aria-hidden="true"></i>반경 ${SHELTER_CONFIG.radiusKm}km 안에 ${RO.esc(typeInfo().name)}이(가) 없어요. 다른 종류나 주소로 찾아보세요.`);
      return;
    }
    setStatus('ok', `<i data-lucide="map-pin" aria-hidden="true"></i><span><b>${RO.esc(label)}</b> 주변 ${RO.esc(typeInfo().name)} ${results.length}곳<br><small>직선거리 순 · 실제 개방 여부는 현장 안내를 확인하세요</small></span>`);
  }

  async function onSearch(e) {
    e.preventDefault();
    const q = $('shelterQuery').value.trim();
    if (!q) { setStatus('error', '<i data-lucide="alert-circle" aria-hidden="true"></i>주소나 장소 이름을 입력해 주세요.'); $('shelterQuery').focus(); return; }
    setStatus('loading', '<span class="spinner" aria-hidden="true"></span>주소를 찾고 있어요…');
    try {
      const hit = await geocode(q);
      if (!hit) {
        setStatus('empty', `<i data-lucide="search-x" aria-hidden="true"></i>"${RO.esc(q)}" 검색 결과가 없어요. 도로명 주소나 동 이름으로 다시 찾아보세요.`);
        return;
      }
      load(hit.lat, hit.lng, q);
    } catch {
      setStatus('error', '<i data-lucide="wifi-off" aria-hidden="true"></i>주소 검색에 실패했어요. 인터넷 연결을 확인하거나 "내 위치"를 눌러 주세요.');
    }
  }

  function useLocation() {
    $('geoDialog').close();
    setStatus('loading', '<span class="spinner" aria-hidden="true"></span>현재 위치를 확인하고 있어요…');
    navigator.geolocation.getCurrentPosition(
      (pos) => load(pos.coords.latitude, pos.coords.longitude, '현재 위치'),
      (err) => {
        setStatus('denied', err.code === 1
          ? '<i data-lucide="map-pin-off" aria-hidden="true"></i><span><b>위치 접근이 거부되었어요.</b> 위 입력창에 주소를 직접 입력해 찾을 수 있어요.</span>'
          : '<i data-lucide="map-pin-off" aria-hidden="true"></i>현재 위치를 확인하지 못했어요. 주소를 직접 입력해 주세요.');
        $('shelterQuery').focus();
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }

  function printList() {
    if (!results.length) return;
    $('shelterPrintArea').innerHTML = `
      <h1>BLACK-OUT 주변 대피시설 — ${RO.esc(typeInfo().name)}</h1>
      <p>기준: ${RO.esc(origin?.label || '')} · 출력일 ${new Date().toLocaleDateString('ko-KR')}</p>
      <table><thead><tr><th>번호</th><th>이름</th><th>주소</th><th>직선거리</th></tr></thead>
      <tbody>${results.map((s, i) => `<tr><td>${i + 1}</td><td>${RO.esc(s.name)}</td><td>${RO.esc(s.address || '상세주소 미제공')}</td><td>${fmtDist(s.distanceKm)}</td></tr>`).join('')}</tbody></table>
      <p>출처: 행정안전부 국민안전24 안전지도 (${RO.esc(index?.retrievedAt || '')} 수집). 실제 개방 여부는 알 수 없으며, 재난 시에는 정부·지자체 안내를 먼저 따르세요.</p>`;
    RO.print('print-shelters');
  }

  function renderTypes() {
    $('shelterTypes').innerHTML = TYPE_TABS.map((t) => `
      <button type="button" class="type-chip ${t.type === type ? 'is-active' : ''}" aria-pressed="${t.type === type}" data-type="${t.type}">
        ${t.label}<small>${types?.[t.type]?.name || ''}</small>
      </button>`).join('');
  }

  async function init() {
    initMap();
    renderTypes();
    engine.then((m) => { types = m.SHELTER_TYPES; renderTypes(); $('shelterSource').href = m.officialShelterUrl(type); }).catch(() => {});
    ShelterService.index().then((i) => { $('shelterDate').textContent = i.retrievedAt; }).catch(() => {});
    $('shelterForm').addEventListener('submit', onSearch);
    $('shelterGeo').addEventListener('click', () => {
      if (!('geolocation' in navigator)) { setStatus('error', '<i data-lucide="alert-circle" aria-hidden="true"></i>이 브라우저는 위치 기능을 지원하지 않아요. 주소를 입력해 주세요.'); return; }
      $('geoDialog').showModal();
    });
    $('geoAllow').addEventListener('click', useLocation);
    $('geoDeny').addEventListener('click', () => {
      $('geoDialog').close();
      setStatus('denied', '<i data-lucide="keyboard" aria-hidden="true"></i>위치 정보를 쓰지 않아요. 주소를 직접 입력해 찾아 주세요.');
      $('shelterQuery').focus();
    });
    $('shelterSample').addEventListener('click', () => load(SAMPLE.lat, SAMPLE.lng, SAMPLE.label));
    $('shelterPrint').addEventListener('click', printList);
    $('shelterTypes').addEventListener('click', (e) => {
      const b = e.target.closest('[data-type]');
      if (!b || b.dataset.type === type) return;
      type = b.dataset.type;
      renderTypes();
      engine.then((m) => { $('shelterSource').href = m.officialShelterUrl(type); });
      if (origin) load(origin.lat, origin.lng, origin.label);
    });
    $('shelterList').addEventListener('click', (e) => {
      const f = e.target.closest('[data-focus]');
      if (f) select(f.dataset.focus, true);
      const c = e.target.closest('[data-tocard]');
      if (c) {
        const s = results.find((x) => x.id === c.dataset.tocard);
        RO.emit('shelter', { name: s.name, address: s.address || '상세주소 미제공', type: typeInfo().name });
        RO.toast('대피 카드에 대피소를 저장했어요');
      }
    });
    setStatus('idle', '<i data-lucide="info" aria-hidden="true"></i>주소를 검색하거나 "내 위치"를 눌러 주변 대피시설을 찾아보세요.');
    // 화면에 들어올 때 지도 크기 재계산, 처음이면 예시 기준점 주변을 보여 줌
    RO.on('view', (id) => {
      if (id !== 'shelter' || !map) return;
      setTimeout(() => {
        map.invalidateSize();
        if (!origin) load(SAMPLE.lat, SAMPLE.lng, SAMPLE.label);
        else if (results.length) draw();
      }, 80);
    });
  }

  RO.shelter = { init, ShelterService, SHELTER_CONFIG };
})(window.RO);
