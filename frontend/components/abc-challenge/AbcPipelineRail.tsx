"use client";

import { useEffect, useRef } from "react";
import {
  ChevronRight,
  Crosshair,
  LayoutGrid,
  Pause,
  Play,
  Route,
  SkipBack,
  SkipForward,
  Square,
} from "lucide-react";
import type { InferenceSnapshot, Quat } from "@/lib/abc-challenge/lean-tcnn-engine";
import {
  type Pathway,
  type StepIndex,
  PATHWAYS,
  PIPELINE_STEPS,
  buildStepLiveDetail,
  wrapStep,
} from "./abc-pipeline";

export interface AbcPipelineRailProps {
  /** Selected pipeline step, or `null` for the full-graph overview. */
  step: StepIndex | null;
  onSelectStep: (step: StepIndex | null) => void;
  tracing: boolean;
  onToggleTracing: () => void;
  pathway: Pathway;
  onSelectPathway: (pathway: Pathway) => void;
  autoWalk: boolean;
  onToggleAutoWalk: () => void;
  cameraLock: boolean;
  onToggleCameraLock: () => void;
  /** Current damped-prior decay, shown on the bypass bracket. */
  tauMs: number;
  snapshot: InferenceSnapshot | null;
  groundTruthFuture: Quat[] | null;
}

const controlButtonClass =
  "h-7 px-2 inline-flex items-center justify-center gap-1.5 rounded border text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400/70";
const idleControlClass =
  "border-green-500/25 bg-black/60 text-green-300 hover:bg-green-500/20 hover:border-green-400/60";

/**
 * The step rail docked under the 3D viewport: one node per pipeline step, the
 * damped-prior bypass drawn as a bracket over the steps it skips, and the signal
 * tracing controls. It is the single place where a step is chosen.
 */
