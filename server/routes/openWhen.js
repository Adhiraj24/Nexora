import express from 'express';
import OpenWhen from '../models/OpenWhen.js';
import { authenticate, isAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Get user's open when messages
router.get('/', authenticate, async (req, res) => {
  try {
    const messages = await OpenWhen.find({ recipient: req.userId })
      .sort({ createdAt: -1 });

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Open message
router.put('/:id/open', authenticate, async (req, res) => {
  try {
    const message = await OpenWhen.findById(req.params.id);
    
    if (message.recipient.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (message.unlockAt && new Date() < message.unlockAt) {
      return res.status(400).json({ error: 'Not yet unlockable' });
    }

    message.opened = true;
    message.openedAt = new Date();
    await message.save();

    res.json({ message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create open when (admin)
router.post('/', authenticate, isAdmin, upload.single('image'), async (req, res) => {
  try {
    const { recipientId, title, content, unlockAt } = req.body;
    
    const messageData = {
      recipient: recipientId,
      title,
      content,
      unlockAt: unlockAt ? new Date(unlockAt) : null
    };

    if (req.file) {
      messageData.imageUrl = `/uploads/${req.file.filename}`;
    }

    const message = await OpenWhen.create(messageData);
    res.status(201).json({ message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;