import Link from "next/link";
import { sharedTasks } from "@/data/tasks";
import { getMissions } from "@/lib/missions-db";
import { getAccentForKey } from "@/lib/theme";

export default async function BlocksPage() {
  const missions = await getMissions();
  function getMissionTitle(id: string) {
    return missions.find((m) => m.id === id)?.title ?? id;
  }
  const categories = [...new Set(sharedTasks.map((t) => t.category))].sort();
  const agentCount = sharedTasks.filter((t) => t.agentExecutable).length;
  const totalMissions = [...new Set(sharedTasks.flatMap((t) => t.usedByMissionIds ?? []))].length;

  return (
    <div>
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-[var(--accent)]"
      >
        ← Back to missions
      </Link>

      <h1 className="mb-2 text-2xl font-bold text-white">
        Shared Blocks & Tasks
      </h1>
      <p className="mb-6 max-w-2xl text-zinc-400">
        Reusable task modules that span missions, companies, and solutions.
        Used in individual paths and composed into integrated solutions. Blocks evolve with the ecosystem.
      </p>

      {/* Block collection summary */}
      <div className="mb-10 grid gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-2xl font-bold text-white">{sharedTasks.length}</p>
          <p className="text-sm text-[var(--muted)]">Total blocks</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{categories.length}</p>
          <p className="text-sm text-[var(--muted)]">Categories</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-[var(--accent)]">{agentCount}</p>
          <p className="text-sm text-[var(--muted)]">Agent-executable</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{totalMissions}</p>
          <p className="text-sm text-[var(--muted)]">Missions using blocks</p>
        </div>
      </div>

      <div className="space-y-8">
        {categories.map((category) => {
          const tasks = sharedTasks.filter((t) => t.category === category);
          const catAccent = getAccentForKey(category);
          return (
            <section key={category} className="rounded-xl border p-6" style={{ borderColor: `${catAccent}30`, backgroundColor: `${catAccent}08` }}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: catAccent }}>
                  {category}
                </h2>
                <span className="text-xs text-[var(--muted)]">{tasks.length} blocks</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-5"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <h3 className="font-semibold text-white">{task.name}</h3>
                      {task.agentExecutable && (
                        <span className="rounded bg-[var(--accent)]/20 px-2 py-0.5 text-xs text-[var(--accent)]">
                          Agent
                        </span>
                      )}
                    </div>
                    <p className="mb-4 text-sm text-zinc-400">
                      {task.description}
                    </p>
                    {task.usedByMissionIds && task.usedByMissionIds.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-zinc-500">
                          Used by missions:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {task.usedByMissionIds.map((mid) => (
                            <Link
                              key={mid}
                              href={`/missions/${mid}`}
                              className="rounded bg-[var(--background)] px-2 py-0.5 text-xs text-[var(--accent-muted)] hover:text-[var(--accent)]"
                            >
                              {getMissionTitle(mid)}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
