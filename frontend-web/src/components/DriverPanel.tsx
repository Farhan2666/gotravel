import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Radio, CheckCircle, BellRing, History } from 'lucide-react';
import API from '../api';

interface DriverPanelProps {
  token: string | null;
  user: any;
}

export default function DriverPanel({ token, user }: DriverPanelProps) {
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [gpsActive, setGpsActive] = useState(false);
  const [gpsMode, setGpsMode] = useState<'simulated' | 'real'>('simulated');
  const [lat, setLat] = useState(-6.2088);
  const [lng, setLng] = useState(106.8456);
  const [simStep, setSimStep] = useState(0);
  const [gpsLogs, setGpsLogs] = useState<string[]>([]);
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
  const [activeTab, setActiveTab] = useState<'orders' | 'active' | 'vehicles'>('orders');

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setGpsLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 15)]);
  };

  // Fetch available orders & active bookings
  const loadData = async () => {
    if (!token) return;
    try {
      // 1. Available orders
      const resAvail = await fetch(`${API}/driver/available-bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataAvail = await resAvail.json();
      if (resAvail.ok) setAvailableOrders(dataAvail);

      // 2. Active orders
      const resActive = await fetch(`${API}/driver/active-bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataActive = await resActive.json();
      if (resActive.ok && dataActive.length > 0) {
        // find a booking that is not completed
        const active = dataActive.find((b: any) => b.status !== 'completed');
        if (active) setActiveTrip(active);
      }
    } catch {
      console.error('Failed to load driver datasets');
    }
  };

  // ── Vehicle Management ──
  const loadMyVehicles = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/vehicles/mine`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setVehicles(data);
    } catch (e) {
      console.error('Failed to load my vehicles', e);
    }
  };

  const handleSaveMyVehicle = async () => {
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
        resetMyVehicleForm();
        loadMyVehicles();
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal menyimpan kendaraan');
      }
    } catch {
      alert('Gagal menghubungi server');
    }
  };

  const handleDeleteMyVehicle = async (id: string) => {
    if (!token) return;
    if (!confirm('Hapus kendaraan ini?')) return;
    try {
      const res = await fetch(`${API}/vehicles/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) loadMyVehicles();
      else alert('Gagal menghapus kendaraan');
    } catch {
      alert('Gagal menghubungi server');
    }
  };

  const resetMyVehicleForm = () => {
    setVehicleForm({
      name: '', plate: '', description: '',
      route_from: 'Jakarta', route_to: 'Bandung',
      price: 0, duration: '',
      departure_time: '', arrival_time: '',
      seat_layout: JSON.stringify({ rows: 6, columns: 4, layout: 'standard', labels: ['A','B','C','D'] }),
      status: 'active', photo_url: ''
    });
  };

  const openEditMyVehicle = (v: any) => {
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
    loadData();
    loadMyVehicles();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [token]);

  // Accept a booking
  const handleAcceptOrder = async (id: string) => {
    if (!token) return;
    try {
      const response = await fetch(`${API}/bookings/${id}/accept`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        alert('Orderan berhasil diambil! Silakan mulai perjalanan.');
        setActiveTrip(data.booking);
        setActiveTab('active');
        setSimStep(0);
      } else {
        alert(data.error || 'Gagal mengambil orderan');
      }
    } catch {
      alert('Gagal menghubungi server.');
    }
  };

  // Push location coordinates to backend
  const pushLocation = async (latitude: number, longitude: number) => {
    if (!token) return;
    try {
      const response = await fetch(`${API}/driver/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ latitude, longitude })
      });
      if (response.ok) {
        addLog(`GPS OK: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      }
    } catch {
      addLog('Gagal mengirim koordinat ke server');
    }
  };

  // GPS Simulation Loop
  useEffect(() => {
    if (!gpsActive || !activeTrip) return;

    let watchId: number | null = null;
    let timer: any = null;

    if (gpsMode === 'real') {
      addLog('GPS Geolocation Browser Aktif...');
      if ('geolocation' in navigator) {
        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setLat(latitude);
            setLng(longitude);
            pushLocation(latitude, longitude);
          },
          (err) => {
            addLog(`Kesalahan GPS Geolocation: ${err.message}`);
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      } else {
        addLog('Browser tidak mendukung Geolocation API');
      }
    } else {
      addLog('GPS Simulator Perjalanan Aktif...');
      
      // Determine route coordinates bounds
      const fromCity = activeTrip.route?.from || 'Jakarta';
      const toCity = activeTrip.route?.to || 'Bandung';

      // Default Jakarta coords
      let startLat = -6.2088;
      let startLng = 106.8456;
      // Default Bandung coords
      let endLat = -6.9175;
      let endLng = 107.6191;

      if (toCity === 'Semarang') {
        endLat = -6.9667; endLng = 110.4167;
      } else if (toCity === 'Yogyakarta') {
        endLat = -7.7956; endLng = 110.3695;
      }

      if (fromCity === 'Bandung') {
        startLat = -6.9175; startLng = 107.6191;
      }

      timer = setInterval(() => {
        setSimStep(prev => {
          const nextStep = prev + 1;
          const totalSteps = 20;

          if (nextStep > totalSteps) {
            addLog('Sampai Tujuan! Mengulangi simulasi...');
            return 0;
          }

          const currentLat = startLat + (nextStep / totalSteps) * (endLat - startLat);
          const currentLng = startLng + (nextStep / totalSteps) * (endLng - startLng);
          
          setLat(currentLat);
          setLng(currentLng);
          pushLocation(currentLat, currentLng);
          
          return nextStep;
        });
      }, 4000);
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (timer !== null) clearInterval(timer);
    };
  }, [gpsActive, gpsMode, activeTrip, simStep]);

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--color-border)' }}>
        <div>
          <h2 className="text-xl font-bold">Driver Control Center</h2>
          <p className="text-xs opacity-60">Sopir: {user.name} ({user.email})</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${activeTab === 'orders' ? 'bg-blue-600 border-blue-500 text-white' : ''}`}
            style={{ borderColor: 'var(--color-border)' }}
          >
            Orderan Masuk ({availableOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${activeTab === 'active' ? 'bg-blue-600 border-blue-500 text-white' : ''}`}
            style={{ borderColor: 'var(--color-border)' }}
          >
            Trip Aktif
          </button>
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${activeTab === 'vehicles' ? 'bg-blue-600 border-blue-500 text-white' : ''}`}
            style={{ borderColor: 'var(--color-border)' }}
          >
            Kendaraan Saya ({vehicles.length})
          </button>
        </div>
      </div>

      {activeTab === 'orders' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <BellRing className="w-4 h-4 text-blue-500" />
            Daftar Orderan Tersedia
          </h3>

          {availableOrders.length === 0 ? (
            <div className="p-8 text-center border border-dashed rounded-2xl opacity-60 text-xs" style={{ borderColor: 'var(--color-border)' }}>
              Belum ada orderan masuk dari penumpang. Menunggu pesanan tiket...
            </div>
          ) : (
            availableOrders.map(order => (
              <div
                key={order._id}
                className="p-5 rounded-2xl border flex justify-between items-center bg-gray-500/5 gap-4"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <div className="space-y-1">
                  <p className="text-xs font-bold text-blue-500">{order.vehicleType}</p>
                  <p className="text-base font-black">{order.route?.from} → {order.route?.to}</p>
                  <p className="text-xs opacity-70">Harga: Rp{order.price?.toLocaleString()} | Seat: {order.route?.waypoints?.join(', ') || 'Auto'}</p>
                </div>
                <button
                  onClick={() => handleAcceptOrder(order._id)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Terima
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'active' && (
        <div className="space-y-6">
          {!activeTrip ? (
            <div className="p-8 text-center border border-dashed rounded-2xl opacity-60 text-xs" style={{ borderColor: 'var(--color-border)' }}>
              Anda tidak memiliki perjalanan aktif. Silakan pilih dan terima orderan terlebih dahulu di tab "Orderan Masuk".
            </div>
          ) : (
            <>
              {/* Trip Info Card */}
              <div className="p-5 rounded-2xl border bg-blue-500/5 space-y-3" style={{ borderColor: 'var(--color-primary)' }}>
                <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: 'var(--color-border)' }}>
                  <span className="text-xs font-bold text-blue-500">Trip Sedang Berjalan</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/20 text-green-400 font-bold border border-green-500/30">AKTIF</span>
                </div>
                <div className="text-sm">
                  <p className="opacity-60 text-xs">Rute Perjalanan</p>
                  <p className="font-black text-lg">{activeTrip.route?.from} → {activeTrip.route?.to}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="opacity-60">Pilihan Kelas</p>
                    <p className="font-bold">{activeTrip.vehicleType}</p>
                  </div>
                  <div>
                    <p className="opacity-60">Nomor Kursi Penumpang</p>
                    <p className="font-bold">{activeTrip.route?.waypoints?.join(', ') || '-'}</p>
                  </div>
                </div>
              </div>

              {/* GPS Control Box */}
              <div className="p-5 rounded-2xl border space-y-4" style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border)' }}>
                <h3 className="font-bold text-sm flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-red-500" />
                  Kirim Koordinat GPS Real-Time
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    disabled={gpsMode === 'simulated'}
                    onClick={() => {
                      setGpsMode('simulated');
                      setSimStep(0);
                    }}
                    className={`py-2 rounded-xl border text-xs font-bold transition-all ${gpsMode === 'simulated' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'opacity-60'}`}
                    style={{ borderColor: gpsMode === 'simulated' ? 'var(--color-primary)' : 'var(--color-border)' }}
                  >
                    Simulasi Jalan Tol
                  </button>
                  <button
                    disabled={gpsMode === 'real'}
                    onClick={() => setGpsMode('real')}
                    className={`py-2 rounded-xl border text-xs font-bold transition-all ${gpsMode === 'real' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'opacity-60'}`}
                    style={{ borderColor: gpsMode === 'real' ? 'var(--color-primary)' : 'var(--color-border)' }}
                  >
                    GPS Browser Riil
                  </button>
                </div>

                <div className="flex items-center justify-between border-t border-b py-3" style={{ borderColor: 'var(--color-border)' }}>
                  <div>
                    <p className="text-xs font-semibold">Aktifkan Pengiriman GPS</p>
                    <p className="text-[10px] opacity-60">Kirim koordinat lokasi ke database API server</p>
                  </div>
                  <button
                    onClick={() => setGpsActive(!gpsActive)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-all ${gpsActive ? 'bg-red-600 hover:bg-red-700 shadow-md' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    {gpsActive ? 'Matikan GPS' : 'Nyalakan GPS'}
                  </button>
                </div>

                {gpsActive && (
                  <div className="p-3 rounded-xl bg-neutral-900/30 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5"><Radio className="w-3.5 h-3.5 text-green-500 animate-pulse" /> Mengirim...</span>
                    <span className="font-mono font-bold">{lat.toFixed(5)}, {lng.toFixed(5)}</span>
                  </div>
                )}
              </div>

              {/* Logs Window */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase opacity-65 flex items-center gap-1">
                  <History className="w-3.5 h-3.5 text-blue-500" /> Log Aktivitas GPS
                </h4>
                <div className="h-32 rounded-xl border p-3 font-mono text-[10px] overflow-y-auto space-y-1 bg-black/40 text-green-400 border-opacity-20" style={{ borderColor: 'var(--color-border)' }}>
                  {gpsLogs.length === 0 ? (
                    <p className="opacity-40 text-center py-8">Belum ada pengiriman lokasi. Nyalakan GPS di atas.</p>
                  ) : (
                    gpsLogs.map((log, idx) => <p key={idx}>{log}</p>)
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'vehicles' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">Kendaraan Saya</h3>
            <button
              onClick={() => {
                resetMyVehicleForm();
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
              Anda belum memiliki kendaraan.
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
                    <button onClick={() => openEditMyVehicle(v)} className="px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs font-bold border border-yellow-500/30">Edit</button>
                    <button onClick={() => handleDeleteMyVehicle(v._id || v.id)} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold border border-red-500/30">Hapus</button>
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
                <button onClick={handleSaveMyVehicle} className="btn-primary w-full">{editingVehicle ? 'Simpan' : 'Tambah'} Kendaraan</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
