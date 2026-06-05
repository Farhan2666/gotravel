import { User } from '../models/user';
import { Booking } from '../models/booking';
import { pgPool } from './database';
import fs from 'fs';
import path from 'path';
import mongoose, { Types } from 'mongoose';
import bcrypt from 'bcryptjs';

const MOCK_DIR = path.join(__dirname, '../../mock_db');
if (!fs.existsSync(MOCK_DIR)) {
  fs.mkdirSync(MOCK_DIR, { recursive: true });
}

const USERS_FILE = path.join(MOCK_DIR, 'users.json');
const BOOKINGS_FILE = path.join(MOCK_DIR, 'bookings.json');
const TX_FILE = path.join(MOCK_DIR, 'transactions.json');

if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');
if (!fs.existsSync(BOOKINGS_FILE)) fs.writeFileSync(BOOKINGS_FILE, '[]');
if (!fs.existsSync(TX_FILE)) fs.writeFileSync(TX_FILE, '[]');

// Helper to hash password synchronously
function hashPasswordSync(pwd: string): string {
  return bcrypt.hashSync(pwd, 10);
}

// Pre-seed accounts if users list is empty or doesn't have admin
async function seedAccounts() {
  try {
    const defaultUsers = [
      {
        name: 'Admin GOtravel',
        email: 'admin@gotravel.com',
        password: hashPasswordSync('adminpassword123'),
        role: 'admin',
        membership: { tier: 'none', expiry: null }
      },
      {
        name: 'Sopir Budi',
        email: 'driver@gotravel.com',
        password: hashPasswordSync('driverpassword123'),
        role: 'driver',
        membership: { tier: 'none', expiry: null }
      },
      {
        name: 'Farhan',
        email: 'farhan@example.com',
        password: hashPasswordSync('password123'),
        role: 'user',
        membership: { tier: 'none', expiry: null }
      }
    ];

    // Seed Mongoose MongoDB if connected
    if (mongoose.connection.readyState === 1) {
      for (const u of defaultUsers) {
        const exist = await User.findOne({ email: u.email });
        if (!exist) {
          await new User(u).save();
          console.log(`Seeded MongoDB user: ${u.email}`);
        }
      }
    }

    // Seed JSON Mock File
    const fileUsers = readJSON(USERS_FILE);
    for (const u of defaultUsers) {
      const exist = fileUsers.some((fu: any) => fu.email === u.email);
      if (!exist) {
        const seededUser = {
          _id: new Types.ObjectId().toString(),
          ...u,
          createdAt: new Date().toISOString()
        };
        fileUsers.push(seededUser);
        console.log(`Seeded JSON user: ${u.email}`);
      }
    }
    writeJSON(USERS_FILE, fileUsers);
  } catch (err) {
    console.error('Failed to pre-seed accounts:', err);
  }
}

// Run seed on load
setTimeout(seedAccounts, 3000);

function readJSON(file: string): any[] {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return [];
  }
}

function writeJSON(file: string, data: any[]) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function findUserByEmail(email: string) {
  if (isMongoConnected()) {
    try {
      return await User.findOne({ email });
    } catch (e) {
      console.warn('Mongoose query failed, using JSON mock');
    }
  }
  const users = readJSON(USERS_FILE);
  return users.find((u: any) => u.email === email) || null;
}

