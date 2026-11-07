import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { AppState, WeekData, DayData, MindsetExerciseId } from "../types";
import { MINDSET_EXERCISE_CATALOG, MINDSET_WEEK_PLAN } from "../constants";
import { useLanguage } from "../context/LanguageContext";

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
  email: string | null;
  full_name: string | null;
};

type ClientGroup = {
  id: string;
  name: string;
  created_at: string;
};

type GroupFilter = "all" | "ungrouped" | string;

function buildMindsetOverview(weeks: WeekData[]) {
  const exerciseIds = Object.keys(MINDSET_EXERCISE_CATALOG) as MindsetExerciseId[];
  const byExercise = Object.fromEntries(
    exerciseIds.map((id) => [id, { planned: 0, recorded: 0, completed: 0, notCompleted: 0 }])
  ) as Record<MindsetExerciseId, { planned: number; recorded: number; completed: number; notCompleted: number }>;

  let planned = 0;
  let recorded = 0;
  let completed = 0;
  let notCompleted = 0;

  const byWeek = weeks.map((week) => {
    const plan = MINDSET_WEEK_PLAN[week.weekNumber];
    if (!plan) return null;

    const exerciseIdsForWeek = [...plan.required, ...plan.optional];
    let weekPlanned = 0;
    let weekRecorded = 0;
    let weekCompleted = 0;
    let weekNotCompleted = 0;

    for (const day of week.days ?? []) {
      for (const id of exerciseIdsForWeek) {
        planned += 1;
        weekPlanned += 1;
        byExercise[id].planned += 1;
        const value = day.mindset?.[id];
        if (typeof value === "boolean") {
          recorded += 1;
          weekRecorded += 1;
          byExercise[id].recorded += 1;
          if (value) {
            completed += 1;
            weekCompleted += 1;
            byExercise[id].completed += 1;
          } else {
            notCompleted += 1;
            weekNotCompleted += 1;
            byExercise[id].notCompleted += 1;
          }
        }
      }
    }

    return {
      weekNumber: week.weekNumber,
      planned: weekPlanned,
      recorded: weekRecorded,
      completed: weekCompleted,
      notCompleted: weekNotCompleted,
      pending: weekPlanned - weekRecorded,
    };
  }).filter(Boolean) as Array<{
    weekNumber: number;
    planned: number;
    recorded: number;
    completed: number;
    notCompleted: number;
    pending: number;
  }>;

  return {
    planned,
    recorded,
    completed,
    notCompleted,
    pending: planned - recorded,
    byExercise,
    byWeek,
  };
}

