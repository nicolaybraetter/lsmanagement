import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Tractor, ArrowLeft, Sprout, Users, ShieldCheck, Tractor as TractorIcon, Leaf, Star, Bell, MessageSquare, HelpCircle, Trash2 } from 'lucide-react';

interface NewsEntry {
  date: string;
  version: string;
  title: string;
  tag: string;
  tagColor: string;
  icon: React.ElementType;
  iconBg: string;
  items: string[];
}

const NEWS: NewsEntry[] = [
  {
    date: '19. April 2026',
    version: 'v1.8',
    title: 'Hof löschen & Sicherheitsfixes',
    tag: 'Update',
    tagColor: 'bg-red-100 text-red-700 border-red-200',
    icon: Trash2,
    iconBg: 'bg-red-500',
    items: [
      'Hofbesitzer können ihren Hof jetzt dauerhaft löschen — inklusive aller Maschinen, Felder, Finanzen, Tiere, Aufgaben und Mitglieder',
      'Sicherheitsabfrage: Hofname muss zur Bestätigung eingetippt werden',
      'Nach dem Löschen wird der Nutzer in den gleichen Zustand wie nach der Erstregistrierung versetzt und kann einen neuen Hof erstellen oder eingeladen werden',
      'Fix: Neu eingeloggte Nutzer wurden fälschlicherweise automatisch einem fremden Hof zugewiesen — dieser Fehler wurde behoben',
    ],
  },
  {
    date: '18. April 2026',
    version: 'v1.7',
    title: 'Öffentliche Hilfe- & Anleitungsseite',
    tag: 'Neu',
    tagColor: 'bg-green-100 text-green-700 border-green-200',
    icon: HelpCircle,
    iconBg: 'bg-green-500',
    items: [
      'Neue öffentliche Seite „Hilfe & Anleitung" unter /hilfe',
      'Vollständige Bedienungsanleitung für alle 12 Module des Systems',
      'Aufklappbare Abschnitte: Erste Schritte, Maschinen, Felder, Finanzen, Lager, Tiere, Biogas, Scrum-Board, Mitglieder, Rechnungen, Benachrichtigungen, Profil und Supportbox',
      'Volltextsuche über alle Hilfethemen',
      'Schnellzugriff auf Supportbox, Wünsche & Anregungen und Neuigkeiten',
      'Seite in Navbar, Footer und Sitemap verlinkt',
    ],
  },
  {
    date: '18. April 2026',
    version: 'v1.6',
    title: 'Öffentliche Wünsche & Anregungen',
    tag: 'Neu',
    tagColor: 'bg-teal-100 text-teal-700 border-teal-200',
    icon: MessageSquare,
    iconBg: 'bg-teal-500',
    items: [
      'Neue öffentliche Seite „Wünsche & Anregungen" — alle Einreichungen sind für jeden sichtbar',
      'Einträge werden nach Datum absteigend sortiert (neueste zuerst)',
      'Jeder kann Einträge kommentieren — eine gültige E-Mail-Adresse ist erforderlich',
      'E-Mail-Adressen werden automatisch maskiert angezeigt (Datenschutz)',
      'Inhaltsfilter: URLs und anstößige Ausdrücke werden blockiert',
      'Admin-Panel: neuer Tab zum Löschen von Einträgen oder einzelnen Kommentaren',
    ],
  },
  {
    date: '18. April 2026',
    version: 'v1.5',
    title: 'Hofinternes Benachrichtigungssystem',
    tag: 'Neu',
    tagColor: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    icon: Bell,
    iconBg: 'bg-indigo-500',
    items: [
      'Benachrichtigungsglocke in der Navigation mit rotem Zähler für ungelesene Meldungen',
      'Beim Zuweisen einer Aufgabe erhält das Mitglied sofort eine Systemnachricht',
      'Gleichzeitig wird eine E-Mail mit allen Aufgabendetails versandt',
      'Benachrichtigungen einzeln oder alle auf einmal als gelesen markieren',
      'Klick auf eine Benachrichtigung leitet direkt zum Scrum-Board weiter',
      'Automatische Aktualisierung alle 30 Sekunden im Hintergrund',
    ],
  },
  {
    date: '18. April 2026',
    version: 'v1.4',
    title: 'Fruchtfolgen, E-Mail & Neuigkeiten',
    tag: 'Neu',
    tagColor: 'bg-green-100 text-green-700 border-green-200',
    icon: Leaf,
    iconBg: 'bg-green-500',
    items: [
      'Alle offiziellen Fruchtsorten aus LS22 & LS25 verfügbar (31 Sorten)',
      'Neue LS25-Früchte: Spinat, Erbsen, Grüne Bohnen, Reis, Langkornreis',
      'Eigene Fruchtfolgen-Pläne erstellen und pro Hof speichern',
      'Fruchtsequenz-Builder mit Drag & Drop ähnlicher Bedienung',
      'E-Mail-Versand überarbeitet: SSL (Port 465) und STARTTLS (Port 587) werden jetzt korrekt erkannt',
      'Diese Neuigkeiten-Seite für alle Besucher sichtbar',
    ],
  },
  {
    date: '17. April 2026',
    version: 'v1.3',
    title: 'Konto- & Hofverwaltung',
    tag: 'Update',
    tagColor: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Users,
    iconBg: 'bg-blue-500',
    items: [
      'Eigenes Konto vollständig aus dem Profil heraus löschen',
      'Mitglieder können einen Hof selbst verlassen',
      'Sichere Kaskadenlöschung: Mitgliedschaften und Einladungen werden beim Löschen bereinigt',
      'Verbesserte Fehlermeldungen bei der Kontolöschung',
    ],
  },
  {
    date: '15. April 2026',
    version: 'v1.2',
    title: 'Fuhrpark & Kapitalverwaltung',
    tag: 'Feature',
    tagColor: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: TractorIcon,
    iconBg: 'bg-amber-500',
    items: [
      'Fuhrparkverwaltung: Maschinen kaufen, an andere Höfe verleihen und verkaufen',
      'Kaufpreis, Kaufdatum und Kennzeichen pro Maschine erfassbar',
      'Leihen & Rückgabe mit automatischer Statusaktualisierung',
      'Verkauf bucht den Verkaufserlös automatisch in die Finanzen',
      'Startkapital-Synchronisation mit dem Rechnungssystem',
    ],
  },
  {
    date: '12. April 2026',
    version: 'v1.1',
    title: 'Admin-Panel & Teamrollen',
    tag: 'Feature',
    tagColor: 'bg-purple-100 text-purple-700 border-purple-200',
    icon: ShieldCheck,
    iconBg: 'bg-purple-500',
    items: [
      'Superadmin-Panel unter /admin (passwortgeschützt)',
      'Benutzerverwaltung: Passwort zurücksetzen, Konto aktivieren/deaktivieren, löschen',
      'Benutzerrollen: Eigentümer, Manager, Mitarbeiter, Beobachter',
      'E-Mail-SMTP-Konfiguration direkt im Admin-Panel änderbar',
      'Eingeschränkte Sidebar für Benutzer ohne Hof-Mitgliedschaft',
    ],
  },
  {
    date: '10. April 2026',
    version: 'v1.0',
    title: 'Launch — Alle Kernmodule',
    tag: 'Launch',
    tagColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: Star,
    iconBg: 'bg-emerald-500',
    items: [
      'Maschinenverwaltung mit Betriebsstunden und Mietprotokoll',
      'Feldverwaltung mit Status, Fruchtfolge und Bodenart',
      'Finanzmanagement: Einnahmen, Ausgaben, Jahresübersicht',
      'Lagerverwaltung: Saatgut, Dünger, Futter, Silagen',
      'Tierverwaltung: Ställe und Tiere mit Profilen',
      'Biogasanlage-Verwaltung mit Einspeisung und Fütterungsprotokoll',
      'Scrum-Board für Aufgaben im Team',
      'Multiplayer: Einladungssystem mit E-Mail-Benachrichtigung',
      'Rechnungssystem zwischen Höfen',
    ],
  },
];

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Neuigkeiten & Updates – LSManagement für LS22 & LS25</title>
        <meta name="description" content="Alle Neuerungen und Updates von LSManagement: neue Module, Bugfixes und Features für die kostenlose Farming Simulator 22 & 25 Betriebsverwaltung." />
        <link rel="canonical" href="https://lscomm.braetter-int.de/news" />
        <meta property="og:url" content="https://lscomm.braetter-int.de/news" />
        <meta property="og:title" content="Neuigkeiten & Updates – LSManagement" />
      </Helmet>
      {/* Hero */}
      <div className="bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <Sprout className="w-3.5 h-3.5 text-green-300" />
            <span className="text-white/90 text-sm font-medium">Was ist neu in LSManagement?</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Neuigkeiten & Updates</h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto">
            LSManagement wird ständig weiterentwickelt. Hier findest du alle Neuerungen — damit du immer auf dem aktuellen Stand bist.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link to="/" className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white font-medium py-2.5 px-5 rounded-xl border border-white/30 hover:bg-white/20 transition-all text-sm">
              <ArrowLeft className="w-4 h-4" /> Startseite
            </Link>
            <Link to="/register" className="inline-flex items-center gap-2 bg-white text-green-800 font-bold py-2.5 px-5 rounded-xl hover:bg-green-50 transition-all shadow-lg text-sm">
              Kostenlos starten
            </Link>
          </div>
        </div>
      </div>

      {/* News timeline */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="space-y-6">
          {NEWS.map((entry, idx) => {
            const Icon = entry.icon;
            return (
              <div key={idx} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Card header */}
                <div className="flex items-start gap-4 p-6 pb-4">
                  <div className={`w-11 h-11 ${entry.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold border rounded-full px-2.5 py-0.5 ${entry.tagColor}`}>{entry.tag}</span>
                      <span className="text-xs font-mono text-gray-400 bg-gray-100 rounded-full px-2.5 py-0.5">{entry.version}</span>
                      <span className="text-xs text-gray-400 ml-auto">{entry.date}</span>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">{entry.title}</h2>
                  </div>
                </div>
                {/* Card body */}
                <div className="px-6 pb-6">
                  <ul className="space-y-2">
                    {entry.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer CTA */}
        <div className="mt-12 bg-gradient-to-br from-green-700 to-emerald-800 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Tractor className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Noch kein Account?</h3>
          <p className="text-white/70 text-sm mb-5">Starte kostenlos und verwalte deinen Hof professionell.</p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-white text-green-800 font-bold py-3 px-6 rounded-xl hover:bg-green-50 transition-all shadow-lg">
            Jetzt kostenlos starten
          </Link>
        </div>

        <p className="text-center text-gray-400 text-sm mt-8">© 2026 Nicolay Brätter · LSManagement · Für LS22 & LS25</p>
      </div>
    </div>
  );
}
