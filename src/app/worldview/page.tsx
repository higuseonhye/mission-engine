import Link from "next/link";
import { worldview, systemProblem, systemOutput, worldVision } from "@/data/missionGraph";
import { getMissionClusters } from "@/lib/graph-db";
import { getAccentForKey } from "@/lib/theme";

export default async function WorldviewPage() {
  const clusters = await getMissionClusters();

  return (
    <div className="space-y-12">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-[var(--accent)]">
        ← Ecosystem
      </Link>

      <h1 className="text-3xl font-bold text-white">Worldview</h1>
      <p className="text-[var(--muted)]">
        System lens, mission clusters, company, policy, agents. All evolve together.
      </p>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-4 text-lg font-semibold text-[var(--accent)]">System</h2>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium uppercase text-zinc-500">Lens</p>
            <p className="mt-1 text-zinc-300">{worldview.lens}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-zinc-500">Cascade</p>
            <p className="mt-1 text-zinc-300">{worldview.cascade}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-zinc-500">Omnidirectional</p>
            <p className="mt-1 text-zinc-300">{worldview.omnidirectional}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-zinc-500">Problem</p>
            <p className="mt-1 text-zinc-300">{systemProblem}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-zinc-500">Output</p>
            <p className="mt-1 text-zinc-300">{systemOutput}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-zinc-500">Vision</p>
            <p className="mt-1 text-zinc-300">{worldVision}</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">Cluster Worldviews</h2>
        <p className="mb-6 text-sm text-zinc-500">
          Each cluster has its own lens. Mission worldview flows from cluster or mission-specific.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {(clusters ?? []).map((c) => (
            <div
              key={c.id}
              className="rounded-xl border p-6"
              style={{ borderColor: `${getAccentForKey(c.id)}30`, backgroundColor: `${getAccentForKey(c.id)}08` }}
            >
              <h3 className="font-semibold text-white" style={{ color: getAccentForKey(c.id) }}>{c.name}</h3>
              <p className="mt-1 text-sm text-zinc-400">{c.description}</p>
              {c.worldview && (
                <p className="mt-3 text-sm italic text-zinc-300">&ldquo;{c.worldview}&rdquo;</p>
              )}
              <Link
                href="/worldview/clusters"
                className="mt-4 inline-block text-xs text-[var(--accent)] hover:underline"
              >
                Edit cluster worldview ›
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Relationships</h2>
        <p className="text-sm text-zinc-400">
          Worldview → Clusters → Missions → Companies → Policy → Agents. Each layer informs the next. Updates cascade.
        </p>
        <div className="mt-4 flex flex-wrap gap-4">
          <Link href="/map" className="inline-block text-[var(--accent)] hover:underline">
            View relationship map ›
          </Link>
          <Link href="/worldview/clusters" className="inline-block text-[var(--accent)] hover:underline">
            Edit clusters ›
          </Link>
        </div>
      </section>

      <footer className="border-t border-[var(--border)] pt-8">
        <Link href="/missions/manage" className="text-sm text-[var(--accent)] hover:underline">
          Manage missions ›
        </Link>
      </footer>
    </div>
  );
}
