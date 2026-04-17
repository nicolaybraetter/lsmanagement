import { useEffect, useState } from 'react';
import { useFarmStore } from '../store/farmStore';
import { machinesApi } from '../services/api';
import toast from 'react-hot-toast';
import { Tractor, Plus, Edit2, Trash2, X, RotateCcw } from 'lucide-react';

const CATEGORIES = ['Traktor','Mähdrescher','Sämaschine','Feldspritze','Düngerstreuer','Anhänger','Lader','Mähwerk','Ballenpresse','Pflug','Grubber','Sonstiges'];
const STATUSES = ['verfügbar','im Einsatz','Wartung','verliehen','defekt'];
const STATUS_COLORS: Record<string, string> = {
  'verfügbar': 'bg-green-100 text-green-700 border-green-200',
  'im Einsatz': 'bg-blue-100 text-blue-700 border-blue-200',
  'Wartung': 'bg-amber-100 text-amber-700 border-amber-200',
  'verliehen': 'bg-purple-100 text-purple-700 border-purple-200',
  'defekt': 'bg-red-100 text-red-700 border-red-200',
};

const EMPTY_FORM = { name: '', brand: '', model: '', year: '', category: 'Traktor', status: 'verfügbar', purchase_price: '', current_value: '', operating_hours: '', hourly_rental_rate: '', daily_rental_rate: '', is_available_for_rental: false, notes: '' };

