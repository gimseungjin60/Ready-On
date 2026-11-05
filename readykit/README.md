# 준비 · 재난 대비 계산 위젯

재난 선택, 위치 지정, 물품 수량 계산, 가까운 대피시설을 한 화면에 구현했습니다. 회원가입·결제·별도 상세 페이지는 없습니다.

## 실행

Node.js 22 이상에서 `npm start` 후 `http://127.0.0.1:4173`을 여세요. 빌드나 패키지 설치는 필요하지 않습니다. `dist/`를 정적 호스팅에 그대로 배포할 수 있습니다. 모듈과 JSON을 읽기 때문에 `file://`로 열지 않습니다.

검증: `npm test`.

## 기존 사이트에 넣기

기존 사이트의 `/readykit/` 경로에 `dist/` 내용물을 복사한 다음 iframe을 삽입하세요. 위치 권한을 쓰려면 HTTPS 및 iframe의 `allow="geolocation"`이 필요하며, 브라우저와 상위 사이트 Permissions-Policy도 위치 기능을 허용해야 합니다.

```html
<iframe id="readykit"
  src="/readykit/?embed=1"
  title="재난 대비 물품 계산기"
  allow="geolocation"
  style="width:100%;height:1500px;border:0">
</iframe>
```

`embed=1`은 헤더와 소개 문구를 숨깁니다. iframe 높이는 상위 사이트의 레이아웃에 맞춰 지정하세요. Sites의 초기 배포는 소유자 전용이므로 일반 방문자에게 제공할 때는 자체 호스팅한 이 폴더를 사용하거나 별도로 접근 범위를 설정해야 합니다.

## 결과와 선택 이벤트

같은 출처 iframe에는 별도 설정이 필요하지 않습니다. 다른 출처에서 삽입할 때는 `dist/config.js`의 `parentOrigin`에 상위 사이트의 정확한 출처를 지정하세요. 와일드카드 전송은 사용하지 않습니다.

```js
window.READYKIT_CONFIG = {
  parentOrigin: 'https://your-site.example',
  // shareLocation: true, // 기본 false: 결과에 정확한 사용자 좌표를 보내지 않음
};
```

상위 페이지에서 `event.origin`과 `event.source`를 모두 검증하세요.

```js
const frame = document.getElementById('readykit');
const widgetOrigin = new URL(frame.src, location.href).origin;
window.addEventListener('message', event => {
  if (event.origin !== widgetOrigin || event.source !== frame.contentWindow) return;
  if (event.data?.type === 'readykit:select') {
    const { kit, shelters } = event.data.payload;
    // kit.items: id, name, required, quantity, unit, packSize, shared 등
    // 여기에서 기존 사이트의 장바구니, 폼, 저장 기능으로 연결합니다.
    console.log(kit, shelters);
  }
});
```

`readykit:change`는 계산 조건 또는 대피시설 결과가 바뀔 때, `readykit:select`는 ‘이 구성 선택’을 누를 때 전달됩니다. 같은 문서에서는 동일한 이름의 `CustomEvent`와 `config.js`의 `onChange`, `onSelect` 콜백을 사용할 수 있습니다. ‘선택 완료’는 현재 화면의 선택 상태이며 서버 저장이나 구매를 의미하지 않습니다.

## 상위 사이트에서 위치·조건 전달

```js
frame.addEventListener('load', () => {
  frame.contentWindow.postMessage({
    type: 'readykit:set-context',
    payload: {
      hazards: ['flood'],
      location: { lat: 37.5663, lng: 126.9779 },
      // accessibility: { supply: 0.7, road: 0.8, season: 0.5 }
    }
  }, widgetOrigin);
});
```

설정 가능한 재난: `all`, `war`, `flood`, `quake`, `typhoon`, `fire`, `cold`, `heat`, `outage`.
접근성 입력은 선택 사항이며 supply, road, season을 모두 0~1 숫자로 전달해야 합니다. 공급 접근 제약 45%, 도로 접근 제약 40%, 계절 접근 제약 15%로 서비스 점수를 계산합니다. 실제 위험 예측 모델로 검증된 가중치가 아닙니다.

