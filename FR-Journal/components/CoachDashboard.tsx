import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { AppState, WeekData, DayData } from "../types";

// --- Ikonok ---
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const ActivityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

// --- Típusok és Helper függvények  ---
type Client = {
  id: string;
  email: string;
};

function isDayFilled(d: DayData) {
  const notes = (d as any).notes ?? "";
  const sleep = (d as any).sleep;
  const water = (d as any).water;
  const nutrition = (d as any).nutrition;
  const wellbeing = (d as any).wellbeing;
  const workout = (d as any).workout;

  const rule = (d as any).rule103210;
  const ruleAny =
    rule && typeof rule === "object"
      ? Object.values(rule).some((v) => v === true)
      : false;

  return (
    (typeof notes === "string" && notes.trim().length > 0) ||
    (typeof sleep === "number" && sleep !== 0) ||
    (typeof water === "number" && water !== 0) ||
    (typeof nutrition === "number" && nutrition !== 0) ||
    (typeof wellbeing === "number" && wellbeing !== 0) ||
    workout === true ||
    ruleAny
  );
}

function avg(arr: number[]) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
}

function weekSummary(week: WeekData) {
  const days: DayData[] = (week.days ?? []) as any;

  const filledDays = days.filter(isDayFilled).length;
  const workouts = days.filter((d: any) => d.workout === true).length;

  const sleepVals = days.map((d: any) => d.sleep).filter((x) => typeof x === "number");
  const waterVals = days.map((d: any) => d.water).filter((x) => typeof x === "number");
  const nutritionVals = days.map((d: any) => d.nutrition).filter((x) => typeof x === "number");
  const wellbeingVals = days.map((d: any) => d.wellbeing).filter((x) => typeof x === "number");

  return {
    filledDays,
    workouts,
    avgSleep: avg(sleepVals) as number | null,
    avgWater: avg(waterVals) as number | null,
    avgNutrition: avg(nutritionVals) as number | null,
    avgWellbeing: avg(wellbeingVals) as number | null,
  };
}

function badge(ok: boolean) {
  return ok ? (
    <span className="text-green-400 text-xs font-bold border border-green-500/30 bg-green-500/10 px-2 py-0.5 rounded">OK</span>
  ) : (
    <span className="text-gray-600 text-xs">—</span>
  );
}

// --- Fő Komponens ---

