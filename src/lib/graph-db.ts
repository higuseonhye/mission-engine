import { supabase, hasSupabase } from "./supabase";
import { missionClusters as staticClusters, missionConnections as staticConnections } from "@/data/missionGraph";
import { getClusterOverrides, setClusterOverride } from "./memory-store";
import type { MissionCluster, MissionConnection } from "./types";

export async function getMissionClusters(): Promise<MissionCluster[]> {
  let base: MissionCluster[] = staticClusters;
  if (hasSupabase() && supabase) {
    const { data, error } = await supabase
      .from("mission_clusters")
      .select("*")
      .order("sort_order");
    if (!error && data && data.length > 0) {
      base = data.map((row) => ({
        id: String(row.id),
        name: String(row.name ?? ""),
        description: String(row.description ?? ""),
        missionIds: Array.isArray(row.mission_ids) ? row.mission_ids.map(String) : [],
        worldview: row.worldview ? String(row.worldview) : undefined,
      }));
    }
  }
  const overrides = getClusterOverrides();
  return base.map((c) => {
    const ov = overrides.get(c.id);
    if (!ov) return c;
    return { ...c, ...ov };
  });
}

export async function getMissionConnections(): Promise<MissionConnection[]> {
  if (hasSupabase() && supabase) {
    const { data, error } = await supabase.from("mission_connections").select("from_id, to_id, type");
    if (!error && data && data.length > 0) {
      return data.map((row) => ({
        from: String(row.from_id),
        to: String(row.to_id),
        type: (row.type as MissionConnection["type"]) ?? "enables",
      }));
    }
  }
  return staticConnections;
}

export async function updateCluster(id: string, updates: Partial<MissionCluster>): Promise<void> {
  if (hasSupabase() && supabase) {
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.missionIds !== undefined) payload.mission_ids = updates.missionIds;
    if (updates.worldview !== undefined) payload.worldview = updates.worldview;
    const { error } = await supabase.from("mission_clusters").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  setClusterOverride(id, updates);
}
