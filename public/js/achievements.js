// ============ ACHIEVEMENTS ============
// Each achievement: { code, name, desc, icon, group, check(ctx) -> bool }
// ctx = { stats, todayEntries, dreams, savings, tagSet }
const ACHIEVEMENTS = [
  // 基础起步
  { code: 'first_entry', name: '初次记录', desc: '写下第一件成功的事', icon: '🌱', group: 'starter',
    check: c => (c.stats?.totalEntries || 0) >= 1 },
  { code: 'three_in_day', name: '三连击', desc: '一天记 3 条', icon: '🎯', group: 'daily',
    check: c => (c.todayEntries?.length || 0) >= 3 || c.maxDayCount >= 3 },
  { code: 'five_in_day', name: '高光时刻', desc: '一天记 5 条', icon: '🌟', group: 'daily',
    check: c => (c.todayEntries?.length || 0) >= 5 || c.maxDayCount >= 5 },
  { code: 'ten_in_day', name: '记录狂人', desc: '一天记 10 条', icon: '🔥', group: 'daily',
    check: c => (c.todayEntries?.length || 0) >= 10 || c.maxDayCount >= 10 },

  // 连续打卡
  { code: 'streak_3', name: '小试牛刀', desc: '连续 3 天记录', icon: '🥉', group: 'streak',
    check: c => (c.stats?.maxStreak || 0) >= 3 },
  { code: 'streak_7', name: '坚持一周', desc: '连续 7 天记录', icon: '🥈', group: 'streak',
    check: c => (c.stats?.maxStreak || 0) >= 7 },
  { code: 'streak_14', name: '半月不停', desc: '连续 14 天记录', icon: '🥇', group: 'streak',
    check: c => (c.stats?.maxStreak || 0) >= 14 },
  { code: 'streak_30', name: '一月之约', desc: '连续 30 天记录', icon: '🏆', group: 'streak',
    check: c => (c.stats?.maxStreak || 0) >= 30 },
  { code: 'streak_100', name: '百日传说', desc: '连续 100 天记录', icon: '💎', group: 'streak',
    check: c => (c.stats?.maxStreak || 0) >= 100 },

  // 总量
  { code: 'total_50', name: '50 条里程碑', desc: '累计 50 条成功事项', icon: '📦', group: 'total',
    check: c => (c.stats?.totalEntries || 0) >= 50 },
  { code: 'total_200', name: '200 条达人', desc: '累计 200 条成功事项', icon: '🗃️', group: 'total',
    check: c => (c.stats?.totalEntries || 0) >= 200 },
  { code: 'total_500', name: '成功仓库', desc: '累计 500 条成功事项', icon: '🏰', group: 'total',
    check: c => (c.stats?.totalEntries || 0) >= 500 },

  // 标签全
  { code: 'all_tags', name: '全能选手', desc: '7 个分类全都打过卡', icon: '🌈', group: 'variety',
    check: c => c.tagSet && c.tagSet.size >= 7 },

  // 梦想储蓄
  { code: 'first_dream', name: '梦想启航', desc: '添加第一个梦想', icon: '✨', group: 'dream',
    check: c => (c.dreamsCount || 0) >= 1 },
  { code: 'dream_done', name: '梦想达成', desc: '完成一个梦想', icon: '🎉', group: 'dream',
    check: c => (c.dreamsDone || 0) >= 1 },
  { code: 'first_save', name: '存钱起步', desc: '第一次往储蓄罐存钱', icon: '🪙', group: 'dream',
    check: c => (c.jarBalance || 0) > 0 },
  { code: 'save_1000', name: '小金库', desc: '储蓄罐累计存到 ¥1000', icon: '💰', group: 'dream',
    check: c => (c.jarBalance || 0) >= 1000 },

  // 探索
  { code: 'open_history', name: '回望来路', desc: '打开历史页查看记录', icon: '🗓️', group: 'explore',
    check: c => c.viewedHistory },
  { code: 'theme_change', name: '形象设计师', desc: '切换一次主题', icon: '🎨', group: 'explore',
    check: c => c.changedTheme },
  { code: 'share_card', name: '分享时刻', desc: '生成一张分享卡片', icon: '📤', group: 'explore',
    check: c => c.sharedCard },
];

