// ============ PROFILE PAGE ============
function renderProfile() {
  if (!currentUser) return;
  const name = currentUser.displayName || currentUser.username;
  el('profileAvatar').textContent = (name[0] || '?').toUpperCase();
  el('profileName').textContent = name;
  el('profileUsername').textContent = '@' + currentUser.username;
  el('profileDisplayName').textContent = name;
  el('profileUsernameRow').textContent = currentUser.username;
  el('profileCreatedAt').textContent = currentUser.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString(getLang() === 'en' ? 'en-US' : 'zh-CN') : '-';
  renderThemePicker();
}

function showEditNameModal() {
  el('editNameInput').value = currentUser.displayName || '';
  el('editNameModal').classList.add('show');
  setTimeout(() => el('editNameInput').focus(), 100);
}

async function confirmEditName() {
  const name = el('editNameInput').value.trim();
  if (!name) { showToast(t('profile.nameEmpty')); return; }
  try {
    const updated = await api('/auth/profile', { method: 'PATCH', body: JSON.stringify({ displayName: name }) });
    currentUser.displayName = updated.displayName;
    el('editNameModal').classList.remove('show');
    renderProfile();
    renderHeroCard(cachedStats);
    showToast(t('profile.nameUpdated'));
  } catch (e) { showToast(e.message); }
}

function showChangePasswordModal() {
  el('currentPasswordInput').value = '';
  el('newPasswordInput').value = '';
  el('changePasswordModal').classList.add('show');
  setTimeout(() => el('currentPasswordInput').focus(), 100);
}

async function confirmChangePassword() {
  const current = el('currentPasswordInput').value;
  const newPwd = el('newPasswordInput').value;
  if (!current || !newPwd) { showToast(t('profile.fillAll')); return; }
  try {
    await api('/auth/password', { method: 'PATCH', body: JSON.stringify({ currentPassword: current, newPassword: newPwd }) });
    el('changePasswordModal').classList.remove('show');
    showToast(t('profile.pwdChanged'));
  } catch (e) { showToast(e.message); }
}
