import { supabase } from './database';
import bcrypt from 'bcryptjs';

export interface UserRow {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'user' | 'driver' | 'admin';
  membership_tier: 'none' | 'silver' | 'gold' | 'platinum';
  membership_expiry: string | null;
  created_at: string;
}

export interface BookingRow {
  id: string;
  user_id: string;
  driver_id: string | null;
  route_from: string;
  route_to: string;
  waypoints: string[];
  vehicle_type: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  price: number;
  driver_lat: number | null;
  driver_lng: number | null;
  driver_location_updated_at: string | null;
  created_at: string;
}

export interface TransactionRow {
  id: number;
  booking_id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
}

async function seedAccounts() {
  const defaultUsers = [
    {
      name: 'Admin GOtravel',
      email: 'admin@gotravel.com',
      password: bcrypt.hashSync('adminpassword123', 10),
      role: 'admin',
    },
    {
      name: 'Sopir Budi',
      email: 'driver@gotravel.com',
      password: bcrypt.hashSync('driverpassword123', 10),
      role: 'driver',
    },
    {
      name: 'Farhan',
      email: 'farhan@example.com',
      password: bcrypt.hashSync('password123', 10),
      role: 'user',
    },
  ];

  for (const u of defaultUsers) {
    const { data: existing } = await supabase.from('users').select('id').eq('email', u.email).maybeSingle();
    if (!existing) {
      await supabase.from('users').insert(u);
    }
  }
}

setTimeout(seedAccounts, 3000);

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const { data } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
  return data as UserRow | null;
}

export async function createUser(userData: { name: string; email: string; password: string; role: string }) {
  const { data } = await supabase.from('users').insert(userData).select().single();
  return data;
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const { data } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
  return data as UserRow | null;
}

export async function updateUserMembership(id: string, tier: string, expiry: Date | null) {
  const { data } = await supabase.from('users').update({ membership_tier: tier, membership_expiry: expiry?.toISOString() || null }).eq('id', id).select().single();
  return data;
}

export async function createBookingRecord(bookingData: {
  user_id: string;
  route_from: string;
  route_to: string;
  waypoints?: string[];
  vehicle_type: string;
  price: number;
}) {
  const { data } = await supabase.from('bookings').insert(bookingData).select().single();
  return data;
}

export async function findBookingById(id: string): Promise<BookingRow | null> {
  const { data } = await supabase.from('bookings').select('*').eq('id', id).maybeSingle();
  return data as BookingRow | null;
}

export async function logTransactionRecord(bookingId: string, userId: string, amount: number, status: string) {
  const { data } = await supabase.from('transactions').insert({ booking_id: bookingId, user_id: userId, amount, status }).select().single();
  return data;
}

export async function getAllBookingsRecord(): Promise<BookingRow[]> {
  const { data } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
  return (data || []) as BookingRow[];
}

export async function getAvailableBookingsRecord(): Promise<BookingRow[]> {
  const { data } = await supabase.from('bookings').select('*').is('driver_id', null).order('created_at', { ascending: false });
  return (data || []) as BookingRow[];
}

export async function acceptBookingRecord(bookingId: string, driverId: string) {
  const { data } = await supabase.from('bookings').update({ driver_id: driverId, status: 'confirmed' }).eq('id', bookingId).select().single();
  return data;
}

export async function getDriverBookingsRecord(driverId: string): Promise<BookingRow[]> {
  const { data } = await supabase.from('bookings').select('*').eq('driver_id', driverId).order('created_at', { ascending: false });
  return (data || []) as BookingRow[];
}

export async function getUserBookingsRecord(userId: string): Promise<BookingRow[]> {
  const { data } = await supabase.from('bookings').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return (data || []) as BookingRow[];
}

export async function getAllTransactionsRecord(): Promise<TransactionRow[]> {
  const { data } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
  return (data || []) as TransactionRow[];
}

export async function updateDriverLocation(bookingId: string, lat: number, lng: number) {
  const { data } = await supabase.from('bookings').update({
    driver_lat: lat,
    driver_lng: lng,
    driver_location_updated_at: new Date().toISOString(),
  }).eq('id', bookingId).select().single();
  return data;
}

export async function updateBookingStatus(bookingId: string, status: string) {
  const { data } = await supabase.from('bookings').update({ status }).eq('id', bookingId).select().single();
  return data;
}
