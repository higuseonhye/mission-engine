"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { MissionCluster } from "@/lib/types";

export default function AdminClustersPage() {
  const [clusters, setClusters] = useState<MissionCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<MissionCluster | null>(null);
  const [form, setForm] = useState<Partial<MissionCluster>>({});

  async function fetchClusters() {
    const res = await fetch("/api/clusters");
    const data = await res.json();
    if (res.ok) setClusters(data.clusters ?? []);
  }

  useEffect(() => {
    fetchClusters().finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!editing) return;
    try {
      const res = await fetch(`/api/clusters/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setEditing(null);
        setForm({});
        fetchClusters();
      }
    } catch (e) {
      console.error(e);
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
      <Link href="/admin/missions" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-[var(--accent)]">
        ← Admin
      </Link>

      <h1 className="text-2xl font-bold text-white">Admin · Clusters & Worldview</h1>
      <p className="text-sm text-zinc-500">
        Edit cluster worldview. Supabase required.
      </p>

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
                    className="rounded bg-[var(--accent)] px-3 py-1 text-sm text-[var(--background)]"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditing(null); setForm({}); }}
                    className="rounded border border-[var(--border)] px-3 py-1 text-sm text-white"
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
                className="mt-2 rounded border border-[var(--border)] px-2 py-1 text-xs text-zinc-400"
              >
                Edit worldview
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
