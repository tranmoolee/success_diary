// ============ HISTORY: CALENDAR HEATMAP + DAY DETAIL ============
let monthEntryMap = {};

function heatClass(count) {
  if (count <= 0) return '';
  if (count === 1) return 'heat-1';
  if (count <= 2) return 'heat-2';
  if (count <= 4) return 'heat-3';
  return 'heat-4';
}

async function renderCalendar() {
  const y = calendarDate.getFullYear(), m = calendarDate.getMonth();
  el('calendarMonth').textContent = `${y}年${m + 1}月`;
  const ym = `${y}-${String(m + 1).padStart(2, '0')}`;
  try {
    const rows = await api(`/entries/month/${ym}`);
    monthEntryMap = {};
    rows.forEach(r => { monthEntryMap[r.entry_date.slice(0, 10)] = parseInt(r.count); });
  } catch {
    monthEntryMap = {};
  }
  const grid = el('calendarGrid');
  grid.innerHTML = '';
  ['日', '一', '二', '三', '四', '五', '六'].forEach(w => { grid.innerHTML += `<div class="calendar-weekday">${w}</div>`; });
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const today = new Date();
  for (let i = 0; i < firstDay; i++) grid.innerHTML += '<div class="calendar-day empty"></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const dk = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const cnt = monthEntryMap[dk] || 0;
    const isToday = today.getFullYear() === y && today.getMonth() === m && today.getDate() === d;
    let cls = 'calendar-day';
    if (isToday) cls += ' today';
    const heat = heatClass(cnt);
    if (heat) cls += ' has-entry ' + heat;
    grid.innerHTML += `<div class="${cls}" onclick="showDayDetail('${dk}')">${d}</div>`;
  }
  el('historyDetail').innerHTML = '<div class="empty-state" style="padding:16px 0;"><p>点击日历上的日期查看详情</p></div>';

  // flag + achievement check
  setFlag('viewedHistory');
  checkAchievements();
}

function changeMonth(delta) {
  calendarDate.setMonth(calendarDate.getMonth() + delta);
  renderCalendar();
}

async function showDayDetail(dateKey) {
  try {
    const entries = await api(`/entries/${dateKey}`);
    const detail = el('historyDetail');
    if (entries.length === 0) {
      detail.innerHTML = `<div class="history-date">${formatDate(dateKey)}</div><div class="empty-state" style="padding:20px 0;"><p>这一天还没有记录</p></div>`;
      return;
    }
    detail.innerHTML = `<div class="history-date">${formatDate(dateKey)} · ${entries.length} 条记录</div>
      ${entries.map((e, i) => `
        <div class="history-item">
          <div class="entry-number filled">${i + 1}</div>
          <div class="history-text">${escapeHtml(e.text)}</div>
          <span class="history-tag tag-${safeTag(e.tag)}">${escapeHtml(e.tag)}</span>
        </div>`).join('')}`;
  } catch {}
}
