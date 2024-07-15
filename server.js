const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

pool.connect((err) => {
  if (err) {
    console.error('Error connecting to the database', err.stack);
  } else {
    console.log('Connected to database');
  }
});

app.post('/api/test-history', async (req, res) => {
  const { email, wpm, accuracy, mistakes, backspacesUsed, lessonId, textId } = req.body;
  const query = 'INSERT INTO test_history (email, wpm, accuracy, mistakes, backspaces_used, lesson_id, text_id, date) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *';
  const values = [email, wpm, accuracy, mistakes, backspacesUsed, lessonId, textId];

  try {
    const result = await pool.query(query, values);
    res.status(201).json({ message: 'Record saved successfully', record: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/test-history/:email', async (req, res) => {
  const { email } = req.params;
  const query = 'SELECT * FROM test_history WHERE email = $1 ORDER BY date DESC';

  try {
    const result = await pool.query(query, [email]);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/high-score/:email', async (req, res) => {
  const { email } = req.params;
  const query = 'SELECT MAX(wpm) as high_score FROM test_history WHERE email = $1';

  try {
    const result = await pool.query(query, [email]);
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));