const express = require('express');
const { pool } = require('../db');
const { validate, savingsSchema } = require('../validators');
const router = express.Router();

// 获取存钱罐余额和记录
router.get('/', async (req, res) => {
  try {
    const balanceResult = await pool.query(
      `SELECT COALESCE(
        SUM(CASE WHEN type = 'deposit' THEN amount ELSE -amount END), 0
      ) as balance FROM savings WHERE user_id = $1`,
      [req.userId]
    );

    const logsResult = await pool.query(
      'SELECT * FROM savings WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.userId]
    );

    res.json({
      balance: parseFloat(balanceResult.rows[0].balance),
      logs: logsResult.rows
    });
  } catch (err) {
    res.status(500).json({ error: '获取余额失败' });
  }
});

// 存入/支出 —— 事务化 + 行锁防并发
router.post('/', validate(savingsSchema), async (req, res) => {
  const client = await pool.connect();
  try {
    const { type, amount, note } = req.validated;

    await client.query('BEGIN');

    // 使用 FOR UPDATE 行锁，防止并发竞态
    // 因为 savings 没有 balance 列，用 advisory lock 代替
    // advisory lock key = user_id，保证同一用户的存取操作串行化
    await client.query('SELECT pg_advisory_xact_lock($1)', [req.userId]);

    // 检查余额（提现时）
    if (type === 'withdraw') {
      const balanceResult = await client.query(
        `SELECT COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount ELSE -amount END), 0) as balance
         FROM savings WHERE user_id = $1`,
        [req.userId]
      );
      const balance = parseFloat(balanceResult.rows[0].balance);
      if (balance < amount) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `余额不足（当前 ¥${balance}）` });
      }
    }

    // 插入记录
    const result = await client.query(
      'INSERT INTO savings (user_id, type, amount, note) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.userId, type, amount, note]
    );

    // 查询最新余额
    const newBalanceResult = await client.query(
      `SELECT COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount ELSE -amount END), 0) as balance
       FROM savings WHERE user_id = $1`,
      [req.userId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      record: result.rows[0],
      balance: parseFloat(newBalanceResult.rows[0].balance)
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('存取操作失败:', err);
    res.status(500).json({ error: '操作失败' });
  } finally {
    client.release();
  }
});

module.exports = router;
