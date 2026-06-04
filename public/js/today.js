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
        <input class="entry-input" data-entry="${i}" value="${escapeHtml(e.text || '')}" placeholder="${t('today.entryPlaceholder', { n: i + 1 })}" />
        <select class="tag-select" data-tag="${i}">
          ${TAGS.map(tg => `<option value="${tg}" ${safeTag(e.tag) === tg ? 'selected' : ''}>${tagLabel(tg)}</option>`).join('')}
        </select>
        ${entryCount > 1 ? `<button class="entry-remove-btn" onclick="removeEntryRow(${i})" title="${t('today.removeTitle')}">×</button>` : ''}
      </div>`;
  }
  updateProgress();
  el('saveBtn').textContent = entries.length > 0 ? t('today.update') : t('today.save');
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
        <input class="entry-input" data-entry="${i}" value="${escapeHtml(v.text || '')}" placeholder="${t('today.entryPlaceholder', { n: i + 1 })}" />
        <select class="tag-select" data-tag="${i}">
          ${TAGS.map(tg => `<option value="${tg}" ${safeTag(v.tag) === tg ? 'selected' : ''}>${tagLabel(tg)}</option>`).join('')}
        </select>
        ${entryCount > 1 ? `<button class="entry-remove-btn" onclick="removeEntryRow(${i})" title="${t('today.removeTitle')}">×</button>` : ''}
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
  const hint = count === 0 ? t('today.progressHint0') :
    count < total ? t('today.progressHintMid', { n: count }) : t('today.progressHintAll');
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
  if (entries.length === 0) { showToast(t('today.needOne')); return; }
  const btn = el('saveBtn');
  btn.disabled = true;
  try {
    await api(`/entries/${todayKey()}`, { method: 'PUT', body: JSON.stringify({ entries }) });
    showToast(t('today.saved', { n: entries.length }));
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
      title: t('q.three.t'),
      desc: t('q.three.d'),
      reward: '+30 XP',
      done: draft.length >= 3,
    },
    {
      id: 'q-health',
      title: t('q.health.t'),
      desc: t('q.health.d'),
      reward: '+15 XP',
      done: draft.some(e => e.tag === '健康'),
    },
    {
      id: 'q-streak',
      title: t('q.streak.t'),
      desc: t('q.streak.d'),
      reward: '+20 XP',
      done: (cachedStats?.currentStreak || 0) >= 1 && draft.length > 0,
    },
    {
      id: 'q-history',
      title: t('q.history.t'),
      desc: t('q.history.d'),
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
