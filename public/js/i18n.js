// ============ I18N: 中文 / English ============
let lang = localStorage.getItem('sd_lang') || 'zh';
if (lang !== 'zh' && lang !== 'en') lang = 'zh';

const LANGS = [
  { key: 'zh', label: '中' },
  { key: 'en', label: 'EN' },
];

// ---- Flat UI strings ----
const I18N = {
  zh: {
    'app.title': '成功日记 - 小狗钱钱',
    // onboarding
    'ob.0.h': '欢迎来到成功日记',
    'ob.0.p': '这是来自《小狗钱钱》的智慧：每天记录让你自豪的事情，你会发现自己比想象中更优秀。',
    'ob.1.h': '每日记录 · 升级打怪',
    'ob.1.p': '每写一条成功事项就获得 XP。攒满 XP 升级解锁称号，从「自信新手」一路成长到「成功王者」。',
    'ob.2.h': '解锁专属徽章',
    'ob.2.p': '三连击、坚持一周、全分类打卡、梦想达成…… 20+ 枚徽章等你收集进徽章馆。',
    'ob.3.h': '选择你的形象',
    'ob.3.p': '默认使用清爽专注界面，也可以在「我的」里切换不同主题。你的日记，你说了算。',
    'ob.skip': '跳过',
    'ob.next': '下一步',
    'ob.start': '开始使用',
    // auth
    'auth.title': '成功日记',
    'auth.subtitle': '记录你的成功，积累你的自信',
    'auth.displayName': '昵称',
    'auth.username': '用户名',
    'auth.password': '密码',
    'auth.login': '登录',
    'auth.register': '注册',
    'auth.regClosed': '暂未开放',
    'auth.haveNoAccount': '还没有账号？',
    'auth.haveAccount': '已有账号？',
    'auth.regDisabledMsg': '当前暂未开放注册',
    'auth.needUserPass': '请填写用户名和密码',
    'auth.needTurnstile': '请先完成人机验证',
    'auth.turnstileMissing': '人机验证未配置',
    'auth.turnstileLoading': '正在加载人机验证...',
    // header / today
    'header.title': '成功日记',
    'unit.daysShort': '天',
    'quote.author': '— 成功日记理念',
    'quest.head': '🎯 今日任务',
    'today.progressTitle': '今日成功事项',
    'today.progressHint0': '记录让你自豪的事',
    'today.progressHintMid': '已记录 {n} 条，继续加油！',
    'today.progressHintAll': '太棒了！全部完成！',
    'today.addRow': '+ 再记一条',
    'today.save': '保存今日记录',
    'today.update': '更新今日记录',
    'today.share': '📤 生成分享卡片',
    'today.entryPlaceholder': '第{n}件成功的事...',
    'today.removeTitle': '删除',
    'today.needOne': '至少记录一件成功的事哦',
    'today.saved': '已保存 {n} 条记录 ✓',
    'hero.subtitle': '今天又是变厉害的一天',
    'hero.streak': '连续天数',
    'hero.days': '记录天数',
    'hero.wins': '成功事项',
    'hero.xp': 'XP {a} / {b}',
    'hero.next': '下一级 Lv.{lv}',
    // quests
    'q.three.t': '记 3 条成功事项',
    'q.three.d': '完成今日的核心打卡',
    'q.health.t': '写一条"健康"类',
    'q.health.d': '关注身体也是成功',
    'q.streak.t': '保持连续记录',
    'q.streak.d': '别让连续天数断了',
    'q.history.t': '回顾历史',
    'q.history.d': '点开历史 Tab 看一眼',
    // history
    'history.clickHint': '点击日历上的日期查看详情',
    'history.noEntry': '这一天还没有记录',
    'history.dayCount': '{n} 条记录',
    'cal.less': '少',
    'cal.more': '多',
    // dreams
    'dreams.jarLabel': '愿望存钱罐',
    'dreams.deposit': '+ 存入',
    'dreams.withdraw': '- 支出',
    'dreams.listTitle': '梦想清单',
    'dreams.inputPlaceholder': '写下你的梦想...',
    'dreams.costPlaceholder': '¥ 费用',
    'dreams.add': '添加',
    'dreams.empty': '写下你的梦想吧<br>有了目标才有动力前进',
    'dreams.added': '梦想已添加',
    'dreams.doneTitle': '梦想达成！',
    'dreams.doneText': '「{name}」完成了',
    'dreams.progress': '进度',
    'savings.depositTitle': '存入金额',
    'savings.withdrawTitle': '支出金额',
    'savings.amountPlaceholder': '输入金额',
    'savings.notePlaceholder': '备注（可选）',
    'savings.confirm': '确认',
    'savings.invalid': '请输入有效金额',
    'savings.deposited': '已存入 ¥{n}',
    'savings.withdrawn': '已支出 ¥{n}',
    // stats
    'stats.totalDays': '总记录天数',
    'stats.totalEntries': '成功事项',
    'stats.maxStreak': '最长连续',
    'stats.avgPerDay': '日均条数',
    'stats.growthTitle': '📈 自信成长曲线（近30天）',
    'stats.radarTitle': '🎯 分类雷达图',
    'stats.tagTitle': '🏷️ 分类统计',
    'stats.noData': '暂无数据',
    // badges
    'badges.all': '全部',
    'badges.unlocked': '已解锁',
    'badges.locked': '未解锁',
    'badges.summaryLabel': '已解锁徽章',
    'badges.unlockedState': '已解锁',
    'badges.empty': '暂无徽章',
    'badges.progressAria': '解锁进度 {label}',
    'badges.incomplete': '未完成',
    'badges.unlockToast': '🏅 解锁徽章「{name}」',
    'unit.entries': '条',
    'unit.days': '天',
    'unit.categories': '类',
    'unit.items': '个',
    'unit.times': '次',
    'unit.yuan': '元',
    // profile
    'profile.appearance': '外观风格',
    'profile.language': '语言 / Language',
    'profile.info': '个人信息',
    'profile.security': '安全',
    'profile.displayName': '昵称',
    'profile.username': '用户名',
    'profile.createdAt': '注册时间',
    'profile.password': '密码',
    'profile.edit': '修改',
    'profile.changePassword': '修改密码',
    'profile.logout': '退出登录',
    'profile.nameEmpty': '昵称不能为空',
    'profile.nameUpdated': '昵称已更新',
    'profile.fillAll': '请填写完整',
    'profile.pwdChanged': '密码已修改',
    // modals
    'modal.editName': '修改昵称',
    'modal.newNamePlaceholder': '输入新昵称',
    'modal.save': '保存',
    'modal.changePassword': '修改密码',
    'modal.currentPassword': '当前密码',
    'modal.newPassword': '新密码（至少8位）',
    'modal.confirmChange': '确认修改',
    // tabs
    'tab.today': '今天',
    'tab.history': '历史',
    'tab.dreams': '梦想',
    'tab.stats': '统计',
    'tab.badges': '徽章',
    'tab.me': '我的',
    // share
    'share.previewSave': '保存图片',
    'share.previewClose': '关闭',
    'share.generating': '正在生成分享卡片...',
    'share.needContent': '先记录一些内容再分享吧',
    'share.linkFail': '生成分享链接失败: {msg}',
    'share.genFail': '生成失败: {msg}',
    'share.imgSaved': '图片已保存',
    'share.cardTitle': '📒 我的成功日记',
    'share.streak': '连续天数',
    'share.total': '总记录',
    'share.wins': '成功事项',
    'share.qrLabel': '扫码围观 · 点击一起开始记录',
    'share.footerStreak': '🔥 连续 {n} 天',
    'share.brand': '成功日记 · 小狗钱钱',
    // effects
    'fx.achievement': '成就达成',
    'fx.achievementSub': '今天又多了一点自信',
    'fx.levelUp': '升级！',
    'fx.newRank': '新称号：{rank}',
    'fx.save5.t': '高能记录官',
    'fx.save5.d': '一次写下 {n} 条，高光时刻爆发',
    'fx.save3.t': '今日目标达成',
    'fx.save3.d': '3 条成功事项已点亮',
    'fx.save1.t': '成功已入账',
    'fx.save1.d': '你刚刚为自信加了一格能量',
    // misc
    'announcement.close': '关闭公告',
    'limit.reminder': '今天已使用约 {n} 分钟，休息一下再回来吧',
    'lang.name': '语言',
  },
  en: {
    'app.title': 'Success Diary',
    'ob.0.h': 'Welcome to Success Diary',
    'ob.0.p': "Wisdom from 'Money Dog': record what makes you proud each day, and you'll find you're better than you imagined.",
    'ob.1.h': 'Log Daily · Level Up',
    'ob.1.p': 'Earn XP for every win you log. Fill the bar to level up and unlock titles, from "Confident Newbie" all the way to "Success King".',
    'ob.2.h': 'Unlock Badges',
    'ob.2.p': 'Triple hits, week-long streaks, all-category check-ins, dreams achieved… 20+ badges to collect in your gallery.',
    'ob.3.h': 'Pick Your Look',
    'ob.3.p': 'Starts with the Fresh Focus theme — switch themes anytime in "Me". Your diary, your rules.',
    'ob.skip': 'Skip',
    'ob.next': 'Next',
    'ob.start': 'Get Started',
    'auth.title': 'Success Diary',
    'auth.subtitle': 'Record your wins, build your confidence',
    'auth.displayName': 'Nickname',
    'auth.username': 'Username',
    'auth.password': 'Password',
    'auth.login': 'Log In',
    'auth.register': 'Sign Up',
    'auth.regClosed': 'Closed',
    'auth.haveNoAccount': "Don't have an account?",
    'auth.haveAccount': 'Already have an account?',
    'auth.regDisabledMsg': 'Registration is currently closed',
    'auth.needUserPass': 'Please enter username and password',
    'auth.needTurnstile': 'Please complete the verification first',
    'auth.turnstileMissing': 'Verification not configured',
    'auth.turnstileLoading': 'Loading verification...',
    'header.title': 'Success Diary',
    'unit.daysShort': 'd',
    'quote.author': '— Success Diary',
    'quest.head': '🎯 Daily Quests',
    'today.progressTitle': "Today's Wins",
    'today.progressHint0': 'Record what makes you proud',
    'today.progressHintMid': '{n} logged, keep going!',
    'today.progressHintAll': 'Awesome! All done!',
    'today.addRow': '+ Add another',
    'today.save': "Save Today's Log",
    'today.update': "Update Today's Log",
    'today.share': '📤 Generate Share Card',
    'today.entryPlaceholder': 'Win #{n}...',
    'today.removeTitle': 'Remove',
    'today.needOne': 'Log at least one win',
    'today.saved': 'Saved {n} entries ✓',
    'hero.subtitle': 'Another day of leveling up',
    'hero.streak': 'Streak',
    'hero.days': 'Days logged',
    'hero.wins': 'Wins',
    'hero.xp': 'XP {a} / {b}',
    'hero.next': 'Next Lv.{lv}',
    'q.three.t': 'Log 3 wins',
    'q.three.d': "Finish today's core check-in",
    'q.health.t': 'Log a "Health" item',
    'q.health.d': 'Caring for your body is success too',
    'q.streak.t': 'Keep your streak',
    'q.streak.d': "Don't break the chain",
    'q.history.t': 'Review history',
    'q.history.d': 'Open the History tab',
    'history.clickHint': 'Tap a date on the calendar to see details',
    'history.noEntry': 'No entries this day',
    'history.dayCount': '{n} entries',
    'cal.less': 'Less',
    'cal.more': 'More',
    'dreams.jarLabel': 'Wish Savings Jar',
    'dreams.deposit': '+ Deposit',
    'dreams.withdraw': '- Withdraw',
    'dreams.listTitle': 'Dream List',
    'dreams.inputPlaceholder': 'Write down your dream...',
    'dreams.costPlaceholder': '¥ Cost',
    'dreams.add': 'Add',
    'dreams.empty': 'Write down your dreams<br>Goals give you the drive to move forward',
    'dreams.added': 'Dream added',
    'dreams.doneTitle': 'Dream Achieved!',
    'dreams.doneText': '"{name}" completed',
    'dreams.progress': 'Progress',
    'savings.depositTitle': 'Deposit Amount',
    'savings.withdrawTitle': 'Withdraw Amount',
    'savings.amountPlaceholder': 'Enter amount',
    'savings.notePlaceholder': 'Note (optional)',
    'savings.confirm': 'Confirm',
    'savings.invalid': 'Please enter a valid amount',
    'savings.deposited': 'Deposited ¥{n}',
    'savings.withdrawn': 'Withdrew ¥{n}',
    'stats.totalDays': 'Days Logged',
    'stats.totalEntries': 'Total Wins',
    'stats.maxStreak': 'Longest Streak',
    'stats.avgPerDay': 'Avg / Day',
    'stats.growthTitle': '📈 Confidence Growth (Last 30 Days)',
    'stats.radarTitle': '🎯 Category Radar',
    'stats.tagTitle': '🏷️ Category Stats',
    'stats.noData': 'No data yet',
    'badges.all': 'All',
    'badges.unlocked': 'Unlocked',
    'badges.locked': 'Locked',
    'badges.summaryLabel': 'Badges Unlocked',
    'badges.unlockedState': 'Unlocked',
    'badges.empty': 'No badges yet',
    'badges.progressAria': 'Progress {label}',
    'badges.incomplete': 'Locked',
    'badges.unlockToast': '🏅 Badge unlocked: "{name}"',
    'unit.entries': '',
    'unit.days': 'd',
    'unit.categories': '',
    'unit.items': '',
    'unit.times': '',
    'unit.yuan': '',
    'profile.appearance': 'Appearance',
    'profile.language': 'Language / 语言',
    'profile.info': 'Profile',
    'profile.security': 'Security',
    'profile.displayName': 'Nickname',
    'profile.username': 'Username',
    'profile.createdAt': 'Joined',
    'profile.password': 'Password',
    'profile.edit': 'Edit',
    'profile.changePassword': 'Change Password',
    'profile.logout': 'Log Out',
    'profile.nameEmpty': 'Nickname cannot be empty',
    'profile.nameUpdated': 'Nickname updated',
    'profile.fillAll': 'Please fill in all fields',
    'profile.pwdChanged': 'Password changed',
    'modal.editName': 'Edit Nickname',
    'modal.newNamePlaceholder': 'Enter new nickname',
    'modal.save': 'Save',
    'modal.changePassword': 'Change Password',
    'modal.currentPassword': 'Current password',
    'modal.newPassword': 'New password (min 8 chars)',
    'modal.confirmChange': 'Confirm',
    'tab.today': 'Today',
    'tab.history': 'History',
    'tab.dreams': 'Dreams',
    'tab.stats': 'Stats',
    'tab.badges': 'Badges',
    'tab.me': 'Me',
    'share.previewSave': 'Save Image',
    'share.previewClose': 'Close',
    'share.generating': 'Generating share card...',
    'share.needContent': 'Log something before sharing',
    'share.linkFail': 'Failed to create share link: {msg}',
    'share.genFail': 'Generation failed: {msg}',
    'share.imgSaved': 'Image saved',
    'share.cardTitle': '📒 My Success Diary',
    'share.streak': 'Streak',
    'share.total': 'Days',
    'share.wins': 'Wins',
    'share.qrLabel': 'Scan to peek · start your own journey',
    'share.footerStreak': '🔥 {n}-day streak',
    'share.brand': 'Success Diary',
    'fx.achievement': 'Achievement Unlocked',
    'fx.achievementSub': 'A little more confidence today',
    'fx.levelUp': 'Level Up!',
    'fx.newRank': 'New title: {rank}',
    'fx.save5.t': 'Power Logger',
    'fx.save5.d': 'Logged {n} at once — highlight burst!',
    'fx.save3.t': 'Daily Goal Hit',
    'fx.save3.d': '3 wins lit up',
    'fx.save1.t': 'Win Banked',
    'fx.save1.d': 'You just added a bar of confidence',
    'announcement.close': 'Close announcement',
    'limit.reminder': "You've used about {n} minutes today — take a break and come back later",
    'lang.name': 'Language',
  },
};

