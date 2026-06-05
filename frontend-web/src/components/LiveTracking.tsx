import React, { useState, useEffect } from 'react';
import { MapPin, RotateCw, Navigation, ChevronLeft, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import API from '../api';

interface LiveTrackingProps {
  token: string | null; bookingId: string | null;
  onBackToDashboard: () => void;
}

export default function LiveTracking({ token, bookingId, onBackToDashboard }: LiveTrackingProps) {
  const [driverInfo, setDriverInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pingCount, setPingCount] = useState(0);

  const fetchTracking = async () => {
    if (!token || !bookingId) return;
    try {
      const res = await fetch(`${API}/bookings/${bookingId}/track`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { setDriverInfo(await res.json()); setPingCount(c => c+1); }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(fetchTracking, 3000);
    return () => clearInterval(interval);
  }, [bookingId]);

  const hasDriver = driverInfo?.booking?.driverId;
  const isRealGps = driverInfo?.driver?.isRealGps;

  return (
    <div className="min-h-screen flex flex-col" style={{ background:'var(--color-bg)' }}>

      {/* ── MAP AREA ── */}
      <div className="relative map-bg flex-shrink-0" style={{ height: '40vh' }}>
        {/* Gradient fade bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-16 z-10" style={{ background:'linear-gradient(to bottom, transparent, var(--color-bg))' }} />

        {/* GPS pulsar */}
        {!loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative flex items-center justify-center">
              {/* Rings */}
              {[1,2,3].map(r => (
                <span key={r} className="absolute rounded-full border-2 border-blue-500/20"
                  style={{ width: r*60, height: r*60, animation: `pulseRing ${r * 0.8}s ease-out infinite`, animationDelay:`${r*0.3}s` }} />
              ))}
              <div className="w-14 h-14 rounded-full bg-blue-600 shadow-2xl shadow-blue-500/40 flex items-center justify-center z-10">
                <MapPin className="w-7 h-7 text-white fill-white" />
              </div>
            </div>
          </div>
        )}

        {/* Loading shimmer */}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <RotateCw className="w-8 h-8 text-blue-400 animate-spin" />
            <p className="text-xs text-white/50 font-semibold">Memuat lokasi sopir...</p>
          </div>
        )}

        {/* GPS type badge */}
        {!loading && (
          <div className="absolute top-4 right-4 z-20">
            <span className={`status-pill ${isRealGps ? 'status-confirmed' : 'status-pending'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isRealGps ? 'bg-green-500 animate-pulse' : 'bg-yellow-500 animate-pulse'}`} />
              {isRealGps ? 'GPS Real' : 'GPS Sim'}
            </span>
          </div>
        )}

        {/* Coords */}
        {!loading && driverInfo?.driver?.location && (
          <div className="absolute bottom-6 left-4 right-4 z-20 flex items-center justify-center">
            <div className="px-3 py-1.5 rounded-full text-[10px] font-mono font-bold" style={{ background:'rgba(0,0,0,0.6)', color:'rgba(255,255,255,0.7)' }}>
              {driverInfo.driver.location.latitude?.toFixed(5)}, {driverInfo.driver.location.longitude?.toFixed(5)}
            </div>
          </div>
        )}
      </div>

      {/* ── DETAIL PANEL ── */}
      <div className="flex-1 px-4 space-y-4 pt-2">

        {/* Status card */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base">Status Perjalanan</h2>
            <div className="flex items-center gap-1 text-[10px] font-semibold opacity-50">
              <RotateCw className="w-3 h-3" />
              Ping #{pingCount}
            </div>
          </div>

          {loading ? (
            <div className="space-y-2"><div className="skeleton h-4 rounded" /><div className="skeleton h-4 w-3/4 rounded" /></div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-500/30">
                {hasDriver ? 'SB' : '?'}
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">{driverInfo?.driver?.name || 'Mencari sopir...'}</p>
                <p className="text-xs opacity-50">{driverInfo?.driver?.vehiclePlate || 'Menunggu penugasan'}</p>
              </div>
              <span className={`status-pill ${hasDriver ? 'status-confirmed' : 'status-pending'}`}>
                {hasDriver ? 'ON TRIP' : 'MENUNGGU'}
              </span>
            </div>
          )}
        </div>

        {/* Booking info */}
        {driverInfo?.booking && (
          <div className="card p-4 space-y-2.5">
            <h3 className="text-xs font-black uppercase tracking-wider opacity-50">Detail Pemesanan</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label:'Dari', val:driverInfo.booking.route?.from },
                { label:'Ke',   val:driverInfo.booking.route?.to },
                { label:'Kelas',val:driverInfo.booking.vehicleType },
                { label:'Harga',val:`Rp${driverInfo.booking.price?.toLocaleString()}` },
              ].map((item, i) => (
                <div key={i} className="p-3 rounded-xl" style={{ background:'var(--color-bg)' }}>
                  <p className="text-[10px] opacity-50 font-semibold">{item.label}</p>
                  <p className="text-sm font-bold mt-0.5">{item.val}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="card p-4 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider opacity-50">Progres Perjalanan</h3>
          {[
            { label:'Tiket Dipesan',   done:true,     icon:CheckCircle },
            { label:'Driver Ditugaskan',done:!!hasDriver, icon:Navigation },
            { label:'Perjalanan Aktif', done:!!hasDriver && isRealGps, icon:MapPin },
            { label:'Sampai Tujuan',    done:false,    icon:Clock },
          ].map((step, i, arr) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-green-500' : 'bg-transparent border-2'}`}
                  style={{ borderColor: step.done ? 'transparent' : 'var(--color-border)' }}
                >
                  <step.icon className={`w-4 h-4 ${step.done ? 'text-white' : 'opacity-30'}`} />
                </div>
                {i < arr.length - 1 && (
                  <div className="w-0.5 h-6 mt-1" style={{ background: step.done ? '#22c55e' : 'var(--color-border)' }} />
                )}
              </div>
              <div className="pt-1.5">
                <p className={`text-sm font-semibold ${step.done ? '' : 'opacity-40'}`}>{step.label}</p>
              </div>
            </div>
          ))}
        </div>

        <button onClick={onBackToDashboard} className="btn-secondary flex items-center justify-center gap-2 mb-4">
          <ChevronLeft className="w-4 h-4" /> Kembali ke Beranda
        </button>
      </div>
    </div>
  );
}