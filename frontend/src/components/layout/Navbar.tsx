import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useFarmStore } from '../../store/farmStore';
import { Tractor, Menu, X, ChevronDown, User, LogOut, Settings, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { currentFarm } = useFarmStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setProfileOpen(false);
  };

  const isLanding = location.pathname === '/';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isLanding ? 'bg-transparent' : 'bg-white border-b border-gray-200 shadow-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center shadow-md group-hover:bg-green-700 transition-colors">
              <Tractor className="w-5 h-5 text-white" />
            </div>
            <span className={`font-bold text-lg ${isLanding ? 'text-white' : 'text-gray-900'}`}>
              LS<span className="text-green-500">Management</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {!isAuthenticated ? (
              <>
                <a href="#features" className={`text-sm font-medium hover:text-green-500 transition-colors ${isLanding ? 'text-white/90' : 'text-gray-600'}`}>Features</a>
                <a href="#about" className={`text-sm font-medium hover:text-green-500 transition-colors ${isLanding ? 'text-white/90' : 'text-gray-600'}`}>Über uns</a>
                <Link to="/login" className={`text-sm font-medium hover:text-green-500 transition-colors ${isLanding ? 'text-white/90' : 'text-gray-600'}`}>Anmelden</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-5">
                  Kostenlos starten
                </Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className={`flex items-center gap-1.5 text-sm font-medium hover:text-green-600 transition-colors ${location.pathname.startsWith('/dashboard') ? 'text-green-600' : 'text-gray-600'}`}>
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                {currentFarm && (
                  <span className="text-sm text-gray-500 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                    🏡 {currentFarm.name}
                  </span>
                )}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1.5 transition-colors"
                  >
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {user?.username?.[0]?.toUpperCase()}
                    </div>
                    <span>{user?.username}</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{user?.full_name || user?.username}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                      <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <User className="w-4 h-4" /> Profil
                      </Link>
                      <Link to="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <Settings className="w-4 h-4" /> Einstellungen
                      </Link>
                      <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left">
                        <LogOut className="w-4 h-4" /> Abmelden
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className={isLanding ? 'text-white' : 'text-gray-700'} /> : <Menu className={isLanding ? 'text-white' : 'text-gray-700'} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-4 py-3 space-y-2">
            {!isAuthenticated ? (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="block py-2 text-gray-700 font-medium">Anmelden</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="block py-2 text-green-600 font-medium">Kostenlos starten</Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block py-2 text-gray-700 font-medium">Dashboard</Link>
                <Link to="/profile" onClick={() => setMenuOpen(false)} className="block py-2 text-gray-700 font-medium">Profil</Link>
                <button onClick={handleLogout} className="block py-2 text-red-600 font-medium w-full text-left">Abmelden</button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
