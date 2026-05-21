// ============ VISUAL EFFECTS: CONFETTI / ACHIEVEMENT TOAST / LEVEL UP ============
function burstConfetti(intensity = 1) {
  const layer = el('confettiLayer');
  if (!layer) return;
  const colors = ['#f97316', '#facc15', '#06b6d4', '#ec4899', '#7c3aed', '#22c55e', '#fbbf24'];
  const count = Math.min(80, Math.round(34 * intensity));
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 220}ms`;
    piece.style.width = `${6 + Math.random() * 6}px`;
    piece.style.height = `${10 + Math.random() * 8}px`;
    piece.style.transform = `rotate(${Math.random() * 180}deg)`;
    layer.appendChild(piece);
  }
  setTimeout(() => { layer.innerHTML = ''; }, 1500);
}

function showAchievement(title, text, icon) {
  const toast = el('achievementToast');
  if (!toast) return;
  el('achievementTitle').textContent = title;
  el('achievementText').textContent = text;
  if (icon) toast.querySelector('.medal').textContent = icon;
  toast.classList.add('show');
  clearTimeout(showAchievement._t);
  showAchievement._t = setTimeout(() => toast.classList.remove('show'), 2800);
}

function celebrateSave(count) {
  const title = count >= 5 ? '高能记录官' : count >= 3 ? '今日目标达成' : '成功已入账';
  const text = count >= 5 ? `一次写下 ${count} 条，高光时刻爆发`
             : count >= 3 ? '3 条成功事项已点亮'
             : '你刚刚为自信加了一格能量';
  showAchievement(title, text, '✍️');
  burstConfetti(count >= 5 ? 1.5 : 1);
}

function showLevelUp(level, rank) {
  const card = el('levelUpCard');
  if (!card) return;
  el('levelUpRing').textContent = `Lv.${level - 1} → Lv.${level}`;
  el('levelUpBig').textContent = `升级！`;
  el('levelUpSub').textContent = `新称号：${rank}`;
  card.classList.add('show');
  burstConfetti(2.2);
  setTimeout(() => card.classList.remove('show'), 2400);
}
