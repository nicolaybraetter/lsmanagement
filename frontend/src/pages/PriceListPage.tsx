import { FileText, Info } from 'lucide-react';

const LABOR_PRICES = [
  { category: 'Bodenbearbeitung', items: [
    { service: 'Pflügen', unit: 'ha', min: 80,  max: 110, note: 'je nach Tiefe und Bodenart' },
    { service: 'Grubbern / Schälen', unit: 'ha', min: 50, max: 70, note: '' },
    { service: 'Fräsen / Kreiselegge', unit: 'ha', min: 45, max: 65, note: '' },
  ]},
  { category: 'Aussaat & Pflege', items: [
    { service: 'Säen (Drillsaat)', unit: 'ha', min: 35, max: 50, note: '' },
    { service: 'Spritzen (Pflanzenschutz)', unit: 'ha', min: 25, max: 40, note: 'ohne Mittel' },
    { service: 'Düngergabe (mineralisch)', unit: 'ha', min: 30, max: 45, note: '' },
    { service: 'Gülleausbringung (Schleppschuh)', unit: 'ha', min: 40, max: 60, note: 'Schleppschlauch günstiger' },
  ]},
  { category: 'Grünland & Silage', items: [
    { service: 'Mähen (Kreiselmähwerk)', unit: 'ha', min: 45, max: 65, note: '' },
    { service: 'Schwaden', unit: 'ha', min: 20, max: 35, note: '' },
    { service: 'Feldhäckseln (Maisernte)', unit: 'ha', min: 90, max: 130, note: 'inkl. Häcksler + Zugmaschine' },
    { service: 'Feldhäckseln (Gras)', unit: 'ha', min: 80, max: 115, note: '' },
    { service: 'Pressen (Rundballen)', unit: 'ha', min: 25, max: 40, note: 'ca. 8–10 Ballen/ha' },
    { service: 'Wickeln (Rundballen)', unit: 'Ballen', min: 8, max: 15, note: '' },
  ]},
  { category: 'Ernte', items: [
    { service: 'Mähdreschen (Getreide)', unit: 'ha', min: 100, max: 140, note: 'Weizen, Gerste, Raps' },
    { service: 'Zuckerrübenernte', unit: 'ha', min: 180, max: 250, note: 'Vollernter inkl. Beladung' },
    { service: 'Kartoffelernte', unit: 'ha', min: 150, max: 200, note: '' },
  ]},
];

const RENTAL_PRICES = [
  { category: 'Traktoren', items: [
    { service: 'Schlepper 60–80 PS', unit: 'h', min: 35, max: 50, note: 'ohne Fahrer' },
    { service: 'Schlepper 100–130 PS', unit: 'h', min: 55, max: 75, note: 'ohne Fahrer' },
    { service: 'Schlepper 180–250 PS', unit: 'h', min: 90, max: 120, note: 'ohne Fahrer' },
    { service: 'Schlepper 250+ PS (RTK)', unit: 'h', min: 120, max: 160, note: 'mit GPS-Lenkung' },
  ]},
  { category: 'Erntemaschinen', items: [
    { service: 'Mähdrescher (mittel)', unit: 'h', min: 150, max: 200, note: 'ohne Fahrer' },
    { service: 'Feldhäcksler (selbstf.)', unit: 'h', min: 120, max: 160, note: 'ohne Fahrer' },
  ]},
  { category: 'Transportgeräte & Sonstige', items: [
    { service: 'Teleskoplader', unit: 'h', min: 40, max: 60, note: 'ohne Fahrer' },
    { service: 'Dungstreuer (großvolumig)', unit: 'ha', min: 20, max: 35, note: '' },
    { service: 'Güllefass (>15.000 L)', unit: 'h', min: 50, max: 70, note: 'ohne Fahrer' },
  ]},
  { category: 'Transport', items: [
    { service: 'Gütertransport', unit: 't·km', min: 0.20, max: 0.35, note: 'je nach Entfernung' },
  ]},
];

function PriceTable({ title, groups, color }: { title: string; groups: any[]; color: string }) {
  return (
    <div className="card">
      <h2 className={`font-bold text-gray-900 text-lg mb-4 flex items-center gap-2`}>
        <span className={`w-3 h-3 rounded-full ${color}`} />
        {title}
      </h2>
      <div className="space-y-5">
        {groups.map(group => (
          <div key={group.category}>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pl-1">{group.category}</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left py-1.5 pl-1">Leistung</th>
                  <th className="text-right py-1.5">von</th>
                  <th className="text-right py-1.5">bis</th>
                  <th className="text-right py-1.5 pr-1">Einheit</th>
                  <th className="text-left py-1.5 pl-3 hidden sm:table-cell">Hinweis</th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((item: any) => (
                  <tr key={item.service} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-2 pl-1 font-medium text-gray-800">{item.service}</td>
                    <td className="py-2 text-right text-green-700 font-semibold">
                      {item.min < 1 ? item.min.toFixed(2) : item.min} €
                    </td>
                    <td className="py-2 text-right text-green-700 font-semibold">
                      {item.max < 1 ? item.max.toFixed(2) : item.max} €
                    </td>
                    <td className="py-2 text-right text-gray-500 pr-1">/{item.unit}</td>
                    <td className="py-2 pl-3 text-gray-400 text-xs hidden sm:table-cell">{item.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PriceListPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Preisliste Lohnarbeiten & Verleih</h1>
          <p className="text-gray-500 text-sm">Maschinenring-Preisempfehlungen Nord- & Ostfriesland 2024</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <strong>Quellengrundlage:</strong> Die Preise basieren auf Maschinenring-Preisempfehlungen für Nord- und Ostfriesland (Schleswig-Holstein / Niedersachsen) und KTBL-Richtwerten für das Wirtschaftsjahr 2023/2024. Alle Angaben in <strong>Euro (€)</strong> — Netto ohne MwSt., sofern nicht anders angegeben. Die Spanne hängt von Entfernung, Bodenart, Maschinengröße und saisonaler Auslastung ab.
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="lg:col-span-2">
          <PriceTable title="Lohnarbeitspreise (pro ha / Einheit)" groups={LABOR_PRICES} color="bg-green-500" />
        </div>
        <div className="lg:col-span-2">
          <PriceTable title="Maschinenmiete (pro Stunde / Einheit)" groups={RENTAL_PRICES} color="bg-blue-500" />
        </div>
      </div>

      <div className="card bg-amber-50 border-amber-200">
        <h3 className="font-bold text-amber-900 mb-2">💡 Tipps zur Preisfindung</h3>
        <ul className="text-sm text-amber-800 space-y-1.5 list-disc list-inside">
          <li>Preise bei langfristiger Zusammenarbeit und größeren Flächen i.d.R. am unteren Rand</li>
          <li>Kurzfristige Buchungen in der Hochsaison (Ernte, Silage) tendenziell am oberen Rand</li>
          <li>Für Fahrerkosten zusätzlich ca. <strong>18–25 €/h</strong> aufschlagen</li>
          <li>Kraftstoffkosten bei Lohnarbeiten üblicherweise im Preis enthalten</li>
          <li>MwSt.: Landwirtschaftliche Betriebe oft pauschaliert (§ 24 UStG) — im Zweifel steuerlichen Rat einholen</li>
          <li>Maschinenring Nordfriesland / Ostfriesland bieten aktuelle Preislisten auf Anfrage</li>
        </ul>
      </div>
    </div>
  );
}