function getDayMindsetProgress(day: DayData, weekNumber: number) {
  const plan = MINDSET_WEEK_PLAN[weekNumber];
  if (!plan) return { completed: 0, recorded: 0, total: 0 };
  const ids = [...plan.required, ...plan.optional];
  const values = ids.map((id) => day.mindset?.[id]);
  return {
    completed: values.filter((value) => value === true).length,
    recorded: values.filter((value) => typeof value === "boolean").length,
    total: ids.length,
  };
}

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
  const mindsetAny =
    d.mindset && typeof d.mindset === "object"
      ? Object.values(d.mindset).some((v) => typeof v === "boolean")
      : false;

  return (
    (typeof notes === "string" && notes.trim().length > 0) ||
    (typeof sleep === "number" && sleep !== 0) ||
    (typeof water === "number" && water !== 0) ||
    (typeof nutrition === "number" && nutrition !== 0) ||
    (typeof wellbeing === "number" && wellbeing !== 0) ||
    workout === true ||
    ruleAny ||
    mindsetAny
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
  const [groups, setGroups] = useState<ClientGroup[]>([]);
  const [memberships, setMemberships] = useState<Record<string, string>>({});
  const [coachId, setCoachId] = useState<string | null>(null);
  const [activeGroupFilter, setActiveGroupFilter] = useState<GroupFilter>("all");
  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState("");
  const [confirmDeleteGroupId, setConfirmDeleteGroupId] = useState<string | null>(null);
  const [groupBusy, setGroupBusy] = useState(false);

  const [appState, setAppState] = useState<AppState | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<WeekData | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const { t, language } = useLanguage();

  // Napok fordítása
  const translateDay = (dayName: string) => {
    const days: Record<string, string> = {
      "Hétfő": t("monday"),
      "Kedd": t("tuesday"),
      "Szerda": t("wednesday"),
      "Csütörtök": t("thursday"),
      "Péntek": t("friday"),
      "Szombat": t("saturday"),
      "Vasárnap": t("sunday")
    };
    return days[dayName] || dayName;
  };

  // Profilok, csoportok és csoporttagságok betöltése a bejelentkezett adminhoz.
  useEffect(() => {
    let active = true;

    (async () => {
      setLoading(true);
      setMsg("");

      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!authData.user) throw new Error(t("coachAuthRequired"));

        const currentCoachId = authData.user.id;
        const [profilesResult, groupsResult, membersResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("id,email,full_name")
            .neq("role", "admin")
            .order("created_at", { ascending: false }),
          supabase
            .from("coach_client_groups")
            .select("id,name,created_at")
            .eq("coach_id", currentCoachId)
            .order("created_at", { ascending: true }),
          supabase
            .from("coach_client_group_members")
            .select("client_id,group_id")
            .eq("coach_id", currentCoachId),
        ]);

        if (profilesResult.error) throw profilesResult.error;
        if (groupsResult.error) throw groupsResult.error;
        if (membersResult.error) throw membersResult.error;

        if (!active) return;

        setCoachId(currentCoachId);
        setClients((profilesResult.data ?? []) as Client[]);
        setGroups((groupsResult.data ?? []) as ClientGroup[]);
        setMemberships(
          Object.fromEntries((membersResult.data ?? []).map((row) => [row.client_id, row.group_id]))
        );
      } catch (error: any) {
        if (active) setMsg(error?.message || t("coachLoadError"));
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const createGroup = async () => {
    const name = newGroupName.trim();
    if (!name || !coachId || groupBusy) return;
    if (name.length > 80) {
      setMsg(t("groupNameTooLong"));
      return;
    }

    setGroupBusy(true);
    setMsg("");
    try {
      const { data, error } = await supabase
        .from("coach_client_groups")
        .insert({ coach_id: coachId, name })
        .select("id,name,created_at")
        .single();

      if (error) throw error;
      if (data) {
        setGroups((current) => [...current, data as ClientGroup]);
        setNewGroupName("");
      }
    } catch (error: any) {
      setMsg(error?.message || t("coachLoadError"));
    } finally {
      setGroupBusy(false);
    }
  };

  const saveGroupName = async (groupId: string) => {
    const name = editingGroupName.trim();
    if (!name || !coachId || groupBusy) return;
    if (name.length > 80) {
      setMsg(t("groupNameTooLong"));
      return;
    }

    setGroupBusy(true);
    setMsg("");
    try {
      const { data, error } = await supabase
        .from("coach_client_groups")
        .update({ name })
        .eq("id", groupId)
        .eq("coach_id", coachId)
        .select("id,name,created_at")
        .single();

      if (error) throw error;
      if (data) {
        setGroups((current) => current.map((group) => group.id === groupId ? data as ClientGroup : group));
        setEditingGroupId(null);
        setEditingGroupName("");
      }
    } catch (error: any) {
      setMsg(error?.message || t("coachLoadError"));
    } finally {
      setGroupBusy(false);
    }
  };

  const deleteGroup = async (groupId: string) => {
    if (!coachId || groupBusy) return;
    setGroupBusy(true);
    setMsg("");
    try {
      const { error } = await supabase
        .from("coach_client_groups")
        .delete()
        .eq("id", groupId)
        .eq("coach_id", coachId);

      if (error) throw error;
      setGroups((current) => current.filter((group) => group.id !== groupId));
      setMemberships((current) => Object.fromEntries(
        Object.entries(current).filter(([, assignedGroupId]) => assignedGroupId !== groupId)
      ));
      if (activeGroupFilter === groupId) setActiveGroupFilter("all");
      setConfirmDeleteGroupId(null);
    } catch (error: any) {
      setMsg(error?.message || t("coachLoadError"));
    } finally {
      setGroupBusy(false);
    }
  };

  const assignClientToGroup = async (clientId: string, groupId: string) => {
    if (!coachId || groupBusy) return;
    setGroupBusy(true);
    setMsg("");
    try {
      const result = groupId
        ? await supabase
            .from("coach_client_group_members")
            .upsert(
              { coach_id: coachId, client_id: clientId, group_id: groupId },
              { onConflict: "coach_id,client_id" }
            )
        : await supabase
            .from("coach_client_group_members")
            .delete()
            .eq("coach_id", coachId)
            .eq("client_id", clientId);

      if (result.error) throw result.error;
      setMemberships((current) => {
        const next = { ...current };
        if (groupId) next[clientId] = groupId;
        else delete next[clientId];
        return next;
      });
      if (activeGroupFilter !== "all") {
        setActiveGroupFilter(groupId || "ungrouped");
      }
    } catch (error: any) {
      setMsg(error?.message || t("coachLoadError"));
    } finally {
      setGroupBusy(false);
    }
  };

  const loadClientState = async (client: Client) => {
    setSelected(client);
    setAppState(null);
    setSelectedWeek(null);
    setSelectedDay(null);
    setMsg("");

    try {
      const { data, error } = await supabase
        .from("user_state")
        .select("data,updated_at")
        .eq("user_id", client.id)
        .maybeSingle();

      if (error) throw error;
      if (!data?.data) {
        setMsg(t("noSavedData"));
        return;
      }

      setAppState(data.data as AppState);
    } catch (error: any) {
      setMsg(error?.message || t("coachLoadError"));
    }
  };

  const weeks = appState?.weeks ?? [];
  const filteredClients = useMemo(() => {
    if (activeGroupFilter === "all") return clients;
    if (activeGroupFilter === "ungrouped") return clients.filter((client) => !memberships[client.id]);
    return clients.filter((client) => memberships[client.id] === activeGroupFilter);
  }, [clients, memberships, activeGroupFilter]);

  const mindsetStats = useMemo(() => buildMindsetOverview(weeks), [weeks]);

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
    <div className="bg-[#0a0a0a] text-gray-200 font-sans p-2 md:p-4">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-4">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-wide">
              Fighter Reset <span className="text-red-600">Coach</span>
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {t("coachSubtitle")}
            </p>
          </div>
          {msg && (
            <div className="mt-4 md:mt-0 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm">
              {msg}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:h-[75vh] lg:min-h-[600px] mb-8">
          
          {/* 1) KLIENSEK ÉS CSOPORTOK */}
          <div className="bg-[#111] border border-white/5 rounded-2xl p-4 flex flex-col h-full shadow-xl min-h-0">
            <div className="flex items-center justify-between mb-3 px-2">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t("clients")}</h3>
              <span className="text-xs text-gray-600">{filteredClients.length}/{clients.length}</span>
            </div>

            {/* Csoport létrehozása */}
            <form
              className="flex gap-2 mb-4"
              onSubmit={(event) => { event.preventDefault(); void createGroup(); }}
            >
              <input
                value={newGroupName}
                onChange={(event) => setNewGroupName(event.target.value)}
                maxLength={80}
                placeholder={t("newGroupPlaceholder")}
                className="min-w-0 flex-1 bg-[#1a1a1a] border border-[#303030] rounded-lg px-3 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500/60"
              />
              <button
                type="submit"
                disabled={!newGroupName.trim() || groupBusy}
                title={t("createGroup")}
                className="shrink-0 px-3 rounded-lg bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold"
              >
                +
              </button>
            </form>

            {/* Csoport szűrők */}
            <div className="space-y-1 mb-4">
              <button
                onClick={() => setActiveGroupFilter("all")}
                className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors ${
                  activeGroupFilter === "all" ? "bg-red-600/15 border border-red-500/30 text-red-300" : "border border-transparent text-gray-400 hover:bg-[#1a1a1a]"
                }`}
              >
                <span>{t("allClients")}</span>
                <span>{clients.length}</span>
              </button>
              <button
                onClick={() => setActiveGroupFilter("ungrouped")}
                className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors ${
                  activeGroupFilter === "ungrouped" ? "bg-red-600/15 border border-red-500/30 text-red-300" : "border border-transparent text-gray-400 hover:bg-[#1a1a1a]"
                }`}
              >
                <span>{t("ungroupedClients")}</span>
                <span>{clients.filter((client) => !memberships[client.id]).length}</span>
              </button>

              {groups.map((group) => {
                const count = clients.filter((client) => memberships[client.id] === group.id).length;
                const isEditing = editingGroupId === group.id;
                return (
                  <div key={group.id} className={`rounded-lg border ${
                    activeGroupFilter === group.id ? "bg-red-600/10 border-red-500/30" : "border-transparent hover:bg-[#1a1a1a]"
                  }`}>
                    <div className="flex items-center gap-1 px-2 py-1">
                      {isEditing ? (
                        <>
                          <input
                            autoFocus
                            value={editingGroupName}
                            onChange={(event) => setEditingGroupName(event.target.value)}
                            maxLength={80}
                            className="min-w-0 flex-1 bg-[#090909] border border-[#3a3a3a] rounded px-2 py-1 text-xs text-white"
                          />
                          <button onClick={() => void saveGroupName(group.id)} disabled={!editingGroupName.trim() || groupBusy} className="text-green-400 text-xs px-1" title={t("save")}>✓</button>
                          <button onClick={() => { setEditingGroupId(null); setEditingGroupName(""); }} className="text-gray-500 text-xs px-1" title={t("cancel")}>×</button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setActiveGroupFilter(group.id)}
                            className={`min-w-0 flex-1 flex items-center justify-between text-left text-xs py-1 ${
                              activeGroupFilter === group.id ? "text-red-300" : "text-gray-300"
                            }`}
                          >
                            <span className="truncate">{group.name}</span>
                            <span className="ml-2 text-gray-600">{count}</span>
                          </button>
                          <button
                            onClick={() => { setEditingGroupId(group.id); setEditingGroupName(group.name); setConfirmDeleteGroupId(null); }}
                            className="px-1 text-gray-600 hover:text-white text-xs"
                            title={t("renameGroup")}
                          >✎</button>
                          <button
                            onClick={() => setConfirmDeleteGroupId(confirmDeleteGroupId === group.id ? null : group.id)}
                            className="px-1 text-gray-600 hover:text-red-400 text-xs"
                            title={t("deleteGroup")}
                          >×</button>
                        </>
                      )}
                    </div>
                    {confirmDeleteGroupId === group.id && (
                      <div className="px-3 pb-2 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-red-300">{t("confirmDeleteGroup")}</span>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => void deleteGroup(group.id)} disabled={groupBusy} className="text-[10px] font-bold text-red-400">{t("delete")}</button>
                          <button onClick={() => setConfirmDeleteGroupId(null)} className="text-[10px] text-gray-500">{t("cancel")}</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="border-t border-white/5 pt-3 overflow-y-auto space-y-2 pr-1 custom-scrollbar flex-1">
              {filteredClients.length === 0 ? (
                <div className="text-xs text-gray-600 text-center py-6">{t("noClientsInGroup")}</div>
              ) : filteredClients.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => void loadClientState(client)}
                  className={`w-full text-left cursor-pointer px-3 py-3 rounded-xl text-sm flex items-center gap-3 transition-all duration-200 group border ${
                    selected?.id === client.id
                      ? "bg-gradient-to-r from-red-900/40 to-red-800/10 border-red-500/30 text-white shadow-[0_0_15px_rgba(220,38,38,0.1)]"
                      : "bg-[#1a1a1a] border-transparent hover:bg-[#222] hover:border-white/5 text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <div className={`p-1.5 rounded-full ${selected?.id === client.id ? "bg-red-600" : "bg-[#252525] group-hover:bg-[#333]"}`}>
                    <UserIcon />
                  </div>
                  <span className="min-w-0 flex-1 truncate font-medium">{client.full_name || client.email || t("unknownId")}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2) MIDDLE PANEL (HETEK + NAPOK) */}
          <div className="lg:col-span-2 bg-[#111] border border-white/5 rounded-2xl p-6 flex flex-col h-full shadow-xl overflow-y-auto min-h-0 custom-scrollbar">
            {!selected ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-3 opacity-50">
                <UserIcon />
                <p>{t("selectClientPrompt")}</p>
              </div>
            ) : (
              <>
                {/* Kiválasztott kliens és csoport-hozzárendelés */}
                <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4 mb-6">
                  <div className="min-w-0">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      {selected.full_name || selected.email || t("unknownId")}
                    </h3>
                    {selected.full_name && <p className="text-xs text-gray-500 mt-1">{selected.email}</p>}
                    <p className="text-xs text-gray-400 mt-1">{t("statsOverview")}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <label htmlFor="client-group" className="text-xs text-gray-500">{t("assignToGroup")}</label>
                      <select
                        id="client-group"
                        value={memberships[selected.id] || ""}
                        onChange={(event) => void assignClientToGroup(selected.id, event.target.value)}
                        disabled={groupBusy}
                        className="max-w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-red-500/50 disabled:opacity-50"
                      >
                        <option value="">{t("ungroupedClients")}</option>
                        {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="bg-[#1a1a1a] border border-white/5 px-4 py-2 rounded-lg text-right shrink-0">
                    <div className="text-xs text-gray-500 uppercase">{t("completionRate")}</div>
                    <div className="text-lg font-bold text-white">
                      <span className="text-red-500">{totalFilled.filled}</span> / {totalFilled.total} {t("days")}
                    </div>
                  </div>
                </div>

                {appState && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    {/* TELJES MINDSET ÁTTEKINTÉS – lenyitható, teljes szélességű összesítőkkel */}
                    <section className="bg-[#0d0d0d] border border-red-900/20 rounded-2xl p-4 md:p-5">
                      <details className="group">
                        <summary className="flex cursor-pointer list-none items-start justify-between gap-3 select-none">
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-white">{t("mindsetOverview")}</h4>
                            <p className="text-xs text-gray-500 mt-1">{t("mindsetOverviewDesc")}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="text-xs font-bold text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5 whitespace-nowrap">
                              {mindsetStats.completed}/{mindsetStats.planned} {t("mindsetCompleted")}
                            </span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-gray-400 transition-transform duration-200 group-open:rotate-180"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.09 1.032l-4.255 4.516a.75.75 0 01-1.09 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </summary>

                        <div className="pt-5 space-y-6">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div className="bg-[#171717] rounded-xl p-3 min-w-0">
                              <div className="text-[10px] uppercase tracking-wide text-gray-500">{t("mindsetCompleted")}</div>
                              <div className="text-2xl font-bold text-green-400 mt-1">{mindsetStats.completed}</div>
                            </div>
                            <div className="bg-[#171717] rounded-xl p-3 min-w-0">
                              <div className="text-[10px] uppercase tracking-wide text-gray-500">{t("mindsetNotCompleted")}</div>
                              <div className="text-2xl font-bold text-gray-300 mt-1">{mindsetStats.notCompleted}</div>
                            </div>
                            <div className="bg-[#171717] rounded-xl p-3 min-w-0">
                              <div className="text-[10px] uppercase tracking-wide text-gray-500">{t("mindsetPending")}</div>
                              <div className="text-2xl font-bold text-yellow-400 mt-1">{mindsetStats.pending}</div>
                            </div>
                            <div className="bg-[#171717] rounded-xl p-3 min-w-0">
                              <div className="text-[10px] uppercase tracking-wide text-gray-500">{t("mindsetRecorded")}</div>
                              <div className="text-2xl font-bold text-white mt-1">{mindsetStats.recorded}/{mindsetStats.planned}</div>
                            </div>
                          </div>

                          {/* A két összesítés egymás alatt, teljes szélességben jelenik meg. */}
                          <div className="space-y-6">
                            <div className="w-full min-w-0">
                              <h5 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">{t("mindsetByExercise")}</h5>
                              <div className="space-y-2">
                                {(Object.keys(MINDSET_EXERCISE_CATALOG) as MindsetExerciseId[]).map((id) => {
                                  const stats = mindsetStats.byExercise[id];
                                  return (
                                    <div key={id} className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:items-center gap-1 sm:gap-4 border-b border-white/5 pb-2 text-xs">
                                      <span className="min-w-0 text-gray-300 break-words">{t(MINDSET_EXERCISE_CATALOG[id].nameKey)}</span>
                                      <span className="min-w-0 text-left sm:text-right leading-relaxed break-words">
                                        <span className="font-bold text-green-400">{stats.completed}</span>
                                        <span className="text-gray-600"> / {stats.planned}</span>
                                        <span className="text-gray-500 ml-2">({t("mindsetNotCompletedShort")}: {stats.notCompleted}, {t("mindsetPendingShort")}: {stats.planned - stats.recorded})</span>
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="w-full min-w-0">
                              <h5 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">{t("mindsetByWeek")}</h5>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {mindsetStats.byWeek.map((week) => (
                                  <button
                                    key={week.weekNumber}
                                    type="button"
                                    onClick={() => {
                                      const target = weeks.find((item) => item.weekNumber === week.weekNumber);
                                      if (target) selectWeek(target);
                                    }}
                                    className="min-w-0 text-left bg-[#171717] hover:bg-[#202020] border border-white/5 rounded-lg p-3 transition-colors"
                                  >
                                    <div className="text-[10px] uppercase text-gray-500">{language === "hu" ? `${week.weekNumber}. hét` : `${t("week")} ${week.weekNumber}`}</div>
                                    <div className="text-lg font-bold text-white mt-1"><span className="text-green-400">{week.completed}</span><span className="text-gray-600 text-xs"> / {week.planned}</span></div>
                                    <div className="text-[10px] text-gray-500 mt-1 leading-relaxed">{t("mindsetRecorded")}: {week.recorded} · {t("mindsetPendingShort")}: {week.pending}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </details>
                    </section>
                    {/* HETEK GRID */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">{t("weeksTitle")}</h4>
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
                                {language === "hu" ? `${w.weekNumber}. ${t("week")}` : `${t("week")} ${w.weekNumber}`}
                                {active && <div className="h-2 w-2 bg-white rounded-full animate-pulse" />}
                              </div>
                              <div className="mt-2 space-y-1">
                                <div className="text-[10px] uppercase opacity-70">{t("filled")}</div>
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
                           {language === "hu" ? `${selectedWeek.weekNumber}. hét napjai` : `Days of ${t("week")} ${selectedWeek.weekNumber}`}
                           <span className="h-px bg-gray-800 flex-1"></span>
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {(selectedWeek.days as any[]).map((d) => {
                            const active = (selectedDay as any)?.id === d.id;
                            const filled = isDayFilled(d as any);
                            const mindsetProgress = getDayMindsetProgress(d as any, selectedWeek.weekNumber);
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
                                <span className="font-medium">{d.dayName ? translateDay(d.dayName) : d.id}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] text-gray-500">{t("mindsetColumn")}: <span className="text-green-400">{mindsetProgress.completed}</span>/{mindsetProgress.total}</span>
                                  <div className={`h-2.5 w-2.5 rounded-full ${filled ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-gray-700"}`} />
                                </div>
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
          <div className="bg-[#111] border border-white/5 rounded-2xl p-6 h-full shadow-xl overflow-y-auto min-h-0 custom-scrollbar">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">{t("details")}</h3>

            {!selectedDay ? (
               <div className="h-40 flex items-center justify-center text-gray-600 text-sm border-2 border-dashed border-[#222] rounded-xl text-center p-4">
                 {t("selectDayPrompt")}
               </div>
            ) : (
              <div className="space-y-6 animate-in zoom-in-95 duration-200">
                
                {/* Cím */}
                <div className="border-b border-white/5 pb-4">
                  <div className="text-2xl font-bold text-white">
                    {(selectedDay as any).dayName ? translateDay((selectedDay as any).dayName) : (selectedDay as any).id}
                  </div>
                  <div className="text-xs text-gray-500 font-mono mt-1">
                    ID: {(selectedDay as any).id}
                  </div>
                </div>

                {/* STAT CARDS Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                   {/* Alvás */}
                   <div className="bg-[#1a1a1a] border p-3 rounded-xl border-red-500/20">
                      <div className="text-xs text-gray-500 mb-1">{t("sleep")}</div>
                      <div className="text-lg font-bold text-white">{(selectedDay as any).sleep ?? "—"} <span className="text-xs font-normal text-gray-600">{t("hours")}</span></div>
                   </div>
                   {/* Víz */}
                   <div className="bg-[#1a1a1a] border p-3 rounded-xl border-red-500/20">
                      <div className="text-xs text-gray-500 mb-1">{t("water")}</div>
                      <div className="text-lg font-bold text-white">{(selectedDay as any).water ?? "—"} <span className="text-xs font-normal text-gray-600">L</span></div>
                   </div>
                   {/* Kaja */}
                   <div className="bg-[#1a1a1a] border p-3 rounded-xl border-red-500/20">
                      <div className="text-xs text-gray-500 mb-1">{t("nutrition")}</div>
                      <div className="text-lg font-bold text-white">{(selectedDay as any).nutrition ?? "—"} <span className="text-xs font-normal text-gray-600">/5</span></div>
                   </div>
                   {/* Közérzet */}
                   <div className="bg-[#1a1a1a] border p-3 rounded-xl border-red-500/20">
                      <div className="text-xs text-gray-500 mb-1">{t("wellbeing")}</div>
                      <div className="text-lg font-bold text-white">{(selectedDay as any).wellbeing ?? "—"} <span className="text-xs font-normal text-gray-600">/5</span></div>
                   </div>
                   {/* Esti éhség */}
                   <div className="bg-[#1a1a1a] border p-3 rounded-xl border-red-500/20">
                      <div className="text-xs text-gray-500 mb-1">{t("eveningHunger")}</div>
                      <div className="text-lg font-bold text-white">{(selectedDay as any).eveningHunger ?? "—"} <span className="text-xs font-normal text-gray-600">/5</span></div>
                   </div>
                </div>

                {/* Edzés Kártya */}
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                    (selectedDay as any).workout 
                    ? "bg-green-500/10 border-green-500/30 text-green-400" 
                    : "bg-[#1a1a1a] border-[#252525] text-gray-500"
                }`}>
                    <span className="font-bold text-sm">{t("workout")}</span>
                    {(selectedDay as any).workout ? <ActivityIcon /> : "—"}
                </div>

                {/* 10-3-2-1-0 Szabály */}
                <div className="bg-[#1a1a1a] border border-white/5 rounded-xl p-4">
                  <div className="font-bold text-white text-sm mb-3 border-b border-white/5 pb-2">{t("rule103210Title")}</div>
                  {(() => {
                    const r = (selectedDay as any).rule103210;
                    if (!r) return <div className="text-gray-500 text-xs italic">{t("noDataRecorded")}</div>;
                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm text-gray-300"><span>{t("ruleMealWord")}</span> {badge(!!r.meal)}</div>
                        <div className="flex justify-between items-center text-sm text-gray-300"><span>{t("ruleFluidsWord")}</span> {badge(!!r.fluids)}</div>
                        <div className="flex justify-between items-center text-sm text-gray-300"><span>{t("ruleSnoozeWord")}</span> {badge(!!r.snooze)}</div>
                        <div className="flex justify-between items-center text-sm text-gray-300"><span>{t("ruleScreensWord")}</span> {badge(!!r.screens)}</div>
                        <div className="flex justify-between items-center text-sm text-gray-300"><span>{t("ruleCaffeineWord")}</span> {badge(!!r.caffeine)}</div>
                      </div>
                    );
                  })()}
                </div>

                {/* Mindset gyakorlatok – az adott hét rendje szerint */}
                {selectedWeek && MINDSET_WEEK_PLAN[selectedWeek.weekNumber] && (() => {
                  const plan = MINDSET_WEEK_PLAN[selectedWeek.weekNumber];
                  const exercises = [
                    ...plan.required.map((id) => ({ ...MINDSET_EXERCISE_CATALOG[id], required: true })),
                    ...plan.optional.map((id) => ({ ...MINDSET_EXERCISE_CATALOG[id], required: false })),
                  ];
                  return (
                    <div className="bg-[#1a1a1a] border border-white/5 rounded-xl p-4">
                      <div className="font-bold text-white text-sm mb-3 border-b border-white/5 pb-2">{t("mindsetDailyTitle")}</div>
                      <div className="space-y-3">
                        {exercises.map((exercise) => {
                          const value = selectedDay.mindset?.[exercise.id];
                          return (
                            <div key={exercise.id} className="flex items-center justify-between gap-3 text-sm">
                              <div className="min-w-0">
                                <div className={exercise.required ? "font-bold text-white" : "text-gray-300"}>{t(exercise.nameKey)}</div>
                                <div className={`text-[10px] uppercase tracking-wide mt-0.5 ${exercise.required ? "text-red-400" : "text-gray-600"}`}>
                                  {exercise.required ? t("mindsetRequired") : t("mindsetOptional")}
                                </div>
                              </div>
                              <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded border ${
                                value === true
                                  ? "text-green-400 border-green-500/30 bg-green-500/10"
                                  : value === false
                                    ? "text-gray-400 border-white/10 bg-white/5"
                                    : "text-yellow-500 border-yellow-500/20 bg-yellow-500/5"
                              }`}>
                                {value === true ? t("mindsetYes") : value === false ? t("mindsetNo") : t("mindsetNotRecorded")}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Megjegyzés */}
                <div className="bg-[#1a1a1a] border border-white/5 rounded-xl p-4">
                  <div className="font-bold text-gray-400 text-xs uppercase mb-2">{t("notes")}</div>
                  <div className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed">
                    {((selectedDay as any).notes ?? "").trim() || <span className="text-gray-600 italic">{t("noNotes")}</span>}
                  </div>
                </div>

                {/* Debug Collapse */}
                <details className="group">
                  <summary className="cursor-pointer text-xs text-gray-600 hover:text-red-500 transition-colors list-none">
                    {t("rawJsonDebug")}
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