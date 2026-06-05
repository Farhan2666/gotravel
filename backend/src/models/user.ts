import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'driver', 'admin'], default: 'user' },
  membership: {
    tier: { type: String, enum: ['none', 'silver', 'gold', 'platinum'], default: 'none' },
    expiry: { type: Date, default: null }
  },
  createdAt: { type: Date, default: Date.now }
});

export const User = model('User', userSchema);
