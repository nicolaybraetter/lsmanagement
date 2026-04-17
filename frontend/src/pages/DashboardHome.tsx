import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFarmStore } from '../store/farmStore';
import { useAuthStore } from '../store/authStore';
import { farmsApi, machinesApi, fieldsApi, financesApi, animalsApi, storageApi } from '../services/api';
import { Tractor, MapPin, TrendingUp, Package, PawPrint, Flame, CheckSquare, Users, Plus, ArrowRight } from 'lucide-react';

interface Stats {
  machines: number;
  fields: number;
  animals: number;
  storage: number;
  balance: number;
  totalArea: number;
}

export default function DashboardHome() {
  const { currentFarm, farms, setFarms, setCurrentFarm } = useFarmStore();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats>({ machines: 0, fields: 0, animals: 0, storage: 0, balance: 0, totalArea: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    farmsApi.list().then(r => {
      setFarms(r.data);
      if (!currentFarm && r.data.length > 0) setCurrentFarm(r.data[0]);
    });
  }, []);

  useEffect(() => {
    if (!currentFarm) return;
    setLoading(true);
    Promise.all([
      machinesApi.list(currentFarm.id),
      fieldsApi.list(currentFarm.id),
      financesApi.summary(currentFarm.id),
      animalsApi.listStables(currentFarm.id),
      storageApi.list(currentFarm.id),
    ]).then(([m, f, fin, stables, storage]) => {
      const totalAnimals = stables.data.reduce((acc: number, s: any) => acc + (s.animals?.length || 0), 0);
      setStats({
        machines: m.data.length,
        fields: f.data.length,
        animals: totalAnimals,
        storage: storage.data.length,
        balance: fin.data.balance || 0,
        totalArea: f.data.reduce((acc: number, field: any) => acc + field.area_ha, 0),
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [currentFarm]);

  if (!currentFarm) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="text-6xl mb-6">🚜</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Willkommen, {user?.username}!</h2>
        <p className="text-gray-500 mb-8">Du hast noch keinen Hof. Erstelle jetzt deinen ersten Betrieb.</p>
        <Link to="/dashboard/new-farm" className="btn-primary inline-flex items-center gap-2 py-3 px-6 text-base">
          <Plus className="w-5 h-5" />
          Ersten Hof erstellen
        </Link>
        {farms.length > 0 && (
          <div className="mt-10">
            <p className="text-gray-600 mb-4 font-medium">Oder wähle einen bestehenden Hof:</p>
            <div className="grid gap-3">
              {farms.map(farm => (
                <button key={farm.id} onClick={() => setCurrentFarm(farm)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-green-400 hover:shadow-sm transition-all flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{farm.name}</p>
                    <p className="text-sm text-gray-500">{farm.game_version} · {farm.total_area} ha</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const statCards = [
    { label: 'Maschinen', value: stats.machines, icon: Tractor, color: 'bg-blue-500', link: '/dashboard/machines', unit: 'Stück' },
    { label: 'Felder', value: `${stats.totalArea.toFixed(1)} ha`, icon: MapPin, color: 'bg-green-500', link: '/dashboard/fields', unit: `${stats.fields} Felder` },
    { label: 'Bilanz', value: `${stats.balance >= 0 ? '+' : ''}${stats.balance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}`, icon: TrendingUp, color: stats.balance >= 0 ? 'bg-emerald-500' : 'bg-red-500', link: '/dashboard/finances', unit: 'Gesamt' },
    { label: 'Lagerplätze', value: stats.storage, icon: Package, color: 'bg-amber-500', link: '/dashboard/storage', unit: 'Positionen' },
  ];

  const quickLinks = [
    { to: '/dashboard/machines', icon: Tractor, label: 'Maschinen', desc: 'Fuhrpark verwalten' },
    { to: '/dashboard/fields', icon: MapPin, label: 'Felder', desc: 'Feldstatus einsehen' },
    { to: '/dashboard/finances', icon: TrendingUp, label: 'Finanzen', desc: 'Buchungen erfassen' },
    { to: '/dashboard/storage', icon: Package, label: 'Lager', desc: 'Bestände prüfen' },
    { to: '/dashboard/animals', icon: PawPrint, label: 'Tiere', desc: 'Ställe verwalten' },
    { to: '/dashboard/biogas', icon: Flame, label: 'Biogas', desc: 'Anlage überwachen' },
    { to: '/dashboard/todos', icon: CheckSquare, label: 'Aufgaben', desc: 'Board öffnen' },
    { to: '/dashboard/members', icon: Users, label: 'Team', desc: 'Mitglieder einladen' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Guten Tag, {user?.full_name || user?.username}! 👋</h1>
          <p className="text-gray-500 text-sm mt-0.5">Hof: {currentFarm.name} · {currentFarm.game_version}</p>
        </div>
        <Link to="/dashboard/new-farm" className="btn-secondary text-sm flex items-center gap-1.5">
          <Plus size={16} /> Neuer Hof
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, link, unit }) => (
          <Link key={label} to={link} className="card hover:shadow-md hover:border-green-200 transition-all group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{unit}</p>
              </div>
              <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Farm info + quick links */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="font-bold text-gray-900 text-lg mb-4">Schnellzugriff</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickLinks.map(({ to, icon: Icon, label, desc }) => (
                <Link key={to} to={to} className="flex flex-col items-center text-center p-4 rounded-xl border border-gray-100 hover:border-green-300 hover:bg-green-50 transition-all group">
                  <Icon className="w-7 h-7 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-semibold text-gray-900">{label}</span>
                  <span className="text-xs text-gray-500 mt-0.5">{desc}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="font-bold text-gray-900 text-lg mb-4">Hof-Info</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Name</span>
              <span className="font-medium text-gray-900">{currentFarm.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Version</span>
              <span className="font-medium text-gray-900">{currentFarm.game_version}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Gesamtfläche</span>
              <span className="font-medium text-gray-900">{currentFarm.total_area} ha</span>
            </div>
            {currentFarm.location && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Standort</span>
                <span className="font-medium text-gray-900 truncate max-w-[120px]">{currentFarm.location}</span>
              </div>
            )}
            {currentFarm.description && (
              <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">{currentFarm.description}</p>
            )}
          </div>
          <Link to="/dashboard/settings" className="mt-4 block text-center text-sm text-green-600 hover:text-green-700 font-medium">
            Hof bearbeiten →
          </Link>
        </div>
      </div>
    </div>
  );
}
