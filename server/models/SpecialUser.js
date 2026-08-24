import mongoose from 'mongoose';

const specialUserSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true 
  },
  experiences: {
    goodNight: { type: Boolean, default: true },
    goodMorning: { type: Boolean, default: true },
    hiHello: { type: Boolean, default: true }
  },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('SpecialUser', specialUserSchema);