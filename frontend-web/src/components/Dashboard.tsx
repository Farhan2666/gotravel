import React, { useState, useEffect } from 'react';
import { Compass, Tag, Ticket, ArrowRight, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface DashboardProps {
  user: any;
  token: string | null;
  onUpdateUser: (user: any) => void;
  onStartBooking: () => void;
}

export default function Dashboard({ user, token, onStartBooking }: DashboardProps) {
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const promos = [
    {
      code: 'MUDIKSERU',
      title: 'Promo Mudik Lebaran',
      desc: 'Diskon langsung Rp 50.000 untuk perjalanan pulang kampung Anda.',
      expiry: '30 Juni 2026',
      color: 'from-orange-500 to-red-600',
      badge: 'Terpopuler',
    },
    {
      code: 'GAJIANHEBAT',
      title: 'Hemat Gajian Gopay',
      desc: 'Cashback 15% maksimal Rp 30.000 menggunakan metode pembayaran Gopay.',
      expiry: '15 Juni 2026',
      color: 'from-blue-500 to-indigo-600',
      badge: 'Cashback',
    },
    {
      code: 'LIBURANKILAT',
      title: 'Liburan Kilat Akhir Pekan',
      desc: 'Potongan 10% khusus rute Jakarta - Bandung di hari Sabtu & Minggu.',
      expiry: '25 Juni 2026',
      color: 'from-emerald-500 to-teal-600',
      badge: 'Weekend',
    }
  ];

  useEffect(() => {
    if (user && token) {
      fetchMyBookings();
    }
  }, [user, token]);

  const fetchMyBookings = async () => {
    if (!token) return;
    setLoadingBookings(true);
    try {
      const res = await fetch('http://localhost:5000/api/bookings/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMyBookings(data.bookings || data || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingBookings(false);
    }
  };

  const statusIcon = (status: string) => {
    if (status === 'confirmed') return <CheckCircle className="w-4 h-4 text-green-400" />;
    if (status === 'cancelled') return <XCircle className="w-4 h-4 text-red-400" />;
    return <AlertCircle className="w-4 h-4 text-yellow-400" />;
  };

  const statusLabel = (status: string) => {
    if (status === 'confirmed') return { label: 'Terkonfirmasi', cls: 'bg-green-500/15 text-green-400 border-green-500/25' };
    if (status === 'cancelled') return { label: 'Dibatalkan', cls: 'bg-red-500/15 text-red-400 border-red-500/25' };
    return { label: 'Menunggu', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25' };
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-8 space-y-4 rounded-3xl bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-transparent p-6 border border-blue-500/10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20">
          <Compass className="w-3.5 h-3.5" />
          Platform Travel Antar-Kota Premium
        </div>
        <h1 className="text-3xl font-black md:text-4xl tracking-tight">
          {user ? `Halo, ${user.name.split(' ')[0]}! 👋` : 'Pergi Sekarang, Lancar Sampai'}
        </h1>
        <p className="text-sm opacity-70 max-w-lg mx-auto leading-relaxed">
          Pesan tiket travel antar kota dengan mudah, nyaman, dan terpercaya. Nikmati tracking GPS nyata sepanjang perjalanan.
        </p>
        <div>
          <button
            onClick={onStartBooking}
            className="px-8 py-3 rounded-2xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all active:scale-95 text-sm"
          >
            Pesan Tiket Sekarang
          </button>
        </div>
      </section>

      {/* My Bookings — only if logged in */}
      {user && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-bold">Riwayat Pemesanan Saya</h2>
            </div>
            <button onClick={fetchMyBookings} className="text-xs text-blue-500 hover:underline font-bold">
              Refresh
            </button>
          </div>

          {loadingBookings ? (
            <div className="p-6 text-center text-xs opacity-60 animate-pulse">Memuat riwayat pemesanan...</div>
          ) : myBookings.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed text-center text-xs opacity-50 space-y-2" style={{ borderColor: 'var(--color-border)' }}>
              <Ticket className="w-8 h-8 mx-auto opacity-40" />
              <p>Belum ada tiket yang dipesan.</p>
              <button onClick={onStartBooking} className="text-blue-500 font-bold hover:underline">Pesan tiket pertama Anda!</button>
            </div>
          ) : (
            <div className="space-y-3">
              {myBookings.slice(0, 5).map((b: any, i: number) => {
                const st = statusLabel(b.status);
                return (
                  <div key={b._id || i} className="p-4 rounded-2xl border flex items-center justify-between gap-4" style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border)' }}>
                    <div className="flex items-center gap-3">
                      {statusIcon(b.status)}
                      <div>
                        <p className="text-sm font-bold">{b.route?.from} <ArrowRight className="inline w-3 h-3 opacity-50 mx-0.5" /> {b.route?.to}</p>
                        <p className="text-[10px] opacity-60">{b.vehicleType} · Kursi: {b.route?.waypoints?.join(', ') || '-'}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-extrabold text-blue-500">Rp{b.price?.toLocaleString()}</p>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-black border uppercase ${st.cls}`}>{st.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Promos Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: 'var(--color-border)' }}>
          <Tag className="w-5 h-5 text-blue-500" />
          <h2 className="text-xl font-bold">Promo Spesial Hari Ini</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {promos.map((promo, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl border transition-all hover:translate-y-[-3px] hover:shadow-lg flex flex-col justify-between relative overflow-hidden cursor-pointer"
              style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border)' }}
            >
              <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${promo.color}`} />
              <div className="space-y-2.5">
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[9px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-gray-500/10 opacity-60 border" style={{ borderColor: 'var(--color-border)' }}>
                    KODE: {promo.code}
                  </span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-gradient-to-r ${promo.color} text-white`}>
                    {promo.badge}
                  </span>
                </div>
                <h3 className="font-bold text-base leading-snug">{promo.title}</h3>
                <p className="text-xs opacity-65 leading-relaxed">{promo.desc}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-dashed flex items-center justify-between text-[10px]" style={{ borderColor: 'var(--color-border)' }}>
                <span className="opacity-50">s/d {promo.expiry}</span>
                <button
                  className="font-bold text-blue-500 hover:underline flex items-center gap-0.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(promo.code);
                    alert(`Kode "${promo.code}" berhasil disalin!`);
                  }}
                >
                  Salin Kode
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Routes */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: 'var(--color-border)' }}>
          <Compass className="w-5 h-5 text-blue-500" />
          <h2 className="text-xl font-bold">Rute Terpopuler</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { from: 'Jakarta', to: 'Bandung', price: 'Rp 150k' },
            { from: 'Bandung', to: 'Yogyakarta', price: 'Rp 400k' },
            { from: 'Yogyakarta', to: 'Surabaya', price: 'Rp 280k' },
            { from: 'Jakarta', to: 'Semarang', price: 'Rp 350k' },
          ].map((route, i) => (
            <button
              key={i}
              onClick={onStartBooking}
              className="p-4 rounded-xl border flex items-center justify-between text-left hover:border-blue-500/40 transition-all group"
              style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border)' }}
            >
              <div>
                <p className="text-[10px] font-semibold opacity-50">Jalur Favorit</p>
                <p className="font-bold text-sm">{route.from} <ArrowRight className="inline w-3 h-3 mx-1 opacity-40" /> {route.to}</p>
              </div>
              <span className="text-xs font-bold text-blue-500 bg-blue-500/10 group-hover:bg-blue-500/20 px-2.5 py-1 rounded-lg transition-colors">Mulai {route.price}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
