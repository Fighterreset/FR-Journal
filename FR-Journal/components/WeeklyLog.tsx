
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WeekData, DayData, TenThreeTwoOneZeroRule } from '../types';

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
    return <div className="text-white">A hét nem található.</div>;
  }

  const handleRuleToggle = (day: DayData, ruleKey: keyof TenThreeTwoOneZeroRule) => {
    onUpdate(currentWeekNum, day.id, {
      rule103210: {
        ...day.rule103210,
        [ruleKey]: !day.rule103210[ruleKey]
      }
    });
  };

  const getRuleScoreString = (rule: TenThreeTwoOneZeroRule) => {
    let score = '';
    if (rule.caffeine) score += 'X';
    if (rule.meal) score += 'X';
    if (rule.fluids) score += 'X';
    if (rule.screens) score += 'X';
    if (rule.snooze) score += 'X';
    return score || '-';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/')}
          className="text-gray-400 hover:text-white flex items-center gap-2 font-semibold transition-colors"
        >
          ← Vissza
        </button>
        <h2 className="text-3xl font-black italic uppercase text-white">{currentWeekNum}. Hét</h2>
        <div className="flex gap-2">
          {currentWeekNum > 1 && (
            <button onClick={() => navigate(`/week/${currentWeekNum - 1}`)} className="p-2 bg-[#1a1a1a] rounded hover:bg-[#252525]">←</button>
          )}
          {currentWeekNum < 8 && (
            <button onClick={() => navigate(`/week/${currentWeekNum + 1}`)} className="p-2 bg-[#1a1a1a] rounded hover:bg-[#252525]">→</button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#252525] bg-black">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-[#b91c1c] text-white text-[10px] font-black uppercase tracking-widest text-center">
              <th className="p-3 border border-black sticky left-0 bg-[#b91c1c] z-10 w-24">NAP</th>
              <th className="p-3 border border-black w-16">EDZÉS (X)</th>
              <th className="p-3 border border-black w-20">ÉTKEZÉS (1-5)</th>
              <th className="p-3 border border-black w-16">KIEG. (X)</th>
              <th className="p-3 border border-black w-20">VÍZ (LITER)</th>
              <th className="p-3 border border-black w-20">ALVÁS (ÓRA)</th>
              <th className="p-3 border border-black w-32">10-3-2-1-0 SZABÁLY</th>
              <th className="p-3 border border-black w-20">ÉHSÉG (0-5)</th>
              <th className="p-3 border border-black w-20">KÖZÉRZET (1-5)</th>
              <th className="p-3 border border-black">MEGJEGYZÉS</th>
            </tr>
          </thead>
          <tbody>
            {weekData.days.map((day) => (
              <tr key={day.id} className="group hover:bg-[#111111] transition-colors border-b border-[#1a1a1a] h-14">
                <td className="p-3 font-bold text-sm bg-black sticky left-0 group-hover:bg-[#111111] z-10 border-r border-[#1a1a1a]">{day.dayName}</td>
                
                {/* Workout */}
                <td className="p-1 text-center border-r border-[#1a1a1a]">
                   <button 
                     onClick={() => onUpdate(currentWeekNum, day.id, { workout: !day.workout })}
                     className={`w-full h-full min-h-[40px] flex items-center justify-center text-lg font-bold transition-all ${day.workout ? 'text-red-600' : 'text-gray-800'}`}
                   >
                     {day.workout ? 'X' : '·'}
                   </button>
                </td>

                {/* Nutrition */}
                <td className="p-1 border-r border-[#1a1a1a]">
                  <select 
                    value={day.nutrition}
                    onChange={(e) => onUpdate(currentWeekNum, day.id, { nutrition: Number(e.target.value) })}
                    className={`w-full h-full bg-transparent text-center focus:outline-none focus:ring-1 focus:ring-red-500 font-bold ${day.nutrition === 0 ? 'text-gray-700' : ''}`}
                  >
                    <option value={0} className="bg-black">-</option>
                    {[1,2,3,4,5].map(v => <option key={v} value={v} className="bg-black">{v}</option>)}
                  </select>
                </td>

                {/* Supplements */}
                <td className="p-1 text-center border-r border-[#1a1a1a]">
                   <button 
                     onClick={() => onUpdate(currentWeekNum, day.id, { supplements: !day.supplements })}
                     className={`w-full h-full min-h-[40px] flex items-center justify-center text-lg font-bold transition-all ${day.supplements ? 'text-red-600' : 'text-gray-800'}`}
                   >
                     {day.supplements ? 'X' : '·'}
                   </button>
                </td>

                {/* Water */}
                <td className="p-1 border-r border-[#1a1a1a]">
                  <input 
                    type="number"
                    step="0.1"
                    min="0"
                    value={day.water === 0 ? '' : day.water}
                    placeholder="0"
                    onChange={(e) => onUpdate(currentWeekNum, day.id, { water: e.target.value === '' ? 0 : Number(e.target.value) })}
                    className="w-full h-full bg-transparent text-center focus:outline-none focus:ring-1 focus:ring-red-500 font-bold appearance-none"
                  />
                </td>

                {/* Sleep */}
                <td className="p-1 border-r border-[#1a1a1a]">
                  <input 
                    type="number"
                    step="0.5"
                    min="0"
                    value={day.sleep === 0 ? '' : day.sleep}
                    placeholder="0"
                    onChange={(e) => onUpdate(currentWeekNum, day.id, { sleep: e.target.value === '' ? 0 : Number(e.target.value) })}
                    className="w-full h-full bg-transparent text-center focus:outline-none focus:ring-1 focus:ring-red-500 font-bold"
                  />
                </td>

                {/* 10-3-2-1-0 Rule */}
                <td className="p-1 border-r border-[#1a1a1a] relative">
                  <button 
                    onClick={() => setActiveDayEdit(activeDayEdit === day.id ? null : day.id)}
                    className="w-full h-full text-center text-red-600 font-black tracking-widest hover:bg-white/5"
                  >
                    {getRuleScoreString(day.rule103210)}
                  </button>
                  {activeDayEdit === day.id && (
                    <div className="absolute mt-2 z-50 bg-[#1a1a1a] border border-[#333] p-4 rounded-lg shadow-2xl flex flex-col gap-2 w-64 right-0 md:left-1/2 md:-translate-x-1/2">
                      <div className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">10-3-2-1-0 Betartva?</div>
                      <label className="flex items-center gap-3 cursor-pointer hover:text-white text-gray-300 text-sm">
                        <input type="checkbox" checked={day.rule103210.caffeine} onChange={() => handleRuleToggle(day, 'caffeine')} className="accent-red-600 w-4 h-4" />
                        10h: Koffein stop
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer hover:text-white text-gray-300 text-sm">
                        <input type="checkbox" checked={day.rule103210.meal} onChange={() => handleRuleToggle(day, 'meal')} className="accent-red-600 w-4 h-4" />
                        3h: Étkezés stop
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer hover:text-white text-gray-300 text-sm">
                        <input type="checkbox" checked={day.rule103210.fluids} onChange={() => handleRuleToggle(day, 'fluids')} className="accent-red-600 w-4 h-4" />
                        2h: Folyadék stop
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer hover:text-white text-gray-300 text-sm">
                        <input type="checkbox" checked={day.rule103210.screens} onChange={() => handleRuleToggle(day, 'screens')} className="accent-red-600 w-4 h-4" />
                        1h: Képernyő stop
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer hover:text-white text-gray-300 text-sm">
                        <input type="checkbox" checked={day.rule103210.snooze} onChange={() => handleRuleToggle(day, 'snooze')} className="accent-red-600 w-4 h-4" />
                        0 szundigomb
                      </label>
                      <button onClick={() => setActiveDayEdit(null)} className="mt-2 bg-red-700 text-white text-xs font-bold py-2 rounded uppercase italic">Bezárás</button>
                    </div>
                  )}
                </td>

                {/* Evening Hunger */}
                <td className="p-1 border-r border-[#1a1a1a]">
                  <select 
                    value={day.eveningHunger}
                    onChange={(e) => onUpdate(currentWeekNum, day.id, { eveningHunger: Number(e.target.value) })}
                    className={`w-full h-full bg-transparent text-center focus:outline-none focus:ring-1 focus:ring-red-500 font-bold ${day.eveningHunger === 0 ? 'text-gray-700' : ''}`}
                  >
                    <option value={0} className="bg-black">-</option>
                    {[1,2,3,4,5].map(v => <option key={v} value={v} className="bg-black">{v}</option>)}
                  </select>
                </td>

                {/* Wellbeing */}
                <td className="p-1 border-r border-[#1a1a1a]">
                  <select 
                    value={day.wellbeing}
                    onChange={(e) => onUpdate(currentWeekNum, day.id, { wellbeing: Number(e.target.value) })}
                    className={`w-full h-full bg-transparent text-center focus:outline-none focus:ring-1 focus:ring-red-500 font-bold ${day.wellbeing === 0 ? 'text-gray-700' : ''}`}
                  >
                    <option value={0} className="bg-black">-</option>
                    {[1,2,3,4,5].map(v => <option key={v} value={v} className="bg-black">{v}</option>)}
                  </select>
                </td>

                {/* Notes */}
                <td className="p-1">
                  <input 
                    type="text"
                    value={day.notes}
                    placeholder="Súly, megjegyzés..."
                    onChange={(e) => onUpdate(currentWeekNum, day.id, { notes: e.target.value })}
                    className="w-full h-full bg-transparent px-3 focus:outline-none focus:ring-1 focus:ring-red-500 text-sm italic text-gray-400"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="bg-[#1a1a1a] p-4 rounded-xl text-xs text-gray-500 italic">
        * Tipp: Az adatok automatikusan mentődnek a böngésződben.
      </div>
    </div>
  );
};

export default WeeklyLog;
