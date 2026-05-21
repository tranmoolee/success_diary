// ============ XP / LEVEL / RANK SYSTEM ============
// XP from stats: 10 per entry + 5 per streak day + 20 per dream completed
// Level curve: cumulative XP thresholds — Lv1: 0, Lv2: 50, Lv3: 130, Lv4: 240, Lv5: 400, ... grows ~quadratic
const LEVEL_CURVE = (() => {
  const arr = [0];
  let xp = 0;
  for (let lv = 2; lv <= 60; lv++) {
    const cost = 30 + (lv - 1) * 20 + Math.floor(Math.pow(lv - 1, 1.6));
    xp += cost;
    arr.push(xp);
  }
  return arr; // arr[i] = total XP required to reach level i+1
})();

const RANKS = [
  { min: 1,  title: '自信新手',  emoji: '🌱' },
  { min: 3,  title: '成功学徒',  emoji: '🪴' },
  { min: 5,  title: '日记达人',  emoji: '📒' },
  { min: 8,  title: '坚持之星',  emoji: '⭐' },
  { min: 12, title: '自信猎人',  emoji: '🏹' },
  { min: 16, title: '高光大师',  emoji: '🏆' },
  { min: 22, title: '梦想骑士',  emoji: '🛡️' },
  { min: 30, title: '成功王者',  emoji: '👑' },
  { min: 42, title: '传奇之路',  emoji: '🌟' },
];

function computeXP(stats) {
  if (!stats) return 0;
  const entryXP = (stats.totalEntries || 0) * 10;
  const streakXP = (stats.maxStreak || 0) * 5;
  const dreamXP = (cachedDreamsCount || 0) * 20;
  return entryXP + streakXP + dreamXP;
}

function levelFromXP(xp) {
  let lv = 1;
  for (let i = 1; i < LEVEL_CURVE.length; i++) {
    if (xp >= LEVEL_CURVE[i]) lv = i + 1; else break;
  }
  return lv;
}
function rankFromLevel(lv) {
  let r = RANKS[0];
  for (const candidate of RANKS) if (lv >= candidate.min) r = candidate;
  return r;
}
function progressForLevel(xp, lv) {
  const cur = LEVEL_CURVE[lv - 1] || 0;
  const next = LEVEL_CURVE[lv] || (cur + 100);
  const pct = Math.max(0, Math.min(100, ((xp - cur) / (next - cur)) * 100));
  return { cur, next, pct, into: xp - cur, span: next - cur };
}

function renderHeroCard(stats) {
  const card = el('heroCard');
  if (!card) return;
  const xp = computeXP(stats);
  const lv = levelFromXP(xp);
  const rank = rankFromLevel(lv);
  const prog = progressForLevel(xp, lv);
  const name = (currentUser && (currentUser.displayName || currentUser.username)) || '小狗钱钱';
  const streak = stats ? (stats.currentStreak || 0) : 0;
  const total = stats ? (stats.totalEntries || 0) : 0;
  const days = stats ? (stats.totalDays || 0) : 0;
  const initial = name[0] ? name[0].toUpperCase() : '😀';

  card.innerHTML = `
    <div class="hero-top">
      <div class="hero-avatar">${rank.emoji}</div>
      <div class="hero-meta">
        <div class="hero-title-row">
          <div class="hero-name">${escapeHtml(name)}</div>
          <div class="hero-rank-chip">Lv.${lv} · ${rank.title}</div>
        </div>
        <div class="hero-sub">${initial} · 今天又是变厉害的一天</div>
        <div class="hero-stats">
          <div class="hero-stat"><strong>🔥 ${streak}</strong><span>连续天数</span></div>
          <div class="hero-stat"><strong>📒 ${days}</strong><span>记录天数</span></div>
          <div class="hero-stat"><strong>✨ ${total}</strong><span>成功事项</span></div>
        </div>
      </div>
    </div>
    <div class="xp-track">
      <div class="xp-meta">
        <span>XP ${prog.into} / ${prog.span}</span>
        <span>下一级 Lv.${lv + 1}</span>
      </div>
      <div class="xp-bar"><div class="xp-bar-fill" style="width:${prog.pct.toFixed(1)}%"></div></div>
    </div>
  `;

  // detect level-up
  if (lv > lastKnownLevel) {
    lastKnownLevel = lv;
    localStorage.setItem('sd_last_level', String(lv));
    setTimeout(() => showLevelUp(lv, rank.title), 280);
  }

  // also update streak in header
  const streakCount = el('streakCount');
  if (streakCount) streakCount.textContent = streak;
}
