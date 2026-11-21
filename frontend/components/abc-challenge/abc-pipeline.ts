import {
  type InferenceSnapshot,
  type Quat,
  geodesicAngleDeg,
} from "@/lib/abc-challenge/lean-tcnn-engine";

/**
 * Shared description of the k8_combined pipeline.
 *
 * One numbering is used everywhere (3D badges, the rail under the viewport, the
 * inspector and the hover tooltips): the eight pipeline steps 0..7. The coarser
 * `WalkthroughStage` only groups steps for highlighting inside the 3D scene.
 */
export type WalkthroughStage = 0 | 1 | 2 | 3 | 4 | 5;
export type StepIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type Pathway = "stream0" | "stream1" | "prior";

export const STEP_COUNT = 8;

/** How long signal tracing stays on one step before the auto-walk moves to the next. */
export const TRACE_STEP_MS = 3800;
/** Share of that time the traced packet spends moving; it rests at the far end for the remainder. */
export const TRACE_TRAVEL_FRACTION = 0.8;

export interface PipelineStep {
  index: StepIndex;
  /** Short label for the rail under the viewport. */
  label: string;
  /** One-line hint under the rail label. */
  hint: string;
  name: string;
  op: string;
  tensorIn: string;
  tensorOut: string;
  params: string;
  stage: WalkthroughStage;
  /** Floating 3D badge that belongs to this step. */
  badgeId: string;
  /** Title used while tracing a signal through the network. */
  traceTitle: string;
  whatItDoes: string;
  connectionsIn: string;
  connectionsOut: string;
  whyItMatters: string;
}

