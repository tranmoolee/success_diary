const express = require('express');
const { pool } = require('../db');
const { validate, createDreamSchema, updateDreamSchema } = require('../validators');
const router = express.Router();

// 获取所有梦想
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM dreams WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: '获取梦想失败' });
  }
});

// 添加梦想
router.post('/', validate(createDreamSchema), async (req, res) => {
  try {
    const { name, cost } = req.validated;
    const result = await pool.query(
      'INSERT INTO dreams (user_id, name, cost) VALUES ($1, $2, $3) RETURNING *',
      [req.userId, name, cost]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: '添加梦想失败' });
  }
});

// 更新梦想
router.patch('/:id', validate(updateDreamSchema), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: '无效的 ID' });
    }

    const { done, saved } = req.validated;
    const fields = [];
    const values = [];
    let idx = 1;

    if (done !== undefined) { fields.push(`done = $${idx++}`); values.push(done); }
    if (saved !== undefined) { fields.push(`saved = $${idx++}`); values.push(saved); }

    values.push(id, req.userId);
    const result = await pool.query(
      `UPDATE dreams SET ${fields.join(', ')} WHERE id = $${idx++} AND user_id = $${idx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) return res.status(404).json({ error: '梦想不存在' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: '更新失败' });
  }
});

// 删除梦想
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: '无效的 ID' });
    }
    await pool.query('DELETE FROM dreams WHERE id = $1 AND user_id = $2', [id, req.userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '删除失败' });
  }
});

module.exports = router;
