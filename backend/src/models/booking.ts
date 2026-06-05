import { Schema, model } from 'mongoose';

const bookingSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  driverId: { type: String, default: null },
  route: {
    from: { type: String, required: true },
    to: { type: String, required: true },
    waypoints: [{ type: String }]
  },
  vehicleType: { type: String, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
  price: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const Booking = model('Booking', bookingSchema);
