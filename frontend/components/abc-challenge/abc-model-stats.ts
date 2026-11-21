import {
  geodesicAngleDeg,
  normalizeQ,
  qmul,
  worldTiltQuaternion,
  type InferenceOptions,
  type InferenceSnapshot,
  type K8ModelBundle,
  type LeanTCNNEngine,
  type Quat,
  type ValidationClip,
} from "@/lib/abc-challenge/lean-tcnn-engine";
import type { StepIndex } from "./abc-pipeline";

type ModelWeights = K8ModelBundle["weights"];

/** Series colours shared by the HUD, the 3D curves and the charts. */
export const SERIES_COLORS = {
  k8: "#4ade80",
  prior: "#22d3ee",
  hold: "#6b7280",
} as const;

// ---------------------------------------------------------------------------
// Forecast error against ground truth
// ---------------------------------------------------------------------------

/**
 * Rotate recorded poses into the tilted world frame the model is fed when the
 * world-tilt ablation is on. Error is only meaningful with both sides in one frame.
 */
export function tiltPoses(poses: Quat[], tiltDeg: number, tiltHeadingDeg: number): Quat[] {
  if (Math.abs(tiltDeg) < 1e-7) return poses;
  const tilt = worldTiltQuaternion(tiltDeg, tiltHeadingDeg);
  return poses.map((q) => normalizeQ(qmul(tilt, normalizeQ(q))));
}

export interface HorizonErrors {
  /** Geodesic error in degrees at each of the 20 horizon steps (10 ms .. 200 ms). */
  k8: number[];
  prior: number[];
  hold: number[];
}

/** Error of each forecast at every horizon step of the current frame. */
export function computeHorizonErrors(
  snapshot: InferenceSnapshot,
  groundTruthFuture: Quat[],
): HorizonErrors {
  const steps = Math.min(groundTruthFuture.length, snapshot.trajectories.k8Combined.length);
  const k8: number[] = [];
  const prior: number[] = [];
  const hold: number[] = [];
  for (let i = 0; i < steps; i++) {
    k8.push(geodesicAngleDeg(snapshot.trajectories.k8Combined[i], groundTruthFuture[i]));
    prior.push(geodesicAngleDeg(snapshot.trajectories.dampedPrior[i], groundTruthFuture[i]));
    hold.push(geodesicAngleDeg(snapshot.trajectories.holdLast[i], groundTruthFuture[i]));
  }
  return { k8, prior, hold };
}

export interface ClipErrors {
  clipId: string;
  /** 200 ms geodesic error per playback frame, in degrees. */
  k8: number[];
  prior: number[];
  hold: number[];
  mean: { k8: number; prior: number; hold: number };
  /** Frames on which the model's error is below the prior's. */
  framesAhead: number;
}

const meanOf = (values: number[]) =>
  values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;

/** Score the model and both baselines at the last horizon step on every playback frame of a clip. */
export function computeClipErrors(
  engine: LeanTCNNEngine,
  clip: ValidationClip,
  options: InferenceOptions = {},
): ClipErrors {
  const context = clip.contextLength;
  const last = clip.horizon - 1;
  const quats = tiltPoses(clip.quaternions, options.tiltDeg ?? 0, options.tiltHeadingDeg ?? 0);
  // The poses above are already tilted, so the engine must not tilt them again.
  const engineOptions: InferenceOptions = { ...options, tiltDeg: 0 };

  const k8: number[] = [];
  const prior: number[] = [];
  const hold: number[] = [];
  let framesAhead = 0;

  for (let f = 0; f < clip.playbackFrames; f++) {
    const target = quats[f + context + last];
    if (!target) break;
    const out = engine.forecast(quats.slice(f, f + context), engineOptions);
    const eK8 = geodesicAngleDeg(out.k8Combined[last], target);
    const ePrior = geodesicAngleDeg(out.dampedPrior[last], target);
    k8.push(eK8);
    prior.push(ePrior);
    hold.push(geodesicAngleDeg(out.holdLast[last], target));
    if (eK8 < ePrior) framesAhead++;
  }

  return {
    clipId: clip.id,
    k8,
    prior,
    hold,
    mean: { k8: meanOf(k8), prior: meanOf(prior), hold: meanOf(hold) },
    framesAhead,
  };
}

