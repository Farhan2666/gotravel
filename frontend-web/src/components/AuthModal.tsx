import React, { useState } from 'react';
import { X, Mail, Lock, User, Car, Eye, EyeOff } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean; onClose: () => void;
  onAuthSuccess: (token: string, user: any) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login'|'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [role, setRole] = useState<'user'|'driver'>('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const endpoint = mode === 'login' ? 'login' : 'register';
    const body = mode === 'login' ? { email, password } : { name, email, password, role };
    try {
      const res = await fetch(`http://localhost:5000/api/${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        if (mode === 'login') { onAuthSuccess(data.token, data.user); }
        else { setError(''); setMode('login'); alert('Registrasi berhasil! Silakan login.'); }
      } else { setError(data.error || 'Terjadi kesalahan.'); }
    } catch { setError('Gagal terhubung ke server. Pastikan backend aktif.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-sheet-handle" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black">{mode === 'login' ? 'Selamat Datang' : 'Buat Akun Baru'}</h2>
            <p className="text-sm opacity-50 mt-0.5">{mode === 'login' ? 'Masuk ke akun GOtravel kamu' : 'Daftar sebagai pengguna atau sopir'}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background:'var(--color-bg)', border:'1px solid var(--color-border)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              {/* Name */}
              <div>
                <label className="text-xs font-bold opacity-60 uppercase tracking-wider block mb-1.5">Nama Lengkap</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Nama kamu" className="input-field pl-11" />
                </div>
              </div>

              {/* Role selector */}
              <div>
                <label className="text-xs font-bold opacity-60 uppercase tracking-wider block mb-1.5">Daftar Sebagai</label>
                <div className="grid grid-cols-2 gap-3">
                  {[{ v:'user' as const, label:'Penumpang', icon:'🧍', desc:'Pesan & lacak perjalanan' },
                    { v:'driver' as const, label:'Sopir',     icon:'🚗', desc:'Terima orderan & kirim GPS' }].map(opt => (
                    <button type="button" key={opt.v} onClick={() => setRole(opt.v)}
                      className="p-3.5 rounded-2xl border-2 text-left transition-all active:scale-95"
                      style={{ borderColor: role===opt.v ? 'var(--color-primary)' : 'var(--color-border)', background: role===opt.v ? 'var(--color-primary-light)' : 'var(--color-bg)' }}
                    >
                      <div className="text-xl mb-1.5">{opt.icon}</div>
                      <p className="text-sm font-bold">{opt.label}</p>
                      <p className="text-[10px] opacity-50 leading-tight">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="text-xs font-bold opacity-60 uppercase tracking-wider block mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" className="input-field pl-11" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-bold opacity-60 uppercase tracking-wider block mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
              <input type={showPw ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="input-field pl-11 pr-12" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && <div className="p-3.5 rounded-xl text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20">{error}</div>}

          {/* Submit */}
          <button type="submit" disabled={loading} className="btn-primary mt-2" style={{ opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Memproses...' : mode === 'login' ? 'Masuk Sekarang' : 'Buat Akun'}
          </button>

          {/* Toggle mode */}
          <p className="text-center text-sm opacity-60">
            {mode === 'login' ? 'Belum punya akun? ' : 'Sudah punya akun? '}
            <button type="button" className="font-bold" style={{ color:'var(--color-primary)' }} onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}>
              {mode === 'login' ? 'Daftar Gratis' : 'Masuk'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}