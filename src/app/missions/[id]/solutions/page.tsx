"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { IntegratedSolution, SolutionPath } from "@/lib/types";
import { getAccentForKey } from "@/lib/theme";

interface BuildResult {
  projectName: string;
  files: { path: string; content: string }[];
}

function BuildResultDisplay({ buildResult }: { buildResult: BuildResult }) {
  const [selectedFile, setSelectedFile] = useState<string | null>(
    buildResult.files[0]?.path ?? null
  );
  const buildResultRef = useRef<HTMLDivElement>(null);

  const previewFile = useMemo(
    () =>
      buildResult.files.find(
        (f) =>
          f.path === "preview.html" ||
          f.path === "index.html" ||
          f.path.endsWith(".html")
      ) ?? buildResult.files[0],
    [buildResult.files]
  );

  const previewUrl = useMemo(() => {
    if (
      !previewFile ||
      (!previewFile.path.endsWith(".html") &&
        !previewFile.path.endsWith(".htm"))
    ) {
      return null;
    }
    return URL.createObjectURL(
      new Blob([previewFile.content], { type: "text/html" })
    );
  }, [previewFile]);

  useEffect(() => {
    if (buildResult.files[0]) {
      setSelectedFile(buildResult.files[0].path);
    }
  }, [buildResult.files]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    buildResultRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  function downloadAll() {
    const blob = new Blob(
      [
        buildResult.files
          .map((f) => `=== ${f.path} ===\n${f.content}\n`)
          .join("\n"),
      ],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${buildResult.projectName}-all-files.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <div ref={buildResultRef} className="mt-12 space-y-6">
      {previewUrl && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-4 py-3">
            <h2 className="font-semibold text-white">
              Live Preview · {buildResult.projectName}
            </h2>
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[var(--background)] hover:bg-[var(--accent-muted)]"
            >
              Open in new tab
            </a>
          </div>
          <iframe
            src={previewUrl}
            title="Preview"
            className="w-full h-[500px] border-0 bg-white"
            sandbox="allow-scripts"
          />
        </div>
      )}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-4 py-3">
          <h2 className="font-semibold text-white">Source Code</h2>
          <button
            type="button"
            onClick={downloadAll}
            className="rounded border border-[var(--border)] px-3 py-1.5 text-sm text-zinc-300 hover:bg-[var(--card)]"
          >
            Download all
          </button>
        </div>
        <div className="flex min-h-[400px]">
          <div className="w-48 border-r border-[var(--border)] bg-[var(--background)] p-2">
            {buildResult.files.map((f) => (
              <button
                key={f.path}
                type="button"
                onClick={() => setSelectedFile(f.path)}
                className={`block w-full rounded px-2 py-1.5 text-left text-sm truncate ${
                  selectedFile === f.path
                    ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {f.path}
              </button>
            ))}
          </div>
          <div className="flex-1 min-w-0">
            {selectedFile && (
              <div className="relative">
                <pre className="overflow-auto p-4 text-sm text-zinc-300 font-mono whitespace-pre-wrap break-words max-h-[500px]">
                  {buildResult.files.find((f) => f.path === selectedFile)
                    ?.content ?? ""}
                </pre>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      buildResult.files.find((f) => f.path === selectedFile)
                        ?.content ?? ""
                    )
                  }
                  className="absolute top-2 right-2 rounded bg-[var(--border)] px-2 py-1 text-xs text-zinc-400 hover:text-white"
                >
                  Copy
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SolutionsPage() {
  const params = useParams();
  const missionId = params.id as string;
  const [solutions, setSolutions] = useState<SolutionPath[] | null>(null);
  const [integratedSolution, setIntegratedSolution] = useState<IntegratedSolution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buildingIndex, setBuildingIndex] = useState<number | null>(null);
  const [buildingIntegrated, setBuildingIntegrated] = useState(false);
  const [buildResult, setBuildResult] = useState<BuildResult | null>(null);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [missionWorldview, setMissionWorldview] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSolutions() {
      try {
        const res = await fetch("/api/solutions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ missionId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to fetch");
        setSolutions(data.solutions);
        setIntegratedSolution(data.integratedSolution ?? null);
        setMissionWorldview(data.missionWorldview ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchSolutions();
  }, [missionId]);

  async function handleBuild(solution: SolutionPath, index: number) {
    setBuildingIndex(index);
    setBuildingIntegrated(false);
    setBuildResult(null);
    setBuildError(null);
    try {
      const res = await fetch("/api/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missionId, solution }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to build");
      setBuildResult(data);
      setBuildError(null);
    } catch (e) {
      setBuildError(e instanceof Error ? e.message : "Unknown error");
      setBuildResult(null);
    } finally {
      setBuildingIndex(null);
    }
  }

  async function handleBuildIntegrated() {
    if (!integratedSolution) return;
    setBuildingIntegrated(true);
    setBuildingIndex(null);
    setBuildResult(null);
    setBuildError(null);
    try {
      const res = await fetch("/api/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missionId, integratedSolution }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to build");
      setBuildResult(data);
      setBuildError(null);
    } catch (e) {
      setBuildError(e instanceof Error ? e.message : "Unknown error");
      setBuildResult(null);
    } finally {
      setBuildingIntegrated(false);
    }
  }

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
          <p className="mt-4 text-zinc-400">Generating solutions...</p>
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

  return (
    <div>
      <Link
        href={`/missions/${missionId}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-[var(--accent)]"
      >
        ← Back to mission
      </Link>

      <h1 className="mb-2 text-2xl font-bold text-white">Solution</h1>
      {missionWorldview && (
        <div className="mb-6 rounded-lg border p-4" style={{ borderColor: `${getAccentForKey(missionId)}40`, backgroundColor: `${getAccentForKey(missionId)}0d` }}>
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: getAccentForKey(missionId) }}>Mission worldview</p>
          <p className="mt-1 text-sm text-zinc-300">{missionWorldview}</p>
        </div>
      )}
      <p className="mb-8 text-zinc-400">
        Integrated solution (company-aligned, feeds into Spawn) and individual paths (exploratory options). Both use shared blocks.
      </p>

      {integratedSolution && integratedSolution.strategy && (
        <div className="mb-12 rounded-xl border-2 p-6" style={{ borderColor: `${getAccentForKey(missionId)}40`, backgroundColor: `${getAccentForKey(missionId)}0d` }}>
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded bg-[var(--background)] px-2 py-0.5 text-xs font-medium" style={{ color: getAccentForKey(missionId) }}>Company-aligned</span>
          </div>
          <h2 className="mb-4 text-lg font-semibold" style={{ color: getAccentForKey(missionId) }}>
            Integrated Solution
          </h2>
          <p className="mb-4 text-zinc-300">{integratedSolution.strategy}</p>
          {integratedSolution.howPathsCombine && (
            <p className="mb-4 text-sm text-zinc-400">
              <span className="font-medium" style={{ color: getAccentForKey(missionId) }}>How paths combine</span>
              {" · "}{integratedSolution.howPathsCombine}
            </p>
          )}
          {integratedSolution.existingComparison && (
            <div className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
              <p className="mb-2 text-xs font-medium uppercase" style={{ color: getAccentForKey(missionId) }}>Vs existing solutions</p>
              <p className="text-sm text-zinc-400">{integratedSolution.existingComparison}</p>
            </div>
          )}
          {integratedSolution.references && integratedSolution.references.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium uppercase" style={{ color: getAccentForKey(missionId) }}>References</p>
              <ul className="space-y-1 text-sm text-zinc-400">
                {integratedSolution.references.map((r, i) => (
                  <li key={i}>
                    {r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer" className="hover:text-white underline">{r.name}</a> : r.name}
                    {r.note && <span className="text-zinc-500"> · {r.note}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {integratedSolution.checklist && integratedSolution.checklist.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium uppercase" style={{ color: getAccentForKey(missionId) }}>Must verify</p>
              <ul className="space-y-1">
                {integratedSolution.checklist.map((c, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-zinc-400">
                    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: getAccentForKey(missionId) }} />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {integratedSolution.roadmap && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium uppercase" style={{ color: getAccentForKey(missionId) }}>Roadmap</p>
              <p className="text-sm text-zinc-400 whitespace-pre-line">{integratedSolution.roadmap}</p>
            </div>
          )}
          {integratedSolution.keyPriorities?.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase" style={{ color: getAccentForKey(missionId) }}>Key priorities</p>
              <ul className="space-y-1">
                {integratedSolution.keyPriorities.map((p, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-zinc-400">
                    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: getAccentForKey(missionId) }} />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-6">
            <button
              type="button"
              onClick={handleBuildIntegrated}
              disabled={buildingIntegrated || buildingIndex !== null}
              className="rounded-lg px-6 py-3 font-medium text-[var(--background)] disabled:opacity-50"
              style={{ backgroundColor: getAccentForKey(missionId) }}
            >
              {buildingIntegrated ? "Building..." : "Build Integrated Solution"}
            </button>
          </div>
        </div>
      )}

      <h2 className="mb-4 text-lg font-semibold text-white">Individual Paths</h2>
      <p className="mb-4 text-sm text-zinc-500">Exploratory options. Each can be built separately or inform the integrated solution.</p>
      <div className="space-y-6">
        {solutions?.map((sol, i) => {
          const pathAccent = getAccentForKey(`${missionId}-path-${i}`);
          return (
            <div
              key={i}
              className="rounded-xl border p-6"
              style={{ borderColor: `${pathAccent}30`, backgroundColor: `${pathAccent}08` }}
            >
              <h3 className="mb-2 font-semibold" style={{ color: pathAccent }}>
                Path {i + 1} · {sol.path}
              </h3>
              <p className="mb-4 text-zinc-300">{sol.startupIdea}</p>
              {sol.existingComparison && (
                <div className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
                  <p className="mb-1 text-xs font-medium uppercase" style={{ color: pathAccent }}>Vs existing</p>
                  <p className="text-sm text-zinc-400">{sol.existingComparison}</p>
                </div>
              )}
              {sol.references && sol.references.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-xs font-medium uppercase" style={{ color: pathAccent }}>References</p>
                  <ul className="space-y-1 text-sm text-zinc-400">
                    {sol.references.map((r, j) => (
                      <li key={j}>
                        {r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer" className="hover:text-white underline">{r.name}</a> : r.name}
                        {r.note && <span className="text-zinc-500"> · {r.note}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {sol.checklist && sol.checklist.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-xs font-medium uppercase" style={{ color: pathAccent }}>Must verify</p>
                  <ul className="space-y-1">
                    {sol.checklist.map((c, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-zinc-400">
                        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: pathAccent }} />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {sol.agentTasks && sol.agentTasks.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-xs font-medium uppercase" style={{ color: pathAccent }}>
                    Agent-executable tasks
                  </p>
                  <ul className="space-y-1 text-sm text-zinc-400">
                    {sol.agentTasks.map((task, j) => (
                      <li key={j} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: pathAccent }} />
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mb-4 flex flex-wrap gap-2">
                {sol.technologies?.map((tech, j) => (
                  <span
                    key={j}
                    className="rounded-md bg-[var(--background)] px-2 py-1 text-xs text-zinc-400"
                  >
                    {tech}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => handleBuild(sol, i)}
                disabled={buildingIndex !== null || buildingIntegrated}
                className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--background)] disabled:opacity-50"
                style={{ backgroundColor: pathAccent }}
              >
                {buildingIndex === i ? "Building..." : "Build"}
              </button>
            </div>
          );
        })}
      </div>

      {buildError && (
        <div className="mt-8 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400">
          <p className="font-medium">Build failed</p>
          <p className="mt-1 text-sm">{buildError}</p>
        </div>
      )}

      {buildResult && <BuildResultDisplay buildResult={buildResult} />}

      <div className="mt-8">
        <Link
          href={`/missions/${missionId}/spawn`}
          onClick={() => {
            if (integratedSolution && typeof window !== "undefined") {
              sessionStorage.setItem(`spawn:${missionId}:integrated`, JSON.stringify(integratedSolution));
            }
          }}
          className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium text-[var(--background)]"
          style={{ backgroundColor: getAccentForKey(missionId) }}
        >
          Spawn Company Blueprint ›
        </Link>
      </div>
    </div>
  );
}
