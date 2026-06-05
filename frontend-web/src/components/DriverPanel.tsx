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
  const [activeTab, setActiveTab] = useState<'orders' | 'active'>('orders');

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

  useEffect(() => {
    loadData();
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
    </div>
  );
}
