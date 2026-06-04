// ============ AUTH ============
let turnstileSiteKey = '';
let turnstileWidgetId = null;
let turnstileRenderTimer = null;

async function initTurnstile() {
  try {
    const data = await api('/config');
    appConfig = data;
    turnstileSiteKey = data.turnstileSiteKey || '';
    console.info('[turnstile] config:', turnstileSiteKey ? 'site key configured' : 'site key missing');
    updateRegistrationAvailability();
    if (!isLoginMode) renderTurnstile();
  } catch (err) {
    turnstileSiteKey = '';
    console.warn('[turnstile] config request failed:', err.message);
  }
}

function isRegistrationEnabled() {
  const value = appConfig?.settings?.registration || 'on';
  return String(value).trim().toLowerCase() !== 'off';
}

function updateRegistrationAvailability() {
  const link = el('authSwitchLink');
  if (!link) return;
  const enabled = isRegistrationEnabled();
  link.classList.toggle('disabled', !enabled && isLoginMode);
  if (isLoginMode) {
    link.textContent = enabled ? t('auth.register') : t('auth.regClosed');
  }
}

function renderTurnstile() {
  const target = el('turnstileWidget');
  if (!target || isLoginMode) return;
  clearTimeout(turnstileRenderTimer);
  if (!turnstileSiteKey) {
    target.innerHTML = `<div class="auth-turnstile-placeholder">${t('auth.turnstileMissing')}</div>`;
    return;
  }
  if (!window.turnstile) {
    target.innerHTML = `<div class="auth-turnstile-placeholder">${t('auth.turnstileLoading')}</div>`;
    turnstileRenderTimer = setTimeout(renderTurnstile, 250);
    return;
  }
  if (turnstileWidgetId !== null) {
    window.turnstile.reset(turnstileWidgetId);
    console.info('[turnstile] reset widget');
    return;
  }
  target.innerHTML = '';
  turnstileWidgetId = window.turnstile.render(target, {
    sitekey: turnstileSiteKey,
    action: 'register',
    theme: currentTheme === 'boy' ? 'dark' : 'auto',
    callback: () => console.info('[turnstile] challenge completed'),
    'error-callback': () => console.warn('[turnstile] challenge error'),
    'expired-callback': () => console.info('[turnstile] token expired'),
  });
  console.info('[turnstile] rendered widget:', turnstileWidgetId);
}

window.renderTurnstile = renderTurnstile;

function resetTurnstile() {
  if (window.turnstile && turnstileWidgetId !== null) {
    window.turnstile.reset(turnstileWidgetId);
  }
}

// Sync auth button + switch link text to current mode & language
function updateAuthModeText() {
  el('authBtn').textContent = isLoginMode ? t('auth.login') : t('auth.register');
  el('authSwitchText').textContent = isLoginMode ? t('auth.haveNoAccount') : t('auth.haveAccount');
  el('authSwitchLink').textContent = isLoginMode
    ? (isRegistrationEnabled() ? t('auth.register') : t('auth.regClosed'))
    : t('auth.login');
}

function toggleAuthMode() {
  if (isLoginMode && !isRegistrationEnabled()) {
    el('authError').textContent = t('auth.regDisabledMsg');
    el('authError').classList.add('show');
    return;
  }
  isLoginMode = !isLoginMode;
  el('registerFields').style.display = isLoginMode ? 'none' : 'block';
  el('turnstileContainer').style.display = isLoginMode ? 'none' : 'flex';
  updateAuthModeText();
  el('authError').classList.remove('show');
  if (!isLoginMode) requestAnimationFrame(renderTurnstile);
}

async function handleAuth() {
  const username = el('authUsername').value.trim();
  const password = el('authPassword').value;
  const errEl = el('authError');
  if (!username || !password) {
    errEl.textContent = t('auth.needUserPass');
    errEl.classList.add('show');
    return;
  }
  const btn = el('authBtn');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div>';
  try {
    const endpoint = isLoginMode ? '/auth/login' : '/auth/register';
    const body = { username, password };
    if (!isLoginMode) {
      if (!isRegistrationEnabled()) {
        errEl.textContent = t('auth.regDisabledMsg');
        errEl.classList.add('show');
        btn.disabled = false;
        btn.textContent = t('auth.register');
        return;
      }
      const turnstileToken = document.querySelector('[name="cf-turnstile-response"]')?.value || '';
      if (!turnstileToken) {
        errEl.textContent = t('auth.needTurnstile');
        errEl.classList.add('show');
        btn.disabled = false;
        btn.textContent = t('auth.register');
        return;
      }
      body.displayName = el('authDisplayName').value.trim() || username;
      body.turnstileToken = turnstileToken;
    }
    const data = await api(endpoint, { method: 'POST', body: JSON.stringify(body) });
    token = data.token;
    currentUser = data.user;
    localStorage.setItem('sd_token', token);
    if (!isLoginMode && !localStorage.getItem('sd_onboarded')) {
      el('onboarding').classList.add('show');
    }
    enterApp();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.add('show');
    if (!isLoginMode) resetTurnstile();
  } finally {
    btn.disabled = false;
    btn.textContent = isLoginMode ? t('auth.login') : t('auth.register');
  }
}

function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem('sd_token');
  el('authPage').classList.remove('hide');
  el('appShell').classList.remove('active');
  el('authUsername').value = '';
  el('authPassword').value = '';
  initTurnstile();
}

// header date — 5月22日 周五 / May 22, Fri
function updateHeaderDate() {
  const dt = el('todayDate');
  if (!dt) return;
  const now = new Date();
  const wd = weekdayName(now.getDay());
  dt.textContent = getLang() === 'en'
    ? `${MONTHS_EN[now.getMonth()]} ${now.getDate()}, ${wd}`
    : `${now.getMonth() + 1}月${now.getDate()}日 ${wd}`;
}

// daily quote — stable per day, localized
function updateDailyQuote() {
  const q = el('dailyQuote');
  if (!q) return;
  const list = localizedQuotes();
  const qi = Math.floor(Date.now() / 86400000) % list.length;
  q.textContent = list[qi];
}

async function enterApp() {
  el('authPage').classList.add('hide');
  el('appShell').classList.add('active');
  if (!currentUser) {
    try { currentUser = await api('/auth/me'); } catch { logout(); return; }
  }
  // pull server-saved theme if present
  if (currentUser && currentUser.theme && THEMES.find(t => t.key === currentUser.theme)) {
    applyTheme(currentUser.theme);
  } else {
    applyTheme(currentTheme);
  }
  updateHeaderDate();
  updateDailyQuote();

  await syncAchievementsFromServer();
  await loadTodayEntries();
  await loadStatsBackground();
  await loadDreamsBackground();
  // initial achievement check from snapshot
  checkAchievements();
  // render hero card now that stats loaded
  renderHeroCard(cachedStats);
  renderQuests();
  startDailyLimitReminder();
}