// ---- structured dictionaries ----
const QUOTES_I18N = {
  zh: [
    "当你把精力集中在你能做到的事情上时，你就会变得越来越强大。",
    "你所关注的事物会在你的生活中不断增长。",
    "成功的第一步是相信自己能够成功。",
    "每一个小成就都是通向大成功的阶梯。",
    "坚持记录你的成功，你会惊讶于自己的成长。",
    "不是因为困难我们不敢做，而是因为不敢做才变得困难。",
    "财富和自信都来自于日积月累的小行动。",
    "梦想不会自己实现，但记录梦想是实现它的第一步。",
    "今天的每一个小小成就，都在为明天的大成功铺路。",
    "你已经做到了很多了不起的事情，只是你还没有注意到。",
  ],
  en: [
    "When you focus on what you can do, you grow stronger and stronger.",
    "Whatever you focus on grows in your life.",
    "The first step to success is believing you can succeed.",
    "Every small achievement is a step toward big success.",
    "Keep recording your wins and you'll be amazed at your growth.",
    "Things aren't hard because we dare not do them; they become hard because we dare not.",
    "Wealth and confidence both come from small actions repeated daily.",
    "Dreams don't come true on their own, but writing them down is the first step.",
    "Every little win today paves the way for tomorrow's big success.",
    "You've already done so many amazing things — you just haven't noticed yet.",
  ],
};

