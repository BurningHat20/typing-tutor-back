const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    console.log('Database connection failed');
  } else {
    console.log('Connected to database');
  }
});

app.post('/api/test-history', (req, res) => {
  const { email, wpm, accuracy, mistakes, backspacesUsed, lessonId, textId } = req.body;
  const sql = 'INSERT INTO test_history (email, wpm, accuracy, mistakes, backspaces_used, lesson_id, text_id, date) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())';
  db.query(sql, [email, wpm, accuracy, mistakes, backspacesUsed, lessonId, textId], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(201).json({ message: 'Record saved successfully' });
    }
  });
});

app.get('/api/test-history/:email', (req, res) => {
  const { email } = req.params;
  const sql = 'SELECT * FROM test_history WHERE email = ? ORDER BY date DESC';
  db.query(sql, [email], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(200).json(results);
    }
  });
});

app.get('/api/high-score/:email', (req, res) => {
  const { email } = req.params;
  const sql = 'SELECT MAX(wpm) as highScore FROM test_history WHERE email = ?';
  db.query(sql, [email], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(200).json(results[0]);
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
