// ============ BOOT + GLOBAL WIRING ============
async function initAnalytics() {
  try {
    const res = await fetch('/api/config');
    if (!res.ok) {
      console.warn('[analytics] config request failed:', res.status);
      return;
    }
    const config = await res.json();
    appConfig = config;
    applyRuntimeSettings(config.settings || {});
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

function applyRuntimeSettings(settings) {
  applyAnnouncement(settings.public_announcement || '');
  if (settings.daily_limit_minutes) {
    console.info('[settings] daily limit:', settings.daily_limit_minutes, 'minutes');
  }
  if (token && currentUser) startDailyLimitReminder();
}

function applyAnnouncement(message) {
  const banner = el('announcementBanner');
  const text = el('announcementText');
  if (!banner || !text) return;

  const trimmed = String(message || '').trim();
  const dismissed = localStorage.getItem('sd_dismissed_announcement') === trimmed;
  if (!trimmed || dismissed) {
    banner.style.display = 'none';
    return;
  }

  text.textContent = trimmed;
  banner.style.display = 'flex';
  console.info('[settings] public announcement loaded');
}

function dismissAnnouncement() {
  const text = el('announcementText')?.textContent || '';
  if (text) localStorage.setItem('sd_dismissed_announcement', text);
  const banner = el('announcementBanner');
  if (banner) banner.style.display = 'none';
}

function getDailyLimitMinutes() {
  const raw = appConfig?.settings?.daily_limit_minutes;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function startDailyLimitReminder() {
  clearInterval(dailyLimitTimer);
  const minutes = getDailyLimitMinutes();
  if (!minutes) return;

  const key = 'sd_session_started_at';
  if (!sessionStorage.getItem(key)) {
    sessionStorage.setItem(key, String(Date.now()));
  }
  dailyLimitTimer = setInterval(() => {
    const startedAt = Number(sessionStorage.getItem(key) || Date.now());
    if (Date.now() - startedAt >= minutes * 60 * 1000) {
      showToast(t('limit.reminder', { n: minutes }));
      clearInterval(dailyLimitTimer);
    }
  }, 30 * 1000);
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

// Re-render dynamic (JS-generated) content after a language switch.
// Static [data-i18n] nodes are already handled by applyI18n() in setLang().
function refreshDynamicI18n() {
  // auth page (works whether logged in or not)
  if (typeof updateAuthModeText === 'function') updateAuthModeText();
  if (typeof updateRegistrationAvailability === 'function') updateRegistrationAvailability();

  if (token && currentUser) {
    updateHeaderDate();
    updateDailyQuote();
    renderHeroCard(cachedStats);
    renderQuests();
    rebuildEntryRows(collectEntryValues());
    renderThemePicker();
    renderBadges();
    if (typeof renderProfile === 'function') renderProfile();
    const active = document.querySelector('.page.active');
    const id = active ? active.id : '';
    if (id === 'page-stats') renderStats();
    if (id === 'page-history') renderCalendar();
    if (id === 'page-dreams') loadDreams();
  }
}

// modal click-outside to close
document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', function (e) { if (e.target === this) this.classList.remove('show'); });
});

// boot
applyI18n();
renderLangToggles();
initAnalytics();
document.body.dataset.theme = currentTheme;
if (token) {
  enterApp();
} else {
  el('authPage').classList.remove('hide');
  // for non-logged-in: still set up theme
  applyTheme(currentTheme);
  updateAuthModeText();
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
