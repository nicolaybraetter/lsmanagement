import { useEffect, useState } from 'react';
import { useFarmStore } from '../store/farmStore';
import { fieldsApi, cropPlansApi } from '../services/api';
import toast from 'react-hot-toast';
import { RotateCcw, Plus, X, ChevronDown, ChevronUp, Trash2, BookOpen } from 'lucide-react';

const CROPS_LS22 = [
  'Gras','Klee','Silomais',
  'Mais','Weizen','Gerste','Hafer','Roggen','Triticale','Sorghum',
  'Raps','Sonnenblume','Soja',
  'Zuckerrübe','Kartoffel','Zwiebel','Karotten','Pastinaken','Rote Bete',
  'Baumwolle','Zuckerrohr','Weintrauben','Oliven','Pappel','Ölrettich',
  'Sonstiges',
];
const CROPS_LS25_EXTRA = ['Spinat','Erbsen','Grüne Bohnen','Reis','Langkornreis'];
const ALL_CROPS = [...CROPS_LS22, ...CROPS_LS25_EXTRA];

const CROP_EMOJIS: Record<string, string> = {
  'Gras':'🌿','Klee':'🍀','Silomais':'🌽','Mais':'🌽','Weizen':'🌾','Gerste':'🌾',
  'Hafer':'🌾','Roggen':'🌾','Triticale':'🌾','Sorghum':'🌿','Raps':'🌼',
  'Sonnenblume':'🌻','Soja':'🫘','Zuckerrübe':'🌱','Kartoffel':'🥔','Zwiebel':'🧅',
  'Karotten':'🥕','Pastinaken':'🥕','Rote Bete':'🌱','Baumwolle':'🌸',
  'Zuckerrohr':'🎋','Weintrauben':'🍇','Oliven':'🫒','Pappel':'🌳',
  'Ölrettich':'🌱','Spinat':'🥬','Erbsen':'🫛','Grüne Bohnen':'🫘',
  'Reis':'🌾','Langkornreis':'🌾','Sonstiges':'🌱',
};

const FRIESLAND_ROTATION = [
  { name: 'Friesland Standard', rotation: ['Mais','Winterweizen','Wintergerste','Raps'], info: 'Typische 4-Felder-Rotation für Friesland' },
  { name: 'Grünlandbasiert', rotation: ['Gras','Gras','Silomais','Winterroggen'], info: 'Für milchviehhaltende Betriebe' },
  { name: 'Intensiv Ackerbau', rotation: ['Winterweizen','Zuckerrübe','Wintergerste','Raps','Winterweizen'], info: '5-Felder mit Rübenanteil' },
  { name: 'Kartoffel-Betrieb', rotation: ['Kartoffel','Winterweizen','Mais','Wintergerste'], info: 'Mit Kartoffel als Hauptkultur' },
];

const EMPTY_PLAN = { name: '', description: '', game_version: 'Beide' };