export default function MachinesPage() {
  const { currentFarm } = useFarmStore();
  const [machines, setMachines] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [filter, setFilter] = useState('');
  const [rentalMachine, setRentalMachine] = useState<any>(null);
  const [rental, setRental] = useState({ renter_name: '', renter_farm: '', start_date: '', total_hours: '', total_cost: '', notes: '' });

  useEffect(() => { if (currentFarm) load(); }, [currentFarm]);

  const load = async () => {
    if (!currentFarm) return;
    const r = await machinesApi.list(currentFarm.id);
    setMachines(r.data);
  };

  const save = async () => {
    if (!currentFarm || !form.name.trim()) return toast.error('Name erforderlich');
    try {
      const payload = { ...form, year: form.year ? parseInt(form.year) : null, purchase_price: parseFloat(form.purchase_price)||0, current_value: parseFloat(form.current_value)||0, operating_hours: parseFloat(form.operating_hours)||0, hourly_rental_rate: parseFloat(form.hourly_rental_rate)||0, daily_rental_rate: parseFloat(form.daily_rental_rate)||0 };
      if (editId) await machinesApi.update(currentFarm.id, editId, payload);
      else await machinesApi.create(currentFarm.id, payload);
      toast.success(editId ? 'Maschine aktualisiert' : 'Maschine hinzugefügt');
      setShowForm(false); setEditId(null); setForm(EMPTY_FORM); load();
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Fehler'); }
  };

  const del = async (id: number) => {
    if (!currentFarm || !confirm('Maschine wirklich löschen?')) return;
    await machinesApi.delete(currentFarm.id, id);
    toast.success('Gelöscht'); load();
  };

  const startEdit = (m: any) => { setForm({ ...m, year: m.year||'', purchase_price: m.purchase_price||'', current_value: m.current_value||'', operating_hours: m.operating_hours||'', hourly_rental_rate: m.hourly_rental_rate||'', daily_rental_rate: m.daily_rental_rate||'' }); setEditId(m.id); setShowForm(true); };

  const saveRental = async () => {
    if (!currentFarm || !rentalMachine || !rental.renter_name) return toast.error('Mieter erforderlich');
    try {
      await machinesApi.createRental(currentFarm.id, rentalMachine.id, { ...rental, start_date: new Date(rental.start_date).toISOString(), total_hours: parseFloat(rental.total_hours)||null, total_cost: parseFloat(rental.total_cost)||null });
      toast.success('Verleih eingetragen'); setRentalMachine(null); setRental({ renter_name: '', renter_farm: '', start_date: '', total_hours: '', total_cost: '', notes: '' }); load();
    } catch (e: any) { toast.error('Fehler'); }
  };

  const filtered = machines.filter(m => m.name.toLowerCase().includes(filter.toLowerCase()) || m.brand?.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center"><Tractor className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Maschinen</h1><p className="text-gray-500 text-sm">{machines.length} Maschinen · Fuhrpark</p></div>
        </div>
        <button onClick={() => { setEditId(null); setForm(EMPTY_FORM); setShowForm(true); }} className="btn-primary flex items-center gap-2"><Plus size={16} /> Maschine</button>
      </div>

      <input className="input max-w-sm" placeholder="Suchen..." value={filter} onChange={e => setFilter(e.target.value)} />

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(m => (
          <div key={m.id} className="card hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-900">{m.name}</h3>
                <p className="text-sm text-gray-500">{m.brand} {m.model} {m.year && `(${m.year})`}</p>
              </div>
              <span className={`badge border text-xs ${STATUS_COLORS[m.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>{m.status}</span>
            </div>
            <div className="text-xs text-gray-500 space-y-1 mb-4">
              <div className="flex justify-between"><span>Kategorie</span><span className="font-medium text-gray-700">{m.category}</span></div>
              <div className="flex justify-between"><span>Betriebsstunden</span><span className="font-medium text-gray-700">{m.operating_hours.toFixed(0)} h</span></div>
              {m.purchase_price > 0 && <div className="flex justify-between"><span>Kaufpreis</span><span className="font-medium text-gray-700">{m.purchase_price.toLocaleString('de-DE', {style:'currency',currency:'EUR'})}</span></div>}
              {m.is_available_for_rental && <div className="flex justify-between"><span>Verleih/h</span><span className="font-medium text-green-600">{m.hourly_rental_rate.toLocaleString('de-DE', {style:'currency',currency:'EUR'})}</span></div>}
            </div>
            <div className="flex gap-2 pt-3 border-t border-gray-100">
              {m.is_available_for_rental && <button onClick={() => setRentalMachine(m)} className="flex-1 text-xs text-purple-600 hover:bg-purple-50 py-1.5 rounded-lg border border-purple-200 flex items-center justify-center gap-1"><RotateCcw size={12} /> Verleihen</button>}
              <button onClick={() => startEdit(m)} className="flex-1 text-xs text-blue-600 hover:bg-blue-50 py-1.5 rounded-lg border border-blue-200 flex items-center justify-center gap-1"><Edit2 size={12} /> Bearbeiten</button>
              <button onClick={() => del(m.id)} className="text-xs text-red-600 hover:bg-red-50 py-1.5 px-3 rounded-lg border border-red-200"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="col-span-3 text-center py-16 text-gray-400"><Tractor className="mx-auto mb-3 opacity-30" size={40} /><p>Keine Maschinen vorhanden</p></div>}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b"><h2 className="font-bold text-lg">{editId ? 'Maschine bearbeiten' : 'Neue Maschine'}</h2><button onClick={() => setShowForm(false)}><X size={20} /></button></div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="label">Name *</label><input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="z.B. John Deere 6R 185" /></div>
                <div><label className="label">Marke</label><input className="input" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} placeholder="John Deere" /></div>
                <div><label className="label">Modell</label><input className="input" value={form.model} onChange={e => setForm({...form, model: e.target.value})} placeholder="6R 185" /></div>
                <div><label className="label">Baujahr</label><input className="input" type="number" value={form.year} onChange={e => setForm({...form, year: e.target.value})} placeholder="2023" /></div>
                <div><label className="label">Kategorie</label><select className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
                <div><label className="label">Status</label><select className="input" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
                <div><label className="label">Betriebsstunden</label><input className="input" type="number" value={form.operating_hours} onChange={e => setForm({...form, operating_hours: e.target.value})} /></div>
                <div><label className="label">Kaufpreis (€)</label><input className="input" type="number" value={form.purchase_price} onChange={e => setForm({...form, purchase_price: e.target.value})} /></div>
                <div><label className="label">Aktueller Wert (€)</label><input className="input" type="number" value={form.current_value} onChange={e => setForm({...form, current_value: e.target.value})} /></div>
              </div>
              <div className="flex items-center gap-2"><input type="checkbox" id="rental" checked={form.is_available_for_rental} onChange={e => setForm({...form, is_available_for_rental: e.target.checked})} className="rounded" /><label htmlFor="rental" className="text-sm font-medium">Für Verleih verfügbar</label></div>
              {form.is_available_for_rental && <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Stundenpreis (€/h)</label><input className="input" type="number" value={form.hourly_rental_rate} onChange={e => setForm({...form, hourly_rental_rate: e.target.value})} /></div>
                <div><label className="label">Tagespreis (€/Tag)</label><input className="input" type="number" value={form.daily_rental_rate} onChange={e => setForm({...form, daily_rental_rate: e.target.value})} /></div>
              </div>}
              <div><label className="label">Notizen</label><textarea className="input h-20 resize-none" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
            </div>
            <div className="flex gap-3 p-6 border-t"><button onClick={save} className="btn-primary flex-1">{editId ? 'Speichern' : 'Hinzufügen'}</button><button onClick={() => setShowForm(false)} className="btn-secondary px-6">Abbrechen</button></div>
          </div>
        </div>
      )}

      {/* Rental Modal */}
      {rentalMachine && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b"><h2 className="font-bold text-lg">Verleih: {rentalMachine.name}</h2><button onClick={() => setRentalMachine(null)}><X size={20} /></button></div>
            <div className="p-6 space-y-4">
              <div><label className="label">Mieter *</label><input className="input" value={rental.renter_name} onChange={e => setRental({...rental, renter_name: e.target.value})} placeholder="Name des Mieters" /></div>
              <div><label className="label">Betrieb des Mieters</label><input className="input" value={rental.renter_farm} onChange={e => setRental({...rental, renter_farm: e.target.value})} /></div>
              <div><label className="label">Startdatum *</label><input className="input" type="datetime-local" value={rental.start_date} onChange={e => setRental({...rental, start_date: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Stunden</label><input className="input" type="number" value={rental.total_hours} onChange={e => setRental({...rental, total_hours: e.target.value})} /></div>
                <div><label className="label">Gesamtkosten (€)</label><input className="input" type="number" value={rental.total_cost} onChange={e => setRental({...rental, total_cost: e.target.value})} /></div>
              </div>
              <div><label className="label">Notizen</label><textarea className="input h-16 resize-none" value={rental.notes} onChange={e => setRental({...rental, notes: e.target.value})} /></div>
            </div>
            <div className="flex gap-3 p-6 border-t"><button onClick={saveRental} className="btn-primary flex-1">Verleih eintragen</button><button onClick={() => setRentalMachine(null)} className="btn-secondary px-6">Abbrechen</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
