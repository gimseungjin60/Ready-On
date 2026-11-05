/* READY : ON — 대피소 지도 (Leaflet + OpenStreetMap)
   - 데이터 계층(ShelterService)과 UI를 분리: 실제 API 연결 시 SHELTER_CONFIG만 바꾸면 됩니다.
   - DEMO 모드의 대피소는 검색 위치 주변에 생성한 "예시 데이터"이며 실제 대피소가 아닙니다.
   - 위치 정보는 사용자가 동의한 경우에만 브라우저에서 1회 조회하며 서버로 전송하지 않습니다. */
(function (RO) {
  const SHELTER_CONFIG = {
    mode: 'demo',              // 'demo' | 'api'
    endpoint: '',              // 예: 공공데이터포털/재난안전데이터공유플랫폼 대피소 API URL
    serviceKey: '',            // 발급받은 인증키 (프런트에 노출되므로 운영 시 백엔드 프록시 권장)
    radiusKm: 2
  };
  const DEFAULT_CENTER = [37.5663, 126.9779]; // 지도 초기 화면용 (서울시청), 대피소 표시는 하지 않음

  const TYPES = ['지진 옥외대피장소', '민방위 대피시설', '이재민 임시주거시설', '지진 겸용 임시주거시설'];

  const ShelterService = {
    async search(lat, lng) {
      return SHELTER_CONFIG.mode === 'api' && SHELTER_CONFIG.endpoint
        ? this.fromApi(lat, lng)
        : this.demo(lat, lng);
    },

    // 실제 API 연결부: 응답 필드명은 데이터셋마다 다르므로 normalize()만 맞추면 됩니다.
    async fromApi(lat, lng) {
      const url = new URL(SHELTER_CONFIG.endpoint);
      url.searchParams.set('serviceKey', SHELTER_CONFIG.serviceKey);
      url.searchParams.set('lat', lat);
      url.searchParams.set('lon', lng);
      url.searchParams.set('radius', SHELTER_CONFIG.radiusKm * 1000);
      const res = await fetch(url);
      if (!res.ok) throw new Error('대피소 API 응답 오류: ' + res.status);
      const json = await res.json();
      const rows = json?.response?.body?.items?.item || json?.items || json?.body || [];
      return (Array.isArray(rows) ? rows : [rows]).map(this.normalize).filter((s) => s.lat && s.lng)
        .map((s) => ({ ...s, dist: distKm(lat, lng, s.lat, s.lng) })).sort((a, b) => a.dist - b.dist);
    },
    normalize(row) {
      return {
        id: row.id || row.MNG_SN || row.FCLT_CD || Math.random().toString(36).slice(2),
        name: row.name || row.FCLT_NM || row.REARE_NM || row.vt_acmdfclty_nm || '',
        address: row.address || row.ROAD_NM_ADDR || row.LOTNO_ADDR || row.dtl_adres || '',
        type: row.type || row.FCLT_SE_NM || row.SHLT_SE_NM || '대피시설',
        capacity: row.capacity || row.ACMDT_PSBLTY_NOPE || null,
        lat: parseFloat(row.lat || row.LAT || row.ycord),
        lng: parseFloat(row.lng || row.LOT || row.xcord),
        demo: false
      };
    },

    // DEMO: 검색 위치 기준 고정 패턴으로 예시 지점 생성 (실제 시설 아님)
    async demo(lat, lng) {
      await new Promise((r) => setTimeout(r, 500)); // 로딩 상태 시연
      const offsets = [[0.0031, 0.0018], [-0.0024, 0.0042], [0.0052, -0.0036], [-0.0047, -0.0029], [0.0011, 0.0071]];
      return offsets.map(([dy, dx], i) => {
        const s = {
          id: 'demo-' + i,
          name: `[예시] 대피장소 ${String.fromCharCode(65 + i)}`,
          address: '예시 데이터 · 실제 주소가 아닙니다',
          type: TYPES[i % TYPES.length],
          capacity: [1200, 350, 180, 800, 260][i],
          lat: lat + dy, lng: lng + dx, demo: true
        };
        s.dist = distKm(lat, lng, s.lat, s.lng);
        return s;
      }).sort((a, b) => a.dist - b.dist);
    }
  };

  // 주소 → 좌표: 사용자가 검색 버튼을 눌렀을 때만 OpenStreetMap Nominatim에 검색어를 보냅니다.
  async function geocode(q) {
    const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=kr&accept-language=ko&q=' + encodeURIComponent(q);
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('geocode');
    const [hit] = await res.json();
    return hit ? { lat: +hit.lat, lng: +hit.lon, label: hit.display_name } : null;
  }

  function distKm(a, b, c, d) {
    const R = 6371, toR = (x) => (x * Math.PI) / 180;
    const h = Math.sin(toR(c - a) / 2) ** 2 + Math.cos(toR(a)) * Math.cos(toR(c)) * Math.sin(toR(d - b) / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  const fmtDist = (km) => (km < 1 ? Math.round(km * 1000) + 'm' : km.toFixed(1) + 'km');

  /* ---------- UI ---------- */
  let map, layer, results = [], selected = null, origin = null;
  const $ = (id) => document.getElementById(id);

  function setStatus(kind, html) {
    const el = $('shelterStatus');
    el.className = 'shelter-status is-' + kind;
    el.innerHTML = html;
    el.hidden = !html;
    RO.icons();
  }

  function initMap() {
    if (!window.L) {
      $('shelterMap').innerHTML = '<div class="map-fallback"><i data-lucide="map" aria-hidden="true"></i><p>지도를 불러오지 못했습니다.<br>네트워크 연결을 확인해 주세요. 목록은 계속 이용할 수 있습니다.</p></div>';
      RO.icons();
      return;
    }
    map = L.map('shelterMap', { scrollWheelZoom: false }).setView(DEFAULT_CENTER, 14);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    layer = L.layerGroup().addTo(map);
  }

  const pin = (cls) => L.divIcon({ className: 'pin ' + cls, html: '<span></span>', iconSize: [28, 28], iconAnchor: [14, 28], popupAnchor: [0, -26] });

  function draw() {
    const list = $('shelterList');
    if (layer) layer.clearLayers();
    if (!results.length) { list.innerHTML = ''; return; }

    list.innerHTML = results.map((s) => `
      <li class="sh-item ${selected === s.id ? 'is-active' : ''}" data-id="${s.id}">
        <button class="sh-main" data-focus="${s.id}" aria-label="${RO.esc(s.name)} 지도에서 보기">
          <span class="sh-type">${RO.esc(s.type)}</span>
          <span class="sh-name">${RO.esc(s.name)}${s.demo ? ' <em class="demo-tag">DEMO</em>' : ''}</span>
          <span class="sh-addr">${RO.esc(s.address)}</span>
          <span class="sh-meta">${origin ? '약 ' + fmtDist(s.dist) : ''}${s.capacity ? ' · 수용 ' + s.capacity.toLocaleString() + '명' : ''}</span>
        </button>
        <div class="sh-actions">
          <a class="btn btn-outline btn-xs" target="_blank" rel="noopener"
             href="https://map.kakao.com/link/to/${encodeURIComponent(s.name)},${s.lat},${s.lng}"
             aria-label="${RO.esc(s.name)} 카카오맵 길찾기 (새 창)"><i data-lucide="navigation" aria-hidden="true"></i>길찾기</a>
          <button class="btn btn-outline btn-xs" data-tocard="${s.id}"><i data-lucide="bookmark-plus" aria-hidden="true"></i>대피 카드에 저장</button>
        </div>
      </li>`).join('');
    RO.icons();

    if (!map) return;
    const bounds = [];
    if (origin) {
      L.marker([origin.lat, origin.lng], { icon: pin('pin-me'), title: '기준 위치' }).addTo(layer).bindPopup('기준 위치');
      bounds.push([origin.lat, origin.lng]);
    }
    results.forEach((s) => {
      const m = L.marker([s.lat, s.lng], { icon: pin(s.demo ? 'pin-demo' : 'pin-real'), title: s.name, keyboard: true }).addTo(layer);
      m.bindPopup(`<b>${RO.esc(s.name)}</b><br>${RO.esc(s.type)}<br><small>${RO.esc(s.address)}</small>`);
      m.on('click', () => select(s.id, false));
      s._m = m;
      bounds.push([s.lat, s.lng]);
    });
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
  }

  function select(id, fromList) {
    selected = id;
    document.querySelectorAll('.sh-item').forEach((li) => li.classList.toggle('is-active', li.dataset.id === id));
    const s = results.find((x) => x.id === id);
    if (!s) return;
    if (fromList && map) { map.setView([s.lat, s.lng], 16); s._m.openPopup(); }
    if (!fromList) document.querySelector(`.sh-item[data-id="${id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  async function load(lat, lng, label) {
    origin = { lat, lng, label };
    setStatus('loading', '<span class="spinner" aria-hidden="true"></span>주변 대피소를 찾고 있습니다…');
    try {
      results = await ShelterService.search(lat, lng);
    } catch (e) {
      results = [];
      setStatus('error', '<i data-lucide="alert-circle" aria-hidden="true"></i>대피소 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      draw();
      return;
    }
    selected = null;
    if (!results.length) setStatus('empty', '<i data-lucide="search-x" aria-hidden="true"></i>반경 내 대피소 정보가 없습니다. 다른 주소로 검색해 보세요.');
    else setStatus(results[0].demo ? 'demo' : 'ok', results[0].demo
      ? `<i data-lucide="flask-conical" aria-hidden="true"></i><span><b>DEMO 모드 · 예시 데이터</b> — 표시된 지점은 화면 확인용이며 실제 대피소가 아닙니다. 실제 대피소는 국민재난안전포털(safekorea.go.kr)에서 확인하세요.</span>`
      : `<i data-lucide="check-circle" aria-hidden="true"></i>${RO.esc(label || '기준 위치')} 주변 대피소 ${results.length}곳`);
    draw();
    $('shelterPrint').disabled = !results.length;
  }

  async function onSearch(e) {
    e.preventDefault();
    const q = $('shelterQuery').value.trim();
    if (!q) { setStatus('error', '<i data-lucide="alert-circle" aria-hidden="true"></i>주소나 장소 이름을 입력해 주세요.'); $('shelterQuery').focus(); return; }
    setStatus('loading', '<span class="spinner" aria-hidden="true"></span>주소를 찾고 있습니다…');
    try {
      const hit = await geocode(q);
      if (!hit) {
        results = []; draw();
        setStatus('empty', `<i data-lucide="search-x" aria-hidden="true"></i>"${RO.esc(q)}"에 대한 검색 결과가 없습니다. 도로명 주소나 동 이름으로 다시 검색해 보세요.`);
        return;
      }
      load(hit.lat, hit.lng, q);
    } catch {
      setStatus('error', '<i data-lucide="wifi-off" aria-hidden="true"></i>주소 검색에 실패했습니다. 인터넷 연결을 확인하거나 "내 위치 사용"을 이용해 주세요.');
    }
  }

  function askLocation() {
    if (!('geolocation' in navigator)) {
      setStatus('error', '<i data-lucide="alert-circle" aria-hidden="true"></i>이 브라우저는 위치 기능을 지원하지 않습니다. 주소를 직접 입력해 주세요.');
      return;
    }
    $('geoDialog').showModal();
  }

  function useLocation() {
    $('geoDialog').close();
    setStatus('loading', '<span class="spinner" aria-hidden="true"></span>현재 위치를 확인하고 있습니다…');
    navigator.geolocation.getCurrentPosition(
      (pos) => load(pos.coords.latitude, pos.coords.longitude, '현재 위치'),
      (err) => {
        setStatus('denied', err.code === 1
          ? '<i data-lucide="map-pin-off" aria-hidden="true"></i><span><b>위치 접근이 거부되었습니다.</b> 위 입력창에 주소를 직접 입력해 검색할 수 있어요.</span>'
          : '<i data-lucide="map-pin-off" aria-hidden="true"></i>현재 위치를 확인하지 못했습니다. 주소를 직접 입력해 주세요.');
        $('shelterQuery').focus();
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }

  function printList() {
    if (!results.length) return;
    const demo = results[0].demo;
    $('shelterPrintArea').innerHTML = `
      <h1>READY : ON 대피소 목록</h1>
      <p>기준: ${RO.esc(origin?.label || '')} · 출력일 ${new Date().toLocaleDateString('ko-KR')}</p>
      ${demo ? '<p class="print-warn">※ DEMO 예시 데이터입니다. 실제 대피소가 아닙니다.</p>' : ''}
      <table><thead><tr><th>이름</th><th>유형</th><th>주소</th><th>거리</th></tr></thead>
      <tbody>${results.map((s) => `<tr><td>${RO.esc(s.name)}</td><td>${RO.esc(s.type)}</td><td>${RO.esc(s.address)}</td><td>${fmtDist(s.dist)}</td></tr>`).join('')}</tbody></table>
      <p>실제 재난 시에는 정부·지자체의 안내를 우선 따르세요.</p>`;
    RO.print('print-shelters');
  }

  function init() {
    initMap();
    $('shelterForm').addEventListener('submit', onSearch);
    $('shelterGeo').addEventListener('click', askLocation);
    $('geoAllow').addEventListener('click', useLocation);
    $('geoDeny').addEventListener('click', () => {
      $('geoDialog').close();
      setStatus('denied', '<i data-lucide="keyboard" aria-hidden="true"></i>위치 정보를 사용하지 않습니다. 주소를 직접 입력해 검색해 주세요.');
      $('shelterQuery').focus();
    });
    $('shelterDemo').addEventListener('click', () => load(DEFAULT_CENTER[0], DEFAULT_CENTER[1], '서울시청 (예시 기준점)'));
    $('shelterPrint').addEventListener('click', printList);
    $('shelterList').addEventListener('click', (e) => {
      const f = e.target.closest('[data-focus]');
      if (f) select(f.dataset.focus, true);
      const c = e.target.closest('[data-tocard]');
      if (c) {
        const s = results.find((x) => x.id === c.dataset.tocard);
        RO.emit('shelter', { name: s.name, address: s.address, type: s.type, demo: s.demo });
        RO.toast('대피 카드에 대피소를 저장했습니다');
      }
    });
    setStatus('idle', '<i data-lucide="info" aria-hidden="true"></i>주소를 검색하거나 "내 위치 사용"을 눌러 주변 대피소를 확인하세요.');
    // 숨겨진 화면에서 만든 지도는 크기가 0이므로, 화면에 들어올 때 다시 계산
    RO.on('view', (id) => { if (id === 'shelter' && map) setTimeout(() => { map.invalidateSize(); if (results.length) draw(); }, 80); });
  }

  RO.shelter = { init, ShelterService, SHELTER_CONFIG };
})(window.RO);