// ---------------------------------------------------------------------------
// Learned weights
// ---------------------------------------------------------------------------

export interface TapProfile {
  /** Mean |w| over the 32 channels for each kernel tap, oldest tap first. */
  meanAbs: number[];
  /** The same, divided by the largest tap. */
  normalised: number[];
}

/** How strongly each block's depthwise kernel weighs its 8 taps. */
export function computeTapProfiles(weights: ModelWeights): TapProfile[] {
  return weights.blocks.map((block) => {
    const k = block.kernel_size;
    const data = block.depthwise_weight.data;
    const channels = Math.floor(data.length / k);
    const meanAbs = new Array<number>(k).fill(0);
    for (let c = 0; c < channels; c++) {
      for (let m = 0; m < k; m++) meanAbs[m] += Math.abs(data[c * k + m]) / channels;
    }
    const peak = Math.max(1e-9, ...meanAbs);
    return { meanAbs, normalised: meanAbs.map((v) => v / peak) };
  });
}

export interface ParamBudgetPart {
  step: StepIndex;
  label: string;
  params: number;
  color: string;
}

/** Where the trained parameters live, in pipeline order. */
export function computeParamBudget(weights: ModelWeights): ParamBudgetPart[] {
  const blockColors = ["#4ade80", "#22d3ee", "#c084fc"];
  return [
    {
      step: 2,
      label: "Projection",
      params: weights.projection_weight.data.length + weights.projection_bias.data.length,
      color: "#94a3b8",
    },
    ...weights.blocks.map((block, i) => ({
      step: (3 + i) as StepIndex,
      label: `Block ${block.index}`,
      params:
        block.depthwise_weight.data.length +
        block.pointwise_weight.data.length +
        block.pointwise_bias.data.length,
      color: blockColors[i % blockColors.length],
    })),
    {
      step: 6,
      label: "Readout",
      params: weights.head_weight.data.length + weights.head_bias_x.data.length,
      color: "#f59e0b",
    },
  ];
}

export interface WeightView {
  id: string;
  title: string;
  /** Tensor shape as drawn, rows × columns. */
  shape: string;
  rows: number;
  cols: number;
  /** Row-major values in the drawn orientation. */
  values: Float32Array;
  maxAbs: number;
  rowsAxis: string;
  colsAxis: string;
  rowLabel: (row: number) => string;
  colLabel: (col: number) => string;
  /** Captions for the two halves of a matrix split down the middle. */
  halves?: [string, string];
  /** One finding read off these weights. */
  caption: string;
  /** Preferred on-screen size of one cell, in px. */
  cellPx: number;
}

export interface StepWeights {
  /** Trained parameters at this step, biases included. */
  paramCount: number;
  views: WeightView[];
  /** Small tensors stated in words instead of drawn. */
  extras: string;
  /** Shown when the step has nothing to learn. */
  emptyNote?: string;
}

const FEATURE_NAMES = ["ωx", "ωy", "ωz", "|ω|₁", "gx", "gy", "gz"];
const AXIS_NAMES = ["x nod", "y turn", "z tilt"];

const absMax = (values: ArrayLike<number>) => {
  let max = 1e-9;
  for (let i = 0; i < values.length; i++) max = Math.max(max, Math.abs(values[i]));
  return max;
};

const frobenius = (values: ArrayLike<number>) => {
  let sum = 0;
  for (let i = 0; i < values.length; i++) sum += values[i] * values[i];
  return Math.sqrt(sum);
};

const rowMeanAbs = (values: Float32Array, rows: number, cols: number) => {
  const out = new Array<number>(rows).fill(0);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) out[r] += Math.abs(values[r * cols + c]) / cols;
  }
  return out;
};

const signedFixed = (value: number, digits: number) =>
  `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(digits)}`;

const EMPTY_NOTES: Partial<Record<StepIndex, string>> = {
  0: "Nothing is learned here: the step only reads the newest headset quaternion.",
  1: "Nothing is learned here: the 7 channels are fixed geometry (body rate, L1 speed, gravity in the head frame).",
  7: "Nothing is learned here: the Cayley map and the normalisation are fixed functions.",
};

