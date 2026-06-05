import React, { useState, useEffect } from 'react';
import { Train, Calendar, Users, ArrowRight, ArrowLeftRight, Check, AlertCircle, ChevronLeft, Armchair, MapPin } from 'lucide-react';
import API from '../api';

interface BookingFormProps {
  token: string | null;
  onBookingSuccess: (bookingId: string) => void;
  onCancel: () => void;
}
interface Passenger { name: string; nik: string; seat: string | null; }

const CITIES = ['Jakarta', 'Bandung', 'Semarang', 'Yogyakarta', 'Surabaya', 'Malang', 'Denpasar'];
const SEAT_LETTERS = ['A','B','C','D'];
const TOTAL_ROWS = 6;
const GERBONGS = ['Gerbong 1', 'Gerbong 2', 'Gerbong 3'];

export default function BookingForm({ token, onBookingSuccess, onCancel }: BookingFormProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [origin, setOrigin] = useState('Jakarta');
  const [destination, setDestination] = useState('Bandung');
  const [travelDate, setTravelDate] = useState(new Date().toISOString().split('T')[0]);
  const [passengerCount, setPassengerCount] = useState(1);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([{ name:'', nik:'', seat:null }]);
  const [activePassengerIdx, setActivePassengerIdx] = useState(0);
  const [selectedGerbong, setSelectedGerbong] = useState(GERBONGS[0]);
  const [occupiedSeats, setOccupiedSeats] = useState<string[]>([]);

  useEffect(() => {
    const occ: string[] = [];
    for (const g of GERBONGS) for (let r=1; r<=TOTAL_ROWS; r++) for (const l of SEAT_LETTERS) if (Math.random()<0.35) occ.push(`${g}-${r}${l}`);
    setOccupiedSeats(occ);
  }, []);

  useEffect(() => {
    setPassengers(Array.from({ length:passengerCount }, ()=>({ name:'', nik:'', seat:null })));
    setActivePassengerIdx(0);
  }, [passengerCount]);

  const swapCities = () => { setOrigin(destination); setDestination(origin); };

  const handleSearch = () => {
    if (origin === destination) { alert('Kota asal dan tujuan tidak boleh sama!'); return; }
    const basePrice = origin==='Jakarta' && destination==='Bandung' ? 150000 : origin==='Bandung' && destination==='Yogyakarta' ? 400000 : 200000;
    setSchedules([
      { id:'SCH_001', name:'GOtravel Express',     class:'Eksekutif',      departure:'08:30', arrival:'11:00', duration:'2j 30m', price:basePrice,     seatsLeft:12 },
      { id:'SCH_002', name:'GOtravel VIP',          class:'Super Luxury',   departure:'14:15', arrival:'17:00', duration:'2j 45m', price:basePrice*1.5, seatsLeft:4  },
      { id:'SCH_003', name:'GOtravel Ekonomi',      class:'Ekonomi Plus',   departure:'18:00', arrival:'20:45', duration:'2j 45m', price:basePrice*0.7, seatsLeft:32 },
    ]);
    setStep(2);
  };

  const handleSelectSchedule = (s: any) => { setSelectedSchedule(s); setStep(3); };

  const handleProceedToReview = () => {
    if (passengers.some(p => !p.name || !p.nik)) { alert('Lengkapi data semua penumpang!'); return; }
    if (passengers.some(p => !p.seat)) { alert('Pilih kursi untuk semua penumpang!'); return; }
    setStep(4);
  };

  const handleBooking = async () => {
    if (!token) { alert('Harap login terlebih dahulu.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/bookings`, {
        method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ route:{ from:origin, to:destination, waypoints:passengers.map(p=>p.seat) }, vehicleType:`${selectedSchedule.name} (${selectedSchedule.class})`, price:selectedSchedule.price*passengerCount }),
      });
      const data = await res.json();
      if (res.ok) { onBookingSuccess(data.bookingId); }
      else { alert(data.error || 'Booking gagal.'); }
    } catch { alert('Tidak bisa terhubung ke server.'); }
    finally { setLoading(false); }
  };

  const updatePassenger = (idx: number, field: keyof Passenger, value: string) => {
    setPassengers(prev => { const a=[...prev]; a[idx]={...a[idx],[field]:value}; return a; });
  };
  const selectSeat = (seatId: string) => {
    if (occupiedSeats.includes(seatId)) return;
    if (passengers.some((p,i)=>p.seat===seatId && i!==activePassengerIdx)) return;
    updatePassenger(activePassengerIdx, 'seat', seatId);
  };

  const stepLabels = ['Cari', 'Jadwal', 'Penumpang', 'Bayar'];

  return (
    <div className="flex flex-col min-h-screen" style={{ background:'var(--color-bg)' }}>

      {/* ── PAGE HEADER ── */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={step===1 ? onCancel : ()=>setStep(s=>s-1)} className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform" style={{ background:'var(--color-card-bg)', border:'1px solid var(--color-border)' }}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-black">Pesan Tiket</h1>
            <p className="text-xs opacity-50">{stepLabels[step-1]} · Langkah {step} dari 4</p>
          </div>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-1.5">
          {stepLabels.map((_,i) => (
            <div key={i} className={`step-dot ${i+1===step ? 'active' : i+1<step ? 'done' : 'pending'}`} />
          ))}
        </div>
      </div>

      {/* ── STEP 1: SEARCH ── */}
      {step === 1 && (
        <div className="px-4 pt-4 space-y-4 slide-up">
          <div className="card-lg p-5 space-y-4">
            {/* Origin */}
            <div>
              <label className="text-xs font-bold opacity-50 uppercase tracking-wider block mb-2">Dari</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                <select value={origin} onChange={e=>setOrigin(e.target.value)} className="input-field pl-11 appearance-none">
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Swap button */}
            <div className="flex justify-center">
              <button onClick={swapCities} className="w-10 h-10 rounded-full flex items-center justify-center border-2 active:scale-90 transition-all" style={{ borderColor:'var(--color-primary)', background:'var(--color-primary-light)' }}>
                <ArrowLeftRight className="w-4 h-4" style={{ color:'var(--color-primary)' }} />
              </button>
            </div>

            {/* Destination */}
            <div>
              <label className="text-xs font-bold opacity-50 uppercase tracking-wider block mb-2">Ke</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                <select value={destination} onChange={e=>setDestination(e.target.value)} className="input-field pl-11 appearance-none">
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="text-xs font-bold opacity-50 uppercase tracking-wider block mb-2">Tanggal Pergi</label>
              <input type="date" value={travelDate} onChange={e=>setTravelDate(e.target.value)} className="input-field" min={new Date().toISOString().split('T')[0]} />
            </div>

            {/* Passengers */}
            <div>
              <label className="text-xs font-bold opacity-50 uppercase tracking-wider block mb-2">Jumlah Penumpang</label>
              <div className="flex items-center gap-4">
                <button onClick={()=>setPassengerCount(c=>Math.max(1,c-1))} className="w-12 h-12 rounded-2xl text-xl font-bold flex items-center justify-center active:scale-90 transition-transform" style={{ background:'var(--color-bg)', border:'1px solid var(--color-border)' }}>−</button>
                <span className="text-2xl font-black flex-1 text-center">{passengerCount}</span>
                <button onClick={()=>setPassengerCount(c=>Math.min(6,c+1))} className="w-12 h-12 rounded-2xl text-xl font-bold flex items-center justify-center active:scale-90 transition-transform" style={{ background:'var(--color-primary)', color:'white' }}>+</button>
              </div>
            </div>
          </div>

          <button onClick={handleSearch} className="btn-primary">
            Cari Jadwal Tersedia →
          </button>
        </div>
      )}

      {/* ── STEP 2: SCHEDULES ── */}
      {step === 2 && (
        <div className="px-4 pt-4 space-y-3 slide-up">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold text-sm">{origin}</span>
            <ArrowRight className="w-4 h-4 opacity-40" />
            <span className="font-bold text-sm">{destination}</span>
            <span className="ml-auto text-xs opacity-40">{travelDate}</span>
          </div>
          {schedules.map(s => (
            <button key={s.id} onClick={()=>handleSelectSchedule(s)} className="schedule-card w-full text-left" style={{ background:'var(--color-card-bg)', border:'1.5px solid var(--color-border)' }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-black text-sm">{s.name}</p>
                  <p className="text-xs opacity-50">{s.class}</p>
                </div>
                <span className="text-lg font-black" style={{ color:'var(--color-primary)' }}>Rp{(s.price/1000).toFixed(0)}k</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-xl font-black">{s.departure}</p>
                  <p className="text-[10px] opacity-40">{origin}</p>
                </div>
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full h-px" style={{ background:'var(--color-border)' }} />
                  <p className="text-[9px] opacity-40 font-semibold">{s.duration}</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-black">{s.arrival}</p>
                  <p className="text-[10px] opacity-40">{destination}</p>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t flex items-center justify-between" style={{ borderColor:'var(--color-border)' }}>
                <span className="text-xs text-green-500 font-semibold">{s.seatsLeft} kursi tersedia</span>
                <span className="text-xs font-bold" style={{ color:'var(--color-primary)' }}>Pilih →</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── STEP 3: SEATS & PASSENGERS ── */}
      {step === 3 && selectedSchedule && (
        <div className="px-4 pt-4 space-y-4 slide-up">
          {/* Passenger tabs */}
          <div className="scroll-x">
            {passengers.map((_,i) => (
              <button key={i} onClick={()=>setActivePassengerIdx(i)}
                className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all"
                style={{ borderColor: i===activePassengerIdx ? 'var(--color-primary)' : 'var(--color-border)', background: i===activePassengerIdx ? 'var(--color-primary-light)' : 'transparent', color: i===activePassengerIdx ? 'var(--color-primary)' : 'var(--color-muted)' }}
              >
                {passengers[i].name || `Penumpang ${i+1}`} {passengers[i].seat ? '✓' : ''}
              </button>
            ))}
          </div>

          {/* Current passenger form */}
          <div className="card p-4 space-y-3">
            <h3 className="text-sm font-bold">Data Penumpang {activePassengerIdx+1}</h3>
            <input type="text" placeholder="Nama lengkap sesuai KTP" className="input-field" value={passengers[activePassengerIdx].name} onChange={e=>updatePassenger(activePassengerIdx,'name',e.target.value)} />
            <input type="text" placeholder="NIK (16 digit)" maxLength={16} className="input-field" value={passengers[activePassengerIdx].nik} onChange={e=>updatePassenger(activePassengerIdx,'nik',e.target.value.replace(/\D/g,''))} />
            {passengers[activePassengerIdx].seat && (
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background:'var(--color-primary-light)' }}>
                <Check className="w-4 h-4" style={{ color:'var(--color-primary)' }} />
                <span className="text-sm font-bold" style={{ color:'var(--color-primary)' }}>Kursi: {passengers[activePassengerIdx].seat?.replace('Gerbong ', 'G')}</span>
              </div>
            )}
          </div>

          {/* Seat map */}
          <div className="card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-1.5"><Armchair className="w-4 h-4" />Pilih Kursi</h3>
            </div>

            {/* Gerbong selector */}
            <div className="flex gap-2">
              {GERBONGS.map(g => (
                <button key={g} onClick={()=>setSelectedGerbong(g)}
                  className="flex-1 py-2 text-[10px] font-bold rounded-xl border transition-all"
                  style={{ borderColor: g===selectedGerbong ? 'var(--color-primary)' : 'var(--color-border)', background: g===selectedGerbong ? 'var(--color-primary-light)' : 'transparent', color: g===selectedGerbong ? 'var(--color-primary)' : 'var(--color-muted)' }}
                >
                  {g.replace('Gerbong ','')}
                </button>
              ))}
            </div>

            {/* Seat grid header */}
            <div className="grid grid-cols-5 gap-1 text-[9px] font-bold opacity-40 text-center">
              <span></span>
              {SEAT_LETTERS.map(l=><span key={l}>{l}</span>)}
            </div>

            {/* Seats */}
            <div className="space-y-1.5">
              {Array.from({length:TOTAL_ROWS},(_,rowIdx)=>{
                const rowNum = rowIdx+1;
                return (
                  <div key={rowNum} className="grid grid-cols-5 gap-1 items-center">
                    <span className="text-[9px] opacity-40 font-bold text-center">{rowNum}</span>
                    {SEAT_LETTERS.map(l => {
                      const seatId = `${selectedGerbong}-${rowNum}${l}`;
                      const isTaken = occupiedSeats.includes(seatId);
                      const myPassengerIdx = passengers.findIndex(p=>p.seat===seatId);
                      const isMine = myPassengerIdx !== -1;
                      const isActivePassenger = myPassengerIdx === activePassengerIdx;
                      return (
                        <button key={l} onClick={()=>selectSeat(seatId)} disabled={isTaken}
                          className={`seat-btn ${isTaken ? 'taken' : isMine ? 'mine' : ''}`}
                          title={isTaken ? 'Terisi' : seatId}
                        >
                          {isMine ? (isActivePassenger ? '★' : (myPassengerIdx+1).toString()) : `${rowNum}${l}`}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 text-[9px] font-semibold opacity-60">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded inline-block bg-red-500/20 border border-red-500/30" />Terisi</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded inline-block" style={{background:'var(--color-primary)'}} />Pilihan</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded inline-block border" style={{borderColor:'var(--color-border)'}} />Kosong</span>
            </div>
          </div>

          <button onClick={handleProceedToReview} className="btn-primary">Lanjut ke Review →</button>
        </div>
      )}

      {/* ── STEP 4: REVIEW ── */}
      {step === 4 && selectedSchedule && (
        <div className="px-4 pt-4 space-y-4 slide-up">
          {/* Trip summary */}
          <div className="card p-5 space-y-4">
            <h2 className="font-bold text-sm border-b pb-2 flex items-center gap-2" style={{ borderColor:'var(--color-border)' }}>
              <Check className="w-4 h-4 text-green-500" /> Detail Perjalanan
            </h2>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-2xl font-black">{selectedSchedule.departure}</p>
                <p className="text-xs opacity-50">{origin}</p>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-center gap-1">
                  <div className="flex-1 h-px" style={{ background:'var(--color-border)' }} />
                  <Train className="w-4 h-4 opacity-30" />
                  <div className="flex-1 h-px" style={{ background:'var(--color-border)' }} />
                </div>
                <p className="text-[10px] opacity-40">{selectedSchedule.duration}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black">{selectedSchedule.arrival}</p>
                <p className="text-xs opacity-50">{destination}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t" style={{ borderColor:'var(--color-border)' }}>
              <div><p className="text-[10px] opacity-50">Kelas</p><p className="text-sm font-bold">{selectedSchedule.class}</p></div>
              <div><p className="text-[10px] opacity-50">Tanggal</p><p className="text-sm font-bold">{travelDate}</p></div>
            </div>
          </div>

          {/* Passengers list */}
          <div className="card p-5 space-y-2.5">
            <h2 className="font-bold text-sm border-b pb-2" style={{ borderColor:'var(--color-border)' }}>Penumpang & Kursi</h2>
            {passengers.map((p,i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background:'var(--color-bg)' }}>
                <div>
                  <p className="text-sm font-bold">{p.name}</p>
                  <p className="text-[10px] opacity-40">NIK: {p.nik}</p>
                </div>
                <span className="text-xs font-black px-3 py-1 rounded-lg" style={{ background:'var(--color-primary-light)', color:'var(--color-primary)' }}>
                  {p.seat?.replace('Gerbong ', 'G')?.replace(' ', '')}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="rounded-2xl p-5 flex items-center justify-between" style={{ background:'linear-gradient(135deg, #1e3a5f, #1a1f6e)' }}>
            <div>
              <p className="text-xs text-blue-300 font-semibold">{passengerCount} Penumpang</p>
              <p className="text-2xl font-black text-white">Rp{(selectedSchedule.price*passengerCount).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-blue-300 opacity-70">per orang</p>
              <p className="text-base font-bold text-white">Rp{selectedSchedule.price.toLocaleString()}</p>
            </div>
          </div>

          <button onClick={handleBooking} disabled={loading} className="btn-primary" style={{ opacity:loading?0.6:1 }}>
            {loading ? 'Memproses Pembayaran...' : '💳 Bayar Sekarang'}
          </button>
          <p className="text-center text-xs opacity-40">Dengan menekan Bayar, kamu menyetujui Syarat & Ketentuan GOtravel.</p>
        </div>
      )}

    </div>
  );
}