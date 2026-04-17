import { useEffect, useState } from 'react';
import { useFarmStore } from '../store/farmStore';
import { financesApi } from '../services/api';
import toast from 'react-hot-toast';
import { TrendingUp, TrendingDown, Plus, Trash2, X, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const CATEGORIES_INCOME = ['Maschinenverleih','Ernte Verkauf','Tierverkauf','Lohnarbeit','Förderung','Biogasanlage','Sonstige Einnahme'];
const CATEGORIES_EXPENSE = ['Maschinenkauf','Kraftstoff','Saatgut','Düngemittel','Pflanzenschutz','Tierkauf','Pacht','Grunderwerb','Reparatur','Futtermittel','Sonstige Ausgabe'];

const EMPTY = { type: 'Einnahme', category: 'Ernte Verkauf', amount: '', description: '', date: new Date().toISOString().split('T')[0], notes: '', reference_number: '' };

export default function FinancesPage() {
  const { currentFarm } = useFarmStore();
  const [entries, setEntries] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, balance: 0 });
  const [year, setYear] = useState(new Date().getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => { if (currentFarm) load(); }, [currentFarm, year]);

  const load = async () => {
    if (!currentFarm) return;
    const [r, s] = await Promise.all([financesApi.list(currentFarm.id, year), financesApi.summary(currentFarm.id, year)]);
    setEntries(r.data);
    setSummary(s.data);
  };

  const save = async () => {
    if (!currentFarm || !form.amount || !form.description.trim()) return toast.error('Betrag und Beschreibung erforderlich');
    try {
      const typeMap: Record<string, string> = { 'Einnahme': 'Einnahme', 'Ausgabe': 'Ausgabe' };
      await financesApi.create(currentFarm.id, { ...form, amount: parseFloat(form.amount), date: new Date(form.date).toISOString() });
      toast.success('Buchung gespeichert');
      setShowForm(false); setForm(EMPTY); load();
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Fehler'); }
  };

  const del = async (id: number) => {
    if (!currentFarm || !confirm('Eintrag löschen?')) return;
    await financesApi.delete(currentFarm.id, id);
    toast.success('Gelöscht'); load();
  };

  const filtered = entries.filter(e => !typeFilter || e.type === typeFilter);

  const fmt = (n: number) => n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center"><TrendingUp className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Finanzen</h1><p className="text-gray-500 text-sm">Ein- und Ausgabenverwaltung</p></div>
        </div>
        <div className="flex items-center gap-3">
          <select className="input w-28" value={year} onChange={e => setYear(parseInt(e.target.value))}>
            {[2022,2023,2024,2025,2026].map(y => <option key={y}>{y}</option>)}
          </select>
          <button onClick={() => { setForm(EMPTY); setShowForm(true); }} className="btn-primary flex items-center gap-2"><Plus size={16} /> Buchung</button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Einnahmen</p><p className="text-2xl font-bold text-green-600">{fmt(summary.total_income)}</p></div>
            <ArrowUpRight className="text-green-500 w-8 h-8" />
          </div>
        </div>
        <div className="card border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Ausgaben</p><p className="text-2xl font-bold text-red-600">{fmt(summary.total_expense)}</p></div>
            <ArrowDownRight className="text-red-500 w-8 h-8" />
          </div>
        </div>
        <div className={`card border-l-4 ${summary.balance >= 0 ? 'border-l-blue-500' : 'border-l-orange-500'}`}>
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Bilanz</p><p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{fmt(summary.balance)}</p></div>
            {summary.balance >= 0 ? <TrendingUp className="text-blue-500 w-8 h-8" /> : <TrendingDown className="text-orange-500 w-8 h-8" />}
          </div>
        </div>
      </div>

      {/* Filter + Table */}
      <div className="card">
        <div className="flex gap-3 mb-4">
          <button onClick={() => setTypeFilter('')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${!typeFilter ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Alle</button>
          <button onClick={() => setTypeFilter('Einnahme')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${typeFilter === 'Einnahme' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Einnahmen</button>
          <button onClick={() => setTypeFilter('Ausgabe')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${typeFilter === 'Ausgabe' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Ausgaben</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-gray-500 border-b border-gray-200 text-xs">
              <th className="text-left py-3 font-medium">Datum</th>
              <th className="text-left py-3 font-medium">Beschreibung</th>
              <th className="text-left py-3 font-medium">Kategorie</th>
              <th className="text-right py-3 font-medium">Betrag</th>
              <th className="py-3"></th>
            </tr></thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 text-gray-500 text-xs">{new Date(e.date).toLocaleDateString('de-DE')}</td>
                  <td className="py-3 font-medium text-gray-900">{e.description}</td>
                  <td className="py-3"><span className="badge bg-gray-100 text-gray-600 text-xs">{e.category}</span></td>
                  <td className={`py-3 text-right font-bold ${e.type === 'Einnahme' ? 'text-green-600' : 'text-red-600'}`}>
                    {e.type === 'Einnahme' ? '+' : '-'}{fmt(e.amount)}
                  </td>
                  <td className="py-3 pl-3"><button onClick={() => del(e.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-12 text-gray-400">Keine Buchungen vorhanden</div>}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b"><h2 className="font-bold text-lg">Neue Buchung</h2><button onClick={() => setShowForm(false)}><X size={20} /></button></div>
            <div className="p-6 space-y-4">
              <div className="flex gap-2 mb-2">
                <button type="button" onClick={() => setForm({...form, type: 'Einnahme', category: 'Ernte Verkauf'})} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${form.type === 'Einnahme' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Einnahme</button>
                <button type="button" onClick={() => setForm({...form, type: 'Ausgabe', category: 'Kraftstoff'})} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${form.type === 'Ausgabe' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Ausgabe</button>
              </div>
              <div><label className="label">Beschreibung *</label><input className="input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="z.B. Weizenverkauf Ernte 2024" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Betrag (€) *</label><input className="input" type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} /></div>
                <div><label className="label">Datum *</label><input className="input" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>
              </div>
              <div><label className="label">Kategorie</label><select className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                {(form.type === 'Einnahme' ? CATEGORIES_INCOME : CATEGORIES_EXPENSE).map(c => <option key={c}>{c}</option>)}
              </select></div>
              <div><label className="label">Belegnummer</label><input className="input" value={form.reference_number} onChange={e => setForm({...form, reference_number: e.target.value})} placeholder="RE-2024-001" /></div>
              <div><label className="label">Notizen</label><textarea className="input h-16 resize-none" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
            </div>
            <div className="flex gap-3 p-6 border-t"><button onClick={save} className="btn-primary flex-1">Buchung speichern</button><button onClick={() => setShowForm(false)} className="btn-secondary px-6">Abbrechen</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
