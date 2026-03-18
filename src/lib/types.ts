export type MissionStatus = "Unsolved" | "In Progress" | "Solved";

/** How to clear a mission - not just product. All means count. */
export type ClearPathType =
  | "product"      // Company, product, service
  | "policy"        // Regulation, legislation, standards
  | "research"      // Breakthrough, paper, open model
  | "community"     // Open source, standards body, movement
  | "education"     // Skills, training, awareness
  | "infrastructure" // Public good, platform, protocol
  | "advocacy";     // Movement, awareness, coalition

export interface Mission {
  id: string;
  title: string;
  problem: string;
  impact: string;
  whyItMatters: string;
  signals: string[];
  status: MissionStatus;
  category: string;
  worldview?: string;
  /** Measurable criteria for "Solved" - what does clearing actually mean? */
  successCriteria?: string[];
  /** Preferred path types for this mission (e.g. policy might clear AI safety better than product) */
  clearPathTypes?: ClearPathType[];
}

/** Validation result for a mission - is it complete? */
export interface MissionValidation {
  missionId: string;
  isValid: boolean;
  score: number; // 0-100
  checks: {
    clearProblem: boolean;
    measurableOutcome: boolean;
    achievableScope: boolean;
    hasSuccessCriteria: boolean;
    feedback: string;
  }[];
  suggestions: string[];
}

/** A clear path - one way to achieve the mission */
export interface ClearPath {
  type: ClearPathType;
  description: string;
  examples: string[];
  whyThisPath?: string;
}

export interface MissionConnection {
  from: string;
  to: string;
  type: "enables" | "depends_on" | "related";
}

export interface MissionCluster {
  id: string;
  name: string;
  description: string;
  missionIds: string[];
  worldview?: string;
}

export interface SolutionPath {
  path: string;
  startupIdea: string;
  technologies: string[];
  agentTasks?: string[];
  sharedTaskIds?: string[];
  references?: { name: string; url?: string; note?: string }[];
  existingComparison?: string;
  checklist?: string[];
}

export interface IntegratedSolution {
  strategy: string;
  roadmap: string;
  keyPriorities: string[];
  howPathsCombine: string;
  references?: { name: string; url?: string; note?: string }[];
  existingComparison?: string;
  checklist?: string[];
}

export interface Task {
  id: string;
  name: string;
  description: string;
  agentExecutable: boolean;
  category: string;
  usedByMissionIds?: string[];
}

export interface CompanyBlueprint {
  mission_id: string;
  product: string;
  productTasks: string;
  users: string;
  technology: string;
  humanRoles: string;
  agentTasks: string;
  capital_needed: string;
  capitalRationale?: string;
  timeline: string;
  timelineRationale?: string;
  companyName?: string;
  worldview?: string;
  checklist?: string[];
}

export interface Policy {
  id: string;
  title: string;
  description: string;
  missionIds: string[];
  clusterIds?: string[];
  status: "Draft" | "Active" | "Archived";
}

export interface AgentRole {
  id: string;
  name: string;
  description: string;
  missionIds: string[];
  taskIds?: string[];
}
