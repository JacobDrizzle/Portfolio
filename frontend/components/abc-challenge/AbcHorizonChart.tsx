"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { SERIES_COLORS, type HorizonErrors } from "./abc-model-stats";

const WIDTH = 176;
const HEIGHT = 60;
const LEFT = 2;
const RIGHT = 6;
const TOP = 6;
const BASELINE = 46;
const SURFACE = "#050807";

function niceCeil(value: number): number {
  if (value <= 2) return 2;
  if (value <= 5) return 5;
  if (value <= 10) return 10;
  return Math.ceil(value / 5) * 5;
}

export interface AbcHorizonChartProps {
  errors: HorizonErrors;
  /** Horizon step (0-based, 19 = 200 ms) the rows above the chart are reading. */
  activeStep: number;
  /** Hovering picks a horizon; `null` returns to the 200 ms endpoint. */
  onHoverStep: (step: number | null) => void;
}

/**
 * How the forecast error grows over the 200 ms horizon on the current frame.
 * The scoreboard rows above act as legend and readout: the dots mark the
 * horizon those rows are showing.
 */
export default function AbcHorizonChart({ errors, activeStep, onHoverStep }: AbcHorizonChartProps) {
  const steps = errors.k8.length;
  if (steps < 2) return null;

  let max = 0;
  for (const series of [errors.k8, errors.prior, errors.hold]) {
    for (const v of series) max = Math.max(max, v);
  }
  const yMax = niceCeil(max);
  const plotW = WIDTH - LEFT - RIGHT;
  const x = (step: number) => LEFT + ((step + 1) / steps) * plotW; // step 0 is 10 ms
  const y = (deg: number) => BASELINE - (Math.min(deg, yMax) / yMax) * (BASELINE - TOP);
  // Every forecast starts from the observed pose, so each line starts at zero error.
  const line = (series: number[]) =>
    `M${LEFT},${BASELINE}` + series.map((v, i) => `L${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");

  const active = Math.max(0, Math.min(steps - 1, activeStep));
  const hovering = active !== steps - 1;

  const handlePointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / Math.max(1, rect.width)) * WIDTH;
    const step = Math.round(((px - LEFT) / plotW) * steps) - 1;
    onHoverStep(Math.max(0, Math.min(steps - 1, step)));
  };

  const series = [
    { key: "hold", values: errors.hold, color: SERIES_COLORS.hold, width: 1.25 },
    { key: "prior", values: errors.prior, color: SERIES_COLORS.prior, width: 1.5 },
    { key: "k8", values: errors.k8, color: SERIES_COLORS.k8, width: 2 },
  ];

  return (
    <svg
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={`Forecast error against horizon, 10 to 200 milliseconds. At 200 milliseconds: model ${errors.k8[
        steps - 1
      ].toFixed(2)} degrees, damped prior ${errors.prior[steps - 1].toFixed(2)} degrees, hold-last ${errors.hold[
        steps - 1
      ].toFixed(2)} degrees.`}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => onHoverStep(null)}
      className="pointer-events-auto block max-w-full cursor-crosshair touch-none"
    >
      <line x1={LEFT} x2={WIDTH - RIGHT} y1={BASELINE + 0.5} y2={BASELINE + 0.5} stroke="#1f2937" />
      <line x1={LEFT} x2={WIDTH - RIGHT} y1={TOP + 0.5} y2={TOP + 0.5} stroke="#111827" />

      {hovering && (
        <line
          x1={x(active)}
          x2={x(active)}
          y1={TOP}
          y2={BASELINE}
          stroke="#9ca3af"
          strokeOpacity={0.6}
          strokeWidth={1}
        />
      )}

      {series.map((s) => (
        <path
          key={s.key}
          d={line(s.values)}
          fill="none"
          stroke={s.color}
          strokeWidth={s.width}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
      {series.map((s) => (
        <circle
          key={s.key}
          cx={x(active)}
          cy={y(s.values[active])}
          r={3.5}
          fill={s.color}
          stroke={SURFACE}
          strokeWidth={1.5}
        />
      ))}

      <text x={LEFT + 2} y={TOP + 9} fontSize={9} fill="#6b7280">
        {yMax}°
      </text>
      <text x={LEFT} y={HEIGHT - 3} fontSize={9} fill="#6b7280">
        0
      </text>
      <text x={LEFT + plotW / 2} y={HEIGHT - 3} fontSize={9} fill="#6b7280" textAnchor="middle">
        100
      </text>
      <text x={WIDTH - RIGHT} y={HEIGHT - 3} fontSize={9} fill="#6b7280" textAnchor="end">
        200 ms
      </text>
    </svg>
  );
}
