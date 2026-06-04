// ============ SHARE CARD WITH QR CODE ============

function generateQRDataURL(text) {
  var qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  return qr.createDataURL(4, 0);
}

async function generateShareCard() {
  const entries = currentEntryDraft();
  if (entries.length === 0) { showToast(t('share.needContent')); return; }

  showToast(t('share.generating'));

  let stats = cachedStats || {};
  const now = new Date();
  const dateStr = fmtFullDate(now);
  const entryDate = todayKey();

  let shareUrl = '';
  let shareCode = '';
  try {
    await api(`/entries/${entryDate}`, { method: 'PUT', body: JSON.stringify({ entries }) });
    await loadStatsBackground();
    stats = cachedStats || stats;
    const shareData = await api('/shares', {
      method: 'POST',
      body: JSON.stringify({ entryDate }),
    });
    shareUrl = shareData.shareUrl;
    shareCode = shareData.shareCode;
  } catch (err) {
    showToast(t('share.linkFail', { msg: err.message }));
    return;
  }

  const qrDataUrl = generateQRDataURL(shareUrl);

  const card = el('shareCard');
  card.innerHTML = `
    <div class="share-card-header">
      <h2>${t('share.cardTitle')}</h2>
      <p>${dateStr}</p>
    </div>
    <div class="share-card-stats">
      <div class="share-card-stat"><div class="val">${stats.currentStreak || 0}</div><div class="lbl">${t('share.streak')}</div></div>
      <div class="share-card-stat"><div class="val">${stats.totalDays || 0}</div><div class="lbl">${t('share.total')}</div></div>
      <div class="share-card-stat"><div class="val">${stats.totalEntries || 0}</div><div class="lbl">${t('share.wins')}</div></div>
    </div>
    <div class="share-card-entries">
      ${entries.map((e, i) => `
        <div class="share-card-entry">
          <div class="share-card-num">${i + 1}</div>
          <div class="share-card-text">${escapeHtml(e.text)}</div>
          <div class="share-card-tag">${escapeHtml(tagLabel(e.tag))}</div>
        </div>`).join('')}
    </div>
    <div class="share-card-qr">
      <img src="${qrDataUrl}" class="share-qr-img" />
      <div class="share-qr-info">
        <div class="share-qr-label">${t('share.qrLabel')}</div>
        <div class="share-qr-url">${shareUrl}</div>
      </div>
    </div>
    <div class="share-card-footer">
      <div class="streak">${t('share.footerStreak', { n: stats.currentStreak || 0 })}</div>
      <div class="brand">${t('share.brand')}</div>
    </div>`;

  const container = el('shareCardContainer');
  container.style.left = '0';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.zIndex = '999';

  try {
    await new Promise(r => setTimeout(r, 200));
    const canvas = await html2canvas(card, { scale: 2, backgroundColor: null, useCORS: true, logging: false });
    const imgUrl = canvas.toDataURL('image/png');
    el('sharePreviewImg').src = imgUrl;
    el('sharePreview').classList.add('show');
    setFlag('sharedCard');
    checkAchievements();
  } catch (err) {
    showToast(t('share.genFail', { msg: err.message }));
  } finally {
    container.style.left = '-9999px';
    container.style.zIndex = '-1';
  }
}

function downloadShareImage() {
  const img = el('sharePreviewImg');
  const a = document.createElement('a');
  a.href = img.src;
  const now = new Date();
  a.download = `成功日记_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.png`;
  a.click();
  showToast(t('share.imgSaved'));
}

function closeSharePreview() {
  el('sharePreview').classList.remove('show');
}
