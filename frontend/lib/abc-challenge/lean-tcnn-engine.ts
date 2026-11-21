export type Vec3 = [number, number, number];
export type Quat = [number, number, number, number]; // [w, x, y, z] scalar-first

export interface TensorPayload {
  shape: number[];
  data: number[];
}

export interface BlockWeightsPayload {
  index: number;
  kernel_size: number;
  dilation: number;
  left_padding: number;
  depthwise_weight: TensorPayload;
  pointwise_weight: TensorPayload;
  pointwise_bias: TensorPayload;
}

/**
 * A replay clip: one public QuestSet player or a synthetic head-motion stream, built by
 * scripts/build-abc-clips.mjs from the public abc-challenge repo. No BOXRR-23 recordings.
 */
export interface ValidationClip {
  id: string;
  title: string;
  description: string;
  source: "questset" | "synthetic";
  /** Attribution for the clip's data, shown with the clip. */
  credit: string;
  meanSpeedDegPerSec: number;
  maxSpeedDegPerSec: number;
  totalFrames: number;
  contextLength: number;
  playbackFrames: number;
  horizon: number;
  quaternions: Quat[];
}

export interface K8ModelBundle {
  modelName: string;
  challenge: string;
  metrics: {
    val200msDeg: number;
    valStdDeg: number;
    test200msDeg: number;
    dampedPriorTest200msDeg: number;
    holdLastTest200msDeg: number;
    declaredParams: number;
    storedLeanParams: number;
    receptiveField: number;
    contextSamples: number;
    horizonSamples: number;
    horizonMs: number;
    sampleRateHz: number;
    latencyLeanUs: number;
    latencyPaddedA4Us: number;
  };
  specification: {
    context: number;
    horizon: number;
    channels: number;
    stream_channels?: number;
    dropout: number;
    effective_context: number;
    damped_prior_tau_ms: number;
    num_blocks: number;
    gravity_features: boolean;
    mirror_equivariant: boolean;
    dilation_base: number;
    separable: boolean;
    head_basis: number;
    speed_feature: string;
    kernel_sizes: number[];
    dilations: number[];
    maps: string;
  };
  weights: {
    projection_weight: TensorPayload;
    projection_bias: TensorPayload;
    blocks: BlockWeightsPayload[];
    head_weight: TensorPayload;
    head_bias_x: TensorPayload;
  };
  clips: ValidationClip[];
}

export interface BlockActivationSnapshot {
  index: number;
  kernelSize: number;
  dilation: number;
  receptiveFieldCumulative: number;
  tapIndices: number[]; // 8 indices in [0..399]
  tapEnergies0: number[]; // 8 mean energies for Stream 0
  tapEnergies1: number[]; // 8 mean energies for Stream 1
  depthwise0: number[]; // [32]
  depthwise1: number[]; // [32]
  ownStreamNorm0: number; // ||A h0||
  crossStreamNorm0: number; // ||B h1||
  ownStreamNorm1: number; // ||A h1||
  crossStreamNorm1: number; // ||B h0||
  activations0: number[]; // [32] post-ReLU
  activations1: number[]; // [32] post-ReLU
}

export interface InferenceOptions {
  tauMs?: number; // Default 100 ms
  residualScale?: number; // Default 1.0 (0.0 = pure damped prior)
  tiltDeg?: number; // World tilt augmentation angle (-15 to +15 deg)
  tiltHeadingDeg?: number; // Horizontal world axis heading
  gravityEnabled?: boolean; // Default true (false zeroes gravity channels to show ablation)
}

