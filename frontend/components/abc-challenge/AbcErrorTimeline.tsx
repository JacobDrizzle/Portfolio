"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { SERIES_COLORS, type ClipErrors } from "./abc-model-stats";

const HEIGHT = 52;
const PAD_TOP = 5;
const PAD_BOTTOM = 3;
// Half the width of a native range thumb: the first and last frame line up with the
// centre of the scrubber thumb underneath.
const THUMB_INSET = 8;
const SURFACE = "#050807";

/** Round an axis maximum up to a clean number of degrees. */
function niceCeil(value: number): number {
  if (value <= 2) return 2;
  if (value <= 5) return 5;
  if (value <= 10) return 10;
  if (value <= 20) return Math.ceil(value / 2) * 2;
  return Math.ceil(value / 5) * 5;
}

function SeriesKey({ color }: { color: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-0.5 w-3 shrink-0 rounded-full align-middle"
      style={{ backgroundColor: color }}
    />
  );
}

export interface AbcErrorTimelineProps {
  errors: ClipErrors;
  /** Default-settings errors; keeps the vertical scale steady while ablating. */
  baseline: ClipErrors | null;
  frameIndex: number;
  onScrubFrame: (frame: number) => void;
  /** The numbers are from the previous slider position and are being recomputed. */
  stale: boolean;
}

/**
 * The 200 ms error of the model, the damped prior and hold-last on every frame of
 * the clip, drawn over the scrubber so the playhead and the thumb share one x axis.
 */
