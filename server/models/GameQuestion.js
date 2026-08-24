import mongoose from 'mongoose';

const gameQuestionSchema = new mongoose.Schema({
  gameType: { type: String, enum: ['would-you-rather', 'how-well'], required: true },
  question: { type: String, required: true },
  optionA: { type: String },
  optionB: { type: String },
  correctAnswer: { type: String },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('GameQuestion', gameQuestionSchema);