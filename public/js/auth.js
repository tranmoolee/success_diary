// ============ AUTH ============
function toggleAuthMode() {
  isLoginMode = !isLoginMode;
  el('registerFields').style.display = isLoginMode ? 'none' : 'block';
  el('authBtn').textContent = isLoginMode ? '登录' : '注册';
  el('authSwitchText').textContent = isLoginMode ? '还没有账号？' : '已有账号？';
  el('authSwitchLink').textContent = isLoginMode ? '注册' : '登录';
  el('authError').classList.remove('show');
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
    if (!isLoginMode) body.displayName = el('authDisplayName').value.trim() || username;
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
}
