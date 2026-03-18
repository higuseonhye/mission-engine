import type { Mission, MissionCluster } from "./types";

const missionOverrides = new Map<string, Partial<Mission>>();
const newMissions = new Map<string, Mission>();
const clusterOverrides = new Map<string, Partial<MissionCluster>>();

export function getMissionOverrides(): Map<string, Partial<Mission>> {
  return missionOverrides;
}

export function getNewMissions(): Map<string, Mission> {
  return newMissions;
}

export function getClusterOverrides(): Map<string, Partial<MissionCluster>> {
  return clusterOverrides;
}

export function setMissionOverride(id: string, updates: Partial<Mission>): void {
  const existing = missionOverrides.get(id) ?? {};
  missionOverrides.set(id, { ...existing, ...updates });
}

export function addNewMission(mission: Mission): void {
  newMissions.set(mission.id, mission);
}

export function removeMission(id: string): void {
  missionOverrides.delete(id);
  newMissions.delete(id);
}

export function setClusterOverride(id: string, updates: Partial<MissionCluster>): void {
  const existing = clusterOverrides.get(id) ?? {};
  clusterOverrides.set(id, { ...existing, ...updates });
}

export function clearOverrides(): void {
  missionOverrides.clear();
  newMissions.clear();
  clusterOverrides.clear();
}
