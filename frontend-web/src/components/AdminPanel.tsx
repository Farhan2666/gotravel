import React, { useState, useEffect } from 'react';
import { DollarSign, Ticket, Users, Layers, ShieldCheck, Database, Calendar } from 'lucide-react';
import API from '../api';

interface AdminPanelProps {
  token: string | null;
  user: any;
}

export default function AdminPanel({ token, user }: AdminPanelProps) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [vehicleForm, setVehicleForm] = useState({
    name: '', plate: '', description: '',
    route_from: 'Jakarta', route_to: 'Bandung',
    price: 0, duration: '',
    departure_time: '', arrival_time: '',
    seat_layout: JSON.stringify({ rows: 6, columns: 4, layout: 'standard', labels: ['A','B','C','D'] }),
    status: 'active', photo_url: ''
  });
  const [activeSubTab, setActiveSubTab] = useState<'bookings' | 'postgres' | 'vehicles'>('bookings');
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
      const resBookings = await fetch(`${API}/admin/bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataBookings = await resBookings.json();
      if (resBookings.ok) {
        setBookings(dataBookings);
      }

      // 2. Fetch Transactions
      const resTx = await fetch(`${API}/admin/transactions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataTx = await resTx.json();
      if (resTx.ok) {
        setTransactions(dataTx);
      }

      // 3. Fetch Vehicles
      loadVehicles();
    } catch (e) {
      console.error('Failed to load admin dataset', e);
    }
  };

  // ── Vehicle Management ──
  const loadVehicles = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/vehicles`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setVehicles(data);
    } catch (e) {
      console.error('Failed to load vehicles', e);
    }
  };

  const handleSaveVehicle = async () => {
    if (!token) return;
    try {
      const body = {
        ...vehicleForm,
        price: Number(vehicleForm.price),
        seat_layout: JSON.parse(vehicleForm.seat_layout)
      };
      const url = editingVehicle ? `${API}/vehicles/${editingVehicle._id}` : `${API}/vehicles`;
      const res = await fetch(url, {
        method: editingVehicle ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setShowVehicleForm(false);
        setEditingVehicle(null);
        resetVehicleForm();
        loadVehicles();
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal menyimpan kendaraan');
      }
    } catch {
      alert('Gagal menghubungi server');
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!token) return;
    if (!confirm('Hapus kendaraan ini?')) return;
    try {
      const res = await fetch(`${API}/vehicles/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) loadVehicles();
      else alert('Gagal menghapus kendaraan');
    } catch {
      alert('Gagal menghubungi server');
    }
  };

  const resetVehicleForm = () => {
    setVehicleForm({
      name: '', plate: '', description: '',
      route_from: 'Jakarta', route_to: 'Bandung',
      price: 0, duration: '',
      departure_time: '', arrival_time: '',
      seat_layout: JSON.stringify({ rows: 6, columns: 4, layout: 'standard', labels: ['A','B','C','D'] }),
      status: 'active', photo_url: ''
    });
  };

  const openEditVehicle = (v: any) => {
    setVehicleForm({
      name: v.name || '', plate: v.plate || '', description: v.description || '',
      route_from: v.route_from || 'Jakarta', route_to: v.route_to || 'Bandung',
      price: v.price || 0, duration: v.duration || '',
      departure_time: v.departure_time || '', arrival_time: v.arrival_time || '',
      seat_layout: JSON.stringify(v.seat_layout || { rows: 6, columns: 4, layout: 'standard', labels: ['A','B','C','D'] }),
      status: v.status || 'active', photo_url: v.photo_url || ''
    });
    setEditingVehicle(v);
    setShowVehicleForm(true);
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
          <button
            onClick={() => setActiveSubTab('vehicles')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${activeSubTab === 'vehicles' ? 'bg-blue-600 border-blue-500 text-white' : ''}`}
            style={{ borderColor: 'var(--color-border)' }}
          >
            Kendaraan ({vehicles.length})
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

      {activeSubTab === 'vehicles' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider opacity-70 flex items-center gap-1.5">
              Daftar Kendaraan
            </h3>
            <button
              onClick={() => {
                resetVehicleForm();
                setEditingVehicle(null);
                setShowVehicleForm(true);
              }}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
            >
              + Tambah Kendaraan
            </button>
          </div>

          {vehicles.length === 0 ? (
            <div className="p-8 text-center border border-dashed rounded-2xl opacity-60 text-xs" style={{ borderColor: 'var(--color-border)' }}>
              Belum ada kendaraan terdaftar.
            </div>
          ) : (
            <div className="grid gap-3">
              {vehicles.map(v => (
                <div key={v._id || v.id} className="p-4 rounded-2xl border flex items-center justify-between" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card-bg)' }}>
                  <div className="space-y-1">
                    <p className="font-bold text-sm">{v.name}</p>
                    <p className="text-xs opacity-60">{v.plate} · {v.route_from} → {v.route_to}</p>
                    <p className="text-xs font-bold" style={{ color: 'var(--color-primary)' }}>Rp{v.price?.toLocaleString()}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${v.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                      {v.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditVehicle(v)} className="px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs font-bold border border-yellow-500/30">Edit</button>
                    <button onClick={() => handleDeleteVehicle(v._id || v.id)} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold border border-red-500/30">Hapus</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showVehicleForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="w-full max-w-lg rounded-2xl border p-6 space-y-4 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border)' }}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">{editingVehicle ? 'Edit Kendaraan' : 'Tambah Kendaraan'}</h3>
                  <button onClick={() => { setShowVehicleForm(false); setEditingVehicle(null); }} className="text-xs opacity-60 hover:opacity-100">Tutup</button>
                </div>
                <div className="space-y-3">
                  <input className="input-field" placeholder="Nama kendaraan" value={vehicleForm.name} onChange={e => setVehicleForm(f => ({...f, name: e.target.value}))} />
                  <input className="input-field" placeholder="Nomor plat" value={vehicleForm.plate} onChange={e => setVehicleForm(f => ({...f, plate: e.target.value}))} />
                  <textarea className="input-field" placeholder="Deskripsi" value={vehicleForm.description} onChange={e => setVehicleForm(f => ({...f, description: e.target.value}))} />
                  <div className="grid grid-cols-2 gap-3">
                    <select className="input-field" value={vehicleForm.route_from} onChange={e => setVehicleForm(f => ({...f, route_from: e.target.value}))}>
                      {['Jakarta','Bandung','Semarang','Yogyakarta','Surabaya'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select className="input-field" value={vehicleForm.route_to} onChange={e => setVehicleForm(f => ({...f, route_to: e.target.value}))}>
                      {['Jakarta','Bandung','Semarang','Yogyakarta','Surabaya'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <input className="input-field" type="number" placeholder="Harga" value={vehicleForm.price} onChange={e => setVehicleForm(f => ({...f, price: Number(e.target.value)}))} />
                  <input className="input-field" placeholder="Durasi" value={vehicleForm.duration} onChange={e => setVehicleForm(f => ({...f, duration: e.target.value}))} />
                  <div className="grid grid-cols-2 gap-3">
                    <input className="input-field" type="time" value={vehicleForm.departure_time} onChange={e => setVehicleForm(f => ({...f, departure_time: e.target.value}))} />
                    <input className="input-field" type="time" value={vehicleForm.arrival_time} onChange={e => setVehicleForm(f => ({...f, arrival_time: e.target.value}))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input className="input-field" type="number" placeholder="Baris kursi" value={JSON.parse(vehicleForm.seat_layout).rows} onChange={e => setVehicleForm(f => ({...f, seat_layout: JSON.stringify({...JSON.parse(f.seat_layout), rows: Number(e.target.value)})}))} />
                    <input className="input-field" type="number" placeholder="Kolom kursi" value={JSON.parse(vehicleForm.seat_layout).columns} onChange={e => setVehicleForm(f => ({...f, seat_layout: JSON.stringify({...JSON.parse(f.seat_layout), columns: Number(e.target.value)})}))} />
                  </div>
                  <select className="input-field" value={vehicleForm.status} onChange={e => setVehicleForm(f => ({...f, status: e.target.value}))}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <input className="input-field" placeholder="URL Foto" value={vehicleForm.photo_url} onChange={e => setVehicleForm(f => ({...f, photo_url: e.target.value}))} />
                </div>
                <button onClick={handleSaveVehicle} className="btn-primary w-full">{editingVehicle ? 'Simpan' : 'Tambah'} Kendaraan</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export {};
