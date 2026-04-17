import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { farmsApi } from '../services/api';
import { useFarmStore } from '../store/farmStore';
import toast from 'react-hot-toast';
import { Tractor } from 'lucide-react';

export default function NewFarmPage() {
  const navigate = useNavigate();
  const { setCurrentFarm, farms, setFarms } = useFarmStore();
  const [form, setForm] = useState({ name: '', description: '', location: '', game_version: 'LS25', total_area: '0' });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Hofname erforderlich');
    setLoading(true);
    try {
      const res = await farmsApi.create({ ...form, total_area: parseInt(form.total_area) || 0 });
      const newFarm = res.data;
      setFarms([...farms, newFarm]);
      setCurrentFarm(newFarm);
      toast.success(`Hof "${newFarm.name}" erstellt!`);
      navigate('/dashboard');
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Fehler beim Erstellen');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
          <Tractor className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Neuen Hof erstellen</h1>
          <p className="text-gray-500 text-sm">Richte deinen Landwirtschaftsbetrieb ein</p>
        </div>
      </div>
      <div className="card">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Hofname *</label>
              <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Hof Mustermann" />
            </div>
            <div>
              <label className="label">Spielversion *</label>
              <select className="input" value={form.game_version} onChange={e => setForm({...form, game_version: e.target.value})}>
                <option value="LS25">Farming Simulator 25</option>
                <option value="LS22">Farming Simulator 22</option>
              </select>
            </div>
            <div>
              <label className="label">Gesamtfläche (ha)</label>
              <input className="input" type="number" value={form.total_area} onChange={e => setForm({...form, total_area: e.target.value})} placeholder="0" />
            </div>
            <div className="col-span-2">
              <label className="label">Standort / Map</label>
              <input className="input" value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="z.B. Friesland, Elmcreek..." />
            </div>
            <div className="col-span-2">
              <label className="label">Beschreibung</label>
              <textarea className="input h-24 resize-none" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Beschreibe deinen Hof..." />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-3">
              {loading ? 'Erstellen...' : 'Hof erstellen'}
            </button>
            <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary px-6">
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
