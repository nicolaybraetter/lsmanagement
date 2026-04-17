import { useEffect, useState } from 'react';
import { useFarmStore } from '../store/farmStore';
import { useAuthStore } from '../store/authStore';
import { todosApi, farmsApi } from '../services/api';
import toast from 'react-hot-toast';
import { CheckSquare, Plus, X, User, Calendar, Flag, GripVertical } from 'lucide-react';

const STATUSES = [
  { key: 'Backlog', label: 'Backlog', color: 'bg-gray-100 border-gray-200', header: 'bg-gray-200' },
  { key: 'Todo', label: 'To Do', color: 'bg-blue-50 border-blue-200', header: 'bg-blue-200' },
  { key: 'In Bearbeitung', label: 'In Bearbeitung', color: 'bg-amber-50 border-amber-200', header: 'bg-amber-300' },
  { key: 'Überprüfung', label: 'Überprüfung', color: 'bg-purple-50 border-purple-200', header: 'bg-purple-300' },
  { key: 'Erledigt', label: 'Erledigt', color: 'bg-green-50 border-green-200', header: 'bg-green-300' },
];

const PRIORITIES = ['Niedrig','Mittel','Hoch','Dringend'];
const PRIO_COLORS: Record<string, string> = { 'Niedrig': 'bg-gray-100 text-gray-600', 'Mittel': 'bg-blue-100 text-blue-700', 'Hoch': 'bg-amber-100 text-amber-700', 'Dringend': 'bg-red-100 text-red-700' };
const CATEGORIES = ['Feldarbeit','Maschinen','Tiere','Finanzen','Lager','Biogasanlage','Ernte','Wartung','Planung','Allgemein'];
const CAT_EMOJIS: Record<string, string> = { 'Feldarbeit':'🌾','Maschinen':'🚜','Tiere':'🐄','Finanzen':'💰','Lager':'📦','Biogasanlage':'⚡','Ernte':'🌽','Wartung':'🔧','Planung':'📋','Allgemein':'✅' };

const EMPTY = { title: '', description: '', priority: 'Mittel', category: 'Allgemein', status: 'Backlog', assignee_id: '', due_date: '', estimated_hours: '' };

