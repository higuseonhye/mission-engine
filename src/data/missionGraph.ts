import type { MissionConnection, MissionCluster } from "@/lib/types";

export const missionConnections: MissionConnection[] = [
  { from: "11", to: "2", type: "enables" },
  { from: "11", to: "6", type: "enables" },
  { from: "2", to: "3", type: "enables" },
  { from: "2", to: "8", type: "enables" },
  { from: "2", to: "16", type: "enables" },
  { from: "5", to: "9", type: "enables" },
  { from: "5", to: "3", type: "enables" },
  { from: "6", to: "4", type: "enables" },
  { from: "6", to: "9", type: "enables" },
  { from: "1", to: "5", type: "related" },
  { from: "1", to: "17", type: "related" },
  { from: "13", to: "1", type: "enables" },
  { from: "13", to: "7", type: "enables" },
  { from: "15", to: "14", type: "enables" },
  { from: "15", to: "20", type: "related" },
  { from: "20", to: "15", type: "enables" },
  { from: "12", to: "3", type: "related" },
  { from: "8", to: "5", type: "related" },
];

export const missionClusters: MissionCluster[] = [
  {
    id: "infrastructure",
    name: "AI Infrastructure",
    description: "Foundational capabilities that enable everything else",
    missionIds: ["11", "2", "6", "20"],
    worldview: "Compute and models first. Everything else builds on this layer.",
  },
  {
    id: "safety",
    name: "Safety & Trust",
    description: "Ensuring AI is safe, measurable, and trustworthy",
    missionIds: ["1", "7", "13", "17"],
    worldview: "Trust is the bottleneck. Measure, verify, then scale.",
  },
  {
    id: "agents",
    name: "Agents & Autonomy",
    description: "AI that acts, not just responds",
    missionIds: ["5", "9", "8"],
    worldview: "Agents that reliably execute. Tools, loops, and oversight.",
  },
  {
    id: "applications",
    name: "AI for X",
    description: "Applying AI to transform industries",
    missionIds: ["3", "4", "10", "12", "14", "15", "16", "18", "19"],
    worldview: "Apply where it matters. Industry-specific, user-centric.",
  },
  {
    id: "climate",
    name: "Climate",
    description: "Climate tech, adaptation, sustainability",
    missionIds: ["21", "22"],
    worldview: "Measure, model, act. Climate affects everything.",
  },
  {
    id: "health",
    name: "Health",
    description: "Healthcare, diagnostics, biotech",
    missionIds: ["12", "23"],
    worldview: "Health is foundational. Scale access, improve outcomes.",
  },
  {
    id: "education",
    name: "Education",
    description: "Learning, skills, access",
    missionIds: ["10", "24"],
    worldview: "Education unlocks potential. Personalize, scale, adapt.",
  },
];

export const systemProblem = "No path from awareness to execution.";
export const systemOutput =
  "Mission · Integrated Solution · Blueprint · Product";
export const worldVision =
  "AI-augmented. Safe. Efficient. Accessible.";

export const worldview = {
  lens: "Agents execute. Humans decide.",
  cascade: "Infrastructure enables agents. Agents enable applications. Build in order.",
  omnidirectional: "Missions connect. Solving one unlocks others. See the full ecosystem.",
};
