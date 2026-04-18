import { useEffect, useState } from 'react';
import { useFarmStore } from '../store/farmStore';
import { machinesApi, lohnhoefeApi } from '../services/api';
import {
  Tractor, Plus, Trash2, X, ArrowLeftRight, ShoppingCart,
  CheckCircle2, Circle, Wrench, AlertCircle, BadgeCheck,
  ChevronDown, Search, RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Machine {
  id: number;
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
  const { currentFarm, farms } = useFarmStore();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'available' | 'lent' | 'sold'>('all');
  const [search, setSearch] = useState('');

  const [buyModal, setBuyModal] = useState(false);
  const [lendTarget, setLendTarget] = useState<Machine | null>(null);
  const [sellTarget, setSellTarget] = useState<Machine | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Machine | null>(null);

  const [buyForm, setBuyForm] = useState<any>(EMPTY_BUY);
  const [lendFarmId, setLendFarmId] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [lohnhoefe, setLohnhoefe] = useState<any[]>([]);

  const otherFarms: Farm[] = farms.filter((f: any) => f.id !== currentFarm?.id);

  useEffect(() => { if (currentFarm) { load(); loadLohnhoefe(); } }, [currentFarm]);

  const load = async () => {
    if (!currentFarm) return;
    setLoading(true);
    try { const r = await machinesApi.list(currentFarm.id); setMachines(r.data); }
    finally { setLoading(false); }
  };

  const loadLohnhoefe = async () => {
    if (!currentFarm) return;
    try { const r = await lohnhoefeApi.list(currentFarm.id); setLohnhoefe(r.data); }
    catch { setLohnhoefe([]); }
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
      const [type, id] = lendFarmId.split(':');
      let r;
      if (type === 'lohnhof') {
        r = await machinesApi.lendLohnhof(currentFarm.id, lendTarget.id, parseInt(id));
      } else {
        r = await machinesApi.lend(currentFarm.id, lendTarget.id, parseInt(id));
      }
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

  const filtered = machines.filter(m => {
    const q = search.toLowerCase();
    const ok = !q || m.name.toLowerCase().includes(q) || (m.brand || '').toLowerCase().includes(q) ||
      (m.license_plate || '').toLowerCase().includes(q) || m.category.toLowerCase().includes(q);
    if (!ok) return false;
    if (filter === 'available') return !m.is_sold && m.status !== 'verliehen';
    if (filter === 'lent') return m.status === 'verliehen' && !m.is_sold;
    if (filter === 'sold') return m.is_sold;
    return true;
  });

  const counts = {
    total: machines.length,
    available: machines.filter(m => !m.is_sold && m.status === 'verfügbar').length,
    lent: machines.filter(m => m.status === 'verliehen' && !m.is_sold).length,
    sold: machines.filter(m => m.is_sold).length,
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Gesamt', value: counts.total, color: 'text-gray-900' },
          { label: 'Verfügbar', value: counts.available, color: 'text-green-600' },
          { label: 'Verliehen', value: counts.lent, color: 'text-purple-600' },
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
          {(['all', 'available', 'lent', 'sold'] as const).map(f => {
            const labels = { all: 'Alle', available: 'Verfügbar', lent: 'Verliehen', sold: 'Verkauft' };
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
                  <tr key={m.id} className={`border-b border-gray-50 hover:bg-gray-50/60 transition ${m.is_sold ? 'opacity-60' : ''}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{CATEGORY_ICONS[m.category] || '🔩'}</span>
                        <div>
                          <p className="font-semibold text-gray-900">{m.name}</p>
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
                      {m.lent_to_farm_name
                        ? <span className="flex items-center gap-1 text-purple-600 text-xs font-medium"><ArrowLeftRight size={12} />{m.lent_to_farm_name}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
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
                          </>
                        )}
                        <button onClick={() => setDeleteTarget(m)} title="Löschen"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition">
                          <Trash2 size={15} />
                        </button>
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
            {otherFarms.length === 0 && lohnhoefe.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                Keine Zielhöfe verfügbar. Lege unter Hofeinstellungen Lohnhöfe an oder tritt einem weiteren Hof bei.
              </div>
            ) : (
              <Field label="Zielhof">
                <div className="relative">
                  <select value={lendFarmId} onChange={e => setLendFarmId(e.target.value)} className={sel}>
                    <option value="">— Hof auswählen —</option>
                    {lohnhoefe.length > 0 && (
                      <optgroup label="Lohnhöfe (vordefiniert)">
                        {lohnhoefe.map((lh: any) => <option key={`lohnhof:${lh.id}`} value={`lohnhof:${lh.id}`}>{lh.name}</option>)}
                      </optgroup>
                    )}
                    {otherFarms.length > 0 && (
                      <optgroup label="Eigene Höfe">
                        {otherFarms.map((f: any) => <option key={`farm:${f.id}`} value={`farm:${f.id}`}>{f.name} ({f.game_version})</option>)}
                      </optgroup>
                    )}
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
    </div>
  );
}
