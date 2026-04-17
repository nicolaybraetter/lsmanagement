import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';
import { User, Save } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({ full_name: user?.full_name || '', bio: user?.bio || '', avatar_url: user?.avatar_url || '' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const r = await authApi.updateProfile(form);
      updateUser(r.data);
      toast.success('Profil gespeichert');
    } catch { toast.error('Fehler beim Speichern'); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
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
    </div>
  );
}
