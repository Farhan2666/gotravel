import React, { useState } from 'react';
import { X, Mail, Lock, User } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (token: string, user: any) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'driver'>('user');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const endpoint = mode === 'login' ? 'login' : 'register';
    const body = mode === 'login' ? { email, password } : { name, email, password, role };

    try {
      const response = await fetch(`http://localhost:5000/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (response.ok) {
        if (mode === 'login') {
          onAuthSuccess(data.token, data.user);
        } else {
          alert('Registrasi sukses! Silakan login.');
          setMode('login');
        }
      } else {
        alert(data.error || 'Authentication failed');
      }
    } catch {
      alert('Gagal menghubungi API Backend server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm rounded-2xl border p-6 space-y-4 shadow-2xl" style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border)' }}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-500/10 opacity-70 hover:opacity-100 transition-all">
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-lg font-bold text-center">
          {mode === 'login' ? 'Masuk ke GOtravel' : 'Daftar Akun Baru'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-widest opacity-60">Nama Lengkap</label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 w-4 h-4 opacity-50" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm bg-transparent outline-none text-white"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-widest opacity-60">Daftar Sebagai</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as 'user' | 'driver')}
                  className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none text-white"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                >
                  <option value="user" className="bg-neutral-800 text-white">Penumpang (User)</option>
                  <option value="driver" className="bg-neutral-800 text-white">Sopir (Driver)</option>
                </select>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-widest opacity-60">Email</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 w-4 h-4 opacity-50" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm bg-transparent outline-none text-white"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-widest opacity-60">Password</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-4 h-4 opacity-50" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm bg-transparent outline-none text-white"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all active:scale-95 disabled:opacity-40"
          >
            {loading ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Daftar'}
          </button>
        </form>

        <div className="text-center text-xs opacity-75">
          {mode === 'login' ? (
            <p>Belum punya akun? <button onClick={() => setMode('register')} className="text-blue-400 font-bold hover:underline">Daftar sekarang</button></p>
          ) : (
            <p>Sudah punya akun? <button onClick={() => setMode('login')} className="text-blue-400 font-bold hover:underline">Login disini</button></p>
          )}
        </div>
      </div>
    </div>
  );
}
