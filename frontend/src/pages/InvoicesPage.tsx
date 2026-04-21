import { useEffect, useState } from 'react';
import { useFarmStore } from '../store/farmStore';
import { useAuthStore } from '../store/authStore';
import { invoicesApi, machinesApi } from '../services/api';
import toast from 'react-hot-toast';
import {
  FileText, Plus, X, Send, CreditCard, Eye, Ban,
  ArrowUpRight, ArrowDownRight, CheckCircle, Clock, AlertTriangle
} from 'lucide-react';

// ── Price list from Maschinenring Nord-/Ostfriesland ─────────────
const PRICE_LIST: Record<string, { label: string; unit: string; min: number; max: number }> = {
  'Pflügen':              { label: 'Pflügen',              unit: 'ha', min: 80,  max: 110 },
  'Grubbern':             { label: 'Grubbern',             unit: 'ha', min: 50,  max: 70  },
  'Säen':                 { label: 'Säen',                 unit: 'ha', min: 35,  max: 50  },
  'Spritzen':             { label: 'Spritzen',             unit: 'ha', min: 25,  max: 40  },
  'Düngergabe':           { label: 'Düngergabe',           unit: 'ha', min: 30,  max: 45  },
  'Gülleausbringung':     { label: 'Gülleausbringung',     unit: 'ha', min: 40,  max: 60  },
  'Mähen':                { label: 'Mähen',                unit: 'ha', min: 45,  max: 65  },
  'Feldhäckseln':         { label: 'Feldhäckseln',         unit: 'ha', min: 90,  max: 130 },
  'Mähdrescherarbeiten':  { label: 'Mähdrescherarbeiten',  unit: 'ha', min: 100, max: 140 },
  'Pressen':              { label: 'Pressen',              unit: 'ha', min: 25,  max: 40  },
  'Wickeln':              { label: 'Wickeln',              unit: 'Ballen', min: 8, max: 15 },
  'Zuckerrübenernte':     { label: 'Zuckerrübenernte',     unit: 'ha', min: 180, max: 250 },
  'Kartoffelernte':       { label: 'Kartoffelernte',       unit: 'ha', min: 150, max: 200 },
  'Schlepper 60-80 PS':   { label: 'Schlepper 60-80 PS',   unit: 'h',  min: 35,  max: 50  },
  'Schlepper 100-130 PS': { label: 'Schlepper 100-130 PS', unit: 'h',  min: 55,  max: 75  },
  'Schlepper 180+ PS':    { label: 'Schlepper 180+ PS',    unit: 'h',  min: 90,  max: 120 },
  'Mähdrescher':          { label: 'Mähdrescher',          unit: 'h',  min: 150, max: 200 },
  'Feldhäcksler':         { label: 'Feldhäcksler',         unit: 'h',  min: 120, max: 160 },
  'Teleskoplader':        { label: 'Teleskoplader',        unit: 'h',  min: 40,  max: 60  },
  'Transport':            { label: 'Transport',            unit: 't·km', min: 0.20, max: 0.35 },
  'Sonstige Leistung':    { label: 'Sonstige Leistung',    unit: 'Stück', min: 0, max: 0 },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  'Entwurf':    { label: 'Entwurf',     color: 'bg-gray-100 text-gray-600 border-gray-200',    icon: FileText   },
  'Gestellt':   { label: 'Gestellt',    color: 'bg-blue-100 text-blue-700 border-blue-200',    icon: Send       },
  'Gesehen':    { label: 'Gesehen',     color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Eye     },
  'Bezahlt':    { label: 'Bezahlt',     color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
  'Überfällig': { label: 'Überfällig',  color: 'bg-red-100 text-red-700 border-red-200',       icon: AlertTriangle },
  'Storniert':  { label: 'Storniert',   color: 'bg-gray-100 text-gray-500 border-gray-200',    icon: Ban        },
};

const EMPTY_ITEM = { item_type: 'Sonstige Leistung', description: '', quantity: '1', unit: 'ha', unit_price: '0', field_number: '' };
const UNIT_OPTIONS = ['ha', 't', 'l', 'qm³'];

export default function InvoicesPage() {
  const { currentFarm } = useFarmStore();
  const { user } = useAuthStore();

  const [tab, setTab] = useState<'sent' | 'received'>('received');
  const [sentInvoices, setSentInvoices] = useState<any[]>([]);
  const [receivedInvoices, setReceivedInvoices] = useState<any[]>([]);
  const [allFarms, setAllFarms] = useState<any[]>([]);
  const [capital, setCapital] = useState<any>(null);
  const [fleetServices, setFleetServices] = useState<Array<{ key: string; label: string; unit: string; price: number }>>([]);

  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);

  const [form, setForm] = useState({
    receiver_farm_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    tax_rate: '19',
    notes: '',
    items: [{ ...EMPTY_ITEM }],
  });

  useEffect(() => {
    if (currentFarm) {
      loadAll();
    }
  }, [currentFarm]);

  const loadAll = async () => {
    if (!currentFarm) return;
    const [sent, received, farms] = await Promise.all([
      invoicesApi.listSent(currentFarm.id),
      invoicesApi.listReceived(currentFarm.id),
      invoicesApi.allFarms(),
    ]);
    setSentInvoices(sent.data);
    setReceivedInvoices(received.data);
    setAllFarms(farms.data);

    try {
      const cap = await invoicesApi.getCapital(currentFarm.id);
      setCapital(cap.data);
    } catch { setCapital(null); }

    try {
      const machines = await machinesApi.list(currentFarm.id);
      const lent = (machines.data || []).filter((m: any) => m.status === 'verliehen' && !m.is_sold);
      setFleetServices(lent.map((m: any) => ({
        key: `machine:${m.id}`,
        label: `Verleih: ${m.name}${m.lent_to_farm_name ? ` → ${m.lent_to_farm_name}` : ''}`,
        unit: 'h',
        price: Number(m.hourly_rental_rate || m.daily_rental_rate || 0),
      })));
    } catch {
      setFleetServices([]);
    }
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { ...EMPTY_ITEM }] });
  const removeItem = (i: number) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i: number, field: string, val: string) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: val };
    if (field === 'item_type' && PRICE_LIST[val]) {
      items[i].unit = PRICE_LIST[val].unit;
      const mid = ((PRICE_LIST[val].min + PRICE_LIST[val].max) / 2).toFixed(2);
      items[i].unit_price = mid;
      items[i].description = val;
    }
    if (field === 'item_type' && val.startsWith('machine:')) {
      const service = fleetServices.find(s => s.key === val);
      if (service) {
        items[i].unit = service.unit;
        items[i].unit_price = String(service.price || 0);
        items[i].description = service.label;
      }
    }
    setForm({ ...form, items });
  };

  const calcNet = () => form.items.reduce((s, it) => s + (parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0), 0);
  const calcGross = () => calcNet() * (1 + parseFloat(form.tax_rate || '0') / 100);

  const createInvoice = async () => {
    if (!currentFarm || !form.receiver_farm_id) return toast.error('Bitte Empfänger wählen');
    if (form.items.some(it => !it.description.trim())) return toast.error('Alle Positionen brauchen eine Beschreibung');
    try {
      await invoicesApi.createFromFarm(currentFarm.id, {
        receiver_farm_id: parseInt(form.receiver_farm_id),
        issue_date: new Date(form.issue_date).toISOString(),
        due_date: new Date(form.due_date).toISOString(),
        tax_rate: parseFloat(form.tax_rate),
        notes: form.notes || null,
        items: form.items.map(it => ({
          item_type: Object.prototype.hasOwnProperty.call(PRICE_LIST, it.item_type) ? it.item_type : 'Sonstige Leistung',
          description: it.description,
          quantity: parseFloat(it.quantity),
          unit: it.unit,
          unit_price: parseFloat(it.unit_price),
          field_number: it.field_number || null,
        })),
      });
      toast.success('Rechnung erstellt');
      setShowCreate(false);
      setForm({ receiver_farm_id: '', issue_date: new Date().toISOString().split('T')[0], due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0], tax_rate: '19', notes: '', items: [{ ...EMPTY_ITEM }] });
      loadAll();
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Fehler'); }
  };

  const handleSend = async (id: number) => {
    try { await invoicesApi.send(id); toast.success('Rechnung gestellt'); loadAll(); }
    catch (e: any) { toast.error(e.response?.data?.detail || 'Fehler'); }
  };

  const handlePay = async (id: number) => {
    if (!confirm('Rechnung jetzt bezahlen? Der Betrag wird automatisch in den Finanzen gebucht.')) return;
    try { await invoicesApi.pay(id); toast.success('Bezahlt! Buchung erfolgt.'); loadAll(); }
    catch (e: any) { toast.error(e.response?.data?.detail || 'Fehler'); }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Rechnung wirklich stornieren?')) return;
    try { await invoicesApi.cancel(id); toast.success('Storniert'); loadAll(); }
    catch (e: any) { toast.error(e.response?.data?.detail || 'Fehler'); }
  };

  const fmt = (n: number) => n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('de-DE');

  const displayList = tab === 'sent' ? sentInvoices : receivedInvoices;
  const totalOpen = receivedInvoices.filter(i => ['Gestellt', 'Gesehen', 'Überfällig'].includes(i.status)).reduce((s: number, i: any) => s + i.total_gross, 0);
  const totalReceivable = sentInvoices.filter(i => ['Gestellt', 'Gesehen', 'Überfällig'].includes(i.status)).reduce((s: number, i: any) => s + i.total_gross, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rechnungsverwaltung</h1>
            <p className="text-gray-500 text-sm">Rechnungen zwischen Höfen stellen und bezahlen</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Neue Rechnung
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card border-l-4 border-l-green-500">
          <p className="text-xs text-gray-500">Ausstehend (Forderungen)</p>
          <p className="text-xl font-bold text-green-600 mt-1">{fmt(totalReceivable)}</p>
        </div>
        <div className="card border-l-4 border-l-red-500">
          <p className="text-xs text-gray-500">Offen (Verbindlichkeiten)</p>
          <p className="text-xl font-bold text-red-600 mt-1">{fmt(totalOpen)}</p>
        </div>
        <div className="card border-l-4 border-l-blue-500">
          <p className="text-xs text-gray-500">Gestellte Rechnungen</p>
          <p className="text-xl font-bold text-blue-600 mt-1">{sentInvoices.length}</p>
        </div>
        <div className="card border-l-4 border-l-amber-500">
          <p className="text-xs text-gray-500">Erhaltene Rechnungen</p>
          <p className="text-xl font-bold text-amber-600 mt-1">{receivedInvoices.length}</p>
        </div>
      </div>

      {/* Capital info */}
      {capital && (
        <div className="card bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">Hofkapital</p>
              <div className="flex items-center gap-6 mt-1">
                <div><span className="text-xs text-gray-500">Startkapital: </span><span className="font-bold text-gray-900">{fmt(capital.starting_capital)}</span></div>
                <div><span className="text-xs text-gray-500">Aktuelles Guthaben: </span><span className={`font-bold text-lg ${capital.current_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(capital.current_balance)}</span></div>
              </div>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${capital.current_balance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {capital.current_balance >= 0 ? <ArrowUpRight className="text-green-600 w-6 h-6" /> : <ArrowDownRight className="text-red-600 w-6 h-6" />}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="card p-0 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setTab('received')}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${tab === 'received' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <ArrowDownRight size={16} /> Erhaltene Rechnungen
            {receivedInvoices.filter(i => i.status === 'Gestellt').length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {receivedInvoices.filter(i => i.status === 'Gestellt').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('sent')}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${tab === 'sent' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <ArrowUpRight size={16} /> Gestellte Rechnungen
          </button>
        </div>

        <div className="p-4">
          {displayList.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText className="mx-auto mb-3 opacity-30" size={40} />
              <p>{tab === 'sent' ? 'Noch keine Rechnungen gestellt' : 'Keine Rechnungen erhalten'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayList.map((inv: any) => {
                const sc = STATUS_CONFIG[inv.status] || STATUS_CONFIG['Entwurf'];
                const Icon = sc.icon;
                return (
                  <div key={inv.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <FileText size={18} className="text-indigo-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 text-sm">{inv.invoice_number}</p>
                          <span className={`badge border text-xs ${sc.color} flex items-center gap-1`}>
                            <Icon size={10} /> {sc.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {tab === 'received' ? `Von: ${inv.sender_farm_name}` : `An: ${inv.receiver_farm_name}`}
                          {' · '} Fällig: {fmtDate(inv.due_date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{fmt(inv.total_gross)}</p>
                        <p className="text-xs text-gray-400">inkl. {inv.tax_rate}% MwSt.</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => setShowDetail(inv)} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Details">
                          <Eye size={16} />
                        </button>
                        {tab === 'sent' && inv.status === 'Entwurf' && (
                          <button onClick={() => handleSend(inv.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Stellen">
                            <Send size={16} />
                          </button>
                        )}
                        {tab === 'received' && ['Gestellt', 'Gesehen', 'Überfällig'].includes(inv.status) && (
                          <button onClick={() => handlePay(inv.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Bezahlen">
                            <CreditCard size={16} />
                          </button>
                        )}
                        {tab === 'sent' && !['Bezahlt', 'Storniert'].includes(inv.status) && (
                          <button onClick={() => handleCancel(inv.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Stornieren">
                            <Ban size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-bold text-xl">Neue Rechnung erstellen</h2>
              <button onClick={() => setShowCreate(false)}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-5">
              {/* Header fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Empfänger-Hof *</label>
                  <select className="input" value={form.receiver_farm_id} onChange={e => setForm({...form, receiver_farm_id: e.target.value})}>
                    <option value="">— Hof wählen —</option>
                    {allFarms.filter((f: any) => f.id !== currentFarm?.id).map((f: any) => <option key={f.id} value={f.id}>{f.name} ({f.game_version})</option>)}
                  </select>
                  {allFarms.length === 0 && <p className="text-xs text-amber-600 mt-1">⚠️ Keine anderen Höfe gefunden. Weitere Höfe müssen registriert sein.</p>}
                </div>
                <div>
                  <label className="label">Rechnungsdatum</label>
                  <input className="input" type="date" value={form.issue_date} onChange={e => setForm({...form, issue_date: e.target.value})} />
                </div>
                <div>
                  <label className="label">Fällig bis</label>
                  <input className="input" type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} />
                </div>
                <div>
                  <label className="label">MwSt. (%)</label>
                  <select className="input" value={form.tax_rate} onChange={e => setForm({...form, tax_rate: e.target.value})}>
                    <option value="19">19%</option>
                    <option value="7">7%</option>
                    <option value="0">0% (steuerfrei)</option>
                  </select>
                </div>
              </div>

              {/* Line items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Positionen</h3>
                  <button onClick={addItem} className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-medium">
                    <Plus size={14} /> Position hinzufügen
                  </button>
                </div>
                <div className="space-y-3">
                  {form.items.map((item, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="grid grid-cols-12 gap-3 items-end">
                        <div className="col-span-3">
                          <label className="label text-xs">Leistungsart</label>
                          <select className="input text-sm" value={item.item_type} onChange={e => updateItem(i, 'item_type', e.target.value)}>
                            {Object.keys(PRICE_LIST).map(k => <option key={k}>{k}</option>)}
                            {fleetServices.length > 0 && (
                              <optgroup label="Verliehene Fahrzeuge">
                                {fleetServices.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                              </optgroup>
                            )}
                          </select>
                        </div>
                        <div className="col-span-3">
                          <label className="label text-xs">Beschreibung</label>
                          <input className="input text-sm" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="z.B. Pflügen Feld F03" />
                        </div>
                        <div className="col-span-1">
                          <label className="label text-xs">Feldnr.</label>
                          <input className="input text-sm" value={item.field_number} onChange={e => updateItem(i, 'field_number', e.target.value)} placeholder="F01" />
                        </div>
                        <div className="col-span-2">
                          <label className="label text-xs">Menge</label>
                          <input className="input text-sm" type="number" step="0.01" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} />
                        </div>
                        <div className="col-span-1">
                          <label className="label text-xs">Einheit</label>
                          <select className="input text-sm" value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)}>
                            {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="label text-xs">Preis/Einh.</label>
                          <input className="input text-sm" type="number" step="0.01" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', e.target.value)} />
                        </div>
                        <div className="col-span-1 flex items-end gap-2">
                          <div className="flex-1">
                            <label className="label text-xs">Gesamt</label>
                            <p className="text-sm font-bold text-gray-900 py-2">{((parseFloat(item.quantity)||0)*(parseFloat(item.unit_price)||0)).toLocaleString('de-DE',{style:'currency',currency:'EUR'})}</p>
                          </div>
                          {form.items.length > 1 && (
                            <button onClick={() => removeItem(i)} className="mb-2 text-red-400 hover:text-red-600"><X size={16} /></button>
                          )}
                        </div>
                      </div>
                      {item.item_type && PRICE_LIST[item.item_type] && PRICE_LIST[item.item_type].min > 0 && (
                        <p className="text-xs text-gray-400 mt-2">
                          💡 Maschinenring-Preisempfehlung N/Ostfriesland: {PRICE_LIST[item.item_type].min}–{PRICE_LIST[item.item_type].max} €/{PRICE_LIST[item.item_type].unit}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="label">Notizen / Zahlungshinweis</label>
                <textarea className="input h-20 resize-none" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="z.B. Zahlbar innerhalb 14 Tagen ohne Abzug" />
              </div>

              {/* Totals */}
              <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Nettobetrag</span>
                  <span className="font-semibold">{calcNet().toLocaleString('de-DE',{style:'currency',currency:'EUR'})}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">MwSt. ({form.tax_rate}%)</span>
                  <span className="font-semibold">{(calcGross()-calcNet()).toLocaleString('de-DE',{style:'currency',currency:'EUR'})}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-indigo-300 pt-2">
                  <span>Gesamtbetrag</span>
                  <span className="text-indigo-700">{calcGross().toLocaleString('de-DE',{style:'currency',currency:'EUR'})}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t">
              <button onClick={createInvoice} className="btn-primary flex-1 py-3">Rechnung erstellen</button>
              <button onClick={() => setShowCreate(false)} className="btn-secondary px-6">Abbrechen</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <InvoiceDetail
          invoice={showDetail}
          onClose={() => setShowDetail(null)}
          onSend={handleSend}
          onPay={handlePay}
          onCancel={handleCancel}
          isSender={showDetail.sender_farm_id === currentFarm?.id}
        />
      )}
    </div>
  );
}

function InvoiceDetail({ invoice, onClose, onSend, onPay, onCancel, isSender }: any) {
  const fmt = (n: number) => n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
  const sc = STATUS_CONFIG[invoice.status] || STATUS_CONFIG['Entwurf'];
  const Icon = sc.icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="font-bold text-xl">{invoice.invoice_number}</h2>
            <span className={`badge border text-xs ${sc.color} flex items-center gap-1 mt-1`}>
              <Icon size={10} /> {sc.label}
            </span>
          </div>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* From / To */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Von</p>
              <p className="font-bold text-gray-900">{invoice.sender_farm_name}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">An</p>
              <p className="font-bold text-gray-900">{invoice.receiver_farm_name}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <div><p className="text-xs text-gray-500">Rechnungsdatum</p><p className="font-medium">{new Date(invoice.issue_date).toLocaleDateString('de-DE')}</p></div>
            <div><p className="text-xs text-gray-500">Fällig bis</p><p className="font-medium">{new Date(invoice.due_date).toLocaleDateString('de-DE')}</p></div>
            {invoice.paid_date && <div><p className="text-xs text-gray-500">Bezahlt am</p><p className="font-medium text-green-600">{new Date(invoice.paid_date).toLocaleDateString('de-DE')}</p></div>}
          </div>

          {/* Items table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs">
                  <th className="text-left px-3 py-2 rounded-l">Beschreibung</th>
                  <th className="text-left px-3 py-2">Feldnr.</th>
                  <th className="text-right px-3 py-2">Menge</th>
                  <th className="text-right px-3 py-2">Einheit</th>
                  <th className="text-right px-3 py-2">Preis</th>
                  <th className="text-right px-3 py-2 rounded-r">Gesamt</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items?.map((item: any) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="px-3 py-2.5 font-medium">{item.description}</td>
                    <td className="px-3 py-2.5 text-gray-500">{item.field_number || '—'}</td>
                    <td className="px-3 py-2.5 text-right">{item.quantity.toLocaleString('de-DE')}</td>
                    <td className="px-3 py-2.5 text-right text-gray-500">{item.unit}</td>
                    <td className="px-3 py-2.5 text-right">{fmt(item.unit_price)}</td>
                    <td className="px-3 py-2.5 text-right font-bold">{fmt(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-1">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Netto</span><span>{fmt(invoice.total_net)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">MwSt. ({invoice.tax_rate}%)</span><span>{fmt(invoice.total_gross - invoice.total_net)}</span></div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200"><span>Gesamt</span><span className="text-indigo-700">{fmt(invoice.total_gross)}</span></div>
          </div>

          {invoice.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs text-amber-700 font-medium mb-1">Hinweis</p>
              <p className="text-sm text-gray-700">{invoice.notes}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t">
          {isSender && invoice.status === 'Entwurf' && (
            <button onClick={() => { onSend(invoice.id); onClose(); }} className="btn-primary flex items-center gap-2">
              <Send size={16} /> Jetzt stellen
            </button>
          )}
          {!isSender && ['Gestellt', 'Gesehen', 'Überfällig'].includes(invoice.status) && (
            <button onClick={() => { onPay(invoice.id); onClose(); }} className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-700">
              <CreditCard size={16} /> Jetzt bezahlen
            </button>
          )}
          {isSender && !['Bezahlt', 'Storniert'].includes(invoice.status) && (
            <button onClick={() => { onCancel(invoice.id); onClose(); }} className="btn-danger flex items-center gap-2">
              <Ban size={16} /> Stornieren
            </button>
          )}
          <button onClick={onClose} className="btn-secondary ml-auto">Schließen</button>
        </div>
      </div>
    </div>
  );
}
