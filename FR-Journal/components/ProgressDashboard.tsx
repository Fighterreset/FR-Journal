import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, AreaChart, Area 
} from 'recharts';
import { WeekData } from '../types';

// Ikonok
const DumbbellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
);
const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
);
const DropIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
);
const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
);

interface ProgressDashboardProps {
  weeks: WeekData[];
}

// Egyedi Tooltip a grafikonokhoz
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a1a]/95 backdrop-blur-md border border-white/10 p-3 rounded-lg shadow-xl">
        <p className="text-gray-400 text-xs mb-2 font-mono">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm font-bold" style={{ color: entry.color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
            {entry.name}: {entry.value}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ weeks }) => {
  // Aggregate data for visualization
  // Flattening: Csak azokat a napokat vesszük figyelembe, ahol van valami adat
  let flattenedData: any[] = [];
  
  weeks.forEach(w => {
    if (w.days) {
        w.days.forEach(d => {
             // Csak ha van releváns adat
             if (d.water > 0 || d.sleep > 0 || d.workout || d.nutrition > 0) {
                 flattenedData.push({
                    label: `${w.weekNumber}. hét / ${(d as any).dayName ? (d as any).dayName.substring(0,3) : d.id}`,
                    fullDate: `${w.weekNumber}. hét - ${(d as any).dayName || d.id}`,
                    water: d.water || 0,
                    sleep: d.sleep || 0,
                    nutrition: d.nutrition || 0,
                    wellbeing: d.wellbeing || 0,
                    isWorkout: d.workout ? 1 : 0
                 });
             }
        });
    }
  });


  if (flattenedData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-[#333] bg-[#111] rounded-2xl h-64">
        <div className="mb-4 bg-[#1a1a1a] p-4 rounded-full">
           <ChartIcon />
        </div>
        <h3 className="text-gray-300 font-bold text-lg">Nincs megjeleníthető adat</h3>
        <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
          Kezdd el tölteni a naplódat (alvás, víz, edzés), hogy itt lásd a fejlődésedet!
        </p>
      </div>
    );
  }

  const workoutCount = flattenedData.filter(d => d.isWorkout === 1).length;
  // Átlag számítás (csak ahol > 0)
  const sleepDays = flattenedData.filter(d => d.sleep > 0);
  const avgSleep = sleepDays.length > 0 
      ? (sleepDays.reduce((acc, d) => acc + d.sleep, 0) / sleepDays.length).toFixed(1) 
      : "0.0";
  
  const waterDays = flattenedData.filter(d => d.water > 0);
  const avgWater = waterDays.length > 0 
      ? (waterDays.reduce((acc, d) => acc + d.water, 0) / waterDays.length).toFixed(1) 
      : "0.0";

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* 1. STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Edzések */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#111] p-6 rounded-2xl border border-white/5 shadow-lg group hover:border-red-500/30 transition-all duration-300">
          <div className="absolute right-4 top-4 text-gray-800 opacity-20 group-hover:opacity-40 group-hover:text-red-900 transition-all duration-500 transform group-hover:scale-110">
             <DumbbellIcon />
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-red-600"></span> Edzések
          </p>
          <div className="flex items-baseline gap-2">
             <p className="text-4xl font-black text-white">{workoutCount}</p>
             <span className="text-sm font-medium text-gray-500">alkalom</span>
          </div>
        </div>

        {/* Alvás */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#111] p-6 rounded-2xl border border-white/5 shadow-lg group hover:border-indigo-500/30 transition-all duration-300">
          <div className="absolute right-4 top-4 text-gray-800 opacity-20 group-hover:opacity-40 group-hover:text-indigo-900 transition-all duration-500 transform group-hover:scale-110">
             <MoonIcon />
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Átlagos alvás
          </p>
          <div className="flex items-baseline gap-2">
             <p className="text-4xl font-black text-white">{avgSleep}</p>
             <span className="text-sm font-medium text-gray-500">óra</span>
          </div>
        </div>

        {/* Víz */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#111] p-6 rounded-2xl border border-white/5 shadow-lg group hover:border-cyan-500/30 transition-all duration-300">
          <div className="absolute right-4 top-4 text-gray-800 opacity-20 group-hover:opacity-40 group-hover:text-cyan-900 transition-all duration-500 transform group-hover:scale-110">
             <DropIcon />
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-cyan-500"></span> Átlagos víz
          </p>
          <div className="flex items-baseline gap-2">
             <p className="text-4xl font-black text-white">{avgWater}</p>
             <span className="text-sm font-medium text-gray-500">liter</span>
          </div>
        </div>
      </div>

      {/* 2. CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* AREA CHART: Víz & Alvás */}
        <div className="bg-[#111] p-6 rounded-2xl border border-white/5 shadow-xl h-96 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
               Folyadék & Alvás
            </h4>
            <div className="flex gap-3 text-[10px] font-bold uppercase">
               <span className="flex items-center gap-1 text-cyan-400"><span className="w-2 h-2 rounded-full bg-cyan-500"></span> Víz</span>
               <span className="flex items-center gap-1 text-indigo-400"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> Alvás</span>
            </div>
          </div>
          
          <div className="flex-grow w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={flattenedData}>
                <defs>
                  <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="label" stroke="#444" fontSize={10} tickMargin={10} tick={{fill: '#666'}} />
                <YAxis stroke="#444" fontSize={10} tick={{fill: '#666'}} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="water" stroke="#06b6d4" fillOpacity={1} fill="url(#colorWater)" strokeWidth={2} name="Víz" />
                <Area type="monotone" dataKey="sleep" stroke="#6366f1" fillOpacity={1} fill="url(#colorSleep)" strokeWidth={2} name="Alvás" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BAR CHART: Közérzet & Étkezés */}
        <div className="bg-[#111] p-6 rounded-2xl border border-white/5 shadow-xl h-96 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
               Közérzet & Étkezés
               <span className="text-[10px] text-gray-600 ml-2 normal-case font-normal">(Utolsó 14 rögzített nap)</span>
            </h4>
          </div>

          <div className="flex-grow w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={flattenedData.slice(-14)} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="label" stroke="#444" fontSize={10} tickMargin={10} tick={{fill: '#666'}} />
                <YAxis stroke="#444" fontSize={10} tick={{fill: '#666'}} domain={[0, 5]} width={30} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: '#ffffff05'}} />
                <Bar dataKey="wellbeing" fill="#22c55e" radius={[4, 4, 0, 0]} name="Közérzet" barSize={12} />
                <Bar dataKey="nutrition" fill="#eab308" radius={[4, 4, 0, 0]} name="Étkezés" barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressDashboard;
