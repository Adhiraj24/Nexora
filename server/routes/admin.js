import express from 'express';
import User from '../models/User.js';
import Compliment from '../models/Compliment.js';
import DailyQuestion from '../models/DailyQuestion.js';
import GameQuestion from '../models/GameQuestion.js';
import AlmostSaid from '../models/AlmostSaid.js';
import Surprise from '../models/Surprise.js';
import OpenWhen from '../models/OpenWhen.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Get all users
router.get('/users', authenticate, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all compliments
router.get('/compliments', authenticate, isAdmin, async (req, res) => {
  try {
    const compliments = await Compliment.find().sort({ createdAt: -1 });
    res.json({ compliments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all questions
router.get('/questions', authenticate, isAdmin, async (req, res) => {
  try {
    const questions = await DailyQuestion.find().sort({ date: -1 });
    res.json({ questions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all game questions
router.get('/game-questions', authenticate, isAdmin, async (req, res) => {
  try {
    const questions = await GameQuestion.find().sort({ createdAt: -1 });
    res.json({ questions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all almost said messages
router.get('/almost-said', authenticate, isAdmin, async (req, res) => {
  try {
    const messages = await AlmostSaid.find().sort({ createdAt: -1 });
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create almost said message
router.post('/almost-said', authenticate, isAdmin, async (req, res) => {
  try {
    const { text } = req.body;
    const message = await AlmostSaid.create({ text });
    res.status(201).json({ message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all surprises
router.get('/surprises', authenticate, isAdmin, async (req, res) => {
  try {
    const surprises = await Surprise.find()
      .populate('recipient', '-password')
      .sort({ unlockAt: -1 });
    res.json({ surprises });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all open when messages
router.get('/open-when', authenticate, isAdmin, async (req, res) => {
  try {
    const messages = await OpenWhen.find()
      .populate('recipient', '-password')
      .sort({ createdAt: -1 });
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add this route after the getUsers route
router.delete('/users/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isAdmin) {
      return res.status(403).json({ error: 'Cannot delete admin users' });
    }

    // Delete user's profile picture if exists
    if (user.profilePicture) {
      const picturePath = path.join(__dirname, '..', user.profilePicture);
      if (fs.existsSync(picturePath)) {
        fs.unlinkSync(picturePath);
      }
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;