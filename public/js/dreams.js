// ============ DREAMS + SAVINGS ============
async function loadDreams() {
  try {
    const [dreams, savingsData] = await Promise.all([api('/dreams'), api('/savings')]);
    cachedDreamsCount = dreams.length;
    cachedJarBalance = parseFloat(savingsData.balance) || 0;
    localStorage.setItem('sd_dreams_done', String(dreams.filter(d => d.done).length));
    el('jarAmount').textContent = `¥${cachedJarBalance.toLocaleString()}`;
    renderDreamList(dreams);
    checkAchievements();
  } catch {}
}

async function loadDreamsBackground() {
  try {
    const [dreams, savingsData] = await Promise.all([api('/dreams'), api('/savings')]);
    cachedDreamsCount = dreams.length;
    cachedJarBalance = parseFloat(savingsData.balance) || 0;
    localStorage.setItem('sd_dreams_done', String(dreams.filter(d => d.done).length));
  } catch {}
}

function renderDreamList(dreams) {
  const c = el('dreamList');
  if (dreams.length === 0) {
    c.innerHTML = `<div class="empty-state" style="padding:30px 0;"><div class="empty-state-icon">⭐</div><p>${t('dreams.empty')}</p></div>`;
    return;
  }
  c.innerHTML = dreams.map(d => {
    const cost = parseFloat(d.cost), saved = parseFloat(d.saved);
    const pct = cost > 0 ? Math.min(100, Math.round((saved / cost) * 100)) : 0;
    return `<div class="dream-item">
      <button class="dream-check ${d.done ? 'done' : ''}" onclick="toggleDream(${d.id})">${d.done ? '✓' : ''}</button>
      <div class="dream-content">
        <div class="dream-name ${d.done ? 'done' : ''}">${escapeHtml(d.name)}</div>
        ${cost > 0 ? `<div class="dream-cost-row">
          <div class="dream-cost-label">${t('dreams.progress')}</div>
          <div class="dream-progress-bar"><div class="dream-progress-fill" style="width:${pct}%"></div></div>
          <div class="dream-amount">¥${saved}/${cost}</div>
        </div>` : ''}
      </div>
      <button class="dream-delete" onclick="deleteDream(${d.id})">×</button>
    </div>`;
  }).join('');
}

async function addDream() {
  const name = el('dreamInput').value.trim();
  if (!name) return;
  const cost = parseFloat(el('dreamCostInput').value) || 0;
  try {
    await api('/dreams', { method: 'POST', body: JSON.stringify({ name, cost }) });
    el('dreamInput').value = '';
    el('dreamCostInput').value = '';
    loadDreams();
    showToast(t('dreams.added'));
    burstConfetti(0.7);
  } catch (e) { showToast(e.message); }
}

async function toggleDream(id) {
  try {
    const dreams = await api('/dreams');
    const d = dreams.find(x => x.id === id);
    if (d) {
      const wasDone = !!d.done;
      await api(`/dreams/${id}`, { method: 'PATCH', body: JSON.stringify({ done: !wasDone }) });
      if (!wasDone) {
        showAchievement(t('dreams.doneTitle'), t('dreams.doneText', { name: d.name }), '🎉');
        burstConfetti(2);
      }
    }
    loadDreams();
  } catch {}
}

async function deleteDream(id) {
  try {
    await api(`/dreams/${id}`, { method: 'DELETE' });
    loadDreams();
  } catch {}
}

// ============ SAVINGS ============
function showSavingsModal(mode) {
  savingsMode = mode;
  el('savingsModalTitle').textContent = mode === 'deposit' ? t('savings.depositTitle') : t('savings.withdrawTitle');
  el('savingsModal').classList.add('show');
  el('savingsInput').value = '';
  el('savingsNote').value = '';
  el('savingsInput').focus();
}

async function confirmSavings() {
  const amount = parseFloat(el('savingsInput').value);
  if (!amount || amount <= 0) { showToast(t('savings.invalid')); return; }
  try {
    const data = await api('/savings', {
      method: 'POST',
      body: JSON.stringify({ type: savingsMode, amount, note: el('savingsNote').value })
    });
    el('savingsModal').classList.remove('show');
    cachedJarBalance = parseFloat(data.balance) || 0;
    el('jarAmount').textContent = `¥${cachedJarBalance.toLocaleString()}`;
    showToast(savingsMode === 'deposit' ? t('savings.deposited', { n: amount }) : t('savings.withdrawn', { n: amount }));
    if (savingsMode === 'deposit') burstConfetti(0.6);
    checkAchievements();
  } catch (e) { showToast(e.message); }
}
