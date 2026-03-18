"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { CompanyBlueprint } from "@/lib/types";
import { getAccentForKey } from "@/lib/theme";

export default function SpawnPage() {
  const params = useParams();
  const missionId = params.id as string;
  const [blueprint, setBlueprint] = useState<CompanyBlueprint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlueprint() {
      try {
        let integratedSolution: unknown = null;
        if (typeof window !== "undefined") {
          const stored = sessionStorage.getItem(`spawn:${missionId}:integrated`);
          if (stored) {
            try {
              integratedSolution = JSON.parse(stored);
              sessionStorage.removeItem(`spawn:${missionId}:integrated`);
            } catch {
              // ignore
            }
          }
        }
        const res = await fetch("/api/spawn", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ missionId, integratedSolution }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to fetch");
        setBlueprint(data.blueprint);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchBlueprint();
  }, [missionId]);

  if (loading) {
    return (
      <div>
        <Link
          href={`/missions/${missionId}`}
          className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-[var(--accent)]"
        >
          ← Back to mission
        </Link>
        <div className="flex flex-col items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
          <p className="mt-4 text-zinc-400">Generating blueprint...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Link
          href={`/missions/${missionId}`}
          className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-[var(--accent)]"
        >
          ← Back to mission
        </Link>
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-red-400">
          <p className="font-medium">Error</p>
          <p className="mt-1 text-sm">{error}</p>
          <p className="mt-2 text-xs text-zinc-500">
            Ensure OPENAI_API_KEY is set in .env
          </p>
        </div>
      </div>
    );
  }

  const fields = [
    { key: "product", label: "Product" },
    { key: "productTasks", label: "What the product does (tasks)" },
    { key: "users", label: "Target users" },
    { key: "technology", label: "Technology" },
    { key: "humanRoles", label: "Human roles (oversight only)" },
    { key: "agentTasks", label: "Agent-executable tasks" },
    { key: "capital_needed", label: "Capital needed", rationaleKey: "capitalRationale" as const },
    { key: "timeline", label: "Timeline", rationaleKey: "timelineRationale" as const },
  ] as const;

  function formatValue(value: unknown): string {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean")
      return String(value);
    if (Array.isArray(value))
      return value.map((v) => formatValue(v)).join(" • ");
    if (typeof value === "object") {
      const obj = value as Record<string, unknown>;
      const parts: string[] = [];
      if (obj.name) parts.push(String(obj.name));
      if (obj.description) parts.push(String(obj.description));
      if (obj.features && Array.isArray(obj.features)) {
        parts.push("Features: " + obj.features.map(String).join(", "));
      }
      if (parts.length) return parts.join("\n");
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }

  return (
    <div>
      <Link
        href={`/missions/${missionId}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-[var(--accent)]"
      >
        ← Back to mission
      </Link>

      {blueprint?.companyName && (
        <div className="mb-6 flex items-start gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-xl font-bold text-white"
            style={{ backgroundColor: getAccentForKey(blueprint.companyName) }}
          >
            {blueprint.companyName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{blueprint.companyName}</h1>
            <p className="text-sm text-zinc-500">Company Blueprint</p>
            {blueprint.worldview && (
              <p className="mt-2 text-sm italic text-zinc-400">&ldquo;{blueprint.worldview}&rdquo;</p>
            )}
          </div>
        </div>
      )}
      {!blueprint?.companyName && (
        <h1 className="mb-2 text-2xl font-bold text-white">Company Blueprint</h1>
      )}
      <p className="mb-8 text-zinc-400">
        Agent-first company · products that perform tasks; humans for oversight and decisions.
      </p>

      <div
        className="rounded-xl border p-6"
        style={{
          borderColor: blueprint?.companyName ? `${getAccentForKey(blueprint.companyName)}30` : "var(--border)",
          backgroundColor: blueprint?.companyName ? `${getAccentForKey(blueprint.companyName)}08` : "var(--card)",
        }}
      >
        <div className="space-y-6">
          {fields.map((field) => {
            const { key, label } = field;
            const rationaleKey = "rationaleKey" in field ? field.rationaleKey : undefined;
            const value = blueprint?.[key];
            if (value === undefined || value === null) return null;
            const text = formatValue(value);
            if (!text) return null;
            const rationale = rationaleKey ? blueprint?.[rationaleKey] : undefined;
            const accent = blueprint?.companyName ? getAccentForKey(blueprint.companyName) : "var(--accent)";
            return (
              <div key={key}>
                <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider" style={{ color: accent }}>
                  {label}
                </h3>
                <p className="whitespace-pre-line text-zinc-300">{text}</p>
                {rationale && (
                  <p className="mt-2 text-sm text-zinc-500 italic">Why · {rationale}</p>
                )}
              </div>
            );
          })}
          {blueprint?.checklist && blueprint.checklist.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider" style={{ color: blueprint.companyName ? getAccentForKey(blueprint.companyName) : "var(--accent)" }}>
                Must verify before launch
              </h3>
              <ul className="space-y-2">
                {blueprint.checklist.map((c, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-zinc-400">
                    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: blueprint.companyName ? getAccentForKey(blueprint.companyName) : "var(--accent)" }} />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg border border-[var(--border)] px-6 py-3 font-medium text-white transition-colors hover:border-[var(--accent)]/40"
        >
          Regenerate
        </button>
        <Link
          href={`/missions/${missionId}`}
          className="rounded-lg px-6 py-3 font-medium text-[var(--background)]"
          style={{ backgroundColor: blueprint?.companyName ? getAccentForKey(blueprint.companyName) : "var(--accent)" }}
        >
          Back to mission
        </Link>
      </div>
    </div>
  );
}
