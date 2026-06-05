import { Response } from 'express';
import {
  createBookingRecord,
  findBookingById,
  logTransactionRecord,
  getAllBookingsRecord,
  getAvailableBookingsRecord,
  acceptBookingRecord,
  getDriverBookingsRecord,
  getUserBookingsRecord,
  getAllTransactionsRecord
} from '../config/dbHelper';
import { AuthRequest } from '../middlewares/auth';

// In-memory driver locations keyed by driverId
export const driverLocations: Record<string, { latitude: number; longitude: number; lastUpdated: Date }> = {};

export async function createBooking(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { route, vehicleType, price } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const booking = await createBookingRecord({
      userId,
      route,
      vehicleType,
      price,
      status: 'pending',
      driverId: null
    });

    const bookingId = booking._id ? booking._id.toString() : '';

    await logTransactionRecord(bookingId, userId, price, 'pending');

    res.status(201).json({
      message: 'Booking created successfully. Waiting for driver.',
      bookingId,
      trackingUrl: `http://localhost:5000/api/bookings/${bookingId}/track`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function trackBooking(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const booking = await findBookingById(id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    let location = {
      latitude: -6.2088 + (Math.random() - 0.5) * 0.002,
      longitude: 106.8456 + (Math.random() - 0.5) * 0.002,
    };
    let driverName = 'Mencari Driver...';
    let vehiclePlate = 'Belum Ada';
    let isRealGps = false;

    if (booking.driverId) {
      driverName = 'Sopir Budi (GOtravel)';
      vehiclePlate = 'B 1234 ABC';
      
      const realLoc = driverLocations[booking.driverId];
      if (realLoc) {
        location = {
          latitude: realLoc.latitude,
          longitude: realLoc.longitude
        };
        isRealGps = true;
      }
    }

    res.json({
      booking,
      driver: {
        name: driverName,
        vehiclePlate,
        location,
        isRealGps,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// Passenger - get my bookings
export async function getMyBookings(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const bookings = await getUserBookingsRecord(userId);
    res.json(bookings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// Driver Actions
export async function getAvailableBookings(req: AuthRequest, res: Response) {
  try {
    const list = await getAvailableBookingsRecord();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getDriverActiveBookings(req: AuthRequest, res: Response) {
  try {
    const driverId = req.user?.id;
    if (!driverId) return res.status(401).json({ error: 'Unauthorized' });

    const list = await getDriverBookingsRecord(driverId);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function acceptBooking(req: AuthRequest, res: Response) {
  try {
    const driverId = req.user?.id;
    const { id } = req.params;
    if (!driverId) return res.status(401).json({ error: 'Unauthorized' });

    const booking = await acceptBookingRecord(id, driverId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    res.json({ message: 'Booking accepted successfully', booking });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateDriverLocation(req: AuthRequest, res: Response) {
  try {
    const driverId = req.user?.id;
    const { latitude, longitude } = req.body;
    if (!driverId) return res.status(401).json({ error: 'Unauthorized' });

    driverLocations[driverId] = {
      latitude,
      longitude,
      lastUpdated: new Date()
    };

    res.json({ message: 'Driver location updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// Admin Actions
export async function adminGetBookings(req: AuthRequest, res: Response) {
  try {
    const role = (req as any).user?.role;
    if (role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const list = await getAllBookingsRecord();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function adminGetTransactions(req: AuthRequest, res: Response) {
  try {
    const role = (req as any).user?.role;
    if (role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const list = await getAllTransactionsRecord();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
