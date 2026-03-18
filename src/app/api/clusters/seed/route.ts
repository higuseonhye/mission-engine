import { NextResponse } from "next/server";
import { supabase, hasSupabase } from "@/lib/supabase";
import { missionClusters, missionConnections } from "@/data/missionGraph";

export async function POST() {
  try {
    if (!hasSupabase() || !supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    for (const c of missionClusters) {
      await supabase.from("mission_clusters").upsert(
        {
          id: c.id,
          name: c.name,
          description: c.description,
          mission_ids: c.missionIds,
          worldview: c.worldview ?? null,
          sort_order: missionClusters.indexOf(c),
        },
        { onConflict: "id" }
      );
    }

    const { data: existing } = await supabase.from("mission_connections").select("id");
    if (existing?.length) {
      for (const row of existing) {
        await supabase.from("mission_connections").delete().eq("id", row.id);
      }
    }
    for (const conn of missionConnections) {
      await supabase.from("mission_connections").insert({
        from_id: conn.from,
        to_id: conn.to,
        type: conn.type,
      });
    }

    return NextResponse.json({ success: true, clusters: missionClusters.length, connections: missionConnections.length });
  } catch (error) {
    console.error("Clusters seed error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Seed failed" },
      { status: 500 }
    );
  }
}
