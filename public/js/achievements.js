// ============ ACHIEVEMENTS ============
// Each achievement: { code, name, desc, icon, group, check(ctx) -> bool }
// ctx = { stats, todayEntries, dreams, savings, tagSet }
// name/desc come from i18n via achvName(code) / achvDesc(code)
const ACHIEVEMENTS = [
  // 基础起步
  { code: 'first_entry', icon: '🌱', group: 'starter',
    check: c => (c.stats?.totalEntries || 0) >= 1 },
  { code: 'three_in_day', icon: '🎯', group: 'daily',
    check: c => (c.todayEntries?.length || 0) >= 3 || c.maxDayCount >= 3 },
  { code: 'five_in_day', icon: '🌟', group: 'daily',
    check: c => (c.todayEntries?.length || 0) >= 5 || c.maxDayCount >= 5 },
  { code: 'ten_in_day', icon: '🔥', group: 'daily',
    check: c => (c.todayEntries?.length || 0) >= 10 || c.maxDayCount >= 10 },

  // 连续打卡
  { code: 'streak_3', icon: '🥉', group: 'streak',
    check: c => (c.stats?.maxStreak || 0) >= 3 },
  { code: 'streak_7', icon: '🥈', group: 'streak',
    check: c => (c.stats?.maxStreak || 0) >= 7 },
  { code: 'streak_14', icon: '🥇', group: 'streak',
    check: c => (c.stats?.maxStreak || 0) >= 14 },
  { code: 'streak_30', icon: '🏆', group: 'streak',
    check: c => (c.stats?.maxStreak || 0) >= 30 },
  { code: 'streak_100', icon: '💎', group: 'streak',
    check: c => (c.stats?.maxStreak || 0) >= 100 },

  // 总量
  { code: 'total_50', icon: '📦', group: 'total',
    check: c => (c.stats?.totalEntries || 0) >= 50 },
  { code: 'total_200', icon: '🗃️', group: 'total',
    check: c => (c.stats?.totalEntries || 0) >= 200 },
  { code: 'total_500', icon: '🏰', group: 'total',
    check: c => (c.stats?.totalEntries || 0) >= 500 },

  // 标签全
  { code: 'all_tags', icon: '🌈', group: 'variety',
    check: c => c.tagSet && c.tagSet.size >= 7 },

  // 梦想储蓄
  { code: 'first_dream', icon: '✨', group: 'dream',
    check: c => (c.dreamsCount || 0) >= 1 },
  { code: 'dream_done', icon: '🎉', group: 'dream',
    check: c => (c.dreamsDone || 0) >= 1 },
  { code: 'first_save', icon: '🪙', group: 'dream',
    check: c => (c.jarBalance || 0) > 0 },
  { code: 'save_1000', icon: '💰', group: 'dream',
    check: c => (c.jarBalance || 0) >= 1000 },

  // 探索
  { code: 'open_history', icon: '🗓️', group: 'explore',
    check: c => c.viewedHistory },
  { code: 'theme_change', icon: '🎨', group: 'explore',
    check: c => c.changedTheme },
  { code: 'share_card', icon: '📤', group: 'explore',
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

function clampPct(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function achievementProgress(a, ctx) {
  const stats = ctx.stats || {};
  const totalEntries = stats.totalEntries || 0;
  const maxStreak = stats.maxStreak || 0;
  const tagCount = ctx.tagSet?.size || 0;
  const dreamsCount = ctx.dreamsCount || 0;
  const dreamsDone = ctx.dreamsDone || 0;
  const jarBalance = ctx.jarBalance || 0;
  const todayCount = Math.max(ctx.todayEntries?.length || 0, ctx.maxDayCount || 0);
  const U = {
    entries: t('unit.entries'), days: t('unit.days'), categories: t('unit.categories'),
    items: t('unit.items'), times: t('unit.times'), yuan: t('unit.yuan'),
  };
  const incomplete = t('badges.incomplete');
  const simpleDone = { current: 1, target: 1, label: '1 / 1', pct: 100 };
  const byCode = {
    first_entry: { current: totalEntries, target: 1, unit: U.entries },
    three_in_day: { current: todayCount, target: 3, unit: U.entries },
    five_in_day: { current: todayCount, target: 5, unit: U.entries },
    ten_in_day: { current: todayCount, target: 10, unit: U.entries },
    streak_3: { current: maxStreak, target: 3, unit: U.days },
    streak_7: { current: maxStreak, target: 7, unit: U.days },
    streak_14: { current: maxStreak, target: 14, unit: U.days },
    streak_30: { current: maxStreak, target: 30, unit: U.days },
    streak_100: { current: maxStreak, target: 100, unit: U.days },
    total_50: { current: totalEntries, target: 50, unit: U.entries },
    total_200: { current: totalEntries, target: 200, unit: U.entries },
    total_500: { current: totalEntries, target: 500, unit: U.entries },
    all_tags: { current: tagCount, target: 7, unit: U.categories },
    first_dream: { current: dreamsCount, target: 1, unit: U.items },
    dream_done: { current: dreamsDone, target: 1, unit: U.items },
    first_save: { current: jarBalance > 0 ? 1 : 0, target: 1, unit: U.times },
    save_1000: { current: jarBalance, target: 1000, unit: U.yuan },
    open_history: ctx.viewedHistory ? simpleDone : { current: 0, target: 1, label: incomplete },
    theme_change: ctx.changedTheme ? simpleDone : { current: 0, target: 1, label: incomplete },
    share_card: ctx.sharedCard ? simpleDone : { current: 0, target: 1, label: incomplete },
  };
  const p = byCode[a.code] || { current: 0, target: 1 };
  const current = Math.min(p.current, p.target);
  const pct = p.pct ?? clampPct((current / p.target) * 100);
  const label = p.label || `${Number(current).toLocaleString()} / ${Number(p.target).toLocaleString()}${p.unit || ''}`;
  return { pct, label };
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
        showAchievement(t('badges.unlockToast', { name: achvName(a.code) }), achvDesc(a.code), a.icon);
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
  const ctx = buildAchievementContext();
  const unlockedCount = ACHIEVEMENTS.filter(a => unlockedAchievements.has(a.code)).length;
  const total = ACHIEVEMENTS.length;
  const pct = total ? (unlockedCount / total) * 100 : 0;
  const sum = el('badgeSummary');
  if (sum) {
    sum.innerHTML = `
      <div><div class="num">${unlockedCount}/${total}</div><div class="lbl">${t('badges.summaryLabel')}</div></div>
      <div class="pct-bar"><div class="pct-fill" style="width:${pct.toFixed(1)}%"></div></div>
      <div style="font-size:22px;">🏆</div>
    `;
  }
  const filtered = ACHIEVEMENTS
    .map((a, index) => ({ ...a, index, unlocked: unlockedAchievements.has(a.code) }))
    .filter(a => {
    if (badgeFilter === 'all') return true;
    if (badgeFilter === 'unlocked') return a.unlocked;
    if (badgeFilter === 'locked') return !a.unlocked;
    return true;
  })
    .sort((a, b) => Number(b.unlocked) - Number(a.unlocked) || a.index - b.index);
  grid.innerHTML = filtered.map(a => {
    const unlocked = a.unlocked;
    const progress = achievementProgress(a, ctx);
    const aName = achvName(a.code);
    const aDesc = achvDesc(a.code);
    return `
      <div class="badge-tile ${unlocked ? 'unlocked' : 'locked'}" title="${escapeHtml(aDesc)}">
        <div class="icon">${a.icon}</div>
        <div class="name">${escapeHtml(aName)}</div>
        <div class="desc">${escapeHtml(aDesc)}</div>
        ${unlocked ? `<div class="badge-state">${t('badges.unlockedState')}</div>` : `
          <div class="badge-progress" aria-label="${t('badges.progressAria', { label: progress.label })}">
            <div class="badge-progress-fill" style="width:${progress.pct}%"></div>
          </div>
          <div class="badge-progress-text">${escapeHtml(progress.label)}</div>
        `}
      </div>
    `;
  }).join('') || `<div class="empty-state"><p>${t('badges.empty')}</p></div>`;
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