export const PIPELINE_STEPS: PipelineStep[] = [
  {
    index: 0,
    label: "Pose q[t]",
    hint: "400 × 4 @ 100 Hz",
    name: "Context Quaternions",
    op: "Unit Normalize",
    tensorIn: "context [1, 400, 4]",
    tensorOut: "q[t−1], q[t] [1, 2, 4]",
    params: "0 params",
    stage: 1,
    badgeId: "pose",
    traceTitle: "Observed VR head pose stream q[t−1], q[t]",
    whatItDoes:
      "Reads the newest two unit quaternions (w, x, y, z) at 100 Hz (10 ms step) while the 3 convolutional blocks maintain the 393-sample history in streaming state buffers.",
    connectionsIn: "Raw 100 Hz XR headset orientation stream (here a QuestSet or synthetic replay clip, or the draggable head).",
    connectionsOut:
      "Feeds q[t−1] and q[t] to Native Rate (conj(q[t−1]) ⊗ q[t]), q[t] to Gravity R(q)ᵀy, and q[t] to the final Cayley quaternion multiplication.",
    whyItMatters:
      "Streaming only 1 new sample per call reduces per-step work from 400 steps to 1 step (47.2 µs CPU latency).",
  },
  {
    index: 1,
    label: "7-ch features",
    hint: "2wv · |ω|₁ · R(q)ᵀy",
    name: "Native Features (7 ch)",
    op: "2wv + |ω|₁ + R(q)ᵀy",
    tensorIn: "q[t−1], q[t] [1, 2, 4]",
    tensorOut: "features [1, 7, 1]",
    params: "0 params",
    stage: 1,
    badgeId: "inputs",
    traceTitle: "Native 7-channel feature extraction (2wv · |ω|₁ · R(q)ᵀy)",
    whatItDoes:
      "Computes 3 body-frame angular velocity channels ω = 200·w·v = 100·sin(θ)n, 1 L1 total speed channel |ωx|+|ωy|+|ωz|, and 3 head-frame world-up gravity channels R(q)ᵀy.",
    connectionsIn: "Receives q[t−1] and q[t] from the VR headset.",
    connectionsOut:
      "Splits into Stream 0 (direct) and Stream 1 (sign-flipped by M), and sends ω_step directly over the top bypass arc into the damped-velocity prior.",
    whyItMatters:
      "Gravity R(q)ᵀy is quadratic in q (ignoring q = −q sign flips and compass yaw) and cuts validation error by 0.047° across 14/15 users.",
  },
  {
    index: 2,
    label: "Mirror split",
    hint: "7 → 32 × 2 · 256p",
    name: "1×1 Mirror Split",
    op: "Sign-Flip + Conv1×1 + ReLU",
    tensorIn: "[1, 7, 2, 1]",
    tensorOut: "[1, 32, 2, 1]",
    params: "256 params",
    stage: 2,
    badgeId: "proj",
    traceTitle: "Mirror sign-flip & shared 1×1 projection (7 → 32 × 2)",
    whatItDoes:
      "Multiplies the 7 inputs by [+1, +1, +1, +1, +1, +1, +1] for Stream 0 (direct h₀) and [+1, −1, −1, +1, −1, +1, +1] for Stream 1 (mirrored h₁), then applies a shared 7→32 1×1 Conv + ReLU.",
    connectionsIn: "7 feature channels from step 1.",
    connectionsOut:
      "Outputs twin 32-channel representations [h₀; h₁] (64 channels total) into separable Block 0 and Block 0's residual skip arc.",
    whyItMatters:
      "Initializes the twin mirror streams so Stream 1 sees the exact left-right reflection M(q) = (w, x, −y, −z) of the player's motion.",
  },
  {
    index: 3,
    label: "Block 0",
    hint: "d = 1 · RF 8",
    name: "Block 0 (k=8, d=1)",
    op: "DW 1×8 + [[A,B],[B,A]] + Skip",
    tensorIn: "[1, 32, 2, 1] + State [7]",
    tensorOut: "[1, 32, 2, 1]",
    params: "2,336 params",
    stage: 3,
    badgeId: "b0",
    traceTitle: "Separable Block 0 (k=8, d=1 · RF = 80 ms)",
    whatItDoes:
      "Looks at the last 8 consecutive samples (80 ms, dilation 1) via a shared 32-ch depthwise filter, mixes Stream 0 & Stream 1 via tied pointwise weights [[A, B], [B, A]], and adds the residual skip (+ x).",
    connectionsIn:
      "Receives [h₀; h₁] from the 1×1 projection + 7 past steps from State Buffer 0 (t−7 .. t).",
    connectionsOut:
      "Sends updated [h₀; h₁] (RF = 8 samples) into separable Block 1 and Block 1's residual skip arc.",
    whyItMatters:
      "Captures high-frequency 10–80 ms micro-accelerations and immediate deceleration onset.",
  },
  {
    index: 4,
    label: "Block 1",
    hint: "d = 8 · RF 64",
    name: "Block 1 (k=8, d=8)",
    op: "DW 1×8 + [[A,B],[B,A]] + Skip",
    tensorIn: "[1, 32, 2, 1] + State [56]",
    tensorOut: "[1, 32, 2, 1]",
    params: "2,336 params",
    stage: 3,
    badgeId: "b1",
    traceTitle: "Separable Block 1 (k=8, d=8 · RF = 640 ms)",
    whatItDoes:
      "Samples 8 taps spaced 80 ms apart (t−56, t−48, ..., t; dilation 8), mixes own stream (A) and mirror stream (B) via [[A, B], [B, A]], and adds the residual skip connection.",
    connectionsIn:
      "Receives Block 0 output + 56-step sliding State Buffer 1 (covering 64 samples = 640 ms).",
    connectionsOut:
      "Sends medium-horizon features (RF = 64 samples) into separable Block 2 and Block 2's residual skip arc.",
    whyItMatters:
      "Bridges short-term velocity with full Beat Saber slash/dodge duration (~0.64 s).",
  },
  {
    index: 5,
    label: "Block 2",
    hint: "d = 47 · RF 393",
    name: "Block 2 (k=8, d=47)",
    op: "DW 1×8 + [[A,B],[B,A]] + Skip",
    tensorIn: "[1, 32, 2, 1] + State [329]",
    tensorOut: "[1, 32, 2, 1]",
    params: "2,336 params",
    stage: 3,
    badgeId: "b2",
    traceTitle: "Separable Block 2 (k=8, d=47 · RF = 3.93 s)",
    whatItDoes:
      "Samples 8 wide taps spaced 470 ms apart (t−329, t−282, ..., t; dilation 47), expanding the total receptive field to 1 + 7×(1+8+47) = 393 of the 400 context samples (3.93 s).",
    connectionsIn: "Receives Block 1 output + 329-step sliding State Buffer 2.",
    connectionsOut:
      "Feeds final twin embeddings h₀ (32 ch) and h₁ (32 ch) at t = 399 into the cubic basis readout.",
    whyItMatters:
      "Reaches 3.93 seconds into the past in just 3 blocks (vs 5–8 blocks in v6/v7), cutting ONNX node count to 51–60 nodes.",
  },
  {
    index: 6,
    label: "Cubic + prior",
    hint: "P = 3 · 291p",
    name: "Cubic Readout + Prior",
    op: "W·h₀ + S·W·h₁ + bₓ + Prior",
    tensorIn: "h₀, h₁ [32, 2] + ω_step [3]",
    tensorOut: "r_k [1, 20, 3]",
    params: "291 params",
    stage: 4,
    badgeId: "readout",
    traceTitle: "Cubic polynomial readout (P=3) + damped prior bypass",
    whatItDoes:
      "Combines Stream 0 (W·h₀) and sign-flipped Stream 1 (S·W·h₁, where S = (+1, −1, −1)) plus nod-only bias bₓ into 9 cubic coefficients (c₁, c₂, c₃), and adds the damped prior in one fused basis MatMul.",
    connectionsIn:
      "Converges Block 2's h₀ & h₁ streams with the overhead damped-velocity prior bypass (rate × τ(1 − e^(−k/τ))) from step 1.",
    connectionsOut:
      "Outputs 20 3D rotation vectors r₁ .. r₂₀ (for 10 ms .. 200 ms ahead) into the Cayley map.",
    whyItMatters:
      "Before training, head weights are 0 so the model is the 5.05° damped prior; training learns only the smooth cubic residual.",
  },
  {
    index: 7,
    label: "Cayley out",
    hint: "→ [20, 4] · 0p",
    name: "Cayley + LayerNorm",
    op: "q[t] ⊗ norm(2, r_k)",
    tensorIn: "r_k [1, 20, 3] + q[t] [1, 4]",
    tensorOut: "prediction [1, 20, 4]",
    params: "0 params",
    stage: 5,
    badgeId: "cayley",
    traceTitle: "Trig-free Cayley map (2, r_k) + LayerNorm → 200 ms trajectory",
    whatItDoes:
      "Maps each rotation vector r_k to a quaternion via the trig-free Cayley map (2, r_k), multiplies by q[t], and normalizes to unit length via the [p, −p] LayerNormalization trick.",
    connectionsIn:
      "Receives r₁..r₂₀ from the fused basis MatMul and current pose q[t] from step 0.",
    connectionsOut:
      "Returns the 20 predicted unit quaternions (10 ms .. 200 ms trajectory arc) back to the 3D VR headset.",
    whyItMatters:
      "Replaces 18 exp-map sin/cos/Sqrt/Div nodes with 1 MatMul + 1 hardware-accelerated LayerNormalization node.",
  },
];

