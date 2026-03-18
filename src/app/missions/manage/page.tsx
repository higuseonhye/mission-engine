"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Mission } from "@/lib/types";

export default function MissionsManagePage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [discoverSuggestions, setDiscoverSuggestions] = useState<Mission[]>([]);
  const [discovering, setDiscovering] = useState(false);
  const [editing, setEditing] = useState<Mission | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<Mission>>({});
  const [history, setHistory] = useState<{ version: number; snapshot: Mission; changedAt: string }[]>([]);
  const [historyMissionId, setHistoryMissionId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Record<string, unknown>>({});
  const [suggesting, setSuggesting] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);

  const categories = ["AI / Technology", "Climate", "Health", "Education", "Policy", "Other"];

  function showFeedback(msg: string, ok: boolean) {
    setFeedback({ msg, ok });
    setTimeout(() => setFeedback(null), 3000);
  }

  async function fetchMissions() {
    const res = await fetch("/api/missions");
    const data = await res.json();
    if (res.ok) setMissions(data.missions ?? []);
  }

  useEffect(() => {
    fetchMissions().finally(() => setLoading(false));
  }, []);

  async function handleDiscover() {
    setDiscovering(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/missions/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok && data.suggestions) {
        setDiscoverSuggestions(data.suggestions);
        showFeedback(`Found ${data.suggestions.length} suggestions`, true);
      } else {
        showFeedback(data.error ?? "Discovery failed. Check OPENAI_API_KEY.", false);
      }
    } catch (e) {
      showFeedback(e instanceof Error ? e.message : "Network error", false);
    } finally {
      setDiscovering(false);
    }
  }

  async function handleAddSuggestion(s: Mission) {
    try {
      const res = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: s.title,
          problem: s.problem,
          impact: s.impact,
          whyItMatters: s.whyItMatters,
          signals: s.signals ?? [],
          status: "Unsolved",
          category: s.category ?? "AI / Technology",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDiscoverSuggestions((prev) => prev.filter((x) => x.title !== s.title));
        fetchMissions();
        showFeedback("Mission added", true);
      } else {
        showFeedback(data.error ?? "Failed to add", false);
      }
    } catch (e) {
      showFeedback(e instanceof Error ? e.message : "Failed", false);
    }
  }

  async function handleSave() {
    if (!editing) return;
    try {
      const res = await fetch(`/api/missions/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setEditing(null);
        setForm({});
        fetchMissions();
        showFeedback("Saved", true);
      } else {
        showFeedback(data.error ?? "Save failed", false);
      }
    } catch (e) {
      showFeedback(e instanceof Error ? e.message : "Save failed", false);
    }
  }

  async function handleCreate() {
    if (!form.title || !form.problem || !form.impact || !form.whyItMatters) {
      showFeedback("Fill title, problem, impact, why it matters", false);
      return;
    }
    try {
      const res = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          problem: form.problem,
          impact: form.impact,
          whyItMatters: form.whyItMatters,
          signals: form.signals ?? [],
          status: form.status ?? "Unsolved",
          category: form.category ?? "AI / Technology",
          worldview: form.worldview,
          successCriteria: form.successCriteria,
          clearPathTypes: form.clearPathTypes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCreating(false);
        setForm({});
        fetchMissions();
        showFeedback("Mission created", true);
      } else {
        showFeedback(data.error ?? "Create failed", false);
      }
    } catch (e) {
      showFeedback(e instanceof Error ? e.message : "Create failed", false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this mission?")) return;
    try {
      const res = await fetch(`/api/missions/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setEditing(null);
        fetchMissions();
        showFeedback("Deleted", true);
      } else {
        showFeedback(data.error ?? "Delete failed", false);
      }
    } catch (e) {
      showFeedback(e instanceof Error ? e.message : "Delete failed", false);
    }
  }

  async function handleComplete(id: string, status: Mission["status"]) {
    try {
      const res = await fetch(`/api/missions/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchMissions();
        showFeedback(`Status: ${status}`, true);
      } else {
        showFeedback(data.error ?? "Update failed", false);
      }
    } catch (e) {
      showFeedback(e instanceof Error ? e.message : "Update failed", false);
    }
  }

  async function handleSuggestUpdates(id: string) {
    setSuggesting(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/missions/${id}/suggest-updates`);
      const data = await res.json();
      if (res.ok && data.suggestions) {
        setSuggestions(data.suggestions);
        setForm((f) => ({ ...f, ...data.suggestions }));
        showFeedback("Suggestions applied to form", true);
      } else {
        showFeedback(data.error ?? "Need OPENAI_API_KEY", false);
      }
    } catch (e) {
      showFeedback(e instanceof Error ? e.message : "Failed", false);
    } finally {
      setSuggesting(false);
    }
  }

  async function loadHistory(id: string) {
    const res = await fetch(`/api/missions/${id}/history`);
    const data = await res.json();
    if (res.ok) setHistory(data.history ?? []);
    setHistoryMissionId(id);
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
      <div className="flex items-center gap-4">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-[var(--accent)]">
          ← Ecosystem
        </Link>
        <Link href="/worldview" className="text-sm text-[var(--accent)] hover:underline">
          Worldview ›
        </Link>
        <Link href="/map" className="text-sm text-[var(--accent)] hover:underline">
          Map ›
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-white">Missions</h1>
      <p className="mb-4 text-sm text-zinc-500">
        Add, edit, complete missions. Works without Supabase (session-only). Add Supabase for persistence.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={async () => {
            try {
              const res = await fetch("/api/missions/seed", { method: "POST" });
              const data = await res.json();
              if (res.ok) {
                showFeedback(data.message ?? `Seeded ${data.seeded} missions`, true);
                fetchMissions();
              } else showFeedback(data.error ?? "Seed failed", false);
            } catch (e) {
              showFeedback(e instanceof Error ? e.message : "Seed failed", false);
            }
          }}
          className="rounded border border-[var(--border)] px-3 py-1 text-xs text-zinc-400 hover:text-white"
        >
          Seed missions
        </button>
        <button
          type="button"
          onClick={async () => {
            try {
              const res = await fetch("/api/clusters/seed", { method: "POST" });
              const data = await res.json();
              if (res.ok) showFeedback("Clusters seeded", true);
              else showFeedback(data.error ?? "Seed failed", false);
            } catch (e) {
              showFeedback(e instanceof Error ? e.message : "Seed failed", false);
            }
          }}
          className="rounded border border-[var(--border)] px-3 py-1 text-xs text-zinc-400 hover:text-white"
        >
          Seed clusters
        </button>
        {feedback && (
          <div
            className={`rounded px-3 py-1 text-sm ${feedback.ok ? "bg-[var(--accent)]/20 text-[var(--accent)]" : "bg-red-500/20 text-red-400"}`}
          >
            {feedback.msg}
          </div>
        )}
      </div>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-4 text-lg font-semibold text-[var(--accent)]">AI Discovery</h2>
        <p className="mb-4 text-sm text-zinc-400">AI suggests new missions. Approve to add.</p>
        <button
          type="button"
          onClick={handleDiscover}
          disabled={discovering}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--background)] disabled:opacity-50"
        >
          {discovering ? "Discovering..." : "Discover missions"}
        </button>
        {discoverSuggestions.length > 0 && (
          <div className="mt-6 space-y-4">
            {discoverSuggestions.map((s, i) => (
              <div key={i} className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
                <h3 className="font-medium text-white">{s.title}</h3>
                <p className="mt-1 text-sm text-zinc-400">{s.problem}</p>
                <button
                  type="button"
                  onClick={() => handleAddSuggestion(s)}
                  className="mt-3 rounded bg-[var(--accent)] px-3 py-1 text-xs text-[var(--background)]"
                >
                  Add to missions
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Create mission</h2>
        {creating ? (
          <div className="space-y-3">
            <input
              placeholder="Title"
              value={form.title ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-white"
            />
            <textarea
              placeholder="Problem"
              value={form.problem ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, problem: e.target.value }))}
              className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-white"
              rows={2}
            />
            <textarea
              placeholder="Impact"
              value={form.impact ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, impact: e.target.value }))}
              className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-white"
              rows={2}
            />
            <textarea
              placeholder="Why it matters"
              value={form.whyItMatters ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, whyItMatters: e.target.value }))}
              className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-white"
              rows={2}
            />
            <select
              value={form.category ?? "AI / Technology"}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-white"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              placeholder="Signals (comma-separated)"
              value={(form.signals ?? []).join(", ")}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  signals: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                }))
              }
              className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-white"
            />
            <input
              placeholder="Worldview"
              value={form.worldview ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, worldview: e.target.value }))}
              className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-white"
            />
            <textarea
              placeholder="Success criteria (one per line - when is mission Solved?)"
              value={(form.successCriteria ?? []).join("\n")}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  successCriteria: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                }))
              }
              className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-white"
              rows={2}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreate}
                className="rounded bg-[var(--accent)] px-4 py-2 text-sm text-[var(--background)]"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => { setCreating(false); setForm({}); }}
                className="rounded border border-[var(--border)] px-4 py-2 text-sm text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="rounded border border-[var(--border)] px-4 py-2 text-sm text-white hover:border-[var(--accent)]/50"
          >
            + Add mission
          </button>
        )}
      </section>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Edit mission</h2>
            <div className="space-y-3">
              <input
                placeholder="Title"
                value={form.title ?? editing.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-white"
              />
              <textarea
                placeholder="Problem"
                value={form.problem ?? editing.problem}
                onChange={(e) => setForm((f) => ({ ...f, problem: e.target.value }))}
                className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-white"
                rows={2}
              />
              <input
                placeholder="Worldview"
                value={form.worldview ?? editing.worldview ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, worldview: e.target.value }))}
                className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-white"
              />
              <textarea
                placeholder="Success criteria (one per line)"
                value={(form.successCriteria ?? editing.successCriteria ?? []).join("\n")}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    successCriteria: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                  }))
                }
                className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-white"
                rows={2}
              />
              <select
                value={form.status ?? editing.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Mission["status"] }))}
                className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-white"
              >
                <option value="Unsolved">Unsolved</option>
                <option value="In Progress">In Progress</option>
                <option value="Solved">Solved</option>
              </select>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <button type="button" onClick={handleSave} className="rounded bg-[var(--accent)] px-4 py-2 text-sm text-[var(--background)]">Save</button>
              <button type="button" onClick={() => handleSuggestUpdates(editing.id)} disabled={suggesting} className="rounded border border-[var(--border)] px-4 py-2 text-sm text-white">
                {suggesting ? "..." : "Suggest updates"}
              </button>
              <button type="button" onClick={() => loadHistory(editing.id)} className="rounded border border-[var(--border)] px-4 py-2 text-sm text-white">History</button>
              <button type="button" onClick={() => handleDelete(editing.id)} className="rounded border border-red-500/50 px-4 py-2 text-sm text-red-400">Delete</button>
              <button type="button" onClick={() => { setEditing(null); setForm({}); setHistory([]); setHistoryMissionId(null); }} className="rounded border border-[var(--border)] px-4 py-2 text-sm text-white">Close</button>
            </div>
            {historyMissionId === editing.id && history.length > 0 && (
              <div className="mt-6 border-t border-[var(--border)] pt-4">
                <h3 className="mb-2 text-sm font-medium text-[var(--accent)]">History</h3>
                <div className="max-h-40 space-y-2 overflow-auto text-xs text-zinc-400">
                  {history.map((h, i) => (
                    <div key={i} className="rounded border border-[var(--border)] p-2">
                      <span className="text-zinc-500">v{h.version}</span> · {new Date(h.changedAt).toLocaleString()}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">Missions ({missions.length}) · Goal: Complete</h2>
        <div className="space-y-2">
          {missions.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
              <div>
                <h3 className="font-medium text-white">{m.title}</h3>
                <p className="text-xs text-zinc-500">{m.status} · {m.category}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {m.status !== "In Progress" && (
                  <button type="button" onClick={() => handleComplete(m.id, "In Progress")} className="rounded border border-[var(--accent)]/50 px-2 py-1 text-xs text-[var(--accent)]">In Progress</button>
                )}
                {m.status !== "Solved" && (
                  <button type="button" onClick={() => handleComplete(m.id, "Solved")} className="rounded bg-[var(--accent)] px-2 py-1 text-xs text-[var(--background)]">Complete</button>
                )}
                <button type="button" onClick={() => { setEditing(m); setForm(m); setSuggestions({}); }} className="rounded border border-[var(--border)] px-3 py-1 text-sm text-white hover:border-[var(--accent)]/50">Edit</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
