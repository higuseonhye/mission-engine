import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getMissionById } from "@/lib/missions-db";
import { missionClusters } from "@/data/missionGraph";
import { getTasksForMissions } from "@/data/tasks";
import type { CompanyBlueprint } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const { missionId, integratedSolution } = await request.json();
    if (!missionId) {
      return NextResponse.json(
        { error: "missionId is required" },
        { status: 400 }
      );
    }

    const mission = await getMissionById(missionId);
    if (!mission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const sharedTasks = getTasksForMissions([missionId]);
    const sharedTasksDesc = sharedTasks
      .map((t) => `- ${t.name}: ${t.description}`)
      .join("\n");

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert at creating startup company blueprints.
AGENT-FIRST PRINCIPLE: Assume most work is done by AI agents. Humans only do: oversight, strategy, high-stakes decisions, creativity that agents can't match.
Return a JSON object with these keys - each value must be a STRING:
- product: The product name and one-line description
- productTasks: What the product DOES - concrete tasks it performs (e.g. "Ingests documents, extracts entities, runs inference, returns structured output")
- users: Target users
- technology: Tech stack
- humanRoles: ONLY human roles - oversight, review, strategy (keep minimal)
- agentTasks: Tasks performed by agents (detailed, 5-8 items)
- capital_needed: Funding needed. Be realistic: agent-first startups need less. Use format like "$50K–$200K seed" or "$200K–$500K pre-seed". Avoid vague or inflated amounts.
- capitalRationale: 2–3 sentences explaining WHY this amount (e.g. compute costs, minimal team, runway length).
- timeline: Launch timeline. Be realistic: MVP in 2–4 months, beta in 4–6 months. Use concrete phases (e.g. "MVP in 3 months, beta in 5 months, GA in 8 months").
- timelineRationale: 2–3 sentences explaining WHY this timeline (e.g. agent leverage, existing infra, validation steps).
- companyName: Short memorable name for the company (e.g. "AgentOps", "TrustLayer").
- worldview: One sentence - the company's lens on the world, how it sees the problem and its role. Mission-aligned, distinctive.
- checklist: Array of 3-5 strings - essential items to verify before launching (e.g. "Regulatory compliance for target market", "LLM API cost at scale", "User trust in agent decisions").
Use shared blocks where relevant. Respond in English.`,
        },
        {
          role: "user",
          content: `Mission: ${mission.title}
Problem: ${mission.problem}
Impact: ${mission.impact}
${(() => {
            const cluster = missionClusters.find((c) => c.missionIds.includes(missionId));
            return cluster?.worldview ? `Mission cluster worldview: ${cluster.worldview}` : "";
          })()}
${integratedSolution?.strategy ? `
Integrated solution (align company with this):
Strategy: ${integratedSolution.strategy}
${integratedSolution.howPathsCombine ? `How paths combine: ${integratedSolution.howPathsCombine}` : ""}
${integratedSolution.roadmap ? `Roadmap: ${integratedSolution.roadmap}` : ""}
` : ""}

Shared task blocks available:
${sharedTasksDesc || "None"}

Create an agent-first Company Blueprint aligned with the mission and integrated solution.
The product must perform real tasks. Calibrate capital_needed and timeline to the mission scope.
If similar companies exist, differentiate clearly. Return only valid JSON.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const parsed = JSON.parse(content);

    function toString(v: unknown): string {
      if (v === null || v === undefined) return "";
      if (typeof v === "string") return v;
      if (typeof v === "number" || typeof v === "boolean") return String(v);
      if (Array.isArray(v)) return v.map(toString).join(", ");
      if (typeof v === "object") {
        const obj = v as Record<string, unknown>;
        if (obj.name && obj.description)
          return `${obj.name}. ${obj.description}`;
        if (obj.description) return String(obj.description);
        return JSON.stringify(v);
      }
      return String(v);
    }

    const blueprint: CompanyBlueprint = {
      mission_id: missionId,
      product: toString(parsed.product),
      productTasks: toString(parsed.productTasks),
      users: toString(parsed.users),
      technology: toString(parsed.technology),
      humanRoles: toString(parsed.humanRoles),
      agentTasks: toString(parsed.agentTasks),
      capital_needed: toString(parsed.capital_needed),
      capitalRationale: toString(parsed.capitalRationale) || undefined,
      timeline: toString(parsed.timeline),
      timelineRationale: toString(parsed.timelineRationale) || undefined,
      companyName: toString(parsed.companyName) || undefined,
      worldview: toString(parsed.worldview) || undefined,
      checklist: Array.isArray(parsed.checklist) ? parsed.checklist.map((x: unknown) => toString(x)).filter(Boolean) : undefined,
    };

    return NextResponse.json({ blueprint });
  } catch (error) {
    console.error("Spawn API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to spawn company",
      },
      { status: 500 }
    );
  }
}
