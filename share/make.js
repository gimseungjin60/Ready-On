/* ============================================================
   집 재료 제작 (블랙아웃 §03) — 스캐너 로직
   의존성 없음. #make-tool 블록이 있으면 동작하고, 없으면 조용히 끝납니다.
   재료·레시피 수정은 이 파일 맨 위 DATA 에서 합니다.
   ============================================================ */
(function () {
  'use strict';

  var root = document.getElementById('make-tool');
  if (!root) return;

  var DATA = {
 "MATCATS": [
  {
   "id": "kitchen",
   "n": "주방",
   "items": [
    [
     "bakingsoda",
     "베이킹소다"
    ],
    [
     "vinegar",
     "식초"
    ],
    [
     "salt",
     "소금"
    ],
    [
     "oil_cooking",
     "식용유"
    ],
    [
     "foil",
     "알루미늄 포일"
    ],
    [
     "can_tin",
     "빈 깡통·참치캔"
    ],
    [
     "jar_glass",
     "유리병·유리컵"
    ],
    [
     "bottle_pet",
     "페트병"
    ],
    [
     "pot_lid",
     "냄비·뚜껑"
    ],
    [
     "plastic_bag",
     "비닐봉지"
    ],
    [
     "coffee_filter",
     "커피필터·거름망"
    ]
   ]
  },
  {
   "id": "clean",
   "n": "청소 · 욕실",
   "items": [
    [
     "bleach",
     "가정용 락스"
    ],
    [
     "towel",
     "수건·헌 옷"
    ],
    [
     "bucket",
     "양동이"
    ],
    [
     "tape",
     "청테이프"
    ],
    [
     "newspaper",
     "신문지"
    ],
    [
     "cardboard",
     "골판지 박스"
    ],
    [
     "rope",
     "노끈·빨래줄"
    ],
    [
     "sawdust",
     "톱밥·반려동물 모래"
    ]
   ]
  },
  {
   "id": "tools",
   "n": "공구 · 전기",
   "items": [
    [
     "wire_copper",
     "전선·구리선"
    ],
    [
     "nail",
     "못·나사"
    ],
    [
     "dc_motor",
     "폐전자기기 DC모터"
    ],
    [
     "bicycle",
     "자전거"
    ],
    [
     "car_usb",
     "차량용 USB 충전기"
    ],
    [
     "led",
     "LED·손전등"
    ],
    [
     "lighter",
     "라이터·성냥"
    ],
    [
     "scissors",
     "가위·칼"
    ],
    [
     "hanger",
     "철사 옷걸이"
    ],
    [
     "stick",
     "나무막대"
    ]
   ]
  },
  {
   "id": "misc",
   "n": "야외 · 기타",
   "items": [
    [
     "sand",
     "모래·흙"
    ],
    [
     "gravel",
     "자갈"
    ],
    [
     "charcoal",
     "숯·활성탄"
    ],
    [
     "gauze",
     "거즈·생리대"
    ],
    [
     "blanket",
     "담요"
    ],
    [
     "rubberband",
     "고무밴드"
    ]
   ]
  }
 ],
 "PRESET": [
  "salt",
  "oil_cooking",
  "foil",
  "can_tin",
  "jar_glass",
  "bottle_pet",
  "pot_lid",
  "plastic_bag",
  "coffee_filter",
  "bleach",
  "towel",
  "bucket",
  "tape",
  "newspaper",
  "cardboard",
  "rope",
  "scissors",
  "lighter",
  "led",
  "hanger",
  "gauze",
  "blanket",
  "rubberband"
 ],
 "RECIPES": [
  {
   "id": "fireext",
   "g": "g-fireext",
   "n": "간이 분말 소화기",
   "req": [
    {
     "l": "베이킹소다",
     "any": [
      "bakingsoda"
     ]
    },
    {
     "l": "소금",
     "any": [
      "salt"
     ]
    },
    {
     "l": "용기",
     "any": [
      "bottle_pet",
      "jar_glass",
      "can_tin"
     ]
    },
    {
     "l": "테이프",
     "any": [
      "tape"
     ]
    }
   ]
  },
  {
   "id": "smother",
   "g": "g-smother",
   "n": "질식 소화 덮개",
   "req": [
    {
     "l": "덮을 것",
     "any": [
      "pot_lid",
      "towel",
      "blanket"
     ]
    },
    {
     "l": "분말·모래",
     "any": [
      "bakingsoda",
      "salt",
      "sand"
     ]
    }
   ]
  },
  {
   "id": "bikegen",
   "g": "g-bikegen",
   "n": "자전거 발전기",
   "req": [
    {
     "l": "자전거",
     "any": [
      "bicycle"
     ]
    },
    {
     "l": "DC 모터",
     "any": [
      "dc_motor"
     ]
    },
    {
     "l": "전선",
     "any": [
      "wire_copper"
     ]
    },
    {
     "l": "차량용 USB",
     "any": [
      "car_usb"
     ]
    },
    {
     "l": "벨트용 끈",
     "any": [
      "rope",
      "rubberband"
     ]
    },
    {
     "l": "테이프",
     "any": [
      "tape"
     ]
    }
   ]
  },
  {
   "id": "saltcell",
   "g": "g-saltcell",
   "n": "소금물 전지 비상등",
   "req": [
    {
     "l": "소금",
     "any": [
      "salt"
     ]
    },
    {
     "l": "구리선",
     "any": [
      "wire_copper"
     ]
    },
    {
     "l": "못",
     "any": [
      "nail"
     ]
    },
    {
     "l": "유리컵",
     "any": [
      "jar_glass",
      "bottle_pet"
     ]
    },
    {
     "l": "LED",
     "any": [
      "led"
     ]
    }
   ]
  },
  {
   "id": "waterfilter",
   "g": "g-waterfilter",
   "n": "페트병 3단 여과기",
   "req": [
    {
     "l": "페트병",
     "any": [
      "bottle_pet"
     ]
    },
    {
     "l": "자갈",
     "any": [
      "gravel"
     ]
    },
    {
     "l": "모래",
     "any": [
      "sand"
     ]
    },
    {
     "l": "숯·활성탄",
     "any": [
      "charcoal"
     ]
    },
    {
     "l": "천·필터",
     "any": [
      "coffee_filter",
      "towel",
      "gauze"
     ]
    }
   ]
  },
  {
   "id": "chlorine",
   "g": "g-waterfilter",
   "n": "염소 소독수 (락스)",
   "req": [
    {
     "l": "가정용 락스",
     "any": [
      "bleach"
     ]
    },
    {
     "l": "용기",
     "any": [
      "bottle_pet",
      "bucket",
      "jar_glass"
     ]
    }
   ]
  },
  {
   "id": "canlamp",
   "g": "g-canlamp",
   "n": "식용유 캔 램프",
   "req": [
    {
     "l": "식용유",
     "any": [
      "oil_cooking"
     ]
    },
    {
     "l": "용기",
     "any": [
      "can_tin",
      "jar_glass"
     ]
    },
    {
     "l": "면 심지",
     "any": [
      "towel",
      "rope",
      "gauze"
     ]
    },
    {
     "l": "점화구",
     "any": [
      "lighter"
     ]
    }
   ]
  },
  {
   "id": "toilet",
   "g": "g-toilet",
   "n": "간이 화장실",
   "req": [
    {
     "l": "양동이",
     "any": [
      "bucket"
     ]
    },
    {
     "l": "비닐봉지",
     "any": [
      "plastic_bag"
     ]
    },
    {
     "l": "흡수재",
     "any": [
      "sawdust",
      "sand",
      "newspaper"
     ]
    },
    {
     "l": "테이프",
     "any": [
      "tape"
     ]
    }
   ]
  },
  {
   "id": "firstaid",
   "g": "g-firstaid",
   "n": "지혈대 · 부목",
   "req": [
    {
     "l": "천·거즈",
     "any": [
      "towel",
      "gauze"
     ]
    },
    {
     "l": "막대",
     "any": [
      "stick",
      "hanger"
     ]
    },
    {
     "l": "고정재",
     "any": [
      "tape",
      "rope"
     ]
    },
    {
     "l": "가위",
     "any": [
      "scissors"
     ]
    }
   ]
  },
  {
   "id": "thermal",
   "g": "g-thermal",
   "n": "단열 텐트",
   "req": [
    {
     "l": "골판지",
     "any": [
      "cardboard"
     ]
    },
    {
     "l": "신문지",
     "any": [
      "newspaper"
     ]
    },
    {
     "l": "포일",
     "any": [
      "foil"
     ]
    },
    {
     "l": "담요",
     "any": [
      "blanket"
     ]
    },
    {
     "l": "테이프",
     "any": [
      "tape"
     ]
    }
   ]
  },
  {
   "id": "signal",
   "g": "g-signal",
   "n": "반사판 구조 신호",
   "req": [
    {
     "l": "포일",
     "any": [
      "foil"
     ]
    },
    {
     "l": "골판지",
     "any": [
      "cardboard"
     ]
    },
    {
     "l": "가위",
     "any": [
      "scissors"
     ]
    }
   ]
  }
 ]
};

  var MATCATS = DATA.MATCATS, PRESET = DATA.PRESET, RECIPES = DATA.RECIPES;
  var KEY = 'blackout.make.v1';
  var inv = {};

  function $(s) { return root.querySelector(s); }
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  var smooth = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

  function load() {
    try { var raw = localStorage.getItem(KEY); if (raw) inv = JSON.parse(raw) || {}; } catch (e) {}
    if (!inv || !Object.keys(inv).length) { inv = {}; PRESET.forEach(function (id) { inv[id] = true; }); }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(inv)); } catch (e) {} }

  function renderMats() {
    var w = $('#matGroups'); if (!w) return;
    w.innerHTML = '';
    MATCATS.forEach(function (g) {
      var box = el('div', 'matgroup');
      box.appendChild(el('div', 'mg', '<b>' + esc(g.n) + '</b><span class="tag" data-cnt="' + g.id + '"></span>'));
      var chips = el('div', 'chips');
      g.items.forEach(function (m) {
        var id = 'm-' + m[0];
        var lab = el('label', 'chip');
        lab.setAttribute('for', id);
        lab.innerHTML = '<input type="checkbox" id="' + id + '"' + (inv[m[0]] ? ' checked' : '') + '><span>' + esc(m[1]) + '</span>';
        lab.querySelector('input').addEventListener('change', function (ev) {
          if (ev.target.checked) inv[m[0]] = true; else delete inv[m[0]];
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
      if (!g.any.some(function (id) { return !!inv[id]; })) missing.push(g.l);
    });
    return { ok: missing.length === 0, missing: missing, have: r.req.length - missing.length, total: r.req.length };
  }

  function openGuide(gid) {
    var g = document.getElementById(gid);
    if (!g) return;
    g.open = true;
    g.classList.remove('flash');
    requestAnimationFrame(function () {
      g.scrollIntoView({ behavior: smooth, block: 'start' });
      g.classList.add('flash');
    });
  }

  function matchAll() {
    var list = $('#matchList'); if (!list) return;
    var ok = 0;
    list.innerHTML = '';
    var rows = RECIPES.map(function (r) { return { r: r, e: evalRecipe(r) }; });
    rows.sort(function (a, b) { return (b.e.have / b.e.total) - (a.e.have / a.e.total); });
    rows.forEach(function (x) {
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
      var n = g.items.filter(function (m) { return !!inv[m[0]]; }).length;
      var tag = root.querySelector('[data-cnt="' + g.id + '"]');
      if (tag) tag.textContent = n + ' / ' + g.items.length;
    });

    root.querySelectorAll('.matchtag').forEach(function (t) {
      var r = null;
      for (var i = 0; i < RECIPES.length; i++) { if (RECIPES[i].id === t.dataset.for) { r = RECIPES[i]; break; } }
      if (!r) return;
      var ev = evalRecipe(r);
      t.className = 'matchtag tag ' + (ev.ok ? 'ok' : 'warn');
      t.textContent = ev.ok ? '재료 있음' : '재료 ' + ev.missing.length + '개 부족';
    });
  }

  var bPreset = $('#invPreset'), bClear = $('#invClear');
  if (bPreset) bPreset.addEventListener('click', function () {
    inv = {}; PRESET.forEach(function (id) { inv[id] = true; });
    save(); renderMats(); matchAll();
  });
  if (bClear) bClear.addEventListener('click', function () { inv = {}; save(); renderMats(); matchAll(); });

  load();
  renderMats();
  matchAll();
})();
