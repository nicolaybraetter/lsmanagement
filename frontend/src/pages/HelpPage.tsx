import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Tractor, ArrowLeft, Sprout, MapPin, TrendingUp, Package, PawPrint,
  Flame, CheckSquare, Users, FileText, Settings, User, RotateCcw,
  ChevronDown, ChevronRight, Bell, MessageSquare, HelpCircle,
  ShieldCheck, LayoutDashboard, Send,
} from 'lucide-react';

interface Section {
  id: string;
  icon: React.ElementType;
  iconBg: string;
  title: string;
  content: { heading: string; text: string }[];
}

const SECTIONS: Section[] = [
  {
    id: 'einstieg',
    icon: LayoutDashboard,
    iconBg: 'bg-green-500',
    title: 'Erste Schritte',
    content: [
      {
        heading: 'Registrierung & Anmeldung',
        text: 'Rufe die Startseite auf und klicke auf „Kostenlos starten". Vergib einen Benutzernamen, gib deine E-Mail-Adresse und ein Passwort ein (mind. 6 Zeichen). Nach der Registrierung wirst du direkt zum Dashboard weitergeleitet.',
      },
      {
        heading: 'Ersten Hof anlegen',
        text: 'Nach der Registrierung wirst du aufgefordert, einen Hof zu erstellen. Klicke auf „Neuen Hof erstellen" und fülle Name, Beschreibung, Spielversion (LS22 oder LS25) und optionale Angaben wie Standort und Gesamtfläche aus. Danach steht dir das volle Dashboard zur Verfügung.',
      },
      {
        heading: 'Dashboard-Übersicht',
        text: 'Das Dashboard zeigt dir auf einen Blick: Anzahl Maschinen, Felder, Lagerartikel und Mitglieder deines Hofes. Links befindet sich die Navigationsleiste mit allen Modulen. Oben rechts findest du die Benachrichtigungsglocke und dein Profilmenü.',
      },
      {
        heading: 'Zwischen Höfen wechseln',
        text: 'Bist du Mitglied mehrerer Höfe, kannst du im Dashboard oben über das Hofauswahlmenü zwischen deinen Höfen wechseln. Alle Module zeigen dann die Daten des ausgewählten Hofes.',
      },
    ],
  },
  {
    id: 'maschinen',
    icon: Tractor,
    iconBg: 'bg-blue-500',
    title: 'Maschinenverwaltung',
    content: [
      {
        heading: 'Maschine hinzufügen',
        text: 'Öffne „Maschinen" in der Navigation und klicke auf „Neue Maschine". Trage Name, Typ, Kaufpreis, Kaufdatum, Betriebsstunden und optional das Kennzeichen ein. Die Maschine erscheint sofort in deiner Fuhrparkliste.',
      },
      {
        heading: 'Betriebsstunden aktualisieren',
        text: 'Klicke bei einer Maschine auf das Bearbeiten-Symbol (Stift) und trage die aktuellen Betriebsstunden ein. So behältst du den Überblick über den Verschleiß deiner Fahrzeuge.',
      },
      {
        heading: 'Maschine verleihen',
        text: 'Wähle eine Maschine aus und klicke auf „Verleihen". Wähle dann den Zielhof aus der Liste. Die Maschine wird als „Verliehen" markiert und kann vom Zielhof eingesehen werden. Über „Zurückgeben" wird der Status wieder auf verfügbar gesetzt.',
      },
      {
        heading: 'Maschine verkaufen',
        text: 'Klicke bei einer Maschine auf „Verkaufen" und gib den Verkaufspreis ein. Der Erlös wird automatisch als Einnahme in das Finanzmodul gebucht. Die Maschine wird als verkauft markiert und aus der aktiven Liste entfernt.',
      },
    ],
  },
  {
    id: 'felder',
    icon: MapPin,
    iconBg: 'bg-green-600',
    title: 'Feldverwaltung',
    content: [
      {
        heading: 'Feld anlegen',
        text: 'Klicke unter „Felder" auf „Neues Feld". Vergib eine Feldnummer, Größe (ha), Bodenart und den aktuellen Status (z. B. Brache, Bestellt, Erntereif). Optional kannst du die aktuelle Frucht und Anmerkungen eintragen.',
      },
      {
        heading: 'Feldstatus verwalten',
        text: 'Über das Bearbeiten-Symbol kannst du jederzeit den Status eines Feldes aktualisieren — beispielsweise nach dem Bestellen oder Ernten. Der Status wird farblich hervorgehoben angezeigt.',
      },
      {
        heading: 'Fruchtfolge einem Feld zuweisen',
        text: 'Im Feld-Detail kannst du eine vorhandene Fruchtfolge aus dem Fruchtfolge-Modul zuweisen. So siehst du direkt, welche Frucht als nächstes auf dem Feld angebaut werden soll.',
      },
      {
        heading: 'Fruchtfolgeplanung',
        text: 'Das separate Modul „Fruchtfolge" enthält vorgefertigte Pläne für Friesland und Ostfriesland sowie alle 31 offiziellen Früchte aus LS22 und LS25. Unter „Eigene Pläne" kannst du individuelle Fruchtfolgen per Drag-and-drop zusammenstellen und speichern.',
      },
    ],
  },
  {
    id: 'finanzen',
    icon: TrendingUp,
    iconBg: 'bg-amber-500',
    title: 'Finanzverwaltung',
    content: [
      {
        heading: 'Einnahmen & Ausgaben erfassen',
        text: 'Öffne „Finanzen" und klicke auf „Neuer Eintrag". Wähle Typ (Einnahme/Ausgabe), Kategorie, Betrag und Datum. Optionale Beschreibungsfelder helfen dir, die Buchung später nachzuvollziehen.',
      },
      {
        heading: 'Jahresübersicht',
        text: 'Oben in der Finanzansicht kannst du das Jahr auswählen. Das System zeigt Gesamteinnahmen, Gesamtausgaben und den Gewinn für das gewählte Jahr. Ein Diagramm visualisiert die Entwicklung über das Jahr.',
      },
      {
        heading: 'Startkapital',
        text: 'Über das Rechnungsmodul kannst du ein Startkapital für deinen Hof festlegen. Dieses wird bei der Bilanzberechnung als Basiswert berücksichtigt.',
      },
      {
        heading: 'Automatische Buchungen',
        text: 'Wenn du eine Maschine verkaufst, wird der Erlös automatisch als Einnahme eingetragen. Ebenso werden Rechnungszahlungen automatisch gebucht.',
      },
    ],
  },
  {
    id: 'lager',
    icon: Package,
    iconBg: 'bg-orange-500',
    title: 'Lagerverwaltung',
    content: [
      {
        heading: 'Lagerartikel anlegen',
        text: 'Öffne „Lager" und klicke auf „Neuer Artikel". Wähle die Kategorie (Saatgut, Dünger, Futter, Silage, Betriebsstoffe, Sonstiges), gib Name, Einheit und aktuellen Bestand ein.',
      },
      {
        heading: 'Bestandsbuchungen',
        text: 'Klicke bei einem Artikel auf „Transaktion". Wähle Eingang oder Ausgang, gib die Menge und ein Datum ein. Alle Transaktionen werden protokolliert und du kannst die komplette Bewegungshistorie einsehen.',
      },
      {
        heading: 'Lagerübersicht',
        text: 'Die Hauptansicht zeigt alle Artikel mit aktuellem Bestand und Einheit. Artikel mit sehr niedrigem Bestand werden farblich hervorgehoben, damit du rechtzeitig nachbestellen kannst.',
      },
    ],
  },
  {
    id: 'tiere',
    icon: PawPrint,
    iconBg: 'bg-pink-500',
    title: 'Tierverwaltung',
    content: [
      {
        heading: 'Stall anlegen',
        text: 'Öffne „Tiere" und klicke auf „Neuer Stall". Vergib einen Namen und wähle die Tierart (Kühe, Schweine, Schafe, Hühner usw.). Du kannst mehrere Ställe pro Hof anlegen.',
      },
      {
        heading: 'Tiere erfassen',
        text: 'Klicke auf einen Stall und dann auf „Tier hinzufügen". Gib Name, Rasse, Geburtsdatum und weitere Details ein. Jedes Tier bekommt ein eigenes Profil.',
      },
      {
        heading: 'Tiere verwalten',
        text: 'In der Stallansicht siehst du alle Tiere auf einen Blick. Einzelne Tiere können bearbeitet oder entfernt werden. Die Gesamtanzahl der Tiere wird im Dashboard angezeigt.',
      },
    ],
  },
  {
    id: 'biogas',
    icon: Flame,
    iconBg: 'bg-red-500',
    title: 'Biogasanlage',
    content: [
      {
        heading: 'Anlage einrichten',
        text: 'Öffne „Biogas" und klicke auf „Anlage anlegen". Trage die installierte Leistung (kW), den Standort und Inbetriebnahmedatum ein. Pro Hof kann genau eine Biogasanlage verwaltet werden.',
      },
      {
        heading: 'Fütterungsprotokoll',
        text: 'Klicke auf „Fütterung erfassen" und wähle das eingesetzte Material (Maissilage, Grassilage, Gülle usw.) sowie die Menge und das Datum. Das Protokoll gibt dir einen Überblick über den Substrateinsatz.',
      },
      {
        heading: 'Einspeisung erfassen',
        text: 'Über „Einspeisung eintragen" kannst du die erzeugte Energiemenge (kWh) und den erzielten Preis je Periode erfassen. Die Daten fließen in die Finanzübersicht ein.',
      },
    ],
  },
  {
    id: 'scrum',
    icon: CheckSquare,
    iconBg: 'bg-violet-500',
    title: 'Scrum-Board (Aufgaben)',
    content: [
      {
        heading: 'Board anlegen',
        text: 'Öffne „Aufgaben" und klicke auf „Neues Board". Benenne das Board (z. B. „Ernte 2025" oder „Wartungsplan"). Du kannst beliebig viele Boards pro Hof anlegen.',
      },
      {
        heading: 'Aufgaben erstellen',
        text: 'Wähle ein Board und klicke auf „+" in einer der Spalten (Offen, In Bearbeitung, Erledigt). Vergib Titel, Beschreibung, Priorität und weise die Aufgabe optional einem Hofmitglied zu.',
      },
      {
        heading: 'Aufgabe zuweisen',
        text: 'Beim Zuweisen einer Aufgabe erhält das Mitglied sofort eine Systembenachrichtigung (Glocke oben rechts) sowie eine E-Mail mit allen Details. So geht keine Aufgabe verloren.',
      },
      {
        heading: 'Status ändern',
        text: 'Ziehe Aufgaben per Klick auf „Status ändern" von einer Spalte in die nächste, oder bearbeite die Aufgabe und wähle den neuen Status aus dem Dropdown. Erledigte Aufgaben bleiben zur Nachverfolgung sichtbar.',
      },
    ],
  },
  {
    id: 'mitglieder',
    icon: Users,
    iconBg: 'bg-indigo-500',
    title: 'Mitglieder & Rollen',
    content: [
      {
        heading: 'Mitglied einladen',
        text: 'Öffne „Mitglieder" und klicke auf „Mitglied einladen". Gib die E-Mail-Adresse des Spielers ein, wähle eine Rolle und schreibe optional eine persönliche Nachricht. Der Eingeladene erhält eine E-Mail und kann die Einladung im Dashboard annehmen oder ablehnen.',
      },
      {
        heading: 'Rollen im Überblick',
        text: 'Eigentümer: voller Zugriff auf alle Funktionen und Einstellungen. Manager: kann Daten bearbeiten, Mitglieder einladen und Aufgaben zuweisen. Mitarbeiter: kann Daten einsehen und eigene Einträge erstellen. Beobachter: reiner Lesezugriff, keine Änderungen möglich.',
      },
      {
        heading: 'Mitglied entfernen',
        text: 'Als Eigentümer oder Manager kannst du Mitglieder über das Papierkorb-Symbol aus dem Hof entfernen. Das Konto des Mitglieds bleibt erhalten, es verliert nur den Zugriff auf diesen Hof.',
      },
      {
        heading: 'Hof verlassen',
        text: 'Als Mitglied (nicht Eigentümer) kannst du unter „Mitglieder" auf „Hof verlassen" klicken, um selbst aus dem Hof auszutreten.',
      },
    ],
  },
  {
    id: 'rechnungen',
    icon: FileText,
    iconBg: 'bg-teal-500',
    title: 'Rechnungen',
    content: [
      {
        heading: 'Rechnung erstellen',
        text: 'Öffne „Rechnungen" und klicke auf „Neue Rechnung". Wähle den Empfängerhof aus der Liste aller Höfe, füge Positionen mit Beschreibung, Menge und Einzelpreis hinzu. Die Gesamtsumme wird automatisch berechnet.',
      },
      {
        heading: 'Rechnung senden',
        text: 'Nach dem Erstellen befindet sich die Rechnung im Status „Entwurf". Klicke auf „Senden", um sie an den Empfängerhof zu übermitteln. Der Empfänger sieht sie dann unter „Erhaltene Rechnungen".',
      },
      {
        heading: 'Rechnung bezahlen',
        text: 'Der Empfängerhof kann die Rechnung unter „Erhaltene Rechnungen" mit einem Klick auf „Bezahlen" als beglichen markieren. Der Betrag wird automatisch in die Finanzen beider Höfe eingetragen.',
      },
      {
        heading: 'Rechnung stornieren',
        text: 'Rechnungen im Status „Gesendet" können vom Ersteller storniert werden. Bereits bezahlte Rechnungen können nicht mehr storniert werden.',
      },
    ],
  },
  {
    id: 'benachrichtigungen',
    icon: Bell,
    iconBg: 'bg-indigo-400',
    title: 'Benachrichtigungen',
    content: [
      {
        heading: 'Benachrichtigungsglocke',
        text: 'Oben rechts in der Navigation findest du die Glocke. Eine rote Zahl zeigt die Anzahl ungelesener Nachrichten an. Klicke darauf, um das Benachrichtigungs-Panel zu öffnen.',
      },
      {
        heading: 'Wann werde ich benachrichtigt?',
        text: 'Du erhältst eine Systembenachrichtigung, wenn dir eine Aufgabe im Scrum-Board zugewiesen wird. Gleichzeitig wird eine E-Mail mit allen Aufgabendetails an deine registrierte Adresse gesendet.',
      },
      {
        heading: 'Als gelesen markieren',
        text: 'Klicke auf eine einzelne Benachrichtigung, um sie als gelesen zu markieren und direkt zum Scrum-Board zu gelangen. Über „Alle lesen" werden sämtliche Benachrichtigungen auf einmal als gelesen markiert.',
      },
      {
        heading: 'Automatische Aktualisierung',
        text: 'Das System prüft alle 30 Sekunden im Hintergrund, ob neue Benachrichtigungen vorliegen. Du musst die Seite nicht manuell neu laden.',
      },
    ],
  },
  {
    id: 'profil',
    icon: User,
    iconBg: 'bg-gray-500',
    title: 'Profil & Konto',
    content: [
      {
        heading: 'Profil bearbeiten',
        text: 'Klicke oben rechts auf deinen Benutzernamen und wähle „Profil". Dort kannst du deinen vollständigen Namen und deine E-Mail-Adresse ändern.',
      },
      {
        heading: 'Konto löschen',
        text: 'Im Profil ganz unten findest du die Option „Konto löschen". Dieser Schritt ist unwiderruflich: alle deine Daten, Mitgliedschaften und Einladungen werden dauerhaft entfernt. Höfe, deren Eigentümer du bist, bleiben bestehen.',
      },
    ],
  },
  {
    id: 'wuensche',
    icon: MessageSquare,
    iconBg: 'bg-teal-500',
    title: 'Wünsche & Supportbox',
    content: [
      {
        heading: 'Wunsch einreichen',
        text: 'Öffne die Seite „Supportbox" über die Navigation oder die Startseite. Wähle eine Kategorie (Funktionswunsch, Fehlermeldung, Allgemeines Feedback, Sonstiges), gib Betreff und Nachricht ein und sende das Formular ab. Du erhältst keine Registrierung — nur eine gültige E-Mail-Adresse ist erforderlich.',
      },
      {
        heading: 'Öffentliche Wunschliste',
        text: 'Alle eingereichten Wünsche sind auf der Seite „Wünsche & Anregungen" öffentlich einsehbar — sortiert nach Datum, neueste zuerst. E-Mail-Adressen werden dabei automatisch maskiert (z. B. n***y@gmail.com).',
      },
      {
        heading: 'Kommentieren',
        text: 'Unter jedem Eintrag kannst du einen Kommentar hinterlassen. Dazu musst du lediglich eine gültige E-Mail-Adresse angeben — keine Anmeldung nötig. Auch Kommentar-E-Mails werden maskiert angezeigt.',
      },
      {
        heading: 'Inhaltsfilter',
        text: 'Nachrichten und Kommentare werden automatisch auf Links, URLs und unzulässige Ausdrücke geprüft. Beiträge mit solchen Inhalten werden abgewiesen. Bitte formuliere deine Wünsche respektvoll.',
      },
    ],
  },
];