/** The trained tensors behind one pipeline step, oriented with channels across. */
export function weightViewsForStep(step: StepIndex, weights: ModelWeights): StepWeights {
  if (step === 2) {
    const features = FEATURE_NAMES.length;
    const src = weights.projection_weight.data;
    const channels = Math.floor(src.length / features);
    const values = new Float32Array(features * channels);
    for (let c = 0; c < channels; c++) {
      for (let f = 0; f < features; f++) values[f * channels + c] = src[c * features + f];
    }
    const perFeature = rowMeanAbs(values, features, channels);
    const rate = (perFeature[0] + perFeature[1] + perFeature[2]) / 3;
    const gravity = (perFeature[4] + perFeature[5] + perFeature[6]) / 3;
    const [stronger, weaker] =
      gravity >= rate ? ["gravity", "body-rate"] : ["body-rate", "gravity"];
    return {
      paramCount: src.length + weights.projection_bias.data.length,
      extras: `plus ${weights.projection_bias.data.length} biases`,
      views: [
        {
          id: "projection",
          title: "1×1 projection",
          shape: `${features} × ${channels}`,
          rows: features,
          cols: channels,
          values,
          maxAbs: absMax(values),
          rowsAxis: "7 input features",
          colsAxis: `${channels} output channels`,
          rowLabel: (r) => FEATURE_NAMES[r],
          colLabel: (c) => `channel ${c}`,
          caption: `The ${stronger} rows carry the heavier weights: mean |w| ${Math.max(
            gravity,
            rate,
          ).toFixed(2)} against ${Math.min(gravity, rate).toFixed(2)} on the ${weaker} rows.`,
          cellPx: 9,
        },
      ],
    };
  }

  if (step >= 3 && step <= 5) {
    const block = weights.blocks[step - 3];
    if (!block) return { paramCount: 0, views: [], extras: "" };
    const k = block.kernel_size;
    const dw = block.depthwise_weight.data;
    const channels = Math.floor(dw.length / k);

    const kernel = new Float32Array(k * channels);
    for (let c = 0; c < channels; c++) {
      for (let m = 0; m < k; m++) kernel[m * channels + c] = dw[c * k + m];
    }
    const perTap = rowMeanAbs(kernel, k, channels);
    const newest = perTap[k - 1];
    const older = meanOf(perTap.slice(0, k - 1));

    const pw = block.pointwise_weight.data;
    const mixCols = Math.floor(pw.length / channels);
    const mix = Float32Array.from(pw);
    const own: number[] = [];
    const cross: number[] = [];
    for (let r = 0; r < channels; r++) {
      for (let c = 0; c < mixCols; c++) (c < channels ? own : cross).push(pw[r * mixCols + c]);
    }
    const ownNorm = frobenius(own);
    const crossNorm = frobenius(cross);

    return {
      paramCount: dw.length + pw.length + block.pointwise_bias.data.length,
      extras: `plus ${block.pointwise_bias.data.length} biases`,
      views: [
        {
          id: `depthwise-${block.index}`,
          title: "Depthwise kernel",
          shape: `${k} × ${channels}`,
          rows: k,
          cols: channels,
          values: kernel,
          maxAbs: absMax(kernel),
          rowsAxis: `${k} taps, oldest at the top`,
          colsAxis: `${channels} channels`,
          rowLabel: (r) => {
            const back = (k - 1 - r) * block.dilation;
            return back === 0 ? "tap t (newest)" : `tap t−${back}`;
          },
          colLabel: (c) => `channel ${c}`,
          caption: `The newest tap dominates: mean |w| ${newest.toFixed(2)}, ${(
            newest / Math.max(1e-9, older)
          ).toFixed(1)}× the average of the ${k - 1} older taps.`,
          cellPx: 9,
        },
        {
          id: `pointwise-${block.index}`,
          title: "Pointwise mix [A | B]",
          shape: `${channels} × ${mixCols}`,
          rows: channels,
          cols: mixCols,
          values: mix,
          maxAbs: absMax(mix),
          rowsAxis: `${channels} output channels`,
          colsAxis: `${mixCols} inputs`,
          rowLabel: (r) => `out ${r}`,
          colLabel: (c) => (c < channels ? `A · own ${c}` : `B · mirror ${c - channels}`),
          halves: ["A · own stream", "B · mirror stream"],
          caption: `‖A‖ = ${ownNorm.toFixed(2)}, ‖B‖ = ${crossNorm.toFixed(
            2,
          )}: the mirror stream is weighted ${Math.round(
            (crossNorm / Math.max(1e-9, ownNorm)) * 100,
          )}% as heavily as the block's own.`,
          cellPx: 5,
        },
      ],
    };
  }

  if (step === 6) {
    const src = weights.head_weight.data;
    const rows = 9;
    const channels = Math.floor(src.length / rows);
    const values = Float32Array.from(src);
    const perRow = rowMeanAbs(values, rows, channels);
    let top = 0;
    for (let r = 1; r < rows; r++) if (perRow[r] > perRow[top]) top = r;
    const rowName = (r: number) => `c${Math.floor(r / 3) + 1} · ${AXIS_NAMES[r % 3]}`;
    const bias = Array.from(weights.head_bias_x.data, (v) => signedFixed(v, 3)).join(", ");
    return {
      paramCount: src.length + weights.head_bias_x.data.length,
      extras: `plus ${weights.head_bias_x.data.length} nod biases (${bias})`,
      views: [
        {
          id: "readout",
          title: "Cubic readout",
          shape: `${rows} × ${channels}`,
          rows,
          cols: channels,
          values,
          maxAbs: absMax(values),
          rowsAxis: "9 coefficients (3 powers × 3 axes)",
          colsAxis: `${channels} channels`,
          rowLabel: rowName,
          colLabel: (c) => `channel ${c}`,
          caption: `Small weights throughout (max |w| ${absMax(values).toFixed(
            2,
          )}): the readout only nudges the prior. Heaviest row: ${rowName(top)}.`,
          cellPx: 9,
        },
      ],
    };
  }

  return { paramCount: 0, views: [], extras: "", emptyNote: EMPTY_NOTES[step] };
}

