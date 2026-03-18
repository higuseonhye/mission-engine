import { NextResponse } from "next/server";
import { hasSupabase } from "@/lib/supabase";

export async function GET() {
  return NextResponse.json({
    hasSupabase: hasSupabase(),
    hasOpenAI: !!process.env.OPENAI_API_KEY,
  });
}
