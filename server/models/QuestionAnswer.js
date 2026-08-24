import mongoose from 'mongoose';

const questionAnswerSchema = new mongoose.Schema({
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'DailyQuestion', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answer: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('QuestionAnswer', questionAnswerSchema);