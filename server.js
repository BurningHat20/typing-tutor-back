const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:5174', 'https://typing-tutor-react.vercel.app.com'],
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
    console.error('Error saving test history:', error);
    res.status(500).json({ error: 'An error occurred while saving the record' });
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
    console.error('Error fetching test history:', error);
    res.status(500).json({ error: 'An error occurred while fetching the test history' });
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
    console.error('Error fetching high score:', error);
    res.status(500).json({ error: 'An error occurred while fetching the high score' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await db.collection('test_history').aggregate([
      {
        $group: {
          _id: '$email',
          highScore: { $max: '$wpm' },
          lastTestDate: { $max: '$date' },
          totalTests: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          email: '$_id',
          highScore: 1,
          lastTestDate: 1,
          totalTests: 1
        }
      }
    ]).toArray();
    
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'An error occurred while fetching users' });
  }
});

// New endpoint to get user statistics
app.get('/api/user-stats/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const stats = await db.collection('test_history').aggregate([
      { $match: { email: email } },
      { $group: {
          _id: null,
          avgWpm: { $avg: '$wpm' },
          highestWpm: { $max: '$wpm' },
          totalTests: { $sum: 1 },
          avgAccuracy: { $avg: '$accuracy' },
          totalMistakes: { $sum: '$mistakes' },
          totalBackspaces: { $sum: '$backspaces_used' }
        }
      },
      { $project: {
          _id: 0,
          avgWpm: { $round: ['$avgWpm', 2] },
          highestWpm: 1,
          totalTests: 1,
          avgAccuracy: { $round: ['$avgAccuracy', 2] },
          totalMistakes: 1,
          totalBackspaces: 1
        }
      }
    ]).toArray();

    if (stats.length === 0) {
      res.status(404).json({ message: 'No statistics found for this user' });
    } else {
      res.status(200).json(stats[0]);
    }
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({ error: 'An error occurred while fetching user statistics' });
  }
});

// New endpoint to get recent progress
app.get('/api/recent-progress/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const progress = await db.collection('test_history')
      .find({ email })
      .sort({ date: -1 })
      .limit(10)
      .project({ _id: 0, date: 1, wpm: 1, accuracy: 1 })
      .toArray();

    res.status(200).json(progress);
  } catch (error) {
    console.error('Error fetching recent progress:', error);
    res.status(500).json({ error: 'An error occurred while fetching recent progress' });
  }
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectToDatabase();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

startServer().catch(error => {
  console.error('Failed to start the server:', error);
  process.exit(1);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});