export default function TodoPage() {
  const { currentFarm } = useFarmStore();
  const { user } = useAuthStore();
  const [boards, setBoards] = useState<any[]>([]);
  const [activeBoard, setActiveBoard] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [catFilter, setCatFilter] = useState('');
  const [dragging, setDragging] = useState<any>(null);

  useEffect(() => { if (currentFarm) { loadBoards(); loadMembers(); } }, [currentFarm]);
  useEffect(() => { if (activeBoard) loadTasks(); }, [activeBoard]);

  const loadBoards = async () => {
    if (!currentFarm) return;
    const r = await todosApi.listBoards(currentFarm.id);
    setBoards(r.data);
    if (r.data.length > 0) setActiveBoard(r.data[0]);
  };

  const loadTasks = async () => {
    if (!currentFarm || !activeBoard) return;
    const r = await todosApi.listTasks(currentFarm.id, activeBoard.id);
    setTasks(r.data);
  };

  const loadMembers = async () => {
    if (!currentFarm) return;
    const r = await farmsApi.members(currentFarm.id);
    setMembers(r.data);
  };

  const saveTask = async () => {
    if (!currentFarm || !activeBoard || !form.title.trim()) return toast.error('Titel erforderlich');
    try {
      const payload = { ...form, assignee_id: form.assignee_id ? parseInt(form.assignee_id) : null, estimated_hours: form.estimated_hours ? parseInt(form.estimated_hours) : null, due_date: form.due_date ? new Date(form.due_date).toISOString() : null, board_id: activeBoard.id };
      if (editTask) await todosApi.updateTask(currentFarm.id, activeBoard.id, editTask.id, payload);
      else await todosApi.createTask(currentFarm.id, activeBoard.id, payload);
      toast.success(editTask ? 'Aufgabe aktualisiert' : 'Aufgabe erstellt');
      setShowForm(false); setEditTask(null); setForm(EMPTY); loadTasks();
    } catch (e: any) { toast.error('Fehler'); }
  };

  const delTask = async (taskId: number) => {
    if (!currentFarm || !activeBoard || !confirm('Aufgabe löschen?')) return;
    await todosApi.deleteTask(currentFarm.id, activeBoard.id, taskId);
    toast.success('Gelöscht'); loadTasks();
  };

  const moveTask = async (taskId: number, newStatus: string) => {
    if (!currentFarm || !activeBoard) return;
    await todosApi.updateTask(currentFarm.id, activeBoard.id, taskId, { status: newStatus });
    loadTasks();
  };

  const startEdit = (task: any) => {
    setForm({ title: task.title, description: task.description||'', priority: task.priority, category: task.category, status: task.status, assignee_id: task.assignee_id||'', due_date: task.due_date ? task.due_date.split('T')[0] : '', estimated_hours: task.estimated_hours||'' });
    setEditTask(task); setShowForm(true);
  };

  const filtered = tasks.filter(t => !catFilter || t.category === catFilter);
  const getTasksByStatus = (status: string) => filtered.filter(t => t.status === status);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center"><CheckSquare className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Aufgaben-Board</h1><p className="text-gray-500 text-sm">Scrum-Board für deinen Betrieb</p></div>
        </div>
        <button onClick={() => { setEditTask(null); setForm(EMPTY); setShowForm(true); }} className="btn-primary flex items-center gap-2"><Plus size={16} /> Aufgabe</button>
      </div>

      {/* Board selector + cat filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-2">
          {boards.map(b => (
            <button key={b.id} onClick={() => setActiveBoard(b)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeBoard?.id === b.id ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{b.name}</button>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setCatFilter('')} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${!catFilter ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>Alle</button>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCatFilter(c === catFilter ? '' : c)} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${catFilter === c ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{CAT_EMOJIS[c]} {c}</button>
          ))}
        </div>
      </div>

      {/* Board columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUSES.map(({ key, label, color, header }) => {
          const colTasks = getTasksByStatus(key);
          return (
            <div
              key={key}
              className={`flex-shrink-0 w-72 rounded-xl border-2 ${color} flex flex-col`}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); if (dragging) { moveTask(dragging.id, key); setDragging(null); }}}
            >
              <div className={`${header} rounded-t-xl px-4 py-3 flex items-center justify-between`}>
                <span className="font-bold text-gray-800 text-sm">{label}</span>
                <span className="bg-white/50 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">{colTasks.length}</span>
              </div>
              <div className="flex-1 p-2 space-y-2 min-h-20">
                {colTasks.map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => setDragging(task)}
                    onDragEnd={() => setDragging(null)}
                    className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs text-gray-500">{CAT_EMOJIS[task.category]}</span>
                      <span className={`badge text-xs ml-auto ${PRIO_COLORS[task.priority]}`}>{task.priority}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mb-2 leading-tight">{task.title}</p>
                    {task.description && <p className="text-xs text-gray-500 mb-2 line-clamp-2">{task.description}</p>}
                    <div className="flex items-center gap-2 flex-wrap mt-2 pt-2 border-t border-gray-50">
                      {task.assignee_name && <span className="flex items-center gap-1 text-xs text-gray-500"><User size={10} />{task.assignee_name}</span>}
                      {task.due_date && <span className="flex items-center gap-1 text-xs text-gray-500"><Calendar size={10} />{new Date(task.due_date).toLocaleDateString('de-DE')}</span>}
                      {task.estimated_hours && <span className="text-xs text-gray-400">⏱ {task.estimated_hours}h</span>}
                    </div>
                    <div className="flex gap-1 mt-2">
                      <button onClick={() => startEdit(task)} className="text-xs text-blue-500 hover:underline">Bearbeiten</button>
                      {!task.assignee_id && <button onClick={async () => { await todosApi.updateTask(currentFarm!.id, activeBoard.id, task.id, { assignee_id: user!.id }); loadTasks(); }} className="text-xs text-green-600 hover:underline ml-auto">Übernehmen</button>}
                      <button onClick={() => delTask(task.id)} className="text-xs text-red-400 hover:underline ml-auto">🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b"><h2 className="font-bold text-lg">{editTask ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'}</h2><button onClick={() => setShowForm(false)}><X size={20} /></button></div>
            <div className="p-6 space-y-4">
              <div><label className="label">Titel *</label><input className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Aufgabe beschreiben..." /></div>
              <div><label className="label">Beschreibung</label><textarea className="input h-20 resize-none" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Kategorie</label><select className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
                <div><label className="label">Priorität</label><select className="input" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>{PRIORITIES.map(p => <option key={p}>{p}</option>)}</select></div>
                <div><label className="label">Status</label><select className="input" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>{STATUSES.map(s => <option key={s.key}>{s.key}</option>)}</select></div>
                <div><label className="label">Zuweisen an</label>
                  <select className="input" value={form.assignee_id} onChange={e => setForm({...form, assignee_id: e.target.value})}>
                    <option value="">Niemand</option>
                    {members.map(m => <option key={m.user_id} value={m.user_id}>{m.full_name || m.username}</option>)}
                  </select>
                </div>
                <div><label className="label">Fällig bis</label><input className="input" type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} /></div>
                <div><label className="label">Geschätzte Stunden</label><input className="input" type="number" value={form.estimated_hours} onChange={e => setForm({...form, estimated_hours: e.target.value})} /></div>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t"><button onClick={saveTask} className="btn-primary flex-1">{editTask ? 'Speichern' : 'Erstellen'}</button><button onClick={() => setShowForm(false)} className="btn-secondary px-6">Abbrechen</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
