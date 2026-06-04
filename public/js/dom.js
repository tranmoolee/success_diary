// ============ DOM HELPERS ============
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }
function el(id) { return document.getElementById(id); }

function escapeHtml(s) {
  if (s == null) return '';
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
function safeTag(t) { return TAGS.includes(t) ? t : '生活'; }

function localDateStr(d) {
  if (!d) d = new Date();
  const y = d.getFullYear(),
        m = String(d.getMonth() + 1).padStart(2, '0'),
        day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function todayKey() { return localDateStr(new Date()); }
function formatDate(ds) {
  const d = new Date(ds + 'T00:00:00');
  return (typeof fmtFullDate === 'function')
    ? fmtFullDate(d)
    : `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function showToast(msg) {
  const t = el('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => t.classList.remove('show'), 2000);
}
