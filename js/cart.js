/* BLACK-OUT — 장바구니 (localStorage 유지, 우측 드로어, 결제 준비 안내)
   상태 형태: [{ id, qty }] — 상품 정보는 RO.products.find(id)로 조회 */
(function (RO) {
  const KEY = 'cart';
  const MAX_QTY = 99;
  let lines = (RO.store.get(KEY, []) || []).filter((l) => l && typeof l.id === 'string' && l.qty > 0);

  const save = () => {
    RO.store.set(KEY, lines);
    render();
    RO.emit('cart', lines);
  };

  const count = () => lines.reduce((n, l) => n + l.qty, 0);
  const total = () => lines.reduce((sum, l) => {
    const p = RO.products.find(l.id);
    return p ? sum + p.price * l.qty : sum;
  }, 0);

  function add(ids, btn) {
    const added = [];
    ids.forEach((id) => {
      const p = RO.products.find(id);
      if (!p) return;
      const line = lines.find((l) => l.id === id);
      if (line) line.qty = Math.min(MAX_QTY, line.qty + 1);
      else lines.push({ id, qty: 1 });
      added.push(p.name);
    });
    if (!added.length) return;
    save();
    if (btn) feedback(btn);
    RO.toast(added.length > 1 ? `${added[0]} 외 ${added.length - 1}개를 담았습니다` : `${added[0]}을(를) 담았습니다`);
    bump();
  }

  // 담기 효과: 버튼 → 장바구니 아이콘으로 빨간 점이 날아감 + 버튼 문구 잠깐 변경
  function feedback(btn) {
    const cartBtn = [...document.querySelectorAll('.cart-btn')].find((b) => b.offsetParent);
    const from = btn.getBoundingClientRect();
    if (cartBtn && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const to = cartBtn.getBoundingClientRect();
      const dot = document.createElement('span');
      dot.className = 'fly-dot';
      document.body.appendChild(dot);
      const x0 = from.left + from.width / 2, y0 = from.top + from.height / 2;
      const x1 = to.left + to.width / 2, y1 = to.top + to.height / 2;
      dot.animate([
        { transform: `translate(${x0}px, ${y0}px) scale(1)` },
        { transform: `translate(${(x0 + x1) / 2}px, ${Math.min(y0, y1) - 120}px) scale(1.3)`, offset: 0.5 },
        { transform: `translate(${x1}px, ${y1}px) scale(.4)`, opacity: 0.6 }
      ], { duration: 700, easing: 'cubic-bezier(.5,0,.3,1)' }).finished.then(() => {
        dot.remove();
        cartBtn.classList.remove('is-shake'); void cartBtn.offsetWidth; cartBtn.classList.add('is-shake');
      });
    }
    if (btn.classList.contains('icon-btn')) return;
    if (!btn.dataset.html) btn.dataset.html = btn.innerHTML;
    btn.classList.add('is-added');
    btn.innerHTML = '<i data-lucide="check" aria-hidden="true"></i>담았어요';
    RO.icons();
    clearTimeout(btn._t);
    btn._t = setTimeout(() => { btn.classList.remove('is-added'); btn.innerHTML = btn.dataset.html; delete btn.dataset.html; RO.icons(); }, 1300);
  }

  // 여러 상품을 수량과 함께 한 번에 담기 (맞춤 키트 → 장바구니)
  function addMany(list, btn) {
    list.forEach(({ id, qty }) => {
      if (!RO.products.find(id) || qty <= 0) return;
      const line = lines.find((l) => l.id === id);
      if (line) line.qty = Math.min(MAX_QTY, line.qty + qty);
      else lines.push({ id, qty: Math.min(MAX_QTY, qty) });
    });
    save();
    if (btn) feedback(btn);
  }

  // 테스트 주문: 실제 결제·배송 없음. 주문번호에 TEST를 붙여 실제 주문과 구분
  function testOrder() {
    const no = 'TEST-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    document.getElementById('checkoutBody').innerHTML = `
      <div class="test-order">
        <p class="to-badge">테스트 주문 · 실제 주문 아님</p>
        <p>주문번호 <b>${no}</b></p>
        <p>결제·배송은 일어나지 않아요. 시연을 위해 장바구니만 비웠어요.</p>
      </div>`;
    document.getElementById('testOrderBtn').hidden = true;
    lines = [];
    save();
  }

  function setQty(id, qty) {
    const line = lines.find((l) => l.id === id);
    if (!line) return;
    if (qty <= 0) lines = lines.filter((l) => l.id !== id);
    else line.qty = Math.min(MAX_QTY, qty);
    save();
  }

  function bump() {
    document.querySelectorAll('.cart-count').forEach((el) => {
      el.classList.remove('is-bump');
      void el.offsetWidth; // 애니메이션 재시작
      el.classList.add('is-bump');
    });
  }

  function lineHTML(l) {
    const p = RO.products.find(l.id);
    if (!p) return '';
    const media = p.img
      ? `<img src="${p.img}" alt="" width="72" height="72">`
      : `<span class="cart-icon"><i data-lucide="${p.icon}" aria-hidden="true"></i></span>`;
    return `
      <li class="cart-line">
        ${media}
        <div class="cart-line-body">
          <p class="cart-line-name">${p.name}</p>
          <p class="cart-line-price">${RO.won(p.price)}</p>
          <div class="qty" role="group" aria-label="${p.name} 수량">
            <button type="button" data-qty="${l.id}" data-delta="-1" aria-label="수량 줄이기"><i data-lucide="minus" aria-hidden="true"></i></button>
            <input type="number" min="1" max="${MAX_QTY}" value="${l.qty}" data-qty-input="${l.id}" aria-label="${p.name} 수량 입력">
            <button type="button" data-qty="${l.id}" data-delta="1" aria-label="수량 늘리기"><i data-lucide="plus" aria-hidden="true"></i></button>
          </div>
        </div>
        <div class="cart-line-end">
          <p class="cart-line-sum">${RO.won(p.price * l.qty)}</p>
          <button type="button" class="link-btn" data-remove="${l.id}" aria-label="${p.name} 삭제">삭제</button>
        </div>
      </li>`;
  }

  function render() {
    const n = count();
    document.querySelectorAll('.cart-count').forEach((el) => {
      el.textContent = n;
      el.hidden = n === 0;
    });
    const list = document.getElementById('cartList');
    const empty = document.getElementById('cartEmpty');
    const foot = document.getElementById('cartFoot');
    empty.hidden = lines.length > 0;
    foot.hidden = lines.length === 0;
    list.innerHTML = lines.map(lineHTML).join('');
    document.getElementById('cartTotal').textContent = RO.won(total());
    document.getElementById('cartItemsCount').textContent = `${n}개`;
    RO.icons();
  }

  function checkout() {
    const dlg = document.getElementById('checkoutDialog');
    const rows = lines.map((l) => {
      const p = RO.products.find(l.id);
      return p ? `<tr><td>${p.name}</td><td>${l.qty}</td><td>${RO.won(p.price * l.qty)}</td></tr>` : '';
    }).join('');
    document.getElementById('checkoutBody').innerHTML = `
      <table class="order-table">
        <thead><tr><th scope="col">상품</th><th scope="col">수량</th><th scope="col">금액</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><th scope="row" colspan="2">총 결제 예정 금액</th><td>${RO.won(total())}</td></tr></tfoot>
      </table>`;
    document.getElementById('testOrderBtn').hidden = false;
    dlg.showModal();
  }

  function init() {
    const drawer = document.getElementById('cartDrawer');
    document.addEventListener('click', (e) => {
      const addBtn = e.target.closest('[data-add]');
      if (addBtn) add(addBtn.dataset.add.split(','), addBtn);
      if (e.target.closest('[data-action="open-cart"]')) drawer.showModal();
    });
    drawer.addEventListener('click', (e) => {
      if (e.target === drawer) drawer.close(); // 배경 클릭으로 닫기
      const q = e.target.closest('[data-qty]');
      if (q) {
        const line = lines.find((l) => l.id === q.dataset.qty);
        if (line) setQty(line.id, line.qty + Number(q.dataset.delta));
      }
      const r = e.target.closest('[data-remove]');
      if (r) setQty(r.dataset.remove, 0);
    });
    drawer.addEventListener('change', (e) => {
      const input = e.target.closest('[data-qty-input]');
      if (input) setQty(input.dataset.qtyInput, Math.max(1, parseInt(input.value, 10) || 1));
    });
    document.getElementById('cartClear').addEventListener('click', () => { lines = []; save(); });
    document.getElementById('cartCheckout').addEventListener('click', checkout);
    document.getElementById('testOrderBtn').addEventListener('click', testOrder);
    render();
  }

  RO.cart = { init, add, addMany, count, total };
})(window.RO);