export interface StageInfo {
  title: string;
  formula: string;
  summary: string;
  codeRef: string;
}

/** Stage-level maths and source references (stage 0 is the whole pipeline). */
export const STAGE_INFO: Record<WalkthroughStage, StageInfo> = {
  0: {
    title: "Full pipeline: 400-sample stream → 200 ms horizon",
    formula: "q[t−399 : t] ∈ ℍ₁⁴⁰⁰  ⟶  q̂[t+1 : t+20] ∈ ℍ₁²⁰",
    summary:
      "At 100 Hz, k8_combined reads 4 seconds of unit quaternions (or streams 1 new sample per call with 25,088 state floats) and forecasts the next 20 orientations (200 ms ahead) in 47–55 µs on a single CPU thread with 7,555 parameters.",
    codeRef: "best/model.py :: LeanTCNN.forward",
  },
  1: {
    title: "Native body rate (2wv) & head-frame gravity",
    formula: "d_t = q*[t−1] ⊗ q[t] = (w, v)    ω_t = 200·w·v    g_t = R(q_t)ᵀy",
    summary:
      "Instead of an expensive arccos/log map, native maps use 2wv = sin(θ)n directly, paired with L1 speed |ωx|+|ωy|+|ωz| and world-up in the head frame R(q)ᵀy. Because gravity is quadratic in q, it ignores q = −q sign flips and compass yaw while sensing head pitch/roll.",
    codeRef: "best/model.py :: LeanTCNN.features & gravity_in_head_frame",
  },
  2: {
    title: "Exact left-right mirror equivariance M(q) & twin 1×1 projection",
    formula: "M(w, x, y, z) = (w, x, −y, −z)    W_pw = [[A, B], [B, A]]",
    summary:
      "Reflecting across x = 0 keeps nod (x) and flips turn (y) and tilt (z). Two 32-channel streams watch the direct and sign-flipped inputs with tied block-circulant weights [[A, B], [B, A]]. Reflecting the input reflects the output with 0.0000° error while halving parameters from 15,113 to 7,555.",
    codeRef: "best/model.py :: mirror, RATE_SIGNS, GRAVITY_SIGNS, SeparableBlock",
  },
  3: {
    title: "3 separable dilated causal blocks (k=8, d=1/8/47)",
    formula: "RF = 1 + (8 − 1) × (1 + 8 + 47) = 393 samples (3.93 s)",
    summary:
      "Each KernelBlock runs an 8-tap depthwise causal convolution shared by both streams followed by the [[A, B], [B, A]] 1×1 pointwise mix and residual ReLU. Dilations 1, 8, and 47 span 393 of the 400 samples in just 3 blocks, minimizing ONNX graph nodes and latency.",
    codeRef: "best/model.py :: KernelBlock & receptive_field",
  },
  4: {
    title: "Damped-velocity prior bypass (τ = 100 ms) + cubic residual (P = 3)",
    formula: "r_k = ω_step · τ(1 − e^(−k/τ))  +  Σⱼ cⱼ · (k/20)ʲ,  j = 1..3",
    summary:
      "Heads move in quick bursts and decelerate: the parameter-free damped-velocity prior (τ = 100 ms) bypasses the TCN and already achieves 5.11° test error (vs 6.04° hold-last). The TCN outputs 9 cubic basis knobs (c₁, c₂, c₃ per axis, plus nod-only bias) to correct velocity, acceleration, and jerk.",
    codeRef: "best/model.py :: CompactTCNN.readout & export.py :: StreamingLean.basis",
  },
  5: {
    title: "Trig-free Cayley map & LayerNorm unit normalization",
    formula: "q̂[t+k] = normalize( q[t] ⊗ (2, r_k) )",
    summary:
      "To map each rotation vector r_k back to a unit quaternion without sin/cos or Clip nodes, the deployed graph forms (2, r_k) (the Cayley map), multiplies by q_t via a bilinear table, and normalizes to unit length using a single hardware-fast LayerNormalization node.",
    codeRef: "best/export.py :: StreamingLean.forward",
  },
};

