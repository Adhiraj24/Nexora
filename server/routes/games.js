import express from 'express';
import GameQuestion from '../models/GameQuestion.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get game questions
router.get('/:gameType', authenticate, async (req, res) => {
  try {
    const questions = await GameQuestion.find({
      gameType: req.params.gameType,
      active: true
    }).limit(10);

    res.json({ questions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create game question (admin)
router.post('/', authenticate, isAdmin, async (req, res) => {
  try {
    const { gameType, question, optionA, optionB, correctAnswer } = req.body;
    const gameQuestion = await GameQuestion.create({
      gameType,
      question,
      optionA,
      optionB,
      correctAnswer
    });
    res.status(201).json({ question: gameQuestion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;