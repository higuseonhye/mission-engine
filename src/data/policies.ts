import type { Policy } from "@/lib/types";

export const policies: Policy[] = [
  {
    id: "p1",
    title: "AI Safety & Governance",
    description: "Policies for model evaluation, red-teaming, and deployment guardrails.",
    missionIds: ["1", "7", "13", "17"],
    clusterIds: ["safety"],
    status: "Active",
  },
  {
    id: "p2",
    title: "Open Model Access",
    description: "Support open-source AI models and interoperability standards.",
    missionIds: ["20", "15"],
    clusterIds: ["infrastructure", "applications"],
    status: "Active",
  },
  {
    id: "p3",
    title: "Climate Disclosure",
    description: "Carbon accounting and climate risk disclosure requirements.",
    missionIds: ["21", "22"],
    clusterIds: ["climate"],
    status: "Draft",
  },
];
