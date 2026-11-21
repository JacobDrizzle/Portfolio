"use client";

import { ChevronLeft, ChevronRight, Cpu, RotateCcw, SlidersHorizontal } from "lucide-react";
import type { InferenceSnapshot, K8ModelBundle, Quat } from "@/lib/abc-challenge/lean-tcnn-engine";
import AbcLearnedWeights from "./AbcWeightHeatmap";
import type { ClipErrors } from "./abc-model-stats";
import {
  type Pathway,
  type StepIndex,
  PIPELINE_STEPS,
  STAGE_INFO,
  buildOverviewMetrics,
  buildStepLiveDetail,
  stageForStep,
  wrapStep,
} from "./abc-pipeline";

export interface AbcControlPanelProps {
  /** Selected pipeline step, or `null` for the full-graph overview. */
  step: StepIndex | null;
  onSelectStep: (step: StepIndex | null) => void;
  tracing: boolean;
  pathway: Pathway;
  snapshot: InferenceSnapshot | null;
  groundTruthFuture: Quat[] | null;
  gravityEnabled: boolean;
  onToggleGravityEnabled: () => void;
  tiltDeg: number;
  onChangeTiltDeg: (deg: number) => void;
  tauMs: number;
  onChangeTauMs: (tau: number) => void;
  residualScale: number;
  onChangeResidualScale: (scale: number) => void;
  onResetDefaults: () => void;
  /** The trained tensors, drawn in the inspector for the selected step. */
  weights: K8ModelBundle["weights"];
  /** 200 ms error over the whole clip at the current settings; `null` without ground truth. */
  clipErrors: ClipErrors | null;
  /** The same at default settings. */
  baselineClipErrors: ClipErrors | null;
  clipErrorsStale: boolean;
}

/** The 7 input channels, with the sign the mirror stream applies to each. */
const FEATURE_LABELS = [
  { name: "ω_x (nod rate)", sign: "+1", color: "text-cyan-700 dark:text-cyan-400" },
  { name: "ω_y (turn rate)", sign: "−1", color: "text-green-700 dark:text-green-400" },
  { name: "ω_z (tilt rate)", sign: "−1", color: "text-amber-700 dark:text-amber-400" },
  { name: "|ω|₁ (L1 speed)", sign: "+1", color: "text-yellow-700 dark:text-yellow-300" },
  { name: "g_x (up side)", sign: "−1", color: "text-lime-700 dark:text-lime-400" },
  { name: "g_y (up vert)", sign: "+1", color: "text-lime-700 dark:text-lime-400" },
  { name: "g_z (up fwd)", sign: "+1", color: "text-lime-700 dark:text-lime-400" },
];

const CUBIC_TERMS = ["c₁ (k/20)¹", "c₂ (k/20)²", "c₃ (k/20)³"];
const AXES = [0, 1, 2] as const;

const cardClass =
  "bg-green-50/90 dark:bg-green-500/5 border border-green-200 dark:border-green-500/30 rounded-xl";
const headingClass =
  "font-mono text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-green-400";
const columnLabelClass = "font-mono text-xs font-semibold uppercase tracking-wide";
const columnTextClass = "font-sans text-sm leading-relaxed text-gray-700 dark:text-green-300/85";
const stepNavButtonClass =
  "h-7 w-7 inline-flex items-center justify-center rounded border border-green-300 dark:border-green-500/30 text-green-700 dark:text-green-300 hover:bg-green-500/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400/70";

const signed = (value: number, digits: number) =>
  `${value >= 0 ? "+" : ""}${value.toFixed(digits)}`;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

function AblationSlider({
  label,
  display,
  caption,
  min,
  max,
  step,
  value,
  onChange,
  accentClass,
  valueClass,
}: {
  label: string;
  display: string;
  caption: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  accentClass: string;
  valueClass: string;
}) {
  return (
    <label className="block font-mono text-xs">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-gray-900 dark:text-green-200">{label}</span>
        <span className={`font-semibold tabular-nums ${valueClass}`}>{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`mt-1 w-full cursor-pointer ${accentClass}`}
      />
      <span className="block text-[11px] text-gray-500 dark:text-green-500/70">{caption}</span>
    </label>
  );
}

