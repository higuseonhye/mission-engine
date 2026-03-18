import type { AgentRole } from "@/lib/types";

export const agentRoles: AgentRole[] = [
  {
    id: "a1",
    name: "Research Synthesizer",
    description: "Aggregates signals, papers, and trends for mission discovery.",
    missionIds: ["1", "7", "13"],
    taskIds: ["t1", "t2"],
  },
  {
    id: "a2",
    name: "Solution Architect",
    description: "Generates solution paths and startup ideas from mission context.",
    missionIds: ["3", "4", "10", "12"],
    taskIds: ["t3", "t4"],
  },
  {
    id: "a3",
    name: "Blueprint Generator",
    description: "Creates company blueprints from mission and solution context.",
    missionIds: [],
    taskIds: ["t5"],
  },
  {
    id: "a4",
    name: "Policy Analyst",
    description: "Maps missions to policy implications and regulatory needs.",
    missionIds: ["1", "7", "21", "22"],
    taskIds: [],
  },
];
