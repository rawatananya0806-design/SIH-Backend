const express = require('express');
const axios = require('axios');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const geminiService = require('../services/geminiService');

const router = express.Router();

/**
 * GET all quizzes
 */
router.get('/', async (req, res) => {
  try {
    const { category, difficulty, limit = 10 } = req.query;
    
    const filter = {};
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;

    const quizzes = await Quiz.find(filter)
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ quizzes });
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * CREATE new quiz (admin only)
 */
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { question, options, answer, category, difficulty, points } = req.body;

    const quiz = new Quiz({
      question,
      options,
      answer,
      category,
      difficulty,
      points,
      createdBy: req.user._id
    });

    await quiz.save();
    await quiz.populate('createdBy', 'username');

    res.status(201).json({
      message: 'Quiz created successfully',
      quiz
    });
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(400).json({ message: error.message });
  }
});

/**
 * AI QUIZ GENERATION (allow all users)
 */
router.post('/ai', authMiddleware, async (req, res) => {
  try {
    const { trainingContent } = req.body;

    if (!trainingContent) {
      return res.status(400).json({ message: 'Training content is required' });
    }

    // Generate quizzes with Gemini AI
    const generatedQuizzes = await geminiService.generateQuiz(trainingContent);

    // Save generated quizzes to database
    const savedQuizzes = [];
    for (const quizData of generatedQuizzes) {
      const quiz = new Quiz({
        ...quizData,
        createdBy: req.user._id
      });
      await quiz.save();
      await quiz.populate('createdBy', 'username');
      savedQuizzes.push(quiz);
    }

    res.json({
      message: `${savedQuizzes.length} quizzes generated and saved successfully`,
      quizzes: savedQuizzes
    });
  } catch (error) {
    console.error('AI quiz generation error:', error);
    res.status(500).json({ message: 'Failed to generate quizzes with AI' });
  }
});

/**
 * FETCH quiz from EXTERNAL APIs (NASA/ReliefWeb)
 */
router.get('/external', async (req, res) => {
  try {
    const useNatural = Math.random() > 0.5;
    let quizData;

    if (useNatural) {
      // NASA EONET API
      const nasaRes = await axios.get("https://eonet.gsfc.nasa.gov/api/v3/events");
      console.log(nasaRes);
      const events = nasaRes.data.events;
      if (!events || events.length === 0) {
        return res.json({ message: "No disaster data available" });
      }
      const event = events[Math.floor(Math.random() * events.length)];

      const allTypes = ["Earthquake", "Flood", "Cyclone", "Wildfire", "Volcano", "Storm"];
      const correct = event.categories[0]?.title || "Unknown";
      const options = [...new Set([correct, ...allTypes.sort(() => 0.5 - Math.random()).slice(0, 3)])];

      quizData = {
        question: `What type of disaster was "${event.title}"?`,
        options,
        answer: correct,
        category: "Disaster",
        difficulty: "medium",
        points: 10
      };
    } else {
      // ReliefWeb API
      const reliefRes = await axios.get("https://api.reliefweb.int/v1/disasters?profile=full&limit=50");
      console.log(reliefRes)
      const disasters = reliefRes.data.data;
      if (!disasters || disasters.length === 0) {
        return res.json({ message: "No disaster data available" });
      }
      const disaster = disasters[Math.floor(Math.random() * disasters.length)];

      const countryOptions = disaster.fields.country.map(c => c.name);
      const correctCountry = disaster.fields.country[0]?.name || "Unknown";

      quizData = {
        question: `In which country did the disaster "${disaster.fields.name}" occur?`,
        options: countryOptions,
        answer: correctCountry,
        category: disaster.fields.type[0]?.name || "Disaster",
        difficulty: "medium",
        points: 10
      };
    }

    // Save to database
    const quiz = new Quiz({
      ...quizData,
      createdBy: null // system generated
    });
    await quiz.save();

    res.json({ quiz });
  } catch (error) {
    console.error("External API quiz error:", error);
    res.status(500).json({ message: "Failed to fetch quiz from external API" });
  }
});

/**
 * SUBMIT quiz attempt
 */
router.post('/attempt', authMiddleware, async (req, res) => {
  try {
    const { quizId, selectedOption } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const user = await User.findById(req.user._id);
    const isCorrect = selectedOption.toLowerCase() === quiz.answer.toLowerCase();

    // Update user stats
    if (isCorrect) {
      user.streak += 1;
      user.points += quiz.points;

      // Award badges
      if (user.streak === 5 && !user.badges.includes('Streak Keeper')) {
        user.awardBadge('Streak Keeper');
      }
      if (user.streak === 10 && !user.badges.includes('Quiz Master')) {
        user.awardBadge('Quiz Master');
      }
      if (user.points >= 500 && !user.badges.includes('Emergency Expert')) {
        user.awardBadge('Emergency Expert');
      }
    } else {
      user.streak = 0;
    }

    user.lastQuizDate = new Date();
    user.calculateProgress();
    await user.save();

    res.json({
      message: isCorrect ? 'Correct answer!' : 'Wrong answer, but keep learning!',
      isCorrect,
      correctAnswer: quiz.answer,
      userStats: {
        points: user.points,
        streak: user.streak,
        badges: user.badges,
        progress: user.progress
      },
      newBadges: isCorrect ? user.badges.slice(-1) : []
    });
  } catch (error) {
    console.error('Quiz attempt error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * AI HINT / CHATBOT endpoint
 */
router.post('/hint', authMiddleware, async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ message: "Question is required for AI hint" });
    }
    const aiHelp = await geminiService.chatResponse(`Help me with this quiz question: ${question}`);
    res.json({ hint: aiHelp });
  } catch (error) {
    console.error("AI hint error:", error);
    res.status(500).json({ message: "Failed to generate AI hint" });
  }
});

/**
 * QUIZ statistics (admin only)
 */
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const totalQuizzes = await Quiz.countDocuments();
    const quizzesByCategory = await Quiz.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const quizzesByDifficulty = await Quiz.aggregate([
      { $group: { _id: '$difficulty', count: { $sum: 1 } } }
    ]);

    res.json({
      totalQuizzes,
      quizzesByCategory,
      quizzesByDifficulty
    });
  } catch (error) {
    console.error('Quiz stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
