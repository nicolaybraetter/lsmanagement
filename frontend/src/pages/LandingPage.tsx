import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Tractor, MapPin, TrendingUp, Package, PawPrint, Flame,
  CheckSquare, Users, ArrowRight, Star, Shield, Zap, RotateCcw,
  ChevronRight, Newspaper
} from 'lucide-react';

const features = [
  { icon: Tractor, title: 'Maschinenverwaltung', desc: 'Verwalte deine Maschinen mit Lohnarbeitsverleih, Betriebsstunden und Rentabilitätsanalysen.', color: 'bg-blue-500' },
  { icon: MapPin, title: 'Feldverwaltung', desc: 'Alle Felder mit Nummer, Größe, Status und detaillierter Fruchtfolgeplanung auf einen Blick.', color: 'bg-green-500' },
  { icon: RotateCcw, title: 'Fruchtfolgeplanung', desc: 'Optimale Fruchtfolgen für Friesland und Ostfriesland — von Mais bis Zuckerrübe.', color: 'bg-emerald-500' },
  { icon: TrendingUp, title: 'Finanzmanagement', desc: 'Vollständiges Ein- und Ausgabenmanagement mit Übersichten und Jahresauswertungen.', color: 'bg-amber-500' },
  { icon: Package, title: 'Lagerverwaltung', desc: 'Betriebsstoffe, Saatgut, Dünger, Futter und alle Silagearten im Blick behalten.', color: 'bg-orange-500' },
  { icon: PawPrint, title: 'Tierverwaltung', desc: 'Ställe und Tiere verwalten — Kühe, Schweine, Schafe und mehr mit detaillierten Profilen.', color: 'bg-pink-500' },
  { icon: Flame, title: 'Biogasanlage', desc: 'Vollständige Verwaltung deiner Biogasanlage mit Einspeisung, Ertrag und Wartungsprotokoll.', color: 'bg-red-500' },
  { icon: CheckSquare, title: 'Scrum-Board', desc: 'Aufgaben aus dem Landwirtschaftsalltag planen und im Team zuweisen — mit Vorlagen.', color: 'bg-violet-500' },
  { icon: Users, title: 'Multiplayer', desc: 'Lade Mitspieler ein, verwalte Rollen und arbeite gemeinsam an eurem LS22/25-Hof.', color: 'bg-indigo-500' },
];

const stats = [
  { value: 'LS22 & LS25', label: 'Unterstützte Versionen' },
  { value: '9+', label: 'Module' },
  { value: '100%', label: 'Kostenlos' },
  { value: 'Multi', label: 'Spieler Support' },
];