export interface InferenceSnapshot {
  lastQ: Quat;
  mirroredLastQ: Quat;
  stepRateRad: Vec3; // 2*w*v per sample (rad/sample)
  velocityRadPerSec: Vec3; // 100 * stepRateRad
  velocityDegPerSec: Vec3;
  l1Speed: number;
  gravityHead: Vec3; // R(q)^T y in head frame
  mirroredGravityHead: Vec3;
  inputFeatures0: number[]; // [7]
  inputFeatures1: number[]; // [7] sign-flipped
  projActivations0: number[]; // [32]
  projActivations1: number[]; // [32]
  blocks: BlockActivationSnapshot[];
  readout: {
    ownKnobs: [Vec3, Vec3, Vec3]; // W h0
    mirrorKnobsFlipped: [Vec3, Vec3, Vec3]; // S W h1
    nodBias: Vec3; // head_bias_x [b1, b2, b3]
    coefficients: [Vec3, Vec3, Vec3]; // c1, c2, c3 per axis (x, y, z)
  };
  horizonSteps: {
    step: number; // 1..20
    timeMs: number; // 10..200
    priorRotVec: Vec3;
    residualRotVec: Vec3;
    combinedRotVec: Vec3;
  }[];
  trajectories: {
    holdLast: Quat[]; // [20]
    constantVelocity: Quat[]; // [20]
    dampedPrior: Quat[]; // [20]
    k8Combined: Quat[]; // [20]
    mirroredK8Combined: Quat[]; // [20] M(k8Combined)
  };
  mirrorEquivarianceErrorDeg: number; // Geodesic angle between model(M(h)) and M(model(h)) at step 20
}

// Sign masks from best/model.py:
// RATE_SIGNS = (1., -1., -1., 1.), GRAVITY_SIGNS = (-1., 1., 1.), ROTATION_SIGNS = (1., -1., -1.)
export const INPUT_SIGNS = [1, -1, -1, 1, -1, 1, 1] as const;
export const ROTATION_SIGNS: Vec3 = [1, -1, -1];

export function normalizeQ(q: Quat): Quat {
  const norm = Math.hypot(q[0], q[1], q[2], q[3]);
  if (norm < 1e-12) return [1, 0, 0, 0];
  return [q[0] / norm, q[1] / norm, q[2] / norm, q[3] / norm];
}

export function conjugateQ(q: Quat): Quat {
  return [q[0], -q[1], -q[2], -q[3]];
}

export function qmul(a: Quat, b: Quat): Quat {
  const [w1, x1, y1, z1] = a;
  const [w2, x2, y2, z2] = b;
  return [
    w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2,
    w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2,
    w1 * y2 - x1 * z2 + y1 * w2 + z1 * x2,
    w1 * z2 + x1 * y2 - y1 * x2 + z1 * w2,
  ];
}

/**
 * M(q) = (w, x, -y, -z): left-right mirror across world x = 0 plane.
 */
export function mirrorQ(q: Quat): Quat {
  return [q[0], q[1], -q[2], -q[3]];
}

/**
 * World +y expressed in the head frame, R(q)^T y, for unit quaternion q = (w, x, y, z).
 */
export function gravityInHeadFrame(q: Quat): Vec3 {
  const [w, x, y, z] = q;
  return [
    2 * (x * y + w * z),
    w * w - x * x + y * y - z * z,
    2 * (y * z - w * x),
  ];
}

/**
 * Cayley map: normalize((2, r_x, r_y, r_z)) used by maps="native" in best/model.py.
 */
export function cayleyMap(r: Vec3): Quat {
  return normalizeQ([2.0, r[0], r[1], r[2]]);
}

/**
 * Geodesic angular distance in degrees: 4 * atan2(||p - t||, ||p + t||) after sign alignment.
 */
export function geodesicAngleDeg(p: Quat, t: Quat): number {
  const pn = normalizeQ(p);
  const tn = normalizeQ(t);
  const dot = pn[0] * tn[0] + pn[1] * tn[1] + pn[2] * tn[2] + pn[3] * tn[3];
  const sign = dot < 0 ? -1 : 1;
  const tx = sign * tn[0];
  const ty = sign * tn[1];
  const tz = sign * tn[2];
  const tw = sign * tn[3];
  const diffNorm = Math.hypot(pn[0] - tx, pn[1] - ty, pn[2] - tz, pn[3] - tw);
  const sumNorm = Math.hypot(pn[0] + tx, pn[1] + ty, pn[2] + tz, pn[3] + tw);
  // atan2 gives a quarter of the rotation angle; 4x matches bench/geometry.py's 2 arccos|<p, q>|.
  const rad = 4 * Math.atan2(diffNorm, sumNorm);
  return (rad * 180) / Math.PI;
}

/**
 * World tilt rotation quaternion about a horizontal axis (cos(heading), 0, sin(heading)).
 */
export function worldTiltQuaternion(tiltDeg: number, headingDeg = 0): Quat {
  if (Math.abs(tiltDeg) < 1e-7) return [1, 0, 0, 0];
  const halfAngle = ((tiltDeg * Math.PI) / 180) * 0.5;
  const heading = (headingDeg * Math.PI) / 180;
  const s = Math.sin(halfAngle);
  return [Math.cos(halfAngle), s * Math.cos(heading), 0, s * Math.sin(heading)];
}

