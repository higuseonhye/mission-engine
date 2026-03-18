import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getMissionById } from "@/lib/missions-db";
import { missionClusters } from "@/data/missionGraph";
import { getTasksForMissions } from "@/data/tasks";
import type { IntegratedSolution, SolutionPath } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const { missionId } = await request.json();
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
      .map((t) => `- ${t.name}: ${t.description} (agent: ${t.agentExecutable})`)
      .join("\n");

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert at identifying solution paths for technology missions.
Assume an AGENT-FIRST world: most work is done by AI agents; humans oversee and make high-value decisions.
Return a JSON object with key "solutions" containing an array of 3 solution paths.
Each object must have:
- path (string)
- startupIdea (string)
- technologies (string array)
- agentTasks (string array - 3-5 tasks that agents perform)
- references (array of { name, url?, note? } - 2-4 real references: papers, products, companies, blogs)
- existingComparison (string - 2-3 sentences comparing to existing solutions in the space, what's different)
- checklist (string array - 3-5 essential items to verify before building: market fit, technical feasibility, etc.)
Consider reusing shared task blocks where relevant. Be specific and actionable. Respond in English.`,
        },
        {
          role: "user",
          content: `Mission: ${mission.title}
Problem: ${mission.problem}
Impact: ${mission.impact}

Shared blocks available for this mission:
${sharedTasksDesc || "None specified"}

Generate 3 distinct agent-first solution paths. Each must include agentTasks - concrete tasks the product/agents perform. Return only valid JSON.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const parsed = JSON.parse(content);
    let solutions: SolutionPath[] = [];
    if (Array.isArray(parsed.solutions)) {
      solutions = parsed.solutions;
    } else if (Array.isArray(parsed)) {
      solutions = parsed;
    } else if (parsed.solutions && Array.isArray(parsed.solutions)) {
      solutions = parsed.solutions;
    } else {
      solutions = [parsed].filter((s) => s?.path || s?.startupIdea);
    }
    solutions = solutions.map((s) => {
      const raw = s as unknown as Record<string, unknown>;
      const refs = Array.isArray(raw.references)
        ? raw.references.map((r: unknown) => {
            const o = r as Record<string, unknown>;
            return { name: String(o.name ?? ""), url: o.url ? String(o.url) : undefined, note: o.note ? String(o.note) : undefined };
          })
        : undefined;
      return {
        path: String(raw.path ?? ""),
        startupIdea: String(raw.startupIdea ?? ""),
        technologies: Array.isArray(raw.technologies) ? raw.technologies.map(String) : [],
        agentTasks: Array.isArray(raw.agentTasks) ? raw.agentTasks.map(String) : [],
        sharedTaskIds: Array.isArray(raw.sharedTaskIds) ? raw.sharedTaskIds.map(String) : [],
        references: refs?.filter((r: { name: string }) => r.name)?.length ? refs : undefined,
        existingComparison: raw.existingComparison ? String(raw.existingComparison) : undefined,
        checklist: Array.isArray(raw.checklist) ? raw.checklist.map(String).filter(Boolean) : undefined,
      };
    });

    const solutionsSummary = solutions
      .map((s, i) => `Path ${i + 1}: ${s.path} - ${s.startupIdea}`)
      .join("\n");

    const integrateCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Synthesize multiple solution paths into ONE integrated solution.
Return JSON with: strategy, roadmap, keyPriorities, howPathsCombine, references (array of { name, url?, note? }), existingComparison (vs incumbents), checklist (3-5 must-verify items).
Be specific. Respond in English.`,
        },
        {
          role: "user",
          content: `Mission: ${mission.title}
Problem: ${mission.problem}

Solution paths:
${solutionsSummary}

Synthesize these into a single integrated solution. What's the unified strategy? How do the paths combine? What's the roadmap? Return only valid JSON.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const integrateContent = integrateCompletion.choices[0]?.message?.content;
    let integratedSolution: IntegratedSolution = {
      strategy: "",
      roadmap: "",
      keyPriorities: [],
      howPathsCombine: "",
    };
    if (integrateContent) {
      try {
        const parsed = JSON.parse(integrateContent);
        const refs = Array.isArray(parsed.references)
          ? parsed.references.map((r: unknown) => {
              const o = r as Record<string, unknown>;
              return { name: String(o.name ?? ""), url: o.url ? String(o.url) : undefined, note: o.note ? String(o.note) : undefined };
            })
          : undefined;
        integratedSolution = {
          strategy: String(parsed.strategy ?? ""),
          roadmap: String(parsed.roadmap ?? ""),
          keyPriorities: Array.isArray(parsed.keyPriorities) ? parsed.keyPriorities.map(String) : [],
          howPathsCombine: String(parsed.howPathsCombine ?? ""),
          references: refs?.filter((r: { name: string }) => r.name)?.length ? refs : undefined,
          existingComparison: parsed.existingComparison ? String(parsed.existingComparison) : undefined,
          checklist: Array.isArray(parsed.checklist) ? parsed.checklist.map(String).filter(Boolean) : undefined,
        };
      } catch {
        // ignore
      }
    }

    const cluster = missionClusters.find((c) => c.missionIds.includes(missionId));
    const missionWorldview = mission.worldview ?? cluster?.worldview ?? undefined;

    return NextResponse.json({ solutions, integratedSolution, missionWorldview });
  } catch (error) {
    console.error("Solutions API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate solutions",
      },
      { status: 500 }
    );
  }
}
