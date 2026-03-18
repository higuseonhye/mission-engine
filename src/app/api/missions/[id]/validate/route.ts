import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getMissionById } from "@/lib/missions-db";
import type { MissionValidation } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const mission = await getMissionById(id);
    if (!mission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }

    if (!process.env.OPENAI_API_KEY) {
      const validation: MissionValidation = {
        missionId: id,
        isValid: Boolean(
          mission.problem && mission.problem.length > 20 &&
          mission.impact && mission.impact.length > 10 &&
          (mission.successCriteria?.length ?? 0) > 0
        ),
        score: Math.min(
          100,
          (mission.problem?.length ? 25 : 0) +
          (mission.impact?.length ? 25 : 0) +
          ((mission.successCriteria?.length ?? 0) > 0 ? 50 : 0)
        ),
        checks: [
          {
            clearProblem: (mission.problem?.length ?? 0) > 20,
            measurableOutcome: (mission.impact?.length ?? 0) > 10,
            achievableScope: true,
            hasSuccessCriteria: (mission.successCriteria?.length ?? 0) > 0,
            feedback: "Basic check without AI",
          },
        ],
        suggestions: mission.successCriteria?.length ? [] : ["Add successCriteria - measurable conditions for 'Solved'"],
      };
      return NextResponse.json({ validation, message: "Add OPENAI_API_KEY for full validation." });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You validate missions. A mission is "complete" (well-defined) if:
1. clearProblem: Problem is specific, not vague
2. measurableOutcome: Impact can be measured or observed
3. achievableScope: Not too broad; can be tackled
4. hasSuccessCriteria: Has concrete conditions for "Solved"

Return JSON: {
  "isValid": boolean,
  "score": 0-100,
  "checks": [
    { "clearProblem": bool, "measurableOutcome": bool, "achievableScope": bool, "hasSuccessCriteria": bool, "feedback": "brief" }
  ],
  "suggestions": ["suggestion1", "suggestion2"]
}
Be strict. English.`,
        },
        {
          role: "user",
          content: `Validate this mission:
Title: ${mission.title}
Problem: ${mission.problem}
Impact: ${mission.impact}
Why it matters: ${mission.whyItMatters}
Success criteria: ${JSON.stringify(mission.successCriteria ?? [])}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(text);
    const validation: MissionValidation = {
      missionId: id,
      isValid: Boolean(parsed.isValid),
      score: Math.min(100, Math.max(0, Number(parsed.score) ?? 0)),
      checks: Array.isArray(parsed.checks)
        ? parsed.checks.map((c: Record<string, unknown>) => ({
            clearProblem: Boolean(c.clearProblem),
            measurableOutcome: Boolean(c.measurableOutcome),
            achievableScope: Boolean(c.achievableScope ?? true),
            hasSuccessCriteria: Boolean(c.hasSuccessCriteria),
            feedback: String(c.feedback ?? ""),
          }))
        : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.map(String) : [],
    };

    return NextResponse.json({ validation });
  } catch (error) {
    console.error("Validate error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Validation failed" },
      { status: 500 }
    );
  }
}
