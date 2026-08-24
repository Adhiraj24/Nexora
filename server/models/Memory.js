import mongoose from 'mongoose';

const memorySchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['image', 'message', 'note'], required: true },
  content: { type: String },
  imageUrl: { type: String },
  date: { type: Date, default: Date.now },
  title: { type: String }
}, { timestamps: true });

export default mongoose.model('Memory', memorySchema);