export default function CropRotationPage() {
  const { currentFarm } = useFarmStore();
  const [fields, setFields] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [rotations, setRotations] = useState<Record<number, any[]>>({});
  const [addForm, setAddForm] = useState<any>(null);

  // Custom plans
  const [customPlans, setCustomPlans] = useState<any[]>([]);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planForm, setPlanForm] = useState(EMPTY_PLAN);
  const [planCrops, setPlanCrops] = useState<string[]>([]);
  const [pickCrop, setPickCrop] = useState('Mais');
  const [savingPlan, setSavingPlan] = useState(false);

  useEffect(() => {
    if (currentFarm) { load(); loadCustomPlans(); }
  }, [currentFarm]);

  const load = async () => {
    if (!currentFarm) return;
    const r = await fieldsApi.list(currentFarm.id);
    setFields(r.data);
  };

  const loadCustomPlans = async () => {
    if (!currentFarm) return;
    try {
      const r = await cropPlansApi.list(currentFarm.id);
      setCustomPlans(r.data);
    } catch { setCustomPlans([]); }
  };

  const loadRotation = async (fieldId: number) => {
    if (!currentFarm) return;
    const r = await fieldsApi.getCropRotation(currentFarm.id, fieldId);
    setRotations(prev => ({ ...prev, [fieldId]: r.data }));
  };

  const toggleField = (fieldId: number) => {
    if (expanded === fieldId) { setExpanded(null); return; }
    setExpanded(fieldId);
    loadRotation(fieldId);
  };

  const saveRotation = async () => {
    if (!currentFarm || !addForm) return;
    try {
      await fieldsApi.addCropRotation(currentFarm.id, addForm.fieldId, {
        field_id: addForm.fieldId, year: parseInt(addForm.year), crop: addForm.crop,
        yield_amount: addForm.yield_amount ? parseFloat(addForm.yield_amount) : null,
        sowing_date: addForm.sowing_date || null, harvest_date: addForm.harvest_date || null,
        notes: addForm.notes || null, fertilizer_used: addForm.fertilizer_used || null,
      });
      toast.success('Fruchtfolge eingetragen');
      setAddForm(null);
      loadRotation(addForm.fieldId);
    } catch { toast.error('Fehler'); }
  };

  const saveCustomPlan = async () => {
    if (!currentFarm || !planForm.name.trim()) return toast.error('Name erforderlich');
    if (planCrops.length === 0) return toast.error('Mindestens eine Frucht hinzufügen');
    setSavingPlan(true);
    try {
      const gv = planForm.game_version === 'Beide' ? null : planForm.game_version;
      const r = await cropPlansApi.create(currentFarm.id, { name: planForm.name, description: planForm.description || null, crops: planCrops, game_version: gv });
      setCustomPlans(prev => [r.data, ...prev]);
      toast.success('Fruchtfolge gespeichert');
      setShowPlanForm(false);
      setPlanForm(EMPTY_PLAN);
      setPlanCrops([]);
    } catch { toast.error('Fehler beim Speichern'); }
    finally { setSavingPlan(false); }
  };

  const deleteCustomPlan = async (planId: number) => {
    if (!currentFarm || !confirm('Fruchtfolge wirklich löschen?')) return;
    await cropPlansApi.delete(currentFarm.id, planId);
    setCustomPlans(prev => prev.filter(p => p.id !== planId));
    toast.success('Fruchtfolge gelöscht');
  };

  const cropTag = (c: string, i: number, total: number) => (
    <div key={i} className="flex items-center gap-1">
      <span className="bg-white border border-green-200 rounded-lg px-2 py-1 text-xs font-medium text-gray-700">
        {CROP_EMOJIS[c] || '🌱'} {c}
      </span>
      {i < total - 1 && <span className="text-green-400 text-xs">→</span>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center"><RotateCcw className="w-5 h-5 text-white" /></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fruchtfolgeplanung</h1>
          <p className="text-gray-500 text-sm">Alle Fruchtsorten für LS22 & LS25</p>
        </div>
      </div>

      {/* Recommended rotations */}
      <div className="card">
        <h2 className="font-bold text-gray-900 mb-1">Empfohlene Fruchtfolgen für Friesland</h2>
        <p className="text-xs text-gray-400 mb-4">Vordefinierte Empfehlungen — für eigene Pläne nutze den Bereich darunter.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {FRIESLAND_ROTATION.map(rot => (
            <div key={rot.name} className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-1">{rot.name}</h3>
              <p className="text-xs text-gray-500 mb-3">{rot.info}</p>
              <div className="flex flex-wrap gap-1.5">
                {rot.rotation.map((c, i) => cropTag(c, i, rot.rotation.length))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom plans */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-gray-900 flex items-center gap-2"><BookOpen size={16} className="text-indigo-600" /> Eigene Fruchtfolgen</h2>
            <p className="text-xs text-gray-400 mt-0.5">Erstelle individuelle Fruchtfolgen für {currentFarm?.name}</p>
          </div>
          <button onClick={() => { setPlanForm(EMPTY_PLAN); setPlanCrops([]); setShowPlanForm(true); }} className="btn-primary text-sm flex items-center gap-1.5 py-2 px-3">
            <Plus size={14} /> Neue Fruchtfolge
          </button>
        </div>
        {customPlans.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {customPlans.map(plan => (
              <div key={plan.id} className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                    {plan.description && <p className="text-xs text-gray-500 mt-0.5">{plan.description}</p>}
                    {plan.game_version && (
                      <span className="inline-block mt-1 text-xs bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-full px-2 py-0.5 font-medium">{plan.game_version}</span>
                    )}
                  </div>
                  <button onClick={() => deleteCustomPlan(plan.id)} className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors ml-2 flex-shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {plan.crops.map((c: string, i: number) => (
                    <div key={i} className="flex items-center gap-1">
                      <span className="bg-white border border-indigo-200 rounded-lg px-2 py-1 text-xs font-medium text-gray-700">
                        {CROP_EMOJIS[c] || '🌱'} {c}
                      </span>
                      {i < plan.crops.length - 1 && <span className="text-indigo-300 text-xs">→</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400">
            <RotateCcw className="mx-auto mb-2 opacity-30" size={36} />
            <p className="text-sm mb-3">Noch keine eigenen Fruchtfolgen erstellt</p>
            <button onClick={() => { setPlanForm(EMPTY_PLAN); setPlanCrops([]); setShowPlanForm(true); }} className="btn-primary text-sm py-1.5 px-4">
              Erste Fruchtfolge erstellen
            </button>
          </div>
        )}
      </div>

      {/* Field rotations */}
      <div className="card">
        <h2 className="font-bold text-gray-900 mb-4">Feldbezogene Fruchtfolge-Historie</h2>
        <div className="space-y-2">
          {fields.map(field => (
            <div key={field.id} className="border border-gray-200 rounded-xl overflow-hidden">
              <button onClick={() => toggleField(field.id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center font-bold text-green-700 text-sm">{field.field_number}</div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 text-sm">{field.name || `Feld ${field.field_number}`}</p>
                    <p className="text-xs text-gray-500">{field.area_ha.toFixed(2)} ha</p>
                  </div>
                </div>
                {expanded === field.id ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </button>
              {expanded === field.id && (
                <div className="border-t border-gray-100 p-4 bg-gray-50/50">
                  <div className="flex justify-end mb-3">
                    <button onClick={() => setAddForm({ fieldId: field.id, year: new Date().getFullYear(), crop: 'Mais', yield_amount: '', sowing_date: '', harvest_date: '', notes: '', fertilizer_used: '' })} className="text-xs btn-primary py-1.5 px-3 flex items-center gap-1"><Plus size={12} /> Eintrag</button>
                  </div>
                  {rotations[field.id]?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead><tr className="text-gray-500 border-b border-gray-200">
                          <th className="text-left py-2 font-medium">Jahr</th>
                          <th className="text-left py-2 font-medium">Frucht</th>
                          <th className="text-left py-2 font-medium">Ertrag</th>
                          <th className="text-left py-2 font-medium">Aussaat</th>
                          <th className="text-left py-2 font-medium">Ernte</th>
                          <th className="text-left py-2 font-medium">Dünger</th>
                        </tr></thead>
                        <tbody>{rotations[field.id].map(e => (
                          <tr key={e.id} className="border-b border-gray-100 last:border-0">
                            <td className="py-2 font-bold text-green-700">{e.year}</td>
                            <td className="py-2">{CROP_EMOJIS[e.crop] || '🌱'} {e.crop}</td>
                            <td className="py-2">{e.yield_amount ? `${e.yield_amount} ${e.yield_unit}` : '—'}</td>
                            <td className="py-2">{e.sowing_date || '—'}</td>
                            <td className="py-2">{e.harvest_date || '—'}</td>
                            <td className="py-2 max-w-24 truncate">{e.fertilizer_used || '—'}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  ) : <p className="text-sm text-gray-400 text-center py-4">Noch keine Einträge</p>}
                </div>
              )}
            </div>
          ))}
          {fields.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">Keine Felder angelegt — zuerst Felder in der Feldverwaltung erstellen.</p>}
        </div>
      </div>

      {/* Create plan modal */}
      {showPlanForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-bold text-lg flex items-center gap-2"><BookOpen size={18} className="text-indigo-600" /> Eigene Fruchtfolge erstellen</h2>
              <button onClick={() => setShowPlanForm(false)}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Name *</label>
                  <input className="input" placeholder="z.B. Mein Sommerplan" value={planForm.name} onChange={e => setPlanForm({...planForm, name: e.target.value})} />
                </div>
                <div>
                  <label className="label">Spielversion</label>
                  <select className="input" value={planForm.game_version} onChange={e => setPlanForm({...planForm, game_version: e.target.value})}>
                    <option value="Beide">LS22 & LS25</option>
                    <option value="LS22">LS22</option>
                    <option value="LS25">LS25</option>
                  </select>
                </div>
                <div>
                  <label className="label">Beschreibung</label>
                  <input className="input" placeholder="Optional..." value={planForm.description} onChange={e => setPlanForm({...planForm, description: e.target.value})} />
                </div>
              </div>

              {/* Crop sequence builder */}
              <div>
                <label className="label">Fruchtfolge aufbauen</label>
                <div className="flex gap-2 mb-3">
                  <select className="input flex-1" value={pickCrop} onChange={e => setPickCrop(e.target.value)}>
                    <optgroup label="LS22 & LS25">
                      {CROPS_LS22.map(c => <option key={c} value={c}>{CROP_EMOJIS[c] || '🌱'} {c}</option>)}
                    </optgroup>
                    <optgroup label="Neu in LS25">
                      {CROPS_LS25_EXTRA.map(c => <option key={c} value={c}>{CROP_EMOJIS[c] || '🌱'} {c}</option>)}
                    </optgroup>
                  </select>
                  <button onClick={() => setPlanCrops(prev => [...prev, pickCrop])} className="btn-primary px-4 flex items-center gap-1.5 flex-shrink-0">
                    <Plus size={14} /> Hinzufügen
                  </button>
                </div>
                <div className="min-h-16 bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-wrap gap-2 items-center">
                  {planCrops.length === 0 ? (
                    <p className="text-gray-400 text-sm w-full text-center py-2">Noch keine Früchte hinzugefügt — wähle oben eine Frucht aus</p>
                  ) : planCrops.map((c, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <div className="flex items-center gap-1 bg-white border border-indigo-200 rounded-lg pl-2 pr-1 py-1 text-sm font-medium text-gray-700">
                        {CROP_EMOJIS[c] || '🌱'} {c}
                        <button onClick={() => setPlanCrops(prev => prev.filter((_, idx) => idx !== i))} className="ml-1 text-gray-400 hover:text-red-500 transition-colors">
                          <X size={12} />
                        </button>
                      </div>
                      {i < planCrops.length - 1 && <span className="text-indigo-300 text-sm">→</span>}
                    </div>
                  ))}
                </div>
                {planCrops.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">{planCrops.length} Frucht{planCrops.length !== 1 ? 'sorten' : 'sorte'} in der Sequenz</p>
                )}
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t">
              <button onClick={saveCustomPlan} disabled={savingPlan} className="btn-primary flex-1">{savingPlan ? 'Speichern...' : 'Fruchtfolge speichern'}</button>
              <button onClick={() => setShowPlanForm(false)} className="btn-secondary px-6">Abbrechen</button>
            </div>
          </div>
        </div>
      )}

      {/* Add rotation entry modal */}
      {addForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b"><h2 className="font-bold text-lg">Fruchtfolge Eintrag</h2><button onClick={() => setAddForm(null)}><X size={20} /></button></div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Jahr *</label><input className="input" type="number" value={addForm.year} onChange={e => setAddForm({...addForm, year: e.target.value})} /></div>
                <div>
                  <label className="label">Frucht *</label>
                  <select className="input" value={addForm.crop} onChange={e => setAddForm({...addForm, crop: e.target.value})}>
                    <optgroup label="LS22 & LS25">
                      {CROPS_LS22.map(c => <option key={c} value={c}>{CROP_EMOJIS[c] || '🌱'} {c}</option>)}
                    </optgroup>
                    <optgroup label="Neu in LS25">
                      {CROPS_LS25_EXTRA.map(c => <option key={c} value={c}>{CROP_EMOJIS[c] || '🌱'} {c}</option>)}
                    </optgroup>
                  </select>
                </div>
                <div><label className="label">Ertrag (t)</label><input className="input" type="number" value={addForm.yield_amount} onChange={e => setAddForm({...addForm, yield_amount: e.target.value})} /></div>
                <div><label className="label">Aussaatdatum</label><input className="input" value={addForm.sowing_date} onChange={e => setAddForm({...addForm, sowing_date: e.target.value})} placeholder="z.B. 15.03.2025" /></div>
                <div><label className="label">Erntedatum</label><input className="input" value={addForm.harvest_date} onChange={e => setAddForm({...addForm, harvest_date: e.target.value})} placeholder="z.B. 10.08.2025" /></div>
                <div><label className="label">Dünger</label><input className="input" value={addForm.fertilizer_used} onChange={e => setAddForm({...addForm, fertilizer_used: e.target.value})} placeholder="z.B. 200 kg/ha AHL" /></div>
              </div>
              <div><label className="label">Notizen</label><textarea className="input h-16 resize-none" value={addForm.notes} onChange={e => setAddForm({...addForm, notes: e.target.value})} /></div>
            </div>
            <div className="flex gap-3 p-6 border-t"><button onClick={saveRotation} className="btn-primary flex-1">Eintragen</button><button onClick={() => setAddForm(null)} className="btn-secondary px-6">Abbrechen</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