function buildAchievementContext() {
  const tagSet = new Set();
  (cachedStats?.tagStats || []).forEach(t => { if (t.count > 0) tagSet.add(t.tag); });
  const maxDayCount = Math.max(0, ...(cachedStats?.last30Days || []).map(r => parseInt(r.count) || 0));
  const flags = JSON.parse(localStorage.getItem('sd_flags') || '{}');
  return {
    stats: cachedStats,
    tagSet,
    maxDayCount,
    dreamsCount: cachedDreamsCount,
    dreamsDone: parseInt(localStorage.getItem('sd_dreams_done') || '0', 10),
    jarBalance: cachedJarBalance,
    viewedHistory: !!flags.viewedHistory,
    changedTheme: !!flags.changedTheme,
    sharedCard: !!flags.sharedCard,
    todayEntries: [],
  };
}

function setFlag(key) {
  const flags = JSON.parse(localStorage.getItem('sd_flags') || '{}');
  flags[key] = true;
  localStorage.setItem('sd_flags', JSON.stringify(flags));
}

function checkAchievements(opts = {}) {
  const ctx = buildAchievementContext();
  if (opts.todayEntries) ctx.todayEntries = opts.todayEntries;
  Object.assign(ctx, opts);
  const newly = [];
  for (const a of ACHIEVEMENTS) {
    if (unlockedAchievements.has(a.code)) continue;
    try {
      if (a.check(ctx)) {
        unlockedAchievements.add(a.code);
        newly.push(a);
      }
    } catch {}
  }
  if (newly.length) {
    localStorage.setItem('sd_unlocked', JSON.stringify([...unlockedAchievements]));
    // sync to backend (best-effort, batch)
    if (token) {
      api('/achievements', {
        method: 'POST',
        body: JSON.stringify({ codes: newly.map(a => a.code) })
      }).catch(() => {});
    }
    // celebration sequence
    let delay = 0;
    for (const a of newly) {
      setTimeout(() => {
        showAchievement(`🏅 解锁徽章「${a.name}」`, a.desc, a.icon);
        burstConfetti(1.4);
      }, delay);
      delay += 1400;
    }
    // refresh badge gallery if open
    renderBadges();
  }
  return newly;
}

let badgeFilter = 'all';
function renderBadges() {
  const grid = el('badgeGrid');
  if (!grid) return;
  const unlockedCount = ACHIEVEMENTS.filter(a => unlockedAchievements.has(a.code)).length;
  const total = ACHIEVEMENTS.length;
  const pct = total ? (unlockedCount / total) * 100 : 0;
  const sum = el('badgeSummary');
  if (sum) {
    sum.innerHTML = `
      <div><div class="num">${unlockedCount}/${total}</div><div class="lbl">已解锁徽章</div></div>
      <div class="pct-bar"><div class="pct-fill" style="width:${pct.toFixed(1)}%"></div></div>
      <div style="font-size:22px;">🏆</div>
    `;
  }
  const filtered = ACHIEVEMENTS.filter(a => {
    if (badgeFilter === 'all') return true;
    if (badgeFilter === 'unlocked') return unlockedAchievements.has(a.code);
    if (badgeFilter === 'locked') return !unlockedAchievements.has(a.code);
    return true;
  });
  grid.innerHTML = filtered.map(a => {
    const unlocked = unlockedAchievements.has(a.code);
    return `
      <div class="badge-tile ${unlocked ? 'unlocked' : 'locked'}" title="${escapeHtml(a.desc)}">
        <div class="icon">${a.icon}</div>
        <div class="name">${escapeHtml(a.name)}</div>
        <div class="desc">${escapeHtml(a.desc)}</div>
      </div>
    `;
  }).join('') || '<div class="empty-state"><p>暂无徽章</p></div>';
}

function setBadgeFilter(f) {
  badgeFilter = f;
  $$('.badge-filter button').forEach(b => b.classList.toggle('active', b.dataset.f === f));
  renderBadges();
}

async function syncAchievementsFromServer() {
  if (!token) return;
  try {
    const list = await api('/achievements');
    if (Array.isArray(list)) {
      list.forEach(code => unlockedAchievements.add(code));
      localStorage.setItem('sd_unlocked', JSON.stringify([...unlockedAchievements]));
    }
  } catch {}
}
