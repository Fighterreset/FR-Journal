import React from 'react';

// --- Ikonok ---
const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
const DumbbellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
);
const StarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
);
const PillIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
);
const WaterSleepIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
);

const RuleInfo: React.FC = () => {
  return (
    <div className="relative bg-[#111] text-gray-200 rounded-3xl border border-white/5 shadow-2xl overflow-hidden group">
      
      {/* Dekoratív háttér effekt */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-red-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

      <div className="p-6 md:p-8">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-4">
          <div className="p-2 bg-red-500/10 text-red-500 rounded-lg">
             <InfoIcon />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-wide">
              Jelmagyarázat & Szabályok
            </h2>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Útmutató a napló helyes kitöltéséhez
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* BAL OLDAL: Jelmagyarázat */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
              Hogyan töltsd?
            </h3>
            
            <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors flex items-start gap-4">
               <div className="mt-1 p-2 bg-[#252525] rounded-lg text-red-500"><DumbbellIcon /></div>
               <div>
                 <span className="block font-bold text-white text-sm mb-1">Edzés</span>
                 <p className="text-xs text-gray-400 leading-relaxed">
                   Jelöld be a pipát (checkbox), ha aznap elvégezted az előírt edzésmunkát.
                 </p>
               </div>
            </div>

            <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors flex items-start gap-4">
               <div className="mt-1 p-2 bg-[#252525] rounded-lg text-yellow-500"><StarIcon /></div>
               <div>
                 <span className="block font-bold text-white text-sm mb-1">Étkezés</span>
                 <p className="text-xs text-gray-400 leading-relaxed">
                   Értékeld a napodat 1-től 5-ig. <br/>
                   <span className="text-[10px] opacity-70">(1 = Csaló nap/Rossz, 5 = Tiszta étkezés/Tökéletes)</span>
                 </p>
               </div>
            </div>

            <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors flex items-start gap-4">
               <div className="mt-1 p-2 bg-[#252525] rounded-lg text-purple-500"><PillIcon /></div>
               <div>
                 <span className="block font-bold text-white text-sm mb-1">Kiegészítők</span>
                 <p className="text-xs text-gray-400 leading-relaxed">
                   Jelöld be, ha bevetted a napi vitaminokat és táplálékkiegészítőket.
                 </p>
               </div>
            </div>

            <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors flex items-start gap-4">
               <div className="mt-1 p-2 bg-[#252525] rounded-lg text-cyan-500"><WaterSleepIcon /></div>
               <div>
                 <span className="block font-bold text-white text-sm mb-1">Víz & Alvás</span>
                 <p className="text-xs text-gray-400 leading-relaxed">
                   Írd be a pontos mennyiséget számmal (pl. 3 liter víz, 7.5 óra alvás).
                 </p>
               </div>
            </div>
          </div>

          {/* JOBB OLDAL: 10-3-2-1-0 Szabály */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-transparent rounded-2xl blur-xl"></div>
            
            <div className="relative bg-[#0f0f0f] border border-red-900/30 rounded-2xl p-6 h-full shadow-inner shadow-red-900/10">
              <h3 className="flex items-center gap-2 font-black text-white text-sm uppercase tracking-wider mb-6 pb-4 border-b border-red-900/20">
                <span className="flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                </span>
                10-3-2-1-0 Szabály
              </h3>

              <div className="space-y-6">
                
                <div className="flex items-center gap-4 group/item">
                  <span className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-[#1a1a1a] border border-red-900/20 rounded-xl text-2xl font-black text-white group-hover/item:bg-red-900/20 group-hover/item:scale-110 transition-all duration-300">
                    10
                  </span>
                  <div>
                    <span className="text-red-500 font-bold text-xs uppercase tracking-widest">Koffein stop</span>
                    <p className="text-sm text-gray-300">órával lefekvés előtt nincs koffein.</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 group/item">
                  <span className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-[#1a1a1a] border border-red-900/20 rounded-xl text-2xl font-black text-white group-hover/item:bg-red-900/20 group-hover/item:scale-110 transition-all duration-300">
                    3
                  </span>
                  <div>
                    <span className="text-red-500 font-bold text-xs uppercase tracking-widest">Kaja stop</span>
                    <p className="text-sm text-gray-300">órával lefekvés előtt nincs nagy étkezés.</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 group/item">
                  <span className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-[#1a1a1a] border border-red-900/20 rounded-xl text-2xl font-black text-white group-hover/item:bg-red-900/20 group-hover/item:scale-110 transition-all duration-300">
                    2
                  </span>
                  <div>
                    <span className="text-red-500 font-bold text-xs uppercase tracking-widest">Folyadék stop</span>
                    <p className="text-sm text-gray-300">órával lefekvés előtt nincs folyadék.</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 group/item">
                  <span className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-[#1a1a1a] border border-red-900/20 rounded-xl text-2xl font-black text-white group-hover/item:bg-red-900/20 group-hover/item:scale-110 transition-all duration-300">
                    1
                  </span>
                  <div>
                    <span className="text-red-500 font-bold text-xs uppercase tracking-widest">Képernyő stop</span>
                    <p className="text-sm text-gray-300">órával lefekvés előtt nincs telefon/TV.</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 group/item">
                  <span className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-[#1a1a1a] border border-red-900/20 rounded-xl text-2xl font-black text-white group-hover/item:bg-red-900/20 group-hover/item:scale-110 transition-all duration-300">
                    0
                  </span>
                  <div>
                    <span className="text-red-500 font-bold text-xs uppercase tracking-widest">Szundi stop</span>
                    <p className="text-sm text-gray-300">szundigomb reggel. Ébredj azonnal!</p>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RuleInfo;
