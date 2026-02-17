import React, { useState, useEffect, useCallback, useRef } from "react";
import { HashRouter as Router, Routes, Route, Link } from "react-router-dom";
import { AppState, DayData } from "../types";
import { INITIAL_WEEKS, APP_STORAGE_KEY } from "../constants";
import WeeklyLog from "./WeeklyLog";
import ProgressDashboard from "./ProgressDashboard";
import Header from "./Header";
import RuleInfo from "./RuleInfo";
import { loadUserState, saveUserState } from "../lib/userState";
import { supabase } from "../lib/supabase";
import CoachDashboard from "./CoachDashboard";

type Props = {
  userId: string;
};

const OriginalApp: React.FC<Props> = ({ userId }) => {
  const [state, setState] = useState<AppState>({ weeks: INITIAL_WEEKS });
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // ✅ admin/coach flag
  const [isAdmin, setIsAdmin] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<number | null>(null);

  // 0) ROLE (admin?) betöltése a profiles táblából
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .maybeSingle();

        if (!cancelled) {
          if (!error && data?.role === "admin") setIsAdmin(true);
          else setIsAdmin(false);
        }
      } catch (e) {
        if (!cancelled) setIsAdmin(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // 1) BETÖLTÉS belépés után (Supabase-ből)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const cloud = await loadUserState<AppState>(userId);

        // ha van felhős mentés → azt használjuk
        if (cloud?.weeks && !cancelled) {
          setState(cloud);
          setReady(true);
          return;
        }

        // ha nincs felhős mentés, de van régi localStorage → felajánljuk importálni
        const local = localStorage.getItem(APP_STORAGE_KEY);
        if (local && !cancelled) {
          try {
            const parsed = JSON.parse(local) as AppState;
            if (parsed?.weeks) {
              const ok = window.confirm(
                "Találtam korábbi adatokat a böngészőben. Importáljam a fiókodba?"
              );
              if (ok) {
                setState(parsed);
                // az első mentést majd az autosave elintézi
              } else {
                setState({ weeks: INITIAL_WEEKS });
              }
            }
          } catch {
            setState({ weeks: INITIAL_WEEKS });
          }
        }

        if (!cancelled) setReady(true);
      } catch (e) {
        console.error("Failed to load cloud state", e);
        if (!cancelled) {
          setReady(true);
          setState({ weeks: INITIAL_WEEKS });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // 2) AUTOSAVE Supabase-be (debounce)
  useEffect(() => {
    if (!ready) return;

    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      saveUserState(userId, state)
        .then(() => {
          const now = new Date();
          setLastSaved(
            now.toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" })
          );
        })
        .catch((e) => console.error("Save failed", e));
    }, 700);

    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [state, ready, userId]);

  const updateDay = useCallback((weekNum: number, dayId: string, updates: Partial<DayData>) => {
    setState((prev) => ({
      ...prev,
      weeks: prev.weeks.map((w) => {
        if (w.weekNumber !== weekNum) return w;
        return {
          ...w,
          days: w.days.map((d) => (d.id === dayId ? { ...d, ...updates } : d)),
        };
      }),
    }));
  }, []);

  const exportData = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `fighter-reset-naplo-${new Date().toISOString().split("T")[0]}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = event.target.files;
    if (!files || files.length === 0) return;

    fileReader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === "string") {
        try {
          const importedState = JSON.parse(content);
          if (importedState.weeks) {
            setState(importedState);
            alert("Adatok sikeresen importálva!");
          }
        } catch (error) {
          alert("Hiba: Érvénytelen fájlformátum.");
        }
      }
    };
    fileReader.readAsText(files[0]);
  };

  const resetData = () => {
    if (window.confirm("Biztosan törölni akarod az összes eddigi adatot? Ez nem vonható vissza.")) {
      setState({ weeks: INITIAL_WEEKS });
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  if (!ready) {
    return <div className="min-h-screen bg-[#0f0f0f] text-white p-6">Betöltés…</div>;
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-[#0f0f0f]">
        <Header />

        <main className="flex-grow container mx-auto px-4 py-6 max-w-7xl">
          <Routes>
            {/* ✅ Edzői route csak adminnak */}
            {isAdmin && <Route path="/coach" element={<CoachDashboard />} />}

            <Route
              path="/"
              element={
                <div className="space-y-8">
                  <RuleInfo />

                  {/* ✅ Edzői gomb a főoldal tetején (csak admin) */}
                  {isAdmin && (
                    <div>
                      <Link
                        to="/coach"
                        className="inline-block px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-sm font-bold"
                      >
                        Edzői felület
                      </Link>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {state.weeks.map((week) => (
                      <Link
                        key={week.weekNumber}
                        to={`/week/${week.weekNumber}`}
                        className="group p-6 bg-[#1a1a1a] border-l-4 border-red-700 hover:bg-[#252525] transition-all rounded-r-lg flex items-center justify-between shadow-lg"
                      >
                        <div>
                          <h3 className="text-xl font-bold text-white group-hover:text-red-500">
                            {week.weekNumber}. hét
                          </h3>
                          <p className="text-gray-400 text-sm">Self-check napló töltése</p>
                        </div>
                        <span className="text-red-600 font-bold text-2xl">→</span>
                      </Link>
                    ))}
                  </div>

                  <div className="mt-12">
                    <ProgressDashboard weeks={state.weeks} />
                  </div>

                  <div className="mt-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1a1a1a] p-4 rounded-xl border border-[#252525]">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-bold text-gray-400 uppercase">
                        Adatok a fiókodban tárolva
                      </span>
                      {lastSaved && (
                        <span className="text-[10px] text-gray-600 italic">Utolsó mentés: {lastSaved}</span>
                      )}
                    </div>

                    <div className="flex gap-3 flex-wrap">
                      <button
                        onClick={exportData}
                        className="px-3 py-1.5 bg-[#252525] hover:bg-[#333] text-white text-xs font-bold rounded-lg transition-colors border border-[#333] flex items-center gap-2"
                      >
                        📁 Exportálás
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-[#252525] hover:bg-[#333] text-white text-xs font-bold rounded-lg transition-colors border border-[#333] flex items-center gap-2"
                      >
                        📤 Importálás
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={importData}
                        className="hidden"
                        accept=".json"
                      />
                      <button
                        onClick={logout}
                        className="px-3 py-1.5 bg-[#252525] hover:bg-[#333] text-white text-xs font-bold rounded-lg transition-colors border border-[#333]"
                      >
                        Kijelentkezés
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-center pt-4">
                    <button
                      onClick={resetData}
                      className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-red-500 transition-colors"
                    >
                      Minden adat törlése (Alaphelyzet)
                    </button>
                  </div>
                </div>
              }
            />

            <Route path="/week/:weekNum" element={<WeeklyLog weeks={state.weeks} onUpdate={updateDay} />} />
          </Routes>
        </main>

        <footer className="py-8 bg-[#0a0a0a] text-center text-gray-500 text-sm border-t border-[#1a1a1a]">
          <p>© 2025 Fighter Reset</p>
          <p className="mt-1">Minden jog fenntartva</p>
        </footer>
      </div>
    </Router>
  );
};

export default OriginalApp;