export class LeanTCNNEngine {
  readonly bundle: K8ModelBundle;
  private readonly streamChannels = 32;
  private readonly projW: Float64Array; // [32, 7]
  private readonly projB: Float64Array; // [32]
  private readonly headW: Float64Array; // [9, 32]
  private readonly headBiasX: Float64Array; // [3]
  private readonly blocks: {
    kernelSize: number;
    dilation: number;
    dw: Float64Array; // [32, 8]
    pw: Float64Array; // [32, 64] = [A | B]
    pb: Float64Array; // [32]
  }[];

  constructor(bundle: K8ModelBundle) {
    this.bundle = bundle;
    this.projW = Float64Array.from(bundle.weights.projection_weight.data);
    this.projB = Float64Array.from(bundle.weights.projection_bias.data);
    this.headW = Float64Array.from(bundle.weights.head_weight.data);
    this.headBiasX = Float64Array.from(bundle.weights.head_bias_x.data);
    this.blocks = bundle.weights.blocks.map((b) => ({
      kernelSize: b.kernel_size,
      dilation: b.dilation,
      dw: Float64Array.from(b.depthwise_weight.data),
      pw: Float64Array.from(b.pointwise_weight.data),
      pb: Float64Array.from(b.pointwise_bias.data),
    }));
  }

