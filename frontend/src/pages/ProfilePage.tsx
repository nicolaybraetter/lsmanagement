import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useFarmStore } from '../store/farmStore';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';
import { User, Save, Trash2 } from 'lucide-react';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuthStore();
  const { setCurrentFarm, setFarms } = useFarmStore();
  const [form, setForm] = useState({ full_name: user?.full_name || '', bio: user?.bio || '', avatar_url: user?.avatar_url || '' });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const r = await authApi.updateProfile(form);
      updateUser(r.data);
      toast.success('Profil gespeichert');
    } catch { toast.error('Fehler beim Speichern'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await authApi.deleteAccount();
      logout();
      setCurrentFarm(null);
      setFarms([]);
      localStorage.clear();
      toast.success('Konto wurde gelöscht');
      navigate('/');
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Fehler beim Löschen');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center"><User className="w-5 h-5 text-white" /></div>
        <div><h1 className="text-2xl font-bold text-gray-900">Mein Profil</h1><p className="text-gray-500 text-sm">Persönliche Daten bearbeiten</p></div>
      </div>

      <div className="card">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg">{user?.full_name || user?.username}</p>
            <p className="text-gray-500 text-sm">@{user?.username} · {user?.email}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div><label className="label">Vollständiger Name</label><input className="input" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} /></div>
          <div><label className="label">Über mich</label><textarea className="input h-24 resize-none" value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} placeholder="Erzähl etwas über dich..." /></div>
          <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2"><Save size={16} />{saving ? 'Speichern...' : 'Speichern'}</button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="card border-red-200 bg-red-50/40">
        <h2 className="font-bold text-red-700 text-lg mb-1 flex items-center gap-2">
          <Trash2 size={18} /> Konto löschen
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Dein Konto und alle zugehörigen Daten werden unwiderruflich gelöscht. Höfe, die du besitzt, bleiben bestehen, verlieren aber den Eigentümer-Eintrag.
        </p>
        {!deleteConfirm ? (
          <button onClick={() => setDeleteConfirm(true)}
            className="flex items-center gap-2 bg-white border border-red-300 text-red-600 hover:bg-red-600 hover:text-white font-semibold px-4 py-2.5 rounded-xl transition text-sm">
            <Trash2 size={15} /> Konto löschen
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-red-700">Wirklich löschen? Dies kann nicht rückgängig gemacht werden.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(false)} className="btn-secondary text-sm">Abbrechen</button>
              <button disabled={deleting} onClick={handleDelete}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-xl transition text-sm">
                {deleting ? '…' : <><Trash2 size={15} /> Jetzt löschen</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