export interface PathwayMeta {
  id: Pathway;
  label: string;
  shortLabel: string;
  dotClass: string;
  activeClass: string;
}

export const PATHWAYS: PathwayMeta[] = [
  {
    id: "stream0",
    label: "Stream 0 · direct h₀",
    shortLabel: "Direct h₀",
    dotClass: "bg-green-400",
    activeClass: "bg-green-500/20 border-green-400 text-green-200",
  },
  {
    id: "stream1",
    label: "Stream 1 · mirror twin h₁",
    shortLabel: "Mirror h₁",
    dotClass: "bg-cyan-400",
    activeClass: "bg-cyan-500/20 border-cyan-400 text-cyan-200",
  },
  {
    id: "prior",
    label: "Damped prior bypass · 0p",
    shortLabel: "Prior bypass",
    dotClass: "bg-sky-400",
    activeClass: "bg-sky-500/20 border-sky-400 text-sky-200",
  },
];

export function stageForStep(step: StepIndex | null): WalkthroughStage {
  return step === null ? 0 : PIPELINE_STEPS[step].stage;
}

export function wrapStep(value: number): StepIndex {
  return (((value % STEP_COUNT) + STEP_COUNT) % STEP_COUNT) as StepIndex;
}

/**
 * Which floating 3D badges stay fully lit for the current selection.
 * `null` means every badge is lit (overview).
 */
export function focusedBadgeIds(
  step: StepIndex | null,
  tracing: boolean,
  pathway: Pathway,
): Set<string> | null {
  if (step === null) return null;
  if (tracing && pathway === "prior" && step >= 2 && step <= 5) {
    return new Set(["prior_bypass"]);
  }
  const ids = new Set<string>([PIPELINE_STEPS[step].badgeId]);
  if (step === 0 && tracing && pathway === "stream1") ids.add("mirror_twin");
  if (step === 2) ids.add("mirror_twin");
  if (step >= 3 && step <= 5) ids.add("history");
  if (step === 6) ids.add("prior_bypass");
  return ids;
}