문서 내부에서는 `await window.ReadyKit.ready`, `window.ReadyKit.setContext(...)`, `window.ReadyKit.getResult()`를 사용할 수 있습니다.

## 계산 엔진만 사용

`dist/engine.mjs`는 DOM, 네트워크, 외부 라이브러리에 의존하지 않습니다. 브라우저와 Node.js에서 공통으로 사용할 수 있습니다.

```js
import { calculateKit } from './dist/engine.mjs';
const kit = calculateKit({
  hazards: ['quake'],
  region: { code: '51760', name: '평창군', label: '강원 평창군' },
  policy: { minimumDays: 7 }
});
```

수량 기준은 `POLICY`와 물품별 규칙에 있습니다. 지역 경계는 실제 공개 경계를 사용하지만, 시·구 3일 / 군 7일 / 울릉군 14일은 **서비스 계획 가정**입니다. 실제 도로 단절, 홍수 위험도, 기상특보, 구조 도착시간은 연동하지 않았습니다. 위치 미확인·해외 등 지원 지역 밖은 임시 7일입니다.

물 4L/일은 CDC의 1 US gallon/인·일 비축 안내를 올림한 값입니다. 식량은 2,000kcal/일과 4,000kcal/kg의 가정이며 500g 단위로 올림합니다. 다른 소모품과 장비 수량도 검증 전 제품 구성값입니다. 실제 식품의 열량·영양, 장비 사양, 공식 재난별 권고 기간을 확인한 뒤 운영 정책에 반영하세요. 소화기 1대는 구성값이며 건물 전체 소방설비 산정값이 아닙니다.

## 지도와 주소 검색

기본 지도는 Leaflet 1.9.4와 OpenStreetMap입니다. `vendor/`에 라이브러리와 라이선스를 포함했습니다. 상단 위치 영역에서 지도 클릭으로 바로 선택하며 장소 선택 후 줌 16으로 확대합니다. 첫 지도는 서울역 주변(줌 15)을 보여주되 실제 사용자 위치로 간주하지 않습니다. 현재 위치는 브라우저 동의가 있어야 사용할 수 있습니다.

장소명·주소 검색은 Photon 공개 API를 사용하고, 256개 공식 행정구역 검색을 함께 제공합니다. ‘서울역’처럼 이름이 같은 역 시설은 1km 내에서 중복 제거하며 단일 결과는 바로 선택합니다. 여러 결과는 주소를 함께 표시해 선택할 수 있습니다. 검색어 제출 시에만 요청하며 자동완성 요청은 하지 않습니다. 좌표 입력과 지도 클릭도 사용할 수 있습니다.

위치 선택 지도와 대피시설 지도는 별도로 표시합니다. 대피시설의 ‘시설 전체 보기’는 선택 위치와 조회된 시설이 모두 보이도록 범위를 맞춥니다. 공식 개략 경계 자료에 작은 틈이 있는 경우 500m 이내 가장 가까운 경계의 비축 정책을 사용하고 ‘경계 자료 기준 추정’이라고 표시합니다. 이는 행정구역 확정이나 위험 판정이 아니며 사용자 좌표를 변경하지 않습니다.

카카오 지도를 쓰려면 `config.js`에 본인 앱의 `kakaoJavaScriptKey`를 지정하고 Kakao Developers에 실제 웹 도메인을 등록하세요. 그러면 카카오 지도, 키워드·주소 통합 검색 및 MT1(마트)·CS2(편의점) 카테고리 검색을 사용하며, SDK 로딩 실패 시 기본 지도로 복구합니다. **이 키는 브라우저용 JavaScript 키이며 REST API 비밀 키를 넣으면 안 됩니다.** 카카오 연동은 키가 없어 실계정 검증하지 못했습니다.

OSM 타일은 사용자가 보는 영역만 요청합니다. 타일 사전 다운로드·오프라인 저장은 하지 않습니다. 외부 폰트 실패 시 시스템 글꼴을 사용합니다. 상용 트래픽이 늘면 타일 공급자를 검토하고 `config.js`의 `tileUrl`을 바꾸세요. 타일 제공자 교체 시 출처 표기도 함께 변경해야 합니다.

## 주변 마트·편의점

