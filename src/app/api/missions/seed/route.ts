import { NextResponse } from "next/server";
import { createMission } from "@/lib/missions-db";
import { hasSupabase } from "@/lib/supabase";
import { missions as staticMissions } from "@/data/missions";

export async function POST() {
  try {
    if (!hasSupabase()) {
      return NextResponse.json({ seeded: staticMissions.length, message: "Using static data. Add Supabase for persistence." });
    }
    const created: string[] = [];
    for (const m of staticMissions) {
      try {
        await createMission({
          id: m.id,
          title: m.title,
          problem: m.problem,
          impact: m.impact,
          whyItMatters: m.whyItMatters,
          signals: m.signals,
          status: m.status,
          category: m.category,
        });
        created.push(m.id);
      } catch (e) {
        console.warn(`Mission ${m.id} may already exist:`, e);
      }
    }
    return NextResponse.json({ seeded: created.length, ids: created });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Seed failed. Is Supabase configured?" },
      { status: 500 }
    );
  }
}
