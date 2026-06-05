import React, { useState, useEffect } from 'react';
import { MapPin, RotateCw } from 'lucide-react';

interface LiveTrackingProps {
  token: string | null;
  bookingId: string | null;
  onBackToDashboard: () => void;
}

export default function LiveTracking({ token, bookingId, onBackToDashboard }: LiveTrackingProps) {
  const [driverInfo, setDriverInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchTracking = async () => {
    if (!token || !bookingId) return;
    try {
      const response = await fetch(`http://localhost:5000/api/bookings/${bookingId}/track`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setDriverInfo(data);
      }
    } catch {
      console.error('Failed to query driver tracking location');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(fetchTracking, 3000);
    return () => clearInterval(interval);
  }, [bookingId]);

  return (
    <div className="space-y-6 max-w-md mx-auto p-5 rounded-2xl border" style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border)' }}>
      <h2 className="text-xl font-bold flex items-center gap-1.5">
        <MapPin className="w-5 h-5 text-red-500" />
        Live Tracking Armada
      </h2>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-8 gap-2">
          <RotateCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-xs opacity-60">Memuat lokasi driver...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border flex items-center gap-4 bg-gray-500/5" style={{ borderColor: 'var(--color-border)' }}>
            <div className="w-10 h-10 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center">
              BS
            </div>
            <div>
              <p className="text-sm font-black">{driverInfo?.driverName}</p>
              <p className="text-xs opacity-60">Mobil: {driverInfo?.vehiclePlate}</p>
            </div>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-green-500/20 text-green-400 font-bold border border-green-500/30 animate-pulse">
              ON TRIP
            </span>
          </div>

          <div className="relative h-44 rounded-xl border overflow-hidden flex items-center justify-center bg-[#151b26]" style={{ borderColor: 'var(--color-border)' }}>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
            
            <svg className="absolute w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0,50 Q50,20 100,50" fill="none" stroke="#ffffff" strokeWidth="4" strokeDasharray="3" />
            </svg>

            <div
              className="absolute transition-all duration-1000 flex flex-col items-center"
              style={{
                top: `${50 + (driverInfo?.location?.latitude ? Math.sin(driverInfo.location.latitude * 1000) * 15 : 0)}%`,
                left: `${50 + (driverInfo?.location?.longitude ? Math.cos(driverInfo.location.longitude * 1000) * 20 : 0)}%`
              }}
            >
              <div className="relative">
                <span className="absolute inline-flex h-6 w-6 rounded-full bg-red-500 opacity-40 animate-ping -left-1 -top-1" />
                <MapPin className="w-4 h-4 text-red-500 fill-current" />
              </div>
              <span className="text-[8px] bg-black text-white px-1.5 py-0.5 rounded-full mt-1 border border-white/20 whitespace-nowrap shadow">
                Sopir Anda
              </span>
            </div>
          </div>

          <button onClick={onBackToDashboard} className="w-full py-2.5 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            Kembali ke Dashboard
          </button>
        </div>
      )}
    </div>
  );
}