import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFarmStore } from '../store/farmStore';
import { useAuthStore } from '../store/authStore';
import { farmsApi, invoicesApi, lohnhoefeApi } from '../services/api';
import toast from 'react-hot-toast';
import { Settings, Wallet, Save, Edit2, LogOut, Building2, Plus, Trash2, Phone, User, X, Pencil } from 'lucide-react';

export default function FarmSettingsPage() {
  const navigate = useNavigate();
  const { currentFarm, setCurrentFarm, farms, setFarms } = useFarmStore();
  const { user } = useAuthStore();
  const [farmForm, setFarmForm] = useState({ name: '', description: '', location: '', game_version: 'LS25', total_area: '0' });
  const [capital, setCapital] = useState<any>(null);
  const [capitalForm, setCapitalForm] = useState({ starting_capital: '0', current_balance: '' });
  const [saving, setSaving] = useState(false);
  const [savingCapital, setSavingCapital] = useState(false);
  const [editCapital, setEditCapital] = useState(false);
  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const [lohnhoefe, setLohnhoefe] = useState<any[]>([]);
  const [lohnhofForm, setLohnhofForm] = useState({ name: '', contact_person: '', phone: '', notes: '' });
  const [editingLohnhof, setEditingLohnhof] = useState<any | null>(null);
  const [showLohnhofForm, setShowLohnhofForm] = useState(false);
  const [savingLohnhof, setSavingLohnhof] = useState(false);

  const isOwnerOrManager = currentFarm?.owner_id === user?.id;

  useEffect(() => {
    if (currentFarm) {
      setFarmForm({
        name: currentFarm.name,
        description: (currentFarm as any).description || '',
        location: (currentFarm as any).location || '',
        game_version: currentFarm.game_version,
        total_area: String(currentFarm.total_area),
      });
      loadCapital();
      loadLohnhoefe();
    }
  }, [currentFarm]);

  const loadLohnhoefe = async () => {
    if (!currentFarm) return;
    try {
      const r = await lohnhoefeApi.list(currentFarm.id);
      setLohnhoefe(r.data);
    } catch { setLohnhoefe([]); }
  };

  const saveLohnhof = async () => {
    if (!currentFarm || !lohnhofForm.name.trim()) return toast.error('Name erforderlich');
    setSavingLohnhof(true);
    try {
      if (editingLohnhof) {
        await lohnhoefeApi.update(currentFarm.id, editingLohnhof.id, lohnhofForm);
        toast.success('Lohnhof aktualisiert');
      } else {
        await lohnhoefeApi.create(currentFarm.id, lohnhofForm);
        toast.success('Lohnhof hinzugefügt');
      }
      setShowLohnhofForm(false);
      setEditingLohnhof(null);
      setLohnhofForm({ name: '', contact_person: '', phone: '', notes: '' });
      loadLohnhoefe();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Fehler');
    } finally { setSavingLohnhof(false); }
  };

  const deleteLohnhof = async (id: number) => {
    if (!currentFarm || !confirm('Lohnhof wirklich entfernen?')) return;
    try {
      await lohnhoefeApi.delete(currentFarm.id, id);
      toast.success('Lohnhof entfernt');
      loadLohnhoefe();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Fehler');
    }
  };

  const startEditLohnhof = (lh: any) => {
    setEditingLohnhof(lh);
    setLohnhofForm({ name: lh.name, contact_person: lh.contact_person || '', phone: lh.phone || '', notes: lh.notes || '' });
    setShowLohnhofForm(true);
  };

  const loadCapital = async () => {
    if (!currentFarm) return;
    try {
      const r = await invoicesApi.getCapital(currentFarm.id);
      setCapital(r.data);
      setCapitalForm({ starting_capital: String(r.data.starting_capital), current_balance: '' });
    } catch {
      setCapital(null);
    }
  };

  const saveFarm = async () => {
    if (!currentFarm || !isOwnerOrManager) return;
    setSaving(true);
    try {
      const res = await farmsApi.update(currentFarm.id, { ...farmForm, total_area: parseInt(farmForm.total_area) || 0 });
      setCurrentFarm(res.data);
      toast.success('Hof gespeichert');
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Fehler');
    } finally { setSaving(false); }
  };

  const saveCapital = async () => {
    if (!currentFarm || !isOwnerOrManager) return;
    setSavingCapital(true);
    try {
      const payload: any = { starting_capital: parseFloat(capitalForm.starting_capital) || 0 };
      if (capitalForm.current_balance !== '') {
        payload.current_balance = parseFloat(capitalForm.current_balance);
      }
      const res = await invoicesApi.setCapital(currentFarm.id, payload);
      setCapital(res.data);
      setCapitalForm({ starting_capital: String(res.data.starting_capital), current_balance: '' });
      setEditCapital(false);
      toast.success('Startkapital gespeichert');
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Fehler');
    } finally { setSavingCapital(false); }
  };

  const fmt = (n: number) => n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });

  if (!currentFarm) return <div className="text-center py-16 text-gray-400">Kein Hof ausgewählt</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-700 rounded-xl flex items-center justify-center">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hof-Einstellungen</h1>
          <p className="text-gray-500 text-sm">{currentFarm.name}</p>
        </div>
      </div>

      {/* Farm details */}
      <div className="card">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Edit2 size={16} /> Hof-Daten</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Hofname *</label>
            <input className="input" value={farmForm.name} onChange={e => setFarmForm({...farmForm, name: e.target.value})} disabled={!isOwnerOrManager} />
          </div>
          <div>
            <label className="label">Spielversion</label>
            <select className="input" value={farmForm.game_version} onChange={e => setFarmForm({...farmForm, game_version: e.target.value})} disabled={!isOwnerOrManager}>
              <option value="LS25">Farming Simulator 25</option>
              <option value="LS22">Farming Simulator 22</option>
            </select>
          </div>
          <div>
            <label className="label">Gesamtfläche (ha)</label>
            <input className="input" type="number" value={farmForm.total_area} onChange={e => setFarmForm({...farmForm, total_area: e.target.value})} disabled={!isOwnerOrManager} />
          </div>
          <div className="col-span-2">
            <label className="label">Standort / Map</label>
            <input className="input" value={farmForm.location} onChange={e => setFarmForm({...farmForm, location: e.target.value})} placeholder="z.B. Friesland, Elmcreek..." disabled={!isOwnerOrManager} />
          </div>
          <div className="col-span-2">
            <label className="label">Beschreibung</label>
            <textarea className="input h-24 resize-none" value={farmForm.description} onChange={e => setFarmForm({...farmForm, description: e.target.value})} disabled={!isOwnerOrManager} />
          </div>
        </div>
        {isOwnerOrManager && (
          <button onClick={saveFarm} disabled={saving} className="btn-primary mt-4 flex items-center gap-2">
            <Save size={16} /> {saving ? 'Speichern...' : 'Änderungen speichern'}
          </button>
        )}
      </div>

      {/* Starting Capital */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2"><Wallet size={16} className="text-green-600" /> Startkapital & Guthaben</h2>
          {isOwnerOrManager && !editCapital && (
            <button onClick={() => setEditCapital(true)} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">Bearbeiten</button>
          )}
        </div>

        {capital && !editCapital ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Startkapital (definiert)</p>
              <p className="text-2xl font-bold text-gray-900">{fmt(capital.starting_capital)}</p>
            </div>
            <div className={`rounded-xl p-4 ${capital.current_balance >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-xs text-gray-500 mb-1">Aktuelles Guthaben</p>
              <p className={`text-2xl font-bold ${capital.current_balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {fmt(capital.current_balance)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {capital.current_balance >= capital.starting_capital
                  ? `+${fmt(capital.current_balance - capital.starting_capital)} seit Start`
                  : `${fmt(capital.current_balance - capital.starting_capital)} seit Start`}
              </p>
            </div>
          </div>
        ) : !capital && !editCapital ? (
          <div className="text-center py-8 text-gray-400">
            <Wallet className="mx-auto mb-2 opacity-30" size={36} />
            <p className="text-sm mb-3">Noch kein Startkapital definiert</p>
            {isOwnerOrManager && (
              <button onClick={() => setEditCapital(true)} className="btn-primary text-sm">Startkapital festlegen</button>
            )}
          </div>
        ) : null}

        {editCapital && isOwnerOrManager && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
              <strong>Hinweis:</strong> Das Startkapital spiegelt das Betriebskapital bei Spielstart wider. Es wird beim Bezahlen/Erhalten von Rechnungen automatisch angepasst.
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Startkapital (€) *</label>
                <input
                  className="input"
                  type="number"
                  step="1000"
                  value={capitalForm.starting_capital}
                  onChange={e => setCapitalForm({...capitalForm, starting_capital: e.target.value})}
                  placeholder="z.B. 500000"
                />
                <p className="text-xs text-gray-400 mt-1">Startgeld bei LS-Spielbeginn</p>
              </div>
              <div>
                <label className="label">Aktuelles Guthaben (€)</label>
                <input
                  className="input"
                  type="number"
                  step="1000"
                  value={capitalForm.current_balance}
                  onChange={e => setCapitalForm({...capitalForm, current_balance: e.target.value})}
                  placeholder={`Leer lassen = Startkapital`}
                />
                <p className="text-xs text-gray-400 mt-1">Leer lassen = gleich Startkapital</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={saveCapital} disabled={savingCapital} className="btn-primary flex items-center gap-2">
                <Save size={16} /> {savingCapital ? 'Speichern...' : 'Kapital speichern'}
              </button>
              <button onClick={() => setEditCapital(false)} className="btn-secondary">Abbrechen</button>
            </div>
          </div>
        )}

        {!isOwnerOrManager && (
          <p className="text-sm text-gray-400 mt-2">Nur Eigentümer und Manager können das Startkapital ändern.</p>
        )}
      </div>

      {/* Lohnhöfe */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Building2 size={16} className="text-orange-500" /> Lohnhöfe
            <span className="text-xs font-normal text-gray-400">({lohnhoefe.length}/10)</span>
          </h2>
          {isOwnerOrManager && lohnhoefe.length < 10 && !showLohnhofForm && (
            <button onClick={() => { setEditingLohnhof(null); setLohnhofForm({ name: '', contact_person: '', phone: '', notes: '' }); setShowLohnhofForm(true); }}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
              <Plus size={14} /> Hinzufügen
            </button>
          )}
        </div>

        <p className="text-xs text-gray-500 mb-4">
          Vordefinierte Partnerhöfe für die Lohnarbeit. Diese stehen in der Rechnungsverwaltung und Fahrzeugverleihe zur Auswahl.
        </p>

        {lohnhoefe.length === 0 && !showLohnhofForm && (
          <div className="text-center py-8 text-gray-400">
            <Building2 className="mx-auto mb-2 opacity-30" size={36} />
            <p className="text-sm mb-3">Noch keine Lohnhöfe definiert</p>
            {isOwnerOrManager && (
              <button onClick={() => setShowLohnhofForm(true)} className="btn-primary text-sm">Ersten Lohnhof anlegen</button>
            )}
          </div>
        )}

        <div className="space-y-2 mb-4">
          {lohnhoefe.map((lh: any) => (
            <div key={lh.id} className="flex items-start justify-between p-3 rounded-xl border border-gray-200 bg-gray-50 hover:border-orange-200 transition">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{lh.name}</p>
                {(lh.contact_person || lh.phone) && (
                  <div className="flex items-center gap-3 mt-1">
                    {lh.contact_person && <span className="flex items-center gap-1 text-xs text-gray-500"><User size={10} />{lh.contact_person}</span>}
                    {lh.phone && <span className="flex items-center gap-1 text-xs text-gray-500"><Phone size={10} />{lh.phone}</span>}
                  </div>
                )}
                {lh.notes && <p className="text-xs text-gray-400 mt-1 truncate">{lh.notes}</p>}
              </div>
              {isOwnerOrManager && (
                <div className="flex gap-1 ml-3">
                  <button onClick={() => startEditLohnhof(lh)} className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"><Pencil size={14} /></button>
                  <button onClick={() => deleteLohnhof(lh.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 size={14} /></button>
                </div>
              )}
            </div>
          ))}
        </div>

        {showLohnhofForm && isOwnerOrManager && (
          <div className="border border-orange-200 rounded-xl p-4 bg-orange-50/30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 text-sm">{editingLohnhof ? 'Lohnhof bearbeiten' : 'Neuer Lohnhof'}</h3>
              <button onClick={() => { setShowLohnhofForm(false); setEditingLohnhof(null); }} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">Hofname *</label>
                <input className="input" value={lohnhofForm.name} onChange={e => setLohnhofForm({...lohnhofForm, name: e.target.value})} placeholder="z.B. Hof Müller" autoFocus />
              </div>
              <div>
                <label className="label">Ansprechpartner</label>
                <input className="input" value={lohnhofForm.contact_person} onChange={e => setLohnhofForm({...lohnhofForm, contact_person: e.target.value})} placeholder="Max Müller" />
              </div>
              <div>
                <label className="label">Telefon</label>
                <input className="input" value={lohnhofForm.phone} onChange={e => setLohnhofForm({...lohnhofForm, phone: e.target.value})} placeholder="+49 123 456789" />
              </div>
              <div className="col-span-2">
                <label className="label">Notizen</label>
                <input className="input" value={lohnhofForm.notes} onChange={e => setLohnhofForm({...lohnhofForm, notes: e.target.value})} placeholder="Optional" />
              </div>
            </div>
            <div className="flex gap-3 mt-3">
              <button onClick={saveLohnhof} disabled={savingLohnhof || !lohnhofForm.name.trim()} className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50">
                <Save size={14} /> {savingLohnhof ? 'Speichern...' : editingLohnhof ? 'Aktualisieren' : 'Hinzufügen'}
              </button>
              <button onClick={() => { setShowLohnhofForm(false); setEditingLohnhof(null); }} className="btn-secondary text-sm">Abbrechen</button>
            </div>
          </div>
        )}

        {!isOwnerOrManager && (
          <p className="text-sm text-gray-400 mt-2">Nur Eigentümer und Manager können Lohnhöfe verwalten.</p>
        )}
      </div>

      {/* Leave farm — only for non-owners */}
      {currentFarm && user && currentFarm.owner_id !== user.id && (
        <div className="card border-red-200 bg-red-50/40">
          <h2 className="font-bold text-red-700 text-lg mb-1 flex items-center gap-2">
            <LogOut size={18} /> Hof verlassen
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Du verlässt den Hof <span className="font-semibold">{currentFarm.name}</span> und verlierst den Zugriff auf alle Daten dieses Hofes.
          </p>
          {!leaveConfirm ? (
            <button onClick={() => setLeaveConfirm(true)}
              className="flex items-center gap-2 bg-white border border-red-300 text-red-600 hover:bg-red-600 hover:text-white font-semibold px-4 py-2.5 rounded-xl transition text-sm">
              <LogOut size={15} /> Hof verlassen
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-red-700">Bist du sicher? Diese Aktion kann nicht rückgängig gemacht werden.</p>
              <div className="flex gap-3">
                <button onClick={() => setLeaveConfirm(false)} className="btn-secondary text-sm">Abbrechen</button>
                <button disabled={leaving} onClick={async () => {
                  if (!currentFarm || !user) return;
                  setLeaving(true);
                  try {
                    await farmsApi.removeMember(currentFarm.id, user.id);
                    toast.success(`Du hast den Hof „${currentFarm.name}" verlassen`);
                    const remaining = farms.filter((f: any) => f.id !== currentFarm.id);
                    setFarms(remaining);
                    setCurrentFarm(remaining.length > 0 ? remaining[0] : null);
                    navigate('/dashboard');
                  } catch (e: any) {
                    toast.error(e.response?.data?.detail || 'Fehler');
                  } finally {
                    setLeaving(false);
                  }
                }} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-xl transition text-sm">
                  {leaving ? '…' : <><LogOut size={15} /> Jetzt verlassen</>}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
