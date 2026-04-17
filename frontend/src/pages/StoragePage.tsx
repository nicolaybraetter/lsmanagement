import { useEffect, useState } from 'react';
import { useFarmStore } from '../store/farmStore';
import { storageApi } from '../services/api';
import toast from 'react-hot-toast';
import { Package, Plus, X, ArrowUp, ArrowDown, AlertTriangle } from 'lucide-react';

const CATEGORIES = ['Kraftstoff','Öl & Schmierstoffe','Saatgut','Mineraldünger','Organischer Dünger','Pflanzenschutzmittel','Heu','Stroh','Grassilage','Maissilage','GPS Silage','Getreide als Futter','Kraftfutter','Rübenpressschnitzel','Weizen Ernte','Gerste Ernte','Raps Ernte','Mais Ernte','Kartoffel Ernte','Zuckerrüben Ernte','Sonstiges'];

const CAT_COLORS: Record<string, string> = {
  'Kraftstoff': 'bg-red-100 text-red-700',
  'Saatgut': 'bg-lime-100 text-lime-700',
  'Mineraldünger': 'bg-blue-100 text-blue-700',
  'Organischer Dünger': 'bg-amber-100 text-amber-700',
  'Grassilage': 'bg-green-100 text-green-700',
  'Maissilage': 'bg-yellow-100 text-yellow-700',
  'Heu': 'bg-amber-100 text-amber-700',
  'Stroh': 'bg-orange-100 text-orange-700',
};

const EMPTY_ITEM = { name: '', category: 'Kraftstoff', current_quantity: '0', unit: 'L', capacity: '', location: '', notes: '', min_stock_warning: '', price_per_unit: '' };
const EMPTY_TX = { transaction_type: 'in', quantity: '', price_per_unit: '', description: '', date: new Date().toISOString().split('T')[0] };

