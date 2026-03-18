import { NextRequest, NextResponse } from "next/server";
import { getMissionHistory } from "@/lib/missions-db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const history = await getMissionHistory(id);
    return NextResponse.json({ history });
  } catch (error) {
    console.error("Mission history error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch history" },
      { status: 500 }
    );
  }
}
