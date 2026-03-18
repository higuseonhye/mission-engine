import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getMissionById } from "@/lib/missions-db";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY required" }, { status: 500 });
    }

    const mission = await getMissionById(id);
    if (!mission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Suggest improvements to a mission. Return JSON: { "suggestions": { "title?", "problem?", "impact?", "whyItMatters?", "worldview?", "signals?", "successCriteria?" } }
successCriteria: array of measurable conditions for "Solved" - when is the mission actually cleared? Product is one path; policy, research, community can also clear.
Only include fields that could be improved. Be specific. Respond in English.`,
        },
        {
          role: "user",
          content: `Current mission:
Title: ${mission.title}
Problem: ${mission.problem}
Impact: ${mission.impact}
Why it matters: ${mission.whyItMatters}
Worldview: ${mission.worldview ?? "none"}
Signals: ${(mission.signals ?? []).join(", ")}
Success criteria: ${JSON.stringify(mission.successCriteria ?? [])}

Suggest updates. Return only valid JSON.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("No response");

    const parsed = JSON.parse(content);
    const suggestions = parsed.suggestions ?? {};
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Suggest updates error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to suggest updates" },
      { status: 500 }
    );
  }
}
