const express = require('express');
const postgres = require('postgres');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, ENDPOINT_ID } = process.env;

const sql = postgres({
  host: PGHOST,
  database: PGDATABASE,
  username: PGUSER,
  password: decodeURIComponent(PGPASSWORD),
  port: 5432,
  ssl: 'require',
  connection: {
    options: `project=${ENDPOINT_ID}`,
  },
});

// Test the database connection
async function testConnection() {
  try {
    await sql`SELECT 1`;
    console.log('Connected to database');
  } catch (err) {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  }
}

testConnection();

app.post('/api/test-history', async (req, res) => {
  const { email, wpm, accuracy, mistakes, backspacesUsed, lessonId, textId } = req.body;
  try {
    await sql`
      INSERT INTO test_history (email, wpm, accuracy, mistakes, backspaces_used, lesson_id, text_id, date)
      VALUES (${email}, ${wpm}, ${accuracy}, ${mistakes}, ${backspacesUsed}, ${lessonId}, ${textId}, CURRENT_TIMESTAMP)
    `;
    res.status(201).json({ message: 'Record saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/test-history/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const results = await sql`
      SELECT * FROM test_history WHERE email = ${email} ORDER BY date DESC
    `;
    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/high-score/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const results = await sql`
      SELECT MAX(wpm) as "highScore" FROM test_history WHERE email = ${email}
    `;
    res.status(200).json(results[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));