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

// --- IKONOK (SVG) ---
const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
);
const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
);
const LogOutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
);
const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
);
const CoachIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
);

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

  // Modern Loading Screen
  if (!ready) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
         <div className="flex flex-col items-center gap-4">
             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
             <p className="text-gray-500 text-sm animate-pulse">Adatok betöltése...</p>
         </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-[#0a0a0a] font-sans text-gray-200 selection:bg-red-500/30">
        <Header />

        <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl space-y-12">
          <Routes>
            {/* ✅ Edzői route csak adminnak */}
            {isAdmin && <Route path="/coach" element={<CoachDashboard />} />}

            <Route
              path="/"
              element={
                <div className="space-y-10 animate-in fade-in duration-500">
                  <RuleInfo />

                  {/* ✅ Edzői gomb (csak admin) - Prémium stílus */}
                  {isAdmin && (
                    <div className="flex justify-end">
                      <Link
                        to="/coach"
                        className="group relative inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-900 to-red-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-900/20 hover:shadow-red-600/40 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
                      >
                         <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                         <CoachIcon />
                         Edzői felület
                      </Link>
                    </div>
                  )}

                  {/* HETEK GRID */}
                  <div>
                    <h2 className="text-xl font-bold text-gray-400 mb-6 flex items-center gap-2">
                       <span className="w-1 h-6 bg-red-600 rounded-full"></span>
                       Napló bejegyzések
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                      {state.weeks.map((week) => (
                        <Link
                          key={week.weekNumber}
                          to={`/week/${week.weekNumber}`}
                          className="group relative overflow-hidden bg-[#111] border border-white/5 rounded-2xl p-6 transition-all duration-300 hover:border-red-500/50 hover:shadow-[0_0_20px_rgba(220,38,38,0.1)] hover:-translate-y-1"
                        >
                          {/* Dekoratív háttérszám */}
                          <div className="absolute -right-4 -top-6 text-[100px] font-black text-white/[0.02] group-hover:text-red-600/[0.05] transition-colors select-none pointer-events-none">
                            {week.weekNumber}
                          </div>

                          <div className="relative z-10 flex flex-col h-full justify-between">
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-bold text-white group-hover:text-red-500 transition-colors">
                                  {week.weekNumber}. hét
                                </h3>
                                <div className="text-gray-600 group-hover:text-red-500 group-hover:translate-x-1 transition-all duration-300">
                                   <ArrowRightIcon />
                                </div>
                              </div>
                              <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">
                                Self-check napló
                              </p>
                            </div>
                            
                            {/* Opcionális: Progress bar placeholder, ha később lenne adat */}
                            <div className="w-full h-1 bg-[#222] rounded-full mt-6 overflow-hidden">
                               <div className="h-full bg-red-600 w-0 group-hover:w-full transition-all duration-700 ease-out opacity-50"></div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="mt-12">
                    <h2 className="text-xl font-bold text-gray-400 mb-6 flex items-center gap-2">
                       <span className="w-1 h-6 bg-gray-600 rounded-full"></span>
                       Összesítés
                    </h2>
                    <ProgressDashboard weeks={state.weeks} />
                  </div>

                  {/* VEZÉRLŐPULT (Control Panel) */}
                  <div className="mt-16 bg-[#111] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-900/20 to-transparent"></div>
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      
                      {/* Állapotjelző */}
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <div className="absolute top-0 left-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
                        </div>
                        <div>
                          <span className="block text-sm font-bold text-gray-300 uppercase tracking-wide">
                            Fiók Szinkronizálva
                          </span>
                          {lastSaved && (
                            <span className="text-xs text-gray-500 font-mono">
                              Utolsó mentés: {lastSaved}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Gombok Csoportja */}
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={exportData}
                          className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#252525] hover:text-white text-gray-400 text-sm font-bold rounded-xl transition-all border border-white/5 hover:border-white/10 flex items-center gap-2"
                        >
                          <DownloadIcon /> Exportálás
                        </button>
                        
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#252525] hover:text-white text-gray-400 text-sm font-bold rounded-xl transition-all border border-white/5 hover:border-white/10 flex items-center gap-2"
                        >
                          <UploadIcon /> Importálás
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={importData}
                          className="hidden"
                          accept=".json"
                        />
                        
                        <div className="w-px h-8 bg-white/10 mx-1 hidden md:block"></div>

                        <button
                          onClick={resetData}
                          className="px-4 py-2 bg-[#1a0505] hover:bg-red-900/20 text-red-500 hover:text-red-400 text-sm font-bold rounded-xl transition-all border border-red-900/20 flex items-center gap-2"
                        >
                          <TrashIcon /> Reset
                        </button>

                        <button
                          onClick={logout}
                          className="px-4 py-2 bg-[#252525] hover:bg-white text-white hover:text-black text-sm font-bold rounded-xl transition-colors border border-transparent shadow-lg flex items-center gap-2"
                        >
                          <LogOutIcon /> Kilépés
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              }
            />

            <Route path="/week/:weekNum" element={<WeeklyLog weeks={state.weeks} onUpdate={updateDay} />} />
          </Routes>
        </main>

        <footer className="py-10 bg-[#050505] text-center border-t border-white/5">
          <p className="text-gray-500 text-sm font-medium">© 2025 Fighter Reset Program</p>
          <p className="text-xs text-gray-600 mt-2">Minden jog fenntartva.</p>
        </footer>
      </div>
    </Router>
  );
};

export default OriginalApp;
