import express from 'express';
import SpecialUser from '../models/SpecialUser.js';
import User from '../models/User.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all special users
router.get('/', authenticate, isAdmin, async (req, res) => {
  try {
    const specialUsers = await SpecialUser.find()
      .populate('user', '-password')
      .sort({ createdAt: -1 });
    res.json({ specialUsers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add special user
router.post('/', authenticate, isAdmin, async (req, res) => {
  try {
    const { userId, experiences } = req.body;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if already special user
    const existing = await SpecialUser.findOne({ user: userId });
    if (existing) {
      return res.status(400).json({ error: 'User is already a special user' });
    }
    
    const specialUser = await SpecialUser.create({
      user: userId,
      experiences: experiences || {
        goodNight: true,
        goodMorning: true,
        hiHello: true
      }
    });
    
    await specialUser.populate('user', '-password');
    res.status(201).json({ specialUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update special user
router.put('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { experiences, active } = req.body;
    
    const updates = {};
    if (experiences !== undefined) updates.experiences = experiences;
    if (active !== undefined) updates.active = active;
    
    const specialUser = await SpecialUser.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).populate('user', '-password');
    
    if (!specialUser) {
      return res.status(404).json({ error: 'Special user not found' });
    }
    
    res.json({ specialUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove special user
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    await SpecialUser.findByIdAndDelete(req.params.id);
    res.json({ message: 'Special user removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;