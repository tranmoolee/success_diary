const { pool } = require('./db');

const DEFAULT_SETTINGS = {
  public_announcement: '',
  admin_announcement: '',
  registration: 'on',
  daily_limit_minutes: '',
};

const ALLOWED_SETTING_KEYS = new Set(Object.keys(DEFAULT_SETTINGS));

async function getSettings() {
  const { rows } = await pool.query('SELECT key, value FROM system_settings');
  const settings = { ...DEFAULT_SETTINGS };
  rows.forEach((row) => {
    if (ALLOWED_SETTING_KEYS.has(row.key)) {
      settings[row.key] = row.value || '';
    }
  });
  return settings;
}

async function getSetting(key) {
  if (!ALLOWED_SETTING_KEYS.has(key)) return undefined;
  const { rows } = await pool.query('SELECT value FROM system_settings WHERE key = $1', [key]);
  return rows[0]?.value ?? DEFAULT_SETTINGS[key];
}

function isRegistrationOpen(value) {
  return String(value || DEFAULT_SETTINGS.registration).trim().toLowerCase() !== 'off';
}

module.exports = {
  ALLOWED_SETTING_KEYS,
  DEFAULT_SETTINGS,
  getSettings,
  getSetting,
  isRegistrationOpen,
};
