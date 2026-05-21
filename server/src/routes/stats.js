const express = require('express');
const { pool } = require('../db');
const router = express.Router();

// 格式化日期为 YYYY-MM-DD（避免时区偏移）
function formatDateLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 综合统计
router.get('/', async (req, res) => {
  try {
    // 总记录天数和总条目
    const totalResult = await pool.query(
      `SELECT COUNT(DISTINCT entry_date) as total_days, COUNT(*) as total_entries
       FROM entries WHERE user_id = $1`,
      [req.userId]
    );

    // 每日条目数（用于计算连续天数）
    const datesResult = await pool.query(
      `SELECT entry_date, COUNT(*) as count FROM entries
       WHERE user_id = $1 GROUP BY entry_date ORDER BY entry_date`,
      [req.userId]
    );

    const dates = datesResult.rows.map(r => {
      const d = new Date(r.entry_date);
      return formatDateLocal(d);
    });

    // 计算最长连续天数
    let maxStreak = 0, currentStreak = 0;
    for (let i = 0; i < dates.length; i++) {
      if (i === 0) { currentStreak = 1; }
      else {
        const prev = new Date(dates[i - 1]);
        const curr = new Date(dates[i]);
        const diff = (curr - prev) / (1000 * 60 * 60 * 24);
        currentStreak = diff === 1 ? currentStreak + 1 : 1;
      }
      maxStreak = Math.max(maxStreak, currentStreak);
    }

    // 当前连续天数
    let streak = 0;
    const today = formatDateLocal(new Date());
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);
    if (!dates.includes(today)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    while (true) {
      const key = formatDateLocal(checkDate);
      if (dates.includes(key)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else break;
    }

    // 分类统计
    const tagResult = await pool.query(
      `SELECT tag, COUNT(*) as count FROM entries
       WHERE user_id = $1 GROUP BY tag ORDER BY count DESC`,
      [req.userId]
    );

    // 近30天每日条目数
    const last30Result = await pool.query(
      `SELECT entry_date, COUNT(*) as count FROM entries
       WHERE user_id = $1 AND entry_date >= CURRENT_DATE - INTERVAL '29 days'
       GROUP BY entry_date ORDER BY entry_date`,
      [req.userId]
    );

    const totalDays = parseInt(totalResult.rows[0].total_days);
    const totalEntries = parseInt(totalResult.rows[0].total_entries);

    res.json({
      totalDays,
      totalEntries,
      maxStreak,
      currentStreak: streak,
      avgPerDay: totalDays > 0 ? (totalEntries / totalDays).toFixed(1) : '0',
      tagStats: tagResult.rows,
      last30Days: last30Result.rows
    });
  } catch (err) {
    console.error('统计失败:', err);
    res.status(500).json({ error: '获取统计失败' });
  }
});

module.exports = router;
