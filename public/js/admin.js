// ============ ADMIN PANEL ============
const API = '/api';
const ADMIN_TOKEN_KEY = 'sd_admin_token';
let adminToken = localStorage.getItem(ADMIN_TOKEN_KEY) || '';
let adminMe = null;
let currentSection = 'dashboard';
let userPage = 1, entryPage = 1, sharePage = 1, auditPage = 1;
let resetTargetId = null;

// ============ HTTP ============
async function adminApi(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (adminToken) headers['Authorization'] = `Bearer ${adminToken}`;
  const res = await fetch(API + path, { ...options, headers });
  let data;
  try { data = await res.json(); } catch { data = {}; }
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      // 不直接登出，让调用方决定
      const err = new Error(data.error || (res.status === 401 ? '未登录' : '权限不足'));
      err.status = res.status;
      throw err;
    }
    throw new Error(data.error || '请求失败');
  }
  return data;
}

// ============ TOAST ============
function showToast(msg, type = '') {
  const t = document.getElementById('adminToast');
  t.textContent = msg;
  t.className = 'admin-toast show ' + type;
  setTimeout(() => { t.classList.remove('show'); }, 2500);
}

// ============ ESCAPE ============
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[c]);
}
function fmtDate(s) {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}
function fmtRel(s) {
  if (!s) return '从未';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '从未';
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return min + ' 分钟前';
  const hr = Math.floor(min / 60);
  if (hr < 24) return hr + ' 小时前';
  const day = Math.floor(hr / 24);
  if (day < 30) return day + ' 天前';
  return d.toLocaleDateString('zh-CN');
}

// ============ LOGIN ============
async function adminLogin() {
  const username = document.getElementById('adminUser').value.trim();
  const password = document.getElementById('adminPass').value;
  const errEl = document.getElementById('loginError');
  errEl.classList.remove('show');

  if (!username || !password) {
    errEl.textContent = '请输入账号和密码';
    errEl.classList.add('show');
    return;
  }
  const btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.textContent = '登录中...';

  try {
    const res = await fetch(API + '/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '登录失败');

    adminToken = data.token;
    localStorage.setItem(ADMIN_TOKEN_KEY, adminToken);

    // 验证是否是管理员
    const me = await adminApi('/admin/me');
    if (!me.user || !me.user.is_admin) {
      throw new Error('该账户不是管理员');
    }
    adminMe = me.user;
    enterAdmin();
  } catch (err) {
    adminToken = '';
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    errEl.textContent = err.message;
    errEl.classList.add('show');
  } finally {
    btn.disabled = false;
    btn.textContent = '登录';
  }
}

function adminLogout() {
  if (!confirm('确定要退出后台吗？')) return;
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  adminToken = '';
  adminMe = null;
  document.getElementById('adminShell').classList.remove('active');
  document.getElementById('adminLogin').classList.remove('hidden');
}

function enterAdmin() {
  document.getElementById('adminLogin').classList.add('hidden');
  document.getElementById('adminShell').classList.add('active');
  document.getElementById('adminName').textContent = adminMe.display_name || adminMe.username;
  document.getElementById('adminAvatar').textContent = (adminMe.display_name || adminMe.username).charAt(0).toUpperCase();
  loadAdminAnnouncement();
  switchSection('dashboard');
}

async function loadAdminAnnouncement() {
  try {
    const data = await adminApi('/admin/settings');
    applyAdminAnnouncement(data.settings.admin_announcement || '');
  } catch (err) {
    if (err.status === 401 || err.status === 403) return adminLogout();
  }
}

function applyAdminAnnouncement(message) {
  const banner = document.getElementById('adminAnnouncement');
  const text = document.getElementById('adminAnnouncementText');
  if (!banner || !text) return;
  const trimmed = String(message || '').trim();
  const dismissed = localStorage.getItem('sd_dismissed_admin_announcement') === trimmed;
  if (!trimmed || dismissed) {
    banner.style.display = 'none';
    return;
  }
  text.textContent = trimmed;
  banner.style.display = 'flex';
}

function dismissAdminAnnouncement() {
  const text = document.getElementById('adminAnnouncementText')?.textContent || '';
  if (text) localStorage.setItem('sd_dismissed_admin_announcement', text);
  const banner = document.getElementById('adminAnnouncement');
  if (banner) banner.style.display = 'none';
}

// ============ SECTION SWITCH ============
function switchSection(name) {
  currentSection = name;
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.section === name);
  });
  document.querySelectorAll('.section').forEach(el => {
    el.classList.toggle('active', el.id === 'section-' + name);
  });
  const titles = {
    dashboard: '数据看板',
    users: '用户管理',
    entries: '日记审核',
    shares: '分享统计',
    settings: '系统设置',
    audit: '操作日志',
  };
  document.getElementById('sectionTitle').textContent = titles[name] || '';

  if (name === 'dashboard') loadDashboard();
  else if (name === 'users') loadUsers(1);
  else if (name === 'entries') loadEntries(1);
  else if (name === 'shares') loadShares(1);
  else if (name === 'settings') loadSettings();
  else if (name === 'audit') loadAudit(1);
}

