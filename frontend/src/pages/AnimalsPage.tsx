import { useEffect, useState } from 'react';
import { useFarmStore } from '../store/farmStore';
import { animalsApi } from '../services/api';
import toast from 'react-hot-toast';
import { PawPrint, Plus, X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

const STABLE_TYPES = ['Kuhstall','Schweinestall','Schafstall','Hühnerstall','Pferdestall','Gemischter Stall'];
const ANIMAL_TYPES = ['Milchkuh','Fleischrind','Schwein','Schaf','Huhn','Pferd','Ziege','Sonstiges'];
const ANIMAL_EMOJIS: Record<string, string> = { 'Milchkuh':'🐄','Fleischrind':'🐂','Schwein':'🐷','Schaf':'🐑','Huhn':'🐔','Pferd':'🐴','Ziege':'🐐','Sonstiges':'🐾' };

export default function AnimalsPage() {
  const { currentFarm } = useFarmStore();
  const [stables, setStables] = useState<any[]>([]);
  const [animals, setAnimals] = useState<Record<number, any[]>>({});
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showStableForm, setShowStableForm] = useState(false);
  const [stableForm, setStableForm] = useState({ name: '', stable_type: 'Kuhstall', capacity: '0', location_notes: '', notes: '' });
  const [showAnimalForm, setShowAnimalForm] = useState<number | null>(null);
  const [animalForm, setAnimalForm] = useState({ animal_type: 'Milchkuh', name: '', ear_tag: '', birth_date: '', weight: '', purchase_price: '', daily_milk_yield: '', daily_feed_requirement: '', notes: '' });

  useEffect(() => { if (currentFarm) loadStables(); }, [currentFarm]);

  const loadStables = async () => {
    if (!currentFarm) return;
    const r = await animalsApi.listStables(currentFarm.id);
    setStables(r.data);
  };

  const loadAnimals = async (stableId: number) => {
    if (!currentFarm) return;
    const r = await animalsApi.listAnimals(currentFarm.id, stableId);
    setAnimals(prev => ({ ...prev, [stableId]: r.data }));
  };

  const toggleStable = (id: number) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id); loadAnimals(id);
  };

  const saveStable = async () => {
    if (!currentFarm || !stableForm.name.trim()) return toast.error('Name erforderlich');
    try {
      await animalsApi.createStable(currentFarm.id, { ...stableForm, capacity: parseInt(stableForm.capacity)||0 });
      toast.success('Stall angelegt'); setShowStableForm(false); setStableForm({ name: '', stable_type: 'Kuhstall', capacity: '0', location_notes: '', notes: '' }); loadStables();
    } catch (e: any) { toast.error('Fehler'); }
  };

  const saveAnimal = async (stableId: number) => {
    if (!currentFarm) return;
    try {
      await animalsApi.createAnimal(currentFarm.id, stableId, { ...animalForm, weight: animalForm.weight ? parseFloat(animalForm.weight) : null, purchase_price: animalForm.purchase_price ? parseFloat(animalForm.purchase_price) : null, daily_milk_yield: animalForm.daily_milk_yield ? parseFloat(animalForm.daily_milk_yield) : null, daily_feed_requirement: animalForm.daily_feed_requirement ? parseFloat(animalForm.daily_feed_requirement) : null });
      toast.success('Tier hinzugefügt'); setShowAnimalForm(null); setAnimalForm({ animal_type: 'Milchkuh', name: '', ear_tag: '', birth_date: '', weight: '', purchase_price: '', daily_milk_yield: '', daily_feed_requirement: '', notes: '' }); loadAnimals(stableId);
    } catch (e: any) { toast.error('Fehler'); }
  };

  const delAnimal = async (stableId: number, animalId: number) => {
    if (!currentFarm || !confirm('Tier entfernen?')) return;
    await animalsApi.deleteAnimal(currentFarm.id, stableId, animalId);
    toast.success('Entfernt'); loadAnimals(stableId);
  };

  const delStable = async (id: number) => {
    if (!currentFarm || !confirm('Stall archivieren?')) return;
    await animalsApi.deleteStable(currentFarm.id, id);
    toast.success('Stall archiviert'); loadStables();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center"><PawPrint className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Tierverwaltung</h1><p className="text-gray-500 text-sm">{stables.length} Ställe</p></div>
        </div>
        <button onClick={() => setShowStableForm(true)} className="btn-primary flex items-center gap-2"><Plus size={16} /> Neuer Stall</button>
      </div>

      <div className="space-y-3">
        {stables.map(stable => (
          <div key={stable.id} className="card p-0 overflow-hidden">
            <button onClick={() => toggleStable(stable.id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center text-xl">
                  {stable.stable_type === 'Kuhstall' ? '🐄' : stable.stable_type === 'Schweinestall' ? '🐷' : stable.stable_type === 'Hühnerstall' ? '🐔' : stable.stable_type === 'Pferdestall' ? '🐴' : '🐾'}
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900">{stable.name}</p>
                  <p className="text-xs text-gray-500">{stable.stable_type} · Kapazität: {stable.capacity}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={e => { e.stopPropagation(); setShowAnimalForm(stable.id); }} className="text-xs btn-primary py-1.5 px-3 flex items-center gap-1"><Plus size={12} /> Tier</button>
                <button onClick={e => { e.stopPropagation(); delStable(stable.id); }} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                {expanded === stable.id ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </div>
            </button>
            {expanded === stable.id && (
              <div className="border-t border-gray-100 p-4 bg-gray-50/50">
                {animals[stable.id]?.length > 0 ? (
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {animals[stable.id].map(animal => (
                      <div key={animal.id} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{ANIMAL_EMOJIS[animal.animal_type]}</span>
                            <div><p className="font-semibold text-gray-900 text-sm">{animal.name || animal.animal_type}</p>{animal.ear_tag && <p className="text-xs text-gray-500">🏷 {animal.ear_tag}</p>}</div>
                          </div>
                          <button onClick={() => delAnimal(stable.id, animal.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
                        </div>
                        <div className="text-xs text-gray-500 space-y-0.5">
                          {animal.weight && <p>Gewicht: {animal.weight} kg</p>}
                          {animal.daily_milk_yield && <p>Milchleistung: {animal.daily_milk_yield} L/Tag</p>}
                          {animal.daily_feed_requirement && <p>Futterbed.: {animal.daily_feed_requirement} kg/Tag</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-400 text-center py-4">Keine Tiere eingetragen</p>}
              </div>
            )}
          </div>
        ))}
        {stables.length === 0 && <div className="text-center py-16 text-gray-400 card"><PawPrint className="mx-auto mb-3 opacity-30" size={40} /><p>Noch keine Ställe angelegt</p></div>}
      </div>

      {showStableForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b"><h2 className="font-bold text-lg">Neuer Stall</h2><button onClick={() => setShowStableForm(false)}><X size={20} /></button></div>
            <div className="p-6 space-y-4">
              <div><label className="label">Name *</label><input className="input" value={stableForm.name} onChange={e => setStableForm({...stableForm, name: e.target.value})} placeholder="z.B. Kuhstall Nord" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Stalltyp</label><select className="input" value={stableForm.stable_type} onChange={e => setStableForm({...stableForm, stable_type: e.target.value})}>{STABLE_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
                <div><label className="label">Kapazität (Tiere)</label><input className="input" type="number" value={stableForm.capacity} onChange={e => setStableForm({...stableForm, capacity: e.target.value})} /></div>
              </div>
              <div><label className="label">Lage/Beschreibung</label><textarea className="input h-20 resize-none" value={stableForm.notes} onChange={e => setStableForm({...stableForm, notes: e.target.value})} /></div>
            </div>
            <div className="flex gap-3 p-6 border-t"><button onClick={saveStable} className="btn-primary flex-1">Stall anlegen</button><button onClick={() => setShowStableForm(false)} className="btn-secondary px-6">Abbrechen</button></div>
          </div>
        </div>
      )}

      {showAnimalForm !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b"><h2 className="font-bold text-lg">Tier hinzufügen</h2><button onClick={() => setShowAnimalForm(null)}><X size={20} /></button></div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Tierart *</label><select className="input" value={animalForm.animal_type} onChange={e => setAnimalForm({...animalForm, animal_type: e.target.value})}>{ANIMAL_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
                <div><label className="label">Name</label><input className="input" value={animalForm.name} onChange={e => setAnimalForm({...animalForm, name: e.target.value})} /></div>
                <div><label className="label">Ohrmarke</label><input className="input" value={animalForm.ear_tag} onChange={e => setAnimalForm({...animalForm, ear_tag: e.target.value})} /></div>
                <div><label className="label">Geburtsdatum</label><input className="input" value={animalForm.birth_date} onChange={e => setAnimalForm({...animalForm, birth_date: e.target.value})} placeholder="15.03.2022" /></div>
                <div><label className="label">Gewicht (kg)</label><input className="input" type="number" value={animalForm.weight} onChange={e => setAnimalForm({...animalForm, weight: e.target.value})} /></div>
                <div><label className="label">Kaufpreis (€)</label><input className="input" type="number" value={animalForm.purchase_price} onChange={e => setAnimalForm({...animalForm, purchase_price: e.target.value})} /></div>
                <div><label className="label">Milchleistung (L/Tag)</label><input className="input" type="number" value={animalForm.daily_milk_yield} onChange={e => setAnimalForm({...animalForm, daily_milk_yield: e.target.value})} /></div>
                <div><label className="label">Futterbed. (kg/Tag)</label><input className="input" type="number" value={animalForm.daily_feed_requirement} onChange={e => setAnimalForm({...animalForm, daily_feed_requirement: e.target.value})} /></div>
              </div>
              <div><label className="label">Notizen</label><textarea className="input h-16 resize-none" value={animalForm.notes} onChange={e => setAnimalForm({...animalForm, notes: e.target.value})} /></div>
            </div>
            <div className="flex gap-3 p-6 border-t"><button onClick={() => saveAnimal(showAnimalForm!)} className="btn-primary flex-1">Tier hinzufügen</button><button onClick={() => setShowAnimalForm(null)} className="btn-secondary px-6">Abbrechen</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
