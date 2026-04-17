import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useFarmStore } from '../../store/farmStore';
import { useSidebarStore } from '../../store/sidebarStore';
import {
  LayoutDashboard, Tractor, MapPin, TrendingUp, Package,
  PawPrint, Flame, CheckSquare, Users, RotateCcw, ChevronRight,
  FileText, ListChecks, Settings, X
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', group: null },
  { to: '/dashboard/machines', icon: Tractor, label: 'Maschinen', group: 'Betrieb' },
  { to: '/dashboard/fields', icon: MapPin, label: 'Felder', group: 'Betrieb' },
  { to: '/dashboard/crop-rotation', icon: RotateCcw, label: 'Fruchtfolge', group: 'Betrieb' },
  { to: '/dashboard/storage', icon: Package, label: 'Lager', group: 'Betrieb' },
  { to: '/dashboard/animals', icon: PawPrint, label: 'Tiere', group: 'Betrieb' },
  { to: '/dashboard/biogas', icon: Flame, label: 'Biogasanlage', group: 'Betrieb' },
  { to: '/dashboard/finances', icon: TrendingUp, label: 'Finanzen', group: 'Buchhaltung' },
  { to: '/dashboard/invoices', icon: FileText, label: 'Rechnungen', group: 'Buchhaltung' },
  { to: '/dashboard/price-list', icon: ListChecks, label: 'Preisliste', group: 'Buchhaltung' },
  { to: '/dashboard/todos', icon: CheckSquare, label: 'Aufgaben', group: 'Organisation' },
  { to: '/dashboard/members', icon: Users, label: 'Mitglieder', group: 'Organisation' },
  { to: '/dashboard/settings', icon: Settings, label: 'Hof-Einstellungen', group: 'Organisation' },
];

const groups = [null, 'Betrieb', 'Buchhaltung', 'Organisation'];

export default function Sidebar() {
  const { currentFarm } = useFarmStore();
  const { isOpen, close } = useSidebarStore();
  const location = useLocation();

  useEffect(() => { close(); }, [location.pathname]);

  return (
    <>
      {/* Backdrop — mobile only */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={close}
        />
      )}

      <aside className={`
        fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 overflow-y-auto z-40
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <button
          onClick={close}
          className="absolute top-3 right-3 md:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >
          <X size={18} />
        </button>

        {currentFarm && (
          <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">{currentFarm.name[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{currentFarm.name}</p>
                <p className="text-xs text-gray-500">{currentFarm.game_version} • {currentFarm.total_area} ha</p>
              </div>
            </div>
          </div>
        )}

        <nav className="p-3">
          {groups.map(group => {
            const items = navItems.filter(n => n.group === group);
            return (
              <div key={group || 'top'} className="mb-3">
                {group && (
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-1.5">{group}</p>
                )}
                <div className="space-y-0.5">
                  {items.map(({ to, icon: Icon, label }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={to === '/dashboard'}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                          isActive
                            ? 'bg-green-600 text-white shadow-sm'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`} size={17} />
                          <span className="flex-1">{label}</span>
                          {isActive && <ChevronRight size={13} className="text-white/70" />}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