  /**
   * Core causal-tree evaluation on a 400-sample quaternion window.
   * Exploits the exact causal tree of t = 399 (393 -> 64 -> 8 -> 1 time steps)
   * so that full 400-sample inference runs in < 0.1 ms in the browser while
   * remaining 100% mathematically identical to LeanTCNN.forward in PyTorch.
   */
  private evaluateCore(
    window400: Quat[],
    options: InferenceOptions = {},
  ): {
    qNorm: Quat[];
    lastQ: Quat;
    lastStep: Vec3;
    lastFeatures0: number[];
    lastFeatures1: number[];
    proj0At399: number[];
    proj1At399: number[];
    blockSnapshots: BlockActivationSnapshot[];
    ownKnobs: [Vec3, Vec3, Vec3];
    mirrorKnobsFlipped: [Vec3, Vec3, Vec3];
    nodBias: Vec3;
    coefficients: [Vec3, Vec3, Vec3];
    k8Combined: Quat[];
    dampedPrior: Quat[];
    holdLast: Quat[];
    constantVelocity: Quat[];
    horizonSteps: InferenceSnapshot["horizonSteps"];
  } {
    const N = 400;
    const K = this.streamChannels; // 32
    const gravityEnabled = options.gravityEnabled ?? true;
    const tiltQuat = worldTiltQuaternion(options.tiltDeg ?? 0, options.tiltHeadingDeg ?? 0);
    const hasTilt = Math.abs(options.tiltDeg ?? 0) > 1e-7;

    // 1. Normalize (and optionally apply world tilt augmentation q_tilted = tilt ⊗ q)
    const qNorm: Quat[] = new Array(N);
    for (let t = 0; t < N; t++) {
      const q = normalizeQ(window400[t]);
      qNorm[t] = hasTilt ? normalizeQ(qmul(tiltQuat, q)) : q;
    }

    // 2. Compute per-step 7-channel features for t = 0..399
    // features[t * 7 + f]: [vx, vy, vz, speed_l1, gx, gy, gz]
    const features = new Float64Array(N * 7);
    let lastStep: Vec3 = [0, 0, 0];

    for (let t = 0; t < N; t++) {
      const base = t * 7;
      if (t > 0) {
        const delta = qmul(conjugateQ(qNorm[t - 1]), qNorm[t]);
        const w = delta[0];
        const sx = 2 * w * delta[1];
        const sy = 2 * w * delta[2];
        const sz = 2 * w * delta[3];
        if (t === N - 1) {
          lastStep = [sx, sy, sz];
        }
        const vx = sx * 100.0;
        const vy = sy * 100.0;
        const vz = sz * 100.0;
        const speed = Math.abs(vx) + Math.abs(vy) + Math.abs(vz);
        features[base + 0] = vx;
        features[base + 1] = vy;
        features[base + 2] = vz;
        features[base + 3] = speed;
      }
      if (gravityEnabled) {
        const g = gravityInHeadFrame(qNorm[t]);
        features[base + 4] = g[0];
        features[base + 5] = g[1];
        features[base + 6] = g[2];
      }
    }

    // Determine exact time steps needed at each stage for output at t = 399:
    // Block 2 (d=47, k=8): needs 8 taps from Block 1: t2 = 399 - (7 - m)*47 for m=0..7
    const b2 = this.blocks[2];
    const b1 = this.blocks[1];
    const b0 = this.blocks[0];

    const t2Indices: number[] = [];
    for (let m = 0; m < b2.kernelSize; m++) {
      t2Indices.push(N - 1 - (b2.kernelSize - 1 - m) * b2.dilation);
    }

    const t1Set = new Set<number>();
    for (const t2 of t2Indices) {
      for (let m = 0; m < b1.kernelSize; m++) {
        t1Set.add(t2 - (b1.kernelSize - 1 - m) * b1.dilation);
      }
    }
    const t1Indices = Array.from(t1Set).sort((a, b) => a - b);

    const t0Set = new Set<number>();
    for (const t1 of t1Indices) {
      for (let m = 0; m < b0.kernelSize; m++) {
        const idx = t1 - (b0.kernelSize - 1 - m) * b0.dilation;
        if (idx >= 0) t0Set.add(idx);
      }
    }
    const t0Indices = Array.from(t0Set).sort((a, b) => a - b);

    // 3. Evaluate 1x1 Projection + ReLU at t0Indices for Stream 0 and Stream 1
    const proj0 = new Map<number, Float64Array>();
    const proj1 = new Map<number, Float64Array>();

    for (const t of t0Indices) {
      const out0 = new Float64Array(K);
      const out1 = new Float64Array(K);
      const fBase = t * 7;
      for (let c = 0; c < K; c++) {
        let sum0 = this.projB[c];
        let sum1 = this.projB[c];
        const wBase = c * 7;
        for (let f = 0; f < 7; f++) {
          const w = this.projW[wBase + f];
          const val = features[fBase + f];
          sum0 += w * val;
          sum1 += w * val * INPUT_SIGNS[f];
        }
        out0[c] = sum0 > 0 ? sum0 : 0;
        out1[c] = sum1 > 0 ? sum1 : 0;
      }
      proj0.set(t, out0);
      proj1.set(t, out1);
    }

    // Helper to run one Separable KernelBlock at requested target time steps
    const runBlockStage = (
      blockCfg: (typeof this.blocks)[number],
      blockIdx: number,
      rfCumulative: number,
      targetTimes: number[],
      in0: Map<number, Float64Array>,
      in1: Map<number, Float64Array>,
    ): {
      out0: Map<number, Float64Array>;
      out1: Map<number, Float64Array>;
      snapshotAt399: BlockActivationSnapshot;
    } => {
      const out0 = new Map<number, Float64Array>();
      const out1 = new Map<number, Float64Array>();
      const { kernelSize, dilation, dw, pw, pb } = blockCfg;

      let snapshotAt399: BlockActivationSnapshot | null = null;
      const dw0Buf = new Float64Array(K);
      const dw1Buf = new Float64Array(K);

      for (const t of targetTimes) {
        const isLast = t === N - 1;
        const tapIndices: number[] = [];
        const tapEnergies0: number[] = [];
        const tapEnergies1: number[] = [];

        if (isLast) {
          for (let m = 0; m < kernelSize; m++) {
            const tapT = t - (kernelSize - 1 - m) * dilation;
            tapIndices.push(tapT);
            const s0 = in0.get(tapT);
            const s1 = in1.get(tapT);
            let e0 = 0;
            let e1 = 0;
            if (s0 && s1) {
              for (let c = 0; c < K; c++) {
                e0 += Math.abs(s0[c]);
                e1 += Math.abs(s1[c]);
              }
            }
            tapEnergies0.push(e0 / K);
            tapEnergies1.push(e1 / K);
          }
        }

        // Depthwise dilated conv (shared across both streams)
        for (let c = 0; c < K; c++) {
          let sum0 = 0;
          let sum1 = 0;
          const dwBase = c * kernelSize;
          for (let m = 0; m < kernelSize; m++) {
            const tapT = t - (kernelSize - 1 - m) * dilation;
            if (tapT >= 0) {
              const w = dw[dwBase + m];
              const s0 = in0.get(tapT)!;
              const s1 = in1.get(tapT)!;
              sum0 += w * s0[c];
              sum1 += w * s1[c];
            }
          }
          dw0Buf[c] = sum0;
          dw1Buf[c] = sum1;
        }

        // Pointwise 1x1 conv with mirror-equivariant weight [[A, B], [B, A]]
        // pw has shape [K, 2*K] where columns 0..K-1 are A and K..2K-1 are B
        const next0 = new Float64Array(K);
        const next1 = new Float64Array(K);
        const cur0 = in0.get(t)!;
        const cur1 = in1.get(t)!;

        let ownNorm0 = 0;
        let crossNorm0 = 0;
        let ownNorm1 = 0;
        let crossNorm1 = 0;

        for (let cout = 0; cout < K; cout++) {
          const rowBase = cout * (2 * K);
          let a0 = 0;
          let b1 = 0;
          let a1 = 0;
          let b0 = 0;
          for (let cin = 0; cin < K; cin++) {
            const wA = pw[rowBase + cin];
            const wB = pw[rowBase + K + cin];
            const d0 = dw0Buf[cin];
            const d1 = dw1Buf[cin];
            a0 += wA * d0;
            b1 += wB * d1;
            a1 += wA * d1;
            b0 += wB * d0;
          }
          if (isLast) {
            ownNorm0 += a0 * a0;
            crossNorm0 += b1 * b1;
            ownNorm1 += a1 * a1;
            crossNorm1 += b0 * b0;
          }
          const u0 = a0 + b1 + pb[cout];
          const u1 = b0 + a1 + pb[cout];
          const reluU0 = u0 > 0 ? u0 : 0;
          const reluU1 = u1 > 0 ? u1 : 0;
          const res0 = cur0[cout] + reluU0;
          const res1 = cur1[cout] + reluU1;
          next0[cout] = res0 > 0 ? res0 : 0;
          next1[cout] = res1 > 0 ? res1 : 0;
        }

        out0.set(t, next0);
        out1.set(t, next1);

        if (isLast) {
          snapshotAt399 = {
            index: blockIdx,
            kernelSize,
            dilation,
            receptiveFieldCumulative: rfCumulative,
            tapIndices,
            tapEnergies0,
            tapEnergies1,
            depthwise0: Array.from(dw0Buf),
            depthwise1: Array.from(dw1Buf),
            ownStreamNorm0: Math.sqrt(ownNorm0),
            crossStreamNorm0: Math.sqrt(crossNorm0),
            ownStreamNorm1: Math.sqrt(ownNorm1),
            crossStreamNorm1: Math.sqrt(crossNorm1),
            activations0: Array.from(next0),
            activations1: Array.from(next1),
          };
        }
      }

      return { out0, out1, snapshotAt399: snapshotAt399! };
    };

    const stage0 = runBlockStage(b0, 0, 8, t1Indices, proj0, proj1);
    const stage1 = runBlockStage(b1, 1, 64, t2Indices, stage0.out0, stage0.out1);
    const stage2 = runBlockStage(b2, 2, 393, [N - 1], stage1.out0, stage1.out1);

    // 4. Readout at t = 399
    const final0 = stage2.out0.get(N - 1)!;
    const final1 = stage2.out1.get(N - 1)!;
    const residualScale = options.residualScale ?? 1.0;

    const ownKnobs: [Vec3, Vec3, Vec3] = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    const mirrorKnobsFlipped: [Vec3, Vec3, Vec3] = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    const coefficients: [Vec3, Vec3, Vec3] = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    const nodBias: Vec3 = [this.headBiasX[0], this.headBiasX[1], this.headBiasX[2]];

    for (let j = 0; j < 3; j++) {
      for (let axis = 0; axis < 3; axis++) {
        const row = j * 3 + axis;
        const wBase = row * K;
        let sumOwn = 0;
        let sumOther = 0;
        for (let c = 0; c < K; c++) {
          const w = this.headW[wBase + c];
          sumOwn += w * final0[c];
          sumOther += w * final1[c];
        }
        const flippedOther = ROTATION_SIGNS[axis] * sumOther;
        const biasVal = axis === 0 ? this.headBiasX[j] : 0;
        ownKnobs[j][axis] = sumOwn;
        mirrorKnobsFlipped[j][axis] = flippedOther;
        coefficients[j][axis] = (sumOwn + flippedOther + biasVal) * residualScale;
      }
    }

    // 5. Evaluate 20-step trajectories (10 ms .. 200 ms)
    const horizon = 20;
    const tauSamples = (options.tauMs ?? this.bundle.specification.damped_prior_tau_ms ?? 100) / 10.0;
    const lastQ = qNorm[N - 1];

    const holdLast: Quat[] = [];
    const constantVelocity: Quat[] = [];
    const dampedPrior: Quat[] = [];
    const k8Combined: Quat[] = [];
    const horizonSteps: InferenceSnapshot["horizonSteps"] = [];

    for (let s = 1; s <= horizon; s++) {
      const u = s / horizon;
      const u2 = u * u;
      const u3 = u2 * u;
      const elapsed = tauSamples > 1e-6 ? -tauSamples * Math.expm1(-s / tauSamples) : 0;

      const priorRotVec: Vec3 = [
        lastStep[0] * elapsed,
        lastStep[1] * elapsed,
        lastStep[2] * elapsed,
      ];
      const residualRotVec: Vec3 = [
        coefficients[0][0] * u + coefficients[1][0] * u2 + coefficients[2][0] * u3,
        coefficients[0][1] * u + coefficients[1][1] * u2 + coefficients[2][1] * u3,
        coefficients[0][2] * u + coefficients[1][2] * u2 + coefficients[2][2] * u3,
      ];
      const combinedRotVec: Vec3 = [
        priorRotVec[0] + residualRotVec[0],
        priorRotVec[1] + residualRotVec[1],
        priorRotVec[2] + residualRotVec[2],
      ];
      const constVelRotVec: Vec3 = [lastStep[0] * s, lastStep[1] * s, lastStep[2] * s];

      holdLast.push(lastQ);
      constantVelocity.push(normalizeQ(qmul(lastQ, cayleyMap(constVelRotVec))));
      dampedPrior.push(normalizeQ(qmul(lastQ, cayleyMap(priorRotVec))));
      k8Combined.push(normalizeQ(qmul(lastQ, cayleyMap(combinedRotVec))));

      horizonSteps.push({
        step: s,
        timeMs: s * 10,
        priorRotVec,
        residualRotVec,
        combinedRotVec,
      });
    }

    const fBaseLast = (N - 1) * 7;
    const lastFeatures0 = Array.from(features.slice(fBaseLast, fBaseLast + 7));
    const lastFeatures1 = lastFeatures0.map((v, i) => v * INPUT_SIGNS[i]);

    return {
      qNorm,
      lastQ,
      lastStep,
      lastFeatures0,
      lastFeatures1,
      proj0At399: Array.from(proj0.get(N - 1)!),
      proj1At399: Array.from(proj1.get(N - 1)!),
      blockSnapshots: [stage0.snapshotAt399, stage1.snapshotAt399, stage2.snapshotAt399],
      ownKnobs,
      mirrorKnobsFlipped,
      nodBias,
      coefficients,
      k8Combined,
      dampedPrior,
      holdLast,
      constantVelocity,
      horizonSteps,
    };
  }