export default function AbcPipelineRail({
  step,
  onSelectStep,
  tracing,
  onToggleTracing,
  pathway,
  onSelectPathway,
  autoWalk,
  onToggleAutoWalk,
  cameraLock,
  onToggleCameraLock,
  tauMs,
  snapshot,
  groundTruthFuture,
}: AbcPipelineRailProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Keep the selected node in view when the rail scrolls sideways on narrow screens.
  // Only the rail itself is scrolled, never the page.
  useEffect(() => {
    const scroller = scrollerRef.current;
    const node = step === null ? null : nodeRefs.current[step];
    if (!scroller || !node || scroller.scrollWidth <= scroller.clientWidth) return;
    const nodeRect = node.getBoundingClientRect();
    const scrollerRect = scroller.getBoundingClientRect();
    scroller.scrollTo({
      left:
        scroller.scrollLeft +
        (nodeRect.left - scrollerRect.left) -
        (scroller.clientWidth - nodeRect.width) / 2,
      behavior: "smooth",
    });
  }, [step]);

  const tracedStep: StepIndex = step ?? 0;
  const bypassActive = tracing && pathway === "prior";
  const detail = tracing
    ? buildStepLiveDetail(tracedStep, pathway, snapshot, groundTruthFuture)
    : null;

  return (
    <div className="border-t border-green-500/25 bg-black/70 font-mono text-xs text-green-200">
      {/* Rail header: overview shortcut on the left, signal tracing controls on the right */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-3 pt-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider text-green-400">Pipeline</span>
          <button
            type="button"
            onClick={() => onSelectStep(null)}
            aria-pressed={step === null}
            className={`${controlButtonClass} ${
              step === null
                ? "border-green-400 bg-green-500/20 text-green-100 font-semibold"
                : idleControlClass
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Full graph
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {tracing && (
            <>
              <div
                role="group"
                aria-label="Signal pathway"
                className="flex rounded border border-green-500/25 overflow-hidden"
              >
                {PATHWAYS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onSelectPathway(p.id)}
                    aria-pressed={pathway === p.id}
                    title={p.label}
                    className={`h-7 px-2 inline-flex items-center gap-1.5 text-[11px] border-r last:border-r-0 border-green-500/25 transition-colors ${
                      pathway === p.id
                        ? p.activeClass + " font-semibold"
                        : "bg-black/60 text-gray-400 hover:text-green-200"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${p.dotClass}`} />
                    {p.shortLabel}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onSelectStep(wrapStep(tracedStep - 1))}
                  title="Previous step"
                  aria-label="Previous step"
                  className={`${controlButtonClass} ${idleControlClass}`}
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onToggleAutoWalk}
                  aria-pressed={autoWalk}
                  title={autoWalk ? "Pause the automatic walk" : "Walk through the steps automatically"}
                  className={`${controlButtonClass} ${
                    autoWalk
                      ? "border-amber-400/70 bg-amber-500/20 text-amber-200"
                      : idleControlClass
                  }`}
                >
                  {autoWalk ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  Auto
                </button>
                <button
                  type="button"
                  onClick={() => onSelectStep(wrapStep(tracedStep + 1))}
                  title="Next step"
                  aria-label="Next step"
                  className={`${controlButtonClass} ${idleControlClass}`}
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onToggleCameraLock}
                  aria-pressed={cameraLock}
                  title="Keep the camera on the signal as it moves"
                  className={`${controlButtonClass} ${
                    cameraLock
                      ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-200"
                      : "border-gray-600 bg-black/60 text-gray-400 hover:text-green-200"
                  }`}
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  Track
                </button>
              </div>
            </>
          )}

          <button
            type="button"
            onClick={onToggleTracing}
            aria-pressed={tracing}
            title="Follow a signal packet step by step through the network"
            className={`${controlButtonClass} font-semibold ${
              tracing
                ? "border-amber-300 bg-amber-400 text-black hover:bg-amber-300"
                : "border-emerald-400/70 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/35"
            }`}
          >
            {tracing ? <Square className="w-3 h-3" /> : <Route className="w-3.5 h-3.5" />}
            {tracing ? "Stop trace" : "Trace signal"}
          </button>
        </div>
      </div>

      {/* The rail itself: 8 step nodes under the damped-prior bypass bracket (step 1 → 6) */}
      <div ref={scrollerRef} className="overflow-x-auto px-3 pt-3 pb-3">
        <div className="relative min-w-[1128px] pt-4">
          <div
            aria-hidden="true"
            className={`absolute top-0 left-[18.75%] right-[18.75%] h-4 rounded-t-md border-t border-x transition-colors ${
              bypassActive ? "border-sky-300" : "border-dashed border-cyan-400/50"
            }`}
          />
          <span
            className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 bg-gray-950 text-[10px] whitespace-nowrap ${
              bypassActive ? "text-sky-200 font-semibold" : "text-cyan-300/90"
            }`}
          >
            damped-velocity prior bypass · τ = {tauMs} ms · 0 params
          </span>

          <ol className="grid grid-cols-8 gap-3">
            {PIPELINE_STEPS.map((s) => {
              const isCurrent = step === s.index;
              const isPassed = tracing && step !== null && s.index < step;
              const isSkipped = bypassActive && s.index >= 2 && s.index <= 5;
              return (
                <li key={s.index} className="relative min-w-0">
                  <button
                    ref={(el) => {
                      nodeRefs.current[s.index] = el;
                    }}
                    type="button"
                    onClick={() => onSelectStep(s.index)}
                    aria-current={isCurrent ? "step" : undefined}
                    title={`Step ${s.index} · ${s.name} — ${s.params}`}
                    className={`w-full text-left rounded-md border px-2 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400/70 ${
                      isCurrent
                        ? "border-green-400 bg-green-500/20 text-green-100"
                        : isPassed
                          ? "border-green-500/40 bg-green-950/60 text-green-300"
                          : "border-green-500/20 bg-black/50 text-green-300/85 hover:border-green-400/60 hover:text-green-200"
                    } ${isSkipped && !isCurrent ? "opacity-50" : ""}`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span
                        className={`w-4 h-4 shrink-0 rounded-sm text-[10px] font-bold inline-flex items-center justify-center ${
                          isCurrent ? "bg-green-400 text-black" : "bg-green-500/15 text-green-300"
                        }`}
                      >
                        {s.index}
                      </span>
                      <span className="font-semibold truncate">{s.label}</span>
                    </span>
                    <span className="block mt-0.5 text-[10px] text-green-500/80 truncate">
                      {s.hint}
                    </span>
                  </button>
                  {s.index < PIPELINE_STEPS.length - 1 && (
                    <ChevronRight
                      aria-hidden="true"
                      className="absolute -right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-green-500/60"
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* Narration for the traced step: what happens here, plus four live readouts */}
      {tracing && detail && (
        <div className="border-t border-green-500/20 px-3 py-2.5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:min-h-[112px]">
          <div className="min-w-0 space-y-1">
            <div className="text-sm font-bold text-green-300 leading-snug">
              Step {tracedStep} · {PIPELINE_STEPS[tracedStep].traceTitle}
            </div>
            <div className="text-[11px] text-cyan-300/95 truncate">{detail.opBadge}</div>
            <p className="font-sans text-xs text-gray-300 leading-relaxed">{detail.explanation}</p>
          </div>

          <div className="hidden lg:grid grid-cols-2 gap-2 content-start">
            {detail.metrics.map((metric) => (
              <div
                key={metric.label}
                className="min-w-0 rounded-md border border-green-500/20 bg-black/70 px-2.5 py-1.5"
              >
                <div className="text-[10px] text-gray-400 truncate">{metric.label}</div>
                <div className={`text-[11px] font-bold truncate tabular-nums ${metric.colorClass}`}>
                  {metric.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
