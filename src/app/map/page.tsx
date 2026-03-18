import Link from "next/link";
import { getMissions } from "@/lib/missions-db";
import { getMissionClusters, getMissionConnections } from "@/lib/graph-db";
import { policies } from "@/data/policies";
import { agentRoles } from "@/data/agents";
import { worldview } from "@/data/missionGraph";
import { getAccentForKey } from "@/lib/theme";

export default async function MapPage() {
  const [missions, clusters, connections] = await Promise.all([
    getMissions(),
    getMissionClusters(),
    getMissionConnections(),
  ]);

  const conns = connections ?? [];
  const clusterList = clusters ?? [];

  return (
    <div className="space-y-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-[var(--accent)]">
        ← Ecosystem
      </Link>

      <h1 className="text-3xl font-bold text-white">Relationship Map</h1>
      <p className="text-[var(--muted)]">
        Worldview → Clusters → Missions → Companies → Policy → Agents. All layers connect.
      </p>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Flow diagram */}
          <div className="mb-8 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3 py-2 font-medium text-[var(--accent)]">Worldview</span>
            <span className="text-zinc-500">→</span>
            <span className="rounded-lg border border-zinc-600 bg-zinc-800/50 px-3 py-2 font-medium text-white">Clusters</span>
            <span className="text-zinc-500">→</span>
            <span className="rounded-lg border border-zinc-600 bg-zinc-800/50 px-3 py-2 font-medium text-white">Missions</span>
            <span className="text-zinc-500">→</span>
            <span className="rounded-lg border border-zinc-600 bg-zinc-800/50 px-3 py-2 font-medium text-white">Companies</span>
            <span className="text-zinc-500">→</span>
            <span className="rounded-lg border border-zinc-600 bg-zinc-800/50 px-3 py-2 font-medium text-white">Policy</span>
            <span className="text-zinc-500">→</span>
            <span className="rounded-lg border border-zinc-600 bg-zinc-800/50 px-3 py-2 font-medium text-white">Agents</span>
          </div>

          {/* System Worldview */}
          <div className="mb-8 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-4">
            <p className="text-sm font-medium text-[var(--accent)]">System Worldview</p>
            <p className="mt-1 text-xs text-zinc-400">{worldview.lens}</p>
            <p className="mt-1 text-xs text-zinc-500">{worldview.cascade}</p>
          </div>

          {/* Clusters */}
          <div className="mb-8">
            <h3 className="mb-3 text-sm font-semibold text-white">Clusters</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {clusterList.map((c) => (
                <Link
                  key={c.id}
                  href="/worldview/clusters"
                  className="rounded-lg border p-4 transition-colors hover:border-[var(--accent)]/50"
                  style={{ borderColor: `${getAccentForKey(c.id)}40` }}
                >
                  <p className="text-sm font-semibold text-white">{c.name}</p>
                  <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{c.worldview ?? c.description}</p>
                  <p className="mt-2 text-xs text-zinc-600">{c.missionIds.length} missions</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Missions by category */}
          <div className="mb-8">
            <h3 className="mb-3 text-sm font-semibold text-white">Missions by category</h3>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(missions.map((m) => m.category))).map((cat) => (
                <Link
                  key={cat}
                  href="/"
                  className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm text-white hover:border-[var(--accent)]/50"
                >
                  {cat} ({missions.filter((m) => m.category === cat).length})
                </Link>
              ))}
            </div>
          </div>

          {/* Mission connections */}
          <div className="mb-8 rounded-lg border border-[var(--border)] bg-[var(--background)] p-6">
            <h3 className="mb-4 text-sm font-semibold text-[var(--accent)]">Mission connections</h3>
            <div className="flex flex-wrap gap-4">
              {conns.slice(0, 15).map((conn, i) => {
                const fromM = missions.find((m) => m.id === conn.from);
                const toM = missions.find((m) => m.id === conn.to);
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded border border-[var(--border)] px-3 py-2 text-xs"
                  >
                    <span className="max-w-[120px] truncate text-zinc-400" title={fromM?.title ?? conn.from}>
                      {fromM?.title ?? conn.from}
                    </span>
                    <span className="text-[var(--accent)]">›</span>
                    <span className="max-w-[120px] truncate text-white" title={toM?.title ?? conn.to}>
                      {toM?.title ?? conn.to}
                    </span>
                    <span className="rounded bg-[var(--border)] px-1.5 py-0.5 text-zinc-500">{conn.type}</span>
                  </div>
                );
              })}
            </div>
            {conns.length > 15 && (
              <p className="mt-4 text-xs text-zinc-500">+ {conns.length - 15} more connections</p>
            )}
          </div>

          {/* Policy & Agents */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
              <h3 className="mb-3 text-sm font-semibold text-white">Policy</h3>
              <p className="mb-3 text-xs text-zinc-500">Missions inform policy. Policy shapes execution.</p>
              <div className="space-y-2">
                {policies.map((p) => (
                  <div key={p.id} className="rounded border border-[var(--border)] px-3 py-2 text-xs">
                    <p className="font-medium text-white">{p.title}</p>
                    <p className="mt-0.5 text-zinc-500">{p.missionIds.length} missions · {p.status}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
              <h3 className="mb-3 text-sm font-semibold text-white">Agents</h3>
              <p className="mb-3 text-xs text-zinc-500">Agents execute tasks. Companies deploy agents.</p>
              <div className="space-y-2">
                {agentRoles.map((a) => (
                  <div key={a.id} className="rounded border border-[var(--border)] px-3 py-2 text-xs">
                    <p className="font-medium text-white">{a.name}</p>
                    <p className="mt-0.5 text-zinc-500 line-clamp-1">{a.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="flex flex-wrap gap-6 border-t border-[var(--border)] pt-8">
        <Link href="/worldview" className="text-sm text-[var(--accent)] hover:underline">Worldview ›</Link>
        <Link href="/worldview/clusters" className="text-sm text-[var(--accent)] hover:underline">Clusters ›</Link>
        <Link href="/missions/manage" className="text-sm text-[var(--accent)] hover:underline">Missions ›</Link>
        <Link href="/companies" className="text-sm text-[var(--accent)] hover:underline">Companies ›</Link>
      </footer>
    </div>
  );
}
