// server.js

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://typing-tutor-react.vercel.app/'  // Replace with your actual frontend domain
    : 'http://localhost:3000'
}));
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Connect to the database
pool.connect((err) => {
  if (err) {
    console.error('Error connecting to database', err);
  } else {
    console.log('Connected to database');
  }
});

// Routes
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// For production (Vercel)
module.exports = app;