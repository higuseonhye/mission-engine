import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { layer, id, value } = body as { layer?: string; id?: string; value?: string };

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        suggestions: [
          { layer: "mission", targetId: null, action: "review", suggestion: "Review missions for alignment with cluster worldview." },
          { layer: "policy", targetId: null, action: "review", suggestion: "Check if policies reflect mission changes." },
        ],
        message: "Add OPENAI_API_KEY for AI-powered cascade suggestions.",
      });
    }

    const prompt = `You are a Mission Engine analyst. Given a change in one layer, suggest updates for connected layers.

Layers: Worldview → Clusters → Missions → Companies → Policy → Agents

${layer && id && value ? `Change: ${layer} (${id}) = "${value}"` : "No specific change. Suggest general alignment."}

Return JSON: { "suggestions": [ { "layer": "cluster"|"mission"|"company"|"policy"|"agent", "targetId": "id or null", "action": "update"|"add"|"review", "suggestion": "brief text" } ] }
Suggest 2-4 items. Be specific. English only.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
    });

    const text = completion.choices[0]?.message?.content ?? "{}";
    const json = JSON.parse(text.replace(/```json?\s*/g, "").trim());
    return NextResponse.json({ suggestions: json.suggestions ?? [] });
  } catch (error) {
    console.error("Cascade error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cascade failed" },
      { status: 500 }
    );
  }
}
