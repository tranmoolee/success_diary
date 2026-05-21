// ============ TODAY PAGE: ENTRIES + QUESTS ============
async function loadTodayEntries() {
  try {
    const entries = await api(`/entries/${todayKey()}`);
    entryCount = Math.max(3, entries.length || 3);
    renderEntryInputs(entries);
    loadStreak();
  } catch {
    renderEntryInputs([]);
  }
}

function renderEntryInputs(entries) {
  const c = el('entryInputs');
  c.innerHTML = '';
  for (let i = 0; i < entryCount; i++) {
    const e = entries[i] || {};
    const filled = e.text ? ' filled' : '';
    c.innerHTML += `
      <div class="entry-row" data-idx="${i}">
        <div class="entry-number${filled}">${i + 1}</div>
        <input class="entry-input" data-entry="${i}" value="${escapeHtml(e.text || '')}" placeholder="第${i + 1}件成功的事..." />
        <select class="tag-select" data-tag="${i}">
          ${TAGS.map(t => `<option value="${t}" ${safeTag(e.tag) === t ? 'selected' : ''}>${t}</option>`).join('')}
        </select>
        ${entryCount > 1 ? `<button class="entry-remove-btn" onclick="removeEntryRow(${i})" title="删除">×</button>` : ''}
      </div>`;
  }
  updateProgress();
  el('saveBtn').textContent = entries.length > 0 ? '更新今日记录' : '保存今日记录';
  c.addEventListener('input', () => { updateProgress(); updateNumberIndicators(); renderQuests(); }, { once: false });
  renderQuests();
}

function addEntryRow() {
  const values = collectEntryValues();
  entryCount++;
  rebuildEntryRows(values);
  setTimeout(() => {
    const inputs = $$('.entry-input');
    inputs[inputs.length - 1].focus();
  }, 50);
}

function removeEntryRow(idx) {
  if (entryCount <= 1) return;
  const values = collectEntryValues();
  values.splice(idx, 1);
  entryCount--;
  rebuildEntryRows(values);
}

function collectEntryValues() {
  const values = [];
  for (let i = 0; i < entryCount; i++) {
    const input = document.querySelector(`[data-entry="${i}"]`);
    const tag = document.querySelector(`[data-tag="${i}"]`);
    values.push({
      text: input ? input.value : '',
      tag: tag ? safeTag(tag.value) : '生活'
    });
  }
  return values;
}

function rebuildEntryRows(values) {
  const c = el('entryInputs');
  c.innerHTML = '';
  for (let i = 0; i < entryCount; i++) {
    const v = values[i] || {};
    const filled = v.text && v.text.trim() ? ' filled' : '';
    c.innerHTML += `
      <div class="entry-row" data-idx="${i}">
        <div class="entry-number${filled}">${i + 1}</div>
        <input class="entry-input" data-entry="${i}" value="${escapeHtml(v.text || '')}" placeholder="第${i + 1}件成功的事..." />
        <select class="tag-select" data-tag="${i}">
          ${TAGS.map(t => `<option value="${t}" ${safeTag(v.tag) === t ? 'selected' : ''}>${t}</option>`).join('')}
        </select>
        ${entryCount > 1 ? `<button class="entry-remove-btn" onclick="removeEntryRow(${i})" title="删除">×</button>` : ''}
      </div>`;
  }
  updateProgress();
  renderQuests();
}

function updateNumberIndicators() {
  $$('.entry-input').forEach(elem => {
    const num = elem.parentElement.querySelector('.entry-number');
    elem.value.trim() ? num.classList.add('filled') : num.classList.remove('filled');
  });
}

