import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tractor, ArrowLeft, MessageSquare, Send, ChevronDown, ChevronUp, Sprout, Calendar } from 'lucide-react';
import { supportApi } from '../services/api';
import toast from 'react-hot-toast';

interface Comment {
  id: number;
  message_id: number;
  author_email: string;
  text: string;
  created_at: string;
}

interface WishEntry {
  id: number;
  email: string;
  category: string;
  subject: string;
  message: string;
  is_reviewed: boolean;
  created_at: string;
  comments: Comment[];
}

const CATEGORY_COLORS: Record<string, string> = {
  'Funktionswunsch': 'bg-blue-100 text-blue-700 border-blue-200',
  'Fehlermeldung': 'bg-red-100 text-red-700 border-red-200',
  'Allgemeines Feedback': 'bg-green-100 text-green-700 border-green-200',
  'Sonstiges': 'bg-gray-100 text-gray-600 border-gray-200',
};

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const masked = local.length > 2
    ? local[0] + '***' + local[local.length - 1]
    : local[0] + '***';
  return `${masked}@${domain}`;
}

function formatDate(dt: string): string {
  return new Date(dt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function WishCard({ entry }: { entry: WishEntry }) {
  const [expanded, setExpanded] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentEmail, setCommentEmail] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [comments, setComments] = useState<Comment[]>(entry.comments);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentEmail.trim() || !commentText.trim()) return;
    setSubmitting(true);
    try {
      const res = await supportApi.postComment(entry.id, { author_email: commentEmail.trim(), text: commentText.trim() });
      setComments(prev => [...prev, res.data]);
      setCommentText('');
      setCommentEmail('');
      setShowCommentForm(false);
      toast.success('Kommentar veröffentlicht!');
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Fehler beim Senden');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`text-xs font-semibold border rounded-full px-2.5 py-0.5 ${CATEGORY_COLORS[entry.category] ?? CATEGORY_COLORS['Sonstiges']}`}>
            {entry.category}
          </span>
          {entry.is_reviewed && (
            <span className="text-xs font-semibold border rounded-full px-2.5 py-0.5 bg-emerald-100 text-emerald-700 border-emerald-200">
              &#x2713; Geprüft
            </span>
          )}
          <span className="ml-auto flex items-center gap-1 text-xs text-gray-400">
            <Calendar className="w-3 h-3" />
            {formatDate(entry.created_at)}
          </span>
        </div>
        <h2 className="text-base font-bold text-gray-900 mb-1">{entry.subject}</h2>
        <p className="text-sm text-gray-500">von {maskEmail(entry.email)}</p>
      </div>

      {/* Body */}
      <div className="px-6 pb-4">
        <p className={`text-sm text-gray-700 leading-relaxed whitespace-pre-wrap ${!expanded && entry.message.length > 200 ? 'line-clamp-3' : ''}`}>
          {entry.message}
        </p>
        {entry.message.length > 200 && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="mt-2 flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium"
          >
            {expanded ? <><ChevronUp className="w-3.5 h-3.5" /> Weniger anzeigen</> : <><ChevronDown className="w-3.5 h-3.5" /> Mehr anzeigen</>}
          </button>
        )}
      </div>

      {/* Comments section */}
      <div className="border-t border-gray-100 px-6 py-4 bg-gray-50/50">
        <div className="flex items-center justify-between mb-3">
          <span className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
            <MessageSquare className="w-4 h-4" />
            {comments.length} {comments.length === 1 ? 'Kommentar' : 'Kommentare'}
          </span>
          <button
            onClick={() => setShowCommentForm(f => !f)}
            className="text-xs text-green-600 hover:text-green-700 font-semibold flex items-center gap-1"
          >
            <Send className="w-3 h-3" />
            Kommentieren
          </button>
        </div>

        {comments.length > 0 && (
          <div className="space-y-3 mb-3">
            {comments.map(c => (
              <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-500">{maskEmail(c.author_email)}</span>
                  <span className="text-xs text-gray-400">{formatDate(c.created_at)}</span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.text}</p>
              </div>
            ))}
          </div>
        )}

        {showCommentForm && (
          <form onSubmit={handleSubmitComment} className="space-y-2 pt-2 border-t border-gray-200">
            <input
              type="email"
              value={commentEmail}
              onChange={e => setCommentEmail(e.target.value)}
              placeholder="Deine E-Mail-Adresse (wird nicht vollständig angezeigt)"
              required
              className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 bg-white placeholder-gray-400"
            />
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Dein Kommentar..."
              required
              rows={3}
              maxLength={1000}
              className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 bg-white placeholder-gray-400 resize-none"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowCommentForm(false)}
                className="text-xs px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={submitting || !commentText.trim() || !commentEmail.trim()}
                className="text-xs px-4 py-1.5 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-500 disabled:opacity-50 transition flex items-center gap-1"
              >
                <Send className="w-3 h-3" />
                {submitting ? 'Sende...' : 'Senden'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function WuenschePage() {
  const [entries, setEntries] = useState<WishEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supportApi.listPublic()
      .then(res => setEntries(res.data))
      .catch(() => toast.error('Fehler beim Laden'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <Sprout className="w-3.5 h-3.5 text-green-300" />
            <span className="text-white/90 text-sm font-medium">Öffentliches Wunschbuch</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Wünsche &amp; Anregungen</h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto">
            Hier findest du alle eingereichten Wünsche und Anregungen der Community — kommentiere und diskutiere mit.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/" className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white font-medium py-2.5 px-5 rounded-xl border border-white/30 hover:bg-white/20 transition-all text-sm">
              <ArrowLeft className="w-4 h-4" /> Startseite
            </Link>
            <Link to="/supportbox" className="inline-flex items-center gap-2 bg-white text-green-800 font-bold py-2.5 px-5 rounded-xl hover:bg-green-50 transition-all shadow-lg text-sm">
              <Send className="w-4 h-4" /> Wunsch einreichen
            </Link>
          </div>
        </div>
      </div>

      {/* Entries */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">Noch keine Einträge vorhanden</p>
            <p className="text-gray-400 text-sm mt-1">Sei der Erste und reiche deinen Wunsch ein!</p>
            <Link to="/supportbox" className="mt-5 inline-flex items-center gap-2 bg-green-600 text-white font-semibold py-2.5 px-5 rounded-xl hover:bg-green-500 transition-all text-sm">
              <Send className="w-4 h-4" /> Jetzt einreichen
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {entries.map(entry => (
              <WishCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}

        {/* Footer CTA */}
        {entries.length > 0 && (
          <div className="mt-12 bg-gradient-to-br from-green-700 to-emerald-800 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Tractor className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Hast du einen Wunsch?</h3>
            <p className="text-white/70 text-sm mb-5">Reiche ihn über die Supportbox ein und lass ihn hier erscheinen.</p>
            <Link to="/supportbox" className="inline-flex items-center gap-2 bg-white text-green-800 font-bold py-3 px-6 rounded-xl hover:bg-green-50 transition-all shadow-lg">
              <Send className="w-4 h-4" /> Wunsch einreichen
            </Link>
          </div>
        )}

        <p className="text-center text-gray-400 text-sm mt-8">© 2026 Nicolay Brätter · LSManagement · Für LS22 &amp; LS25</p>
      </div>
    </div>
  );
}