const TAG_LABELS_I18N = {
  zh: { '学习': '学习', '工作': '工作', '社交': '社交', '健康': '健康', '创意': '创意', '理财': '理财', '生活': '生活' },
  en: { '学习': 'Study', '工作': 'Work', '社交': 'Social', '健康': 'Health', '创意': 'Creativity', '理财': 'Finance', '生活': 'Life' },
};

const THEME_LABELS_I18N = {
  zh: { default: '清爽专注', boy: '科技少年', girl: '粉樱少女', princess: '金白皇室', anime: '漫画热血' },
  en: { default: 'Fresh Focus', boy: 'Tech Boy', girl: 'Sakura Girl', princess: 'Royal Gold', anime: 'Manga Pop' },
};

const RANK_LABELS_I18N = {
  zh: { novice: '自信新手', apprentice: '成功学徒', diarist: '日记达人', star: '坚持之星', hunter: '自信猎人', master: '高光大师', knight: '梦想骑士', king: '成功王者', legend: '传奇之路' },
  en: { novice: 'Confident Newbie', apprentice: 'Success Apprentice', diarist: 'Diary Pro', star: 'Consistency Star', hunter: 'Confidence Hunter', master: 'Highlight Master', knight: 'Dream Knight', king: 'Success King', legend: 'Legendary Path' },
};

