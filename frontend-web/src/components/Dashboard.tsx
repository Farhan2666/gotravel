import React, { useState, useEffect } from 'react';
import { Compass, Tag, Ticket, ArrowRight, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, Zap, MapPin, Car } from 'lucide-react';

interface DashboardProps {
  user: any; token: string | null;
  onUpdateUser: (user: any) => void; onStartBooking: () => void;
}

export default function Dashboard({ user, token, onStartBooking }: DashboardProps) {
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const promos = [
    { code:'MUDIKSERU',    title:'Promo Mudik',          desc:'Diskon Rp 50.000 untuk perjalanan mudik.', expiry:'30 Jun 2026', gradient:'#F97316,#EF4444', tag:'ðŸ”¥ Panas' },
    { code:'GAJIANHEBAT',  title:'Hemat Gajian',         desc:'Cashback 15% maks Rp 30.000 via Gopay.', expiry:'15 Jun 2026', gradient:'#3B82F6,#6366F1', tag:'ðŸ’° Cashback' },
    { code:'LIBURANKILAT', title:'Liburan Weekend',      desc:'Potongan 10% rute Jakartaâ€“Bandung Sabtuâ€“Minggu.', expiry:'25 Jun 2026', gradient:'#10B981,#059669', tag:'ðŸŒ´ Weekend' },
  ];

  const popularRoutes = [
    { from:'Jakarta',   to:'Bandung',    price:'150k', time:'2j 30m', emoji:'ðŸ™ï¸' },
    { from:'Jakarta',   to:'Semarang',   price:'350k', time:'6j',    emoji:'ðŸŒŠ' },
    { from:'Bandung',   to:'Yogyakarta', price:'400k', time:'7j',    emoji:'ðŸ›ï¸' },
    { from:'Yogyakarta',to:'Surabaya',   price:'280k', time:'5j',    emoji:'âš“' },
  ];

  useEffect(() => { if (user && token) fetchMyBookings(); }, [user, token]);

  const fetchMyBookings = async () => {
    if (!token) return;
    setLoadingBookings(true);
    try {
      const res = await fetch('http://localhost:5000/api/bookings/my', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setMyBookings(d || []); }
    } catch {} finally { setLoadingBookings(false); }
  };

  const statusInfo = (s: string) => {
    if (s === 'confirmed') return { label:'Terkonfirmasi', cls:'status-confirmed', Icon:CheckCircle };
    if (s === 'cancelled') return { label:'Dibatalkan',    cls:'status-cancelled', Icon:XCircle };
    return { label:'Menunggu', cls:'status-pending', Icon:AlertCircle };
  };

  return (
    <div className="pb-4">

      {/* â”€â”€ HERO BANNER â”€â”€ */}
      <div className="relative overflow-hidden mx-4 mt-4 rounded-2xl p-5" style={{ background:'linear-gradient(135deg, #1e3a5f 0%, #1a1f6e 100%)' }}>
        {/* decorative circles */}
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20" style={{ background:'radial-gradient(circle, #60a5fa, transparent)' }} />
        <div className="absolute -bottom-6 -left-4 w-24 h-24 rounded-full opacity-15" style={{ background:'radial-gradient(circle, #818cf8, transparent)' }} />

        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-300">
            <Zap className="w-3.5 h-3.5" />
            Platform Travel Premium
          </div>
          <h1 className="text-2xl font-black text-white leading-tight">
            {user ? `Halo, ${user.name.split(' ')[0]}! ðŸ‘‹` : 'Pergi Sekarang,\nLancar Sampai'}
          </h1>
          <p className="text-sm text-blue-200 leading-relaxed opacity-80">
            Pesan tiket travel antar kota, lacak perjalanan secara real-time.
          </p>
          <button onClick={onStartBooking} className="flex items-center gap-2 bg-white text-blue-700 font-bold text-sm px-5 py-3 rounded-xl active:scale-95 transition-transform shadow-lg">
            <Car className="w-4 h-4" />
            Pesan Tiket Sekarang
          </button>
        </div>
      </div>

      {/* â”€â”€ QUICK ROUTES â”€â”€ */}
      <div className="mt-5 px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold">Rute Populer</h2>
          <button className="text-xs font-semibold" style={{ color:'var(--color-primary)' }}>Semua Rute</button>
        </div>
        <div className="scroll-x">
          {popularRoutes.map((r, i) => (
            <button key={i} onClick={onStartBooking}
              className="flex flex-col gap-2 p-3.5 rounded-2xl active:scale-95 transition-transform"
              style={{ minWidth:140, background:'var(--color-card-bg)', border:'1px solid var(--color-border)' }}
            >
              <span className="text-2xl">{r.emoji}</span>
              <div className="text-left">
                <p className="text-[11px] font-bold leading-tight">{r.from}</p>
                <p className="text-[10px] opacity-50 flex items-center gap-0.5"><ArrowRight className="w-2.5 h-2.5" />{r.to}</p>
              </div>
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] font-black" style={{ color:'var(--color-primary)' }}>Rp{r.price}</span>
                <span className="text-[9px] opacity-40">{r.time}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* â”€â”€ MY BOOKINGS â”€â”€ */}
      {user && (
        <div className="mt-5 px-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color:'var(--color-primary)' }} />
              Tiket Saya
            </h2>
            <button onClick={fetchMyBookings} className="text-xs font-semibold" style={{ color:'var(--color-primary)' }}>Refresh</button>
          </div>

          {loadingBookings ? (
            <div className="space-y-3">
              {[1,2].map(i => <div key={i} className="skeleton h-16 rounded-2xl" />)}
            </div>
          ) : myBookings.length === 0 ? (
            <div className="card p-6 text-center space-y-2">
              <Ticket className="w-8 h-8 mx-auto opacity-30" style={{ color:'var(--color-primary)' }} />
              <p className="text-sm font-semibold opacity-50">Belum ada tiket</p>
              <button onClick={onStartBooking} className="text-sm font-bold" style={{ color:'var(--color-primary)' }}>
                Pesan sekarang â†’
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {myBookings.slice(0,5).map((b: any, i: number) => {
                const st = statusInfo(b.status);
                return (
                  <div key={b._id || i} className="card p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:'var(--color-primary-light)' }}>
                        <MapPin className="w-5 h-5" style={{ color:'var(--color-primary)' }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{b.route?.from} â†’ {b.route?.to}</p>
                        <p className="text-xs opacity-50 truncate">{b.vehicleType} Â· Kursi {b.route?.waypoints?.join(', ') || '-'}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 space-y-1">
                      <p className="text-sm font-black" style={{ color:'var(--color-primary)' }}>Rp{b.price?.toLocaleString()}</p>
                      <span className={`status-pill ${st.cls}`}>{st.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* â”€â”€ PROMOS â”€â”€ */}
      <div className="mt-5 px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold flex items-center gap-2">
            <Tag className="w-4 h-4" style={{ color:'var(--color-primary)' }} />
            Promo Spesial
          </h2>
        </div>
        <div className="scroll-x pb-1">
          {promos.map((p, i) => (
            <div key={i} className="promo-card" style={{ minWidth:240 }}>
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background:`linear-gradient(90deg,${p.gradient})` }} />
              <div className="flex items-start justify-between mb-3 mt-1">
                <span className="text-xs font-black px-2 py-0.5 rounded-lg" style={{ background:`linear-gradient(90deg,${p.gradient})`, color:'white' }}>{p.tag}</span>
                <span className="text-[10px] font-mono opacity-40 bg-gray-500/10 px-2 py-0.5 rounded">{p.code}</span>
              </div>
              <h3 className="font-bold text-sm mb-1">{p.title}</h3>
              <p className="text-xs opacity-60 leading-relaxed mb-3">{p.desc}</p>
              <div className="flex items-center justify-between border-t pt-2.5" style={{ borderColor:'var(--color-border)' }}>
                <span className="text-[10px] opacity-40">s/d {p.expiry}</span>
                <button
                  className="text-xs font-bold active:scale-95 transition-transform"
                  style={{ color:'var(--color-primary)' }}
                  onClick={() => { navigator.clipboard.writeText(p.code); alert(`Kode "${p.code}" disalin!`); }}
                >
                  Salin Kode â†’
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}