# 집 재료 제작 — 합치기 안내

블랙아웃 §03(집 재료 스캐너 + 제작 가이드 10종)만 떼어 낸 조각입니다.
파일 3개를 넣고 두 줄을 추가하면 끝입니다.

## 1. 파일 복사

```
share/make.css  →  css/make.css
share/make.js   →  js/make.js
share/make.html →  (내용을 페이지 원하는 자리에 붙여넣기)
```

## 2. index.html 에 두 줄 추가

```html
<head>
  ...
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
  <link rel="stylesheet" href="css/make.css">
</head>
<body>
  ...
  <!-- 여기에 make.html 내용 붙여넣기 -->
  <script src="js/make.js"></script>
</body>
```

폰트 링크는 이미 다른 폰트를 쓰고 있으면 생략해도 됩니다 (기본 고딕으로 대체).

## 3. 충돌 걱정 없는 이유

- `make.css` 의 **모든 선택자가 `#make-tool` 안으로 한정**돼 있습니다. `.card`, `.btn`, `.tag` 같은 흔한 클래스명을 써도 기존 CSS 와 섞이지 않습니다.
- 색·간격 토큰도 `:root` 가 아니라 `#make-tool` 에 선언돼 있어 바깥에 새지 않습니다.
- `make.js` 는 즉시실행 함수 하나로 전역을 더럽히지 않고, `#make-tool` 이 없는 페이지에서는 아무 일도 하지 않습니다.
- 저장은 `localStorage['blackout.make.v1']` 하나만 씁니다.

## 4. 고치는 곳

| 무엇 | 어디 |
|---|---|
| 재료 품목 · 레시피 | `js/make.js` 맨 위 `DATA` |
| 가이드 본문 · 안전 경고 · SVG 도해 | `make.html` 본문 |
| 색 · 폰트 · 간격 | `css/make.css` 맨 위 `#make-tool` 블록 |

## 5. 들어 있는 것

- 집 재료 35품목 체크 → 제작 가능 11종 실시간 판정, 부족 재료 표시
- 제작 가이드 10종 (간이 소화기 · 질식 소화 · 자전거 발전기 · 소금물 전지 · 페트병 정수기 · 캔 램프 · 간이 화장실 · 지혈/부목 · 구조 신호 · 단열 텐트)
- 메커니즘 SVG 도해 3장 (화재 삼각형 / 발전기 계통 / 정수 필터 단면)
- 항목별 안전 경고 (기름 화재에 물 금지, 실내 연소 금지, 여과≠살균 등)
- 인쇄/PDF 레이아웃 포함

## 면책

해커톤 시연용 교육 자료입니다. 실제 재난 시 119 신고와 공식 지침(국민재난안전포털)이 항상 우선합니다.
자가 제작물은 정식 장비의 대체품이 아니며, 화재·전기·의료 항목은 각 안전 경고를 반드시 함께 읽어야 합니다.
