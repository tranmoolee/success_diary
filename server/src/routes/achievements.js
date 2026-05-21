const express = require('express');
const { pool } = require('../db');
const { validate, achievementsBatchSchema } = require('../validators');

const router = express.Router();

// 获取当前用户已解锁的徽章 code 列表
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT code FROM user_achievements WHERE user_id = $1',
      [req.userId]
    );
    res.json(result.rows.map(r => r.code));
  } catch (err) {
    console.error('获取徽章失败:', err);
    res.status(500).json({ error: '获取徽章失败' });
  }
});

// 批量上报新解锁的徽章（幂等）
router.post('/', validate(achievementsBatchSchema), async (req, res) => {
  const client = await pool.connect();
  try {
    const { codes } = req.validated;
    await client.query('BEGIN');
    for (const code of codes) {
      await client.query(
        `INSERT INTO user_achievements (user_id, code) VALUES ($1, $2)
         ON CONFLICT (user_id, code) DO NOTHING`,
        [req.userId, code]
      );
    }
    await client.query('COMMIT');
    res.json({ success: true, count: codes.length });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('保存徽章失败:', err);
    res.status(500).json({ error: '保存徽章失败' });
  } finally {
    client.release();
  }
});

module.exports = router;
