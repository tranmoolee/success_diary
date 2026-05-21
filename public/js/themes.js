// ============ THEMES ============
const THEMES = [
  { key: 'default',  label: '清爽专注', emoji: '✓', gradient: 'linear-gradient(135deg,#2563eb,#14b8a6)' },
  { key: 'boy',      label: '科技少年', emoji: '🤖', gradient: 'linear-gradient(135deg,#0ea5e9,#22d3ee,#34d399)' },
  { key: 'girl',     label: '粉樱少女', emoji: '🌸', gradient: 'linear-gradient(135deg,#f472b6,#ec4899,#a855f7)' },
  { key: 'princess', label: '金白皇室', emoji: '👑', gradient: 'linear-gradient(135deg,#fef3c7,#fbbf24,#b45309)' },
  { key: 'anime',    label: '漫画热血', emoji: '⚡', gradient: 'linear-gradient(135deg,#facc15,#ef4444,#111827)' },
];

function applyTheme(key) {
  if (!THEMES.find(t => t.key === key)) key = 'default';
  document.body.dataset.theme = key;
  currentTheme = key;
  localStorage.setItem('sd_theme', key);
  // sync to backend (best-effort)
  if (token) {
    api('/auth/profile', { method: 'PATCH', body: JSON.stringify({ theme: key }) }).catch(() => {});
  }
  // re-render picker active state
  renderThemePicker();
}

function renderThemePicker() {
  const c = el('themePicker');
  if (!c) return;
  c.innerHTML = THEMES.map(t => `
    <div class="theme-tile ${t.key === currentTheme ? 'active' : ''}" onclick="applyTheme('${t.key}')">
      <div class="swatch" style="background:${t.gradient}"></div>
      <div class="label">${t.emoji} ${t.label}</div>
    </div>
  `).join('');
}
