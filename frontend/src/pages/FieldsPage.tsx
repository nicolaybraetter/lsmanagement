import { useEffect, useState } from 'react';
import { useFarmStore } from '../store/farmStore';
import { fieldsApi } from '../services/api';
import toast from 'react-hot-toast';
import { MapPin, Plus, Edit2, Trash2, X } from 'lucide-react';

const STATUSES = ['Brache','vorbereitet','gesät','wächst','gedüngt','erntereif','geerntet'];
const CROPS_LS22 = ['Gras','Klee','Silomais','Mais','Weizen','Gerste','Hafer','Roggen','Triticale','Sorghum','Raps','Sonnenblume','Soja','Zuckerrübe','Kartoffel','Zwiebel','Karotten','Pastinaken','Rote Bete','Baumwolle','Zuckerrohr','Weintrauben','Oliven','Pappel','Ölrettich','Sonstiges'];
const CROPS_LS25_EXTRA = ['Spinat','Erbsen','Grüne Bohnen','Reis','Langkornreis'];
const STATUS_COLORS: Record<string, string> = {
  'Brache': 'bg-gray-100 text-gray-600 border-gray-200',
  'vorbereitet': 'bg-amber-100 text-amber-700 border-amber-200',
  'gesät': 'bg-lime-100 text-lime-700 border-lime-200',
  'wächst': 'bg-green-100 text-green-700 border-green-200',
  'gedüngt': 'bg-teal-100 text-teal-700 border-teal-200',
  'erntereif': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'geerntet': 'bg-orange-100 text-orange-700 border-orange-200',
};
const CROP_EMOJIS: Record<string, string> = { 'Gras':'🌿','Klee':'🍀','Silomais':'🌽','Mais':'🌽','Weizen':'🌾','Gerste':'🌾','Hafer':'🌾','Roggen':'🌾','Triticale':'🌾','Sorghum':'🌿','Raps':'🌼','Sonnenblume':'🌻','Soja':'🫘','Zuckerrübe':'🌱','Kartoffel':'🥔','Zwiebel':'🧅','Karotten':'🥕','Pastinaken':'🥕','Rote Bete':'🌱','Baumwolle':'🌸','Zuckerrohr':'🎋','Weintrauben':'🍇','Oliven':'🫒','Pappel':'🌳','Ölrettich':'🌱','Spinat':'🥬','Erbsen':'🫛','Grüne Bohnen':'🫘','Reis':'🌾','Langkornreis':'🌾','Sonstiges':'🌱' };

const EMPTY = { field_number: '', name: '', area_ha: '', status: 'Brache', current_crop: '', soil_type: '', location_notes: '', is_owned: true, purchase_price: '', lease_price_per_ha: '' };

