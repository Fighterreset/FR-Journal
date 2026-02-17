
import React from 'react';

const RuleInfo: React.FC = () => {
  return (
    <div className="bg-[#b91c1c] text-white p-6 rounded-2xl shadow-xl shadow-red-900/20">
      <h2 className="text-2xl font-black uppercase italic mb-4">Jelmagyarázat & Szabályok</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="font-bold bg-white/20 px-2 py-0.5 rounded">Edzés</span>
            <span>Jelöld (X), ha elvégezted a napi edzést.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="font-bold bg-white/20 px-2 py-0.5 rounded">Étkezés</span>
            <span>Értékeld 1-5-ig (1 = nagyon rossz, 5 = tökéletes).</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="font-bold bg-white/20 px-2 py-0.5 rounded">Kiegészítők</span>
            <span>Jelöld (X), ha bevetted a napi ajánlott étrendkiegészítőket.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="font-bold bg-white/20 px-2 py-0.5 rounded">Víz & Alvás</span>
            <span>Add meg a liter/óra mennyiséget.</span>
          </li>
        </ul>

        <div className="bg-black/20 p-4 rounded-xl">
          <h3 className="font-black uppercase text-xs tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
            10-3-2-1-0 Szabály
          </h3>
          <ul className="space-y-1.5 font-medium opacity-90">
            <li><span className="font-bold text-yellow-400">10</span> órával lefekvés előtt nincs koffein</li>
            <li><span className="font-bold text-yellow-400">3</span> órával lefekvés előtt nincs nagy étkezés</li>
            <li><span className="font-bold text-yellow-400">2</span> órával lefekvés előtt nincs folyadék</li>
            <li><span className="font-bold text-yellow-400">1</span> órával lefekvés előtt nincs képernyő</li>
            <li><span className="font-bold text-yellow-400">0</span> szundigomb reggel</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RuleInfo;