  /**
   * Forecast only: one causal-tree pass, without the second mirrored pass that `infer`
   * runs to measure equivariance. Used to score every frame of a clip.
   */
  public forecast(
    window400: Quat[],
    options: InferenceOptions = {},
  ): { k8Combined: Quat[]; dampedPrior: Quat[]; holdLast: Quat[] } {
    const core = this.evaluateCore(window400, options);
    return {
      k8Combined: core.k8Combined,
      dampedPrior: core.dampedPrior,
      holdLast: core.holdLast,
    };
  }

  /**
   * Run full inference on a 400-sample quaternion context window and also verify
   * exact left-right mirror equivariance M(model(h)) == model(M(h)).
   */
  public infer(window400: Quat[], options: InferenceOptions = {}): InferenceSnapshot {
    const direct = this.evaluateCore(window400, options);

    // Run on mirrored input M(window400) to prove exact mirror equivariance
    const mirroredInput = direct.qNorm.map(mirrorQ);
    const mirroredEval = this.evaluateCore(mirroredInput, {
      ...options,
      tiltDeg: 0, // tilt already applied to direct.qNorm if any
    });

    const mirroredPredFromDirect = direct.k8Combined.map(mirrorQ);
    const mirrorEquivarianceErrorDeg = geodesicAngleDeg(
      mirroredEval.k8Combined[19],
      mirroredPredFromDirect[19],
    );

    const lastQ = direct.lastQ;
    const mirroredLastQ = mirrorQ(lastQ);
    const velocityRadPerSec: Vec3 = [
      direct.lastStep[0] * 100,
      direct.lastStep[1] * 100,
      direct.lastStep[2] * 100,
    ];
    const velocityDegPerSec: Vec3 = [
      (velocityRadPerSec[0] * 180) / Math.PI,
      (velocityRadPerSec[1] * 180) / Math.PI,
      (velocityRadPerSec[2] * 180) / Math.PI,
    ];
    const gravityHead = gravityInHeadFrame(lastQ);

    return {
      lastQ,
      mirroredLastQ,
      stepRateRad: direct.lastStep,
      velocityRadPerSec,
      velocityDegPerSec,
      l1Speed:
        Math.abs(velocityRadPerSec[0]) +
        Math.abs(velocityRadPerSec[1]) +
        Math.abs(velocityRadPerSec[2]),
      gravityHead,
      mirroredGravityHead: gravityInHeadFrame(mirroredLastQ),
      inputFeatures0: direct.lastFeatures0,
      inputFeatures1: direct.lastFeatures1,
      projActivations0: direct.proj0At399,
      projActivations1: direct.proj1At399,
      blocks: direct.blockSnapshots,
      readout: {
        ownKnobs: direct.ownKnobs,
        mirrorKnobsFlipped: direct.mirrorKnobsFlipped,
        nodBias: direct.nodBias,
        coefficients: direct.coefficients,
      },
      horizonSteps: direct.horizonSteps,
      trajectories: {
        holdLast: direct.holdLast,
        constantVelocity: direct.constantVelocity,
        dampedPrior: direct.dampedPrior,
        k8Combined: direct.k8Combined,
        mirroredK8Combined: mirroredEval.k8Combined,
      },
      mirrorEquivarianceErrorDeg,
    };
  }
}

