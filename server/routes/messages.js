import express from 'express';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import SpecialUser from '../models/SpecialUser.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { detectSpecialTrigger } from '../utils/messageDetection.js';

const router = express.Router();

// Get messages
router.get('/:conversationId', authenticate, async (req, res) => {
  try {
    const messages = await Message.find({
      conversation: req.params.conversationId,
      deleted: false
    })
      .populate('sender', '-password')
      .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'name' }
      })
      .sort({ createdAt: 1 });

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send message
router.post('/', authenticate, upload.single('file'), async (req, res) => {
  try {
    const { conversationId, content, type, replyTo, vanish } = req.body;
    
    const messageData = {
      conversation: conversationId,
      sender: req.userId,
      content,
      type: type || 'text',
      vanish: vanish === 'true'
    };

    if (req.file) {
      messageData.fileUrl = `/uploads/${req.file.filename}`;
    }

    if (replyTo) {
      messageData.replyTo = replyTo;
    }

    // Handle vanish mode
    if (messageData.vanish) {
      const conversation = await Conversation.findById(conversationId);
      if (conversation && conversation.vanishMode && conversation.vanishMode.enabled) {
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + conversation.vanishMode.duration);
        messageData.expiresAt = expiresAt;
      }
    }

    const message = await Message.create(messageData);
    await message.populate('sender', '-password');
    
    // Update conversation's last message
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      updatedAt: new Date()
    });

    // Get conversation to find recipient
    const conversation = await Conversation.findById(conversationId);
    const recipientId = conversation.participants.find(
      p => p.toString() !== req.userId.toString()
    );

    // Emit socket event to recipient
    const io = req.app.get('io');
    if (io && recipientId) {
      io.to(recipientId.toString()).emit('message:new', message);
      
      // ===== SPECIAL MESSAGE EXPERIENCE LOGIC =====
      // Only for text messages with content
      if (content && type !== 'image') {
        // Check if recipient is a Special User
        const specialUser = await SpecialUser.findOne({ 
          user: recipientId,
          active: true 
        });
        
        if (specialUser) {
          // Detect trigger
          const trigger = detectSpecialTrigger(content);
          
          if (trigger) {
            // Check if this experience is enabled
            let experienceEnabled = false;
            
            if (trigger === 'good-night' && specialUser.experiences.goodNight) {
              experienceEnabled = true;
            } else if (trigger === 'good-morning' && specialUser.experiences.goodMorning) {
              experienceEnabled = true;
            } else if (trigger === 'hi-hello' && specialUser.experiences.hiHello) {
              experienceEnabled = true;
            }
            
            if (experienceEnabled) {
              // Get sender info
              const sender = await message.populate('sender', 'name');
              
              // Emit special trigger event ONLY to recipient
              io.to(recipientId.toString()).emit('special:trigger', {
                type: trigger,
                messageId: message._id,
                conversationId: conversationId,
                senderName: sender.sender.name
              });
            }
          }
        }
      }
    }

    res.status(201).json({ message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark as read
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { read: true, readAt: new Date() },
      { new: true }
    ).populate('sender', '-password');

    res.json({ message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete message
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.sender.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    message.deleted = true;
    await message.save();

    const conversation = await Conversation.findById(message.conversation);
    const recipientId = conversation.participants.find(
      p => p.toString() !== req.userId.toString()
    );

    const io = req.app.get('io');
    if (io && recipientId) {
      io.to(recipientId.toString()).emit('message:deleted', {
        messageId: message._id,
        conversationId: message.conversation
      });
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add reaction
router.post('/:id/react', authenticate, async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const existingReaction = message.reactions.find(
      r => r.user.toString() === req.userId.toString()
    );

    if (existingReaction) {
      existingReaction.emoji = emoji;
    } else {
      message.reactions.push({ user: req.userId, emoji });
    }

    await message.save();
    await message.populate('sender', '-password');

    const conversation = await message.populate('conversation');
    const recipientId = conversation.conversation.participants.find(
      p => p.toString() !== req.userId.toString()
    );

    const io = req.app.get('io');
    if (io && recipientId) {
      io.to(recipientId.toString()).emit('message:reaction', {
        messageId: message._id,
        reactions: message.reactions
      });
      
      io.to(req.userId.toString()).emit('message:reaction', {
        messageId: message._id,
        reactions: message.reactions
      });
    }

    res.json({ message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;