// ---------------------------------------------------------------------------
// Receptive-field coverage of the 400-sample context
// ---------------------------------------------------------------------------

const hexToRgb = (hex: number): [number, number, number] => [
  ((hex >> 16) & 255) / 255,
  ((hex >> 8) & 255) / 255,
  (hex & 255) / 255,
];

/**
 * Per-sample colours for the context waveform when a block is selected: which of
 * the samples reach the output through that block, banded by the kernel tap that
 * reads them. Returns one RGB table per block step (3, 4, 5).
 */
export function buildCoverageColourTables(
  samples = 400,
  kernelSizes: number[] = [8, 8, 8],
  dilations: number[] = [1, 8, 47],
  blockColors: number[] = [0x4ade80, 0x22d3ee, 0xc084fc],
): Partial<Record<StepIndex, Float32Array>> {
  const tables: Partial<Record<StepIndex, Float32Array>> = {};
  const unused: [number, number, number] = [0.06, 0.26, 0.15];
  let inputSpan = 1; // samples one tap of this block sees through the blocks before it

  for (let b = 0; b < kernelSizes.length; b++) {
    const k = kernelSizes[b];
    const d = dilations[b];
    const [r, g, bl] = hexToRgb(blockColors[b % blockColors.length]);
    const hits = new Uint8Array(samples);
    const owner = new Int16Array(samples).fill(-1);

    for (let m = 0; m < k; m++) {
      const tap = samples - 1 - m * d;
      for (let i = Math.max(0, tap - inputSpan + 1); i <= tap; i++) {
        if (i < 0) continue;
        hits[i]++;
        if (owner[i] < 0) owner[i] = m;
      }
    }

    const table = new Float32Array(samples * 3);
    for (let i = 0; i < samples; i++) {
      let color = unused;
      if (hits[i] > 1) {
        // Read through two neighbouring taps: brightest, pulled toward white.
        color = [r + (1 - r) * 0.45, g + (1 - g) * 0.45, bl + (1 - bl) * 0.45];
      } else if (hits[i] === 1) {
        const level = owner[i] % 2 === 0 ? 1 : 0.5;
        color = [r * level, g * level, bl * level];
      }
      table.set(color, i * 3);
    }
    tables[(3 + b) as StepIndex] = table;
    inputSpan += (k - 1) * d;
  }
  return tables;
}
