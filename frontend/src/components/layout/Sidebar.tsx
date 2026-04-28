import { useEffect, useState } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { useFarmStore } from '../../store/farmStore';
import { useSidebarStore } from '../../store/sidebarStore';
import { invoicesApi } from '../../services/api';
import {
  LayoutDashboard, Tractor, MapPin, TrendingUp, Package,
  PawPrint, Flame, CheckSquare, Users, RotateCcw, ChevronRight,
  FileText, ListChecks, Settings, X, Plus,
} from 'lucide-react';

const farmNavItems = [
  { to: '/dashboard/machines', icon: Tractor, label: 'Fuhrpark', group: 'Betrieb' },
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

const groups = ['Betrieb', 'Buchhaltung', 'Organisation'];

function NavItem({ to, icon: Icon, label, end = false, badge }: { to: string; icon: any; label: string; end?: boolean; badge?: number }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
          isActive ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`} size={17} />
          <span className="flex-1">{label}</span>
          {badge != null && badge > 0 && (
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${isActive ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}`}>
              {badge > 99 ? '99+' : badge}
            </span>
          )}
          {isActive && !badge && <ChevronRight size={13} className="text-white/70" />}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const { currentFarm } = useFarmStore();
  const { isOpen, close } = useSidebarStore();
  const location = useLocation();
  const [invoiceBadge, setInvoiceBadge] = useState(0);

  useEffect(() => { close(); }, [location.pathname]);

  useEffect(() => {
    if (!currentFarm) { setInvoiceBadge(0); return; }
    invoicesApi.pendingCount(currentFarm.id)
      .then(r => setInvoiceBadge(r.data.count ?? 0))
      .catch(() => setInvoiceBadge(0));
  }, [currentFarm, location.pathname]);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={close} />
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

        {currentFarm ? (
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
        ) : (
          <div className="px-4 py-4 border-b border-gray-100 bg-amber-50">
            <p className="text-xs text-amber-700 font-medium">Kein Hof ausgewählt</p>
            <p className="text-xs text-amber-600 mt-0.5">Erstelle oder tritt einem Hof bei</p>
          </div>
        )}

        <nav className="p-3">
          {/* Dashboard always visible */}
          <div className="mb-3">
            <div className="space-y-0.5">
              <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" end />
            </div>
          </div>

          {currentFarm ? (
            /* Full navigation for farm members */
            groups.map(group => {
              const items = farmNavItems.filter(n => n.group === group);
              return (
                <div key={group} className="mb-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-1.5">{group}</p>
                  <div className="space-y-0.5">
                    {items.map(({ to, icon, label }) => (
                      <NavItem key={to} to={to} icon={icon} label={label} badge={to === '/dashboard/invoices' ? invoiceBadge : undefined} />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            /* Restricted view: only offer farm creation */
            <div className="mt-2 px-3">
              <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                Um alle Bereiche zu nutzen, erstelle einen Hof oder warte auf eine Einladung.
              </p>
              <Link
                to="/dashboard/new-farm"
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition w-full justify-center"
              >
                <Plus size={15} /> Hof erstellen
              </Link>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}
