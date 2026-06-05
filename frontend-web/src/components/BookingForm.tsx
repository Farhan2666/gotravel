import React, { useState, useEffect } from 'react';
import { Train, Calendar, Users, ArrowRight, Armchair, Check, AlertCircle, ArrowLeft } from 'lucide-react';

interface BookingFormProps {
  token: string | null;
  onBookingSuccess: (bookingId: string) => void;
  onCancel: () => void;
}

interface Passenger {
  name: string;
  nik: string;
  seat: string | null;
}

export default function BookingForm({ token, onBookingSuccess, onCancel }: BookingFormProps) {
  const [step, setStep] = useState(1);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Step 1: Search Trip State
  const [origin, setOrigin] = useState('Jakarta');
  const [destination, setDestination] = useState('Bandung');
  const [travelDate, setTravelDate] = useState(new Date().toISOString().split('T')[0]);
  const [passengerCount, setPassengerCount] = useState(1);

  // Step 2: Available Schedules
  const [schedules, setSchedules] = useState<any[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);

  // Step 3: Passenger Details & Seats
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [activePassengerIdx, setActivePassengerIdx] = useState(0);
  const [selectedGerbong, setSelectedGerbong] = useState('Gerbong 1');
  const [occupiedSeats, setOccupiedSeats] = useState<string[]>([]);

  // Seat Configuration
  const seatLetters = ['A', 'B', 'C', 'D'];
  const totalRows = 6;

  // Load routes and initialize occupied seats
  useEffect(() => {
    fetch('http://localhost:5000/api/routes')
      .then(res => res.json())
      .then(data => {
        setRoutes(data);
      })
      .catch(() => alert('Gagal memuat rute dari backend. Pastikan server backend Anda aktif.'));

    // Generate random occupied seats for Gerbong 1 and 2 to look realistic
    const randomOccupied = [];
    const gerbongs = ['Gerbong 1', 'Gerbong 2'];
    for (const g of gerbongs) {
      for (let r = 1; r <= totalRows; r++) {
        for (const l of seatLetters) {
          if (Math.random() < 0.35) {
            randomOccupied.push(`${g}-${r}${l}`);
          }
        }
      }
    }
    setOccupiedSeats(randomOccupied);
  }, []);

  // Set passengers array when count changes
  useEffect(() => {
    setPassengers(
      Array.from({ length: passengerCount }, () => ({ name: '', nik: '', seat: null }))
    );
    setActivePassengerIdx(0);
  }, [passengerCount]);

  // Handle trip search
  const handleSearch = () => {
    if (origin === destination) {
      alert('Kota asal dan tujuan tidak boleh sama!');
      return;
    }

    // Find route in backend
    const route = routes.find(r => r.from.toLowerCase() === origin.toLowerCase() && r.to.toLowerCase() === destination.toLowerCase());
    const basePrice = route ? route.price : 150000;

    // Generate Mock KAI-Style Schedules
    const generated = [
      {
        id: 'SCH_001',
        name: 'GOtravel Express',
        class: 'Eksekutif',
        departure: '08:30',
        arrival: '11:00',
        duration: '2j 30m',
        price: basePrice,
        seatsLeft: 12,
      },
      {
        id: 'SCH_002',
        name: 'GOtravel Luxury VIP',
        class: 'Super Luxury VIP',
        departure: '14:15',
        arrival: '16:45',
        duration: '2j 30m',
        price: basePrice + 75000,
        seatsLeft: 6,
      },
      {
        id: 'SCH_003',
        name: 'GOtravel Economy',
        class: 'Ekonomi Premium',
        departure: '19:45',
        arrival: '22:15',
        duration: '2j 30m',
        price: Math.max(80000, basePrice - 40000),
        seatsLeft: 22,
      }
    ];

    setSchedules(generated);
    setStep(2);
  };

  // Handle schedule select
  const handleSelectSchedule = (sch: any) => {
    setSelectedSchedule(sch);
    setStep(3);
  };

  // Handle seat select
  const handleSeatClick = (seatCode: string) => {
    const fullSeatCode = `${selectedGerbong}-${seatCode}`;
    if (occupiedSeats.includes(fullSeatCode)) return;

    // Check if another passenger already selected this seat
    const alreadyTaken = passengers.some((p, idx) => idx !== activePassengerIdx && p.seat === fullSeatCode);
    if (alreadyTaken) {
      alert('Kursi ini sudah dipilih oleh penumpang lain!');
      return;
    }

    const updated = [...passengers];
    updated[activePassengerIdx].seat = fullSeatCode;
    setPassengers(updated);
  };

  // Validate Step 3
  const handleProceedToReview = () => {
    for (let i = 0; i < passengers.length; i++) {
      if (!passengers[i].name.trim() || !passengers[i].nik.trim()) {
        alert(`Harap isi Nama dan NIK untuk Penumpang ke-${i + 1}!`);
        return;
      }
      if (!passengers[i].seat) {
        alert(`Harap pilih kursi untuk Penumpang ke-${i + 1}!`);
        return;
      }
    }
    setStep(4);
  };

  // Complete Booking
  const handleBooking = async () => {
    if (!token) return;
    setLoading(true);

    const totalAmount = selectedSchedule.price * passengerCount;

    try {
      const response = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          route: {
            from: origin,
            to: destination,
            waypoints: passengers.map(p => p.seat)
          },
          vehicleType: `${selectedSchedule.name} (${selectedSchedule.class})`,
          price: totalAmount
        }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Tiket berhasil dipesan! Kode booking Anda telah terbit.');
        onBookingSuccess(data.bookingId);
      } else {
        alert(data.error || 'Pemesanan gagal');
      }
    } catch {
      alert('Gagal membuat pemesanan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 rounded-3xl border shadow-xl transition-all" style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border)' }}>
      {/* Wizard Header Progress */}
      <div className="flex items-center justify-between mb-8 border-b pb-4" style={{ borderColor: 'var(--color-border)' }}>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Train className="w-6 h-6 text-blue-500" />
          Pemesanan Tiket GOtravel
        </h2>
        <div className="flex gap-1.5 text-[10px] uppercase tracking-widest font-bold opacity-60">
          <span className={step === 1 ? 'text-blue-500' : ''}>Cari</span>
          <span>&gt;</span>
          <span className={step === 2 ? 'text-blue-500' : ''}>Jadwal</span>
          <span>&gt;</span>
          <span className={step === 3 ? 'text-blue-500' : ''}>Kursi</span>
          <span>&gt;</span>
          <span className={step === 4 ? 'text-blue-500' : ''}>Bayar</span>
        </div>
      </div>

      {/* STEP 1: SEARCH TRIP */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase opacity-70">Kota Asal</label>
              <select
                value={origin}
                onChange={e => setOrigin(e.target.value)}
                className="w-full p-3 rounded-xl border text-sm bg-transparent outline-none"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <option value="Jakarta" className="bg-neutral-800 text-white">Jakarta</option>
                <option value="Bandung" className="bg-neutral-800 text-white">Bandung</option>
                <option value="Semarang" className="bg-neutral-800 text-white">Semarang</option>
                <option value="Yogyakarta" className="bg-neutral-800 text-white">Yogyakarta</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase opacity-70">Kota Tujuan</label>
              <select
                value={destination}
                onChange={e => setDestination(e.target.value)}
                className="w-full p-3 rounded-xl border text-sm bg-transparent outline-none"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <option value="Jakarta" className="bg-neutral-800 text-white">Jakarta</option>
                <option value="Bandung" className="bg-neutral-800 text-white">Bandung</option>
                <option value="Semarang" className="bg-neutral-800 text-white">Semarang</option>
                <option value="Yogyakarta" className="bg-neutral-800 text-white">Yogyakarta</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase opacity-70">Tanggal Keberangkatan</label>
              <div className="relative">
                <input
                  type="date"
                  value={travelDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setTravelDate(e.target.value)}
                  className="w-full p-3 pl-10 rounded-xl border text-sm bg-transparent outline-none"
                  style={{ borderColor: 'var(--color-border)' }}
                />
                <Calendar className="absolute left-3 top-3 w-4 h-4 opacity-50" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase opacity-70">Jumlah Penumpang</label>
              <div className="relative">
                <select
                  value={passengerCount}
                  onChange={e => setPassengerCount(parseInt(e.target.value))}
                  className="w-full p-3 pl-10 rounded-xl border text-sm bg-transparent outline-none"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <option value={1} className="bg-neutral-800 text-white">1 Penumpang</option>
                  <option value={2} className="bg-neutral-800 text-white">2 Penumpang</option>
                  <option value={3} className="bg-neutral-800 text-white">3 Penumpang</option>
                  <option value={4} className="bg-neutral-800 text-white">4 Penumpang</option>
                </select>
                <Users className="absolute left-3 top-3 w-4 h-4 opacity-50" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button onClick={onCancel} className="flex-1 py-3 text-sm font-bold rounded-xl border hover:bg-gray-500/5 transition-colors">
              Kembali
            </button>
            <button
              onClick={handleSearch}
              className="flex-1 py-3 text-sm font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Cari Perjalanan
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: AVAILABLE SCHEDULES */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-xs flex justify-between items-center">
            <div>
              <p className="font-bold text-sm text-blue-500">{origin} → {destination}</p>
              <p className="opacity-70 mt-0.5">{travelDate} | {passengerCount} Penumpang</p>
            </div>
            <button onClick={() => setStep(1)} className="text-blue-500 font-bold hover:underline">Ubah Cari</button>
          </div>

          <div className="space-y-4">
            {schedules.map(sch => (
              <div
                key={sch.id}
                className="p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-blue-500"
                style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border)' }}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black">{sch.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">{sch.class}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <p className="text-base font-bold">{sch.departure}</p>
                      <p className="opacity-60">{origin}</p>
                    </div>
                    <div className="flex flex-col items-center opacity-40">
                      <span className="text-[9px]">{sch.duration}</span>
                      <div className="w-16 h-px bg-white my-1" />
                      <ArrowRight className="w-3 h-3" />
                    </div>
                    <div>
                      <p className="text-base font-bold">{sch.arrival}</p>
                      <p className="opacity-60">{destination}</p>
                    </div>
                  </div>
                </div>

                <div className="flex md:flex-col items-end justify-between gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-dashed border-gray-400/20">
                  <div className="text-left md:text-right">
                    <p className="text-[10px] opacity-60">Sisa {sch.seatsLeft} kursi</p>
                    <p className="text-lg font-black text-blue-500">Rp{sch.price.toLocaleString()}<span className="text-xs font-normal opacity-50">/org</span></p>
                  </div>
                  <button
                    onClick={() => handleSelectSchedule(sch)}
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    Pilih
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => setStep(1)} className="w-full py-3 text-sm font-bold rounded-xl border hover:bg-gray-500/5 transition-colors flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
        </div>
      )}

      {/* STEP 3: PASSENGER INFO & SEAT SELECTION */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Passenger details inputs */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider opacity-70">1. Data Diri Penumpang</h3>
            {passengers.map((p, idx) => (
              <div
                key={idx}
                onClick={() => setActivePassengerIdx(idx)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${activePassengerIdx === idx ? 'border-blue-500 bg-blue-500/5' : ''}`}
                style={{ backgroundColor: 'var(--color-card-bg)', borderColor: activePassengerIdx === idx ? 'var(--color-primary)' : 'var(--color-border)' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-blue-500">Penumpang {idx + 1} {activePassengerIdx === idx ? '(Aktif Memilih Kursi)' : ''}</span>
                  <span className="text-xs font-black bg-blue-500/20 px-2 py-0.5 rounded text-blue-400">
                    Kursi: {p.seat ? p.seat.replace('Gerbong ', 'G') : 'Belum Pilih'}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Nama Lengkap"
                    value={p.name}
                    onChange={e => {
                      const updated = [...passengers];
                      updated[idx].name = e.target.value;
                      setPassengers(updated);
                    }}
                    className="p-2.5 rounded-lg border text-xs bg-transparent outline-none w-full"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  />
                  <input
                    type="text"
                    placeholder="NIK (KTP)"
                    maxLength={16}
                    value={p.nik}
                    onChange={e => {
                      const updated = [...passengers];
                      updated[idx].nik = e.target.value.replace(/\D/g, ''); // Numeric only
                      setPassengers(updated);
                    }}
                    className="p-2.5 rounded-lg border text-xs bg-transparent outline-none w-full"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Seat selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider opacity-70">2. Pilih Kursi Kereta</h3>

            {/* Gerbong tabs */}
            <div className="flex gap-2">
              {['Gerbong 1', 'Gerbong 2'].map(g => (
                <button
                  key={g}
                  onClick={() => setSelectedGerbong(g)}
                  className={`px-4 py-1.5 rounded-lg font-bold text-xs border ${selectedGerbong === g ? 'bg-blue-600 border-blue-500 text-white' : ''}`}
                  style={{ borderColor: selectedGerbong === g ? 'var(--color-primary)' : 'var(--color-border)' }}
                >
                  {g}
                </button>
              ))}
            </div>

            {/* Seating Grid */}
            <div className="p-6 rounded-2xl border flex flex-col items-center gap-4 bg-neutral-900/50" style={{ borderColor: 'var(--color-border)' }}>
              <div className="w-full max-w-[280px] text-center text-[10px] tracking-widest font-black uppercase border border-dashed py-1.5 opacity-40 rounded">
                DEPAN (ARAH JALAN)
              </div>

              {/* Grid 2-2 Coach layout */}
              <div className="grid grid-cols-5 gap-3 w-full max-w-[280px]">
                {/* Seat column headers */}
                <div className="text-center text-xs font-black opacity-45">A</div>
                <div className="text-center text-xs font-black opacity-45">B</div>
                <div />
                <div className="text-center text-xs font-black opacity-45">C</div>
                <div className="text-center text-xs font-black opacity-45">D</div>

                {Array.from({ length: totalRows }).map((_, rIdx) => {
                  const row = rIdx + 1;
                  return (
                    <React.Fragment key={row}>
                      {seatLetters.map((letter, lIdx) => {
                        const seatCode = `${row}${letter}`;
                        const fullSeatCode = `${selectedGerbong}-${seatCode}`;
                        const isOccupied = occupiedSeats.includes(fullSeatCode);
                        
                        // Check if selected by current passenger
                        const isSelectedByCurrent = passengers[activePassengerIdx]?.seat === fullSeatCode;
                        
                        // Check if selected by any passenger
                        const selectIdx = passengers.findIndex(p => p.seat === fullSeatCode);
                        const isSelectedByAny = selectIdx !== -1;

                        const seatColorClass = isOccupied
                          ? 'bg-red-500/10 border-red-500/20 text-red-500 cursor-not-allowed opacity-30'
                          : isSelectedByCurrent
                          ? 'bg-blue-600 border-blue-500 text-white hover:bg-blue-700'
                          : isSelectedByAny
                          ? 'bg-blue-500/30 border-blue-500/40 text-blue-300'
                          : 'hover:bg-blue-500/10 hover:border-blue-500/30 text-gray-400';

                        const seatContent = isOccupied ? (
                          'X'
                        ) : isSelectedByAny ? (
                          `${selectIdx + 1}`
                        ) : (
                          `${row}${letter}`
                        );

                        return (
                          <React.Fragment key={letter}>
                            {lIdx === 2 && <div className="flex items-center justify-center text-[9px] font-black opacity-20 uppercase">LORONG</div>}
                            <button
                              disabled={isOccupied}
                              onClick={() => handleSeatClick(seatCode)}
                              className={`h-9 w-9 text-[10px] font-bold rounded-lg border flex items-center justify-center transition-all relative ${seatColorClass}`}
                              style={{ borderColor: !isOccupied && (isSelectedByCurrent || isSelectedByAny) ? 'var(--color-primary)' : 'var(--color-border)' }}
                              title={`Kursi ${selectedGerbong} - ${row}${letter}`}
                            >
                              <Armchair className="w-3.5 h-3.5" />
                              <span className="absolute text-[8px] mt-4 font-black">{seatContent}</span>
                            </button>
                          </React.Fragment>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Legends */}
              <div className="flex gap-4 text-[9px] font-bold opacity-60 mt-2 border-t pt-3 w-full justify-center" style={{ borderColor: 'var(--color-border)' }}>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500/25 border border-red-500/30 rounded inline-block" /> Terisi</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-600 border border-blue-500 rounded inline-block" /> Pilihan Anda</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 border border-gray-500 rounded inline-block" /> Kosong</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button onClick={() => setStep(2)} className="flex-1 py-3 text-sm font-bold rounded-xl border hover:bg-gray-500/5 transition-colors">
              Kembali
            </button>
            <button
              onClick={handleProceedToReview}
              className="flex-1 py-3 text-sm font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Lanjutkan Ke Review
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: REVIEW & CHECKOUT */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl border space-y-4" style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border)' }}>
            <h3 className="font-bold text-sm border-b pb-2 flex items-center gap-2" style={{ borderColor: 'var(--color-border)' }}>
              <Check className="w-4 h-4 text-green-500" />
              Detail Perjalanan
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs leading-relaxed">
              <div>
                <p className="opacity-60 font-semibold">Rute</p>
                <p className="font-bold text-sm">{origin} → {destination}</p>
              </div>
              <div>
                <p className="opacity-60 font-semibold">Tanggal Berangkat</p>
                <p className="font-bold text-sm">{travelDate}</p>
              </div>
              <div>
                <p className="opacity-60 font-semibold">Kereta / Kelas</p>
                <p className="font-bold text-sm text-blue-400">{selectedSchedule.name} ({selectedSchedule.class})</p>
              </div>
              <div>
                <p className="opacity-60 font-semibold">Waktu</p>
                <p className="font-bold text-sm">{selectedSchedule.departure} - {selectedSchedule.arrival} ({selectedSchedule.duration})</p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl border space-y-3" style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border)' }}>
            <h3 className="font-bold text-sm border-b pb-2" style={{ borderColor: 'var(--color-border)' }}>
              Daftar Penumpang & Kursi
            </h3>
            <div className="space-y-2">
              {passengers.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs p-2.5 rounded bg-neutral-900/30">
                  <div>
                    <p className="font-bold">{p.name}</p>
                    <p className="opacity-50 text-[10px]">NIK: {p.nik}</p>
                  </div>
                  <span className="font-black bg-blue-600/20 text-blue-400 border border-blue-600/30 px-2.5 py-0.5 rounded text-[10px]">
                    {p.seat?.replace('Gerbong ', 'G-')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-blue-600/10 border border-blue-600/20 flex justify-between items-center">
            <div>
              <p className="text-xs opacity-75">Total Pembayaran ({passengerCount} Tiket)</p>
              <p className="text-xl font-black text-blue-500">Rp{(selectedSchedule.price * passengerCount).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold bg-green-500/10 px-2 py-1 rounded">
              <AlertCircle className="w-3.5 h-3.5" />
              Selesai Instan
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button onClick={() => setStep(3)} className="flex-1 py-3 text-sm font-bold rounded-xl border hover:bg-gray-500/5 transition-colors">
              Kembali
            </button>
            <button
              onClick={handleBooking}
              disabled={loading}
              className="flex-1 py-3 text-sm font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-40"
            >
              {loading ? 'Memproses...' : 'Bayar Sekarang'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
