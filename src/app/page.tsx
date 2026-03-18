import Link from "next/link";
import { getMissions } from "@/lib/missions-db";
import { getMissionClusters, getMissionConnections } from "@/lib/graph-db";
import { worldview } from "@/data/missionGraph";
import { getAccentForKey } from "@/lib/theme";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Unsolved: "bg-amber-500/10 text-amber-400",
    "In Progress": "bg-[var(--accent)]/10 text-[var(--accent)]",
    Solved: "bg-blue-500/10 text-blue-400",
  };
  return (
    <span
      className={`rounded-md px-2 py-0.5 text-xs font-medium ${styles[status] ?? "bg-[var(--border)] text-[var(--muted)]"}`}
    >
      {status}
    </span>
  );
}

export default async function HomePage() {
  const [missions, missionClusters, missionConnections] = await Promise.all([
    getMissions(),
    getMissionClusters(),
    getMissionConnections(),
  ]);
  function getMissionById(id: string) {
    return missions.find((m) => m.id === id);
  }
  const solved = missions.filter((m) => m.status === "Solved").length;
  const inProgress = missions.filter((m) => m.status === "In Progress").length;
  const unsolved = missions.filter((m) => m.status === "Unsolved").length;
  const total = missions.length;
  const progressPct = Math.round(((solved + inProgress * 0.5) / total) * 100);

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section>
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
          Discover missions.
          <br />
          <span className="text-[var(--accent)]">Spawn companies.</span>
        </h1>
        <p className="mt-4 max-w-xl text-[var(--muted)]">
          {worldview.lens} {worldview.cascade}
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">{worldview.omnidirectional}</p>
        <p className="mt-2 text-xs text-zinc-500">These evolve as missions and companies develop.</p>
        <div className="mt-6 flex items-center gap-3 text-sm">
          <span className="rounded-full bg-[var(--card)] px-3 py-1 text-[var(--muted)]">
            Mission · Solution · Blueprint · Product
          </span>
        </div>
      </section>

      {/* Progress */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-[var(--muted)]">Ecosystem</h2>
          <span className="text-sm font-medium text-white">{progressPct}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-[var(--border)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="mt-4 flex gap-8 text-sm">
          <span className="text-[var(--muted)]">{total} total</span>
          <span className="text-emerald-500">{inProgress} in progress</span>
          <span className="text-amber-500">{unsolved} unsolved</span>
          <span className="text-blue-500">{solved} solved</span>
        </div>
      </section>

      {/* Missions by cluster */}
      <section className="space-y-10">
        {(missionClusters ?? []).map((cluster) => {
          const clusterMissions = cluster.missionIds
            .map((id) => getMissionById(id))
            .filter(Boolean);

          const clusterAccent = getAccentForKey(cluster.id);
          return (
            <div key={cluster.id} className="rounded-xl border p-6" style={{ borderColor: `${clusterAccent}30`, backgroundColor: `${clusterAccent}08` }}>
              <h2 className="mb-1 text-lg font-semibold text-white">{cluster.name}</h2>
              <p className="mb-2 text-sm text-[var(--muted)]">{cluster.description}</p>
              {cluster.worldview && (
                <p className="mb-4 text-xs italic" style={{ color: clusterAccent }}>{cluster.worldview}</p>
              )}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {clusterMissions.map((mission) => {
                  if (!mission) return null;
                  const enables = missionConnections.filter(
                    (c) => c.from === mission.id && c.type === "enables"
                  );

                  return (
                    <Link
                      key={mission.id}
                      href={`/missions/${mission.id}`}
                      className="group rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 transition-colors hover:border-[var(--accent)]/50"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <StatusBadge status={mission.status} />
                        {enables.length > 0 && (
                          <span className="text-xs text-[var(--muted)]">›{enables.length}</span>
                        )}
                      </div>
                      <h3 className="font-medium text-white group-hover:text-[var(--accent)]">
                        {mission.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">
                        {mission.problem}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      {missions.filter((m) => !missionClusters?.some((c) => c.missionIds.includes(m.id))).length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">Other</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {missions
              .filter((m) => !missionClusters.some((c) => c.missionIds.includes(m.id)))
              .map((mission) => (
                <Link
                  key={mission.id}
                  href={`/missions/${mission.id}`}
                  className="group rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 transition-colors hover:border-[var(--accent)]/50"
                >
                  <StatusBadge status={mission.status} />
                  <h3 className="mt-2 font-medium text-white group-hover:text-[var(--accent)]">
                    {mission.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{mission.problem}</p>
                </Link>
              ))}
          </div>
        </section>
      )}

      <footer className="flex flex-wrap gap-6 border-t border-[var(--border)] pt-8">
        <Link href="/companies" className="text-sm text-[var(--accent)] hover:underline">
          Companies ›
        </Link>
        <Link href="/blocks" className="text-sm text-[var(--accent)] hover:underline">
          Blocks & tasks ›
        </Link>
      </footer>
    </div>
  );
}
