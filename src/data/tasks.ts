import type { Task } from "@/lib/types";

export const sharedTasks: Task[] = [
  {
    id: "t1",
    name: "Document ingestion & parsing",
    description: "Ingest documents, extract structure, chunk for retrieval",
    agentExecutable: true,
    category: "data",
    usedByMissionIds: ["2", "3", "8", "16"],
  },
  {
    id: "t2",
    name: "Real-time inference API",
    description: "Low-latency model serving for edge/cloud",
    agentExecutable: true,
    category: "infrastructure",
    usedByMissionIds: ["6", "9", "4"],
  },
  {
    id: "t3",
    name: "Tool use & function calling",
    description: "Reliable agent tool execution with retries",
    agentExecutable: true,
    category: "agents",
    usedByMissionIds: ["5", "9", "8"],
  },
  {
    id: "t4",
    name: "Content provenance & verification",
    description: "Watermarking, detection, C2PA metadata",
    agentExecutable: true,
    category: "trust",
    usedByMissionIds: ["7", "13"],
  },
  {
    id: "t5",
    name: "Multimodal understanding",
    description: "Vision + text reasoning for scene understanding",
    agentExecutable: true,
    category: "models",
    usedByMissionIds: ["4", "18", "19"],
  },
  {
    id: "t6",
    name: "Evaluation & benchmarking",
    description: "Automated safety, capability, and regression tests",
    agentExecutable: true,
    category: "trust",
    usedByMissionIds: ["13", "1"],
  },
  {
    id: "t7",
    name: "Personal context management",
    description: "User preferences, history, privacy-preserving storage",
    agentExecutable: true,
    category: "agents",
    usedByMissionIds: ["9", "10"],
  },
  {
    id: "t8",
    name: "Adaptive learning loop",
    description: "Feedback collection and model improvement",
    agentExecutable: true,
    category: "applications",
    usedByMissionIds: ["10", "12"],
  },
];

export function getTasksForMissions(missionIds: string[]): Task[] {
  return sharedTasks.filter((t) =>
    t.usedByMissionIds?.some((id) => missionIds.includes(id))
  );
}