const ACHV_I18N = {
  zh: {
    first_entry: { name: '初次记录', desc: '写下第一件成功的事' },
    three_in_day: { name: '三连击', desc: '一天记 3 条' },
    five_in_day: { name: '高光时刻', desc: '一天记 5 条' },
    ten_in_day: { name: '记录狂人', desc: '一天记 10 条' },
    streak_3: { name: '小试牛刀', desc: '连续 3 天记录' },
    streak_7: { name: '坚持一周', desc: '连续 7 天记录' },
    streak_14: { name: '半月不停', desc: '连续 14 天记录' },
    streak_30: { name: '一月之约', desc: '连续 30 天记录' },
    streak_100: { name: '百日传说', desc: '连续 100 天记录' },
    total_50: { name: '50 条里程碑', desc: '累计 50 条成功事项' },
    total_200: { name: '200 条达人', desc: '累计 200 条成功事项' },
    total_500: { name: '成功仓库', desc: '累计 500 条成功事项' },
    all_tags: { name: '全能选手', desc: '7 个分类全都打过卡' },
    first_dream: { name: '梦想启航', desc: '添加第一个梦想' },
    dream_done: { name: '梦想达成', desc: '完成一个梦想' },
    first_save: { name: '存钱起步', desc: '第一次往储蓄罐存钱' },
    save_1000: { name: '小金库', desc: '储蓄罐累计存到 ¥1000' },
    open_history: { name: '回望来路', desc: '打开历史页查看记录' },
    theme_change: { name: '形象设计师', desc: '切换一次主题' },
    share_card: { name: '分享时刻', desc: '生成一张分享卡片' },
  },
  en: {
    first_entry: { name: 'First Entry', desc: 'Write your first win' },
    three_in_day: { name: 'Triple Hit', desc: 'Log 3 in one day' },
    five_in_day: { name: 'Highlight Moment', desc: 'Log 5 in one day' },
    ten_in_day: { name: 'Record Maniac', desc: 'Log 10 in one day' },
    streak_3: { name: 'Warming Up', desc: '3-day streak' },
    streak_7: { name: 'One Week Strong', desc: '7-day streak' },
    streak_14: { name: 'Two Weeks Non-stop', desc: '14-day streak' },
    streak_30: { name: 'A Month Together', desc: '30-day streak' },
    streak_100: { name: '100-Day Legend', desc: '100-day streak' },
    total_50: { name: '50 Milestone', desc: 'Log 50 wins total' },
    total_200: { name: '200 Pro', desc: 'Log 200 wins total' },
    total_500: { name: 'Success Vault', desc: 'Log 500 wins total' },
    all_tags: { name: 'All-Rounder', desc: 'Check in all 7 categories' },
    first_dream: { name: 'Dream Launch', desc: 'Add your first dream' },
    dream_done: { name: 'Dream Achieved', desc: 'Complete a dream' },
    first_save: { name: 'First Save', desc: 'Save to the jar for the first time' },
    save_1000: { name: 'Little Treasury', desc: 'Save ¥1000 in the jar' },
    open_history: { name: 'Looking Back', desc: 'Open the history page' },
    theme_change: { name: 'Stylist', desc: 'Switch a theme' },
    share_card: { name: 'Share Moment', desc: 'Generate a share card' },
  },
};

