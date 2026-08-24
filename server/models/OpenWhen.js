import mongoose from 'mongoose';

const openWhenSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  imageUrl: { type: String },
  unlockAt: { type: Date },
  opened: { type: Boolean, default: false },
  openedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model('OpenWhen', openWhenSchema);