// ============ DASHBOARD ============
async function loadDashboard() {
  try {
    const stats = await adminApi('/admin/stats');
    document.getElementById('kpiUsers').textContent = stats.users.total;
    document.getElementById('kpiUsersTrend').textContent = `今日 +${stats.users.todayNew} · 禁用 ${stats.users.disabled}`;
    document.getElementById('kpiDAU').textContent = stats.users.dau;
    document.getElementById('kpiWAU').textContent = `周活 ${stats.users.wau}`;
    document.getElementById('kpiEntries').textContent = stats.entries.total;
    document.getElementById('kpiEntriesTrend').textContent = `今日 +${stats.entries.todayNew}`;
    document.getElementById('kpiShares').textContent = stats.shares.total;
    document.getElementById('kpiSharesViews').textContent = `浏览 ${stats.shares.totalViews} 次`;

    // 主题分布
    const themeNames = {
      default: '清爽专注', boy: '科技少年', girl: '粉樱少女', princess: '金白皇室', anime: '漫画热血'
    };
    const total = stats.themes.reduce((a, b) => a + b.cnt, 0) || 1;
    document.getElementById('themeDist').innerHTML = stats.themes.map(t => {
      const pct = (t.cnt / total * 100).toFixed(0);
      return `<div class="theme-row">
        <span class="name">${themeNames[t.theme] || t.theme}</span>
        <span class="bar-wrap"><span class="bar" style="width:${pct}%"></span></span>
        <span class="count">${t.cnt}</span>
      </div>`;
    }).join('');

    drawGrowthChart(stats.growth);
  } catch (err) {
    if (err.status === 401 || err.status === 403) return adminLogout();
    showToast(err.message, 'error');
  }
}

