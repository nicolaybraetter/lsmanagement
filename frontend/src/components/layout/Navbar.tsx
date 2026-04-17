import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useFarmStore } from '../../store/farmStore';
import { useSidebarStore } from '../../store/sidebarStore';
import { Tractor, Menu, X, ChevronDown, User, LogOut, Settings, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { currentFarm } = useFarmStore();
  const { toggle: toggleSidebar } = useSidebarStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setProfileOpen(false);
    setMenuOpen(false);
  };

  const isLanding = location.pathname === '/';
  const isDashboard = location.pathname.startsWith('/dashboard');

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isLanding ? 'bg-transparent' : 'bg-white border-b border-gray-200 shadow-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <div className="flex items-center gap-3">
            {/* Sidebar toggle — mobile, dashboard only */}
            {isAuthenticated && isDashboard && (
              <button
                onClick={toggleSidebar}
                className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Menü öffnen"
              >
                <Menu size={20} />
              </button>
            )}

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center shadow-md group-hover:bg-green-700 transition-colors">
                <Tractor className="w-5 h-5 text-white" />
              </div>
              <span className={`font-bold text-lg ${isLanding ? 'text-white' : 'text-gray-900'}`}>
                LS<span className="text-green-500">Management</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {!isAuthenticated ? (
              <>
                <a href="#features" className={`text-sm font-medium hover:text-green-500 transition-colors ${isLanding ? 'text-white/90' : 'text-gray-600'}`}>Features</a>
                <a href="#about" className={`text-sm font-medium hover:text-green-500 transition-colors ${isLanding ? 'text-white/90' : 'text-gray-600'}`}>Über uns</a>
                <Link to="/login" className={`text-sm font-medium hover:text-green-500 transition-colors ${isLanding ? 'text-white/90' : 'text-gray-600'}`}>Anmelden</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-5">Kostenlos starten</Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className={`flex items-center gap-1.5 text-sm font-medium hover:text-green-600 transition-colors ${isDashboard ? 'text-green-600' : 'text-gray-600'}`}>
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                {currentFarm && (
                  <span className="hidden lg:inline-flex text-sm text-gray-500 bg-green-50 px-3 py-1 rounded-full border border-green-200">
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
                    <span className="hidden sm:inline">{user?.username}</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{user?.full_name || user?.username}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                      <Link to="/dashboard/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <User className="w-4 h-4" /> Profil
                      </Link>
                      <Link to="/dashboard/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <Settings className="w-4 h-4" /> Hof-Einstellungen
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

          {/* Mobile right side */}
          <div className="flex items-center gap-2 md:hidden">
            {isAuthenticated ? (
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center justify-center w-8 h-8 bg-green-600 rounded-full text-white text-sm font-bold"
              >
                {user?.username?.[0]?.toUpperCase()}
              </button>
            ) : (
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-lg">
                {menuOpen ? <X className={isLanding ? 'text-white' : 'text-gray-700'} size={20} /> : <Menu className={isLanding ? 'text-white' : 'text-gray-700'} size={20} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile profile dropdown */}
      {profileOpen && isAuthenticated && (
        <div className="md:hidden absolute right-4 top-16 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">{user?.full_name || user?.username}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            {currentFarm && <p className="text-xs text-green-600 mt-0.5">🏡 {currentFarm.name}</p>}
          </div>
          <Link to="/dashboard/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
            <User className="w-4 h-4" /> Profil
          </Link>
          <Link to="/dashboard/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
            <Settings className="w-4 h-4" /> Hof-Einstellungen
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full text-left">
            <LogOut className="w-4 h-4" /> Abmelden
          </button>
        </div>
      )}

      {/* Mobile menu (non-authenticated) */}
      {menuOpen && !isAuthenticated && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-4 py-3 space-y-1">
            <Link to="/login" onClick={() => setMenuOpen(false)} className="block py-2.5 px-3 rounded-lg text-gray-700 font-medium hover:bg-gray-50">Anmelden</Link>
            <Link to="/register" onClick={() => setMenuOpen(false)} className="block py-2.5 px-3 rounded-lg text-green-600 font-medium hover:bg-green-50">Kostenlos starten</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