export default function FieldsPage() {
  const { currentFarm } = useFarmStore();
  const [fields, setFields] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [filter, setFilter] = useState('');

  useEffect(() => { if (currentFarm) load(); }, [currentFarm]);

  const load = async () => {
    if (!currentFarm) return;
    const r = await fieldsApi.list(currentFarm.id);
    setFields(r.data);
  };

  const save = async () => {
    if (!currentFarm || !form.field_number.trim() || !form.area_ha) return toast.error('Feldnummer und Fläche erforderlich');
    try {
      const payload = { ...form, area_ha: parseFloat(form.area_ha), purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : null, lease_price_per_ha: form.lease_price_per_ha ? parseFloat(form.lease_price_per_ha) : null, current_crop: form.current_crop || null };
      if (editId) await fieldsApi.update(currentFarm.id, editId, payload);
      else await fieldsApi.create(currentFarm.id, payload);
      toast.success(editId ? 'Feld aktualisiert' : 'Feld hinzugefügt');
      setShowForm(false); setEditId(null); setForm(EMPTY); load();
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Fehler'); }
  };

  const del = async (id: number) => {
    if (!currentFarm || !confirm('Feld wirklich löschen?')) return;
    await fieldsApi.delete(currentFarm.id, id);
    toast.success('Gelöscht'); load();
  };

  const startEdit = (f: any) => { setForm({ ...f, area_ha: f.area_ha, current_crop: f.current_crop||'', purchase_price: f.purchase_price||'', lease_price_per_ha: f.lease_price_per_ha||'' }); setEditId(f.id); setShowForm(true); };

  const filtered = fields.filter(f => f.field_number.toLowerCase().includes(filter.toLowerCase()) || f.name?.toLowerCase().includes(filter.toLowerCase()));
  const totalArea = fields.reduce((a, f) => a + f.area_ha, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center"><MapPin className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Feldverwaltung</h1><p className="text-gray-500 text-sm">{fields.length} Felder · {totalArea.toFixed(1)} ha gesamt</p></div>
        </div>
        <button onClick={() => { setEditId(null); setForm(EMPTY); setShowForm(true); }} className="btn-primary flex items-center gap-2"><Plus size={16} /> Feld</button>
      </div>

      <input className="input max-w-sm" placeholder="Feld suchen..." value={filter} onChange={e => setFilter(e.target.value)} />

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(f => (
          <div key={f.id} className="card hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center font-bold text-green-700 text-sm">{f.field_number}</div>
                <div><p className="font-bold text-gray-900">{f.name || `Feld ${f.field_number}`}</p><p className="text-sm text-gray-500">{f.area_ha.toFixed(2)} ha · {f.is_owned ? 'Eigentum' : 'Pacht'}</p></div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`badge border text-xs ${STATUS_COLORS[f.status]||'bg-gray-100 text-gray-600 border-gray-200'}`}>{f.status}</span>
              {f.current_crop && <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs">{CROP_EMOJIS[f.current_crop]} {f.current_crop}</span>}
            </div>
            {f.soil_type && <p className="text-xs text-gray-400 mb-3">Boden: {f.soil_type}</p>}
            <div className="flex gap-2 pt-3 border-t border-gray-100">
              <button onClick={() => startEdit(f)} className="flex-1 text-xs text-blue-600 hover:bg-blue-50 py-1.5 rounded-lg border border-blue-200 flex items-center justify-center gap-1"><Edit2 size={12} /> Bearbeiten</button>
              <button onClick={() => del(f.id)} className="text-xs text-red-600 hover:bg-red-50 py-1.5 px-3 rounded-lg border border-red-200"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="col-span-3 text-center py-16 text-gray-400"><MapPin className="mx-auto mb-3 opacity-30" size={40} /><p>Keine Felder vorhanden</p></div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b"><h2 className="font-bold text-lg">{editId ? 'Feld bearbeiten' : 'Neues Feld'}</h2><button onClick={() => setShowForm(false)}><X size={20} /></button></div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Feldnummer *</label><input className="input" value={form.field_number} onChange={e => setForm({...form, field_number: e.target.value})} placeholder="z.B. F01" /></div>
                <div><label className="label">Name</label><input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nordfeld" /></div>
                <div><label className="label">Fläche (ha) *</label><input className="input" type="number" step="0.01" value={form.area_ha} onChange={e => setForm({...form, area_ha: e.target.value})} /></div>
                <div><label className="label">Status</label><select className="input" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
                <div><label className="label">Aktuelle Frucht</label><select className="input" value={form.current_crop} onChange={e => setForm({...form, current_crop: e.target.value})}><option value="">—</option><optgroup label="LS22 &amp; LS25">{CROPS_LS22.map(c => <option key={c} value={c}>{CROP_EMOJIS[c]||'🌱'} {c}</option>)}</optgroup><optgroup label="Neu in LS25">{CROPS_LS25_EXTRA.map(c => <option key={c} value={c}>{CROP_EMOJIS[c]||'🌱'} {c}</option>)}</optgroup></select></div>
                <div><label className="label">Bodenart</label><input className="input" value={form.soil_type} onChange={e => setForm({...form, soil_type: e.target.value})} placeholder="Lehm, Sand..." /></div>
              </div>
              <div className="flex items-center gap-2"><input type="checkbox" id="owned" checked={form.is_owned} onChange={e => setForm({...form, is_owned: e.target.checked})} className="rounded" /><label htmlFor="owned" className="text-sm font-medium">Eigentum (sonst Pacht)</label></div>
              {!form.is_owned && <div><label className="label">Pachtpreis (€/ha)</label><input className="input" type="number" value={form.lease_price_per_ha} onChange={e => setForm({...form, lease_price_per_ha: e.target.value})} /></div>}
              {form.is_owned && <div><label className="label">Kaufpreis (€)</label><input className="input" type="number" value={form.purchase_price} onChange={e => setForm({...form, purchase_price: e.target.value})} /></div>}
              <div><label className="label">Standort/Notizen</label><textarea className="input h-20 resize-none" value={form.location_notes} onChange={e => setForm({...form, location_notes: e.target.value})} /></div>
            </div>
            <div className="flex gap-3 p-6 border-t"><button onClick={save} className="btn-primary flex-1">{editId ? 'Speichern' : 'Hinzufügen'}</button><button onClick={() => setShowForm(false)} className="btn-secondary px-6">Abbrechen</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
