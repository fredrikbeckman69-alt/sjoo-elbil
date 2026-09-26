import React from 'react';
import {
  Lightbulb,
  CreditCard,
  Calendar,
  AlertTriangle,
  BatteryCharging,
  Home,
} from 'lucide-react';

export const ChargingGuide: React.FC = () => {
  return (
    <section className="bg-slate-900/90 rounded-3xl border border-slate-800 p-5 sm:p-7 shadow-xl space-y-6">
      <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
        <Lightbulb className="w-4 h-4 fill-cyan-400" />
        <span>Expertguide för Svenska Elbilsförare</span>
      </div>

      <div>
        <h3 className="text-xl sm:text-2xl font-bold text-white">
          Så laddar du alltid billigast i Sverige
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Spara tusenlappar per år genom att förstå operatörernas prissättning, abonnemangsmodeller och dolda roamingavgifter.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Tips 1: Säsongsabonnemang */}
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Calendar className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white">
            1. Aktivera abonnemang bara under semestern
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            De flesta abonnemang (t.ex. <strong className="text-slate-200">IONITY Passport</strong> eller <strong className="text-slate-200">Tesla Medlemskap</strong>) har <strong className="text-emerald-400">ingen bindningstid</strong>. Teckna det i juli inför bilsemestern eller i sportlovsveckan, och säg upp det direkt. Du sparar 1,50–2,30 kr/kWh på hela resan!
          </p>
        </div>

        {/* Tips 2: Tesla Superchargers öppenhet */}
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
            <BatteryCharging className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white">
            2. Tesla Superchargers – Sveriges mest prisvärda nät
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Teslas nätverk är öppet för alla elbilsmärken i Sverige via Tesla-appen. De erbjuder ofta marknadens lägsta kWh-priser (från ca 3,45 kr med medlemskap) och har 8–24 laddare per station, vilket eliminerar laddköer.
          </p>
        </div>

        {/* Tips 3: Undvik Roaming-fällor */}
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white">
            3. Se upp för dyra roaming-påslag
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Att starta laddningen via generella appar (t.ex. EasyPark eller utländska laddkort) medför ofta ett <strong className="text-amber-400">påslag på 10–25%</strong>. Ladda alltid ner och starta med operatörens egen app för att få det garanterat lägsta priset.
          </p>
        </div>

        {/* Tips 4: Kortbetalning (AFIR) vs App */}
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <CreditCard className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white">
            4. Kortterminal finns – men appen är ofta billigare
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Enligt EU-krav har moderna snabbladdare kortterminal för direktbetalning med bankkort. Det är smidigt om du har bråttom, men hos aktörer som IONITY, Circle K och OKQ8 är registrerat app-konto 30–60 öre billigare per kWh.
          </p>
        </div>

        {/* Tips 5: Ladda nattetid */}
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Home className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white">
            5. Utnyttja dynamiska nattaxor
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Flera nätverk som <strong className="text-slate-200">Tesla</strong>, <strong className="text-slate-200">Mer Sweden</strong> och <strong className="text-slate-200">InCharge</strong> har differentierad taxa. Laddar du tidig morgon (före 07:00) eller sen kväll (efter 22:00) är priset ofta 1,50–2,00 kr lägre per kWh!
          </p>
        </div>

        {/* Tips 6: Den gyllene 10–80% regeln */}
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <BatteryCharging className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white">
            6. Ladda 10% till 80% på långresan
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Elbilar laddar som snabbast mellan 10% och 80%. Att ladda från 80% till 100% tar ofta lika lång tid som 10–80% och blockerar laddaren i onödan. Gör hellre två korta 15-minutersstopp än ett långt!
          </p>
        </div>
      </div>
    </section>
  );
};