export default function LandingPage() {
  return (
    <>
      <Helmet>
        <title>LSManagement – Kostenlose Betriebsverwaltung für Farming Simulator 22 &amp; 25</title>
        <meta name="description" content="LSManagement ist die kostenlose Web-App für deinen LS22- und LS25-Hof. Maschinen, Felder, Finanzen, Tiere, Lager, Biogasanlage, Scrum-Board und Multiplayer – alles an einem Ort." />
        <link rel="canonical" href="https://lscomm.braetter-int.de/" />
        <meta property="og:url" content="https://lscomm.braetter-int.de/" />
        <meta property="og:title" content="LSManagement – Betriebsverwaltung für LS22 &amp; LS25" />
      </Helmet>
      <div className="min-h-screen">
      {/* Maintenance Notice */}
      <div style={{ marginTop: '84px' }} className="bg-amber-500 text-amber-950 text-sm font-medium py-2.5 px-4 text-center flex flex-wrap items-center justify-center gap-2 relative z-40">
        <span className="text-lg">&#x26A0;&#xFE0F;</span>
        <span>
          <strong>Tägliche Wartung:</strong> Jeden Tag von <strong>23:00 – 00:00 Uhr</strong> finden Wartungs- und Aktualisierungsarbeiten statt. In dieser Zeit kann es zu kurzen Unterbrechungen kommen.
        </span>
      </div>
      {/* Hero Banner */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-gray-50 to-transparent" />
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 right-10 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
                <Star className="w-3.5 h-3.5 text-amber-400" fill="currentColor" />
                <span className="text-white/90 text-sm font-medium">Für Farming Simulator 22 & 25</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
                Dein Hof.
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-300">
                  Professionell
                </span>
                <br />
                verwaltet.
              </h1>
              <p className="text-lg text-white/80 mb-8 max-w-lg leading-relaxed">
                Die umfassende Farm-Management-App für LS22 und LS25. Verwalte Maschinen, Felder, Finanzen, Tiere und mehr — alleine oder im Multiplayer-Team.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register" className="inline-flex items-center gap-2 bg-white text-green-800 font-bold py-3 px-7 rounded-xl hover:bg-green-50 transition-all shadow-lg hover:shadow-xl">
                  Jetzt kostenlos starten
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/login" className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white font-semibold py-3 px-7 rounded-xl border border-white/30 hover:bg-white/20 transition-all">
                  Anmelden
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Hero visual */}
            <div className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 shadow-2xl">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: '🚜', label: 'Maschinen', count: '24' },
                    { icon: '🌾', label: 'Felder', count: '18' },
                    { icon: '💰', label: 'Bilanz', count: '+€52k' },
                    { icon: '🐄', label: 'Tiere', count: '156' },
                    { icon: '📦', label: 'Lager', count: '12t' },
                    { icon: '⚡', label: 'Biogas', count: '500kW' },
                  ].map((item) => (
                    <div key={item.label} className="bg-white/10 rounded-xl p-3 text-center border border-white/10">
                      <div className="text-2xl mb-1">{item.icon}</div>
                      <div className="text-white font-bold text-sm">{item.count}</div>
                      <div className="text-white/60 text-xs">{item.label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 bg-white/10 rounded-xl p-3 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/80 text-sm">Aufgaben heute</span>
                    <span className="text-green-300 text-xs font-medium">3/5 erledigt</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div className="bg-green-400 h-2 rounded-full" style={{ width: '60%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                <div className="text-2xl font-extrabold text-white">{stat.value}</div>
                <div className="text-white/60 text-sm mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Alles was dein Hof braucht
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Von der Feldplanung bis zur Biogasanlage — alle Module in einem System, perfekt aufeinander abgestimmt.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-green-200 transition-all group">
                <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About / Why */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6">
                Gemacht für <span className="text-green-600">Friesland</span> und <span className="text-green-600">Ostfriesland</span>
              </h2>
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                Speziell auf die typische Landwirtschaft im Nordwesten Deutschlands ausgerichtet. Die Fruchtfolgeplanung enthält alle relevanten Kulturen wie Mais, Raps, Zuckerrüben, Kartoffeln und Grünland.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Shield, text: 'Sichere Datenverwaltung mit JWT-Authentifizierung' },
                  { icon: Zap, text: 'Schnelle, moderne Benutzeroberfläche' },
                  { icon: Users, text: 'Multiplayer-fähig — für ganze Teams' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">{text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-xl">31 Fruchtsorten</h3>
                <span className="text-xs bg-green-600 text-white font-semibold px-2.5 py-1 rounded-full">LS22 & LS25</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { emoji: '🌿', name: 'Gras & Klee' },
                  { emoji: '🌽', name: 'Mais & Silomais' },
                  { emoji: '🌾', name: 'Weizen, Gerste, Hafer' },
                  { emoji: '🌼', name: 'Raps & Soja' },
                  { emoji: '🥔', name: 'Kartoffeln' },
                  { emoji: '🌱', name: 'Zuckerrüben' },
                  { emoji: '🥕', name: 'Karotten & Pastinaken' },
                  { emoji: '🍇', name: 'Weintrauben & Oliven' },
                  { emoji: '🥬', name: 'Spinat (LS25 neu)' },
                  { emoji: '🫛', name: 'Erbsen (LS25 neu)' },
                ].map((crop) => (
                  <div key={crop.name} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 text-sm font-medium text-gray-700 shadow-sm">
                    <span>{crop.emoji}</span>
                    <span>{crop.name}</span>
                  </div>
                ))}
              </div>
              <Link to="/news" className="mt-4 inline-flex items-center gap-1.5 text-green-700 hover:text-green-800 text-xs font-semibold transition-colors">
                <Newspaper className="w-3.5 h-3.5" /> Alle Neuigkeiten ansehen →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-green-700 to-emerald-800">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Bereit loszulegen?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Erstelle jetzt deinen Account und richte deinen ersten Hof ein. Komplett kostenlos.
          </p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-white text-green-800 font-bold py-4 px-8 rounded-xl hover:bg-green-50 transition-all shadow-xl text-lg">
            Jetzt kostenlos starten
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <Tractor className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold">LSManagement</span>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/news" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors">
                <Newspaper className="w-3.5 h-3.5" /> Neuigkeiten
              </Link>
              <Link to="/hilfe" className="text-gray-400 hover:text-white text-sm transition-colors">Hilfe</Link>
              <Link to="/supportbox" className="text-gray-400 hover:text-white text-sm transition-colors">Supportbox</Link>
              <Link to="/wuensche" className="text-gray-400 hover:text-white text-sm transition-colors">W&#xFC;nsche</Link>
              <Link to="/register" className="text-gray-400 hover:text-white text-sm transition-colors">Registrieren</Link>
            </div>
            <p className="text-gray-500 text-sm">© 2026 Nicolay Brätter · LSManagement · Für LS22 & LS25</p>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
