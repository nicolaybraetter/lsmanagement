import { useEffect, useState } from 'react';
import { useFarmStore } from '../store/farmStore';
import { machinesApi } from '../services/api';
import {
  Tractor, Plus, Trash2, X, ArrowLeftRight, ShoppingCart,
  CheckCircle2, Circle, Wrench, AlertCircle, BadgeCheck,
  ChevronDown, Search, RotateCcw, Save, ClipboardList,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Machine {
  id: number;
  farm_id: number;
  name: string;
  brand: string | null;
  model: string | null;
  license_plate: string | null;
  year: number | null;
  category: string;
  status: string;
  purchase_price: number;
  is_sold: boolean;
  sale_price: number;
  sold_at: string | null;
  lent_to_farm_id: number | null;
  lent_to_farm_name: string | null;
  notes: string | null;
  purchase_date?: string | null;
  current_value?: number;
  operating_hours?: number;
  is_borrowed: boolean;
  owned_by_farm_name: string | null;
}

interface Farm { id: number; name: string; game_version: string; }

const CATEGORIES = [
  'Traktor', 'Mähdrescher', 'Feldhäcksler', 'Sämaschine', 'Feldspritze',
  'Düngerstreuer', 'Güllefass', 'Miststreuer', 'Anhänger / Kipper',
  'Radlader / Teleskoplader', 'Mähwerk / Schwader', 'Ballenpresse',
  'Pflug', 'Grubber / Egge', 'Transporter / LKW', 'Sonstiges',
];

const CATEGORY_ICONS: Record<string, string> = {
  'Traktor': '🚜', 'Mähdrescher': '🌾', 'Feldhäcksler': '🌿',
  'Sämaschine': '🌱', 'Feldspritze': '💧', 'Düngerstreuer': '🪣',
  'Güllefass': '🛢️', 'Miststreuer': '🔄', 'Anhänger / Kipper': '🚛',
  'Radlader / Teleskoplader': '🏗️', 'Mähwerk / Schwader': '✂️',
  'Ballenpresse': '📦', 'Pflug': '⚙️', 'Grubber / Egge': '🔧',
  'Transporter / LKW': '🚚', 'Sonstiges': '🔩',
};

const STATUS_STYLE: Record<string, string> = {
  'verfügbar':  'bg-green-100 text-green-700 border-green-200',
  'im Einsatz': 'bg-blue-100 text-blue-700 border-blue-200',
  'Wartung':    'bg-amber-100 text-amber-700 border-amber-200',
  'verliehen':  'bg-purple-100 text-purple-700 border-purple-200',
  'defekt':     'bg-red-100 text-red-700 border-red-200',
  'verkauft':   'bg-gray-100 text-gray-500 border-gray-200',
};

const EMPTY_BUY = {
  name: '', brand: '', model: '', license_plate: '',
  year: '', category: 'Traktor', purchase_price: '', notes: '',
};
const EMPTY_SERVICE = { type: 'Wartung', title: '', description: '', cost: '', service_date: new Date().toISOString().split('T')[0] };

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition';
const sel = inp + ' bg-white appearance-none cursor-pointer';

export default function MachinesPage() {
  const { currentFarm } = useFarmStore();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'available' | 'lent' | 'sold' | 'borrowed'>('all');
  const [search, setSearch] = useState('');

  const [buyModal, setBuyModal] = useState(false);
  const [lendTarget, setLendTarget] = useState<Machine | null>(null);
  const [sellTarget, setSellTarget] = useState<Machine | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Machine | null>(null);
  const [editTarget, setEditTarget] = useState<Machine | null>(null);
  const [serviceTarget, setServiceTarget] = useState<Machine | null>(null);
  const [serviceEntries, setServiceEntries] = useState<any[]>([]);

  const [buyForm, setBuyForm] = useState<any>(EMPTY_BUY);
  const [editForm, setEditForm] = useState<any>(EMPTY_BUY);
  const [serviceForm, setServiceForm] = useState<any>(EMPTY_SERVICE);
  const [lendFarmId, setLendFarmId] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [lendTargets, setLendTargets] = useState<Farm[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (currentFarm) load(); }, [currentFarm]);

  const load = async () => {
    if (!currentFarm) return;
    setLoading(true);
    try {
      const [machineRes, lendTargetRes] = await Promise.all([
        machinesApi.list(currentFarm.id),
        machinesApi.lendTargets(currentFarm.id),
      ]);
      setMachines(machineRes.data);
      setLendTargets(lendTargetRes.data);
    }
    finally { setLoading(false); }
  };

  const handleBuy = async () => {
    if (!currentFarm || !buyForm.name.trim()) return toast.error('Bezeichnung erforderlich');
    setSaving(true);
    try {
      await machinesApi.create(currentFarm.id, {
        ...buyForm,
        year: buyForm.year ? parseInt(buyForm.year) : null,
        purchase_price: parseFloat(buyForm.purchase_price) || 0,
      });
      toast.success(`„${buyForm.name}" zum Fuhrpark hinzugefügt`);
      setBuyModal(false); setBuyForm(EMPTY_BUY); load();
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Fehler'); }
    finally { setSaving(false); }
  };

  const handleLend = async () => {
    if (!currentFarm || !lendTarget || !lendFarmId) return toast.error('Bitte einen Hof auswählen');
    setSaving(true);
    try {
      const r = await machinesApi.lend(currentFarm.id, lendTarget.id, parseInt(lendFarmId));
      setMachines(ms => ms.map(m => m.id === lendTarget.id ? r.data : m));
      toast.success(`Fahrzeug an „${r.data.lent_to_farm_name}" verliehen`);
      setLendTarget(null); setLendFarmId('');
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Fehler'); }
    finally { setSaving(false); }
  };

  const handleUnlend = async (machine: Machine) => {
    if (!currentFarm) return;
    try {
      const r = await machinesApi.unlend(currentFarm.id, machine.id);
      setMachines(ms => ms.map(m => m.id === machine.id ? r.data : m));
      toast.success('Fahrzeug zurückgekehrt');
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Fehler'); }
  };

  const handleReturnBorrowed = async (machine: Machine) => {
    if (!currentFarm) return;
    try {
      await machinesApi.returnBorrowed(currentFarm.id, machine.id);
      setMachines(ms => ms.filter(m => !(m.id === machine.id && m.is_borrowed)));
      toast.success(`„${machine.name}" zurückgegeben`);
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Fehler'); }
  };

  const handleSell = async () => {
    if (!currentFarm || !sellTarget) return;
    const price = parseFloat(salePrice);
    if (isNaN(price) || price < 0) return toast.error('Ungültiger Verkaufspreis');
    setSaving(true);
    try {
      const r = await machinesApi.sell(currentFarm.id, sellTarget.id, price);
      setMachines(ms => ms.map(m => m.id === sellTarget.id ? r.data : m));
      toast.success(`„${sellTarget.name}" verkauft — ${price.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} gutgeschrieben`);
      setSellTarget(null); setSalePrice('');
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Fehler'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!currentFarm || !deleteTarget) return;
    try {
      await machinesApi.delete(currentFarm.id, deleteTarget.id);
      setMachines(ms => ms.filter(m => m.id !== deleteTarget.id));
      toast.success('Fahrzeug gelöscht'); setDeleteTarget(null);
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Fehler'); }
  };

  const openEdit = (machine: Machine) => {
    setEditTarget(machine);
    setEditForm({
      name: machine.name || '',
      brand: machine.brand || '',
      model: machine.model || '',
      license_plate: machine.license_plate || '',
      year: machine.year || '',
      category: machine.category || 'Sonstiges',
      purchase_price: machine.purchase_price || 0,
      notes: machine.notes || '',
      current_value: machine.current_value || 0,
      operating_hours: machine.operating_hours || 0,
      status: machine.status || 'verfügbar',
      purchase_date: machine.purchase_date ? String(machine.purchase_date).slice(0, 10) : '',
    });
  };

  const handleEditSave = async () => {
    if (!currentFarm || !editTarget || !editForm.name.trim()) return toast.error('Bezeichnung erforderlich');
    setSaving(true);
    try {
      const r = await machinesApi.update(currentFarm.id, editTarget.id, {
        ...editForm,
        year: editForm.year ? parseInt(editForm.year) : null,
        purchase_price: parseFloat(editForm.purchase_price) || 0,
        current_value: parseFloat(editForm.current_value) || 0,
        operating_hours: parseFloat(editForm.operating_hours) || 0,
        purchase_date: editForm.purchase_date ? new Date(editForm.purchase_date).toISOString() : null,
      });
      setMachines(ms => ms.map(m => m.id === editTarget.id ? r.data : m));
      setEditTarget(null);
      toast.success('Fahrzeug aktualisiert');
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Fehler');
    } finally {
      setSaving(false);
    }
  };

  const openService = async (machine: Machine) => {
    if (!currentFarm) return;
    setServiceTarget(machine);
    setServiceForm(EMPTY_SERVICE);
    try {
      const r = await machinesApi.listServices(currentFarm.id, machine.id);
      setServiceEntries(r.data);
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Servicehistorie konnte nicht geladen werden');
    }
  };

  const createServiceEntry = async () => {
    if (!currentFarm || !serviceTarget || !serviceForm.title.trim()) return toast.error('Titel erforderlich');
    setSaving(true);
    try {
      const r = await machinesApi.createService(currentFarm.id, serviceTarget.id, {
        ...serviceForm,
        cost: parseFloat(serviceForm.cost) || 0,
        service_date: new Date(serviceForm.service_date).toISOString(),
      });
      setServiceEntries(prev => [r.data, ...prev]);
      setServiceForm(EMPTY_SERVICE);
      await load();
      toast.success('Serviceeintrag gespeichert');
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Fehler');
    } finally {
      setSaving(false);
    }
  };

  const ownMachines = machines.filter(m => !m.is_borrowed);
  const borrowedMachines = machines.filter(m => m.is_borrowed);

  const filtered = machines.filter(m => {
    const q = search.toLowerCase();
    const ok = !q || m.name.toLowerCase().includes(q) || (m.brand || '').toLowerCase().includes(q) ||
      (m.license_plate || '').toLowerCase().includes(q) || m.category.toLowerCase().includes(q);
    if (!ok) return false;
    if (filter === 'available') return !m.is_sold && m.status !== 'verliehen' && !m.is_borrowed;
    if (filter === 'lent') return m.status === 'verliehen' && !m.is_sold && !m.is_borrowed;
    if (filter === 'sold') return m.is_sold;
    if (filter === 'borrowed') return m.is_borrowed;
    return true;
  });

  const counts = {
    total: ownMachines.length,
    available: ownMachines.filter(m => !m.is_sold && m.status === 'verfügbar').length,
    lent: ownMachines.filter(m => m.status === 'verliehen' && !m.is_sold).length,
    sold: ownMachines.filter(m => m.is_sold).length,
    borrowed: borrowedMachines.length,
  };

  const fmt = (n: number) => n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Tractor className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fuhrpark</h1>
            <p className="text-gray-500 text-sm">{counts.total} Fahrzeuge · {counts.available} verfügbar</p>
          </div>
        </div>
        <button onClick={() => { setBuyForm(EMPTY_BUY); setBuyModal(true); }} className="btn-primary flex items-center gap-2">
          <ShoppingCart size={16} /> Fahrzeug kaufen
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Gesamt', value: counts.total, color: 'text-gray-900' },
          { label: 'Verfügbar', value: counts.available, color: 'text-green-600' },
          { label: 'Verliehen', value: counts.lent, color: 'text-purple-600' },
          { label: 'Geliehen', value: counts.borrowed, color: 'text-blue-600' },
          { label: 'Verkauft', value: counts.sold, color: 'text-gray-400' },
        ].map(s => (
          <div key={s.label} className="card py-3">
            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter + search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Suchen…"
            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(['all', 'available', 'lent', 'borrowed', 'sold'] as const).map(f => {
            const labels = { all: 'Alle', available: 'Verfügbar', lent: 'Verliehen', borrowed: 'Geliehen', sold: 'Verkauft' };
            return (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filter === f ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {labels[f]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="card flex justify-center py-16 text-gray-400">Lade Fuhrpark…</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">🚜</p>
          <p className="text-gray-500 font-medium">
            {machines.length === 0 ? 'Noch keine Fahrzeuge im Fuhrpark' : 'Keine Fahrzeuge gefunden'}
          </p>
          {machines.length === 0 && (
            <button onClick={() => setBuyModal(true)} className="btn-primary mt-4 inline-flex items-center gap-2">
              <Plus size={15} /> Erstes Fahrzeug kaufen
            </button>
          )}
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                  <th className="text-left px-5 py-3">Fahrzeug</th>
                  <th className="text-left px-5 py-3 hidden sm:table-cell">Kennzeichen</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">Kaufpreis</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3 hidden lg:table-cell">Verliehen an</th>
                  <th className="text-right px-5 py-3">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={`${m.id}-${m.is_borrowed ? 'borrowed' : 'own'}`} className={`border-b border-gray-50 hover:bg-gray-50/60 transition ${m.is_sold ? 'opacity-60' : ''} ${m.is_borrowed ? 'bg-blue-50/30' : ''}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{CATEGORY_ICONS[m.category] || '🔩'}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{m.name}</p>
                            {m.is_borrowed && (
                              <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full font-medium">Geliehen</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">{[m.brand, m.model, m.year].filter(Boolean).join(' · ')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      {m.license_plate
                        ? <span className="font-mono text-xs bg-yellow-50 border border-yellow-200 rounded px-2 py-0.5">{m.license_plate}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-gray-600">
                      {m.purchase_price > 0 ? fmt(m.purchase_price) : '—'}
                      {m.is_sold && m.sale_price > 0 && (
                        <p className="text-xs text-green-600">Verkauft: {fmt(m.sale_price)}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLE[m.status] || STATUS_STYLE['verfügbar']}`}>
                        {m.status === 'verfügbar' && <CheckCircle2 size={11} />}
                        {m.status === 'verliehen' && <ArrowLeftRight size={11} />}
                        {m.status === 'verkauft' && <BadgeCheck size={11} />}
                        {m.status === 'Wartung' && <Wrench size={11} />}
                        {m.status === 'defekt' && <AlertCircle size={11} />}
                        {m.status === 'im Einsatz' && <Circle size={11} />}
                        {m.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      {m.is_borrowed && m.owned_by_farm_name
                        ? <span className="flex items-center gap-1 text-blue-600 text-xs font-medium"><ArrowLeftRight size={12} />von {m.owned_by_farm_name}</span>
                        : m.lent_to_farm_name
                          ? <span className="flex items-center gap-1 text-purple-600 text-xs font-medium"><ArrowLeftRight size={12} />{m.lent_to_farm_name}</span>
                          : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {m.is_borrowed ? (
                          <button onClick={() => handleReturnBorrowed(m)} title="Zurückgeben"
                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition flex items-center gap-1 text-xs font-medium px-2">
                            <RotateCcw size={14} /> Zurückgeben
                          </button>
                        ) : (
                          <>
                            {!m.is_sold && (
                              <>
                                {m.status === 'verliehen' ? (
                                  <button onClick={() => handleUnlend(m)} title="Zurückgekehrt"
                                    className="p-1.5 rounded-lg text-purple-500 hover:bg-purple-50 transition">
                                    <RotateCcw size={15} />
                                  </button>
                                ) : (
                                  <button onClick={() => { setLendTarget(m); setLendFarmId(''); }} title="Verleihen"
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition">
                                    <ArrowLeftRight size={15} />
                                  </button>
                                )}
                                <button onClick={() => { setSellTarget(m); setSalePrice(''); }} title="Verkaufen"
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition">
                                  <ShoppingCart size={15} />
                                </button>
                                <button onClick={() => openService(m)} title="Wartung/Reparatur"
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition">
                                  <ClipboardList size={15} />
                                </button>
                                <button onClick={() => openEdit(m)} title="Bearbeiten"
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition">
                                  <Save size={15} />
                                </button>
                              </>
                            )}
                            <button onClick={() => setDeleteTarget(m)} title="Löschen"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition">
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BUY MODAL */}
      {buyModal && (
        <Modal title="Fahrzeug kaufen" onClose={() => setBuyModal(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Field label="Bezeichnung *">
                  <input autoFocus value={buyForm.name} onChange={e => setBuyForm((f: any) => ({ ...f, name: e.target.value }))}
                    placeholder="z. B. John Deere 6R 150" className={inp} />
                </Field>
              </div>
              <div className="col-span-2">
                <Field label="Fahrzeugkategorie">
                  <div className="relative">
                    <select value={buyForm.category} onChange={e => setBuyForm((f: any) => ({ ...f, category: e.target.value }))} className={sel}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </Field>
              </div>
              <Field label="Marke">
                <input value={buyForm.brand} onChange={e => setBuyForm((f: any) => ({ ...f, brand: e.target.value }))}
                  placeholder="John Deere, Fendt…" className={inp} />
              </Field>
              <Field label="Modell">
                <input value={buyForm.model} onChange={e => setBuyForm((f: any) => ({ ...f, model: e.target.value }))}
                  placeholder="6R 150, 724…" className={inp} />
              </Field>
              <Field label="Kennzeichen">
                <input value={buyForm.license_plate} onChange={e => setBuyForm((f: any) => ({ ...f, license_plate: e.target.value.toUpperCase() }))}
                  placeholder="AB-CD 1234" className={`${inp} font-mono`} />
              </Field>
              <Field label="Baujahr">
                <input type="number" value={buyForm.year} onChange={e => setBuyForm((f: any) => ({ ...f, year: e.target.value }))}
                  placeholder="2023" min={1950} max={2030} className={inp} />
              </Field>
              <div className="col-span-2">
                <Field label="Kaufpreis (€)">
                  <input type="number" value={buyForm.purchase_price} onChange={e => setBuyForm((f: any) => ({ ...f, purchase_price: e.target.value }))}
                    placeholder="0" min={0} className={inp} />
                  {parseFloat(buyForm.purchase_price) > 0 && (
                    <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                      <AlertCircle size={11} />
                      {parseFloat(buyForm.purchase_price).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} werden vom Hofkapital abgezogen
                    </p>
                  )}
                </Field>
              </div>
              <div className="col-span-2">
                <Field label="Notizen">
                  <textarea value={buyForm.notes} onChange={e => setBuyForm((f: any) => ({ ...f, notes: e.target.value }))}
                    rows={2} placeholder="Optionale Anmerkungen…" className={`${inp} resize-none`} />
                </Field>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setBuyModal(false)} className="flex-1 btn-secondary">Abbrechen</button>
              <button onClick={handleBuy} disabled={saving || !buyForm.name.trim()}
                className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? '…' : <><ShoppingCart size={15} /> Kaufen</>}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* LEND MODAL */}
      {lendTarget && (
        <Modal title={`Verleihen: ${lendTarget.name}`} onClose={() => setLendTarget(null)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">An welchen Hof soll das Fahrzeug verliehen werden?</p>
            {lendTargets.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                Keine weiteren aktiven Höfe gefunden.
              </div>
            ) : (
              <Field label="Zielhof">
                <div className="relative">
                  <select value={lendFarmId} onChange={e => setLendFarmId(e.target.value)} className={sel}>
                    <option value="">— Hof auswählen —</option>
                    {lendTargets.map((f: any) => <option key={f.id} value={f.id}>{f.name} ({f.game_version})</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </Field>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setLendTarget(null)} className="flex-1 btn-secondary">Abbrechen</button>
              <button onClick={handleLend} disabled={saving || !lendFarmId}
                className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? '…' : <><ArrowLeftRight size={15} /> Verleihen</>}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* SELL MODAL */}
      {sellTarget && (
        <Modal title={`Verkaufen: ${sellTarget.name}`} onClose={() => setSellTarget(null)}>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm">
              <p className="font-semibold text-gray-900">{sellTarget.name}</p>
              {sellTarget.purchase_price > 0 && (
                <p className="text-gray-500 text-xs mt-0.5">Kaufpreis war: {fmt(sellTarget.purchase_price)}</p>
              )}
            </div>
            <Field label="Verkaufspreis (€)">
              <input autoFocus type="number" value={salePrice} onChange={e => setSalePrice(e.target.value)}
                placeholder="0" min={0} className={inp} />
              {parseFloat(salePrice) > 0 && (
                <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                  <CheckCircle2 size={11} />
                  {parseFloat(salePrice).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} werden dem Hofkapital gutgeschrieben
                </p>
              )}
            </Field>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setSellTarget(null)} className="flex-1 btn-secondary">Abbrechen</button>
              <button onClick={handleSell} disabled={saving || salePrice === ''}
                className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? '…' : 'Verkaufen'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* DELETE MODAL */}
      {deleteTarget && (
        <Modal title="Fahrzeug entfernen" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Fahrzeug <span className="font-semibold text-gray-900">„{deleteTarget.name}"</span> wirklich aus dem Fuhrpark entfernen?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 btn-secondary">Abbrechen</button>
              <button onClick={handleDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2">
                <Trash2 size={15} /> Löschen
              </button>
            </div>
          </div>
        </Modal>
      )}

      {editTarget && (
        <Modal title={`Fahrzeug bearbeiten: ${editTarget.name}`} onClose={() => setEditTarget(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Bezeichnung *"><input className={inp} value={editForm.name} onChange={e => setEditForm((f: any) => ({ ...f, name: e.target.value }))} /></Field>
              <Field label="Status">
                <select className={sel} value={editForm.status} onChange={e => setEditForm((f: any) => ({ ...f, status: e.target.value }))}>
                  {['verfügbar', 'im Einsatz', 'Wartung', 'defekt', 'verliehen', 'verkauft'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Marke"><input className={inp} value={editForm.brand} onChange={e => setEditForm((f: any) => ({ ...f, brand: e.target.value }))} /></Field>
              <Field label="Modell"><input className={inp} value={editForm.model} onChange={e => setEditForm((f: any) => ({ ...f, model: e.target.value }))} /></Field>
              <Field label="Kennzeichen"><input className={`${inp} font-mono`} value={editForm.license_plate} onChange={e => setEditForm((f: any) => ({ ...f, license_plate: e.target.value.toUpperCase() }))} /></Field>
              <Field label="Baujahr"><input className={inp} type="number" value={editForm.year} onChange={e => setEditForm((f: any) => ({ ...f, year: e.target.value }))} /></Field>
              <Field label="Kaufpreis (€)"><input className={inp} type="number" value={editForm.purchase_price} onChange={e => setEditForm((f: any) => ({ ...f, purchase_price: e.target.value }))} /></Field>
              <Field label="Aktueller Wert (€)"><input className={inp} type="number" value={editForm.current_value} onChange={e => setEditForm((f: any) => ({ ...f, current_value: e.target.value }))} /></Field>
              <Field label="Betriebsstunden"><input className={inp} type="number" step="0.1" value={editForm.operating_hours} onChange={e => setEditForm((f: any) => ({ ...f, operating_hours: e.target.value }))} /></Field>
              <Field label="Kaufdatum"><input className={inp} type="date" value={editForm.purchase_date} onChange={e => setEditForm((f: any) => ({ ...f, purchase_date: e.target.value }))} /></Field>
              <div className="col-span-2">
                <Field label="Notizen"><textarea className={`${inp} resize-none`} rows={3} value={editForm.notes} onChange={e => setEditForm((f: any) => ({ ...f, notes: e.target.value }))} /></Field>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditTarget(null)} className="flex-1 btn-secondary">Abbrechen</button>
              <button onClick={handleEditSave} disabled={saving} className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50">
                <Save size={15} /> Speichern
              </button>
            </div>
          </div>
        </Modal>
      )}

      {serviceTarget && (
        <Modal title={`Wartung & Reparatur: ${serviceTarget.name}`} onClose={() => setServiceTarget(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Typ">
                <select className={sel} value={serviceForm.type} onChange={e => setServiceForm((f: any) => ({ ...f, type: e.target.value }))}>
                  <option>Wartung</option>
                  <option>Reparatur</option>
                </select>
              </Field>
              <Field label="Datum">
                <input className={inp} type="date" value={serviceForm.service_date} onChange={e => setServiceForm((f: any) => ({ ...f, service_date: e.target.value }))} />
              </Field>
              <div className="col-span-2"><Field label="Titel"><input className={inp} value={serviceForm.title} onChange={e => setServiceForm((f: any) => ({ ...f, title: e.target.value }))} placeholder="z. B. Ölwechsel" /></Field></div>
              <Field label="Kosten (€)"><input className={inp} type="number" step="0.01" value={serviceForm.cost} onChange={e => setServiceForm((f: any) => ({ ...f, cost: e.target.value }))} /></Field>
              <div className="col-span-2"><Field label="Beschreibung"><textarea className={`${inp} resize-none`} rows={2} value={serviceForm.description} onChange={e => setServiceForm((f: any) => ({ ...f, description: e.target.value }))} /></Field></div>
            </div>
            <button onClick={createServiceEntry} disabled={saving} className="w-full btn-primary disabled:opacity-50">Eintrag speichern</button>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {serviceEntries.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Noch keine Einträge vorhanden.</p>
              ) : serviceEntries.map((entry: any) => (
                <div key={entry.id} className="border border-gray-200 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">{entry.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${entry.type === 'Reparatur' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{entry.type}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{new Date(entry.service_date).toLocaleDateString('de-DE')} · {fmt(entry.cost || 0)}</p>
                  {entry.description && <p className="text-sm text-gray-600 mt-1">{entry.description}</p>}
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