const WEEKDAYS_I18N = {
  zh: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};
const CAL_WEEKDAYS_I18N = {
  zh: ['日', '一', '二', '三', '四', '五', '六'],
  en: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
};
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ---- helpers ----
function t(key, params) {
  let s = (I18N[lang] && I18N[lang][key]) || I18N.zh[key] || key;
  if (params) {
    for (const k in params) s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), params[k]);
  }
  return s;
}
function getLang() { return lang; }
function tagLabel(tag) { return (TAG_LABELS_I18N[lang] && TAG_LABELS_I18N[lang][tag]) || tag; }
function themeLabel(key) { return (THEME_LABELS_I18N[lang] && THEME_LABELS_I18N[lang][key]) || key; }
function rankTitle(rank) { return (RANK_LABELS_I18N[lang] && RANK_LABELS_I18N[lang][rank.key]) || rank.key; }
function achvName(code) { return (ACHV_I18N[lang][code] || ACHV_I18N.zh[code] || {}).name || code; }
function achvDesc(code) { return (ACHV_I18N[lang][code] || ACHV_I18N.zh[code] || {}).desc || ''; }
function localizedQuotes() { return QUOTES_I18N[lang] || QUOTES_I18N.zh; }
function weekdayName(idx) { return (WEEKDAYS_I18N[lang] || WEEKDAYS_I18N.zh)[idx]; }
function calWeekdays() { return CAL_WEEKDAYS_I18N[lang] || CAL_WEEKDAYS_I18N.zh; }

