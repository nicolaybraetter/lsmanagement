import { useEffect, useState } from 'react';
import { useFarmStore } from '../store/farmStore';
import { useAuthStore } from '../store/authStore';
import { farmsApi } from '../services/api';
import toast from 'react-hot-toast';
import { Users, UserPlus, Trash2, Crown, Shield, User, Eye } from 'lucide-react';

const roleLabels: Record<string, { label: string; icon: any; color: string }> = {
  owner: { label: 'Eigentümer', icon: Crown, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  manager: { label: 'Manager', icon: Shield, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  worker: { label: 'Mitarbeiter', icon: User, color: 'text-green-600 bg-green-50 border-green-200' },
  viewer: { label: 'Beobachter', icon: Eye, color: 'text-gray-600 bg-gray-50 border-gray-200' },
};

export default function MembersPage() {
  const { currentFarm } = useFarmStore();
  const { user } = useAuthStore();
  const [members, setMembers] = useState<any[]>([]);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteRole, setInviteRole] = useState('worker');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (currentFarm) loadMembers(); }, [currentFarm]);

  const loadMembers = async () => {
    if (!currentFarm) return;
    const res = await farmsApi.members(currentFarm.id);
    setMembers(res.data);
  };

  const handleInvite = async () => {
    if (!currentFarm || !inviteUsername.trim()) return;
    setLoading(true);
    try {
      await farmsApi.invite(currentFarm.id, { username: inviteUsername.trim(), role: inviteRole });
      toast.success(`${inviteUsername} eingeladen!`);
      setInviteUsername('');
      loadMembers();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Fehler beim Einladen');
    } finally { setLoading(false); }
  };

  const handleRemove = async (memberId: number) => {
    if (!currentFarm || !confirm('Mitglied wirklich entfernen?')) return;
    try {
      await farmsApi.removeMember(currentFarm.id, memberId);
      toast.success('Mitglied entfernt');
      loadMembers();
    } catch (e: any) { toast.error('Fehler'); }
  };

  const isOwner = currentFarm?.owner_id === user?.id;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-gray-500 text-sm">Mitglieder verwalten und einladen</p>
        </div>
      </div>

      {isOwner && (
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-green-600" /> Mitglied einladen
          </h2>
          <div className="flex gap-3">
            <input
              value={inviteUsername}
              onChange={e => setInviteUsername(e.target.value)}
              className="input flex-1"
              placeholder="Benutzername eingeben..."
              onKeyDown={e => e.key === 'Enter' && handleInvite()}
            />
            <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="input w-40">
              <option value="worker">Mitarbeiter</option>
              <option value="manager">Manager</option>
              <option value="viewer">Beobachter</option>
            </select>
            <button onClick={handleInvite} disabled={loading || !inviteUsername.trim()} className="btn-primary px-5">
              Einladen
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="font-bold text-gray-900 mb-4">{members.length} Mitglieder</h2>
        <div className="space-y-2">
          {members.map(member => {
            const role = roleLabels[member.role] || roleLabels.worker;
            const Icon = role.icon;
            return (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold">
                    {(member.full_name || member.username)?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{member.full_name || member.username}</p>
                    <p className="text-xs text-gray-500">@{member.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge border ${role.color} flex items-center gap-1`}>
                    <Icon size={12} /> {role.label}
                  </span>
                  {isOwner && member.user_id !== user?.id && (
                    <button onClick={() => handleRemove(member.user_id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                      <Trash2 size={16} />
                    </button>
                  )}
                  {member.user_id === user?.id && (
                    <span className="text-xs text-gray-400 italic">Du</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
