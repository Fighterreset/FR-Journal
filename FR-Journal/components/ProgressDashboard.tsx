
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { WeekData } from '../types';

interface ProgressDashboardProps {
  weeks: WeekData[];
}

const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ weeks }) => {
  // Aggregate data for visualization
  const flattenedData = weeks.flatMap(w => w.days.map(d => ({
    label: `${w.weekNumber}. hét ${d.dayName.substring(0, 1)}.`,
    water: d.water,
    sleep: d.sleep,
    nutrition: d.nutrition,
    wellbeing: d.wellbeing,
    isWorkout: d.workout
  }))).filter(d => d.water > 0 || d.isWorkout);

  if (flattenedData.length === 0) {
    return (
      <div className="p-12 text-center border-2 border-dashed border-[#252525] rounded-2xl">
        <p className="text-gray-500 font-medium">Kezdd el tölteni a naplót a statisztikák megjelenítéséhez!</p>
      </div>
    );
  }

  const workoutCount = flattenedData.filter(d => d.isWorkout).length;
  const avgSleep = (flattenedData.reduce((acc, d) => acc + d.sleep, 0) / flattenedData.length).toFixed(1);
  const avgWater = (flattenedData.reduce((acc, d) => acc + d.water, 0) / flattenedData.length).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#252525]">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Edzések száma</p>
          <p className="text-4xl font-black text-white italic">{workoutCount} <span className="text-sm text-red-600">alkalom</span></p>
        </div>
        <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#252525]">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Átlagos alvás</p>
          <p className="text-4xl font-black text-white italic">{avgSleep} <span className="text-sm text-red-600">óra</span></p>
        </div>
        <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#252525]">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Átlagos vízfogyasztás</p>
          <p className="text-4xl font-black text-white italic">{avgWater} <span className="text-sm text-red-600">liter</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#252525] h-80">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Folyadék & Alvás Trend</h4>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={flattenedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="label" stroke="#666" fontSize={10} hide />
              <YAxis stroke="#666" fontSize={10} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                itemStyle={{ color: '#fff' }}
              />
              <Line type="monotone" dataKey="water" stroke="#b91c1c" strokeWidth={2} dot={false} name="Víz (L)" />
              <Line type="monotone" dataKey="sleep" stroke="#4f46e5" strokeWidth={2} dot={false} name="Alvás (H)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#252525] h-80">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Közérzet & Étkezés</h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={flattenedData.slice(-14)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="label" stroke="#666" fontSize={10} hide />
              <YAxis stroke="#666" fontSize={10} domain={[0, 5]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey="wellbeing" fill="#b91c1c" radius={[4, 4, 0, 0]} name="Közérzet" />
              <Bar dataKey="nutrition" fill="#facc15" radius={[4, 4, 0, 0]} name="Étkezés" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ProgressDashboard;
