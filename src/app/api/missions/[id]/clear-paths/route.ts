import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getMissionById } from "@/lib/missions-db";
import type { ClearPath, ClearPathType } from "@/lib/types";

const CLEAR_PATH_TYPES: ClearPathType[] = [
  "product",
  "policy",
  "research",
  "community",
  "education",
  "infrastructure",
  "advocacy",
];

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
      return NextResponse.json({
        clearPaths: CLEAR_PATH_TYPES.map((type) => ({
          type,
          description: getDefaultDescription(type),
          examples: getDefaultExamples(type, mission.title),
          whyThisPath: "Use all means to clear mission.",
        })),
        message: "Add OPENAI_API_KEY for AI-generated clear paths.",
      });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Mission clearing is NOT just product. Use ALL means: product, policy, research, community, education, infrastructure, advocacy.
For each path type, return how it could clear this mission. Return JSON:
{
  "clearPaths": [
    { "type": "product|policy|research|community|education|infrastructure|advocacy", "description": "how this path clears", "examples": ["example1","example2"], "whyThisPath": "why this matters for this mission" }
  ]
}
Include 4-6 most relevant path types. Be specific. English.`,
        },
        {
          role: "user",
          content: `Mission: ${mission.title}
Problem: ${mission.problem}
Impact: ${mission.impact}

Generate clear paths - all means to achieve this mission. Not just product.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(text);
    let clearPaths: ClearPath[] = [];
    if (Array.isArray(parsed.clearPaths)) {
      clearPaths = parsed.clearPaths
        .filter((p: { type?: string }) => CLEAR_PATH_TYPES.includes(p.type as ClearPathType))
        .map((p: Record<string, unknown>) => ({
          type: p.type as ClearPathType,
          description: String(p.description ?? ""),
          examples: Array.isArray(p.examples) ? p.examples.map(String) : [],
          whyThisPath: p.whyThisPath ? String(p.whyThisPath) : undefined,
        }));
    }
    if (clearPaths.length === 0) {
      clearPaths = CLEAR_PATH_TYPES.slice(0, 5).map((type) => ({
        type,
        description: getDefaultDescription(type),
        examples: getDefaultExamples(type, mission.title),
        whyThisPath: "Use all means to clear mission.",
      }));
    }

    return NextResponse.json({ clearPaths });
  } catch (error) {
    console.error("Clear paths error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate clear paths" },
      { status: 500 }
    );
  }
}

function getDefaultDescription(type: ClearPathType): string {
  const map: Record<ClearPathType, string> = {
    product: "Build a product or company that solves the problem.",
    policy: "Advocate for regulation, legislation, or standards.",
    research: "Publish breakthrough research or open models.",
    community: "Build open source, standards body, or movement.",
    education: "Train, educate, raise awareness.",
    infrastructure: "Build public good, platform, or protocol.",
    advocacy: "Build coalition, movement, awareness campaign.",
  };
  return map[type] ?? type;
}

function getDefaultExamples(type: ClearPathType, _missionTitle: string): string[] {
  const map: Record<ClearPathType, string[]> = {
    product: ["Startup", "SaaS", "API"],
    policy: ["EU AI Act", "Industry standard", "Certification"],
    research: ["Paper", "Open model", "Benchmark"],
    community: ["Open source", "Foundation", "Consortium"],
    education: ["Course", "Bootcamp", "Documentation"],
    infrastructure: ["Protocol", "Public API", "Dataset"],
    advocacy: ["Coalition", "Campaign", "Alliance"],
  };
  return map[type] ?? [];
}
