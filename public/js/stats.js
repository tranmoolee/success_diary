// ============ STATS PAGE: KPIs + GROWTH CHART + RADAR ============
async function renderStats() {
  try {
    const s = cachedStats || await api('/stats');
    cachedStats = s;
    el('statTotal').textContent = s.totalDays;
    el('statEntries').textContent = s.totalEntries;
    el('statStreak').textContent = s.maxStreak;
    el('statAvg').textContent = s.avgPerDay;
    renderGrowthChart(s.last30Days);
    renderTagStats(s.tagStats);
    renderRadar(s.tagStats);
  } catch {}
}

function readCssVar(name, fallback) {
  return getComputedStyle(document.body).getPropertyValue(name).trim() || fallback;
}

function renderGrowthChart(last30) {
  const canvas = el('growthChart');
  const ctx = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * 2;
  canvas.height = rect.height * 2;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(2, 2);
  const w = rect.width, h = rect.height;
  const pad = { top: 20, right: 20, bottom: 30, left: 35 };
  const map = {};
  (last30 || []).forEach(r => { map[r.entry_date.slice(0, 10)] = parseInt(r.count); });
  const data = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    data.push({ date: d, count: map[localDateStr(d)] || 0 });
  }
  const maxCount = Math.max(5, ...data.map(d => d.count));
  ctx.clearRect(0, 0, w, h);
  const primary = readCssVar('--primary', '#7c3aed');
  const accent = readCssVar('--accent', '#f97316');
  const textMuted = readCssVar('--text-muted', '#94a3b8');
  const border = readCssVar('--border', '#e2e8f0');

  ctx.strokeStyle = border;
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 5; i++) {
    const y = pad.top + (h - pad.top - pad.bottom) * (1 - i / 5);
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
    ctx.fillStyle = textMuted; ctx.font = '10px system-ui'; ctx.textAlign = 'right';
    ctx.fillText(Math.round(maxCount * i / 5), pad.left - 8, y + 4);
  }
  ctx.fillStyle = textMuted; ctx.font = '10px system-ui'; ctx.textAlign = 'center';
  [0, 9, 19, 29].forEach(i => {
    const x = pad.left + (w - pad.left - pad.right) * (i / 29);
    ctx.fillText(`${data[i].date.getMonth() + 1}/${data[i].date.getDate()}`, x, h - 8);
  });

  const cw = w - pad.left - pad.right, ch = h - pad.top - pad.bottom;

  // fill area
  ctx.beginPath();
  data.forEach((d, i) => {
    const x = pad.left + cw * i / 29;
    const y = pad.top + ch * (1 - d.count / maxCount);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.lineTo(pad.left + cw, pad.top + ch);
  ctx.lineTo(pad.left, pad.top + ch);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ch);
  grad.addColorStop(0, hexToRGBA(primary, 0.32));
  grad.addColorStop(1, hexToRGBA(primary, 0.02));
  ctx.fillStyle = grad; ctx.fill();

  // line
  ctx.beginPath();
  data.forEach((d, i) => {
    const x = pad.left + cw * i / 29;
    const y = pad.top + ch * (1 - d.count / maxCount);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.strokeStyle = primary; ctx.lineWidth = 2.4; ctx.lineJoin = 'round';
  ctx.stroke();

  // dots
  data.forEach((d, i) => {
    if (d.count > 0) {
      const x = pad.left + cw * i / 29;
      const y = pad.top + ch * (1 - d.count / maxCount);
      ctx.beginPath(); ctx.arc(x, y, d.count >= 5 ? 4.2 : 3, 0, Math.PI * 2);
      ctx.fillStyle = d.count >= 5 ? accent : primary;
      ctx.fill();
    }
  });
}

function hexToRGBA(hex, a) {
  if (!hex) return `rgba(0,0,0,${a})`;
  hex = hex.trim();
  if (hex.startsWith('rgb')) return hex.replace(/rgb\(([^)]+)\)/, `rgba($1, ${a})`);
  const m = hex.replace('#', '');
  if (m.length !== 6 && m.length !== 3) return `rgba(124,58,237,${a})`;
  const full = m.length === 3 ? m.split('').map(c => c + c).join('') : m;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function renderTagStats(tagStats) {
  const c = el('tagStats');
  if (!tagStats || tagStats.length === 0) {
    c.innerHTML = `<div class="empty-state" style="padding:16px 0;"><p>${t('stats.noData')}</p></div>`;
    return;
  }
  c.innerHTML = tagStats.map(item => `
    <div class="tag-stat">
      <div class="tag-dot" style="background:${TAG_COLORS[item.tag] || '#94a3b8'}"></div>
      <span>${escapeHtml(tagLabel(item.tag))}</span><strong>${item.count}</strong>
    </div>`).join('');
}

function renderRadar(tagStats) {
  const canvas = el('radarChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * 2; canvas.height = rect.height * 2;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(2, 2);
  const w = rect.width, h = rect.height;
  const cx = w / 2, cy = h / 2;
  const radius = Math.min(w, h) / 2 - 30;

  const labels = TAGS;
  const map = {};
  (tagStats || []).forEach(t => { map[t.tag] = parseInt(t.count) || 0; });
  const values = labels.map(t => map[t] || 0);
  const max = Math.max(1, ...values);
  const N = labels.length;

  const border = readCssVar('--border', '#e2e8f0');
  const muted = readCssVar('--text-muted', '#94a3b8');
  const primary = readCssVar('--primary', '#7c3aed');
  const accent = readCssVar('--accent', '#f97316');

  ctx.clearRect(0, 0, w, h);

  // grid
  ctx.strokeStyle = border; ctx.lineWidth = 1;
  for (let r = 1; r <= 4; r++) {
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const ang = -Math.PI / 2 + i * 2 * Math.PI / N;
      const x = cx + Math.cos(ang) * radius * r / 4;
      const y = cy + Math.sin(ang) * radius * r / 4;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.stroke();
  }
  // axes + labels
  ctx.strokeStyle = border;
  ctx.fillStyle = muted; ctx.font = '11px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let i = 0; i < N; i++) {
    const ang = -Math.PI / 2 + i * 2 * Math.PI / N;
    const x = cx + Math.cos(ang) * radius;
    const y = cy + Math.sin(ang) * radius;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke();
    const lx = cx + Math.cos(ang) * (radius + 16);
    const ly = cy + Math.sin(ang) * (radius + 16);
    ctx.fillText(tagLabel(labels[i]), lx, ly);
  }
  // polygon
  ctx.beginPath();
  for (let i = 0; i < N; i++) {
    const ang = -Math.PI / 2 + i * 2 * Math.PI / N;
    const r = (values[i] / max) * radius;
    const x = cx + Math.cos(ang) * r;
    const y = cy + Math.sin(ang) * r;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  const g = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius);
  g.addColorStop(0, hexToRGBA(accent, 0.4));
  g.addColorStop(1, hexToRGBA(primary, 0.18));
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = primary; ctx.lineWidth = 2; ctx.stroke();

  // points
  for (let i = 0; i < N; i++) {
    const ang = -Math.PI / 2 + i * 2 * Math.PI / N;
    const r = (values[i] / max) * radius;
    const x = cx + Math.cos(ang) * r;
    const y = cy + Math.sin(ang) * r;
    ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = accent; ctx.fill();
  }
}