export default function StoragePage() {
  const { currentFarm } = useFarmStore();
  const [items, setItems] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<any>(EMPTY_ITEM);
  const [txItem, setTxItem] = useState<any>(null);
  const [tx, setTx] = useState<any>(EMPTY_TX);
  const [catFilter, setCatFilter] = useState('');

  useEffect(() => { if (currentFarm) load(); }, [currentFarm]);

  const load = async () => {
    if (!currentFarm) return;
    const r = await storageApi.list(currentFarm.id);
    setItems(r.data);
  };

  const save = async () => {
    if (!currentFarm || !form.name.trim()) return toast.error('Name erforderlich');
    try {
      const payload = { ...form, current_quantity: parseFloat(form.current_quantity)||0, capacity: form.capacity ? parseFloat(form.capacity) : null, min_stock_warning: form.min_stock_warning ? parseFloat(form.min_stock_warning) : null, price_per_unit: form.price_per_unit ? parseFloat(form.price_per_unit) : null };
      if (editId) await storageApi.update(currentFarm.id, editId, payload);
      else await storageApi.create(currentFarm.id, payload);
      toast.success('Gespeichert'); setShowForm(false); setEditId(null); setForm(EMPTY_ITEM); load();
    } catch (e: any) { toast.error('Fehler'); }
  };

  const saveTx = async () => {
    if (!currentFarm || !txItem || !tx.quantity) return toast.error('Menge erforderlich');
    try {
      await storageApi.addTransaction(currentFarm.id, txItem.id, { ...tx, quantity: parseFloat(tx.quantity), price_per_unit: tx.price_per_unit ? parseFloat(tx.price_per_unit) : null, date: new Date(tx.date).toISOString() });
      toast.success(tx.transaction_type === 'in' ? 'Eingang gebucht' : 'Ausgang gebucht');
      setTxItem(null); setTx(EMPTY_TX); load();
    } catch (e: any) { toast.error('Fehler'); }
  };

  const del = async (id: number) => {
    if (!currentFarm || !confirm('Eintrag löschen?')) return;
    await storageApi.delete(currentFarm.id, id); toast.success('Gelöscht'); load();
  };

  const cats = ['', ...new Set(CATEGORIES)];
  const filtered = items.filter(i => !catFilter || i.category === catFilter);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center"><Package className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Lagerverwaltung</h1><p className="text-gray-500 text-sm">{items.length} Positionen</p></div>
        </div>
        <button onClick={() => { setEditId(null); setForm(EMPTY_ITEM); setShowForm(true); }} className="btn-primary flex items-center gap-2"><Plus size={16} /> Position</button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['', 'Kraftstoff', 'Saatgut', 'Mineraldünger', 'Grassilage', 'Maissilage', 'Heu', 'Stroh', 'Kraftfutter'].map(c => (
          <button key={c} onClick={() => setCatFilter(c)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${catFilter === c ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{c || 'Alle'}</button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(item => {
          const isLow = item.min_stock_warning && item.current_quantity <= item.min_stock_warning;
          return (
            <div key={item.id} className={`card hover:shadow-md transition-all ${isLow ? 'border-orange-300 bg-orange-50/30' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {isLow && <AlertTriangle size={14} className="text-orange-500" />}
                    <h3 className="font-bold text-gray-900">{item.name}</h3>
                  </div>
                  <span className={`badge text-xs ${CAT_COLORS[item.category] || 'bg-gray-100 text-gray-600'}`}>{item.category}</span>
                </div>
              </div>
              <div className="mb-4">
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-extrabold text-gray-900">{item.current_quantity.toLocaleString('de-DE')}</span>
                  <span className="text-gray-500 mb-1">{item.unit}</span>
                </div>
                {item.capacity && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Auslastung</span><span>{((item.current_quantity/item.capacity)*100).toFixed(0)}%</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5"><div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(100,(item.current_quantity/item.capacity)*100)}%` }} /></div>
                  </div>
                )}
                {item.location && <p className="text-xs text-gray-400 mt-2">📍 {item.location}</p>}
              </div>
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button onClick={() => { setTxItem(item); setTx({...EMPTY_TX, transaction_type: 'in'}); }} className="flex-1 text-xs text-green-600 hover:bg-green-50 py-1.5 rounded-lg border border-green-200 flex items-center justify-center gap-1"><ArrowUp size={12} /> Eingang</button>
                <button onClick={() => { setTxItem(item); setTx({...EMPTY_TX, transaction_type: 'out'}); }} className="flex-1 text-xs text-red-600 hover:bg-red-50 py-1.5 rounded-lg border border-red-200 flex items-center justify-center gap-1"><ArrowDown size={12} /> Ausgang</button>
                <button onClick={() => { setForm({...item, current_quantity: item.current_quantity+'', capacity: item.capacity||'', min_stock_warning: item.min_stock_warning||'', price_per_unit: item.price_per_unit||'' }); setEditId(item.id); setShowForm(true); }} className="text-xs text-blue-600 hover:bg-blue-50 py-1.5 px-3 rounded-lg border border-blue-200">✏️</button>
                <button onClick={() => del(item.id)} className="text-xs text-gray-400 hover:bg-red-50 hover:text-red-500 py-1.5 px-3 rounded-lg border border-gray-200">🗑</button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div className="col-span-3 text-center py-16 text-gray-400"><Package className="mx-auto mb-3 opacity-30" size={40} /><p>Keine Positionen</p></div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b"><h2 className="font-bold text-lg">{editId ? 'Position bearbeiten' : 'Neue Position'}</h2><button onClick={() => setShowForm(false)}><X size={20} /></button></div>
            <div className="p-6 space-y-4">
              <div><label className="label">Bezeichnung *</label><input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Kategorie</label><select className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
                <div><label className="label">Einheit</label><select className="input" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}><option>L</option><option>t</option><option>kg</option><option>m³</option><option>Stück</option><option>Ballen</option></select></div>
                <div><label className="label">Aktueller Bestand</label><input className="input" type="number" value={form.current_quantity} onChange={e => setForm({...form, current_quantity: e.target.value})} /></div>
                <div><label className="label">Kapazität</label><input className="input" type="number" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} /></div>
                <div><label className="label">Mindestbestand</label><input className="input" type="number" value={form.min_stock_warning} onChange={e => setForm({...form, min_stock_warning: e.target.value})} /></div>
                <div><label className="label">Preis pro Einheit (€)</label><input className="input" type="number" value={form.price_per_unit} onChange={e => setForm({...form, price_per_unit: e.target.value})} /></div>
              </div>
              <div><label className="label">Lagerort</label><input className="input" value={form.location} onChange={e => setForm({...form, location: e.target.value})} /></div>
              <div><label className="label">Notizen</label><textarea className="input h-16 resize-none" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
            </div>
            <div className="flex gap-3 p-6 border-t"><button onClick={save} className="btn-primary flex-1">Speichern</button><button onClick={() => setShowForm(false)} className="btn-secondary px-6">Abbrechen</button></div>
          </div>
        </div>
      )}

      {txItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-bold text-lg">{tx.transaction_type === 'in' ? 'Eingang buchen' : 'Ausgang buchen'}: {txItem.name}</h2>
              <button onClick={() => setTxItem(null)}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-2"><button type="button" onClick={() => setTx({...tx, transaction_type: 'in'})} className={`flex-1 py-2 rounded-lg text-sm font-medium ${tx.transaction_type === 'in' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Eingang</button><button type="button" onClick={() => setTx({...tx, transaction_type: 'out'})} className={`flex-1 py-2 rounded-lg text-sm font-medium ${tx.transaction_type === 'out' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Ausgang</button></div>
              <div><label className="label">Menge ({txItem.unit}) *</label><input className="input" type="number" value={tx.quantity} onChange={e => setTx({...tx, quantity: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="label">Preis/Einheit (€)</label><input className="input" type="number" value={tx.price_per_unit} onChange={e => setTx({...tx, price_per_unit: e.target.value})} /></div><div><label className="label">Datum</label><input className="input" type="date" value={tx.date} onChange={e => setTx({...tx, date: e.target.value})} /></div></div>
              <div><label className="label">Beschreibung</label><input className="input" value={tx.description} onChange={e => setTx({...tx, description: e.target.value})} /></div>
            </div>
            <div className="flex gap-3 p-6 border-t"><button onClick={saveTx} className="btn-primary flex-1">Buchen</button><button onClick={() => setTxItem(null)} className="btn-secondary px-6">Abbrechen</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
