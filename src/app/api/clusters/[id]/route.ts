import { NextRequest, NextResponse } from "next/server";
import { updateCluster } from "@/lib/graph-db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    await updateCluster(id, {
      name: body.name,
      description: body.description,
      missionIds: body.missionIds,
      worldview: body.worldview,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cluster PATCH error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update cluster" },
      { status: 500 }
    );
  }
}
