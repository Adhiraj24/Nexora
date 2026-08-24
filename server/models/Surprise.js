import mongoose from 'mongoose';

const surpriseSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['text', 'image', 'question', 'compliment'], required: true },
  content: { type: String, required: true },
  imageUrl: { type: String },
  unlockAt: { type: Date, required: true },
  unlocked: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Surprise', surpriseSchema);