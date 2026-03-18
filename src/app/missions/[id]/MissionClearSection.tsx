"use client";

import { useState } from "react";
import Link from "next/link";
import type { Mission, MissionValidation, ClearPath, ClearPathType } from "@/lib/types";
import { getAccentForKey } from "@/lib/theme";

const PATH_LABELS: Record<ClearPathType, string> = {
  product: "Product",
  policy: "Policy",
  research: "Research",
  community: "Community",
  education: "Education",
  infrastructure: "Infrastructure",
  advocacy: "Advocacy",
};

export function MissionClearSection({
  mission,
  missionAccent,
}: {
  mission: Mission;
  missionAccent: string;
}) {
  const [validation, setValidation] = useState<MissionValidation | null>(null);
  const [validating, setValidating] = useState(false);
  const [clearPaths, setClearPaths] = useState<ClearPath[] | null>(null);
  const [loadingPaths, setLoadingPaths] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  function showFeedback(msg: string) {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  }

  async function handleValidate() {
    setValidating(true);
    setValidation(null);
    try {
      const res = await fetch(`/api/missions/${mission.id}/validate`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.validation) {
        setValidation(data.validation);
        showFeedback(data.validation.isValid ? "Mission is well-defined" : "See suggestions");
      } else {
        showFeedback(data.error ?? "Validation failed");
      }
    } catch (e) {
      showFeedback(e instanceof Error ? e.message : "Error");
    } finally {
      setValidating(false);
    }
  }

  async function handleClearPaths() {
    setLoadingPaths(true);
    setClearPaths(null);
    try {
      const res = await fetch(`/api/missions/${mission.id}/clear-paths`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.clearPaths) {
        setClearPaths(data.clearPaths);
        showFeedback(`Found ${data.clearPaths.length} clear paths`);
      } else {
        showFeedback(data.error ?? "Failed");
      }
    } catch (e) {
      showFeedback(e instanceof Error ? e.message : "Error");
    } finally {
      setLoadingPaths(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Success criteria - when is mission "Solved"? */}
      {(mission.successCriteria?.length ?? 0) > 0 && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--accent)]">
            Success criteria (Solved when…)
          </h2>
          <p className="mb-3 text-xs text-zinc-500">
            Mission is &quot;Solved&quot; when these conditions are met. Product is one path—policy, research, community, etc. can also clear.
          </p>
          <ul className="space-y-2">
            {mission.successCriteria?.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-zinc-300 before:mt-1.5 before:h-1 before:w-1 before:shrink-0 before:rounded-full before:bg-[var(--accent)]">
                {c}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Validation */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--accent)]">
          Mission validation
        </h2>
        <p className="mb-4 text-xs text-zinc-500">
          Is this a complete, well-defined mission? Clear problem, measurable outcome, achievable scope.
        </p>
        <button
          type="button"
          onClick={handleValidate}
          disabled={validating}
          className="rounded bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--background)] hover:opacity-90 disabled:opacity-50"
        >
          {validating ? "Validating…" : "Validate mission"}
        </button>
        {feedback && <p className="mt-2 text-xs text-zinc-400">{feedback}</p>}
        {validation && (
          <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${validation.isValid ? "text-emerald-400" : "text-amber-400"}`}>
                {validation.isValid ? "Valid" : "Needs work"}
              </span>
              <span className="text-xs text-zinc-500">Score: {validation.score}/100</span>
            </div>
            {validation.checks?.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs text-zinc-400">
                {validation.checks.map((c, i) => (
                  <li key={i}>
                    {c.clearProblem ? "✓" : "✗"} Clear problem · {c.measurableOutcome ? "✓" : "✗"} Measurable · {c.achievableScope ? "✓" : "✗"} Achievable · {c.hasSuccessCriteria ? "✓" : "✗"} Success criteria
                    {c.feedback && ` — ${c.feedback}`}
                  </li>
                ))}
              </ul>
            )}
            {validation.suggestions?.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs text-amber-400">
                {validation.suggestions.map((s, i) => (
                  <li key={i}>→ {s}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* Clear paths - all means to clear */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--accent)]">
          How to clear this mission
        </h2>
        <p className="mb-4 text-xs text-zinc-500">
          Product is one path. Policy, research, community, education, infrastructure, advocacy—all count. Use every means.
        </p>
        <button
          type="button"
          onClick={handleClearPaths}
          disabled={loadingPaths}
          className="rounded border px-4 py-2 text-sm font-medium text-white hover:bg-[var(--border)]/20 disabled:opacity-50"
          style={{ borderColor: `${missionAccent}60` }}
        >
          {loadingPaths ? "Loading…" : "Generate clear paths"}
        </button>
        {clearPaths && clearPaths.length > 0 && (
          <div className="mt-4 space-y-3">
            {clearPaths.map((p, i) => (
              <div
                key={i}
                className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3"
              >
                <span className="rounded bg-[var(--accent)]/20 px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
                  {PATH_LABELS[p.type] ?? p.type}
                </span>
                <p className="mt-2 text-sm text-zinc-300">{p.description}</p>
                {p.whyThisPath && (
                  <p className="mt-1 text-xs text-zinc-500">{p.whyThisPath}</p>
                )}
                {p.examples?.length > 0 && (
                  <p className="mt-1 text-xs text-zinc-500">e.g. {p.examples.join(", ")}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Actions */}
      <div className="flex flex-wrap gap-4">
        <Link
          href={`/missions/${mission.id}/solutions`}
          className="rounded-lg px-6 py-3 font-medium text-[var(--background)]"
          style={{ backgroundColor: missionAccent }}
        >
          Generate Solutions (product path)
        </Link>
        <Link
          href={`/missions/${mission.id}/spawn`}
          className="rounded-lg border px-6 py-3 font-medium text-white transition-colors hover:bg-[var(--card)]"
          style={{ borderColor: `${missionAccent}60` }}
        >
          Spawn Company Blueprint
        </Link>
        <Link
          href="/missions/manage"
          className="rounded-lg border border-[var(--border)] px-6 py-3 font-medium text-zinc-400 hover:bg-[var(--card)]"
        >
          Manage missions
        </Link>
      </div>
    </div>
  );
}
