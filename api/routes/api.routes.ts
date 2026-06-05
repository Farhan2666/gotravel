import { Router } from 'express';
import { register, login } from '../controllers/user.controller';
import {
  createBooking,
  trackBooking,
  getMyBookings,
  getAvailableBookings,
  getDriverActiveBookings,
  acceptBooking,
  updateDriverLocation,
  adminGetBookings,
  adminGetTransactions
} from '../controllers/booking.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);

router.get('/routes', (req, res) => {
  res.json([
    { id: 'RT_001', from: 'Jakarta', to: 'Bandung', price: 150000, duration: '2h 30m' },
    { id: 'RT_002', from: 'Jakarta', to: 'Semarang', price: 350000, duration: '6h' },
    { id: 'RT_003', from: 'Bandung', to: 'Yogyakarta', price: 400000, duration: '7h 30m' }
  ]);
});

// Passenger bookings
router.post('/bookings', authMiddleware, createBooking);
router.get('/bookings/my', authMiddleware, getMyBookings);
router.get('/bookings/:id/track', authMiddleware, trackBooking);

// Driver routes
router.get('/driver/available-bookings', authMiddleware, getAvailableBookings);
router.get('/driver/active-bookings', authMiddleware, getDriverActiveBookings);
router.patch('/bookings/:id/accept', authMiddleware, acceptBooking);
router.post('/driver/location', authMiddleware, updateDriverLocation);

// Admin routes
router.get('/admin/bookings', authMiddleware, adminGetBookings);
router.get('/admin/transactions', authMiddleware, adminGetTransactions);

export default router;