/** Header shared by the three live-tensor cards. */
function TensorCardHeader({ title, steps, shape }: { title: string; steps: string; shape: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-green-200 dark:border-green-500/20 pb-2">
      <span className="flex items-center gap-2 min-w-0">
        <span className="shrink-0 px-1.5 py-0.5 rounded bg-green-500/15 text-[10px] font-semibold uppercase tracking-wide text-green-700 dark:text-green-300">
          {steps}
        </span>
        <span className="font-semibold text-gray-900 dark:text-green-300 truncate">{title}</span>
      </span>
      <span className="shrink-0 text-[11px] text-green-700 dark:text-green-500/80">{shape}</span>
    </div>
  );
}

/**
 * Everything below the viewport frame: the inspector for the selected step, the
 * model ablations, and three cards showing the live tensors of the current frame.
 */
export default function AbcControlPanel({
  step,
  onSelectStep,
  tracing,
  pathway,
  snapshot,
  groundTruthFuture,
  gravityEnabled,
  onToggleGravityEnabled,
  tiltDeg,
  onChangeTiltDeg,
  tauMs,
  onChangeTauMs,
  residualScale,
  onChangeResidualScale,
  onResetDefaults,
  weights,
  clipErrors,
  baselineClipErrors,
  clipErrorsStale,
}: AbcControlPanelProps) {
  const selected = step === null ? null : PIPELINE_STEPS[step];
  const stageInfo = STAGE_INFO[stageForStep(step)];
  const metrics =
    step === null
      ? buildOverviewMetrics(snapshot, groundTruthFuture)
      : buildStepLiveDetail(step, pathway, snapshot, groundTruthFuture).metrics;

  const atDefaults =
    gravityEnabled && tiltDeg === 0 && tauMs === 100 && Math.abs(residualScale - 1) < 1e-6;

  // Change in the model's clip mean against default settings; `null` when nothing is ablated.
  const clipDelta =
    clipErrors && baselineClipErrors && !atDefaults && clipErrors !== baselineClipErrors
      ? // From the two rounded means, so the difference agrees with the numbers on screen.
        Number(clipErrors.mean.k8.toFixed(2)) - Number(baselineClipErrors.mean.k8.toFixed(2))
      : null;

  // Which live-tensor card belongs to the selected step.
  const activeCard =
    step === null ? null : step <= 2 ? "inputs" : step <= 5 ? "blocks" : "readout";
  const tensorCardClass = (card: "inputs" | "blocks" | "readout") =>
    `${cardClass} min-w-0 p-4 space-y-3 transition-shadow ${
      activeCard === card ? "ring-2 ring-green-400/70 dark:ring-green-400/60" : ""
    }`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inspector: what the selected step does, and its live numbers */}
        <section className={`${cardClass} min-w-0 p-5 lg:col-span-2 space-y-4`}>
          <header className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-green-700 dark:text-green-400/80">
                <Cpu className="w-4 h-4" />
                <span className="uppercase tracking-wider">Inspector</span>
                <span className="px-1.5 py-0.5 rounded bg-green-500/15 font-semibold text-green-800 dark:text-green-300">
                  {selected ? `Step ${selected.index}` : "Full graph"}
                </span>
              </div>
              <h3 className="font-mono text-base md:text-lg font-bold leading-snug text-gray-900 dark:text-green-300">
                {selected ? selected.name : stageInfo.title}
              </h3>
              {selected && (
                <div className="font-mono text-xs text-green-700 dark:text-green-400">
                  {selected.op}
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => onSelectStep(wrapStep((step ?? 0) - 1))}
                aria-label="Previous step"
                title="Previous step"
                className={stepNavButtonClass}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onSelectStep(step === null ? 0 : wrapStep(step + 1))}
                aria-label="Next step"
                title="Next step"
                className={stepNavButtonClass}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </header>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="px-2 py-0.5 rounded bg-green-500/15 text-green-800 dark:text-green-300">
              In: {selected ? selected.tensorIn : "context [1, 400, 4]"}
            </span>
            <span aria-hidden="true" className="text-green-600 dark:text-green-500">
              →
            </span>
            <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-800 dark:text-cyan-300">
              Out: {selected ? selected.tensorOut : "prediction [1, 20, 4]"}
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-800 dark:text-amber-300">
              {selected ? selected.params : "7,555 params"}
            </span>
          </div>

          {selected ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-4">
              <div className="space-y-1">
                <div className={`${columnLabelClass} text-green-700 dark:text-green-400`}>
                  What it does
                </div>
                <p className={columnTextClass}>{selected.whatItDoes}</p>
              </div>
              <div className="space-y-1">
                <div className={`${columnLabelClass} text-cyan-700 dark:text-cyan-400`}>
                  Connections
                </div>
                <p className={columnTextClass}>
                  <strong className="font-semibold">In:</strong> {selected.connectionsIn}
                </p>
                <p className={columnTextClass}>
                  <strong className="font-semibold">Out:</strong> {selected.connectionsOut}
                </p>
              </div>
              <div className="space-y-1">
                <div className={`${columnLabelClass} text-amber-700 dark:text-amber-400`}>
                  Why it matters
                </div>
                <p className={columnTextClass}>{selected.whyItMatters}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className={columnTextClass}>{stageInfo.summary}</p>
              <p className="font-mono text-xs text-green-700 dark:text-green-400/80">
                Pick a step on the rail under the viewport, or click any part of the 3D scene, to
                inspect it here.
              </p>
            </div>
          )}

          {/* Live numbers for this frame. While tracing on large screens the rail shows them. */}
          {metrics.length > 0 && (
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg bg-gray-950 border border-green-500/25 p-2 ${
                tracing ? "lg:hidden" : ""
              }`}
            >
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="min-w-0 rounded-md border border-green-500/15 bg-black/60 px-2.5 py-1.5 font-mono"
                >
                  <div className="text-[10px] text-gray-400 truncate">{metric.label}</div>
                  <div
                    className={`text-xs font-bold truncate tabular-nums ${metric.colorClass}`}
                    title={metric.value}
                  >
                    {metric.value}
                  </div>
                  <div className="text-[10px] text-gray-500 truncate">{metric.sub}</div>
                </div>
              ))}
            </div>
          )}

          {/* The trained weights behind this step, or the model's parameter budget */}
          <AbcLearnedWeights step={step} weights={weights} onSelectStep={onSelectStep} />

          <footer className="pt-3 border-t border-green-200 dark:border-green-500/20 space-y-1.5 font-mono text-xs">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              {selected && (
                <span className="text-gray-700 dark:text-green-400/85">{stageInfo.title}</span>
              )}
              <span className="text-[11px] text-gray-500 dark:text-green-500/70">
                {stageInfo.codeRef}
              </span>
            </div>
            <code className="block overflow-x-auto whitespace-nowrap rounded px-2.5 py-1.5 bg-green-100 dark:bg-green-500/15 text-green-800 dark:text-green-300">
              {stageInfo.formula}
            </code>
          </footer>
        </section>

        {/* Model ablations */}
        <section className={`${cardClass} min-w-0 p-5 space-y-4`}>
          <header className="flex items-center justify-between gap-2">
            <h3 className={`${headingClass} flex items-center gap-2`}>
              <SlidersHorizontal className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span>Model ablations</span>
            </h3>
            <button
              type="button"
              onClick={onResetDefaults}
              disabled={atDefaults}
              title="Reset k8 defaults"
              className="px-2.5 py-1 rounded border border-green-300 dark:border-green-500/30 font-mono text-xs text-green-700 dark:text-green-300 inline-flex items-center gap-1 transition-colors hover:bg-green-500/10 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-default"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </header>

          <p className="font-sans text-xs leading-relaxed text-gray-600 dark:text-green-400/75">
            Change the model live. The forecast curves and the 200 ms error in the viewport respond
            on the next frame; the clip mean is re-scored over every frame.
          </p>

          {clipErrors && (
            <div
              className={`rounded-lg border border-green-500/25 bg-gray-950 px-3 py-2 font-mono transition-opacity duration-150 ${
                clipErrorsStale ? "opacity-50" : "opacity-100"
              }`}
            >
              <div className="text-[10px] text-gray-400">Clip mean error at 200 ms · k8</div>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-lg font-bold leading-tight text-gray-100">
                  {clipErrors.mean.k8.toFixed(2)}°
                </span>
                {clipDelta === null ? (
                  <span className="text-[11px] text-gray-500">default settings</span>
                ) : Math.abs(clipDelta) < 0.005 ? (
                  <span className="text-[11px] text-gray-500">same as default</span>
                ) : (
                  <span
                    className={`text-[11px] font-semibold tabular-nums ${
                      clipDelta > 0 ? "text-amber-300" : "text-green-300"
                    }`}
                  >
                    {clipDelta > 0 ? "▲ +" : "▼ −"}
                    {Math.abs(clipDelta).toFixed(2)}° vs default
                  </span>
                )}
              </div>
              <div className="text-[10px] text-gray-500 tabular-nums">
                prior {clipErrors.mean.prior.toFixed(2)}° · hold {clipErrors.mean.hold.toFixed(2)}° ·
                ahead on {clipErrors.framesAhead}/{clipErrors.k8.length} frames
              </div>
            </div>
          )}

          <button
            type="button"
            role="switch"
            aria-checked={gravityEnabled}
            onClick={onToggleGravityEnabled}
            className={`w-full flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left font-mono text-xs transition-colors ${
              gravityEnabled
                ? "border-lime-500/60 bg-lime-500/10"
                : "border-rose-400/60 bg-rose-500/10"
            }`}
          >
            <span className="min-w-0">
              <span className="block font-semibold text-gray-900 dark:text-green-200">
                Gravity R(q)ᵀy
              </span>
              <span
                className={`block text-[11px] ${
                  gravityEnabled
                    ? "text-lime-700 dark:text-lime-300"
                    : "text-rose-700 dark:text-rose-300"
                }`}
              >
                {gravityEnabled ? "ON (+0.047°)" : "ABLATED (0)"}
              </span>
            </span>
            <span
              aria-hidden="true"
              className={`relative shrink-0 w-9 h-5 rounded-full transition-colors ${
                gravityEnabled ? "bg-lime-500" : "bg-gray-400 dark:bg-gray-600"
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                  gravityEnabled ? "left-[18px]" : "left-0.5"
                }`}
              />
            </span>
          </button>

          <AblationSlider
            label="World tilt aug"
            display={`${tiltDeg > 0 ? "+" : ""}${tiltDeg}°`}
            caption="Moves only R(q)ᵀy (±15° train aug)"
            min={-15}
            max={15}
            step={1}
            value={tiltDeg}
            onChange={onChangeTiltDeg}
            accentClass="accent-lime-400"
            valueClass="text-lime-700 dark:text-lime-300"
          />
          <AblationSlider
            label="Prior decay τ"
            display={`${tauMs} ms`}
            caption="k8_combined default: τ = 100 ms"
            min={20}
            max={300}
            step={10}
            value={tauMs}
            onChange={onChangeTauMs}
            accentClass="accent-cyan-400"
            valueClass="text-cyan-700 dark:text-cyan-300"
          />
          <AblationSlider
            label="TCN residual"
            display={`${(residualScale * 100).toFixed(0)}%`}
            caption="0% = pure damped prior; 100% = k8"
            min={0}
            max={1.5}
            step={0.05}
            value={residualScale}
            onChange={onChangeResidualScale}
            accentClass="accent-green-500"
            valueClass="text-green-700 dark:text-green-300"
          />
        </section>
      </div>

      {/* Live tensors of the current frame; the card for the selected step is ringed */}
      {snapshot && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-mono text-xs">
          <section className={tensorCardClass("inputs")}>
            <TensorCardHeader title="Inputs & mirror signs" steps="Steps 1–2" shape="[1, 7, 2, 1]" />
            <div>
              <div className="grid grid-cols-12 pb-1 text-[10px] uppercase tracking-wide text-gray-500 dark:text-green-500/70">
                <span className="col-span-5">Channel</span>
                <span className="col-span-2 text-center">Sign</span>
                <span className="col-span-5 text-right">Direct → mirror</span>
              </div>
              {FEATURE_LABELS.map((item, idx) => {
                const v0 = snapshot.inputFeatures0[idx] ?? 0;
                const v1 = snapshot.inputFeatures1[idx] ?? 0;
                return (
                  <div
                    key={item.name}
                    className="grid grid-cols-12 items-center py-1 border-t border-green-500/10"
                  >
                    <span className={`col-span-5 truncate ${item.color}`}>{item.name}</span>
                    <span className="col-span-2 text-center">
                      <span className="px-1 rounded bg-green-500/10 text-green-700 dark:text-green-300">
                        ×{item.sign}
                      </span>
                    </span>
                    <span className="col-span-5 text-right tabular-nums text-gray-800 dark:text-green-200">
                      {signed(v0, 2)} →{" "}
                      <span className="text-cyan-700 dark:text-cyan-300">{signed(v1, 2)}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className={tensorCardClass("blocks")}>
            <TensorCardHeader title="Separable blocks" steps="Steps 3–5" shape="RF 393 / 400" />
            <div className="space-y-2.5">
              {snapshot.blocks.map((blk) => {
                const total = blk.ownStreamNorm0 + blk.crossStreamNorm0 + 1e-9;
                const ownPct = Math.round((blk.ownStreamNorm0 / total) * 100);
                const crossPct = 100 - ownPct;
                const isActive = step === blk.index + 3;
                return (
                  <div
                    key={blk.index}
                    className={`p-2.5 rounded-lg border space-y-1.5 transition-colors ${
                      isActive
                        ? "bg-green-500/15 border-green-400"
                        : "bg-white/80 dark:bg-black/60 border-green-200 dark:border-green-500/20"
                    }`}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-semibold text-green-700 dark:text-green-300">
                        Block {blk.index} (k={blk.kernelSize}, d={blk.dilation})
                      </span>
                      <span className="text-[11px] text-amber-700 dark:text-amber-300">
                        RF {blk.receptiveFieldCumulative} steps
                      </span>
                    </div>
                    <div className="flex justify-between gap-2 text-[11px] tabular-nums text-gray-600 dark:text-green-400/80">
                      <span>Own ‖A·h₀‖ {blk.ownStreamNorm0.toFixed(2)}</span>
                      <span className="text-cyan-700 dark:text-cyan-300">
                        Mirror ‖B·h₁‖ {blk.crossStreamNorm0.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-cyan-500/30 overflow-hidden flex">
                      <div
                        className="bg-green-500 h-full transition-all duration-150"
                        style={{ width: `${ownPct}%` }}
                        title={`Own stream A: ${ownPct}%`}
                      />
                      <div
                        className="bg-cyan-400 h-full transition-all duration-150"
                        style={{ width: `${crossPct}%` }}
                        title={`Cross stream B: ${crossPct}%`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className={`${tensorCardClass("readout")} md:col-span-2 lg:col-span-1`}>
            <TensorCardHeader title="Cubic readout (P = 3)" steps="Steps 6–7" shape="[1, 20, 3]" />
            <table className="w-full text-left text-[11px] tabular-nums">
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-green-500/70">
                  <th className="pb-1 font-normal">Term</th>
                  <th className="pb-1 font-semibold text-cyan-700 dark:text-cyan-400">Nod (x)</th>
                  <th className="pb-1 font-semibold text-green-700 dark:text-green-400">Turn (y)</th>
                  <th className="pb-1 font-semibold text-amber-700 dark:text-amber-400">Tilt (z)</th>
                </tr>
              </thead>
              <tbody className="text-gray-800 dark:text-green-200">
                {CUBIC_TERMS.map((label, j) => (
                  <tr key={label} className="border-t border-green-500/10">
                    <td className="py-1.5 font-semibold">{label}</td>
                    {AXES.map((axis) => (
                      <td key={axis} className="py-1.5">
                        {signed(toDeg(snapshot.readout.coefficients[j][axis]), 2)}°
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t border-green-500/10">
                  <td className="py-1.5 text-gray-500 dark:text-green-500/70">Prior @ 200 ms</td>
                  {AXES.map((axis) => (
                    <td key={axis} className="py-1.5 text-cyan-700 dark:text-cyan-300">
                      {signed(toDeg(snapshot.horizonSteps[19]?.priorRotVec[axis] ?? 0), 1)}°
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-green-500/30 font-bold text-green-700 dark:text-green-300">
                  <td className="py-1.5">Total r₂₀</td>
                  {AXES.map((axis) => (
                    <td key={axis} className="py-1.5">
                      {signed(toDeg(snapshot.horizonSteps[19]?.combinedRotVec[axis] ?? 0), 1)}°
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </section>
        </div>
      )}
    </div>
  );
}
