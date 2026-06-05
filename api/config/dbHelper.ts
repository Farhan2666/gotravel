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

export async function createVehicle(data: any) {
  const { data: result } = await supabase.from('vehicles').insert(data).select().single();
  return result;
}

export async function getAllVehicles() {
  const { data } = await supabase.from('vehicles').select('*').order('created_at', { ascending: false });
  return data || [];
}

export async function getVehicleById(id: string) {
  const { data } = await supabase.from('vehicles').select('*').eq('id', id).maybeSingle();
  return data;
}

export async function updateVehicle(id: string, data: any) {
  const { data: result } = await supabase.from('vehicles').update(data).eq('id', id).select().single();
  return result;
}

export async function deleteVehicle(id: string) {
  await supabase.from('vehicles').delete().eq('id', id);
}

export async function getVehiclesByRoute(from: string, to: string) {
  const { data } = await supabase.from('vehicles').select('*')
    .eq('route_from', from).eq('route_to', to)
    .eq('status', 'active')
    .order('price', { ascending: true });
  return data || [];
}

export async function getDriverVehicles(driverId: string) {
  const { data } = await supabase.from('vehicles').select('*')
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false });
  return data || [];
}

async function seedVehicles() {
  const { data: existing } = await supabase.from('vehicles').select('id').limit(1);
  if (existing && existing.length > 0) return;

  const defaultVehicles = [
    { name: 'GOtravel Express', plate_number: 'B 1234 ABC', description: 'Bus eksekutif AC, reclining seat, toilet, wifi', route_from: 'Jakarta', route_to: 'Bandung', price: 150000, duration: '2h 30m', departure_time: '08:30', arrival_time: '11:00', seat_layout: { rows: 10, columns: 4, labels: ['A','B','C','D'], layout: 'standard' }, total_seats: 40 },
    { name: 'GOtravel VIP', plate_number: 'B 5678 DEF', description: 'VIP Super Luxury, seat 2-1, full entertainment', route_from: 'Jakarta', route_to: 'Bandung', price: 225000, duration: '2h 45m', departure_time: '14:15', arrival_time: '17:00', seat_layout: { rows: 6, columns: 3, labels: ['A','B','C'], layout: 'vip' }, total_seats: 18 },
    { name: 'GOtravel Ekonomi', plate_number: 'B 9012 GHI', description: 'Ekonomi plus nyaman, AC, TV', route_from: 'Jakarta', route_to: 'Bandung', price: 105000, duration: '2h 45m', departure_time: '18:00', arrival_time: '20:45', seat_layout: { rows: 12, columns: 4, labels: ['A','B','C','D'], layout: 'standard' }, total_seats: 48 },
    { name: 'GOtravel Executive', plate_number: 'B 3456 JKL', description: 'Executive class, bus double deck, toilet', route_from: 'Jakarta', route_to: 'Yogyakarta', price: 400000, duration: '7h 30m', departure_time: '07:00', arrival_time: '14:30', seat_layout: { rows: 8, columns: 4, labels: ['A','B','C','D'], layout: 'standard' }, total_seats: 32 },
    { name: 'GOtravel Sleeper', plate_number: 'B 7890 MNO', description: 'Sleeper class, bed reclining 180°, premium', route_from: 'Jakarta', route_to: 'Semarang', price: 350000, duration: '6h', departure_time: '21:00', arrival_time: '03:00', seat_layout: { rows: 5, columns: 3, labels: ['A','B','C'], layout: 'sleeper' }, total_seats: 15 },
  ];
  for (const v of defaultVehicles) {
    await supabase.from('vehicles').insert(v);
  }
}

setTimeout(seedVehicles, 3000);
