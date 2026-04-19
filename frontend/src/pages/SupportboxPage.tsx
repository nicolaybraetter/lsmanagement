import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MessageSquarePlus, CheckCircle, Tractor, ArrowLeft, AlertCircle, Lightbulb, Bug, MessageCircle, HelpCircle, ExternalLink } from 'lucide-react';
import { supportApi } from '../services/api';

const CATEGORIES = [
  { value: 'Funktionswunsch', label: 'Funktionswunsch', icon: Lightbulb, color: 'text-amber-600 bg-amber-50' },
  { value: 'Fehlermeldung', label: 'Fehlermeldung', icon: Bug, color: 'text-red-600 bg-red-50' },
  { value: 'Allgemeines Feedback', label: 'Allgemeines Feedback', icon: MessageCircle, color: 'text-blue-600 bg-blue-50' },
  { value: 'Sonstiges', label: 'Sonstiges', icon: HelpCircle, color: 'text-gray-600 bg-gray-50' },
];

export default function SupportboxPage() {
  const [form, setForm] = useState({ email: '', category: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category) { setError('Bitte wähle eine Kategorie aus.'); return; }
    setLoading(true);
    setError('');
    try {
      await supportApi.submit(form);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <Helmet>
        <title>Supportbox – Feedback & Wünsche einreichen | LSManagement</title>
        <meta name="description" content="Sende Funktionswünsche, Fehlermeldungen oder allgemeines Feedback direkt an das LSManagement-Team – kostenlose Betriebsverwaltung für LS22 & LS25." />
        <link rel="canonical" href="https://lscomm.braetter-int.de/supportbox" />
        <meta property="og:url" content="https://lscomm.braetter-int.de/supportbox" />
        <meta property="og:title" content="Supportbox – LSManagement" />
      </Helmet>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center group-hover:bg-green-700 transition-colors">
              <Tractor className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">LS<span className="text-green-500">Management</span></span>
          </Link>
          <Link to="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft size={16} /> Zurück
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
            <MessageSquarePlus className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Supportbox</h1>
          <p className="text-gray-500 max-w-md mx-auto">
            Teile deine Ideen, Wünsche oder Probleme mit uns. Wir lesen jede Nachricht und entwickeln
            LSManagement gemeinsam mit der Community weiter.
          </p>
        </div>

        {submitted ? (
          <div className="card text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Nachricht gesendet!</h2>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Vielen Dank für dein Feedback. Wir haben deine Nachricht erhalten und melden uns wenn nötig per E-Mail.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => { setSubmitted(false); setForm({ email: '', category: '', subject: '', message: '' }); }} className="btn-secondary">
                Weitere Nachricht senden
              </button>
              <Link to="/" className="btn-primary">Zurück zur Startseite</Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {/* Discord-Hinweis */}
            <a
              href="https://discord.gg/3HUfPdTvv7"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 bg-indigo-50 border border-indigo-200 rounded-xl p-4 hover:bg-indigo-100 transition-colors group"
            >
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-indigo-800 text-sm">Discord-Supportchannel</p>
                <p className="text-indigo-600 text-xs mt-0.5">
                  Alle offenen Fragen willkommen — alles wird gelesen und bei freier Zeit beantwortet.
                </p>
              </div>
              <ExternalLink size={16} className="text-indigo-400 group-hover:text-indigo-600 flex-shrink-0 transition-colors" />
            </a>

            {/* Hinweis */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
              <AlertCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Bitte formuliere deine Nachricht respektvoll. Links, anstößige Ausdrücke und unangemessene Inhalte
                werden automatisch blockiert. Für eine Antwort wird eine gültige E-Mail-Adresse benötigt.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="card space-y-5">
              {/* Kategorie */}
              <div>
                <label className="label">Kategorie *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CATEGORIES.map(({ value, label, icon: Icon, color }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => set('category', value)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-medium transition-all ${
                        form.category === value
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <span className={`p-1.5 rounded-lg ${form.category === value ? 'bg-green-100' : color}`}>
                        <Icon size={16} className={form.category === value ? 'text-green-600' : ''} />
                      </span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* E-Mail */}
              <div>
                <label className="label">E-Mail-Adresse *</label>
                <input
                  className="input"
                  type="email"
                  required
                  placeholder="deine@email.de"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">Nur für eine eventuelle Rückfrage — wird nicht veröffentlicht.</p>
              </div>

              {/* Betreff */}
              <div>
                <label className="label">Betreff *</label>
                <input
                  className="input"
                  type="text"
                  required
                  placeholder="Kurze Zusammenfassung deines Anliegens"
                  maxLength={150}
                  value={form.subject}
                  onChange={e => set('subject', e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">{form.subject.length}/150 Zeichen</p>
              </div>

              {/* Nachricht */}
              <div>
                <label className="label">Nachricht *</label>
                <textarea
                  className="input h-36 resize-none"
                  required
                  placeholder="Beschreibe deinen Wunsch oder dein Problem so ausführlich wie möglich..."
                  maxLength={2000}
                  value={form.message}
                  onChange={e => set('message', e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">{form.message.length}/2000 Zeichen</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2">
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !form.email || !form.category || !form.subject || !form.message}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <MessageSquarePlus size={18} />
                {loading ? 'Wird gesendet...' : 'Nachricht absenden'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
