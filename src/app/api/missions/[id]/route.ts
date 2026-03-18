import { NextRequest, NextResponse } from "next/server";
import { getMissionById, updateMission, deleteMission } from "@/lib/missions-db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const mission = await getMissionById(id);
    if (!mission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }
    return NextResponse.json({ mission });
  } catch (error) {
    console.error("Mission GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch mission" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.problem !== undefined) updates.problem = body.problem;
    if (body.impact !== undefined) updates.impact = body.impact;
    if (body.whyItMatters !== undefined) updates.whyItMatters = body.whyItMatters;
    if (body.signals !== undefined) updates.signals = body.signals;
    if (body.status !== undefined) updates.status = body.status;
    if (body.category !== undefined) updates.category = body.category;
    if (body.worldview !== undefined) updates.worldview = body.worldview;
    if (body.successCriteria !== undefined) updates.successCriteria = body.successCriteria;
    if (body.clearPathTypes !== undefined) updates.clearPathTypes = body.clearPathTypes;
    const mission = await updateMission(id, updates as Parameters<typeof updateMission>[1]);
    return NextResponse.json({ mission });
  } catch (error) {
    console.error("Mission PATCH error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update mission" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteMission(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mission DELETE error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete mission" },
      { status: 500 }
    );
  }
}
