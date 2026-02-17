import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WeekData, DayData, TenThreeTwoOneZeroRule } from '../types';

// --- Ikonok ---
const ChevronLeftIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>);
const ChevronRightIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>);
const CheckIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>);
const BackIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>);
const InfoIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);

interface WeeklyLogProps {
  weeks: WeekData[];
  onUpdate: (weekNum: number, dayId: string, updates: Partial<DayData>) => void;
}

const WeeklyLog: React.FC<WeeklyLogProps> = ({ weeks, onUpdate }) => {
  const { weekNum } = useParams<{ weekNum: string }>();
  const navigate = useNavigate();
  const currentWeekNum = parseInt(weekNum || '1');
  const weekData = weeks.find(w => w.weekNumber === currentWeekNum);

  const [activeDayEdit, setActiveDayEdit] = useState<string | null>(null);

  if (!weekData) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-400">
            <p className="text-xl font-bold">A keresett hét nem található.</p>
            <button onClick={() => navigate('/')} className="mt-4 text-red-500 hover:text-red-400 underline">Vissza a főoldalra</button>
        </div>
    );
  }

  const handleRuleToggle = (day: DayData, ruleKey: keyof TenThreeTwoOneZeroRule) => {
    onUpdate(currentWeekNum, day.id, {
      rule103210: {
        ...day.rule103210,
        [ruleKey]: !day.rule103210[ruleKey]
      }
    });
  };

  const getRuleScore = (rule: TenThreeTwoOneZeroRule) => {
    let score = 0;
    if (rule.caffeine) score++;
    if (rule.meal) score++;
    if (rule.fluids) score++;
    if (rule.screens) score++;
    if (rule.snooze) score++;
    return score;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#111] border border-white/5 p-4 rounded-2xl shadow-lg">
        <button 
          onClick={() => navigate('/')}
          className="text-gray-400 hover:text-white flex items-center gap-2 text-sm font-bold transition-colors group px-3 py-2 rounded-lg hover:bg-white/5"
        >
          <div className="group-hover:-translate-x-1 transition-transform"><BackIcon /></div>
          Vissza
        </button>

        <div className="text-center">
             <h2 className="text-3xl font-black italic uppercase tracking-wider text-white">
                {currentWeekNum}. <span className="text-red-600">Hét</span>
             </h2>
             <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-medium">Napló kitöltése</p>
        </div>

        <div className="flex gap-2">
          <button 
             onClick={() => currentWeekNum > 1 && navigate(`/week/${currentWeekNum - 1}`)} 
             disabled={currentWeekNum <= 1}
             className="p-3 bg-[#1a1a1a] rounded-xl hover:bg-[#252525] disabled:opacity-30 disabled:cursor-not-allowed border border-white/5 transition-all active:scale-95"
          >
             <ChevronLeftIcon />
          </button>
          <button 
             onClick={() => currentWeekNum < 8 && navigate(`/week/${currentWeekNum + 1}`)} 
             disabled={currentWeekNum >= 8}
             className="p-3 bg-[#1a1a1a] rounded-xl hover:bg-[#252525] disabled:opacity-30 disabled:cursor-not-allowed border border-white/5 transition-all active:scale-95"
          >
             <ChevronRightIcon />
          </button>
        </div>
      </div>

      {/* --- TABLE WRAPPER --- */}
      <div className="relative rounded-2xl border border-white/5 bg-[#111] shadow-2xl overflow-hidden">
        {/* Dekoratív felső sáv */}
        <div className="h-1 w-full bg-gradient-to-r from-red-900 via-red-600 to-red-900"></div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-[#161616] text-gray-400 text-[11px] font-bold uppercase tracking-widest border-b border-white/10">
                <th className="p-4 sticky left-0 bg-[#161616] z-20 shadow-[2px_0_5px_rgba(0,0,0,0.5)] w-32">Nap</th>
                <th className="p-4 text-center w-24">Edzés</th>
                <th className="p-4 text-center w-28">Étkezés <span className="text-[9px] opacity-50">(1-5)</span></th>
                <th className="p-4 text-center w-24">Kieg.</th>
                <th className="p-4 text-center w-28">Víz <span className="text-[9px] opacity-50">(L)</span></th>
                <th className="p-4 text-center w-28">Alvás <span className="text-[9px] opacity-50">(h)</span></th>
                <th className="p-4 text-center w-40">10-3-2-1-0</th>
                <th className="p-4 text-center w-28">Éhség <span className="text-[9px] opacity-50">(1-5)</span></th>
                <th className="p-4 text-center w-28">Közérzet <span className="text-[9px] opacity-50">(1-5)</span></th>
                <th className="p-4 min-w-[200px]">Megjegyzés</th>
              </tr>
            </thead>
            <tbody>
              {weekData.days.map((day, index) => (
                <tr 
                    key={day.id} 
                    className={`group transition-colors h-16 border-b border-white/5 hover:bg-white/[0.02] ${index % 2 === 0 ? 'bg-[#111]' : 'bg-[#131313]'}`}
                >
                  {/* NAP NEVE (Sticky) */}
                  <td className="p-4 font-bold text-sm text-white sticky left-0 z-10 border-r border-white/5 bg-inherit group-hover:bg-[#1a1a1a] shadow-[2px_0_5px_rgba(0,0,0,0.2)]">
                    <div className="flex flex-col">
                        <span>{day.dayName}</span>
                        <span className="text-[9px] text-gray-600 font-mono font-normal">DAY {index + 1}</span>
                    </div>
                  </td>
                  
                  {/* WORKOUT */}
                  <td className="p-2 text-center border-r border-white/5">
                     <button 
                       onClick={() => onUpdate(currentWeekNum, day.id, { workout: !day.workout })}
                       className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center transition-all duration-300 ${
                           day.workout 
                           ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)] scale-100' 
                           : 'bg-[#1a1a1a] text-gray-600 border border-white/10 hover:border-red-500/50 hover:text-red-500'
                       }`}
                     >
                       {day.workout ? <CheckIcon /> : <span className="w-2 h-2 rounded-full bg-current opacity-20"></span>}
                     </button>
                  </td>

                  {/* NUTRITION */}
                  <td className="p-2 border-r border-white/5">
                    <div className="relative">
                        <select 
                          value={day.nutrition}
                          onChange={(e) => onUpdate(currentWeekNum, day.id, { nutrition: Number(e.target.value) })}
                          className={`w-full bg-transparent text-center font-bold text-sm appearance-none cursor-pointer py-2 rounded focus:bg-[#222] focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors ${
                              day.nutrition >= 4 ? 'text-green-400' : day.nutrition === 0 ? 'text-gray-700' : 'text-yellow-500'
                          }`}
                        >
                          <option value={0} className="bg-[#111] text-gray-500">-</option>
                          {[1,2,3,4,5].map(v => <option key={v} value={v} className="bg-[#111] text-white">{v}</option>)}
                        </select>
                        {/* Custom Arrow overlay could go here, but appearance-none removes default */}
                    </div>
                  </td>

                  {/* SUPPLEMENTS */}
                  <td className="p-2 text-center border-r border-white/5">
                     <button 
                       onClick={() => onUpdate(currentWeekNum, day.id, { supplements: !day.supplements })}
                       className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center transition-all duration-300 ${
                           day.supplements 
                           ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)] scale-100' 
                           : 'bg-[#1a1a1a] text-gray-600 border border-white/10 hover:border-blue-500/50 hover:text-blue-500'
                       }`}
                     >
                       {day.supplements ? <CheckIcon /> : <span className="w-2 h-2 rounded-full bg-current opacity-20"></span>}
                     </button>
                  </td>

                  {/* WATER */}
                  <td className="p-2 border-r border-white/5">
                    <input 
                      type="number" step="0.1" min="0" placeholder="-"
                      value={day.water === 0 ? '' : day.water}
                      onChange={(e) => onUpdate(currentWeekNum, day.id, { water: e.target.value === '' ? 0 : Number(e.target.value) })}
                      className="w-full bg-transparent text-center text-cyan-400 font-bold focus:outline-none focus:bg-[#222] rounded py-1 placeholder-gray-700"
                    />
                  </td>

                  {/* SLEEP */}
                  <td className="p-2 border-r border-white/5">
                    <input 
                      type="number" step="0.5" min="0" placeholder="-"
                      value={day.sleep === 0 ? '' : day.sleep}
                      onChange={(e) => onUpdate(currentWeekNum, day.id, { sleep: e.target.value === '' ? 0 : Number(e.target.value) })}
                      className="w-full bg-transparent text-center text-indigo-400 font-bold focus:outline-none focus:bg-[#222] rounded py-1 placeholder-gray-700"
                    />
                  </td>

                  {/* 10-3-2-1-0 RULE (POPOVER) */}
                  <td className="p-2 border-r border-white/5 relative">
                    <button 
                      onClick={() => setActiveDayEdit(activeDayEdit === day.id ? null : day.id)}
                      className={`w-full py-2 px-1 rounded text-xs font-bold transition-all border ${
                          getRuleScore(day.rule103210) === 5 
                          ? 'bg-green-500/10 text-green-400 border-green-500/30' 
                          : getRuleScore(day.rule103210) > 0 
                             ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
                             : 'text-gray-600 border-transparent hover:bg-[#222]'
                      }`}
                    >
                      {getRuleScore(day.rule103210)} / 5
                    </button>
                    
                    {/* POPOVER CARD */}
                    {activeDayEdit === day.id && (
                      <>
                        {/* Backdrop Click to close */}
                        <div className="fixed inset-0 z-40" onClick={() => setActiveDayEdit(null)}></div>
                        
                        <div className="absolute right-0 top-12 z-50 w-64 bg-[#161616]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-4 animate-in zoom-in-95 duration-200">
                          <div className="flex justify-between items-center mb-3 border-b border-white/10 pb-2">
                             <span className="text-xs font-bold text-gray-400 uppercase">10-3-2-1-0 Szabály</span>
                             <button onClick={() => setActiveDayEdit(null)} className="text-gray-500 hover:text-white"><span className="text-lg">×</span></button>
                          </div>
                          
                          <div className="space-y-3">
                             {[
                               { k: 'caffeine', l: '10h: Koffein stop', c: 'peer-checked:bg-red-600' },
                               { k: 'meal', l: '3h: Étkezés stop', c: 'peer-checked:bg-red-600' },
                               { k: 'fluids', l: '2h: Folyadék stop', c: 'peer-checked:bg-red-600' },
                               { k: 'screens', l: '1h: Képernyő stop', c: 'peer-checked:bg-red-600' },
                               { k: 'snooze', l: '0: Szundigomb', c: 'peer-checked:bg-red-600' },
                             ].map((item) => (
                                <label key={item.k} className="flex items-center justify-between cursor-pointer group/label">
                                    <span className="text-sm text-gray-300 group-hover/label:text-white transition-colors">{item.l}</span>
                                    <div className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={(day.rule103210 as any)[item.k]} 
                                            onChange={() => handleRuleToggle(day, item.k as keyof TenThreeTwoOneZeroRule)} 
                                            className="sr-only peer" 
                                        />
                                        <div className={`w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer ${item.c} peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all`}></div>
                                    </div>
                                </label>
                             ))}
                          </div>
                        </div>
                      </>
                    )}
                  </td>

                  {/* EVENING HUNGER */}
                  <td className="p-2 border-r border-white/5">
                    <select 
                        value={day.eveningHunger}
                        onChange={(e) => onUpdate(currentWeekNum, day.id, { eveningHunger: Number(e.target.value) })}
                        className={`w-full bg-transparent text-center font-bold text-sm appearance-none cursor-pointer py-2 rounded focus:bg-[#222] focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors ${
                            day.eveningHunger === 0 ? 'text-gray-700' : 'text-gray-200'
                        }`}
                    >
                        <option value={0} className="bg-[#111] text-gray-500">-</option>
                        {[1,2,3,4,5].map(v => <option key={v} value={v} className="bg-[#111] text-white">{v}</option>)}
                    </select>
                  </td>

                  {/* WELLBEING */}
                  <td className="p-2 border-r border-white/5">
                    <select 
                        value={day.wellbeing}
                        onChange={(e) => onUpdate(currentWeekNum, day.id, { wellbeing: Number(e.target.value) })}
                        className={`w-full bg-transparent text-center font-bold text-sm appearance-none cursor-pointer py-2 rounded focus:bg-[#222] focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors ${
                            day.wellbeing >= 4 ? 'text-green-400' : day.wellbeing === 0 ? 'text-gray-700' : 'text-gray-300'
                        }`}
                    >
                        <option value={0} className="bg-[#111] text-gray-500">-</option>
                        {[1,2,3,4,5].map(v => <option key={v} value={v} className="bg-[#111] text-white">{v}</option>)}
                    </select>
                  </td>

                  {/* NOTES */}
                  <td className="p-2">
                    <input 
                      type="text" 
                      value={day.notes}
                      placeholder="..."
                      onChange={(e) => onUpdate(currentWeekNum, day.id, { notes: e.target.value })}
                      className="w-full bg-transparent text-sm text-gray-300 placeholder-gray-700 px-3 py-1 focus:bg-[#222] focus:outline-none rounded focus:ring-1 focus:ring-red-500/50 transition-colors"
                    />
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-[#111] border border-white/5 p-4 rounded-xl flex items-center gap-3 text-gray-500 text-xs shadow-lg">
        <InfoIcon />
        <p>Tipp: Az adataid automatikusan mentődnek a böngésződben. A 10-3-2-1-0 szabály részleteihez kattints a cellára.</p>
      </div>

    </div>
  );
};

export default WeeklyLog;
