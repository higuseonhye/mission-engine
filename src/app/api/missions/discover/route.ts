import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getMissions } from "@/lib/missions-db";

export async function POST(request: NextRequest) {
  try {
    const { focus } = await request.json().catch(() => ({}));
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is required for AI discovery" },
        { status: 500 }
      );
    }

    const existing = await getMissions();
    const existingTitles = existing.map((m) => m.title).join(", ");

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You suggest new technology missions worth solving. Agent-first lens.
Return JSON: { "suggestions": [ { "title", "problem", "impact", "whyItMatters", "signals": ["s1","s2","s3"], "category" } ] }
Suggest 2-4 missions. Categories: AI/Technology, Climate, Health, Education, Policy. Be specific. Avoid duplicates. Respond in English.`,
        },
        {
          role: "user",
          content: `Existing missions: ${existingTitles}
${focus ? `Focus area: ${focus}` : "Suggest new missions. Categories: AI/Technology, Climate, Health, Education, Policy. Return only valid JSON."}
Return only valid JSON.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("No response from OpenAI");

    const parsed = JSON.parse(content);
    const suggestions = Array.isArray(parsed.suggestions)
      ? parsed.suggestions.map((s: Record<string, unknown>) => ({
          title: String(s.title ?? ""),
          problem: String(s.problem ?? ""),
          impact: String(s.impact ?? ""),
          whyItMatters: String(s.whyItMatters ?? ""),
          signals: Array.isArray(s.signals) ? s.signals.map(String) : [],
          category: String(s.category ?? "AI / Technology"),
        }))
      : [];

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Discover API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to discover missions" },
      { status: 500 }
    );
  }
}