기본 구성은 [Photon](https://github.com/komoot/photon)의 `/reverse` API에서 `shop:supermarket`, `shop:convenience`를 조회합니다. 선택 위치 반경 3km 내 최대 50개 응답에서 중복·잘못된 좌표를 제거하고 직선거리 순으로 최대 8개를 보여줍니다. 매장 종류로 필터링할 수 있고, ‘지도에서 보기’는 선택 위치를 바꾸지 않고 매장으로 지도만 이동합니다. 대피소는 초록 번호, 매장은 주황 M 번호입니다.

공개 OSM 자료에는 누락·폐점·분류 오류가 있을 수 있습니다. 매장 재고·현재 영업 여부·장비별 판매 여부는 연동하지 않았습니다. 조회 실패와 결과 없음은 구분합니다. 결과 이벤트 스키마 1.1에 `shops`, `shopSource`가 추가되었습니다.

검색어와 선택 위치는 외부 Photon 또는 Kakao에 전송됩니다. 이 위젯은 위치를 서버·브라우저 저장소에 저장하지 않습니다. 동일 조회는 메모리에서 5분 캐시하고 Photon 요청 간 최소 1.1초 간격을 둡니다. [Photon 공개 서버 정책](https://github.com/komoot/photon#demo-server)은 적정 요청량만 허용하고 가용성을 보장하지 않으므로, 운영 트래픽이 커지면 `config.js`의 `photonBaseUrl`을 자체 Photon 서버로 교체하거나 카카오 키를 연결하세요. `/api/`, `/reverse`와 CORS를 지원하는 공급자가 필요합니다.

## 대피시설 데이터

출처: [행정안전부 국민안전24 안전지도](https://www.safekorea.go.kr/safekorea-kor/flsm/flsm/facilitiesSafteyMap.do?menuSn=2).

2026-11-05에 공개 지도 조회 결과를 수집한 정적 스냅샷입니다. 유형은 민방위 대피소, 지진 옥외대피장소, 이재민 임시주거시설, 무더위쉼터, 한파쉼터입니다. 공개 결과에서 유효한 대한민국 좌표만 사용하고, 같은 유형·이름·좌표의 중복을 제거했습니다. 개인 이름, 담당자 ID, 연락처 등은 배포 데이터에 포함하지 않습니다. 면적을 수용 가능 인원으로 오인하지 않으며 실시간 개방·혼잡도는 표시하지 않습니다.

반경 30km 내 해당 유형의 시설 중 직선거리 순 5개를 보여줍니다. 직선거리는 도보 경로나 이동 안전성을 보장하지 않습니다. 홍수·태풍·화재·정전에는 임시주거시설, 지진에는 옥외대피장소, 전쟁에는 민방위 대피소를 표시합니다. 임시주거시설 지정은 재난 발생 시 즉시 개방된다는 뜻이 아닙니다. 조회 실패와 검색 결과 없음은 별도 상태입니다.

원문 주소가 없는 시설은 ‘상세주소 미제공’으로 표시하고 공개 좌표를 제공합니다. 수집 시점과 원문 수정일은 구분합니다. 정기 갱신 작업은 이번 범위에 포함하지 않았습니다. `scripts/fetch-shelters.mjs`와 `scripts/prepare-data.mjs`로 수동 갱신할 수 있습니다. 공개 웹 조회 구조가 변경되면 수집기를 점검하거나 정식 공공데이터 API 어댑터로 교체하세요.

## 참고 자료

- [CDC 물 비축 안내](https://www.cdc.gov/water-emergency/about/how-to-create-and-store-an-emergency-water-supply.html)
- [카카오 지도 Geolocation 예제](https://apis.map.kakao.com/web/sample/geolocationMarker/)
- [OpenStreetMap 타일 정책](https://operations.osmfoundation.org/policies/tiles/)
- `dist/data/shelters-index.json`: 수집일, 유형별 정제 건수, 공간 분할 목록

정확한 사용자 위치는 메모리에서만 계산에 사용하며 저장하지 않습니다. 지도 공급자는 지도 로딩 과정에서 요청 범위와 네트워크 정보를 수신합니다. 이 위젯은 완전한 오프라인 지도를 제공하지 않습니다.
