const express = require('express');
const { pool } = require('../db');
const { validate, validateParams, saveEntriesSchema, dateSchema, yearMonthSchema } = require('../validators');
const router = express.Router();

// 获取某天的记录
router.get('/:date', validateParams({ date: dateSchema }), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, text, tag, sort_order FROM entries WHERE user_id = $1 AND entry_date = $2 ORDER BY sort_order',
      [req.userId, req.params.date]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: '获取记录失败' });
  }
});

// 获取某月有记录的日期
router.get('/month/:yearMonth', validateParams({ yearMonth: yearMonthSchema }), async (req, res) => {
  try {
    const [year, month] = req.params.yearMonth.split('-').map(Number);
    if (month < 1 || month > 12 || year < 2000 || year > 2100) {
      return res.status(400).json({ error: '日期范围错误' });
    }
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0);
    const endDate = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;

    const result = await pool.query(
      `SELECT entry_date, COUNT(*) as count
       FROM entries WHERE user_id = $1 AND entry_date BETWEEN $2 AND $3
       GROUP BY entry_date ORDER BY entry_date`,
      [req.userId, startDate, endDate]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: '获取月度数据失败' });
  }
});

// 保存/更新某天的记录（覆盖式）
router.put('/:date',
  validateParams({ date: dateSchema }),
  validate(saveEntriesSchema),
  async (req, res) => {
    const client = await pool.connect();
    try {
      const { entries } = req.validated;

      await client.query('BEGIN');

      await client.query(
        'DELETE FROM entries WHERE user_id = $1 AND entry_date = $2',
        [req.userId, req.params.date]
      );

      for (let i = 0; i < entries.length; i++) {
        const { text, tag } = entries[i];
        await client.query(
          'INSERT INTO entries (user_id, entry_date, text, tag, sort_order) VALUES ($1, $2, $3, $4, $5)',
          [req.userId, req.params.date, text, tag, i]
        );
      }

      await client.query('COMMIT');
      res.json({ success: true });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('保存记录失败:', err);
      res.status(500).json({ error: '保存失败' });
    } finally {
      client.release();
    }
  }
);

module.exports = router;
