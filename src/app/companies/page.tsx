import Link from "next/link";
import { getMissionClusters } from "@/lib/graph-db";
import { getMissions } from "@/lib/missions-db";

export default async function CompaniesPage() {
  const [missions, missionClusters] = await Promise.all([getMissions(), getMissionClusters()]);
  function getMissionById(id: string) {
    return missions.find((m) => m.id === id);
  }
  return (
    <div className="space-y-12">
      <section>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Companies
        </h1>
        <p className="mt-4 max-w-xl text-[var(--muted)]">
          Company-centric view. Each mission can spawn a company blueprint with
          its own branding. Spawn from missions below to create blueprints.
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">
          Spawn companies by mission
        </h2>
        <p className="mb-6 text-sm text-[var(--muted)]">
          Select a mission to generate solutions and spawn a company blueprint.
          Each company gets a unique accent and checklist.
        </p>
        <div className="space-y-8">
          {(missionClusters ?? []).map((cluster) => {
            const clusterMissions = cluster.missionIds
              .map((id) => getMissionById(id))
              .filter(Boolean);

            return (
              <div key={cluster.id}>
                <h3 className="mb-2 text-sm font-medium text-[var(--muted)]">
                  {cluster.name}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {clusterMissions.map((mission) =>
                    mission ? (
                      <Link
                        key={mission.id}
                        href={`/missions/${mission.id}/spawn`}
                        className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm text-white transition-colors hover:border-[var(--accent)]/50 hover:text-[var(--accent)]"
                      >
                        {mission.title} ›
                      </Link>
                    ) : null
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-[var(--border)] pt-8">
        <Link href="/" className="text-sm text-[var(--accent)] hover:underline">
          Back to Ecosystem ›
        </Link>
      </footer>
    </div>
  );
}
