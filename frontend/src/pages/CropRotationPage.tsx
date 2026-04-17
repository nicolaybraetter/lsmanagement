import { useEffect, useState } from 'react';
import { useFarmStore } from '../store/farmStore';
import { fieldsApi } from '../services/api';
import toast from 'react-hot-toast';
import { RotateCcw, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';

const CROPS = ['Gras','Mais','Weizen','Gerste','Raps','Zuckerrübe','Kartoffel','Zwiebel','Roggen','Hafer','Sonnenblume','Sorghum','Silomais','Klee','Triticale','Sonstiges'];
const CROP_EMOJIS: Record<string, string> = { 'Gras':'🌿','Mais':'🌽','Weizen':'🌾','Gerste':'🌾','Raps':'🌻','Zuckerrübe':'🌱','Kartoffel':'🥔','Zwiebel':'🧅','Roggen':'🌾','Hafer':'🌾','Sonnenblume':'🌻','Sorghum':'🌿','Silomais':'🌽','Klee':'🍀','Triticale':'🌾','Sonstiges':'🌱' };

const FRIESLAND_ROTATION = [
  { name: 'Friesland Standard', rotation: ['Mais','Winterweizen','Wintergerste','Raps'], info: 'Typische 4-Felder-Rotation für Friesland' },
  { name: 'Grünlandbasiert', rotation: ['Gras','Gras','Silomais','Winterroggen'], info: 'Für milchviehhaltende Betriebe' },
  { name: 'Intensiv Ackerbau', rotation: ['Winterweizen','Zuckerrübe','Wintergerste','Raps','Winterweizen'], info: '5-Felder mit Rübenanteil' },
  { name: 'Kartoffel-Betrieb', rotation: ['Kartoffel','Winterweizen','Mais','Wintergerste'], info: 'Mit Kartoffel als Hauptkultur' },
];

export default function CropRotationPage() {
  const { currentFarm } = useFarmStore();
  const [fields, setFields] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [rotations, setRotations] = useState<Record<number, any[]>>({});
  const [addForm, setAddForm] = useState<any>(null);

  useEffect(() => { if (currentFarm) load(); }, [currentFarm]);

  const load = async () => {
    if (!currentFarm) return;
    const r = await fieldsApi.list(currentFarm.id);
    setFields(r.data);
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
      await fieldsApi.addCropRotation(currentFarm.id, addForm.fieldId, { field_id: addForm.fieldId, year: parseInt(addForm.year), crop: addForm.crop, yield_amount: addForm.yield_amount ? parseFloat(addForm.yield_amount) : null, sowing_date: addForm.sowing_date||null, harvest_date: addForm.harvest_date||null, notes: addForm.notes||null, fertilizer_used: addForm.fertilizer_used||null });
      toast.success('Fruchtfolge eingetragen');
      setAddForm(null);
      loadRotation(addForm.fieldId);
    } catch (e: any) { toast.error('Fehler'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center"><RotateCcw className="w-5 h-5 text-white" /></div>
        <div><h1 className="text-2xl font-bold text-gray-900">Fruchtfolgeplanung</h1><p className="text-gray-500 text-sm">Typische Kulturen für Friesland & Ostfriesland</p></div>
      </div>

      {/* Recommended rotations */}
      <div className="card">
        <h2 className="font-bold text-gray-900 mb-4">Empfohlene Fruchtfolgen für Friesland</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {FRIESLAND_ROTATION.map(rot => (
            <div key={rot.name} className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-1">{rot.name}</h3>
              <p className="text-xs text-gray-500 mb-3">{rot.info}</p>
              <div className="flex flex-wrap gap-1.5">
                {rot.rotation.map((c, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span className="bg-white border border-green-200 rounded-lg px-2 py-1 text-xs font-medium text-gray-700">{CROP_EMOJIS[c]} {c}</span>
                    {i < rot.rotation.length - 1 && <span className="text-green-400 text-xs">→</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Field rotations */}
      <div className="card">
        <h2 className="font-bold text-gray-900 mb-4">Feldbezogene Fruchtfolgen</h2>
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
                            <td className="py-2">{CROP_EMOJIS[e.crop]} {e.crop}</td>
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
        </div>
      </div>

      {addForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b"><h2 className="font-bold text-lg">Fruchtfolge Eintrag</h2><button onClick={() => setAddForm(null)}><X size={20} /></button></div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Jahr *</label><input className="input" type="number" value={addForm.year} onChange={e => setAddForm({...addForm, year: e.target.value})} /></div>
                <div><label className="label">Frucht *</label><select className="input" value={addForm.crop} onChange={e => setAddForm({...addForm, crop: e.target.value})}>{CROPS.map(c => <option key={c}>{c}</option>)}</select></div>
                <div><label className="label">Ertrag (t)</label><input className="input" type="number" value={addForm.yield_amount} onChange={e => setAddForm({...addForm, yield_amount: e.target.value})} /></div>
                <div><label className="label">Aussaatdatum</label><input className="input" value={addForm.sowing_date} onChange={e => setAddForm({...addForm, sowing_date: e.target.value})} placeholder="z.B. 15.03.2024" /></div>
                <div><label className="label">Erntedatum</label><input className="input" value={addForm.harvest_date} onChange={e => setAddForm({...addForm, harvest_date: e.target.value})} placeholder="z.B. 10.08.2024" /></div>
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
