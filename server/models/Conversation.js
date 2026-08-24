import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isFavorite: { type: Boolean, default: false },
  nickname: { type: String, default: '' },
  wallpaper: { type: String, default: '' },
  vanishMode: {
    enabled: { type: Boolean, default: false },
    duration: { type: Number, default: 0 } // in seconds
  },
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' }
}, { timestamps: true });

export default mongoose.model('Conversation', conversationSchema);