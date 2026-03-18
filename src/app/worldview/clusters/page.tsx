"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { MissionCluster } from "@/lib/types";

export default function WorldviewClustersPage() {
  const [clusters, setClusters] = useState<MissionCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<MissionCluster | null>(null);
  const [form, setForm] = useState<Partial<MissionCluster>>({});
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);
  const [cascadeSuggestions, setCascadeSuggestions] = useState<{ layer: string; targetId: string | null; action: string; suggestion: string }[]>([]);
  const [cascading, setCascading] = useState(false);

  function showFeedback(msg: string, ok: boolean) {
    setFeedback({ msg, ok });
    setTimeout(() => setFeedback(null), 3000);
  }

  async function fetchClusters() {
    try {
      const res = await fetch("/api/clusters");
      const data = await res.json();
      if (res.ok) setClusters(data.clusters ?? []);
      else showFeedback(data.error ?? "Failed to fetch clusters", false);
    } catch (e) {
      showFeedback(e instanceof Error ? e.message : "Network error", false);
    }
  }

  useEffect(() => {
    fetchClusters().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    if (!editing) return;
    try {
      const res = await fetch(`/api/clusters/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setEditing(null);
        setForm({});
        fetchClusters();
        showFeedback("Cluster worldview saved", true);
      } else {
        showFeedback(data.error ?? "Failed to save", false);
      }
    } catch (e) {
      showFeedback(e instanceof Error ? e.message : "Network error", false);
    }
  }

  async function handleSuggestCascade() {
    setCascading(true);
    setCascadeSuggestions([]);
    try {
      const res = await fetch("/api/cascade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok && data.suggestions) {
        setCascadeSuggestions(data.suggestions);
        showFeedback(`Found ${data.suggestions.length} cascade suggestions`, true);
      } else {
        showFeedback(data.error ?? "Cascade failed", false);
      }
    } catch (e) {
      showFeedback(e instanceof Error ? e.message : "Network error", false);
    } finally {
      setCascading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link href="/worldview" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-[var(--accent)]">
        ← Worldview
      </Link>

      <h1 className="text-2xl font-bold text-white">Cluster Worldviews</h1>
      <p className="text-sm text-zinc-500">
        Edit cluster worldview. Changes apply immediately (session or Supabase).
      </p>

      {feedback && (
        <div
          className={`rounded-lg border px-4 py-2 text-sm ${
            feedback.ok ? "border-green-500/50 bg-green-500/10 text-green-400" : "border-red-500/50 bg-red-500/10 text-red-400"
          }`}
        >
          {feedback.msg}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSuggestCascade}
          disabled={cascading}
          className="rounded bg-[var(--accent)] px-4 py-2 text-sm text-[var(--background)] hover:opacity-90 disabled:opacity-50"
        >
          {cascading ? "..." : "Suggest cascade updates"}
        </button>
      </div>

      {cascadeSuggestions.length > 0 && (
        <div className="rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-4">
          <h3 className="mb-2 text-sm font-semibold text-[var(--accent)]">Cascade suggestions</h3>
          <ul className="space-y-1 text-sm text-zinc-300">
            {cascadeSuggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="rounded bg-[var(--border)] px-1.5 py-0.5 text-xs">{s.layer}</span>
                {s.suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-4">
        {clusters.map((c) => (
          <div
            key={c.id}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4"
          >
            <h3 className="font-medium text-white">{c.name}</h3>
            <p className="text-sm text-zinc-500">{c.description}</p>
            {editing?.id === c.id ? (
              <div className="mt-4 space-y-2">
                <input
                  placeholder="Worldview"
                  value={form.worldview ?? c.worldview ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, worldview: e.target.value }))}
                  className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-white"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    className="rounded bg-[var(--accent)] px-3 py-1 text-sm text-[var(--background)] hover:opacity-90"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditing(null); setForm({}); }}
                    className="rounded border border-[var(--border)] px-3 py-1 text-sm text-white hover:bg-[var(--border)]/20"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-xs italic text-zinc-400">{c.worldview ?? "No worldview"}</p>
            )}
            {!editing && (
              <button
                type="button"
                onClick={() => { setEditing(c); setForm(c); }}
                className="mt-2 rounded border border-[var(--border)] px-2 py-1 text-xs text-zinc-400 hover:bg-[var(--border)]/20"
              >
                Edit worldview
              </button>
            )}
          </div>
        ))}
      </div>

      <footer className="flex gap-6 border-t border-[var(--border)] pt-8">
        <Link href="/worldview" className="text-sm text-[var(--accent)] hover:underline">Worldview ›</Link>
        <Link href="/map" className="text-sm text-[var(--accent)] hover:underline">Map ›</Link>
        <Link href="/missions/manage" className="text-sm text-[var(--accent)] hover:underline">Missions ›</Link>
      </footer>
    </div>
  );
}
