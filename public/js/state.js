// ============ APP STATE ============
let token = localStorage.getItem('sd_token');
let currentUser = null;
let isLoginMode = true;
let calendarDate = new Date();
let savingsMode = 'deposit';
let entryCount = 3;
let cachedStats = null;
let cachedDreamsCount = 0;
let cachedJarBalance = 0;
let unlockedAchievements = new Set(
  JSON.parse(localStorage.getItem('sd_unlocked') || '[]')
);
let currentTheme = localStorage.getItem('sd_theme') || 'default';
let viewedHistoryToday = false;
let lastKnownLevel = parseInt(localStorage.getItem('sd_last_level') || '1', 10);
