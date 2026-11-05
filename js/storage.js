/* BLACK-OUT — 공용 유틸: localStorage 래퍼, 이벤트 버스, 포맷터 */
window.RO = window.RO || {};

(function (RO) {
  const PREFIX = 'readyon.';

  // localStorage는 시크릿 모드·차단 환경에서 throw할 수 있으므로 항상 try/catch
  RO.store = {
    get(key, fallback = null) {
      try {
        const raw = localStorage.getItem(PREFIX + key);
        return raw ? JSON.parse(raw) : fallback;
      } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; }
      catch { return false; }
    },
    remove(key) {
      try { localStorage.removeItem(PREFIX + key); } catch { /* noop */ }
    }
  };

  // 모듈 간 통신: ro:cart, ro:result, ro:shelter
  RO.emit = (name, detail) => document.dispatchEvent(new CustomEvent('ro:' + name, { detail }));
  RO.on = (name, fn) => document.addEventListener('ro:' + name, (e) => fn(e.detail));

  RO.won = (n) => n.toLocaleString('ko-KR') + '원';

  // 사용자 입력을 innerHTML에 넣을 때 반드시 사용
  RO.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  RO.icons = () => { if (window.lucide) window.lucide.createIcons(); };

  let toastTimer;
  RO.toast = (msg) => {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-show'), 2400);
  };
})(window.RO);
