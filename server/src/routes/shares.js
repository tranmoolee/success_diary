const express = require('express');
const crypto = require('crypto');
const { pool } = require('../db');
const { validate, createShareSchema } = require('../validators');

const router = express.Router();

function generateCode() {
  return crypto.randomBytes(6).toString('base64url').slice(0, 8);
}

// POST / — create a share record, return share code + URL
router.post('/', validate(createShareSchema), async (req, res) => {
  try {
    const userId = req.userId;
    const { entryDate } = req.validated;

    const entriesResult = await pool.query(
      `SELECT text, tag FROM entries
       WHERE user_id = $1 AND entry_date = $2
       ORDER BY sort_order`,
      [userId, entryDate]
    );
    const entries = entriesResult.rows;
    if (entries.length === 0) {
      return res.status(400).json({ error: '请先保存当天记录再分享' });
    }

    let code;
    let inserted = false;
    for (let attempt = 0; attempt < 5; attempt++) {
      code = generateCode();
      try {
        await pool.query(
          `INSERT INTO shares (user_id, share_code, entry_date, entry_count, entries_snapshot)
           VALUES ($1, $2, $3, $4, $5::jsonb)`,
          [userId, code, entryDate, entries.length, JSON.stringify(entries)]
        );
        inserted = true;
        break;
      } catch (err) {
        if (err.code === '23505') continue; // unique violation, retry
        throw err;
      }
    }
    if (!inserted) {
      return res.status(500).json({ error: '生成分享码失败，请重试' });
    }

    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const shareUrl = `${protocol}://${host}/s/${code}`;

    res.json({ shareCode: code, shareUrl });
  } catch (err) {
    console.error('创建分享失败:', err);
    res.status(500).json({ error: '创建分享失败' });
  }
});

// GET /stats — return current user's share statistics
router.get('/stats', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT share_code, entry_date, entry_count, view_count, created_at
       FROM shares WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.userId]
    );
    const totalViews = rows.reduce((sum, r) => sum + r.view_count, 0);
    res.json({ shares: rows, totalShares: rows.length, totalViews });
  } catch (err) {
    console.error('获取分享统计失败:', err);
    res.status(500).json({ error: '获取分享统计失败' });
  }
});

module.exports = router;
