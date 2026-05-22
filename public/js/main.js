// ============ BOOT + GLOBAL WIRING ============
async function initAnalytics() {
  try {
    const res = await fetch('/api/config');
    if (!res.ok) {
      console.warn('[analytics] config request failed:', res.status);
      return;
    }
    const config = await res.json();
    if (!config.plausibleDomain || !config.plausibleScriptUrl) {
      console.info('[analytics] Plausible disabled: PLAUSIBLE_DOMAIN is empty');
      return;
    }
    if (document.querySelector('script[data-plausible-loaded="true"]')) {
      console.info('[analytics] Plausible already loaded');
      return;
    }

    const script = document.createElement('script');
    script.defer = true;
    script.src = config.plausibleScriptUrl;
    script.dataset.domain = config.plausibleDomain;
    script.dataset.plausibleLoaded = 'true';
    script.addEventListener('load', () => {
      console.info('[analytics] Plausible loaded:', config.plausibleDomain, config.plausibleScriptUrl);
    });
    script.addEventListener('error', () => {
      console.warn('[analytics] Plausible failed to load:', config.plausibleScriptUrl);
    });
    document.head.appendChild(script);
    console.info('[analytics] Plausible loading:', config.plausibleDomain, config.plausibleScriptUrl);
  } catch (err) {
    console.warn('[analytics] init failed:', err.message);
  }
}

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
initAnalytics();
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
