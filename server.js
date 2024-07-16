const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:5173', 'https://typing-tutor-back.vercel.app'], // Add your frontend's production URL here
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let db;

async function connectToDatabase() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    db = client.db(process.env.DB_NAME);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

connectToDatabase();

app.post('/api/test-history', async (req, res) => {
  const { email, wpm, accuracy, mistakes, backspacesUsed, lessonId, textId } = req.body;
  const testHistory = {
    email,
    wpm,
    accuracy,
    mistakes,
    backspaces_used: backspacesUsed,
    lesson_id: lessonId,
    text_id: textId,
    date: new Date()
  };

  try {
    const result = await db.collection('test_history').insertOne(testHistory);
    res.status(201).json({ message: 'Record saved successfully', id: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/test-history/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const results = await db.collection('test_history')
      .find({ email })
      .sort({ date: -1 })
      .toArray();
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/high-score/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const result = await db.collection('test_history')
      .find({ email })
      .sort({ wpm: -1 })
      .limit(1)
      .toArray();
    
    const highScore = result.length > 0 ? result[0].wpm : 0;
    res.status(200).json({ highScore });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));