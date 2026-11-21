"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { K8ModelBundle } from "@/lib/abc-challenge/lean-tcnn-engine";
import type { StepIndex } from "./abc-pipeline";
import { computeParamBudget, weightViewsForStep, type WeightView } from "./abc-model-stats";

// Diverging scale on a dark surface: cool pole for negative weights, warm pole for
// positive, and the surface itself at zero so a weight near zero reads as nothing.
const NEGATIVE: [number, number, number] = [34, 211, 238];
const POSITIVE: [number, number, number] = [245, 158, 11];
const ZERO: [number, number, number] = [5, 8, 7];

function weightColor(value: number, maxAbs: number): [number, number, number] {
  const t = Math.pow(Math.min(1, Math.abs(value) / maxAbs), 0.75);
  const pole = value < 0 ? NEGATIVE : POSITIVE;
  return [
    ZERO[0] + (pole[0] - ZERO[0]) * t,
    ZERO[1] + (pole[1] - ZERO[1]) * t,
    ZERO[2] + (pole[2] - ZERO[2]) * t,
  ];
}

const rgb = (c: [number, number, number]) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
const SCALE_GRADIENT = `linear-gradient(to right, ${rgb(NEGATIVE)}, ${rgb(
  weightColor(-0.5, 1),
)}, ${rgb(ZERO)}, ${rgb(weightColor(0.5, 1))}, ${rgb(POSITIVE)})`;

const signedWeight = (value: number) => `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(3)}`;

/** One trained tensor as a grid of cells, one cell per weight. */
function WeightHeatmap({ view }: { view: WeightView }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cell, setCell] = useState<{ row: number; col: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    canvas.width = view.cols;
    canvas.height = view.rows;
    const image = ctx.createImageData(view.cols, view.rows);
    for (let i = 0; i < view.rows * view.cols; i++) {
      const [r, g, b] = weightColor(view.values[i], view.maxAbs);
      image.data[i * 4] = r;
      image.data[i * 4 + 1] = g;
      image.data[i * 4 + 2] = b;
      image.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
  }, [view]);

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const col = Math.floor(((e.clientX - rect.left) / Math.max(1, rect.width)) * view.cols);
    const row = Math.floor(((e.clientY - rect.top) / Math.max(1, rect.height)) * view.rows);
    setCell({
      row: Math.max(0, Math.min(view.rows - 1, row)),
      col: Math.max(0, Math.min(view.cols - 1, col)),
    });
  };

  const width = view.cols * view.cellPx;
  const hovered = cell ? view.values[cell.row * view.cols + cell.col] : null;

  return (
    <figure className="min-w-0 space-y-1.5" style={{ width: `min(100%, ${width}px)` }}>
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="font-semibold text-gray-100">{view.title}</span>
        <span className="shrink-0 text-[10px] text-gray-500 tabular-nums">{view.shape}</span>
      </figcaption>

      {view.halves && (
        <div className="grid grid-cols-2 text-center text-[10px] text-gray-400">
          <span>{view.halves[0]}</span>
          <span>{view.halves[1]}</span>
        </div>
      )}

      <div
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setCell(null)}
        className="relative w-full cursor-crosshair overflow-hidden rounded-sm ring-1 ring-white/10"
        style={{ aspectRatio: `${view.cols} / ${view.rows}` }}
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`${view.title}, ${view.shape} trained weights. ${view.caption}`}
          className="block h-full w-full"
          style={{ imageRendering: "pixelated" }}
        />
        {view.halves && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-white/45"
          />
        )}
        {cell && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute outline outline-1 outline-white"
            style={{
              left: `${(cell.col / view.cols) * 100}%`,
              top: `${(cell.row / view.rows) * 100}%`,
              width: `${100 / view.cols}%`,
              height: `${100 / view.rows}%`,
            }}
          />
        )}
      </div>

      {/* Hover readout, or what the two axes are when nothing is hovered */}
      <div className="min-h-[28px] text-[10px] leading-[14px] text-gray-400">
        {cell && hovered !== null ? (
          <>
            <span className="font-semibold text-gray-100 tabular-nums">w = {signedWeight(hovered)}</span>
            <span className="block truncate">
              {view.rowLabel(cell.row)} · {view.colLabel(cell.col)}
            </span>
          </>
        ) : (
          <>
            <span className="block truncate">Rows: {view.rowsAxis}</span>
            <span className="block truncate">Columns: {view.colsAxis}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-[10px] text-gray-500 tabular-nums">
        <span>−{view.maxAbs.toFixed(2)}</span>
        <span
          aria-hidden="true"
          className="h-1.5 w-20 rounded-full"
          style={{ background: SCALE_GRADIENT }}
        />
        <span>+{view.maxAbs.toFixed(2)}</span>
      </div>

      <p className="font-sans text-[11px] leading-snug text-gray-300">{view.caption}</p>
    </figure>
  );
}

