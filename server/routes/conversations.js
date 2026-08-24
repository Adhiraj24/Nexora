import express from 'express';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get or create conversation
router.post('/', authenticate, async (req, res) => {
  try {
    const { participantId } = req.body;
    
    let conversation = await Conversation.findOne({
      participants: { $all: [req.userId, participantId] }
    }).populate('participants', '-password').populate('lastMessage');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.userId, participantId]
      });
      conversation = await conversation.populate('participants', '-password');
    }

    res.json({ conversation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all conversations with unread count
router.get('/', authenticate, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.userId
    })
      .populate('participants', '-password')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    // Add unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: req.userId },
          read: false,
          deleted: false
        });

        return {
          ...conv.toObject(),
          unreadCount
        };
      })
    );

    res.json({ conversations: conversationsWithUnread });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update conversation settings
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { isFavorite, nickname, wallpaper, vanishMode } = req.body;
    const updates = {};

    if (isFavorite !== undefined) updates.isFavorite = isFavorite;
    if (nickname !== undefined) updates.nickname = nickname;
    if (wallpaper !== undefined) updates.wallpaper = wallpaper;
    if (vanishMode !== undefined) updates.vanishMode = vanishMode;

    const conversation = await Conversation.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).populate('participants', '-password');

    res.json({ conversation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all messages as read in a conversation
router.post('/:id/mark-read', authenticate, async (req, res) => {
  try {
    await Message.updateMany(
      {
        conversation: req.params.id,
        sender: { $ne: req.userId },
        read: false
      },
      {
        read: true,
        readAt: new Date()
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;