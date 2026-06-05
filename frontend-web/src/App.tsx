import React, { useState } from 'react';
import { Compass, Car, MapPin, LogOut, Sun, Moon, Shield, UserCheck, Bell, ChevronRight } from 'lucide-react';
import Dashboard from './components/Dashboard';
import BookingForm from './components/BookingForm';
import LiveTracking from './components/LiveTracking';
import DriverPanel from './components/DriverPanel';
import AdminPanel from './components/AdminPanel';
import AuthModal from './components/AuthModal';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [token, setToken] = useState<string | null>(localStorage.getItem('gt_token'));
  const [user, setUser] = useState<any>(() => {
    const raw = localStorage.getItem('gt_user');
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && !parsed.role) { parsed.role = 'user'; localStorage.setItem('gt_user', JSON.stringify(parsed)); }
      return parsed;
    } catch { return null; }
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'booking' | 'tracking'>('dashboard');
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(localStorage.getItem('gt_booking_id'));
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('gt_token'); localStorage.removeItem('gt_user'); localStorage.removeItem('gt_booking_id');
    setToken(null); setUser(null); setCurrentBookingId(null); setActiveTab('dashboard');
  };

  const handleLoginSuccess = (newToken: string, newUser: any) => {
    if (!newUser.role) newUser.role = 'user';
    localStorage.setItem('gt_token', newToken); localStorage.setItem('gt_user', JSON.stringify(newUser));
    setToken(newToken); setUser(newUser); setIsAuthOpen(false);
  };

  const handleBookingSuccess = (bookingId: string) => {
    localStorage.setItem('gt_booking_id', bookingId); setCurrentBookingId(bookingId); setActiveTab('tracking');
  };

  const isPassenger = !user || user.role === 'user';
  const isDriver = user && user.role === 'driver';
  const isAdmin = user && user.role === 'admin';

  type NavItem = { id: 'dashboard'|'booking'|'tracking'; icon: typeof Compass; label: string; disabled?: boolean };
  const navItems: NavItem[] = [
    { id: 'dashboard', icon: Compass, label: 'Beranda' },
    { id: 'booking',   icon: Car,     label: 'Pesan' },
    { id: 'tracking',  icon: MapPin,  label: 'Lacak', disabled: !currentBookingId },
  ];

  return (
    <div className={`theme-${theme} theme-container`}>

      {/* â”€â”€ HEADER â”€â”€ */}
      <header className="app-header px-4 py-3 flex items-center justify-between">
        <button onClick={() => setActiveTab('dashboard')} className="flex items-center gap-2 active:scale-95 transition-transform">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/30">
            <Compass className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-black tracking-tight">
            GO<span style={{ color: 'var(--color-primary)' }}>travel</span>
          </span>
        </button>

        <div className="flex items-center gap-2">
          {/* Role badge */}
          {isDriver && <span className="badge" style={{ background:'rgba(16,185,129,0.15)', color:'#10B981', border:'1px solid rgba(16,185,129,0.3)' }}><UserCheck className="w-3 h-3"/>Sopir</span>}
          {isAdmin  && <span className="badge" style={{ background:'rgba(239,68,68,0.15)', color:'#EF4444', border:'1px solid rgba(239,68,68,0.3)' }}><Shield className="w-3 h-3"/>Admin</span>}

          {/* Theme toggle */}
          <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background:'var(--color-card-bg)', border:'1px solid var(--color-border)' }}>
            {theme === 'dark' ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-blue-500" />}
          </button>

          {/* Auth button */}
          {user ? (
            <div className="flex items-center gap-2">
              {/* Notification dot for tracking */}
              {isPassenger && currentBookingId && (
                <button onClick={() => setActiveTab('tracking')} className="relative w-9 h-9 rounded-full flex items-center justify-center" style={{ background:'var(--color-card-bg)', border:'1px solid var(--color-border)' }}>
                  <Bell className="w-4 h-4" style={{ color:'var(--color-primary)' }} />
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
                </button>
              )}
              <button onClick={handleLogout} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)' }}>
                <LogOut className="w-4 h-4 text-red-400" />
              </button>
            </div>
          ) : (
            <button onClick={() => setIsAuthOpen(true)} className="px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background:'var(--color-primary)' }}>
              Masuk
            </button>
          )}
        </div>
      </header>

      {/* â”€â”€ MAIN â”€â”€ */}
      <main className="main-content" style={{ paddingBottom: isPassenger && user ? '80px' : '16px' }}>
        {isPassenger && (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard user={user} token={token}
                onUpdateUser={(u) => { localStorage.setItem('gt_user', JSON.stringify(u)); setUser(u); }}
                onStartBooking={() => { if (!user) setIsAuthOpen(true); else setActiveTab('booking'); }}
              />
            )}
            {activeTab === 'booking' && (
              <BookingForm token={token} onBookingSuccess={handleBookingSuccess} onCancel={() => setActiveTab('dashboard')} />
            )}
            {activeTab === 'tracking' && (
              <LiveTracking token={token} bookingId={currentBookingId} onBackToDashboard={() => setActiveTab('dashboard')} />
            )}
          </>
        )}
        {isDriver && <DriverPanel token={token} user={user} />}
        {isAdmin  && <AdminPanel  token={token} user={user} />}
      </main>

      {/* â”€â”€ BOTTOM NAV (Passengers only) â”€â”€ */}
      {isPassenger && user && (
        <nav className="bottom-nav">
          <div className="flex items-center justify-around px-2 py-2">
            {navItems.map(({ id, icon: Icon, label, disabled }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => !disabled && setActiveTab(id as any)}
                  disabled={disabled}
                  className="flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all relative"
                  style={{
                    background: active ? 'var(--color-primary-light)' : 'transparent',
                    opacity: disabled ? 0.3 : 1,
                  }}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5 transition-colors" style={{ color: active ? 'var(--color-primary)' : 'var(--color-muted)' }} />
                    {id === 'tracking' && currentBookingId && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    )}
                  </div>
                  <span className="text-[10px] font-semibold" style={{ color: active ? 'var(--color-primary)' : 'var(--color-muted)' }}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onAuthSuccess={handleLoginSuccess} />
    </div>
  );
}