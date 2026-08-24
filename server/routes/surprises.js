import express from 'express';
import Surprise from '../models/Surprise.js';
import { authenticate, isAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Get user's surprises
router.get('/', authenticate, async (req, res) => {
  try {
    const surprises = await Surprise.find({ recipient: req.userId })
      .sort({ unlockAt: 1 });

    res.json({ surprises });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unlock surprise
router.put('/:id/unlock', authenticate, async (req, res) => {
  try {
    const surprise = await Surprise.findById(req.params.id);
    
    if (surprise.recipient.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (new Date() < surprise.unlockAt) {
      return res.status(400).json({ error: 'Not yet unlockable' });
    }

    surprise.unlocked = true;
    await surprise.save();

    res.json({ surprise });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create surprise (admin)
router.post('/', authenticate, isAdmin, upload.single('image'), async (req, res) => {
  try {
    const { recipientId, type, content, unlockAt } = req.body;
    
    const surpriseData = {
      recipient: recipientId,
      type,
      content,
      unlockAt: new Date(unlockAt)
    };

    if (req.file) {
      surpriseData.imageUrl = `/uploads/${req.file.filename}`;
    }

    const surprise = await Surprise.create(surpriseData);
    res.status(201).json({ surprise });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;