import React, { useState, useEffect } from 'react';
import { Compass, Car, MapPin, LogOut, Sun, Moon, Shield, UserCheck, Bell } from 'lucide-react';
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
      // Migration: if user has no role, default to 'user'
      if (parsed && !parsed.role) {
        parsed.role = 'user';
        localStorage.setItem('gt_user', JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return null;
    }
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'booking' | 'tracking'>('dashboard');
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(localStorage.getItem('gt_booking_id'));
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [showNotif, setShowNotif] = useState(false);

  const toggleTheme = () => {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = () => {
    localStorage.removeItem('gt_token');
    localStorage.removeItem('gt_user');
    localStorage.removeItem('gt_booking_id');
    setToken(null);
    setUser(null);
    setCurrentBookingId(null);
    setActiveTab('dashboard');
  };

  const handleLoginSuccess = (newToken: string, newUser: any) => {
    // Ensure role is always set
    if (!newUser.role) newUser.role = 'user';
    localStorage.setItem('gt_token', newToken);
    localStorage.setItem('gt_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setIsAuthOpen(false);
  };

  const handleBookingSuccess = (bookingId: string) => {
    localStorage.setItem('gt_booking_id', bookingId);
    setCurrentBookingId(bookingId);
    setActiveTab('tracking');
  };

  // Role checks — only logged-in users with explicit role
  const isPassenger = !user || user.role === 'user';
  const isDriver = user && user.role === 'driver';
  const isAdmin = user && user.role === 'admin';

  const notifCount = currentBookingId ? 1 : 0;

  return (
    <div className={`theme-${theme} theme-container flex flex-col font-sans transition-colors duration-300`}>
      <header className="border-b border-opacity-10 border-gray-400 px-4 py-3 sticky top-0 backdrop-blur-md z-30 flex items-center justify-between" style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-2.5">
          <span className="text-xl font-black tracking-wider flex items-center gap-1.5 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <Compass className="w-6 h-6 text-blue-500" />
            GO<span style={{ color: 'var(--color-primary)' }}>travel</span>
          </span>
          
          {/* Role Badges */}
          {isDriver && (
            <span className="text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-500 font-bold border border-emerald-500/30 flex items-center gap-1">
              <UserCheck className="w-3 h-3" />
              Sopir
            </span>
          )}
          {isAdmin && (
            <span className="text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded bg-red-500/20 text-red-500 font-bold border border-red-500/30 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              Admin
            </span>
          )}
          {user && isPassenger && (
            <span className="text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold border border-blue-500/20 flex items-center gap-1">
              Penumpang
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-500/10 transition-colors">
            {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              {/* Notification bell for passengers */}
              {isPassenger && notifCount > 0 && (
                <button className="relative p-2 rounded-full hover:bg-gray-500/10 transition-colors" onClick={() => setActiveTab('tracking')}>
                  <Bell className="w-4 h-4 text-blue-400" />
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-black flex items-center justify-center">
                    {notifCount}
                  </span>
                </button>
              )}
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold leading-tight">{user.name}</p>
                <p className="text-[10px] opacity-50">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-500/10 text-red-400 border border-red-500/20 transition-colors text-xs font-bold"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthOpen(true)}
              className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all active:scale-95"
            >
              Masuk
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 pb-24">
        {/* PASSENGER VIEW */}
        {isPassenger && (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                user={user}
                token={token}
                onUpdateUser={(updated) => {
                  localStorage.setItem('gt_user', JSON.stringify(updated));
                  setUser(updated);
                }}
                onStartBooking={() => {
                  if (!user) setIsAuthOpen(true);
                  else setActiveTab('booking');
                }}
              />
            )}
            {activeTab === 'booking' && (
              <BookingForm
                token={token}
                onBookingSuccess={handleBookingSuccess}
                onCancel={() => setActiveTab('dashboard')}
              />
            )}
            {activeTab === 'tracking' && (
              <LiveTracking
                token={token}
                bookingId={currentBookingId}
                onBackToDashboard={() => setActiveTab('dashboard')}
              />
            )}
          </>
        )}

        {/* DRIVER VIEW */}
        {isDriver && <DriverPanel token={token} user={user} />}

        {/* ADMIN VIEW */}
        {isAdmin && <AdminPanel token={token} user={user} />}
      </main>

      {/* Bottom nav ONLY for logged-in Passengers */}
      {isPassenger && user && (
        <nav className="fixed bottom-0 left-0 right-0 border-t z-20" style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border)' }}>
          <div className="max-w-4xl mx-auto flex justify-around px-4 py-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center gap-1 px-6 py-2 rounded-2xl transition-all text-xs font-bold ${activeTab === 'dashboard' ? 'bg-blue-600/15 text-blue-400' : 'opacity-45 hover:opacity-70'}`}
            >
              <Compass className="w-5 h-5" />
              <span className="text-[9px]">Beranda</span>
            </button>
            <button
              onClick={() => setActiveTab('booking')}
              className={`flex flex-col items-center gap-1 px-6 py-2 rounded-2xl transition-all text-xs font-bold ${activeTab === 'booking' ? 'bg-blue-600/15 text-blue-400' : 'opacity-45 hover:opacity-70'}`}
            >
              <Car className="w-5 h-5" />
              <span className="text-[9px]">Pesan</span>
            </button>
            <button
              onClick={() => setActiveTab('tracking')}
              disabled={!currentBookingId}
              className={`relative flex flex-col items-center gap-1 px-6 py-2 rounded-2xl transition-all text-xs font-bold ${!currentBookingId ? 'opacity-20 cursor-not-allowed' : activeTab === 'tracking' ? 'bg-blue-600/15 text-blue-400' : 'opacity-45 hover:opacity-70'}`}
            >
              <MapPin className="w-5 h-5" />
              <span className="text-[9px]">Lacak</span>
              {currentBookingId && (
                <span className="absolute top-1 right-4 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              )}
            </button>
          </div>
        </nav>
      )}

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onAuthSuccess={handleLoginSuccess} />
    </div>
  );
}