export default function CoachDashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selected, setSelected] = useState<Client | null>(null);

  const [appState, setAppState] = useState<AppState | null>(null);

  const [selectedWeek, setSelectedWeek] = useState<WeekData | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  // kliensek betöltése
  useEffect(() => {
    (async () => {
      setLoading(true);
      setMsg("");

      const { data, error } = await supabase
        .from("profiles")
        .select("id,email")
        .neq("role", "admin")
        .order("created_at", { ascending: false });

      if (error) setMsg(error.message);
      if (!error && data) setClients(data);

      setLoading(false);
    })();
  }, []);

  const loadClientState = async (client: Client) => {
    setSelected(client);
    setAppState(null);
    setSelectedWeek(null);
    setSelectedDay(null);
    setMsg("");

    const { data, error } = await supabase
      .from("user_state")
      .select("data,updated_at")
      .eq("user_id", client.id)
      .maybeSingle();

    if (error) {
      setMsg(error.message);
      return;
    }

    if (!data?.data) {
      setMsg("Nincs még mentett adat ennél a kliensnél.");
      return;
    }

    setAppState(data.data as AppState);
  };

  const weeks = appState?.weeks ?? [];

  const totalFilled = useMemo(() => {
    let filled = 0;
    let total = 0;
    for (const w of weeks as any[]) {
      total += w.days?.length ?? 0;
      filled += (w.days ?? []).filter(isDayFilled).length;
    }
    return { filled, total };
  }, [weeks]);

  const selectWeek = (w: WeekData) => {
    setSelectedWeek(w);
    setSelectedDay(null);
  };

  const selectDay = (d: DayData) => {
    setSelectedDay(d);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 font-sans p-6">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-4">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-wide">
              Fighter Reset <span className="text-red-600">Coach</span>
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Kliensek és naplók áttekintése
            </p>
          </div>
          {msg && (
            <div className="mt-4 md:mt-0 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm">
              {msg}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-180px)]">
          
          {/* 1) KLIENS LISTA (SIDEBAR) */}
          <div className="bg-[#111] border border-white/5 rounded-2xl p-4 flex flex-col h-full shadow-xl">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 pl-2">Kliensek</h3>
            <div className="overflow-y-auto space-y-2 pr-2 custom-scrollbar flex-1">
              {clients.map((c) => (
                <div
                  key={c.id}
                  onClick={() => loadClientState(c)}
                  className={`cursor-pointer px-4 py-3 rounded-xl text-sm flex items-center gap-3 transition-all duration-200 group border ${
                    selected?.id === c.id
                      ? "bg-gradient-to-r from-red-900/40 to-red-800/10 border-red-500/30 text-white shadow-[0_0_15px_rgba(220,38,38,0.1)]"
                      : "bg-[#1a1a1a] border-transparent hover:bg-[#222] hover:border-white/5 text-gray-400 hover:text-gray-200"
                  }`}
                >
                   <div className={`p-1.5 rounded-full ${selected?.id === c.id ? "bg-red-600" : "bg-[#252525] group-hover:bg-[#333]"}`}>
                      <UserIcon />
                   </div>
                   <span className="truncate font-medium">{c.email || "Ismeretlen ID"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 2) MIDDLE PANEL (HETEK + NAPOK) */}
          <div className="lg:col-span-2 bg-[#111] border border-white/5 rounded-2xl p-6 flex flex-col h-full shadow-xl overflow-y-auto">
            {!selected ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-3 opacity-50">
                <UserIcon />
                <p>Válassz ki egy klienst bal oldalt az adatok betöltéséhez.</p>
              </div>
            ) : (
              <>
                {/* Selected Client Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                       {selected.email}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">Statisztika áttekintő</p>
                  </div>
                  <div className="bg-[#1a1a1a] border border-white/5 px-4 py-2 rounded-lg text-right">
                    <div className="text-xs text-gray-500 uppercase">Kitöltöttség</div>
                    <div className="text-lg font-bold text-white">
                      <span className="text-red-500">{totalFilled.filled}</span> / {totalFilled.total} nap
                    </div>
                  </div>
                </div>

                {appState && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    
                    {/* HETEK GRID */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Hetek</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                        {weeks.map((w: any) => {
                          const s = weekSummary(w);
                          const active = selectedWeek?.weekNumber === w.weekNumber;
                          return (
                            <button
                              key={w.weekNumber}
                              onClick={() => selectWeek(w)}
                              className={`relative text-left rounded-xl p-3 border transition-all duration-200 ${
                                active
                                  ? "bg-red-600 text-white border-red-500 shadow-lg scale-[1.02]"
                                  : "bg-[#1a1a1a] border-[#252525] hover:border-red-500/30 hover:bg-[#222] text-gray-400"
                              }`}
                            >
                              <div className="text-sm font-bold flex justify-between items-center">
                                {w.weekNumber}. hét
                                {active && <div className="h-2 w-2 bg-white rounded-full animate-pulse" />}
                              </div>
                              <div className="mt-2 space-y-1">
                                <div className="text-[10px] uppercase opacity-70">Kitöltve</div>
                                <div className="text-lg font-bold leading-none">{s.filledDays}<span className="text-xs opacity-50">/{w.days?.length}</span></div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* NAPOK LISTA */}
                    {selectedWeek && (
                      <div className="animate-in slide-in-from-bottom-2 duration-300">
                        <h4 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider flex items-center gap-2">
                           {selectedWeek.weekNumber}. hét napjai
                           <span className="h-px bg-gray-800 flex-1"></span>
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {(selectedWeek.days as any[]).map((d) => {
                            const active = (selectedDay as any)?.id === d.id;
                            const filled = isDayFilled(d as any);
                            return (
                              <button
                                key={d.id}
                                onClick={() => selectDay(d as any)}
                                className={`flex items-center justify-between rounded-xl px-4 py-3 border text-sm transition-all ${
                                  active
                                    ? "bg-red-600/10 border-red-500 text-red-100 ring-1 ring-red-500/50"
                                    : "bg-[#1a1a1a] border-[#252525] hover:bg-[#222] text-gray-300"
                                }`}
                              >
                                <span className="font-medium">{(d as any).dayName ?? d.id}</span>
                                <div className={`h-2.5 w-2.5 rounded-full ${filled ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-gray-700"}`} />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* 3) RÉSZLETES NAP NÉZET */}
          <div className="bg-[#111] border border-white/5 rounded-2xl p-6 h-full shadow-xl overflow-y-auto">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Részletek</h3>

            {!selectedDay ? (
               <div className="h-40 flex items-center justify-center text-gray-600 text-sm border-2 border-dashed border-[#222] rounded-xl">
                 Válassz napot a részletekhez
               </div>
            ) : (
              <div className="space-y-6 animate-in zoom-in-95 duration-200">
                
                {/* Cím */}
                <div className="border-b border-white/5 pb-4">
                  <div className="text-2xl font-bold text-white">
                    {(selectedDay as any).dayName ?? (selectedDay as any).id}
                  </div>
                  <div className="text-xs text-gray-500 font-mono mt-1">
                    ID: {(selectedDay as any).id}
                  </div>
                </div>

                {/* STAT CARDS Grid */}
                <div className="grid grid-cols-2 gap-3">
                   {/* Alvás */}
                   <div className="bg-[#1a1a1a] border border-white/5 p-3 rounded-xl">
                      <div className="text-xs text-gray-500 mb-1">Alvás</div>
                      <div className="text-lg font-bold text-white">{(selectedDay as any).sleep ?? "—"} <span className="text-xs font-normal text-gray-600">óra</span></div>
                   </div>
                   {/* Víz */}
                   <div className="bg-[#1a1a1a] border border-white/5 p-3 rounded-xl">
                      <div className="text-xs text-gray-500 mb-1">Víz</div>
                      <div className="text-lg font-bold text-white">{(selectedDay as any).water ?? "—"} <span className="text-xs font-normal text-gray-600">L</span></div>
                   </div>
                   {/* Kaja */}
                   <div className="bg-[#1a1a1a] border border-white/5 p-3 rounded-xl">
                      <div className="text-xs text-gray-500 mb-1">Kaja</div>
                      <div className="text-lg font-bold text-white">{(selectedDay as any).nutrition ?? "—"} <span className="text-xs font-normal text-gray-600">/5</span></div>
                   </div>
                   {/* Közérzet */}
                   <div className="bg-[#1a1a1a] border border-white/5 p-3 rounded-xl">
                      <div className="text-xs text-gray-500 mb-1">Közérzet</div>
                      <div className="text-lg font-bold text-white">{(selectedDay as any).wellbeing ?? "—"} <span className="text-xs font-normal text-gray-600">/5</span></div>
                   </div>
                </div>

                {/* Edzés Kártya */}
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                    (selectedDay as any).workout 
                    ? "bg-green-500/10 border-green-500/30 text-green-400" 
                    : "bg-[#1a1a1a] border-[#252525] text-gray-500"
                }`}>
                    <span className="font-bold text-sm">Edzés</span>
                    {(selectedDay as any).workout ? <ActivityIcon /> : "—"}
                </div>

                {/* 10-3-2-1-0 Szabály */}
                <div className="bg-[#1a1a1a] border border-white/5 rounded-xl p-4">
                  <div className="font-bold text-white text-sm mb-3 border-b border-white/5 pb-2">10-3-2-1-0 Szabály</div>
                  {(() => {
                    const r = (selectedDay as any).rule103210;
                    if (!r) return <div className="text-gray-500 text-xs italic">Nincs adat rögzítve.</div>;
                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm text-gray-300"><span>Meal</span> {badge(!!r.meal)}</div>
                        <div className="flex justify-between items-center text-sm text-gray-300"><span>Fluids</span> {badge(!!r.fluids)}</div>
                        <div className="flex justify-between items-center text-sm text-gray-300"><span>Snooze</span> {badge(!!r.snooze)}</div>
                        <div className="flex justify-between items-center text-sm text-gray-300"><span>Screens</span> {badge(!!r.screens)}</div>
                        <div className="flex justify-between items-center text-sm text-gray-300"><span>Caffeine</span> {badge(!!r.caffeine)}</div>
                      </div>
                    );
                  })()}
                </div>

                {/* Megjegyzés */}
                <div className="bg-[#1a1a1a] border border-white/5 rounded-xl p-4">
                  <div className="font-bold text-gray-400 text-xs uppercase mb-2">Megjegyzés</div>
                  <div className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed">
                    {((selectedDay as any).notes ?? "").trim() || <span className="text-gray-600 italic">Nincs megjegyzés.</span>}
                  </div>
                </div>

                {/* Debug Collapse */}
                <details className="group">
                  <summary className="cursor-pointer text-xs text-gray-600 hover:text-red-500 transition-colors list-none">
                    [+] Nyers JSON adat (Debug)
                  </summary>
                  <div className="bg-black border border-gray-800 rounded-lg p-3 mt-2">
                     <pre className="text-[10px] text-green-400 overflow-auto max-h-40 font-mono">
                        {JSON.stringify(selectedDay, null, 2)}
                     </pre>
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