export interface LiveMetric {
  label: string;
  value: string;
  sub: string;
  colorClass: string;
}

export interface StepLiveDetail {
  opBadge: string;
  tensorShape: string;
  explanation: string;
  metrics: LiveMetric[];
}

const RF_LABELS = ["8 samples (80 ms)", "64 samples (640 ms)", "393 samples (3.93 s)"];
const STATE_SIZES = ["[32, 2, 7]", "[32, 2, 56]", "[32, 2, 329]"];

const mean = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
const vec = (values: number[], digits: number) =>
  `[${values.map((v) => v.toFixed(digits)).join(", ")}]`;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/** Live, pathway-aware readout for one pipeline step. */
export function buildStepLiveDetail(
  step: StepIndex,
  pathway: Pathway,
  snapshot: InferenceSnapshot | null,
  groundTruthFuture: Quat[] | null,
): StepLiveDetail {
  if (!snapshot) {
    return {
      opBadge: "Waiting for stream…",
      tensorShape: "[1, 400, 4]",
      explanation: "Loading inference snapshot…",
      metrics: [],
    };
  }

  const pathwayLabel =
    pathway === "stream0"
      ? "Stream 0 (direct h₀)"
      : pathway === "stream1"
        ? "Stream 1 (mirror twin h₁)"
        : "Damped prior bypass (0p)";

  switch (step) {
    case 0: {
      const q = pathway === "stream1" ? snapshot.mirroredLastQ : snapshot.lastQ;
      return {
        opBadge:
          pathway === "stream1"
            ? "M(w, x, y, z) = (w, x, −y, −z)"
            : "Unit quaternion stream @ 100 Hz",
        tensorShape: "q[t−1], q[t] ∈ ℝ⁴ (‖q‖₂ = 1)",
        explanation:
          pathway === "stream1"
            ? "To guarantee exact left-right symmetry across the sagittal plane (x = 0), Stream 1 observes the reflected orientation M(q) = (w, x, −y, −z): pitch/nod (x) is unchanged while yaw/turn (y) and roll/tilt (z) negate."
            : "At each 10 ms tick (100 Hz), the model reads the newest headset orientation q[t] and previous sample q[t−1] while the 3 dilated TCN blocks hold the 393-sample history in compact FIFO state buffers.",
        metrics: [
          {
            label: pathway === "stream1" ? "Mirrored M(q[t])" : "Observed q[t]",
            value: vec(q, 3),
            sub: "w, x (nod), y (turn), z (tilt)",
            colorClass: "text-green-300",
          },
          {
            label: "Step rate 2wv (rad/step)",
            value: vec(snapshot.stepRateRad, 4),
            sub: `ω = [${snapshot.velocityDegPerSec.map((v) => `${v.toFixed(1)}°/s`).join(", ")}]`,
            colorClass: "text-cyan-300",
          },
          {
            label: "Active pathway",
            value: pathwayLabel,
            sub: "10 ms frame step (100 Hz)",
            colorClass: "text-amber-300",
          },
          {
            label: "Mirror equivariance Δ",
            value: `${snapshot.mirrorEquivarianceErrorDeg.toFixed(6)}°`,
            sub: "Exact symmetry guarantee",
            colorClass: "text-emerald-300",
          },
        ],
      };
    }
    case 1: {
      const feats = pathway === "stream1" ? snapshot.inputFeatures1 : snapshot.inputFeatures0;
      return {
        opBadge: "ω = 200·w·v  |  |ω|₁ = Σ|ωᵢ|  |  g = R(q)ᵀy",
        tensorShape: "[1, 2, 4] → [1, 7, 1] (0 params)",
        explanation:
          pathway === "stream1"
            ? "Instead of running the quaternion math twice, Stream 1 multiplies the 7 native features by RATE_SIGNS = (+1, −1, −1), SPEED = (+1), and GRAVITY_SIGNS = (−1, +1, +1), flipping ω_y, ω_z, and g_x."
            : pathway === "prior"
              ? "The 3 native angular rate channels ω = 200·w·v = 100·sin(θ)n are extracted without arccos/Sqrt and routed directly into the overhead damped-velocity prior bypass."
              : "Computes 3 body-frame angular velocity channels (200·w·v), 1 L1 total speed channel (|ω_x|+|ω_y|+|ω_z|), and 3 head-frame world-up gravity channels R(q)ᵀy (quadratic in q, invariant to q = −q and compass yaw).",
        metrics: [
          {
            label: "Body rate ω (rad/s)",
            value: vec(feats.slice(0, 3), 2),
            sub: pathway === "stream1" ? "Signs: (+1, −1, −1)" : "Nod (x), turn (y), tilt (z)",
            colorClass: "text-green-300",
          },
          {
            label: "L1 speed |ω|₁",
            value: `${feats[3].toFixed(2)} rad/s`,
            sub: "|ω_x| + |ω_y| + |ω_z| (even)",
            colorClass: "text-amber-300",
          },
          {
            label: "Head gravity R(q)ᵀy",
            value: vec(feats.slice(4, 7), 2),
            sub: pathway === "stream1" ? "Signs: (−1, +1, +1)" : "World-up in head frame",
            colorClass: "text-lime-300",
          },
          {
            label: "Step angle ω_step",
            value: `[${snapshot.stepRateRad.map((v) => `${toDeg(v).toFixed(2)}°`).join(", ")}]`,
            sub: "Per-10 ms step rotation",
            colorClass: "text-cyan-300",
          },
        ],
      };
    }
    case 2: {
      const acts = pathway === "stream1" ? snapshot.projActivations1 : snapshot.projActivations0;
      const other = pathway === "stream1" ? snapshot.projActivations0 : snapshot.projActivations1;
      const maxAct = Math.max(...acts);
      const peakCh = acts.indexOf(maxAct);
      return {
        opBadge:
          pathway === "prior"
            ? "Overhead bypass: skips the 1×1 conv"
            : "Shared Conv1d(7 → 32, k=1) + ReLU (256 params)",
        tensorShape: "[1, 7, 2, 1] → [1, 32, 2, 1]",
        explanation:
          pathway === "prior"
            ? "The damped-velocity prior bypasses the 1×1 projection and all 3 TCN blocks entirely, carrying ω_step = 2wv overhead with 0 learned parameters."
            : pathway === "stream1"
              ? "Stream 1 applies the exact same 7→32 1×1 weight matrix W_proj and bias as Stream 0 to the sign-flipped 7-channel vector, producing the 32-channel mirrored embedding h₁."
              : "Lifts the 7 physical channels (velocity, speed, gravity) into 32 non-linear feature channels h₀ via a 1×1 pointwise convolution + ReLU shared identically across both mirror streams.",
        metrics: [
          {
            label: pathway === "stream1" ? "Stream 1 (h₁) mean" : "Stream 0 (h₀) mean",
            value: mean(acts).toFixed(3),
            sub: "32 channels post-ReLU",
            colorClass: pathway === "stream1" ? "text-cyan-300" : "text-green-300",
          },
          {
            label: "Peak channel activation",
            value: `ch[${peakCh}] = ${maxAct.toFixed(2)}`,
            sub: `${acts.filter((v) => v > 0).length}/32 channels active`,
            colorClass: "text-emerald-300",
          },
          {
            label: "Other stream mean",
            value: mean(other).toFixed(3),
            sub: "Twin mirror stream",
            colorClass: "text-teal-300",
          },
          {
            label: "Layer parameters",
            value: "256 params",
            sub: "224 weights + 32 biases",
            colorClass: "text-amber-300",
          },
        ],
      };
    }
    case 3:
    case 4:
    case 5: {
      const bIdx = step - 3;
      const blk = snapshot.blocks[bIdx];
      const mirror = pathway === "stream1";
      const acts = mirror ? blk.activations1 : blk.activations0;
      const ownNorm = mirror ? blk.ownStreamNorm1 : blk.ownStreamNorm0;
      const crossNorm = mirror ? blk.crossStreamNorm1 : blk.crossStreamNorm0;
      const tapE = mirror ? blk.tapEnergies1 : blk.tapEnergies0;
      return {
        opBadge:
          pathway === "prior"
            ? `Overhead bypass: above Block ${bIdx} (d=${blk.dilation})`
            : `DW Conv1d(k=8, d=${blk.dilation}) → [[A,B],[B,A]] 1×1 → ReLU(y + x)`,
        tensorShape: `[1, 32, 2, 1] + State ${STATE_SIZES[bIdx]} → [1, 32, 2, 1]`,
        explanation:
          pathway === "prior"
            ? `While Block ${bIdx} processes ${RF_LABELS[bIdx]} of history below, the damped-velocity prior travels untouched along the overhead cyan bypass tube toward the readout.`
            : mirror
              ? `Block ${bIdx} pulls 8 causal taps spaced by d=${blk.dilation} (${blk.dilation * 10} ms) from the local k=8 comb, then mixes Stream 1's own features (A·h₁) with Stream 0's features across the central X-bridge (B·h₀) via y₁ = ReLU(A·h₁ + B·h₀ + b + x₁).`
              : `Block ${bIdx} runs an 8-tap depthwise causal filter (dilation d=${blk.dilation}, cumulative RF = ${RF_LABELS[bIdx]}), mixes own stream (A·h₀) with the mirror stream across the X-bridge (B·h₁), and adds the overhead residual skip (+ x₀).`,
        metrics: [
          {
            label: mirror ? "Own stream ‖A·h₁‖₂" : "Own stream ‖A·h₀‖₂",
            value: ownNorm.toFixed(2),
            sub: "Direct stream contribution",
            colorClass: "text-green-300",
          },
          {
            label: mirror ? "Cross bridge ‖B·h₀‖₂" : "Cross bridge ‖B·h₁‖₂",
            value: crossNorm.toFixed(2),
            sub: "[[A,B],[B,A]] X-coupling",
            colorClass: "text-cyan-300",
          },
          {
            label: `k=8 tap energy (d=${blk.dilation})`,
            value: `t₀ = ${tapE[0].toFixed(2)} · t₇ = ${tapE[7].toFixed(2)}`,
            sub: `RF: ${RF_LABELS[bIdx]}`,
            colorClass: "text-purple-300",
          },
          {
            label: "Post-ReLU output mean",
            value: mean(acts).toFixed(3),
            sub: "2,336 params in block",
            colorClass: "text-emerald-300",
          },
        ],
      };
    }
    case 6: {
      const c = snapshot.readout.coefficients;
      const s20 = snapshot.horizonSteps[19];
      const priorDeg = toDeg(Math.hypot(...s20.priorRotVec));
      const resDeg = toDeg(Math.hypot(...s20.residualRotVec));
      return {
        opBadge: "c = W·h₀ + S·(W·h₁) + bₓ  |  r_k = Prior_k + Σ cⱼ(k/20)ʲ",
        tensorShape: "h₀, h₁ [32, 2] + ω_step [3] → r₁..₂₀ [1, 20, 3]",
        explanation:
          pathway === "prior"
            ? "Here the overhead damped-velocity prior (rate × τ(1 − e^(−k/τ)), τ = 100 ms) lands in the fused basis MatMul and combines with the TCN's 9 cubic residual coefficients to form the 20 rotation vectors r₁..r₂₀."
            : pathway === "stream1"
              ? "Stream 1's final 32-ch embedding h₁ is projected to 9 cubic coefficients (W·h₁) and multiplied by S = (+1, −1, −1) on (nod, turn, tilt) before summing with W·h₀ + bₓ and the overhead damped prior."
              : "Projects h₀ and sign-flipped h₁ into 9 cubic polynomial knobs (c₁ linear, c₂ quadratic, c₃ cubic for pitch/yaw/roll) plus nod-only bias bₓ, and sums with the damped-velocity prior across all 20 horizon steps.",
        metrics: [
          {
            label: "c₁ (linear velocity knob)",
            value: vec(c[0], 3),
            sub: "Pitch (x), yaw (y), roll (z)",
            colorClass: "text-amber-300",
          },
          {
            label: "c₂ & c₃ (accel / jerk)",
            value: `‖c₂‖ = ${Math.hypot(...c[1]).toFixed(3)} · ‖c₃‖ = ${Math.hypot(...c[2]).toFixed(3)}`,
            sub: `Nod bias bₓ[0] = ${snapshot.readout.nodBias[0].toFixed(3)}`,
            colorClass: "text-orange-300",
          },
          {
            label: "200 ms prior + residual",
            value: `${priorDeg.toFixed(2)}° + ${resDeg.toFixed(2)}°`,
            sub: "Damped prior + TCN cubic",
            colorClass: "text-cyan-300",
          },
          {
            label: "Stream 0 vs Stream 1",
            value: `${Math.hypot(...snapshot.readout.ownKnobs[0]).toFixed(2)} vs ${Math.hypot(...snapshot.readout.mirrorKnobsFlipped[0]).toFixed(2)}`,
            sub: "‖W·h₀‖ vs ‖S·W·h₁‖",
            colorClass: "text-green-300",
          },
        ],
      };
    }
    case 7:
    default: {
      const q20 = snapshot.trajectories.k8Combined[19];
      const s20 = snapshot.horizonSteps[19];
      const hasTruth = !!groundTruthFuture && groundTruthFuture.length >= 20;
      const errK8 = hasTruth ? geodesicAngleDeg(q20, groundTruthFuture![19]) : null;
      const errPrior = hasTruth
        ? geodesicAngleDeg(snapshot.trajectories.dampedPrior[19], groundTruthFuture![19])
        : null;
      return {
        opBadge: "q̂[t+k] = LayerNorm(q[t] ⊗ (2, r_k))",
        tensorShape: "r_k [1, 20, 3] + q[t] [1, 4] → q̂ [1, 20, 4] (0 params)",
        explanation:
          "Forms the trig-free Cayley quaternion (2, r_k) for all 20 steps (10..200 ms), multiplies by current pose q[t] via a 4×4 bilinear table, and normalizes to unit length via a single [p, −p] LayerNormalization node before returning to the VR headset.",
        metrics: [
          {
            label: "Cayley vector (2, r₂₀)",
            value: `[2, ${s20.combinedRotVec.map((v) => v.toFixed(3)).join(", ")}]`,
            sub: "Trig-free rotation delta",
            colorClass: "text-emerald-300",
          },
          {
            label: "Predicted q̂(t + 200 ms)",
            value: vec(q20, 3),
            sub: "Unit quaternion ‖q̂‖₂ = 1",
            colorClass: "text-green-300",
          },
          {
            label: "200 ms geodesic error",
            value: errK8 !== null ? `${errK8.toFixed(2)}°` : "Interactive mode",
            sub:
              errPrior !== null ? `vs ${errPrior.toFixed(2)}° damped prior` : "No ground truth to score",
            colorClass: "text-amber-300",
          },
          {
            label: "Total CPU inference",
            value: "47.2 – 56.1 µs",
            sub: "51–60 ONNX nodes · 7,555p",
            colorClass: "text-cyan-300",
          },
        ],
      };
    }
  }
}

