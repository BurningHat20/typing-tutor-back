const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();



const app = express();
app.use(cors());
app.use(express.json());

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect((err) => {
  if (err) {
    console.error('Error connecting to database', err);
  } else {
    console.log('Connected to database');
  }
});

app.post('/api/test-history', async (req, res) => {
  const { email, wpm, accuracy, mistakes, backspacesUsed, lessonId, textId } = req.body;
  const sql = 'INSERT INTO test_history (email, wpm, accuracy, mistakes, backspaces_used, lesson_id, text_id, date) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *';
  try {
    const result = await pool.query(sql, [email, wpm, accuracy, mistakes, backspacesUsed, lessonId, textId]);
    res.status(201).json({ message: 'Record saved successfully', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/test-history/:email', async (req, res) => {
  const { email } = req.params;
  const sql = 'SELECT * FROM test_history WHERE email = $1 ORDER BY date DESC';
  try {
    const result = await pool.query(sql, [email]);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/high-score/:email', async (req, res) => {
  const { email } = req.params;
  const sql = 'SELECT MAX(wpm) as highScore FROM test_history WHERE email = $1';
  try {
    const result = await pool.query(sql, [email]);
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = app;