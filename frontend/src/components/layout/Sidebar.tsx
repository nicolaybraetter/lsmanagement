import { NavLink } from 'react-router-dom';
import { useFarmStore } from '../../store/farmStore';
import {
  LayoutDashboard, Tractor, MapPin, TrendingUp, Package,
  PawPrint, Flame, CheckSquare, Users, RotateCcw, ChevronRight
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/machines', icon: Tractor, label: 'Maschinen' },
  { to: '/dashboard/fields', icon: MapPin, label: 'Felder' },
  { to: '/dashboard/crop-rotation', icon: RotateCcw, label: 'Fruchtfolge' },
  { to: '/dashboard/finances', icon: TrendingUp, label: 'Finanzen' },
  { to: '/dashboard/storage', icon: Package, label: 'Lager' },
  { to: '/dashboard/animals', icon: PawPrint, label: 'Tiere' },
  { to: '/dashboard/biogas', icon: Flame, label: 'Biogasanlage' },
  { to: '/dashboard/todos', icon: CheckSquare, label: 'Aufgaben' },
  { to: '/dashboard/members', icon: Users, label: 'Mitglieder' },
];

export default function Sidebar() {
  const { currentFarm } = useFarmStore();

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 overflow-y-auto z-40">
      {currentFarm && (
        <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">{currentFarm.name[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{currentFarm.name}</p>
              <p className="text-xs text-gray-500">{currentFarm.game_version} • {currentFarm.total_area} ha</p>
            </div>
          </div>
        </div>
      )}
      <nav className="p-3 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
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
                <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`} size={18} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={14} className="text-white/70" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
