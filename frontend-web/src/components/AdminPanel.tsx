import React, { useState, useEffect } from 'react';
import { DollarSign, Ticket, Users, Layers, ShieldCheck, Database, Calendar } from 'lucide-react';

interface AdminPanelProps {
  token: string | null;
  user: any;
}

export default function AdminPanel({ token, user }: AdminPanelProps) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'bookings' | 'postgres'>('bookings');
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    activeDrivers: 1,
    dbMode: 'Resilient JSON'
  });

  const loadAdminData = async () => {
    if (!token) return;
    try {
      // 1. Fetch Bookings
      const resBookings = await fetch('http://localhost:5000/api/admin/bookings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataBookings = await resBookings.json();
      if (resBookings.ok) {
        setBookings(dataBookings);
      }

      // 2. Fetch Transactions
      const resTx = await fetch('http://localhost:5000/api/admin/transactions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataTx = await resTx.json();
      if (resTx.ok) {
        setTransactions(dataTx);
      }
    } catch (e) {
      console.error('Failed to load admin dataset', e);
    }
  };

  useEffect(() => {
    loadAdminData();
    const interval = setInterval(loadAdminData, 6000);
    return () => clearInterval(interval);
  }, [token]);

  // Recalculate stats based on loaded bookings
  useEffect(() => {
    const revenue = bookings.reduce((sum, b) => sum + (b.price || 0), 0);
    setStats({
      totalBookings: bookings.length,
      totalRevenue: revenue,
      activeDrivers: 1, // Driver Budi seeded
      dbMode: bookings.length > 0 && bookings[0]._id && bookings[0]._id.length === 24 ? 'MongoDB Atlas' : 'Local JSON DB'
    });
  }, [bookings]);

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--color-border)' }}>
        <div>
          <h2 className="text-xl font-bold">Admin Management Control</h2>
          <p className="text-xs opacity-60">Administrator: {user.name} ({user.email})</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSubTab('bookings')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${activeSubTab === 'bookings' ? 'bg-blue-600 border-blue-500 text-white' : ''}`}
            style={{ borderColor: 'var(--color-border)' }}
          >
            Daftar Tiket Terpesan ({bookings.length})
          </button>
          <button
            onClick={() => setActiveSubTab('postgres')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 ${activeSubTab === 'postgres' ? 'bg-blue-600 border-blue-500 text-white' : ''}`}
            style={{ borderColor: 'var(--color-border)' }}
          >
            <Database className="w-3.5 h-3.5" />
            Log Transaksi PostgreSQL ({transactions.length})
          </button>
        </div>
      </div>

      {/* Stats Widget Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border flex items-center gap-3 bg-gray-500/5" style={{ borderColor: 'var(--color-border)' }}>
          <DollarSign className="w-8 h-8 text-green-500" />
          <div>
            <p className="text-[10px] opacity-60 uppercase font-black">Total Pendapatan</p>
            <p className="text-sm font-extrabold">Rp{stats.totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border flex items-center gap-3 bg-gray-500/5" style={{ borderColor: 'var(--color-border)' }}>
          <Ticket className="w-8 h-8 text-blue-500" />
          <div>
            <p className="text-[10px] opacity-60 uppercase font-black">Tiket Terpesan</p>
            <p className="text-sm font-extrabold">{stats.totalBookings} Pesanan</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border flex items-center gap-3 bg-gray-500/5" style={{ borderColor: 'var(--color-border)' }}>
          <Users className="w-8 h-8 text-indigo-500" />
          <div>
            <p className="text-[10px] opacity-60 uppercase font-black">Sopir Terdaftar</p>
            <p className="text-sm font-extrabold">{stats.activeDrivers} Driver</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border flex items-center gap-3 bg-gray-500/5" style={{ borderColor: 'var(--color-border)' }}>
          <Layers className="w-8 h-8 text-yellow-500" />
          <div>
            <p className="text-[10px] opacity-60 uppercase font-black">Database Core</p>
            <p className="text-[10px] font-extrabold text-yellow-500">{stats.dbMode}</p>
          </div>
        </div>
      </div>

      {/* Main View Tables */}
      {activeSubTab === 'bookings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider opacity-70 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              Detail Pembelian Tiket Penumpang
            </h3>
            <button onClick={loadAdminData} className="text-xs text-blue-500 hover:underline">Refresh Data</button>
          </div>

          <div className="border rounded-2xl overflow-x-auto shadow-md" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card-bg)' }}>
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b bg-neutral-900/30 opacity-70 font-bold" style={{ borderColor: 'var(--color-border)' }}>
                  <th className="p-3">ID Pemesanan</th>
                  <th className="p-3">Rute Keberangkatan</th>
                  <th className="p-3">Tipe Kelas</th>
                  <th className="p-3">Kursi</th>
                  <th className="p-3">Total Harga</th>
                  <th className="p-3">ID Driver</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center opacity-50">Belum ada pemesanan tiket kereta.</td>
                  </tr>
                ) : (
                  bookings.map(b => (
                    <tr key={b._id} className="border-b hover:bg-white/5 transition-colors" style={{ borderColor: 'var(--color-border)' }}>
                      <td className="p-3 font-mono text-[10px] truncate max-w-[80px]">{b._id}</td>
                      <td className="p-3 font-bold">{b.route?.from} → {b.route?.to}</td>
                      <td className="p-3">{b.vehicleType}</td>
                      <td className="p-3 font-mono font-bold text-blue-400">{b.route?.waypoints?.join(', ') || '-'}</td>
                      <td className="p-3 font-extrabold text-blue-500">Rp{b.price?.toLocaleString()}</td>
                      <td className="p-3 font-mono text-[9px] max-w-[60px] truncate">{b.driverId || <span className="opacity-45">Mencari...</span>}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${b.status === 'confirmed' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}`}>
                          {b.status?.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'postgres' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider opacity-70 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-500" />
              Log Pembayaran Transaksi Keuangan (PostgreSQL)
            </h3>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded font-black border border-emerald-500/20">LIVE AUDIT LOG</span>
          </div>

          <div className="border rounded-2xl overflow-x-auto shadow-md" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card-bg)' }}>
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b bg-neutral-900/30 opacity-70 font-bold" style={{ borderColor: 'var(--color-border)' }}>
                  <th className="p-3">ID Transaksi</th>
                  <th className="p-3">ID Booking</th>
                  <th className="p-3">ID Penumpang (User)</th>
                  <th className="p-3">Jumlah (Amount)</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Waktu Pencatatan (Timestamp)</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center opacity-50">Belum ada catatan keuangan di PostgreSQL.</td>
                  </tr>
                ) : (
                  transactions.map(t => (
                    <tr key={t.id} className="border-b hover:bg-white/5 transition-colors" style={{ borderColor: 'var(--color-border)' }}>
                      <td className="p-3 font-mono font-bold text-gray-400">TX_{t.id}</td>
                      <td className="p-3 font-mono text-[10px] truncate max-w-[80px]">{t.booking_id}</td>
                      <td className="p-3 font-mono text-[10px] truncate max-w-[80px]">{t.user_id}</td>
                      <td className="p-3 font-extrabold text-blue-500">Rp{Number(t.amount || 0).toLocaleString()}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30 text-[9px] font-black uppercase">
                          {t.status}
                        </span>
                      </td>
                      <td className="p-3 text-[10px] opacity-60 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(t.created_at || t.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
export {};