function drawGrowthChart(data) {
  const canvas = document.getElementById('growthChart');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.parentElement.clientWidth - 36;
  const H = 220;
  canvas.width = W * dpr; canvas.height = H * dpr;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  const pad = { l: 36, r: 16, t: 18, b: 28 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const maxVal = Math.max(1, ...data.map(d => Math.max(d.new_users, d.new_entries)));

  // grid lines
  ctx.strokeStyle = 'rgba(37, 99, 235, 0.08)';
  ctx.lineWidth = 1;
  ctx.font = '10px -apple-system, sans-serif';
  ctx.fillStyle = '#94a3b8';
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + innerH * (i / 4);
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(W - pad.r, y);
    ctx.stroke();
    const val = Math.round(maxVal * (1 - i / 4));
    ctx.fillText(String(val), 4, y + 3);
  }

  // draw lines
  function drawLine(values, color, fillColor) {
    ctx.beginPath();
    values.forEach((v, i) => {
      const x = pad.l + (i / (values.length - 1)) * innerW;
      const y = pad.t + innerH * (1 - v / maxVal);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    if (fillColor) {
      const last = values.length - 1;
      ctx.lineTo(pad.l + innerW, pad.t + innerH);
      ctx.lineTo(pad.l, pad.t + innerH);
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
  }

  const userValues = data.map(d => d.new_users);
  const entryValues = data.map(d => d.new_entries);

  drawLine(userValues, '#2563eb', 'rgba(37, 99, 235, 0.10)');
  drawLine(userValues, '#2563eb', null);
  drawLine(entryValues, '#14b8a6', null);

  // dots
  ctx.fillStyle = '#2563eb';
  userValues.forEach((v, i) => {
    const x = pad.l + (i / (userValues.length - 1)) * innerW;
    const y = pad.t + innerH * (1 - v / maxVal);
    ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
  });

  // x labels (every 5 days)
  ctx.fillStyle = '#94a3b8';
  data.forEach((d, i) => {
    if (i % 5 === 0 || i === data.length - 1) {
      const x = pad.l + (i / (data.length - 1)) * innerW;
      ctx.fillText(d.date.slice(5), x - 12, H - 8);
    }
  });

  // legend
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(W - 140, 8, 10, 3);
  ctx.fillStyle = '#475569';
  ctx.fillText('新用户', W - 124, 12);
  ctx.fillStyle = '#14b8a6';
  ctx.fillRect(W - 70, 8, 10, 3);
  ctx.fillStyle = '#475569';
  ctx.fillText('新日记', W - 54, 12);
}

// ============ USERS ============
async function loadUsers(page) {
  userPage = page;
  const q = document.getElementById('userSearch').value.trim();
  const filter = document.getElementById('userFilter').value;
  try {
    const params = new URLSearchParams({ page, pageSize: 20, q, filter });
    const data = await adminApi('/admin/users?' + params);
    renderUserTable(data);
  } catch (err) {
    if (err.status === 401 || err.status === 403) return adminLogout();
    showToast(err.message, 'error');
  }
}

function renderUserTable(data) {
  const tbody = document.getElementById('userTable');
  if (!data.items.length) {
    tbody.innerHTML = `<tr><td colspan="9" class="empty-cell">没有匹配的用户</td></tr>`;
  } else {
    tbody.innerHTML = data.items.map(u => {
      const name = u.display_name || u.username;
      const initial = name.charAt(0).toUpperCase();
      const badges = [];
      if (u.is_admin) badges.push(`<span class="badge badge-admin">管理员</span>`);
      if (u.disabled) badges.push(`<span class="badge badge-disabled">已禁用</span>`);
      else if (u.last_active_at && (Date.now() - new Date(u.last_active_at).getTime()) < 7 * 86400000) {
        badges.push(`<span class="badge badge-active">活跃</span>`);
      }
      return `<tr>
        <td>
          <div class="user-cell">
            <div class="mini-avatar">${esc(initial)}</div>
            <div>
              <div class="user-name">${esc(name)}</div>
              <div class="user-meta">@${esc(u.username)} · #${u.id}</div>
            </div>
          </div>
        </td>
        <td>${esc(u.theme || 'default')}</td>
        <td>${u.entry_count}</td>
        <td>${u.badge_count}</td>
        <td>${u.share_count}</td>
        <td>${fmtDate(u.created_at).slice(0, 10)}</td>
        <td>${fmtRel(u.last_active_at)}</td>
        <td>${badges.join(' ') || '—'}</td>
        <td>
          <div class="actions">
            <button class="action-btn" onclick="openUserDetail(${u.id})">详情</button>
            <button class="action-btn" onclick="toggleDisable(${u.id}, ${u.disabled})">${u.disabled ? '启用' : '禁用'}</button>
            <button class="action-btn" onclick="toggleAdmin(${u.id}, ${u.is_admin})">${u.is_admin ? '取消管理' : '设管理'}</button>
            <button class="action-btn" onclick="openResetModal(${u.id}, '${esc(u.username)}')">重置密码</button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }
  renderPagination('userPagination', data, loadUsers);
}

async function toggleDisable(id, currentlyDisabled) {
  if (!confirm(currentlyDisabled ? '确定要启用此用户？' : '确定要禁用此用户？该用户将无法登录和使用 app。')) return;
  try {
    await adminApi(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ disabled: !currentlyDisabled }),
    });
    showToast(currentlyDisabled ? '已启用' : '已禁用', 'success');
    loadUsers(userPage);
  } catch (err) { showToast(err.message, 'error'); }
}

async function toggleAdmin(id, currentlyAdmin) {
  if (!confirm(currentlyAdmin ? '确定要取消此用户的管理员权限？' : '确定要设置此用户为管理员？')) return;
  try {
    await adminApi(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isAdmin: !currentlyAdmin }),
    });
    showToast('权限已更新', 'success');
    loadUsers(userPage);
  } catch (err) { showToast(err.message, 'error'); }
}

async function openUserDetail(id) {
  try {
    const data = await adminApi(`/admin/users/${id}`);
    const u = data.user;
    const name = u.display_name || u.username;
    document.getElementById('userModalTitle').textContent = name + ' 的详情';
    document.getElementById('userModalBody').innerHTML = `
      <div class="detail-grid">
        <div class="detail-row"><div class="detail-label">用户 ID</div><div class="detail-value">#${u.id}</div></div>
        <div class="detail-row"><div class="detail-label">用户名</div><div class="detail-value">@${esc(u.username)}</div></div>
        <div class="detail-row"><div class="detail-label">昵称</div><div class="detail-value">${esc(u.display_name || '—')}</div></div>
        <div class="detail-row"><div class="detail-label">主题</div><div class="detail-value">${esc(u.theme || 'default')}</div></div>
        <div class="detail-row"><div class="detail-label">日记总数</div><div class="detail-value">${u.entry_count}</div></div>
        <div class="detail-row"><div class="detail-label">徽章总数</div><div class="detail-value">${u.badge_count}</div></div>
        <div class="detail-row"><div class="detail-label">分享次数</div><div class="detail-value">${u.share_count}</div></div>
        <div class="detail-row"><div class="detail-label">分享总浏览</div><div class="detail-value">${u.total_share_views}</div></div>
        <div class="detail-row"><div class="detail-label">注册时间</div><div class="detail-value">${fmtDate(u.created_at)}</div></div>
        <div class="detail-row"><div class="detail-label">最近活跃</div><div class="detail-value">${fmtRel(u.last_active_at)}</div></div>
      </div>

      <h4>最近 10 条日记</h4>
      ${data.recentEntries.length ? data.recentEntries.map(e => `
        <div class="entry-mini">
          <div class="date">${fmtDate(e.created_at).slice(0, 10)} · <span class="badge-tag">${esc(e.tag)}</span></div>
          <div>${esc(e.text)}</div>
        </div>`).join('') : '<p style="color:#94a3b8;font-size:12px;">暂无日记</p>'}

      <h4>已解锁徽章 (${data.badges.length})</h4>
      <div>${data.badges.length ? data.badges.map(b => `<span class="badge-tile-mini">${esc(b.code)}</span>`).join('') : '<p style="color:#94a3b8;font-size:12px;">暂无徽章</p>'}</div>

      <h4>最近分享</h4>
      ${data.recentShares.length ? data.recentShares.map(s => `
        <div class="entry-mini">
          <div class="date">${fmtDate(s.created_at).slice(0, 10)} · ${s.entry_count} 条 · 浏览 ${s.view_count} 次</div>
          <div><a href="/s/${esc(s.share_code)}" target="_blank">/s/${esc(s.share_code)} ↗</a></div>
        </div>`).join('') : '<p style="color:#94a3b8;font-size:12px;">暂无分享</p>'}
    `;
    document.getElementById('userModal').classList.add('show');
  } catch (err) { showToast(err.message, 'error'); }
}

function closeUserModal() {
  document.getElementById('userModal').classList.remove('show');
}

function openResetModal(id, username) {
  resetTargetId = id;
  document.getElementById('resetModalUser').textContent = '目标用户：@' + username;
  document.getElementById('resetPasswordInput').value = '';
  document.getElementById('resetModal').classList.add('show');
}

function closeResetModal() {
  document.getElementById('resetModal').classList.remove('show');
  resetTargetId = null;
}

async function confirmReset() {
  if (!resetTargetId) return;
  const pwd = document.getElementById('resetPasswordInput').value;
  if (!pwd || pwd.length < 8) return showToast('密码至少 8 位', 'error');
  try {
    await adminApi(`/admin/users/${resetTargetId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword: pwd }),
    });
    showToast('密码已重置', 'success');
    closeResetModal();
  } catch (err) { showToast(err.message, 'error'); }
}

// ============ ENTRIES ============
async function loadEntries(page) {
  entryPage = page;
  const q = document.getElementById('entrySearch').value.trim();
  const tag = document.getElementById('entryTag').value;
  try {
    const params = new URLSearchParams({ page, pageSize: 20, q, tag });
    const data = await adminApi('/admin/entries?' + params);
    renderEntryTable(data);
  } catch (err) {
    if (err.status === 401 || err.status === 403) return adminLogout();
    showToast(err.message, 'error');
  }
}

function renderEntryTable(data) {
  const tbody = document.getElementById('entryTable');
  if (!data.items.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-cell">没有匹配的日记</td></tr>`;
  } else {
    tbody.innerHTML = data.items.map(e => {
      const name = e.display_name || e.username;
      return `<tr>
        <td>
          <div class="user-cell">
            <div class="mini-avatar">${esc(name.charAt(0).toUpperCase())}</div>
            <div>
              <div class="user-name">${esc(name)}</div>
              <div class="user-meta">@${esc(e.username)}</div>
            </div>
          </div>
        </td>
        <td>${e.entry_date ? fmtDate(e.entry_date).slice(0, 10) : '—'}</td>
        <td style="max-width:380px;word-break:break-word;">${esc(e.text)}</td>
        <td><span class="badge-tag">${esc(e.tag)}</span></td>
        <td>${fmtDate(e.created_at)}</td>
        <td>
          <button class="action-btn danger" onclick="deleteEntry(${e.id})">删除</button>
        </td>
      </tr>`;
    }).join('');
  }
  renderPagination('entryPagination', data, loadEntries);
}

async function deleteEntry(id) {
  if (!confirm('确定要删除这条日记？此操作不可恢复。')) return;
  try {
    await adminApi(`/admin/entries/${id}`, { method: 'DELETE' });
    showToast('已删除', 'success');
    loadEntries(entryPage);
  } catch (err) { showToast(err.message, 'error'); }
}

// ============ SHARES ============
async function loadShares(page) {
  sharePage = page;
  const sort = document.getElementById('shareSort').value;
  try {
    const params = new URLSearchParams({ page, pageSize: 20, sort });
    const data = await adminApi('/admin/shares?' + params);
    renderShareTable(data);
  } catch (err) {
    if (err.status === 401 || err.status === 403) return adminLogout();
    showToast(err.message, 'error');
  }
}

function renderShareTable(data) {
  const tbody = document.getElementById('shareTable');
  if (!data.items.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-cell">还没有分享记录</td></tr>`;
  } else {
    tbody.innerHTML = data.items.map(s => {
      const name = s.display_name || s.username;
      return `<tr>
        <td><a href="/s/${esc(s.share_code)}" target="_blank" style="font-family:monospace;font-weight:700;">${esc(s.share_code)} ↗</a></td>
        <td>
          <div class="user-cell">
            <div class="mini-avatar">${esc(name.charAt(0).toUpperCase())}</div>
            <div class="user-name">${esc(name)}</div>
          </div>
        </td>
        <td>${s.entry_date ? fmtDate(s.entry_date).slice(0, 10) : '—'}</td>
        <td>${s.entry_count}</td>
        <td><strong style="color:#2563eb;">${s.view_count}</strong></td>
        <td>${fmtDate(s.created_at)}</td>
        <td>
          <button class="action-btn danger" onclick="deleteShare('${esc(s.share_code)}')">删除</button>
        </td>
      </tr>`;
    }).join('');
  }
  renderPagination('sharePagination', data, loadShares);
}

async function deleteShare(code) {
  if (!confirm(`确定要删除分享 ${code}？删除后该链接将失效。`)) return;
  try {
    await adminApi(`/admin/shares/${code}`, { method: 'DELETE' });
    showToast('已删除', 'success');
    loadShares(sharePage);
  } catch (err) { showToast(err.message, 'error'); }
}

// ============ SETTINGS ============
async function loadSettings() {
  try {
    const data = await adminApi('/admin/settings');
    document.getElementById('set_public_announcement').value = data.settings.public_announcement || '';
    document.getElementById('set_admin_announcement').value = data.settings.admin_announcement || '';
    document.getElementById('set_registration').value = data.settings.registration || '';
    document.getElementById('set_daily_limit_minutes').value = data.settings.daily_limit_minutes || '';
  } catch (err) {
    if (err.status === 401 || err.status === 403) return adminLogout();
    showToast(err.message, 'error');
  }
}

async function saveSetting(key) {
  const value = String(document.getElementById('set_' + key).value || '');
  try {
    await adminApi(`/admin/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
    if (key === 'admin_announcement') {
      localStorage.removeItem('sd_dismissed_admin_announcement');
      applyAdminAnnouncement(value);
    }
    showToast('已保存', 'success');
  } catch (err) { showToast(err.message, 'error'); }
}

// ============ AUDIT ============
async function loadAudit(page) {
  auditPage = page;
  try {
    const params = new URLSearchParams({ page, pageSize: 30 });
    const data = await adminApi('/admin/audit?' + params);
    renderAuditTable(data);
  } catch (err) {
    if (err.status === 401 || err.status === 403) return adminLogout();
    showToast(err.message, 'error');
  }
}

function renderAuditTable(data) {
  const tbody = document.getElementById('auditTable');
  if (!data.items.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-cell">没有操作日志</td></tr>`;
  } else {
    const actionLabels = {
      'user.update': '修改用户',
      'user.reset_password': '重置密码',
      'user.delete': '删除用户',
      'entry.delete': '删除日记',
      'share.delete': '删除分享',
      'setting.update': '更新设置',
    };
    tbody.innerHTML = data.items.map(l => `<tr>
      <td>${fmtDate(l.created_at)}</td>
      <td>${esc(l.admin_username || '未知')}</td>
      <td><span class="badge badge-admin">${esc(actionLabels[l.action] || l.action)}</span></td>
      <td>${esc(l.target_type || '—')} ${l.target_id ? '#' + l.target_id : ''}</td>
      <td style="max-width:300px;word-break:break-word;font-size:11px;color:#64748b;">${esc(JSON.stringify(l.detail || {}))}</td>
    </tr>`).join('');
  }
  renderPagination('auditPagination', data, loadAudit);
}

// ============ PAGINATION ============
function renderPagination(containerId, data, loader) {
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const c = document.getElementById(containerId);
  c.innerHTML = `
    <button class="page-btn" ${data.page <= 1 ? 'disabled' : ''} onclick="(${loader.name})(${data.page - 1})">‹ 上一页</button>
    <span class="page-info">第 ${data.page} / ${totalPages} 页 · 共 ${data.total} 条</span>
    <button class="page-btn" ${data.page >= totalPages ? 'disabled' : ''} onclick="(${loader.name})(${data.page + 1})">下一页 ›</button>
  `;
}

// ============ BOOT ============
async function boot() {
  if (!adminToken) {
    document.getElementById('adminLogin').classList.remove('hidden');
    return;
  }
  try {
    const me = await adminApi('/admin/me');
    if (!me.user || !me.user.is_admin) throw new Error('not admin');
    adminMe = me.user;
    enterAdmin();
  } catch {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    adminToken = '';
    document.getElementById('adminLogin').classList.remove('hidden');
  }
}

// Enter 键登录
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('adminLogin').offsetParent !== null) {
    adminLogin();
  }
});

boot();
