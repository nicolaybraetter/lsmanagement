import { useEffect, useState } from 'react';
import { useFarmStore } from '../store/farmStore';
import { biogasApi } from '../services/api';
import toast from 'react-hot-toast';
import { Flame, Plus, X, Edit2, Zap } from 'lucide-react';

const FEED_TYPES = ['Maissilage','Grassilage','GPS Silage','Gülle','Festmist','Zuckerrübenblatt','Rübensilage','Getreideschrot','Sonstige'];

export default function BiogasPage() {
  const { currentFarm } = useFarmStore();
  const [plant, setPlant] = useState<any>(null);
  const [feedEntries, setFeedEntries] = useState<any[]>([]);
  const [showPlantForm, setShowPlantForm] = useState(false);
  const [plantForm, setPlantForm] = useState({ name: '', capacity_kw: '', daily_gas_production_m3: '', annual_energy_kwh: '', installation_date: '', last_maintenance: '', feed_mix_notes: '', notes: '' });
  const [showFeedForm, setShowFeedForm] = useState(false);
  const [feedForm, setFeedForm] = useState({ feed_type: 'Maissilage', quantity_t: '', date: new Date().toISOString().split('T')[0], gas_yield_m3: '', notes: '' });

  useEffect(() => { if (currentFarm) loadPlant(); }, [currentFarm]);

  const loadPlant = async () => {
    if (!currentFarm) return;
    try {
      const r = await biogasApi.get(currentFarm.id);
      setPlant(r.data);
      const f = await biogasApi.listFeed(currentFarm.id, r.data.id);
      setFeedEntries(f.data);
    } catch { setPlant(null); }
  };

  const savePlant = async () => {
    if (!currentFarm || !plantForm.name.trim()) return toast.error('Name erforderlich');
    try {
      const payload = { ...plantForm, capacity_kw: plantForm.capacity_kw ? parseFloat(plantForm.capacity_kw) : null, daily_gas_production_m3: plantForm.daily_gas_production_m3 ? parseFloat(plantForm.daily_gas_production_m3) : null, annual_energy_kwh: plantForm.annual_energy_kwh ? parseFloat(plantForm.annual_energy_kwh) : null };
      if (plant) await biogasApi.update(currentFarm.id, plant.id, payload);
      else await biogasApi.create(currentFarm.id, payload);
      toast.success('Biogasanlage gespeichert'); setShowPlantForm(false); loadPlant();
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Fehler'); }
  };

  const saveFeed = async () => {
    if (!currentFarm || !plant || !feedForm.quantity_t) return toast.error('Menge erforderlich');
    try {
      await biogasApi.addFeed(currentFarm.id, plant.id, { ...feedForm, plant_id: plant.id, quantity_t: parseFloat(feedForm.quantity_t), gas_yield_m3: feedForm.gas_yield_m3 ? parseFloat(feedForm.gas_yield_m3) : null, date: new Date(feedForm.date).toISOString() });
      toast.success('Einspeisung eingetragen'); setShowFeedForm(false); setFeedForm({ feed_type: 'Maissilage', quantity_t: '', date: new Date().toISOString().split('T')[0], gas_yield_m3: '', notes: '' }); loadPlant();
    } catch (e: any) { toast.error('Fehler'); }
  };

  const openEditPlant = () => {
    if (plant) setPlantForm({ name: plant.name, capacity_kw: plant.capacity_kw||'', daily_gas_production_m3: plant.daily_gas_production_m3||'', annual_energy_kwh: plant.annual_energy_kwh||'', installation_date: plant.installation_date||'', last_maintenance: plant.last_maintenance||'', feed_mix_notes: plant.feed_mix_notes||'', notes: plant.notes||'' });
    setShowPlantForm(true);
  };

  const totalFeedMonth = feedEntries.filter(e => new Date(e.date).getMonth() === new Date().getMonth()).reduce((a, e) => a + e.quantity_t, 0);
  const totalGasMonth = feedEntries.filter(e => new Date(e.date).getMonth() === new Date().getMonth()).reduce((a, e) => a + (e.gas_yield_m3 || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center"><Flame className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Biogasanlage</h1><p className="text-gray-500 text-sm">Überwachung & Einspeisung</p></div>
        </div>
        {plant ? (
          <div className="flex gap-2">
            <button onClick={openEditPlant} className="btn-secondary flex items-center gap-2 text-sm"><Edit2 size={14} /> Bearbeiten</button>
            <button onClick={() => setShowFeedForm(true)} className="btn-primary flex items-center gap-2 text-sm"><Plus size={14} /> Einspeisung</button>
          </div>
        ) : (
          <button onClick={() => { setPlantForm({ name: '', capacity_kw: '', daily_gas_production_m3: '', annual_energy_kwh: '', installation_date: '', last_maintenance: '', feed_mix_notes: '', notes: '' }); setShowPlantForm(true); }} className="btn-primary flex items-center gap-2"><Plus size={16} /> Anlage einrichten</button>
        )}
      </div>

      {!plant ? (
        <div className="card text-center py-16">
          <Flame className="mx-auto mb-4 text-red-300" size={48} />
          <h3 className="text-lg font-bold text-gray-700 mb-2">Keine Biogasanlage</h3>
          <p className="text-gray-500 mb-6">Richte deine Biogasanlage ein, um Einspeisung und Ertrag zu tracken.</p>
          <button onClick={() => setShowPlantForm(true)} className="btn-primary inline-flex items-center gap-2"><Plus size={16} /> Biogasanlage einrichten</button>
        </div>
      ) : (
        <>
          {/* Plant info */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card border-l-4 border-l-red-500"><p className="text-sm text-gray-500">Leistung</p><p className="text-2xl font-bold text-gray-900">{plant.capacity_kw || '—'} <span className="text-base font-normal text-gray-500">kW</span></p></div>
            <div className="card border-l-4 border-l-amber-500"><p className="text-sm text-gray-500">Gasproduktion/Tag</p><p className="text-2xl font-bold text-gray-900">{plant.daily_gas_production_m3 || '—'} <span className="text-base font-normal text-gray-500">m³</span></p></div>
            <div className="card border-l-4 border-l-green-500"><p className="text-sm text-gray-500">Einspeisung (Monat)</p><p className="text-2xl font-bold text-gray-900">{totalFeedMonth.toFixed(1)} <span className="text-base font-normal text-gray-500">t</span></p></div>
            <div className="card border-l-4 border-l-blue-500"><p className="text-sm text-gray-500">Gas (Monat)</p><p className="text-2xl font-bold text-gray-900">{totalGasMonth.toFixed(0)} <span className="text-base font-normal text-gray-500">m³</span></p></div>
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            <div className="card lg:col-span-2">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Flame size={16} className="text-red-500" /> Einspeisung</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-gray-500 border-b border-gray-200 text-xs"><th className="text-left py-2 font-medium">Datum</th><th className="text-left py-2 font-medium">Substrat</th><th className="text-right py-2 font-medium">Menge (t)</th><th className="text-right py-2 font-medium">Gas (m³)</th></tr></thead>
                  <tbody>{feedEntries.map(e => (
                    <tr key={e.id} className="border-b border-gray-50"><td className="py-2 text-gray-500 text-xs">{new Date(e.date).toLocaleDateString('de-DE')}</td><td className="py-2 font-medium">{e.feed_type}</td><td className="py-2 text-right">{e.quantity_t.toFixed(1)}</td><td className="py-2 text-right text-blue-600">{e.gas_yield_m3 ? e.gas_yield_m3.toFixed(0) : '—'}</td></tr>
                  ))}</tbody>
                </table>
                {feedEntries.length === 0 && <p className="text-center py-8 text-gray-400">Noch keine Einspeisung</p>}
              </div>
            </div>

            <div className="card">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Zap size={16} className="text-amber-500" /> Anlage Details</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">{plant.name}</span></div>
                {plant.annual_energy_kwh && <div className="flex justify-between"><span className="text-gray-500">Jahresertrag</span><span className="font-medium">{plant.annual_energy_kwh.toLocaleString('de-DE')} kWh</span></div>}
                {plant.installation_date && <div className="flex justify-between"><span className="text-gray-500">Inbetriebnahme</span><span className="font-medium">{plant.installation_date}</span></div>}
                {plant.last_maintenance && <div className="flex justify-between"><span className="text-gray-500">Letzte Wartung</span><span className="font-medium">{plant.last_maintenance}</span></div>}
                {plant.feed_mix_notes && <div className="pt-3 border-t border-gray-100"><p className="text-gray-500 text-xs mb-1">Substratmix</p><p className="text-gray-700">{plant.feed_mix_notes}</p></div>}
              </div>
            </div>
          </div>
        </>
      )}

      {showPlantForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b"><h2 className="font-bold text-lg">{plant ? 'Anlage bearbeiten' : 'Biogasanlage einrichten'}</h2><button onClick={() => setShowPlantForm(false)}><X size={20} /></button></div>
            <div className="p-6 space-y-4">
              <div><label className="label">Name *</label><input className="input" value={plantForm.name} onChange={e => setPlantForm({...plantForm, name: e.target.value})} placeholder="z.B. Biogasanlage Hof Muster" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Leistung (kW)</label><input className="input" type="number" value={plantForm.capacity_kw} onChange={e => setPlantForm({...plantForm, capacity_kw: e.target.value})} /></div>
                <div><label className="label">Gasproduktion (m³/Tag)</label><input className="input" type="number" value={plantForm.daily_gas_production_m3} onChange={e => setPlantForm({...plantForm, daily_gas_production_m3: e.target.value})} /></div>
                <div><label className="label">Jahresertrag (kWh)</label><input className="input" type="number" value={plantForm.annual_energy_kwh} onChange={e => setPlantForm({...plantForm, annual_energy_kwh: e.target.value})} /></div>
                <div><label className="label">Inbetriebnahme</label><input className="input" value={plantForm.installation_date} onChange={e => setPlantForm({...plantForm, installation_date: e.target.value})} placeholder="01.01.2020" /></div>
                <div><label className="label">Letzte Wartung</label><input className="input" value={plantForm.last_maintenance} onChange={e => setPlantForm({...plantForm, last_maintenance: e.target.value})} /></div>
              </div>
              <div><label className="label">Substratmix</label><textarea className="input h-20 resize-none" value={plantForm.feed_mix_notes} onChange={e => setPlantForm({...plantForm, feed_mix_notes: e.target.value})} placeholder="z.B. 60% Maissilage, 30% Grassilage, 10% Gülle" /></div>
              <div><label className="label">Notizen</label><textarea className="input h-16 resize-none" value={plantForm.notes} onChange={e => setPlantForm({...plantForm, notes: e.target.value})} /></div>
            </div>
            <div className="flex gap-3 p-6 border-t"><button onClick={savePlant} className="btn-primary flex-1">Speichern</button><button onClick={() => setShowPlantForm(false)} className="btn-secondary px-6">Abbrechen</button></div>
          </div>
        </div>
      )}

      {showFeedForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b"><h2 className="font-bold text-lg">Einspeisung eintragen</h2><button onClick={() => setShowFeedForm(false)}><X size={20} /></button></div>
            <div className="p-6 space-y-4">
              <div><label className="label">Substrat *</label><select className="input" value={feedForm.feed_type} onChange={e => setFeedForm({...feedForm, feed_type: e.target.value})}>{FEED_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Menge (t) *</label><input className="input" type="number" value={feedForm.quantity_t} onChange={e => setFeedForm({...feedForm, quantity_t: e.target.value})} /></div>
                <div><label className="label">Datum *</label><input className="input" type="date" value={feedForm.date} onChange={e => setFeedForm({...feedForm, date: e.target.value})} /></div>
              </div>
              <div><label className="label">Gasertrag (m³)</label><input className="input" type="number" value={feedForm.gas_yield_m3} onChange={e => setFeedForm({...feedForm, gas_yield_m3: e.target.value})} /></div>
              <div><label className="label">Notizen</label><textarea className="input h-16 resize-none" value={feedForm.notes} onChange={e => setFeedForm({...feedForm, notes: e.target.value})} /></div>
            </div>
            <div className="flex gap-3 p-6 border-t"><button onClick={saveFeed} className="btn-primary flex-1">Eintragen</button><button onClick={() => setShowFeedForm(false)} className="btn-secondary px-6">Abbrechen</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
