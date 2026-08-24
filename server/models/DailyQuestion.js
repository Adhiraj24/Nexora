import mongoose from 'mongoose';

const dailyQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  date: { type: Date, required: true },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('DailyQuestion', dailyQuestionSchema);