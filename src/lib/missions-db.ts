import { supabase, hasSupabase } from "./supabase";
import { missions as staticMissions } from "@/data/missions";
import {
  getMissionOverrides,
  getNewMissions,
  setMissionOverride,
  addNewMission,
  removeMission,
} from "./memory-store";
import type { Mission } from "./types";

function rowToMission(row: Record<string, unknown>): Mission {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    problem: String(row.problem ?? ""),
    impact: String(row.impact ?? ""),
    whyItMatters: String(row.why_it_matters ?? ""),
    signals: Array.isArray(row.signals) ? row.signals.map(String) : [],
    status: (row.status as Mission["status"]) ?? "Unsolved",
    category: String(row.category ?? "AI / Technology"),
    worldview: row.worldview ? String(row.worldview) : undefined,
    successCriteria: Array.isArray(row.success_criteria) ? row.success_criteria.map(String) : undefined,
    clearPathTypes: Array.isArray(row.clear_path_types) ? row.clear_path_types as Mission["clearPathTypes"] : undefined,
  };
}

export async function getMissions(): Promise<Mission[]> {
  if (hasSupabase() && supabase) {
    const { data, error } = await supabase
      .from("missions")
      .select("*")
      .order("id");
    if (!error && data && data.length > 0) {
      const fromDb = data.map((row) => rowToMission(row as Record<string, unknown>));
      const overrides = getMissionOverrides();
      const merged = fromDb.map((m) => {
        const o = overrides.get(m.id);
        return o ? { ...m, ...o } : m;
      });
      const newOnes = Array.from(getNewMissions().values());
      return [...merged, ...newOnes.filter((n) => !merged.some((x) => x.id === n.id))].sort(
        (a, b) => String(a.id).localeCompare(String(b.id))
      );
    }
  }
  const base = [...staticMissions];
  const overrides = getMissionOverrides();
  const newOnes = Array.from(getNewMissions().values());
  const merged = base.map((m) => {
    const o = overrides.get(m.id);
    return o ? { ...m, ...o } : m;
  });
  return [...merged, ...newOnes].sort((a, b) => String(a.id).localeCompare(String(b.id)));
}

export async function getMissionById(id: string): Promise<Mission | undefined> {
  const all = await getMissions();
  return all.find((m) => m.id === id);
}

export async function createMission(mission: Omit<Mission, "id"> & { id?: string }): Promise<Mission> {
  const id = mission.id ?? String(Date.now());
  const full: Mission = {
    id,
    title: mission.title,
    problem: mission.problem,
    impact: mission.impact,
    whyItMatters: mission.whyItMatters,
    signals: mission.signals ?? [],
    status: mission.status ?? "Unsolved",
    category: mission.category ?? "AI / Technology",
    worldview: mission.worldview,
    successCriteria: mission.successCriteria,
    clearPathTypes: mission.clearPathTypes,
  };
  if (hasSupabase() && supabase) {
    const insertPayload: Record<string, unknown> = {
      id,
      title: mission.title,
      problem: mission.problem,
      impact: mission.impact,
      why_it_matters: mission.whyItMatters,
      signals: mission.signals ?? [],
      status: mission.status ?? "Unsolved",
      category: mission.category ?? "AI / Technology",
      worldview: mission.worldview ?? null,
    };
    if (mission.successCriteria?.length) insertPayload.success_criteria = mission.successCriteria;
    if (mission.clearPathTypes?.length) insertPayload.clear_path_types = mission.clearPathTypes;
    const { data, error } = await supabase
    .from("missions")
    .insert(insertPayload)
    .select()
    .single();
  if (error) throw new Error(error.message);
    return rowToMission(data as Record<string, unknown>);
  }
  const inStatic = staticMissions.some((s) => s.id === id);
  if (inStatic) {
    setMissionOverride(id, full);
  } else {
    addNewMission(full);
  }
  return full;
}

export async function updateMission(id: string, updates: Partial<Mission>): Promise<Mission> {
  const existing = await getMissionById(id);
  if (!existing) throw new Error("Mission not found");

  const payload: Record<string, unknown> = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.problem !== undefined) payload.problem = updates.problem;
  if (updates.impact !== undefined) payload.impact = updates.impact;
  if (updates.whyItMatters !== undefined) payload.why_it_matters = updates.whyItMatters;
  if (updates.signals !== undefined) payload.signals = updates.signals;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.worldview !== undefined) payload.worldview = updates.worldview;
  if (updates.successCriteria !== undefined) payload.success_criteria = updates.successCriteria;
  if (updates.clearPathTypes !== undefined) payload.clear_path_types = updates.clearPathTypes;

  if (!hasSupabase() || !supabase) {
    setMissionOverride(id, updates);
    return { ...existing, ...updates };
  }

  const { data: histRows } = await supabase
    .from("mission_history")
    .select("version")
    .eq("mission_id", id)
    .order("version", { ascending: false })
    .limit(1);
  const nextVersion = histRows?.length ? (Number(histRows[0].version) + 1) : 1;
  await supabase.from("mission_history").insert({
    mission_id: id,
    version: nextVersion,
    snapshot: existing,
  });

  const { data, error } = await supabase
    .from("missions")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return rowToMission(data as Record<string, unknown>);
}

export async function deleteMission(id: string): Promise<void> {
  if (hasSupabase() && supabase) {
    const { error } = await supabase.from("missions").delete().eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    removeMission(id);
  }
}

export async function getMissionHistory(missionId: string): Promise<{ version: number; snapshot: Mission; changedAt: string }[]> {
  if (!hasSupabase() || !supabase) return [];
  const { data, error } = await supabase
    .from("mission_history")
    .select("version, snapshot, changed_at")
    .eq("mission_id", missionId)
    .order("changed_at", { ascending: false })
    .limit(20);
  if (error || !data) return [];
  return data.map((r) => ({
    version: Number(r.version),
    snapshot: r.snapshot as Mission,
    changedAt: String(r.changed_at),
  }));
}