/** Where the trained parameters live: one whole, split by pipeline step. */
function ParamBudgetBar({
  weights,
  onSelectStep,
}: {
  weights: K8ModelBundle["weights"];
  onSelectStep: (step: StepIndex) => void;
}) {
  const parts = useMemo(() => computeParamBudget(weights), [weights]);
  const total = parts.reduce((sum, part) => sum + part.params, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-semibold text-gray-100">Parameter budget</span>
        <span className="text-[10px] text-gray-500 tabular-nums">
          {total.toLocaleString("en-US")} trained weights and biases
        </span>
      </div>

      <div className="flex h-7 gap-0.5">
        {parts.map((part) => {
          const share = part.params / total;
          return (
            <button
              key={part.step}
              type="button"
              onClick={() => onSelectStep(part.step)}
              title={`Step ${part.step} · ${part.label}: ${part.params.toLocaleString("en-US")} parameters (${(
                share * 100
              ).toFixed(1)}%). Click to inspect its weights.`}
              aria-label={`Step ${part.step}, ${part.label}: ${part.params.toLocaleString(
                "en-US",
              )} parameters, ${(share * 100).toFixed(1)} percent. Inspect its weights.`}
              className="h-full min-w-[6px] rounded px-1.5 text-left text-[11px] font-semibold text-gray-950 tabular-nums transition-[filter] hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              style={{ flex: `${part.params} 1 0%`, backgroundColor: part.color }}
            >
              {share >= 0.1 ? part.params.toLocaleString("en-US") : ""}
            </button>
          );
        })}
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-300">
        {parts.map((part) => (
          <li key={part.step} className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-sm"
              style={{ backgroundColor: part.color }}
            />
            <span>
              Step {part.step} · {part.label}
            </span>
            {part.params / total < 0.1 && (
              <span className="text-gray-100 tabular-nums">{part.params.toLocaleString("en-US")}</span>
            )}
          </li>
        ))}
      </ul>

      <p className="font-sans text-[11px] leading-snug text-gray-300">
        Steps 0, 1 and 7 learn nothing: pose input, the 7 geometric features and the Cayley map are
        fixed. Click a part to see its weights.
      </p>
    </div>
  );
}

export interface AbcLearnedWeightsProps {
  /** Selected pipeline step, or `null` for the full-graph overview. */
  step: StepIndex | null;
  weights: K8ModelBundle["weights"];
  onSelectStep: (step: StepIndex) => void;
}

/**
 * The trained weights behind the selected step, drawn in full, or the parameter
 * budget of the whole model on the overview. Always on a dark strip, so the colour
 * scale reads the same in both themes.
 */
export default function AbcLearnedWeights({ step, weights, onSelectStep }: AbcLearnedWeightsProps) {
  const stepWeights = useMemo(
    () => (step === null ? null : weightViewsForStep(step, weights)),
    [step, weights],
  );

  return (
    <div className="space-y-3 rounded-lg border border-green-500/25 bg-gray-950 p-3 font-mono text-xs">
      {stepWeights === null ? (
        <ParamBudgetBar weights={weights} onSelectStep={onSelectStep} />
      ) : (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-green-400">
              Learned weights
            </span>
            <span className="text-[10px] text-gray-500">
              {stepWeights.views.length > 0
                ? `${stepWeights.paramCount.toLocaleString("en-US")} parameters, shared by both streams · ${stepWeights.extras}`
                : "0 parameters"}
            </span>
          </div>

          {stepWeights.views.length > 0 ? (
            <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
              {stepWeights.views.map((view) => (
                <WeightHeatmap key={view.id} view={view} />
              ))}
            </div>
          ) : (
            <p className="font-sans text-xs leading-relaxed text-gray-300">{stepWeights.emptyNote}</p>
          )}
        </>
      )}
    </div>
  );
}
