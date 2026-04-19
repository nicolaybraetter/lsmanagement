import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFarmStore } from '../store/farmStore';
import { useAuthStore } from '../store/authStore';
import { farmsApi, invoicesApi } from '../services/api';
import toast from 'react-hot-toast';
import { Settings, Wallet, Save, Edit2, LogOut, Trash2 } from 'lucide-react';

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
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

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
    }
  }, [currentFarm]);

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

      {/* Delete farm — only for owner */}
      {currentFarm && user && currentFarm.owner_id === user.id && (
        <div className="card border-red-300 bg-red-50/40">
          <h2 className="font-bold text-red-700 text-lg mb-1 flex items-center gap-2">
            <Trash2 size={18} /> Hof löschen
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Der Hof <span className="font-semibold">{currentFarm.name}</span> wird dauerhaft gelöscht — inklusive aller Maschinen, Felder, Finanzen, Tiere, Aufgaben und Mitglieder. Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
          {!deleteConfirm ? (
            <button onClick={() => { setDeleteConfirm(true); setDeleteInput(''); }}
              className="flex items-center gap-2 bg-white border border-red-300 text-red-600 hover:bg-red-600 hover:text-white font-semibold px-4 py-2.5 rounded-xl transition text-sm">
              <Trash2 size={15} /> Hof löschen
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-red-700">
                Zur Bestätigung den Hofnamen eingeben: <span className="font-mono bg-red-100 px-1 rounded">{currentFarm.name}</span>
              </p>
              <input
                className="input"
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value)}
                placeholder={currentFarm.name}
                autoFocus
              />
              <div className="flex gap-3">
                <button onClick={() => { setDeleteConfirm(false); setDeleteInput(''); }} className="btn-secondary text-sm">Abbrechen</button>
                <button
                  disabled={deleting || deleteInput !== currentFarm.name}
                  onClick={async () => {
                    if (!currentFarm || !user) return;
                    setDeleting(true);
                    try {
                      await farmsApi.deleteFarm(currentFarm.id);
                      toast.success(`Hof „${currentFarm.name}" wurde gelöscht`);
                      const remaining = farms.filter((f: any) => f.id !== currentFarm.id);
                      setFarms(remaining);
                      setCurrentFarm(remaining.length > 0 ? remaining[0] : null);
                      navigate('/dashboard');
                    } catch (e: any) {
                      toast.error(e.response?.data?.detail || 'Fehler beim Löschen');
                    } finally {
                      setDeleting(false);
                    }
                  }}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-semibold px-4 py-2.5 rounded-xl transition text-sm">
                  {deleting ? '…' : <><Trash2 size={15} /> Endgültig löschen</>}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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
