import { NextResponse } from "next/server";
import { getMissionClusters } from "@/lib/graph-db";

export async function GET() {
  try {
    const clusters = await getMissionClusters();
    return NextResponse.json({ clusters });
  } catch (error) {
    console.error("Clusters GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch clusters" },
      { status: 500 }
    );
  }
}