// localized full date: 2026年5月22日 / May 22, 2026
function fmtFullDate(d) {
  const y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
  return lang === 'en' ? `${MONTHS_EN[m]} ${day}, ${y}` : `${y}年${m + 1}月${day}日`;
}
// localized month header: 2026年5月 / May 2026
function fmtMonthYear(y, m) {
  return lang === 'en' ? `${MONTHS_EN[m]} ${y}` : `${y}年${m + 1}月`;
}

// Apply static translations to DOM (elements with data-i18n / data-i18n-ph / data-i18n-html)
function applyI18n() {
  document.title = t('app.title');
  document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
  document.querySelectorAll('[data-i18n]').forEach(elm => {
    elm.textContent = t(elm.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-html]').forEach(elm => {
    elm.innerHTML = t(elm.getAttribute('data-i18n-html'));
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(elm => {
    elm.setAttribute('placeholder', t(elm.getAttribute('data-i18n-ph')));
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(elm => {
    elm.setAttribute('aria-label', t(elm.getAttribute('data-i18n-aria')));
  });
}

function renderLangToggles() {
  document.querySelectorAll('.lang-switch').forEach(group => {
    group.querySelectorAll('button').forEach(b => {
      b.classList.toggle('active', b.dataset.lang === lang);
    });
  });
}

function setLang(l) {
  lang = l === 'en' ? 'en' : 'zh';
  localStorage.setItem('sd_lang', lang);
  applyI18n();
  renderLangToggles();
  if (typeof refreshDynamicI18n === 'function') refreshDynamicI18n();
}
