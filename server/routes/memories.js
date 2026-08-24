import express from 'express';
import Memory from '../models/Memory.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Get memories
router.get('/:conversationId', authenticate, async (req, res) => {
  try {
    const memories = await Memory.find({
      conversation: req.params.conversationId
    })
      .populate('createdBy', '-password')
      .sort({ date: -1 });

    res.json({ memories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create memory
router.post('/', authenticate, upload.single('image'), async (req, res) => {
  try {
    const { conversationId, type, content, title, date } = req.body;
    
    const memoryData = {
      conversation: conversationId,
      createdBy: req.userId,
      type,
      content,
      title,
      date: date || new Date()
    };

    if (req.file) {
      memoryData.imageUrl = `/uploads/${req.file.filename}`;
    }

    const memory = await Memory.create(memoryData);
    await memory.populate('createdBy', '-password');

    res.status(201).json({ memory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete memory
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await Memory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Memory deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;