import Link from "next/link";
import { notFound } from "next/navigation";
import { getMissionById, getMissions } from "@/lib/missions-db";
import { MissionClearSection } from "./MissionClearSection";
import { getMissionClusters, getMissionConnections } from "@/lib/graph-db";
import { getAccentForKey } from "@/lib/theme";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Unsolved: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    "In Progress": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    Solved: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };
  return (
    <span
      className={`rounded-full border px-3 py-1 text-sm font-medium ${styles[status] ?? "bg-zinc-500/20 text-zinc-400"}`}
    >
      {status}
    </span>
  );
}

export default async function MissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [mission, allMissions, missionClusters, missionConnections] = await Promise.all([
    getMissionById(id),
    getMissions(),
    getMissionClusters(),
    getMissionConnections(),
  ]);
  if (!mission) notFound();

  const enables = (missionConnections ?? []).filter(
    (c) => c.from === id && c.type === "enables"
  );
  const enabledBy = missionConnections.filter(
    (c) => c.to === id && c.type === "enables"
  );
  const upstreamMissionIds = enabledBy.map((c) => c.from);
  const downstreamMissionIds = enables.map((c) => c.to);
  const cluster = (missionClusters ?? []).find((c) => c.missionIds.includes(id));
  const missionAccent = getAccentForKey(id);
  const worldview = mission.worldview ?? cluster?.worldview;

  return (
    <div>
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-[var(--accent)]"
      >
        ← Back to ecosystem
      </Link>

      {worldview && (
        <div className="mb-6 rounded-lg border p-4" style={{ borderColor: `${missionAccent}40`, backgroundColor: `${missionAccent}0d` }}>
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: missionAccent }}>Worldview</p>
          <p className="mt-1 text-sm text-zinc-300">{worldview}</p>
        </div>
      )}

      <div className="mb-8">
        <div className="mb-4 flex items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: missionAccent }}>
            {mission.category}
          </span>
          <StatusBadge status={mission.status} />
        </div>
        <h1 className="mb-4 text-3xl font-bold text-white md:text-4xl">
          {mission.title}
        </h1>
        <p className="text-lg text-zinc-300">{mission.problem}</p>
      </div>

      {(enables.length > 0 || enabledBy.length > 0) && (
        <section className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--accent)]">
            Connections
          </h2>
          <div className="flex flex-wrap gap-8">
            {enabledBy.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-zinc-500">
                  Enabled by
                </p>
                <div className="flex flex-wrap gap-2">
                  {upstreamMissionIds.map((mid) => {
                    const m = allMissions.find((x) => x.id === mid);
                    return m ? (
                      <Link
                        key={mid}
                        href={`/missions/${mid}`}
                        className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm text-zinc-300 hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
                      >
                        {m.title}
                      </Link>
                    ) : null;
                  })}
                </div>
              </div>
            )}
            {enables.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-zinc-500">
                  Unlocks
                </p>
                <div className="flex flex-wrap gap-2">
                  {downstreamMissionIds.map((mid) => {
                    const m = allMissions.find((x) => x.id === mid);
                    return m ? (
                      <Link
                        key={mid}
                        href={`/missions/${mid}`}
                        className="rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1.5 text-sm text-[var(--accent-muted)] hover:bg-[var(--accent)]/20"
                      >
                        {m.title}
                      </Link>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--accent)]">
            Impact
          </h2>
          <p className="text-zinc-300">{mission.impact}</p>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--accent)]">
            Why it matters
          </h2>
          <p className="text-zinc-300">{mission.whyItMatters}</p>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--accent)]">
            Signals
          </h2>
          <ul className="space-y-2">
            {mission.signals.map((signal, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-zinc-400 before:mt-1.5 before:h-1 before:w-1 before:shrink-0 before:rounded-full before:bg-[var(--accent)]"
              >
                {signal}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <MissionClearSection mission={mission} missionAccent={missionAccent} />
    </div>
  );
}