export async function createUser(userData: any) {
  if (isMongoConnected()) {
    try {
      const user = new User(userData);
      await user.save();
      return user;
    } catch (e) {
      console.warn('Mongoose save failed, using JSON mock');
    }
  }
  const users = readJSON(USERS_FILE);
  const newUser = {
    _id: new Types.ObjectId().toString(),
    ...userData,
    membership: { tier: 'none', expiry: null },
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  writeJSON(USERS_FILE, users);
  return newUser;
}

export async function findUserById(id: string) {
  if (isMongoConnected()) {
    try {
      return await User.findById(id);
    } catch (e) {
      console.warn('Mongoose findById failed, using JSON mock');
    }
  }
  const users = readJSON(USERS_FILE);
  return users.find((u: any) => u._id === id || u._id?.toString() === id) || null;
}

export async function updateUserMembership(id: string, tier: string, expiry: Date | null) {
  if (isMongoConnected()) {
    try {
      return await User.findByIdAndUpdate(
        id,
        { 'membership.tier': tier, 'membership.expiry': expiry },
        { new: true }
      );
    } catch (e) {
      console.warn('Mongoose update failed, using JSON mock');
    }
  }
  const users = readJSON(USERS_FILE);
  const idx = users.findIndex((u: any) => u._id === id || u._id?.toString() === id);
  if (idx !== -1) {
    users[idx].membership = { tier, expiry: expiry ? expiry.toISOString() : null };
    writeJSON(USERS_FILE, users);
    return users[idx];
  }
  return null;
}

export async function createBookingRecord(bookingData: any) {
  if (isMongoConnected()) {
    try {
      const booking = new Booking(bookingData);
      await booking.save();
      return booking;
    } catch (e) {
      console.warn('Mongoose booking save failed, using JSON mock');
    }
  }
  const bookings = readJSON(BOOKINGS_FILE);
  const newBooking = {
    _id: new Types.ObjectId().toString(),
    driverId: null,
    ...bookingData,
    createdAt: new Date().toISOString()
  };
  bookings.push(newBooking);
  writeJSON(BOOKINGS_FILE, bookings);
  return newBooking;
}

export async function findBookingById(id: string) {
  if (isMongoConnected()) {
    try {
      return await Booking.findById(id);
    } catch (e) {
      console.warn('Mongoose booking findById failed, using JSON mock');
    }
  }
  const bookings = readJSON(BOOKINGS_FILE);
  return bookings.find((b: any) => b._id === id || b._id?.toString() === id) || null;
}

export async function logTransactionRecord(bookingId: string, userId: string, amount: number, status: string) {
  try {
    const query = 'INSERT INTO transactions (booking_id, user_id, amount, status) VALUES ($1, $2, $3, $4) RETURNING *';
    const values = [bookingId, userId, amount, status];
    return await pgPool.query(query, values);
  } catch (err: any) {
    console.warn('PostgreSQL log transaction failed, writing to JSON log:', err.message);
    const txs = readJSON(TX_FILE);
    const newTx = {
      id: txs.length + 1,
      booking_id: bookingId,
      user_id: userId,
      amount,
      status,
      created_at: new Date().toISOString()
    };
    txs.push(newTx);
    writeJSON(TX_FILE, txs);
    return { rows: [newTx] };
  }
}

// Admin and Driver Helpers
export async function getAllBookingsRecord() {
  if (isMongoConnected()) {
    try {
      return await Booking.find({});
    } catch (e) {
      console.warn('Mongoose Booking.find failed, using JSON mock');
    }
  }
  return readJSON(BOOKINGS_FILE);
}

export async function getAvailableBookingsRecord() {
  if (isMongoConnected()) {
    try {
      return await Booking.find({ driverId: null });
    } catch (e) {
      console.warn('Mongoose find failed, using JSON mock');
    }
  }
  const bookings = readJSON(BOOKINGS_FILE);
  return bookings.filter((b: any) => !b.driverId);
}

export async function acceptBookingRecord(bookingId: string, driverId: string) {
  if (isMongoConnected()) {
    try {
      return await Booking.findByIdAndUpdate(
        bookingId,
        { driverId, status: 'confirmed' },
        { new: true }
      );
    } catch (e) {
      console.warn('Mongoose update failed, using JSON mock');
    }
  }
  const bookings = readJSON(BOOKINGS_FILE);
  const idx = bookings.findIndex((b: any) => b._id === bookingId || b._id?.toString() === bookingId);
  if (idx !== -1) {
    bookings[idx].driverId = driverId;
    bookings[idx].status = 'confirmed';
    writeJSON(BOOKINGS_FILE, bookings);
    return bookings[idx];
  }
  return null;
}

export async function getDriverBookingsRecord(driverId: string) {
  if (isMongoConnected()) {
    try {
      return await Booking.find({ driverId });
    } catch (e) {
      console.warn('Mongoose find failed, using JSON mock');
    }
  }
  const bookings = readJSON(BOOKINGS_FILE);
  return bookings.filter((b: any) => b.driverId === driverId);
}

export async function getUserBookingsRecord(userId: string) {
  if (isMongoConnected()) {
    try {
      return await Booking.find({ userId });
    } catch (e) {
      console.warn('Mongoose find failed, using JSON mock');
    }
  }
  const bookings = readJSON(BOOKINGS_FILE);
  return bookings.filter((b: any) => b.userId === userId);
}
export async function getAllTransactionsRecord() {
  try {
    const result = await pgPool.query('SELECT * FROM transactions ORDER BY created_at DESC');
    return result.rows;
  } catch (err: any) {
    console.warn('PostgreSQL transactions query failed, reading JSON log:', err.message);
    const txs = readJSON(TX_FILE);
    return [...txs].reverse(); // Sort descending
  }
}

