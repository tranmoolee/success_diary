// ============ BOOT + GLOBAL WIRING ============
function switchTab(name) {
  $$('.page').forEach(p => p.classList.remove('active'));
  $$('.tab-item').forEach(t => t.classList.remove('active'));
  el('page-' + name).classList.add('active');
  const idx = TAB_NAMES.indexOf(name);
  if (idx >= 0) $$('.tab-item')[idx].classList.add('active');
  if (name === 'history') renderCalendar();
  if (name === 'stats') renderStats();
  if (name === 'dreams') loadDreams();
  if (name === 'me') renderProfile();
  if (name === 'badges') renderBadges();
  if (name === 'today') {
    renderHeroCard(cachedStats);
    renderQuests();
  }
}

// modal click-outside to close
document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', function (e) { if (e.target === this) this.classList.remove('show'); });
});

// boot
document.body.dataset.theme = currentTheme;
if (token) {
  enterApp();
} else {
  el('authPage').classList.remove('hide');
  // for non-logged-in: still set up theme
  applyTheme(currentTheme);
  initTurnstile();
}
el('authPassword').addEventListener('keydown', e => { if (e.key === 'Enter') handleAuth(); });

// initial badge gallery wiring (filter buttons)
document.querySelectorAll('.badge-filter button').forEach(b => {
  b.addEventListener('click', () => setBadgeFilter(b.dataset.f));
});

// track theme-change flag
const _origApplyTheme = applyTheme;
applyTheme = function (key) {
  const wasChange = currentTheme !== key;
  _origApplyTheme(key);
  if (wasChange) {
    setFlag('changedTheme');
    checkAchievements();
  }
};