/** Live readout for the whole pipeline, shown while no single step is selected. */
export function buildOverviewMetrics(
  snapshot: InferenceSnapshot | null,
  groundTruthFuture: Quat[] | null,
): LiveMetric[] {
  if (!snapshot) return [];
  const s20 = snapshot.horizonSteps[19];
  const q20 = snapshot.trajectories.k8Combined[19];
  const hasTruth = !!groundTruthFuture && groundTruthFuture.length >= 20;
  const errK8 = hasTruth ? geodesicAngleDeg(q20, groundTruthFuture![19]) : null;
  const errPrior = hasTruth
    ? geodesicAngleDeg(snapshot.trajectories.dampedPrior[19], groundTruthFuture![19])
    : null;
  return [
    {
      label: "200 ms geodesic error",
      value: errK8 !== null ? `${errK8.toFixed(2)}°` : "Interactive mode",
      sub: errPrior !== null ? `vs ${errPrior.toFixed(2)}° damped prior` : "No ground truth to score",
      colorClass: "text-green-300",
    },
    {
      label: "200 ms prior + residual",
      value: `${toDeg(Math.hypot(...s20.priorRotVec)).toFixed(2)}° + ${toDeg(Math.hypot(...s20.residualRotVec)).toFixed(2)}°`,
      sub: "Damped prior + TCN cubic",
      colorClass: "text-cyan-300",
    },
    {
      label: "L1 speed |ω|₁",
      value: `${snapshot.l1Speed.toFixed(2)} rad/s`,
      sub: `${toDeg(snapshot.l1Speed).toFixed(0)}°/s across 3 axes`,
      colorClass: "text-amber-300",
    },
    {
      label: "Mirror equivariance Δ",
      value: `${snapshot.mirrorEquivarianceErrorDeg.toFixed(6)}°`,
      sub: "f(M(q)) vs M(f(q)) at 200 ms",
      colorClass: "text-emerald-300",
    },
  ];
}
