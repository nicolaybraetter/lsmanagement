import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../services/api';
import {
  Shield, Users, Mail, LogOut, Trash2, KeyRound, UserCog,
  ToggleLeft, ToggleRight, Loader2, Check, X, Eye, EyeOff, Save, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

type Tab = 'users' | 'email';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string | null;
}

interface EmailConfig {
  smtp_host: string;
  smtp_port: number | string;
  smtp_user: string;
  smtp_password: string;
  smtp_from: string;
  operator_email: string;
}

// ── tiny modal helper ──────────────────────────────────────────
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h3 className="font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    smtp_host: '', smtp_port: 587, smtp_user: '', smtp_password: '', smtp_from: '', operator_email: '',
  });
  const [emailLoading, setEmailLoading] = useState(false);
  const [showSmtpPw, setShowSmtpPw] = useState(false);

  // modal state
  const [resetModal, setResetModal] = useState<AdminUser | null>(null);
  const [credModal, setCredModal] = useState<AdminUser | null>(null);
  const [deleteModal, setDeleteModal] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [credUsername, setCredUsername] = useState('');
  const [credEmail, setCredEmail] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // guard: redirect if no token
  useEffect(() => {
    if (!localStorage.getItem('admin_token')) navigate('/admin');
  }, []);

  // load users when tab = users
  useEffect(() => {
    if (tab === 'users') loadUsers();
    if (tab === 'email') loadEmailConfig();
  }, [tab]);

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await adminApi.listUsers();
      setUsers(res.data);
    } catch (e: any) {
      if (e.response?.status === 401) { logout(); }
      else toast.error('Fehler beim Laden der Benutzer');
    } finally {
      setUsersLoading(false);
    }
  };

  const loadEmailConfig = async () => {
    setEmailLoading(true);
    try {
      const res = await adminApi.getEmailConfig();
      setEmailConfig(res.data);
    } catch (e: any) {
      if (e.response?.status === 401) logout();
    } finally {
      setEmailLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin');
  };

  // ── user actions ─────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteModal) return;
    setActionLoading(true);
    try {
      await adminApi.deleteUser(deleteModal.id);
      toast.success(`Benutzer „${deleteModal.username}" gelöscht`);
      setDeleteModal(null);
      setUsers(u => u.filter(x => x.id !== deleteModal.id));
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Fehler');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetModal) return;
    if (newPassword.length < 6) { toast.error('Mindestens 6 Zeichen'); return; }
    setActionLoading(true);
    try {
      await adminApi.resetPassword(resetModal.id, newPassword);
      toast.success('Passwort zurückgesetzt');
      setResetModal(null);
      setNewPassword('');
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Fehler');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCredentials = async () => {
    if (!credModal) return;
    if (!credUsername.trim()) { toast.error('Benutzername darf nicht leer sein'); return; }
    setActionLoading(true);
    try {
      await adminApi.updateCredentials(credModal.id, credUsername.trim(), credEmail.trim() || undefined);
      toast.success('Zugangsdaten aktualisiert');
      setCredModal(null);
      setUsers(u => u.map(x => x.id === credModal.id
        ? { ...x, username: credUsername.trim(), email: credEmail.trim() || x.email }
        : x));
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Fehler');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (user: AdminUser) => {
    try {
      const res = await adminApi.toggleActive(user.id);
      setUsers(u => u.map(x => x.id === user.id ? { ...x, is_active: res.data.is_active } : x));
      toast.success(res.data.is_active ? 'Benutzer aktiviert' : 'Benutzer deaktiviert');
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Fehler');
    }
  };

  // ── email config ─────────────────────────────────────────────
  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    try {
      await adminApi.updateEmailConfig({ ...emailConfig, smtp_port: Number(emailConfig.smtp_port) });
      toast.success('E-Mail-Konfiguration gespeichert');
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Fehler');
    } finally {
      setEmailLoading(false);
    }
  };

  const tabBtn = (t: Tab, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => setTab(t)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
        tab === t ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
      }`}
    >
      {icon}{label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white leading-tight">Superadmin Panel</h1>
            <p className="text-xs text-gray-400">LS Management</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition"
        >
          <LogOut size={16} /> Abmelden
        </button>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        {/* Tab bar */}
        <div className="flex gap-2 mb-6 bg-gray-900 border border-gray-800 rounded-2xl p-1.5 w-fit">
          {tabBtn('users', <Users size={16} />, 'Benutzer')}
          {tabBtn('email', <Mail size={16} />, 'E-Mail Konfiguration')}
        </div>

        {/* ── USERS TAB ── */}
        {tab === 'users' && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h2 className="font-semibold text-white">Registrierte Benutzer</h2>
              <button onClick={loadUsers} className="text-gray-400 hover:text-green-400 transition" title="Aktualisieren">
                <RefreshCw size={16} />
              </button>
            </div>

            {usersLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-green-500" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wide">
                      <th className="text-left px-6 py-3">ID</th>
                      <th className="text-left px-6 py-3">Benutzername</th>
                      <th className="text-left px-6 py-3">E-Mail</th>
                      <th className="text-left px-6 py-3">Name</th>
                      <th className="text-left px-6 py-3">Erstellt</th>
                      <th className="text-left px-6 py-3">Status</th>
                      <th className="text-right px-6 py-3">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-gray-800/60 hover:bg-gray-800/40 transition">
                        <td className="px-6 py-3 text-gray-500 font-mono">{u.id}</td>
                        <td className="px-6 py-3 font-medium text-white">{u.username}</td>
                        <td className="px-6 py-3 text-gray-300">{u.email}</td>
                        <td className="px-6 py-3 text-gray-400">{u.full_name || '—'}</td>
                        <td className="px-6 py-3 text-gray-500 text-xs">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString('de-DE') : '—'}
                        </td>
                        <td className="px-6 py-3">
                          <button
                            onClick={() => handleToggleActive(u)}
                            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition ${
                              u.is_active
                                ? 'bg-green-900/40 text-green-400 hover:bg-red-900/40 hover:text-red-400'
                                : 'bg-red-900/40 text-red-400 hover:bg-green-900/40 hover:text-green-400'
                            }`}
                            title={u.is_active ? 'Deaktivieren' : 'Aktivieren'}
                          >
                            {u.is_active
                              ? <><ToggleRight size={14} /> Aktiv</>
                              : <><ToggleLeft size={14} /> Inaktiv</>}
                          </button>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => { setCredModal(u); setCredUsername(u.username); setCredEmail(u.email); }}
                              title="Zugangsdaten ändern"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-900/30 transition"
                            >
                              <UserCog size={15} />
                            </button>
                            <button
                              onClick={() => { setResetModal(u); setNewPassword(''); setShowNewPw(false); }}
                              title="Passwort zurücksetzen"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-amber-900/30 transition"
                            >
                              <KeyRound size={15} />
                            </button>
                            <button
                              onClick={() => setDeleteModal(u)}
                              title="Benutzer löschen"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-900/30 transition"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center text-gray-500 py-12">Keine Benutzer gefunden</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── EMAIL CONFIG TAB ── */}
        {tab === 'email' && (
          <div className="max-w-2xl">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="font-semibold text-white mb-1">E-Mail / SMTP Konfiguration</h2>
              <p className="text-sm text-gray-400 mb-6">
                Einstellungen werden in der Datenbank gespeichert und überschreiben die Umgebungsvariablen.
              </p>

              {emailLoading && !emailConfig.smtp_host ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-green-500" />
                </div>
              ) : (
                <form onSubmit={handleSaveEmail} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">SMTP Host</label>
                      <input
                        value={emailConfig.smtp_host}
                        onChange={e => setEmailConfig(c => ({ ...c, smtp_host: e.target.value }))}
                        placeholder="smtp.gmail.com"
                        className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm transition"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">SMTP Port</label>
                      <input
                        type="number"
                        value={emailConfig.smtp_port}
                        onChange={e => setEmailConfig(c => ({ ...c, smtp_port: e.target.value }))}
                        placeholder="587"
                        className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">SMTP Benutzername</label>
                    <input
                      value={emailConfig.smtp_user}
                      onChange={e => setEmailConfig(c => ({ ...c, smtp_user: e.target.value }))}
                      placeholder="dein@gmail.com"
                      className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">SMTP Passwort / App-Passwort</label>
                    <div className="relative">
                      <input
                        type={showSmtpPw ? 'text' : 'password'}
                        value={emailConfig.smtp_password}
                        onChange={e => setEmailConfig(c => ({ ...c, smtp_password: e.target.value }))}
                        placeholder="••••••••••••••••"
                        className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSmtpPw(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                      >
                        {showSmtpPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Absender-E-Mail (From)</label>
                    <input
                      value={emailConfig.smtp_from}
                      onChange={e => setEmailConfig(c => ({ ...c, smtp_from: e.target.value }))}
                      placeholder="noreply@deinedomain.de"
                      className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm transition"
                    />
                  </div>

                  <div className="pt-2 border-t border-gray-800">
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                      Operator E-Mail <span className="text-gray-500 normal-case">(empfängt Supportbox-Nachrichten)</span>
                    </label>
                    <input
                      value={emailConfig.operator_email}
                      onChange={e => setEmailConfig(c => ({ ...c, operator_email: e.target.value }))}
                      placeholder="admin@deinedomain.de"
                      className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm transition"
                    />
                  </div>

                  {/* Provider hints */}
                  <div className="bg-gray-800/60 rounded-xl p-4 text-xs text-gray-400 space-y-1.5">
                    <p className="font-medium text-gray-300 mb-2">Provider-Hinweise</p>
                    <p><span className="text-green-400 font-medium">Gmail:</span> Host: smtp.gmail.com · Port: 587 · App-Passwort unter Google-Konto → Sicherheit → 2FA → App-Passwörter erstellen</p>
                    <p><span className="text-blue-400 font-medium">IONOS:</span> Host: smtp.ionos.de · Port: 587 · Normales IONOS-Passwort</p>
                    <p><span className="text-purple-400 font-medium">Outlook/Hotmail:</span> Host: smtp-mail.outlook.com · Port: 587</p>
                  </div>

                  <button
                    type="submit"
                    disabled={emailLoading}
                    className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
                  >
                    {emailLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                    Konfiguration speichern
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── DELETE MODAL ── */}
      {deleteModal && (
        <Modal title="Benutzer löschen" onClose={() => setDeleteModal(null)}>
          <p className="text-gray-300 text-sm mb-6">
            Soll der Benutzer <span className="font-semibold text-white">„{deleteModal.username}"</span> ({deleteModal.email}) unwiderruflich gelöscht werden?
            Alle Daten dieses Benutzers gehen verloren.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteModal(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-2.5 rounded-xl transition">
              Abbrechen
            </button>
            <button
              onClick={handleDelete}
              disabled={actionLoading}
              className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 size={15} />}
              Löschen
            </button>
          </div>
        </Modal>
      )}

      {/* ── RESET PASSWORD MODAL ── */}
      {resetModal && (
        <Modal title={`Passwort: ${resetModal.username}`} onClose={() => setResetModal(null)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-400">Neues Passwort für <span className="text-white font-medium">{resetModal.username}</span> vergeben:</p>
            <div className="relative">
              <input
                type={showNewPw ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Neues Passwort (min. 6 Zeichen)"
                autoFocus
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm transition"
              />
              <button type="button" onClick={() => setShowNewPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">
                {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setResetModal(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-2.5 rounded-xl transition">
                Abbrechen
              </button>
              <button
                onClick={handleResetPassword}
                disabled={actionLoading || newPassword.length < 6}
                className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check size={15} />}
                Speichern
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── CREDENTIALS MODAL ── */}
      {credModal && (
        <Modal title={`Zugangsdaten: ${credModal.username}`} onClose={() => setCredModal(null)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Neuer Benutzername</label>
              <input
                value={credUsername}
                onChange={e => setCredUsername(e.target.value)}
                autoFocus
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Neue E-Mail-Adresse</label>
              <input
                type="email"
                value={credEmail}
                onChange={e => setCredEmail(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm transition"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setCredModal(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-2.5 rounded-xl transition">
                Abbrechen
              </button>
              <button
                onClick={handleCredentials}
                disabled={actionLoading || !credUsername.trim()}
                className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check size={15} />}
                Speichern
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