function SectionCard({ section }: { section: Section }) {
  const [open, setOpen] = useState(false);
  const Icon = section.icon;
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors text-left"
      >
        <div className={`w-10 h-10 ${section.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="flex-1 text-base font-bold text-gray-900">{section.title}</span>
        {open ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
      </button>
      {open && (
        <div className="border-t border-gray-100 divide-y divide-gray-100">
          {section.content.map((item, i) => (
            <div key={i} className="px-6 py-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-1">{item.heading}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const [search, setSearch] = useState('');

  const filtered = search.trim().length < 2
    ? SECTIONS
    : SECTIONS.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.content.some(c =>
          c.heading.toLowerCase().includes(search.toLowerCase()) ||
          c.text.toLowerCase().includes(search.toLowerCase())
        )
      );

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Hilfe & Anleitung – LSManagement für LS22 &amp; LS25</title>
        <meta name="description" content="Vollständige Bedienungsanleitung für LSManagement: Maschinen, Felder, Finanzen, Tiere, Scrum-Board, Multiplayer und mehr — kostenlose Betriebsverwaltung für Farming Simulator 22 & 25." />
        <link rel="canonical" href="https://lscomm.braetter-int.de/hilfe" />
        <meta property="og:url" content="https://lscomm.braetter-int.de/hilfe" />
        <meta property="og:title" content="Hilfe & Anleitung – LSManagement" />
      </Helmet>

      {/* Hero */}
      <div className="bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <HelpCircle className="w-3.5 h-3.5 text-green-300" />
            <span className="text-white/90 text-sm font-medium">Bedienungsanleitung</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Hilfe &amp; Anleitung</h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto">
            Hier findest du Erklärungen zu allen Funktionen von LSManagement — vom ersten Hof bis zum Scrum-Board.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/" className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white font-medium py-2.5 px-5 rounded-xl border border-white/30 hover:bg-white/20 transition-all text-sm">
              <ArrowLeft className="w-4 h-4" /> Startseite
            </Link>
            <Link to="/register" className="inline-flex items-center gap-2 bg-white text-green-800 font-bold py-2.5 px-5 rounded-xl hover:bg-green-50 transition-all shadow-lg text-sm">
              <Sprout className="w-4 h-4" /> Kostenlos starten
            </Link>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-3xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 px-4 py-3 flex items-center gap-3">
          <HelpCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Thema suchen (z. B. Maschine verleihen, Einladung)"
            className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
          )}
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <HelpCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Kein Ergebnis für „{search}"</p>
          </div>
        ) : (
          filtered.map(section => <SectionCard key={section.id} section={section} />)
        )}
      </div>

      {/* Quick links */}
      <div className="max-w-3xl mx-auto px-4 pb-12">
        <div className="grid sm:grid-cols-3 gap-4">
          <Link to="/supportbox" className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Send className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-semibold text-gray-800">Supportbox</span>
            <span className="text-xs text-gray-500">Fehler melden oder Funktionswunsch einreichen</span>
          </Link>
          <Link to="/wuensche" className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-teal-600" />
            </div>
            <span className="text-sm font-semibold text-gray-800">Wünsche &amp; Anregungen</span>
            <span className="text-xs text-gray-500">Alle Einreichungen der Community ansehen</span>
          </Link>
          <Link to="/news" className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-sm font-semibold text-gray-800">Neuigkeiten</span>
            <span className="text-xs text-gray-500">Alle Updates und neuen Funktionen im Überblick</span>
          </Link>
        </div>
      </div>

      <p className="text-center text-gray-400 text-sm pb-8">© 2026 Nicolay Brätter · LSManagement · Für LS22 &amp; LS25</p>
    </div>
  );
}
