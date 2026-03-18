import { NextRequest, NextResponse } from "next/server";
import { getMissions, createMission } from "@/lib/missions-db";

export async function GET() {
  try {
    const missions = await getMissions();
    return NextResponse.json({ missions });
  } catch (error) {
    console.error("Missions GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch missions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, problem, impact, whyItMatters, signals, status, category, worldview, successCriteria, clearPathTypes } = body;
    if (!title || !problem || !impact || !whyItMatters) {
      return NextResponse.json(
        { error: "title, problem, impact, whyItMatters are required" },
        { status: 400 }
      );
    }
    const mission = await createMission({
      title,
      problem,
      impact,
      whyItMatters,
      signals: Array.isArray(signals) ? signals : [],
      status: status ?? "Unsolved",
      category: category ?? "AI / Technology",
      worldview: worldview ?? undefined,
      successCriteria: Array.isArray(successCriteria) ? successCriteria : undefined,
      clearPathTypes: Array.isArray(clearPathTypes) ? clearPathTypes : undefined,
    });
    return NextResponse.json({ mission });
  } catch (error) {
    console.error("Missions POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create mission" },
      { status: 500 }
    );
  }
}
