import express from 'express';
import Compliment from '../models/Compliment.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get random compliment
router.get('/random', authenticate, async (req, res) => {
  try {
    const count = await Compliment.countDocuments({ active: true });
    const random = Math.floor(Math.random() * count);
    const compliment = await Compliment.findOne({ active: true }).skip(random);
    
    res.json({ compliment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all compliments (admin)
router.get('/', authenticate, isAdmin, async (req, res) => {
  try {
    const compliments = await Compliment.find().sort({ createdAt: -1 });
    res.json({ compliments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create compliment (admin)
router.post('/', authenticate, isAdmin, async (req, res) => {
  try {
    const { text } = req.body;
    const compliment = await Compliment.create({ text });
    res.status(201).json({ compliment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete compliment (admin)
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    await Compliment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Compliment deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;