export default function AbcErrorTimeline({
  errors,
  baseline,
  frameIndex,
  onScrubFrame,
  stale,
}: AbcErrorTimelineProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hoverFrame, setHoverFrame] = useState<number | null>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setWidth(Math.round(entries[0].contentRect.width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const frames = errors.k8.length;
  const yMax = useMemo(() => {
    let max = 0;
    for (const series of [errors.k8, errors.prior, errors.hold]) {
      for (const v of series) max = Math.max(max, v);
    }
    if (baseline) {
      for (const series of [baseline.k8, baseline.prior, baseline.hold]) {
        for (const v of series) max = Math.max(max, v);
      }
    }
    return niceCeil(max);
  }, [errors, baseline]);

  const geometry = useMemo(() => {
    if (width <= 2 * THUMB_INSET || frames < 2) return null;
    const plotW = width - 2 * THUMB_INSET;
    const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;
    const x = (f: number) => THUMB_INSET + (f / (frames - 1)) * plotW;
    const y = (deg: number) => HEIGHT - PAD_BOTTOM - (Math.min(deg, yMax) / yMax) * plotH;
    const line = (series: number[]) =>
      series.map((v, f) => `${f === 0 ? "M" : "L"}${x(f).toFixed(1)},${y(v).toFixed(1)}`).join("");

    // Band between the model and the prior, split at every crossing so each piece
    // is wholly "model ahead" or wholly "model behind".
    let ahead = "";
    let behind = "";
    const quad = (
      xa: number,
      k8a: number,
      priorA: number,
      xb: number,
      k8b: number,
      priorB: number,
    ) =>
      `M${xa.toFixed(1)},${y(k8a).toFixed(1)}L${xb.toFixed(1)},${y(k8b).toFixed(1)}L${xb.toFixed(
        1,
      )},${y(priorB).toFixed(1)}L${xa.toFixed(1)},${y(priorA).toFixed(1)}Z`;
    for (let f = 0; f < frames - 1; f++) {
      const dA = errors.prior[f] - errors.k8[f];
      const dB = errors.prior[f + 1] - errors.k8[f + 1];
      const xa = x(f);
      const xb = x(f + 1);
      if (dA * dB >= 0) {
        const piece = quad(xa, errors.k8[f], errors.prior[f], xb, errors.k8[f + 1], errors.prior[f + 1]);
        if (dA + dB >= 0) ahead += piece;
        else behind += piece;
      } else {
        const t = dA / (dA - dB);
        const xm = xa + (xb - xa) * t;
        const vm = errors.k8[f] + (errors.k8[f + 1] - errors.k8[f]) * t;
        const first = quad(xa, errors.k8[f], errors.prior[f], xm, vm, vm);
        const second = quad(xm, vm, vm, xb, errors.k8[f + 1], errors.prior[f + 1]);
        if (dA > 0) {
          ahead += first;
          behind += second;
        } else {
          behind += first;
          ahead += second;
        }
      }
    }

    return {
      x,
      y,
      ahead,
      behind,
      k8: line(errors.k8),
      prior: line(errors.prior),
      hold: line(errors.hold),
    };
  }, [errors, frames, width, yMax]);

  const frameAt = (clientX: number) => {
    const el = wrapRef.current;
    if (!el || frames < 2) return 0;
    const rect = el.getBoundingClientRect();
    const t = (clientX - rect.left - THUMB_INSET) / Math.max(1, rect.width - 2 * THUMB_INSET);
    return Math.max(0, Math.min(frames - 1, Math.round(t * (frames - 1))));
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const frame = frameAt(e.clientX);
    setHoverFrame(frame);
    onScrubFrame(frame);
  };
  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const frame = frameAt(e.clientX);
    setHoverFrame(frame);
    if (draggingRef.current) onScrubFrame(frame);
  };
  const handlePointerEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (e.type !== "pointerup" || e.pointerType !== "mouse") setHoverFrame(null);
  };

  const playhead = Math.max(0, Math.min(frames - 1, frameIndex));
  const hover = hoverFrame !== null && hoverFrame < frames ? hoverFrame : null;
  const tooltipLeft =
    geometry && hover !== null ? Math.max(66, Math.min(width - 66, geometry.x(hover))) : 0;

  return (
    <div
      ref={wrapRef}
      role="img"
      aria-label={`200 ms forecast error on each of the ${frames} frames of this clip. Clip mean: model ${errors.mean.k8.toFixed(
        2,
      )} degrees, damped prior ${errors.mean.prior.toFixed(2)} degrees, hold-last ${errors.mean.hold.toFixed(
        2,
      )} degrees. The model is ahead of the prior on ${errors.framesAhead} frames.`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onPointerLeave={() => {
        if (!draggingRef.current) setHoverFrame(null);
      }}
      className="relative w-full cursor-pointer touch-none select-none rounded bg-white/[0.03]"
      style={{ height: HEIGHT }}
    >
      {geometry && (
        <svg
          width={width}
          height={HEIGHT}
          aria-hidden="true"
          className={`block transition-opacity duration-150 ${stale ? "opacity-50" : "opacity-100"}`}
        >
          <line
            x1={0}
            x2={width}
            y1={HEIGHT - PAD_BOTTOM + 0.5}
            y2={HEIGHT - PAD_BOTTOM + 0.5}
            stroke="#1f2937"
            strokeWidth={1}
          />
          <path d={geometry.ahead} fill={SERIES_COLORS.k8} fillOpacity={0.16} />
          <path d={geometry.behind} fill="#f59e0b" fillOpacity={0.24} />
          <path
            d={geometry.hold}
            fill="none"
            stroke={SERIES_COLORS.hold}
            strokeWidth={1.25}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d={geometry.prior}
            fill="none"
            stroke={SERIES_COLORS.prior}
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d={geometry.k8}
            fill="none"
            stroke={SERIES_COLORS.k8}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {hover !== null && hover !== playhead && (
            <line
              x1={geometry.x(hover)}
              x2={geometry.x(hover)}
              y1={0}
              y2={HEIGHT}
              stroke="#9ca3af"
              strokeOpacity={0.55}
              strokeWidth={1}
            />
          )}

          <line
            x1={geometry.x(playhead)}
            x2={geometry.x(playhead)}
            y1={0}
            y2={HEIGHT}
            stroke="#f9fafb"
            strokeOpacity={0.8}
            strokeWidth={1}
          />
          <circle
            cx={geometry.x(playhead)}
            cy={geometry.y(errors.prior[playhead])}
            r={3.5}
            fill={SERIES_COLORS.prior}
            stroke={SURFACE}
            strokeWidth={1.5}
          />
          <circle
            cx={geometry.x(playhead)}
            cy={geometry.y(errors.k8[playhead])}
            r={3.5}
            fill={SERIES_COLORS.k8}
            stroke={SURFACE}
            strokeWidth={1.5}
          />
        </svg>
      )}

      <span className="pointer-events-none absolute left-1.5 top-0.5 text-[9px] leading-none text-gray-500 tabular-nums">
        {yMax}°
      </span>

      {geometry && hover !== null && (
        <div
          className="pointer-events-none absolute bottom-full z-30 mb-1.5 w-32 -translate-x-1/2 rounded-md border border-green-500/30 bg-black/95 px-2 py-1.5 font-mono text-[11px] shadow-lg shadow-black/60"
          style={{ left: tooltipLeft }}
        >
          <div className="mb-1 text-[10px] text-gray-400">
            +{hover * 10} ms · frame {hover + 1}
          </div>
          {(
            [
              ["k8", errors.k8[hover], SERIES_COLORS.k8],
              ["prior", errors.prior[hover], SERIES_COLORS.prior],
              ["hold", errors.hold[hover], SERIES_COLORS.hold],
            ] as const
          ).map(([name, value, color]) => (
            <div key={name} className="flex items-center gap-1.5">
              <SeriesKey color={color} />
              <span className="font-semibold text-gray-100 tabular-nums">{value.toFixed(2)}°</span>
              <span className="text-gray-400">{name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** One-line legend and clip means for the timeline. */
export function ClipErrorReadout({
  errors,
  baseline,
  stale,
  className = "",
}: {
  errors: ClipErrors;
  baseline: ClipErrors | null;
  stale: boolean;
  className?: string;
}) {
  // Taken from the two rounded means, so the difference agrees with the numbers on screen.
  const delta = baseline ? Number(errors.mean.k8.toFixed(2)) - Number(baseline.mean.k8.toFixed(2)) : 0;
  const showDelta = !!baseline && baseline !== errors && Math.abs(delta) >= 0.005;
  const frames = errors.k8.length;

  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-300 transition-opacity duration-150 ${
        stale ? "opacity-50" : "opacity-100"
      } ${className}`}
    >
      <span className="text-gray-500">Clip mean · 200 ms error</span>
      {(
        [
          ["k8", errors.mean.k8, SERIES_COLORS.k8],
          ["prior", errors.mean.prior, SERIES_COLORS.prior],
          ["hold", errors.mean.hold, SERIES_COLORS.hold],
        ] as const
      ).map(([name, value, color]) => (
        <span key={name} className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <SeriesKey color={color} />
          <span>{name}</span>
          <span className="font-semibold text-gray-100 tabular-nums">{value.toFixed(2)}°</span>
          {name === "k8" && showDelta && (
            <span
              className={`tabular-nums ${delta > 0 ? "text-amber-300" : "text-green-300"}`}
              title="Change in the model's clip mean against the default settings"
            >
              ({delta > 0 ? "+" : "−"}
              {Math.abs(delta).toFixed(2)}° vs default)
            </span>
          )}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
        <span
          aria-hidden="true"
          className="inline-block h-2 w-3 rounded-sm"
          style={{ backgroundColor: SERIES_COLORS.k8, opacity: 0.35 }}
        />
        <span>
          model ahead on{" "}
          <span className="font-semibold text-gray-100 tabular-nums">
            {errors.framesAhead}/{frames}
          </span>{" "}
          frames
        </span>
      </span>
    </div>
  );
}
