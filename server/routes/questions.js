import express from 'express';
import DailyQuestion from '../models/DailyQuestion.js';
import QuestionAnswer from '../models/QuestionAnswer.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get today's question
router.get('/today', authenticate, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let question = await DailyQuestion.findOne({
      date: { $gte: today },
      active: true
    });

    if (!question) {
      // Get random question if no specific one for today
      const count = await DailyQuestion.countDocuments({ active: true });
      const random = Math.floor(Math.random() * count);
      question = await DailyQuestion.findOne({ active: true }).skip(random);
    }

    if (question) {
      const answers = await QuestionAnswer.find({ question: question._id })
        .populate('user', '-password');
      
      res.json({ question, answers });
    } else {
      res.json({ question: null, answers: [] });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Answer question
router.post('/answer', authenticate, async (req, res) => {
  try {
    const { questionId, answer } = req.body;

    const existingAnswer = await QuestionAnswer.findOne({
      question: questionId,
      user: req.userId
    });

    if (existingAnswer) {
      existingAnswer.answer = answer;
      await existingAnswer.save();
      await existingAnswer.populate('user', '-password');
      return res.json({ answer: existingAnswer });
    }

    const newAnswer = await QuestionAnswer.create({
      question: questionId,
      user: req.userId,
      answer
    });
    
    await newAnswer.populate('user', '-password');
    res.status(201).json({ answer: newAnswer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create question (admin)
router.post('/', authenticate, isAdmin, async (req, res) => {
  try {
    const { question, date } = req.body;
    const dailyQuestion = await DailyQuestion.create({
      question,
      date: date ? new Date(date) : new Date()
    });
    res.status(201).json({ question: dailyQuestion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;