function updateProgress() {
  const filled = $$('.entry-input');
  const count = Array.from(filled).filter(elem => elem.value.trim()).length;
  const total = filled.length || 1;
  const ring = el('progressRing');
  if (ring) {
    const circ = 2 * Math.PI * 26;
    ring.style.strokeDashoffset = circ - (count / total) * circ;
  }
  el('progressCount').textContent = count;
  const hint = count === 0 ? '记录让你自豪的事' :
    count < total ? `已记录 ${count} 条，继续加油！` : '太棒了！全部完成！';
  el('progressHint').textContent = hint;
  updateNumberIndicators();
}

async function saveToday() {
  const entries = [];
  for (let i = 0; i < entryCount; i++) {
    const input = document.querySelector(`[data-entry="${i}"]`);
    const tag = document.querySelector(`[data-tag="${i}"]`);
    const text = input ? input.value.trim() : '';
    if (text) entries.push({ text, tag: tag ? safeTag(tag.value) : '生活' });
  }
  if (entries.length === 0) { showToast('至少记录一件成功的事哦'); return; }
  const btn = el('saveBtn');
  btn.disabled = true;
  try {
    await api(`/entries/${todayKey()}`, { method: 'PUT', body: JSON.stringify({ entries }) });
    showToast(`已保存 ${entries.length} 条记录 ✓`);
    celebrateSave(entries.length);
    await loadTodayEntries();
    await loadStatsBackground();
    renderHeroCard(cachedStats);
    checkAchievements({ todayEntries: entries });
    renderQuests();
  } catch (err) {
    showToast(err.message);
  } finally {
    btn.disabled = false;
  }
}

// ============ STREAK / STATS PUSH ============
async function loadStreak() {
  try {
    const s = await api('/stats');
    cachedStats = s;
    if (el('streakCount')) el('streakCount').textContent = s.currentStreak;
  } catch {}
}
async function loadStatsBackground() {
  try {
    cachedStats = await api('/stats');
    if (el('streakCount')) el('streakCount').textContent = cachedStats.currentStreak;
  } catch {}
}

// ============ DAILY QUESTS ============
function currentEntryDraft() {
  const entries = [];
  for (let i = 0; i < entryCount; i++) {
    const input = document.querySelector(`[data-entry="${i}"]`);
    const tag = document.querySelector(`[data-tag="${i}"]`);
    const text = input ? input.value.trim() : '';
    if (text) entries.push({ text, tag: tag ? safeTag(tag.value) : '生活' });
  }
  return entries;
}

function quests() {
  const draft = currentEntryDraft();
  const flags = JSON.parse(localStorage.getItem('sd_flags') || '{}');
  return [
    {
      id: 'q-three',
      title: '记 3 条成功事项',
      desc: '完成今日的核心打卡',
      reward: '+30 XP',
      done: draft.length >= 3,
    },
    {
      id: 'q-health',
      title: '写一条"健康"类',
      desc: '关注身体也是成功',
      reward: '+15 XP',
      done: draft.some(e => e.tag === '健康'),
    },
    {
      id: 'q-streak',
      title: '保持连续记录',
      desc: '别让连续天数断了',
      reward: '+20 XP',
      done: (cachedStats?.currentStreak || 0) >= 1 && draft.length > 0,
    },
    {
      id: 'q-history',
      title: '回顾历史',
      desc: '点开历史 Tab 看一眼',
      reward: '+10 XP',
      done: !!flags.viewedHistory,
    },
  ];
}

function renderQuests() {
  const c = el('questList');
  if (!c) return;
  const qs = quests();
  const doneCount = qs.filter(q => q.done).length;
  el('questProgress').textContent = `${doneCount} / ${qs.length}`;
  c.innerHTML = qs.map(q => `
    <div class="quest-row ${q.done ? 'done' : ''}">
      <div class="quest-check">${q.done ? '✓' : ''}</div>
      <div class="quest-body">
        <div class="quest-title">${escapeHtml(q.title)}</div>
        <div class="quest-desc">${escapeHtml(q.desc)}</div>
      </div>
      <div class="quest-reward">${escapeHtml(q.reward)}</div>
    </div>
  `).join('');
}