/**
 * Generates a smooth 400-sample synthetic window ending at a user-controlled
 * Euler orientation (pitch/nod, yaw/turn, roll/tilt in degrees) and angular velocity,
 * for Interactive Drag / Sandbox Mode.
 */
export function buildInteractiveWindow(
  pitchDeg: number,
  yawDeg: number,
  rollDeg: number,
  velPitchDegPerSec: number,
  velYawDegPerSec: number,
  velRollDegPerSec: number,
  timeSec: number,
): Quat[] {
  const N = 400;
  const window400: Quat[] = new Array(N);
  const deg2rad = Math.PI / 180;

  for (let i = 0; i < N; i++) {
    // dt is negative going into the past: i=399 -> dt=0, i=0 -> dt=-3.99s
    const dt = (i - (N - 1)) * 0.01;
    // Smooth damped wave history that matches the current pose & instantaneous velocity at dt=0
    const decay = Math.exp(dt * 1.8);
    const p =
      (pitchDeg + velPitchDegPerSec * dt * decay + 6 * Math.sin(2.1 * (timeSec + dt)) * (1 - decay)) *
      deg2rad;
    const y =
      (yawDeg + velYawDegPerSec * dt * decay + 12 * Math.sin(1.4 * (timeSec + dt)) * (1 - decay)) *
      deg2rad;
    const r =
      (rollDeg + velRollDegPerSec * dt * decay + 4 * Math.cos(1.9 * (timeSec + dt)) * (1 - decay)) *
      deg2rad;

    // Intrinsic Y-X-Z (yaw, pitch, roll) to quaternion (w, x, y, z)
    const cy = Math.cos(y * 0.5);
    const sy = Math.sin(y * 0.5);
    const cp = Math.cos(p * 0.5);
    const sp = Math.sin(p * 0.5);
    const cr = Math.cos(r * 0.5);
    const sr = Math.sin(r * 0.5);

    const q: Quat = [
      cy * cp * cr + sy * sp * sr,
      cy * sp * cr + sy * cp * sr,
      sy * cp * cr - cy * sp * sr,
      cy * cp * sr - sy * sp * cr,
    ];
    window400[i] = normalizeQ(q);
  }
  return window400;
}

