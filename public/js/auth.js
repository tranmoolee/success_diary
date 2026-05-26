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
    link.textContent = enabled ? '注册' : '暂未开放';
  }
}

function renderTurnstile() {
  const target = el('turnstileWidget');
  if (!target || isLoginMode) return;
  clearTimeout(turnstileRenderTimer);
  if (!turnstileSiteKey) {
    target.innerHTML = '<div class="auth-turnstile-placeholder">人机验证未配置</div>';
    return;
  }
  if (!window.turnstile) {
    target.innerHTML = '<div class="auth-turnstile-placeholder">正在加载人机验证...</div>';
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

function toggleAuthMode() {
  if (isLoginMode && !isRegistrationEnabled()) {
    el('authError').textContent = '当前暂未开放注册';
    el('authError').classList.add('show');
    return;
  }
  isLoginMode = !isLoginMode;
  el('registerFields').style.display = isLoginMode ? 'none' : 'block';
  el('turnstileContainer').style.display = isLoginMode ? 'none' : 'flex';
  el('authBtn').textContent = isLoginMode ? '登录' : '注册';
  el('authSwitchText').textContent = isLoginMode ? '还没有账号？' : '已有账号？';
  el('authSwitchLink').textContent = isLoginMode ? (isRegistrationEnabled() ? '注册' : '暂未开放') : '登录';
  el('authError').classList.remove('show');
  if (!isLoginMode) requestAnimationFrame(renderTurnstile);
}

async function handleAuth() {
  const username = el('authUsername').value.trim();
  const password = el('authPassword').value;
  const errEl = el('authError');
  if (!username || !password) {
    errEl.textContent = '请填写用户名和密码';
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
        errEl.textContent = '当前暂未开放注册';
        errEl.classList.add('show');
        btn.disabled = false;
        btn.textContent = '注册';
        return;
      }
      const turnstileToken = document.querySelector('[name="cf-turnstile-response"]')?.value || '';
      if (!turnstileToken) {
        errEl.textContent = '请先完成人机验证';
        errEl.classList.add('show');
        btn.disabled = false;
        btn.textContent = '注册';
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
    btn.textContent = isLoginMode ? '登录' : '注册';
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
  const now = new Date();
  const wd = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  el('todayDate').textContent = `${now.getMonth() + 1}月${now.getDate()}日 ${wd[now.getDay()]}`;
  const qi = Math.floor(now.getTime() / 86400000) % QUOTES.length;
  el('dailyQuote').textContent = QUOTES[qi];

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
