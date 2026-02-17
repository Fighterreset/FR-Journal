import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { AppState, WeekData, DayData } from "../types";

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
  return ok ? "✅" : "—";
}

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

  if (loading) return <div className="p-6 text-gray-200">Betöltés…</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Edzői felület</h2>
        <p className="text-sm text-gray-400">
          Kliens → hét → nap kiválasztása.
        </p>
      </div>

      {msg && (
        <div className="bg-[#1a1a1a] border border-[#252525] rounded-xl p-3 text-sm text-gray-200">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 1) kliens lista */}
        <div className="bg-[#1a1a1a] border border-[#252525] rounded-xl p-4">
          <h3 className="text-sm font-bold text-gray-400 mb-3">Kliensek</h3>
          <ul className="space-y-2">
            {clients.map((c) => (
              <li
                key={c.id}
                onClick={() => loadClientState(c)}
                className={`cursor-pointer px-3 py-2 rounded-lg text-sm ${
                  selected?.id === c.id
                    ? "bg-red-700 text-white"
                    : "bg-[#252525] hover:bg-[#333] text-gray-200"
                }`}
              >
                {c.email || c.id}
              </li>
            ))}
          </ul>
        </div>

        {/* 2) hetek + napok */}
        <div className="lg:col-span-2 bg-[#1a1a1a] border border-[#252525] rounded-xl p-4">
          {!selected && (
            <p className="text-gray-400 text-sm">
              Válassz ki egy klienst bal oldalt.
            </p>
          )}

          {selected && appState && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white">{selected.email}</h3>
                <p className="text-xs text-gray-400">
                  Kitöltött napok:{" "}
                  <span className="text-gray-200 font-bold">
                    {totalFilled.filled}
                  </span>{" "}
                  / {totalFilled.total}
                </p>
              </div>

              {/* HETEK (kattintható) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {weeks.map((w: any) => {
                  const s = weekSummary(w);
                  const active = selectedWeek?.weekNumber === w.weekNumber;
                  return (
                    <button
                      key={w.weekNumber}
                      onClick={() => selectWeek(w)}
                      className={`text-left rounded-lg p-3 border transition-colors ${
                        active
                          ? "bg-red-700 border-red-700 text-white"
                          : "bg-[#252525] border-[#333] hover:bg-[#333] text-gray-200"
                      }`}
                    >
                      <div className="text-sm font-bold">{w.weekNumber}. hét</div>
                      <div className="text-xs opacity-90 mt-1">
                        Kitöltve: <span className="font-bold">{s.filledDays}</span> /{" "}
                        {w.days?.length ?? 0}
                      </div>
                      <div className="text-xs opacity-80">Edzések: {s.workouts}</div>
                    </button>
                  );
                })}
              </div>

              {/* NAPOK LISTA (ha választott hét van) */}
              {selectedWeek && (
                <div className="mt-2">
                  <h4 className="text-sm font-bold text-gray-300 mb-2">
                    {selectedWeek.weekNumber}. hét – napok
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(selectedWeek.days as any[]).map((d) => {
                      const active = (selectedDay as any)?.id === d.id;
                      const filled = isDayFilled(d as any);
                      return (
                        <button
                          key={d.id}
                          onClick={() => selectDay(d as any)}
                          className={`flex items-center justify-between rounded-lg px-3 py-2 border text-sm transition-colors ${
                            active
                              ? "bg-red-700 border-red-700 text-white"
                              : "bg-[#252525] border-[#333] hover:bg-[#333] text-gray-200"
                          }`}
                        >
                          <span>{(d as any).dayName ?? d.id}</span>
                          <span className="text-xs">{filled ? "🟢" : "⚪"}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3) RÉSZLETES NAP NÉZET */}
        <div className="bg-[#1a1a1a] border border-[#252525] rounded-xl p-4">
          <h3 className="text-sm font-bold text-gray-400 mb-3">Részletek</h3>

          {!selectedDay && (
            <p className="text-gray-400 text-sm">
              Válassz ki egy napot a középső panelen.
            </p>
          )}

          {selectedDay && (
            <div className="space-y-4 text-sm text-gray-200">
              <div>
                <div className="text-lg font-bold text-white">
                  {(selectedDay as any).dayName ?? (selectedDay as any).id}
                </div>
                <div className="text-xs text-gray-400">
                  {(selectedDay as any).id}
                </div>
              </div>

              {/* alap mutatók */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#252525] border border-[#333] rounded-lg p-2">
                  Alvás: <span className="font-bold">{(selectedDay as any).sleep ?? "–"}</span>
                </div>
                <div className="bg-[#252525] border border-[#333] rounded-lg p-2">
                  Víz: <span className="font-bold">{(selectedDay as any).water ?? "–"}</span>
                </div>
                <div className="bg-[#252525] border border-[#333] rounded-lg p-2">
                  Kaja: <span className="font-bold">{(selectedDay as any).nutrition ?? "–"}</span>
                </div>
                <div className="bg-[#252525] border border-[#333] rounded-lg p-2">
                  Közérzet: <span className="font-bold">{(selectedDay as any).wellbeing ?? "–"}</span>
                </div>
              </div>

              <div className="bg-[#252525] border border-[#333] rounded-lg p-2">
                Edzés: <span className="font-bold">{(selectedDay as any).workout ? "✅" : "—"}</span>
              </div>

              {/* rule103210 */}
              <div className="bg-[#252525] border border-[#333] rounded-lg p-3">
                <div className="font-bold text-white mb-2">10-3-2-1-0 szabály</div>
                {(() => {
                  const r = (selectedDay as any).rule103210;
                  if (!r) return <div className="text-gray-400 text-xs">Nincs adat.</div>;
                  return (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Meal: {badge(!!r.meal)}</div>
                      <div>Fluids: {badge(!!r.fluids)}</div>
                      <div>Snooze: {badge(!!r.snooze)}</div>
                      <div>Screens: {badge(!!r.screens)}</div>
                      <div>Caffeine: {badge(!!r.caffeine)}</div>
                    </div>
                  );
                })()}
              </div>

              {/* notes */}
              <div className="bg-[#252525] border border-[#333] rounded-lg p-3">
                <div className="font-bold text-white mb-2">Megjegyzés</div>
                <div className="text-gray-200 whitespace-pre-wrap">
                  {((selectedDay as any).notes ?? "").trim() || "—"}
                </div>
              </div>

              {/* debug */}
              <details>
                <summary className="cursor-pointer text-xs text-gray-400">
                  Nyers nap adat (debug)
                </summary>
                <pre className="text-xs text-gray-300 overflow-auto max-h-72 mt-2">
                  {JSON.stringify(selectedDay, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
