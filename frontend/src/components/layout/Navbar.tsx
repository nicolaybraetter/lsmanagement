import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useFarmStore } from '../../store/farmStore';
import { useSidebarStore } from '../../store/sidebarStore';
import { useNotificationStore } from '../../store/notificationStore';
import { notificationsApi } from '../../services/api';
import { Tractor, Menu, X, ChevronDown, User, LogOut, Settings, LayoutDashboard, Bell } from 'lucide-react';

const timeAgo = (dateStr: string) => {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'Gerade eben';
  if (diff < 3600) return `vor ${Math.floor(diff / 60)} Min.`;
  if (diff < 86400) return `vor ${Math.floor(diff / 3600)} Std.`;
  return `vor ${Math.floor(diff / 86400)} Tag${Math.floor(diff / 86400) !== 1 ? 'en' : ''}`;
};

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { currentFarm } = useFarmStore();
  const { toggle: toggleSidebar } = useSidebarStore();
  const { notifications, unreadCount, setNotifications, markRead, markAllRead, remove } = useNotificationStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const isLanding = location.pathname === '/';
  const isDashboard = location.pathname.startsWith('/dashboard');

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const r = await notificationsApi.list();
      setNotifications(r.data);
    } catch { /* silent */ }
  };

  // Fetch on mount and every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Close notification panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setProfileOpen(false);
    setMenuOpen(false);
  };

  const handleNotifClick = async (n: typeof notifications[0]) => {
    if (!n.is_read) {
      markRead(n.id);
      await notificationsApi.markRead(n.id).catch(() => {});
    }
    setNotifOpen(false);
    navigate('/dashboard/todos');
  };

  const handleMarkAllRead = async () => {
    markAllRead();
    await notificationsApi.markAllRead().catch(() => {});
  };

  const handleDeleteNotif = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    remove(id);
    await notificationsApi.delete(id).catch(() => {});
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isLanding ? 'bg-transparent' : 'bg-white border-b border-gray-200 shadow-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <div className="flex items-center gap-3">
            {isAuthenticated && isDashboard && (
              <button onClick={toggleSidebar} className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors" aria-label="Menü öffnen">
                <Menu size={20} />
              </button>
            )}
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
          <div className="hidden md:flex items-center gap-4">
            {!isAuthenticated ? (
              <>
                <a href="#features" className={`text-sm font-medium hover:text-green-500 transition-colors ${isLanding ? 'text-white/90' : 'text-gray-600'}`}>Features</a>
                <a href="#about" className={`text-sm font-medium hover:text-green-500 transition-colors ${isLanding ? 'text-white/90' : 'text-gray-600'}`}>Über uns</a>
                <Link to="/news" className={`text-sm font-medium hover:text-green-500 transition-colors ${isLanding ? 'text-white/90' : 'text-gray-600'}`}>Neuigkeiten</Link>
                <Link to="/hilfe" className={`text-sm font-medium hover:text-green-500 transition-colors ${isLanding ? 'text-white/90' : 'text-gray-600'}`}>Hilfe</Link>
                <Link to="/wuensche" className={`text-sm font-medium hover:text-green-500 transition-colors ${isLanding ? 'text-white/90' : 'text-gray-600'}`}>W&#xFC;nsche</Link>
                <Link to="/supportbox" className={`text-sm font-medium hover:text-green-500 transition-colors ${isLanding ? 'text-white/90' : 'text-gray-600'}`}>Supportbox</Link>
                <Link to="/login" className={`text-sm font-medium hover:text-green-500 transition-colors ${isLanding ? 'text-white/90' : 'text-gray-600'}`}>Anmelden</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-5">Kostenlos starten</Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className={`flex items-center gap-1.5 text-sm font-medium hover:text-green-600 transition-colors ${isDashboard ? 'text-green-600' : 'text-gray-600'}`}>
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
                {currentFarm && (
                  <span className="hidden lg:inline-flex text-sm text-gray-500 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                    🏡 {currentFarm.name}
                  </span>
                )}

                {/* Notification Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) fetchNotifications(); }}
                    className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                    aria-label="Benachrichtigungen"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                          <Bell className="w-4 h-4 text-indigo-500" /> Benachrichtigungen
                        </h3>
                        {unreadCount > 0 && (
                          <button onClick={handleMarkAllRead} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                            Alle lesen
                          </button>
                        )}
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="py-10 text-center text-gray-400">
                            <Bell className="mx-auto mb-2 opacity-20" size={28} />
                            <p className="text-sm">Keine Benachrichtigungen</p>
                          </div>
                        ) : notifications.map(n => (
                          <div
                            key={n.id}
                            onClick={() => handleNotifClick(n)}
                            className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors ${!n.is_read ? 'bg-indigo-50/60' : ''}`}
                          >
                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.is_read ? 'bg-indigo-500' : 'bg-gray-200'}`} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm truncate ${!n.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>{n.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                            </div>
                            <button
                              onClick={(e) => handleDeleteNotif(e, n.id)}
                              className="text-gray-300 hover:text-gray-500 transition-colors p-0.5 flex-shrink-0 mt-0.5"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile dropdown */}
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
              <div className="flex items-center gap-1">
                {/* Mobile bell */}
                <button onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) fetchNotifications(); }} className="relative p-2 rounded-lg text-gray-600">
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center justify-center w-8 h-8 bg-green-600 rounded-full text-white text-sm font-bold">
                  {user?.username?.[0]?.toUpperCase()}
                </button>
              </div>
            ) : (
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-lg">
                {menuOpen ? <X className={isLanding ? 'text-white' : 'text-gray-700'} size={20} /> : <Menu className={isLanding ? 'text-white' : 'text-gray-700'} size={20} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile notification panel */}
      {notifOpen && isAuthenticated && (
        <div className="md:hidden absolute right-4 top-16 mt-1 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden" ref={notifRef}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Benachrichtigungen</h3>
            {unreadCount > 0 && <button onClick={handleMarkAllRead} className="text-xs text-indigo-600 font-medium">Alle lesen</button>}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">Keine Benachrichtigungen</div>
            ) : notifications.map(n => (
              <div key={n.id} onClick={() => handleNotifClick(n)} className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 cursor-pointer ${!n.is_read ? 'bg-indigo-50/60' : ''}`}>
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.is_read ? 'bg-indigo-500' : 'bg-gray-200'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${!n.is_read ? 'font-semibold' : 'font-medium text-gray-700'}`}>{n.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.created_at)}</p>
                </div>
                <button onClick={(e) => handleDeleteNotif(e, n.id)} className="text-gray-300 hover:text-gray-500 p-0.5"><X size={13} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

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
            <Link to="/news" onClick={() => setMenuOpen(false)} className="block py-2.5 px-3 rounded-lg text-gray-700 font-medium hover:bg-gray-50">Neuigkeiten</Link>
            <Link to="/hilfe" onClick={() => setMenuOpen(false)} className="block py-2.5 px-3 rounded-lg text-gray-700 font-medium hover:bg-gray-50">Hilfe &amp; Anleitung</Link>
            <Link to="/wuensche" onClick={() => setMenuOpen(false)} className="block py-2.5 px-3 rounded-lg text-gray-700 font-medium hover:bg-gray-50">W&#xFC;nsche &amp; Anregungen</Link>
            <Link to="/supportbox" onClick={() => setMenuOpen(false)} className="block py-2.5 px-3 rounded-lg text-gray-700 font-medium hover:bg-gray-50">Supportbox</Link>
            <Link to="/login" onClick={() => setMenuOpen(false)} className="block py-2.5 px-3 rounded-lg text-gray-700 font-medium hover:bg-gray-50">Anmelden</Link>
            <Link to="/register" onClick={() => setMenuOpen(false)} className="block py-2.5 px-3 rounded-lg text-green-600 font-medium hover:bg-green-50">Kostenlos starten</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
