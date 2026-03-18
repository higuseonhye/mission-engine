import { NextRequest, NextResponse } from "next/server";
import { getMissionById, updateMission } from "@/lib/missions-db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const status = body.status ?? "Solved";

    const mission = await getMissionById(id);
    if (!mission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }

    const validStatus = ["Unsolved", "In Progress", "Solved"];
    if (!validStatus.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updated = await updateMission(id, { status });
    return NextResponse.json({ mission: updated });
  } catch (error) {
    console.error("Complete error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update status" },
      { status: 500 }
    );
  }
}
