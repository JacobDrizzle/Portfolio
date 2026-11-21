import {
  type InferenceSnapshot,
  type Quat,
  ROTATION_SIGNS,
  geodesicAngleDeg,
} from "@/lib/abc-challenge/lean-tcnn-engine";
import { type StepIndex, PIPELINE_STEPS } from "./abc-pipeline";
import type { TapProfile } from "./abc-model-stats";

export type HoverTargetMeta =
  | { kind: "input_feature"; featureIdx: number; streamIdx: 0 | 1 }
  | { kind: "sign_flip_bridge"; featureIdx: number }
  | { kind: "input_trunk"; trunkIdx: 0 | 1 | 2 }
  | { kind: "collector_bus"; streamIdx: 0 | 1 }
  | { kind: "feature_bar"; stageIdx: 0 | 1 | 2 | 3; streamIdx: 0 | 1; channelIdx: number }
  | { kind: "stage_slab"; stageIdx: 0 | 1 | 2 | 3; streamIdx: 0 | 1 }
  | { kind: "own_conduit"; blockIdx: 0 | 1 | 2; streamIdx: 0 | 1 }
  | { kind: "cross_bridge"; blockIdx: 0 | 1 | 2; fromStream: 0 | 1 }
  | { kind: "x_gate_node"; blockIdx: 0 | 1 | 2 }
  | { kind: "residual_skip"; blockIdx: 0 | 1 | 2; streamIdx: 0 | 1 }
  | { kind: "kernel_comb_tap"; blockIdx: 0 | 1 | 2; tapIdx: number }
  | { kind: "kernel_comb_bar"; blockIdx: 0 | 1 | 2 }
  | { kind: "feeder_bus"; blockIdx: 0 | 1 | 2 }
  | { kind: "rf_rail"; blockIdx: 0 | 1 | 2 }
  | { kind: "timeline_tap"; blockIdx: 0 | 1 | 2; tapIdx: number }
  | { kind: "timeline_deck"; tickIdx?: number }
  | { kind: "prior_bypass" }
  | { kind: "readout_knob"; basisIdx: 0 | 1 | 2; axisIdx: 0 | 1 | 2 }
  | { kind: "cayley_orb" }
  | { kind: "return_arc" }
  | { kind: "vr_headset"; isMirror: boolean }
  | { kind: "mirror_plane" }
  | { kind: "gravity_ring" }
  | {
      kind: "trajectory_curve";
      trajKind: "k8" | "prior" | "const_vel" | "ground_truth" | "mirror_k8" | "error_arc";
    }
  | { kind: "floating_badge"; badgeId: string };

/**
 * The pipeline step (0..7) a hovered 3D element belongs to, so clicking it selects
 * that step in the rail and inspector.
 */
export function stepForHoverMeta(meta: HoverTargetMeta): StepIndex {
  switch (meta.kind) {
    case "vr_headset":
      return meta.isMirror ? 2 : 0;
    case "gravity_ring":
    case "input_feature":
    case "input_trunk":
      return 1;
    case "mirror_plane":
    case "sign_flip_bridge":
    case "collector_bus":
      return 2;
    case "feature_bar":
    case "stage_slab":
      return (2 + meta.stageIdx) as StepIndex;
    case "own_conduit":
    case "cross_bridge":
    case "x_gate_node":
    case "residual_skip":
    case "kernel_comb_tap":
    case "kernel_comb_bar":
    case "feeder_bus":
    case "rf_rail":
    case "timeline_tap":
      return (3 + meta.blockIdx) as StepIndex;
    case "timeline_deck":
      return 5;
    case "prior_bypass":
    case "readout_knob":
      return 6;
    case "cayley_orb":
    case "return_arc":
    case "trajectory_curve":
      return 7;
    case "floating_badge": {
      const owner = PIPELINE_STEPS.find((s) => s.badgeId === meta.badgeId);
      if (owner) return owner.index;
      if (meta.badgeId === "mirror_twin") return 2;
      if (meta.badgeId === "history") return 5;
      return 6; // prior_bypass lands in the readout
    }
  }
}

export interface HoverTooltipMetric {
  label: string;
  value: string;
  sub?: string;
  colorClass: string;
}

export interface HoverTooltipContent {
  categoryBadge: string;
  title: string;
  subtitle: string;
  formula: string;
  description: string;
  borderClass: string;
  badgeClass: string;
  highlightHex: number;
  metrics: HoverTooltipMetric[];
}

interface InputChannelMeta {
  symbol: string;
  name: string;
  groupName: string;
  unit: string;
  sign: 1 | -1;
  formula: string;
  whatItIs: string;
}

const INPUT_CHANNEL_INFO: InputChannelMeta[] = [
  {
    symbol: "ω_x",
    name: "Pitch / Nod Angular Rate",
    groupName: "Body Angular Velocity (2wv)",
    unit: "rad/s",
    sign: 1,
    formula: "ω_x = 200 · w · v_x  (d_t = q_{t-1}^* ⊗ q_t)",
    whatItIs:
      "Measures head pitching up/down in the local headset frame using the trig-free native quaternion step product 2wv = sin(θ)n. Even (+1) under left-right mirror reflection because nodding doesn't invert in a mirror.",
  },
  {
    symbol: "ω_y",
    name: "Yaw / Turn Angular Rate",
    groupName: "Body Angular Velocity (2wv)",
    unit: "rad/s",
    sign: -1,
    formula: "ω_y = 200 · w · v_y  (Mirror Sign: −1)",
    whatItIs:
      "Measures horizontal head turning left/right at 100 Hz. Odd (−1) under sagittal reflection M(q) = (w, x, −y, −z): turning left in the real world corresponds to turning right in the mirror twin stream.",
  },
  {
    symbol: "ω_z",
    name: "Roll / Tilt Angular Rate",
    groupName: "Body Angular Velocity (2wv)",
    unit: "rad/s",
    sign: -1,
    formula: "ω_z = 200 · w · v_z  (Mirror Sign: −1)",
    whatItIs:
      "Measures ear-to-shoulder head tilting (roll). Odd (−1) under sagittal mirror reflection: tilting left negates to tilting right in Stream 1.",
  },
  {
    symbol: "|ω|₁",
    name: "L1 Total Angular Speed",
    groupName: "Non-Linear Motion Magnitude",
    unit: "rad/s",
    sign: 1,
    formula: "|ω|₁ = |ω_x| + |ω_y| + |ω_z|  (Mirror Sign: +1)",
    whatItIs:
      "Gives the linear 1×1 projection immediate access to total angular speed without waiting for deeper ReLU layers to approximate norms, helping detect rapid Beat Saber slash onset and braking. Even (+1) under reflection.",
  },
  {
    symbol: "g_x",
    name: "Head-Frame Gravity (Lateral X)",
    groupName: "World-Up Gravity Vector R(q)ᵀy",
    unit: "g",
    sign: -1,
    formula: "g_x = 2(x·y + w·z)  (Mirror Sign: −1)",
    whatItIs:
      "Projects world vertical up (+y) onto the headset's left-right X axis. Tells the TCN how far the player's head is rolled sideways relative to gravity, providing a natural restoring cue toward level posture. Odd (−1) under reflection.",
  },
  {
    symbol: "g_y",
    name: "Head-Frame Gravity (Vertical Y)",
    groupName: "World-Up Gravity Vector R(q)ᵀy",
    unit: "g",
    sign: 1,
    formula: "g_y = w² − x² + y² − z²  (Mirror Sign: +1)",
    whatItIs:
      "Projects world up (+y) onto the headset's vertical Y axis (≈ +1.0 when upright). Quadratic in q, so it is strictly invariant to q = −q sign flips and horizontal compass yaw. Even (+1) under reflection.",
  },
  {
    symbol: "g_z",
    name: "Head-Frame Gravity (Forward Z)",
    groupName: "World-Up Gravity Vector R(q)ᵀy",
    unit: "g",
    sign: 1,
    formula: "g_z = 2(y·z − w·x)  (Mirror Sign: +1)",
    whatItIs:
      "Projects world up (+y) onto the headset's forward gaze Z axis. Measures how far the user is looking up or down relative to the horizon, improving 200 ms validation error on 14 of 15 users (−0.047°). Even (+1) under reflection.",
  },
];

const STAGE_TOWER_META: {
  name: string;
  shortName: string;
  op: string;
  rf: string;
  stateShape: string;
  params: string;
  role: string;
}[] = [
  {
    name: "Step 2 · 1×1 Mirror Split Projection",
    shortName: "1×1 Mirror Split",
    op: "Shared Conv1d(7 → 32, k=1) + ReLU",
    rf: "1 sample (10 ms)",
    stateShape: "Stateless [1, 32, 2, 1]",
    params: "256 params (224W + 32b)",
    role: "Projects the 7 physical input channels (angular velocity, L1 speed, head gravity) into 32 non-linear feature channels using identical weights for both Stream 0 (direct h₀) and Stream 1 (sign-flipped mirror twin h₁).",
  },
  {
    name: "Step 3 · Separable TCN Block 0 (k=8, d=1)",
    shortName: "TCN Block 0 (d=1)",
    op: "DW Conv1d(k=8, d=1) → [[A,B],[B,A]] 1×1 → ReLU(y + x)",
    rf: "8 samples (80 ms)",
    stateShape: "FIFO State [32, 2, 7]",
    params: "2,336 params",
    role: "Convolves 8 consecutive 10 ms frames (last 80 ms) with a shared 32-ch depthwise filter, mixes twin streams through the [[A,B],[B,A]] gate, and adds the residual skip to capture high-frequency micro-accelerations.",
  },
  {
    name: "Step 4 · Separable TCN Block 1 (k=8, d=8)",
    shortName: "TCN Block 1 (d=8)",
    op: "DW Conv1d(k=8, d=8) → [[A,B],[B,A]] 1×1 → ReLU(y + x)",
    rf: "64 samples (640 ms)",
    stateShape: "FIFO State [32, 2, 56]",
    params: "2,336 params",
    role: "Samples 8 causal taps spaced 80 ms apart (dilation d=8), expanding the receptive field to 64 samples (640 ms) to span complete head turns, Beat Saber swings, and braking phases.",
  },
  {
    name: "Step 5 · Separable TCN Block 2 (k=8, d=47)",
    shortName: "TCN Block 2 (d=47)",
    op: "DW Conv1d(k=8, d=47) → [[A,B],[B,A]] 1×1 → ReLU(y + x)",
    rf: "393 samples (3.93 s)",
    stateShape: "FIFO State [32, 2, 329]",
    params: "2,336 params",
    role: "Samples 8 wide causal taps spaced 470 ms apart (dilation d=47), expanding the total receptive field to 1 + 7×(1+8+47) = 393 of the 400 context samples (3.93 s) in just 3 blocks.",
  },
];

export function buildHoverTooltipContent(
  meta: HoverTargetMeta,
  snapshot: InferenceSnapshot | null,
  groundTruthFuture: Quat[] | null,
  contextWindow?: Quat[],
  tapProfiles?: TapProfile[] | null,
): HoverTooltipContent {
  switch (meta.kind) {
    case "input_feature": {
      const ch = INPUT_CHANNEL_INFO[meta.featureIdx] ?? INPUT_CHANNEL_INFO[0];
      const v0 = snapshot ? snapshot.inputFeatures0[meta.featureIdx] : 0;
      const v1 = snapshot ? snapshot.inputFeatures1[meta.featureIdx] : 0;
      const isMirror = meta.streamIdx === 1;
      const degVal =
        meta.featureIdx < 4 ? `${(((isMirror ? v1 : v0) * 180) / Math.PI).toFixed(1)}°/s` : "Unit vector component";

      return {
        categoryBadge: isMirror
          ? `STEP 1 · STREAM 1 MIRROR INPUT (ch ${meta.featureIdx}/6)`
          : `STEP 1 · STREAM 0 DIRECT INPUT (ch ${meta.featureIdx}/6)`,
        title: `${ch.symbol} — ${ch.name}`,
        subtitle: `${ch.groupName} · Mirror Sign: ${ch.sign > 0 ? "+1 (Even)" : "−1 (Odd Sign-Flip)"}`,
        formula: isMirror ? `${ch.symbol}^{(1)} = (${ch.sign > 0 ? "+1" : "−1"}) · ${ch.symbol}^{(0)}` : ch.formula,
        description: ch.whatItIs,
        borderClass: isMirror ? "border-cyan-400/90" : ch.sign < 0 ? "border-amber-400/90" : "border-green-400/90",
        badgeClass: isMirror
          ? "bg-cyan-500/20 text-cyan-200 border-cyan-400/50"
          : "bg-green-500/20 text-green-200 border-green-400/50",
        highlightHex: isMirror ? 0x22d3ee : ch.sign < 0 ? 0xf59e0b : 0x4ade80,
        metrics: [
          {
            label: "Stream 0 (Direct)",
            value: `${v0.toFixed(3)} ${ch.unit}`,
            sub: meta.featureIdx < 4 ? `${((v0 * 180) / Math.PI).toFixed(1)}°/s` : "Observed head frame",
            colorClass: "text-green-300",
          },
          {
            label: "Stream 1 (Mirrored)",
            value: `${v1.toFixed(3)} ${ch.unit}`,
            sub: ch.sign < 0 ? "Negated (−1) by M(q)" : "Unchanged (+1) by M(q)",
            colorClass: ch.sign < 0 ? "text-orange-300" : "text-cyan-300",
          },
          {
            label: "Mirror Parity",
            value: ch.sign > 0 ? "+1 (Symmetric)" : "−1 (Anti-Symmetric)",
            sub: degVal,
            colorClass: ch.sign > 0 ? "text-emerald-300" : "text-amber-300",
          },
        ],
      };
    }

    case "sign_flip_bridge": {
      const ch = INPUT_CHANNEL_INFO[meta.featureIdx] ?? INPUT_CHANNEL_INFO[0];
      const v0 = snapshot ? snapshot.inputFeatures0[meta.featureIdx] : 0;
      const v1 = snapshot ? snapshot.inputFeatures1[meta.featureIdx] : 0;
      const isFlipped = ch.sign < 0;
      return {
        categoryBadge: isFlipped
          ? "STEP 2 · MIRROR SIGN-FLIP GATE (−1)"
          : "STEP 2 · MIRROR PARITY BRIDGE (+1)",
        title: `${ch.symbol} Stream-1 Sign Gate (${isFlipped ? "× −1 Negate" : "× +1 Preserve"})`,
        subtitle: `INPUT_SIGNS[${meta.featureIdx}] = ${isFlipped ? "−1" : "+1"} · Zero-Cost Reflection`,
        formula: `x₁[${meta.featureIdx}] = (${isFlipped ? "−1" : "+1"}) · x₀[${meta.featureIdx}]`,
        description: isFlipped
          ? `Instead of recomputing quaternion products on the mirrored headset M(q), Stream 1 simply multiplies ${ch.symbol} by −1 (orange wire) because ${ch.name.toLowerCase()} reverses direction under left-right reflection across x = 0.`
          : `Because ${ch.name.toLowerCase()} (${ch.symbol}) is symmetric across the sagittal plane (x = 0), Stream 1 receives the exact same value (+1 green wire) as Stream 0.`,
        borderClass: isFlipped ? "border-orange-400/90" : "border-green-400/90",
        badgeClass: isFlipped
          ? "bg-orange-500/20 text-orange-200 border-orange-400/50"
          : "bg-green-500/20 text-green-200 border-green-400/50",
        highlightHex: isFlipped ? 0xf97316 : 0x22c55e,
        metrics: [
          {
            label: `In (Stream 0 ${ch.symbol})`,
            value: `${v0.toFixed(3)} ${ch.unit}`,
            sub: "Direct feature",
            colorClass: "text-green-300",
          },
          {
            label: "Gate Multiplier",
            value: isFlipped ? "× −1 (Odd)" : "× +1 (Even)",
            sub: `INPUT_SIGNS[${meta.featureIdx}]`,
            colorClass: isFlipped ? "text-orange-300" : "text-emerald-300",
          },
          {
            label: `Out (Stream 1 ${ch.symbol})`,
            value: `${v1.toFixed(3)} ${ch.unit}`,
            sub: "Mirrored twin feature",
            colorClass: "text-cyan-300",
          },
        ],
      };
    }

    case "input_trunk": {
      const trunks = [
        {
          badge: "STEP 1 · ANGULAR VELOCITY TRUNK",
          title: "Body-Frame Angular Rate Trunk (2wv)",
          sub: "3 Channels: ω_x (Nod), ω_y (Turn), ω_z (Tilt)",
          formula: "d_t = q_{t-1}^* ⊗ q_t = (w, v),   ω = 200 · w · v",
          desc: "Extracts 3D body-frame angular velocity from consecutive 100 Hz quaternions without expensive arccos or sin/Sqrt calls, using 2wv = sin(θ)n directly.",
          hex: 0x4ade80,
          border: "border-green-400/90",
          badgeCls: "bg-green-500/20 text-green-200 border-green-400/50",
        },
        {
          badge: "STEP 1 · L1 SPEED TRUNK",
          title: "Non-Linear L1 Angular Speed Trunk (|ω|₁)",
          sub: "1 Channel: |ω_x| + |ω_y| + |ω_z|",
          formula: "|ω|₁ = |ω_x| + |ω_y| + |ω_z| ∈ ℝ⁺",
          desc: "Feeds total rotational speed directly into the first layer so the network can immediately gate high-velocity saccades vs. stationary fixation.",
          hex: 0xf59e0b,
          border: "border-amber-400/90",
          badgeCls: "bg-amber-500/20 text-amber-200 border-amber-400/50",
        },
        {
          badge: "STEP 1 · HEAD-FRAME GRAVITY TRUNK",
          title: "World-Up Gravity Trunk R(q)ᵀy",
          sub: "3 Channels: g_x (Side), g_y (Up), g_z (Forward)",
          formula: "g_t = R(q_t)^T [0, 1, 0]^T  (||g_t||₂ = 1)",
          desc: "Projects the world vertical up vector into the local headset frame. Quadratic in q, invariant to q = −q and compass yaw, and anchors head pitch/roll orientation.",
          hex: 0xa3e635,
          border: "border-lime-400/90",
          badgeCls: "bg-lime-500/20 text-lime-200 border-lime-400/50",
        },
      ][meta.trunkIdx];

      const f0 = snapshot?.inputFeatures0 ?? [0, 0, 0, 0, 0, 0, 0];
      return {
        categoryBadge: trunks.badge,
        title: trunks.title,
        subtitle: trunks.sub,
        formula: trunks.formula,
        description: trunks.desc,
        borderClass: trunks.border,
        badgeClass: trunks.badgeCls,
        highlightHex: trunks.hex,
        metrics:
          meta.trunkIdx === 0
            ? [
                {
                  label: "ω_x (Nod)",
                  value: `${f0[0].toFixed(2)} r/s`,
                  sub: `${((f0[0] * 180) / Math.PI).toFixed(0)}°/s`,
                  colorClass: "text-cyan-300",
                },
                {
                  label: "ω_y (Turn)",
                  value: `${f0[1].toFixed(2)} r/s`,
                  sub: `${((f0[1] * 180) / Math.PI).toFixed(0)}°/s`,
                  colorClass: "text-green-300",
                },
                {
                  label: "ω_z (Tilt)",
                  value: `${f0[2].toFixed(2)} r/s`,
                  sub: `${((f0[2] * 180) / Math.PI).toFixed(0)}°/s`,
                  colorClass: "text-amber-300",
                },
              ]
            : meta.trunkIdx === 1
              ? [
                  {
                    label: "L1 Speed |ω|₁",
                    value: `${f0[3].toFixed(2)} rad/s`,
                    sub: `${((f0[3] * 180) / Math.PI).toFixed(0)}°/s L1 sum`,
                    colorClass: "text-amber-300",
                  },
                  {
                    label: "L2 Speed ||ω||₂",
                    value: `${Math.hypot(f0[0], f0[1], f0[2]).toFixed(2)} rad/s`,
                    sub: "Euclidean angular rate",
                    colorClass: "text-green-300",
                  },
                ]
              : [
                  {
                    label: "g_x (Lateral)",
                    value: f0[4].toFixed(3),
                    sub: "Roll tilt component",
                    colorClass: "text-lime-300",
                  },
                  {
                    label: "g_y (Vertical)",
                    value: f0[5].toFixed(3),
                    sub: "+1.0 when upright",
                    colorClass: "text-green-300",
                  },
                  {
                    label: "g_z (Forward)",
                    value: f0[6].toFixed(3),
                    sub: "Pitch nod component",
                    colorClass: "text-emerald-300",
                  },
                ],
      };
    }

    case "collector_bus": {
      const isMirror = meta.streamIdx === 1;
      const feats = snapshot
        ? isMirror
          ? snapshot.inputFeatures1
          : snapshot.inputFeatures0
        : [0, 0, 0, 0, 0, 0, 0];
      return {
        categoryBadge: isMirror
          ? "STEP 2 · STREAM 1 INPUT MANIFOLD BUS"
          : "STEP 2 · STREAM 0 INPUT MANIFOLD BUS",
        title: isMirror
          ? "Stream 1 (Mirrored) 7-Channel Input Bus"
          : "Stream 0 (Direct) 7-Channel Input Bus",
        subtitle: "Bundles 7 Native Features → Shared 1×1 Conv1d(7 → 32)",
        formula: isMirror
          ? "x₁ = INPUT_SIGNS ⊙ x₀ ∈ ℝ⁷ ⟶ h₁^{(0)} = ReLU(W_proj · x₁ + b_proj)"
          : "x₀ ∈ ℝ⁷ ⟶ h₀^{(0)} = ReLU(W_proj · x₀ + b_proj)",
        description: isMirror
          ? "Collects the 7 sign-flipped features (+ω_x, −ω_y, −ω_z, +|ω|₁, −g_x, +g_y, +g_z) into a single 7-dimensional vector and feeds them into the shared 1×1 projection tower."
          : "Collects the 7 direct physical features (3 angular rates, 1 L1 speed, 3 head-frame gravity components) and feeds them into the shared 1×1 projection tower.",
        borderClass: isMirror ? "border-cyan-400/90" : "border-green-400/90",
        badgeClass: isMirror
          ? "bg-cyan-500/20 text-cyan-200 border-cyan-400/50"
          : "bg-green-500/20 text-green-200 border-green-400/50",
        highlightHex: isMirror ? 0x22d3ee : 0x4ade80,
        metrics: [
          {
            label: "Rate Vector ω",
            value: `[${feats.slice(0, 3).map((v) => v.toFixed(1)).join(", ")}]`,
            sub: "rad/s (x, y, z)",
            colorClass: isMirror ? "text-cyan-300" : "text-green-300",
          },
          {
            label: "L1 Speed |ω|₁",
            value: `${feats[3].toFixed(2)} r/s`,
            sub: "Channel 3",
            colorClass: "text-amber-300",
          },
          {
            label: "Gravity g",
            value: `[${feats.slice(4, 7).map((v) => v.toFixed(2)).join(", ")}]`,
            sub: "Head-frame up",
            colorClass: "text-lime-300",
          },
        ],
      };
    }

    case "feature_bar": {
      const tower = STAGE_TOWER_META[meta.stageIdx];
      const isMirror = meta.streamIdx === 1;
      const c = meta.channelIdx;
      const acts0 = snapshot
        ? meta.stageIdx === 0
          ? snapshot.projActivations0
          : snapshot.blocks[meta.stageIdx - 1].activations0
        : [];
      const acts1 = snapshot
        ? meta.stageIdx === 0
          ? snapshot.projActivations1
          : snapshot.blocks[meta.stageIdx - 1].activations1
        : [];
      const val0 = acts0[c] ?? 0;
      const val1 = acts1[c] ?? 0;
      const dwVal =
        snapshot && meta.stageIdx >= 1
          ? isMirror
            ? snapshot.blocks[meta.stageIdx - 1].depthwise1[c]
            : snapshot.blocks[meta.stageIdx - 1].depthwise0[c]
          : null;
      const activeCount = (isMirror ? acts1 : acts0).filter((v) => v > 0).length;

      return {
        categoryBadge: `${tower.shortName.toUpperCase()} · ${isMirror ? "STREAM 1 (MIRROR h₁)" : "STREAM 0 (DIRECT h₀)"} · CH[${c}]`,
        title: `Feature Channel Bar ch[${c}] (${isMirror ? "Stream 1 h₁" : "Stream 0 h₀"})`,
        subtitle: `${tower.name} · Receptive Field: ${tower.rf}`,
        formula:
          meta.stageIdx === 0
            ? `h_${meta.streamIdx}[${c}] = ReLU(W_proj[${c}, :] · x_${meta.streamIdx} + b[${c}])`
            : `h_${meta.streamIdx}^{(${meta.stageIdx - 1})}[${c}] = ReLU((A·dw_${meta.streamIdx} + B·dw_${1 - meta.streamIdx} + b)[${c}] + skip[${c}])`,
        description: `${tower.role} Bar height shows the live post-ReLU activation of channel ${c} (out of 32) in ${isMirror ? "Stream 1 (Mirrored)" : "Stream 0 (Direct)"}.`,
        borderClass: isMirror ? "border-cyan-400/90" : "border-green-400/90",
        badgeClass: isMirror
          ? "bg-cyan-500/20 text-cyan-200 border-cyan-400/50"
          : "bg-green-500/20 text-green-200 border-green-400/50",
        highlightHex: isMirror ? 0x22d3ee : 0x4ade80,
        metrics: [
          {
            label: `Stream 0 h₀[${c}]`,
            value: val0.toFixed(3),
            sub: val0 > 0 ? "ReLU Active (>0)" : "ReLU Gated (0)",
            colorClass: "text-green-300",
          },
          {
            label: `Stream 1 h₁[${c}]`,
            value: val1.toFixed(3),
            sub: val1 > 0 ? "ReLU Active (>0)" : "ReLU Gated (0)",
            colorClass: "text-cyan-300",
          },
          {
            label: dwVal !== null ? `Depthwise dw[${c}]` : "Active Channels",
            value: dwVal !== null ? dwVal.toFixed(3) : `${activeCount} / 32`,
            sub: dwVal !== null ? `8-tap k=8 filter out` : tower.params,
            colorClass: "text-amber-300",
          },
        ],
      };
    }

    case "stage_slab": {
      const tower = STAGE_TOWER_META[meta.stageIdx];
      const isMirror = meta.streamIdx === 1;
      const acts = snapshot
        ? meta.stageIdx === 0
          ? isMirror
            ? snapshot.projActivations1
            : snapshot.projActivations0
          : isMirror
            ? snapshot.blocks[meta.stageIdx - 1].activations1
            : snapshot.blocks[meta.stageIdx - 1].activations0
        : [];
      const meanVal = acts.length ? acts.reduce((a, b) => a + b, 0) / acts.length : 0;
      const maxVal = acts.length ? Math.max(...acts) : 0;
      const peakCh = acts.indexOf(maxVal);
      const activeCount = acts.filter((v) => v > 0).length;

      return {
        categoryBadge: `${tower.shortName.toUpperCase()} · ${isMirror ? "STREAM 1 BANK" : "STREAM 0 BANK"}`,
        title: `${tower.name} — ${isMirror ? "Stream 1 (Mirror Twin h₁)" : "Stream 0 (Direct h₀)"}`,
        subtitle: `${tower.op} · ${tower.params}`,
        formula: `Tensor: [1, 32, 2, 1] · ${tower.stateShape} · RF = ${tower.rf}`,
        description: tower.role,
        borderClass: isMirror ? "border-cyan-400/90" : "border-green-400/90",
        badgeClass: isMirror
          ? "bg-cyan-500/20 text-cyan-200 border-cyan-400/50"
          : "bg-green-500/20 text-green-200 border-green-400/50",
        highlightHex: isMirror ? 0x22d3ee : 0x4ade80,
        metrics: [
          {
            label: "Stream Mean Act",
            value: meanVal.toFixed(3),
            sub: `${activeCount}/32 channels > 0`,
            colorClass: isMirror ? "text-cyan-300" : "text-green-300",
          },
          {
            label: "Peak Channel",
            value: `ch[${Math.max(0, peakCh)}] = ${maxVal.toFixed(2)}`,
            sub: "Max post-ReLU bar",
            colorClass: "text-emerald-300",
          },
          {
            label: "Receptive Field",
            value: tower.rf,
            sub: tower.stateShape,
            colorClass: "text-amber-300",
          },
        ],
      };
    }

    case "own_conduit": {
      const b = meta.blockIdx;
      const isMirror = meta.streamIdx === 1;
      const blk = snapshot?.blocks[b];
      const ownNorm = blk ? (isMirror ? blk.ownStreamNorm1 : blk.ownStreamNorm0) : 0;
      const crossNorm = blk ? (isMirror ? blk.crossStreamNorm1 : blk.crossStreamNorm0) : 0;
      const ratio = (ownNorm / (ownNorm + crossNorm + 1e-6)) * 100;

      return {
        categoryBadge: `BLOCK ${b} STREAM GATE · OWN-STREAM PATHWAY (A)`,
        title: `Block ${b} Own-Stream Gate (${isMirror ? "A · h₁ → h₁" : "A · h₀ → h₀"})`,
        subtitle: `Diagonal Block A [32×32] of Tied Pointwise Matrix [[A, B], [B, A]]`,
        formula: isMirror
          ? `y₁ = ReLU( A·dw(h₁) + B·dw(h₀) + b + h₁ )`
          : `y₀ = ReLU( A·dw(h₀) + B·dw(h₁) + b + h₀ )`,
        description: `Carries ${isMirror ? "Stream 1 (Mirrored)" : "Stream 0 (Direct)"}'s 32 depthwise-convolved features through the within-stream 32×32 weight matrix A (1,024 params). Both streams share the exact same matrix A to guarantee symmetry.`,
        borderClass: isMirror ? "border-cyan-400/90" : "border-green-400/90",
        badgeClass: isMirror
          ? "bg-cyan-500/20 text-cyan-200 border-cyan-400/50"
          : "bg-green-500/20 text-green-200 border-green-400/50",
        highlightHex: isMirror ? 0x22d3ee : 0x4ade80,
        metrics: [
          {
            label: isMirror ? "Own Norm ||A·h₁||₂" : "Own Norm ||A·h₀||₂",
            value: ownNorm.toFixed(2),
            sub: `${ratio.toFixed(1)}% of pointwise mix`,
            colorClass: isMirror ? "text-cyan-300" : "text-green-300",
          },
          {
            label: isMirror ? "Cross Norm ||B·h₀||₂" : "Cross Norm ||B·h₁||₂",
            value: crossNorm.toFixed(2),
            sub: `${(100 - ratio).toFixed(1)}% cross-stream`,
            colorClass: "text-teal-300",
          },
          {
            label: "Gate Weights (A)",
            value: "1,024 params",
            sub: "Shared 32×32 matrix",
            colorClass: "text-amber-300",
          },
        ],
      };
    }

    case "cross_bridge": {
      const b = meta.blockIdx;
      const fromMir = meta.fromStream === 1;
      const blk = snapshot?.blocks[b];
      const crossNorm = blk ? (fromMir ? blk.crossStreamNorm0 : blk.crossStreamNorm1) : 0;
      const ownNorm = blk ? (fromMir ? blk.ownStreamNorm0 : blk.ownStreamNorm1) : 0;
      const ratio = (crossNorm / (ownNorm + crossNorm + 1e-6)) * 100;

      return {
        categoryBadge: `BLOCK ${b} STREAM GATE · CROSS-STREAM X-BRIDGE (B)`,
        title: `Block ${b} Cross-Stream Gate (${fromMir ? "B · h₁ → Stream 0" : "B · h₀ → Stream 1"})`,
        subtitle: `Off-Diagonal Block B [32×32] of Block-Circulant Matrix [[A, B], [B, A]]`,
        formula: fromMir
          ? `Cross_0 = B · dw(h₁)  added into Stream 0`
          : `Cross_1 = B · dw(h₀)  added into Stream 1`,
        description: `Routes features diagonally across the X-bridge from ${fromMir ? "Stream 1 (Mirrored) into Stream 0 (Direct)" : "Stream 0 (Direct) into Stream 1 (Mirrored)"} via the 32×32 coupling matrix B (1,024 params). Enables both streams to compare left-vs-right motion cues while remaining equivariant.`,
        borderClass: "border-sky-400/90",
        badgeClass: "bg-sky-500/20 text-sky-200 border-sky-400/50",
        highlightHex: 0x38bdf8,
        metrics: [
          {
            label: fromMir ? "Cross ||B·h₁||₂ → S0" : "Cross ||B·h₀||₂ → S1",
            value: crossNorm.toFixed(2),
            sub: `${ratio.toFixed(1)}% cross-bridge share`,
            colorClass: "text-cyan-300",
          },
          {
            label: fromMir ? "Target S0 ||A·h₀||₂" : "Target S1 ||A·h₁||₂",
            value: ownNorm.toFixed(2),
            sub: `${(100 - ratio).toFixed(1)}% own-stream share`,
            colorClass: "text-green-300",
          },
          {
            label: "Coupling Matrix B",
            value: "1,024 params",
            sub: "Tied [[A,B],[B,A]]",
            colorClass: "text-amber-300",
          },
        ],
      };
    }

    case "x_gate_node": {
      const b = meta.blockIdx;
      const blk = snapshot?.blocks[b];
      const a0 = blk?.ownStreamNorm0 ?? 0;
      const b1 = blk?.crossStreamNorm0 ?? 0;
      const a1 = blk?.ownStreamNorm1 ?? 0;
      const b0 = blk?.crossStreamNorm1 ?? 0;

      return {
        categoryBadge: `BLOCK ${b} · [[A, B], [B, A]] EQUIVARIANT STREAM GATE`,
        title: `Block ${b} Central Mirror-Equivariant X-Coupling Gate`,
        subtitle: "Tied Block-Circulant 1×1 Convolution (2,048 weights + 32 biases)",
        formula: "[y₀; y₁] = ReLU( [[A, B], [B, A]] · [dw(h₀); dw(h₁)] + [b; b] + [h₀; h₁] )",
        description:
          "The heart of LeanTCNN's mirror symmetry: because the 64×64 pointwise matrix is structured as [[A, B], [B, A]], swapping the input streams (h₀ ↔ h₁) mathematically swaps the output streams (y₀ ↔ y₁) with 0.0000° error while halving parameters.",
        borderClass: "border-cyan-300/95",
        badgeClass: "bg-cyan-500/25 text-cyan-100 border-cyan-300/60",
        highlightHex: 0x67e8f9,
        metrics: [
          {
            label: "Stream 0 Mix",
            value: `A:${a0.toFixed(1)} + B:${b1.toFixed(1)}`,
            sub: "||A·h₀||₂ + ||B·h₁||₂",
            colorClass: "text-green-300",
          },
          {
            label: "Stream 1 Mix",
            value: `A:${a1.toFixed(1)} + B:${b0.toFixed(1)}`,
            sub: "||A·h₁||₂ + ||B·h₀||₂",
            colorClass: "text-cyan-300",
          },
          {
            label: "Symmetry Error Δ",
            value: `${(snapshot?.mirrorEquivarianceErrorDeg ?? 0).toFixed(6)}°`,
            sub: "Exact equivariance",
            colorClass: "text-emerald-300",
          },
        ],
      };
    }

    case "residual_skip": {
      const b = meta.blockIdx;
      const isMirror = meta.streamIdx === 1;
      const prevActs = snapshot
        ? b === 0
          ? isMirror
            ? snapshot.projActivations1
            : snapshot.projActivations0
          : isMirror
            ? snapshot.blocks[b - 1].activations1
            : snapshot.blocks[b - 1].activations0
        : [];
      const postActs = snapshot
        ? isMirror
          ? snapshot.blocks[b].activations1
          : snapshot.blocks[b].activations0
        : [];
      const inMean = prevActs.length ? prevActs.reduce((x, y) => x + y, 0) / prevActs.length : 0;
      const outMean = postActs.length ? postActs.reduce((x, y) => x + y, 0) / postActs.length : 0;

      return {
        categoryBadge: `BLOCK ${b} · OVERHEAD RESIDUAL SKIP ARCH (+ x)`,
        title: `Block ${b} Identity Residual Skip (${isMirror ? "+ x₁ Mirror" : "+ x₀ Direct"})`,
        subtitle: "Zero-Parameter Skip Connection Bypassing DW + PW Convolutions",
        formula: `h_${meta.streamIdx}^{(${b})} = ReLU( PW(DW(x_${meta.streamIdx})) + x_${meta.streamIdx} )`,
        description:
          "Routes the previous stage's 32-channel representation directly over the top of Block " +
          b +
          " and sums it with the [[A,B],[B,A]] pointwise output before the ReLU activation, preserving low-latency features and gradient flow.",
        borderClass: isMirror ? "border-cyan-300/90" : "border-lime-400/90",
        badgeClass: isMirror
          ? "bg-cyan-500/20 text-cyan-200 border-cyan-400/50"
          : "bg-lime-500/20 text-lime-200 border-lime-400/50",
        highlightHex: isMirror ? 0x67e8f9 : 0xa3e635,
        metrics: [
          {
            label: "Skip Input Mean",
            value: inMean.toFixed(3),
            sub: b === 0 ? "From 1×1 Split" : `From Block ${b - 1}`,
            colorClass: "text-lime-300",
          },
          {
            label: "Post-Add ReLU Mean",
            value: outMean.toFixed(3),
            sub: `Block ${b} output`,
            colorClass: isMirror ? "text-cyan-300" : "text-green-300",
          },
          {
            label: "Skip Parameters",
            value: "0 params",
            sub: "1×1 identity add",
            colorClass: "text-amber-300",
          },
        ],
      };
    }

    case "kernel_comb_tap": {
      const b = meta.blockIdx;
      const m = meta.tapIdx;
      const dilations = [1, 8, 47];
      const d = dilations[b];
      const stepsAgo = (7 - m) * d;
      const msAgo = stepsAgo * 10;
      const blk = snapshot?.blocks[b];
      const sampleIdx = blk ? blk.tapIndices[m] : 399 - stepsAgo;
      const e0 = blk ? blk.tapEnergies0[m] : 0;
      const e1 = blk ? blk.tapEnergies1[m] : 0;
      const profile = tapProfiles?.[b];
      const learnedMetric = profile
        ? [
            {
              label: "Learned Tap Weight",
              value: `mean |w| ${profile.meanAbs[m].toFixed(2)}`,
              sub:
                profile.normalised[m] >= 0.999
                  ? "Strongest of the 8 taps"
                  : `${Math.round(profile.normalised[m] * 100)}% of the strongest tap`,
              colorClass: "text-amber-300",
            },
          ]
        : [];

      return {
        categoryBadge: `BLOCK ${b} · k=8 CAUSAL KERNEL TAP (TAP ${m}/7, d=${d})`,
        title: `Block ${b} Causal Filter Tap #${m} (t − ${stepsAgo} steps = −${msAgo} ms)`,
        subtitle: `Depthwise Conv1d(k=8, d=${d}) · Reads Sample [${sampleIdx}/399]`,
        formula: `dw_c[t] = Σ_{m=0..7} W_dw[c, m] · x_c[t − (7 − m)·${d}]`,
        description: `Each dot on the comb under Block ${b} is one of the 8 causal filter taps (k=8) spaced by dilation d=${d} (${d * 10} ms between taps). Its height on the pin is the weight the trained kernel gives that tap; its size is the signal arriving on it now. Tap #${m} looks ${msAgo} ms into the past.`,
        borderClass: b === 0 ? "border-green-400/90" : b === 1 ? "border-cyan-400/90" : "border-purple-400/90",
        badgeClass:
          b === 0
            ? "bg-green-500/20 text-green-200 border-green-400/50"
            : b === 1
              ? "bg-cyan-500/20 text-cyan-200 border-cyan-400/50"
              : "bg-purple-500/20 text-purple-200 border-purple-400/50",
        highlightHex: b === 0 ? 0x4ade80 : b === 1 ? 0x22d3ee : 0xc084fc,
        metrics: [
          {
            label: "Causal Lookback",
            value: `−${msAgo} ms (t−${stepsAgo})`,
            sub: `Context idx [${sampleIdx}]`,
            colorClass: "text-amber-300",
          },
          ...learnedMetric,
          {
            label: "Stream 0 Tap Energy",
            value: e0.toFixed(3),
            sub: "Mean |x₀| across 32 ch",
            colorClass: "text-green-300",
          },
          {
            label: "Stream 1 Tap Energy",
            value: e1.toFixed(3),
            sub: "Mean |x₁| across 32 ch",
            colorClass: "text-cyan-300",
          },
        ],
      };
    }

    case "kernel_comb_bar":
    case "feeder_bus": {
      const b = meta.blockIdx;
      const dilations = [1, 8, 47];
      const d = dilations[b];
      const rfs = ["8 samples (80 ms)", "64 samples (640 ms)", "393 samples (3.93 s)"];
      const states = ["[32, 2, 7] (448 floats)", "[32, 2, 56] (3,584 floats)", "[32, 2, 329] (21,056 floats)"];
      const blk = snapshot?.blocks[b];
      const e0 = blk ? blk.tapEnergies0 : [0, 0, 0, 0, 0, 0, 0, 0];

      return {
        categoryBadge: `BLOCK ${b} · k=8 DEPTHWISE CAUSAL COMB & STATE FEEDER`,
        title: `Block ${b} Shared 8-Tap Depthwise Causal Filter (k=8, d=${d})`,
        subtitle: `256 Params (32 ch × 8 taps) · Cumulative RF: ${rfs[b]}`,
        formula: `FIFO Buffer: ${states[b]} · Tap Spacing: Δt = ${d * 10} ms`,
        description: `Feeds 8 historical time steps spaced ${d * 10} ms apart from the sliding context / FIFO state buffer into Block ${b}'s depthwise convolution. Both Stream 0 and Stream 1 share the exact same 32×8 depthwise kernel weights.`,
        borderClass: b === 0 ? "border-green-400/90" : b === 1 ? "border-cyan-400/90" : "border-purple-400/90",
        badgeClass:
          b === 0
            ? "bg-green-500/20 text-green-200 border-green-400/50"
            : b === 1
              ? "bg-cyan-500/20 text-cyan-200 border-cyan-400/50"
              : "bg-purple-500/20 text-purple-200 border-purple-400/50",
        highlightHex: b === 0 ? 0x4ade80 : b === 1 ? 0x22d3ee : 0xc084fc,
        metrics: [
          {
            label: "Oldest Tap (m=0)",
            value: `t−${7 * d} (−${7 * d * 10}ms)`,
            sub: `Energy: ${e0[0].toFixed(3)}`,
            colorClass: "text-purple-300",
          },
          {
            label: "Newest Tap (m=7)",
            value: "t−0 (NOW 0ms)",
            sub: `Energy: ${e0[7].toFixed(3)}`,
            colorClass: "text-green-300",
          },
          {
            label: "Streaming State",
            value: states[b].split(" ")[0],
            sub: `Cumulative RF = ${rfs[b]}`,
            colorClass: "text-amber-300",
          },
        ],
      };
    }

    case "rf_rail": {
      const b = meta.blockIdx;
      const railInfo = [
        {
          title: "Block 0 Receptive Field Rail — 8 Samples (80 ms)",
          sub: "k=8, Dilation d=1 · Covers Frames [392 .. 399] (Last 0.08 s)",
          formula: "RF₀ = 1 + (8 − 1) × 1 = 8 samples (80 ms @ 100 Hz)",
          desc: "The green rail on the timeline deck marks the 80 ms high-frequency window observed by Block 0's consecutive 8-tap filter (d=1), capturing immediate angular velocity and micro-acceleration. Its 8 bands are the 8 samples, one per tap.",
          state: "[32, 2, 7] (448 floats)",
          hex: 0x4ade80,
          border: "border-green-400/90",
          badge: "bg-green-500/20 text-green-200 border-green-400/50",
        },
        {
          title: "Block 1 Receptive Field Rail — 64 Samples (640 ms)",
          sub: "k=8, Dilation d=8 · Covers Frames [336 .. 399] (Last 0.64 s)",
          formula: "RF₁ = 1 + (8 − 1) × (1 + 8) = 64 samples (640 ms @ 100 Hz)",
          desc: "The cyan rail spans the last 640 ms of head motion covered by stacking Block 0 (d=1) and Block 1 (d=8), matching the duration of a full VR head turn or Beat Saber dodge. Each of its 8 bands is the 8 samples one Block 1 tap reads through Block 0.",
          state: "[32, 2, 56] (3,584 floats)",
          hex: 0x22d3ee,
          border: "border-cyan-400/90",
          badge: "bg-cyan-500/20 text-cyan-200 border-cyan-400/50",
        },
        {
          title: "Block 2 Receptive Field Rail — 393 Samples (3.93 s)",
          sub: "k=8, Dilation d=47 · Covers Frames [7 .. 399] (Last 3.93 s)",
          formula: "RF₂ = 1 + (8 − 1) × (1 + 8 + 47) = 393 samples (3.93 s @ 100 Hz)",
          desc: "The purple bar spans 393 of the 400 context samples (3.93 seconds). Each band is the 64-sample window one Block 2 tap reads; the taps sit 47 samples apart, so neighbouring windows overlap by 17 samples (the bright sections). By choosing d=47, LeanTCNN reaches nearly the entire 4.0s history in just 3 blocks.",
          state: "[32, 2, 329] (21,056 floats)",
          hex: 0xc084fc,
          border: "border-purple-400/90",
          badge: "bg-purple-500/20 text-purple-200 border-purple-400/50",
        },
      ][b];

      return {
        categoryBadge: `TIMELINE DECK · BLOCK ${b} RECEPTIVE FIELD RAIL`,
        title: railInfo.title,
        subtitle: railInfo.sub,
        formula: railInfo.formula,
        description: railInfo.desc,
        borderClass: railInfo.border,
        badgeClass: railInfo.badge,
        highlightHex: railInfo.hex,
        metrics: [
          {
            label: "Cumulative Horizon",
            value: b === 0 ? "80 ms (8)" : b === 1 ? "640 ms (64)" : "3,930 ms (393)",
            sub: "Out of 4,000 ms (400)",
            colorClass: b === 0 ? "text-green-300" : b === 1 ? "text-cyan-300" : "text-purple-300",
          },
          {
            label: `Block ${b} Dilation`,
            value: b === 0 ? "d = 1 (10ms)" : b === 1 ? "d = 8 (80ms)" : "d = 47 (470ms)",
            sub: "8 causal taps",
            colorClass: "text-amber-300",
          },
          {
            label: "FIFO Ring Buffer",
            value: railInfo.state.split(" ")[0],
            sub: railInfo.state.split(" ").slice(1).join(" "),
            colorClass: "text-emerald-300",
          },
        ],
      };
    }

    case "timeline_tap": {
      const b = meta.blockIdx;
      const m = meta.tapIdx;
      const dilations = [1, 8, 47];
      const d = dilations[b];
      const stepsAgo = (7 - m) * d;
      const msAgo = stepsAgo * 10;
      const blk = snapshot?.blocks[b];
      const tapSampleIdx = blk ? blk.tapIndices[m] : 399 - stepsAgo;
      const qHist =
        contextWindow && contextWindow[tapSampleIdx]
          ? contextWindow[tapSampleIdx]
          : ([1, 0, 0, 0] as Quat);
      const e0 = blk ? blk.tapEnergies0[m] : 0;

      return {
        categoryBadge: `400-SAMPLE WAVEFORM · BLOCK ${b} HISTORICAL TAP #${m}`,
        title: `Historical Context Tap: Block ${b}, Tap #${m} at t − ${ (msAgo / 1000).toFixed(2) } s`,
        subtitle: `Sample Index [${tapSampleIdx} / 399] · Dilation d=${d} (${d * 10} ms spacing)`,
        formula: `q[t − ${stepsAgo}] = [${qHist.map((v) => v.toFixed(2)).join(", ")}]`,
        description: `Marks the exact point on the 4.0-second quaternion context waveform currently sampled by Tap #${m} of Block ${b}'s k=8 dilated causal filter (${msAgo} ms before NOW).`,
        borderClass: b === 0 ? "border-green-400/90" : b === 1 ? "border-cyan-400/90" : "border-purple-400/90",
        badgeClass:
          b === 0
            ? "bg-green-500/20 text-green-200 border-green-400/50"
            : b === 1
              ? "bg-cyan-500/20 text-cyan-200 border-cyan-400/50"
              : "bg-purple-500/20 text-purple-200 border-purple-400/50",
        highlightHex: b === 0 ? 0x4ade80 : b === 1 ? 0x22d3ee : 0xc084fc,
        metrics: [
          {
            label: "Historical Offset",
            value: `−${msAgo} ms (t−${stepsAgo})`,
            sub: `Sample #${tapSampleIdx} of 400`,
            colorClass: "text-amber-300",
          },
          {
            label: "Historical Pose q",
            value: `[${qHist.map((v) => v.toFixed(2)).join(",")}]`,
            sub: "w, x, y, z unit quat",
            colorClass: "text-green-300",
          },
          {
            label: `Block ${b} Tap Energy`,
            value: e0.toFixed(3),
            sub: `Tap ${m}/7 weight × act`,
            colorClass: "text-purple-300",
          },
        ],
      };
    }

    case "timeline_deck": {
      const tickLabels = ["−4.0 s (t−399)", "−3.0 s (t−300)", "−2.0 s (t−200)", "−1.0 s (t−100)", "NOW 0.0 s (t)"];
      const tickLabel = meta.tickIdx !== undefined ? tickLabels[meta.tickIdx] : "4.0 s Window (400 samples @ 100 Hz)";

      return {
        categoryBadge: "SLIDING CONTEXT WINDOW · 400 SAMPLES (4.0 SECONDS)",
        title: `400-Sample Sliding Quaternion Context Deck (${tickLabel})`,
        subtitle: "RF Rails: Green = 80 ms (B0) · Cyan = 640 ms (B1) · Purple = 3.93 s (B2)",
        formula: "q_{t-399:t} ∈ ℍ₁^{400}  ⟷  Streaming FIFO State: 25,088 floats (100.3 KB)",
        description:
          "Displays the 4-second (400-sample @ 100 Hz) incoming XR headset trajectory. The three rails under it show which samples each block reads, banded per kernel tap: the last 8, then the last 64, then 393 through eight 64-sample windows spaced 47 samples apart (overlaps brightest). Select a block (steps 3 to 5) and its rail and the matching stretch of the waveform light up. In deployed streaming mode the model ingests 1 new sample per 10 ms tick using the 3 causal FIFO state buffers.",
        borderClass: "border-green-400/90",
        badgeClass: "bg-green-500/20 text-green-200 border-green-400/50",
        highlightHex: 0x22c55e,
        metrics: [
          {
            label: "Total Receptive Field",
            value: "393 / 400 samples",
            sub: "3.93 s causal lookback",
            colorClass: "text-purple-300",
          },
          {
            label: "Streaming State Size",
            value: "25,088 floats",
            sub: "7 + 56 + 329 steps × 64 ch",
            colorClass: "text-cyan-300",
          },
          {
            label: "Single-Step Latency",
            value: "47.2 µs / frame",
            sub: "100 Hz real-time budget",
            colorClass: "text-green-300",
          },
        ],
      };
    }

    case "prior_bypass": {
      const s20 = snapshot?.horizonSteps[19];
      const priorDeg = s20 ? (Math.hypot(...s20.priorRotVec) * 180) / Math.PI : 0;
      const resDeg = s20 ? (Math.hypot(...s20.residualRotVec) * 180) / Math.PI : 0;
      const errPrior =
        snapshot && groundTruthFuture && groundTruthFuture.length >= 20
          ? geodesicAngleDeg(snapshot.trajectories.dampedPrior[19], groundTruthFuture[19])
          : null;

      return {
        categoryBadge: "STEP 1 → 6 · DAMPED-VELOCITY PRIOR BYPASS (0 PARAMS)",
        title: "Damped-Velocity Physical Prior Bypass Tube (τ = 100 ms)",
        subtitle: "Zero-Parameter Analytical Trajectory Baseline · Skips Entire TCN",
        formula: "r_prior(k) = ω_step × τ · (1 − e^{−k / τ}),   τ = 10 steps (100 ms)",
        description:
          "Human heads move in bursts and naturally decelerate due to neck biomechanics. Routing the latest step velocity ω_step = 2wv directly over the TCN with exponential decay τ = 100 ms achieves 5.11° test error with 0 parameters—so the TCN only has to learn the smooth cubic residual!",
        borderClass: "border-cyan-300/95",
        badgeClass: "bg-cyan-500/25 text-cyan-100 border-cyan-300/60",
        highlightHex: 0x22d3ee,
        metrics: [
          {
            label: "200ms Prior Angle",
            value: `${priorDeg.toFixed(2)}°`,
            sub: "||r_prior(20)||₂ rotation",
            colorClass: "text-cyan-300",
          },
          {
            label: "200ms TCN Residual",
            value: `${resDeg.toFixed(2)}°`,
            sub: "||r_cubic(20)||₂ correction",
            colorClass: "text-amber-300",
          },
          {
            label: "Prior 200ms Error",
            value: errPrior !== null ? `${errPrior.toFixed(2)}°` : "5.11° Test",
            sub: "vs 6.04° Hold-Last",
            colorClass: "text-emerald-300",
          },
        ],
      };
    }

    case "readout_knob": {
      const j = meta.basisIdx;
      const axis = meta.axisIdx;
      const basisNames = ["c₁ Linear Velocity (k/20)¹", "c₂ Quadratic Accel (k/20)²", "c₃ Cubic Jerk (k/20)³"];
      const axisNames = ["Pitch / Nod (x-axis)", "Yaw / Turn (y-axis)", "Roll / Tilt (z-axis)"];
      const sign = ROTATION_SIGNS[axis];
      const coef = snapshot ? snapshot.readout.coefficients[j][axis] : 0;
      const ownK = snapshot ? snapshot.readout.ownKnobs[j][axis] : 0;
      const mirK = snapshot ? snapshot.readout.mirrorKnobsFlipped[j][axis] : 0;
      const biasVal = axis === 0 && snapshot ? snapshot.readout.nodBias[j] : 0;

      return {
        categoryBadge: `STEP 6 · CUBIC BASIS READOUT KNOB (c_${j + 1}, ${["X", "Y", "Z"][axis]})`,
        title: `Basis Knob c_${j + 1}[${["x", "y", "z"][axis]}] — ${basisNames[j]} · ${axisNames[axis]}`,
        subtitle: `Mirror Readout Sign S_${["x", "y", "z"][axis]} = ${sign > 0 ? "+1 (Even Nod + Bias b_x)" : "−1 (Odd Anti-Symmetric, 0 Bias)"}`,
        formula:
          axis === 0
            ? `c_${j + 1},x = (W·h₀)_{${j + 1},x} + (+1)·(W·h₁)_{${j + 1},x} + b_x[${j}]`
            : `c_${j + 1},${["x", "y", "z"][axis]} = (W·h₀) − (W·h₁)   (exact zero bias at rest)`,
        description: `One of the 9 cubic polynomial trajectory coefficients (P=3 basis powers × 3 axes = 291 readout params). Controls the ${basisNames[j].toLowerCase()} correction on ${axisNames[axis].toLowerCase()} across all 20 future steps: Σ c_j · (k/20)^j.`,
        borderClass: axis === 0 ? "border-cyan-400/90" : axis === 1 ? "border-green-400/90" : "border-amber-400/90",
        badgeClass:
          axis === 0
            ? "bg-cyan-500/20 text-cyan-200 border-cyan-400/50"
            : axis === 1
              ? "bg-green-500/20 text-green-200 border-green-400/50"
              : "bg-amber-500/20 text-amber-200 border-amber-400/50",
        highlightHex: axis === 0 ? 0x22d3ee : axis === 1 ? 0x4ade80 : 0xf59e0b,
        metrics: [
          {
            label: `Total Knob c_${j + 1}[${["x", "y", "z"][axis]}]`,
            value: coef.toFixed(4),
            sub: `${((coef * 180) / Math.PI).toFixed(2)}° @ k=20`,
            colorClass: "text-amber-300",
          },
          {
            label: "Stream 0 (W·h₀)",
            value: ownK.toFixed(4),
            sub: "Direct stream term",
            colorClass: "text-green-300",
          },
          {
            label: `Stream 1 (${sign > 0 ? "+" : "−"}W·h₁)`,
            value: mirK.toFixed(4),
            sub: axis === 0 ? `Nod bias b_x=${biasVal.toFixed(3)}` : "Bias = 0 (exact symmetry)",
            colorClass: "text-cyan-300",
          },
        ],
      };
    }

    case "cayley_orb": {
      const s20 = snapshot?.horizonSteps[19];
      const q20 = snapshot?.trajectories.k8Combined[19] ?? [1, 0, 0, 0];
      const r20 = s20?.combinedRotVec ?? [0, 0, 0];

      return {
        categoryBadge: "STEP 7 · TRIG-FREE CAYLEY MAP & LAYERNORM ORB",
        title: "Cayley Map (2, r_k) + LayerNorm Unit Quaternion Node",
        subtitle: "0 Learned Params · Replaces 18 sin/cos/Sqrt/Div ONNX Nodes with 2 Fast Ops",
        formula: "q̂_{t+k} = LayerNorm([ +q_t ⊗ (2, r_k),  −q_t ⊗ (2, r_k) ])[:4]",
        description:
          "Maps all 20 3D rotation vectors r_k = r_prior(k) + r_cubic(k) (k=1..20) back to unit quaternions without trig functions by forming (2, r_k), multiplying by current pose q[t], and normalizing to unit length with a single hardware-fused LayerNormalization node.",
        borderClass: "border-green-400/95",
        badgeClass: "bg-green-500/25 text-green-100 border-green-400/60",
        highlightHex: 0x4ade80,
        metrics: [
          {
            label: "Cayley Input (2, r₂₀)",
            value: `[2, ${r20.map((v) => v.toFixed(2)).join(", ")}]`,
            sub: "Unnormalized quat delta",
            colorClass: "text-emerald-300",
          },
          {
            label: "Unit Out q̂(t+200ms)",
            value: `[${q20.map((v) => v.toFixed(2)).join(", ")}]`,
            sub: `||q̂||₂ = ${Math.hypot(...q20).toFixed(4)}`,
            colorClass: "text-green-300",
          },
          {
            label: "ONNX Graph Savings",
            value: "51–60 total nodes",
            sub: "47.2 µs CPU latency",
            colorClass: "text-cyan-300",
          },
        ],
      };
    }

    case "return_arc": {
      const errK8 =
        snapshot && groundTruthFuture && groundTruthFuture.length >= 20
          ? geodesicAngleDeg(snapshot.trajectories.k8Combined[19], groundTruthFuture[19])
          : null;

      return {
        categoryBadge: "STEP 7 · 200 MS FORECAST TRAJECTORY FEEDBACK LOOP",
        title: "20-Step Predicted Quaternion Trajectory Return Bus ([1, 20, 4])",
        subtitle: "Streams 20 Future Orientations (t + 10 ms … t + 200 ms) Back to VR Headset",
        formula: "q̂_{t+1:t+20} ∈ ℍ₁^{20}  (10 ms, 20 ms, …, 200 ms horizon)",
        description:
          "Routes the 20 normalized unit quaternions from the Cayley + LayerNorm output node back to the VR headset arena on the left to render the live 200 ms forecast trajectory curve and +200 ms ghost visor.",
        borderClass: "border-green-400/90",
        badgeClass: "bg-green-500/20 text-green-200 border-green-400/50",
        highlightHex: 0x4ade80,
        metrics: [
          {
            label: "Forecast Horizon",
            value: "20 steps (200 ms)",
            sub: "10 ms resolution @ 100 Hz",
            colorClass: "text-green-300",
          },
          {
            label: "Live 200ms Error",
            value: errK8 !== null ? `${errK8.toFixed(2)}°` : "Interactive Mode",
            sub: "Geodesic angle on SO(3)",
            colorClass: "text-amber-300",
          },
          {
            label: "Test Benchmark",
            value: "4.2666° @ 200ms",
            sub: "Team bench · 20 unseen users",
            colorClass: "text-cyan-300",
          },
        ],
      };
    }

    case "vr_headset": {
      const isMir = meta.isMirror;
      const q = snapshot ? (isMir ? snapshot.mirroredLastQ : snapshot.lastQ) : ([1, 0, 0, 0] as Quat);
      const vel = snapshot ? snapshot.velocityDegPerSec : [0, 0, 0];

      return {
        categoryBadge: isMir
          ? "ZONE 1 · MIRROR TWIN VR HEADSET M(q[t])"
          : "ZONE 1 · OBSERVED VR HEADSET POSE q[t]",
        title: isMir
          ? "Mirrored Twin Headset Rig M(q[t]) = (w, x, −y, −z)"
          : "Observed XR Headset Rig q[t] (100 Hz Stream)",
        subtitle: isMir
          ? "Reflected Across Sagittal Plane (x = 0) · Feeds Stream 1 (h₁)"
          : "Body Axes: Cyan +X (Nod) · Green +Y (Turn) · Amber +Z (Roll/Gaze)",
        formula: isMir
          ? `M(q_t) = [${q.map((v) => v.toFixed(3)).join(", ")}]`
          : `q_t = [${q.map((v) => v.toFixed(3)).join(", ")}]   (||q_t||₂ = 1)`,
        description: isMir
          ? "Visualizes the sagittal reflection M(q) = (w, x, −y, −z) processed by Stream 1. Because LeanTCNN is strictly mirror-equivariant, its forecast on this twin headset is the exact reflection M(q̂) of the primary headset's forecast!"
          : "Represents the player's live VR headset orientation at current frame t. Drag directly in Interactive Mode or scrub the replay clips (one QuestSet player, four synthetic) to watch how angular velocity and gravity propagate through the 3D TCN.",
        borderClass: isMir ? "border-cyan-400/90" : "border-green-400/90",
        badgeClass: isMir
          ? "bg-cyan-500/20 text-cyan-200 border-cyan-400/50"
          : "bg-green-500/20 text-green-200 border-green-400/50",
        highlightHex: isMir ? 0x22d3ee : 0x4ade80,
        metrics: [
          {
            label: isMir ? "Mirrored M(q[t])" : "Quaternion q[t]",
            value: `[${q.map((v) => v.toFixed(2)).join(", ")}]`,
            sub: "w, x, y, z scalar-first",
            colorClass: isMir ? "text-cyan-300" : "text-green-300",
          },
          {
            label: "Angular Velocity ω",
            value: `[${vel.map((v, i) => ((isMir && i > 0 ? -v : v)).toFixed(0) + "°").join(", ")}]/s`,
            sub: "Pitch, Yaw, Roll rate",
            colorClass: "text-amber-300",
          },
          {
            label: "Equivariance Δ",
            value: `${(snapshot?.mirrorEquivarianceErrorDeg ?? 0).toFixed(6)}°`,
            sub: "f(M(q)) vs M(f(q))",
            colorClass: "text-emerald-300",
          },
        ],
      };
    }

    case "mirror_plane": {
      return {
        categoryBadge: "STEP 2 · SAGITTAL MIRROR SYMMETRY PLANE (x = 0)",
        title: "Left–Right Reflection Plane M(w, x, y, z) = (w, x, −y, −z)",
        subtitle: "Halves Network Parameters (15,113 → 7,555) with 0.0000° Symmetry Error",
        formula: "f(M(q_{t-399:t})) = M(f(q_{t-399:t}))   ∀ q ∈ ℍ₁^{400}",
        description:
          "Human head biomechanics are left-right symmetric across the sagittal plane (x = 0). By pairing Stream 0 (direct) and Stream 1 (reflected across this plane) with block-circulant [[A,B],[B,A]] weights, every left turn in training automatically teaches the exact right turn.",
        borderClass: "border-cyan-400/90",
        badgeClass: "bg-cyan-500/20 text-cyan-200 border-cyan-400/50",
        highlightHex: 0x22d3ee,
        metrics: [
          {
            label: "Even Axis (+1)",
            value: "Pitch / Nod (x)",
            sub: "Preserved across mirror",
            colorClass: "text-green-300",
          },
          {
            label: "Odd Axes (−1)",
            value: "Yaw (y) & Roll (z)",
            sub: "Negated across mirror",
            colorClass: "text-orange-300",
          },
          {
            label: "Parameter Reduction",
            value: "−50% (7,555p)",
            sub: "+0.036° better val error",
            colorClass: "text-cyan-300",
          },
        ],
      };
    }

    case "gravity_ring": {
      const g = snapshot?.gravityHead ?? [0, 1, 0];
      return {
        categoryBadge: "STEP 1 · WORLD-UP GRAVITY & HORIZON REFERENCE",
        title: "World Gravity Vector (+y) & Horizon Tilt Ring",
        subtitle: "Provides Pitch & Roll Restoring Reference R(q)ᵀy in Head Coordinates",
        formula: "g_t = R(q_t)^T [0, 1, 0]^T = [2(xy+wz), w²−x²+y²−z², 2(yz−wx)]",
        description:
          "Shows the world horizon ring and vertical up vector (+y). Projecting world-up into the headset frame gives the TCN a drift-free sense of how far the head is pitched or rolled, invariant to compass yaw and q = −q sign flips.",
        borderClass: "border-lime-400/90",
        badgeClass: "bg-lime-500/20 text-lime-200 border-lime-400/50",
        highlightHex: 0xa3e635,
        metrics: [
          {
            label: "Head Gravity R(q)ᵀy",
            value: `[${g.map((v) => v.toFixed(2)).join(", ")}]`,
            sub: "x (side), y (up), z (fwd)",
            colorClass: "text-lime-300",
          },
          {
            label: "Upright Alignment",
            value: `${(g[1] * 100).toFixed(1)}%`,
            sub: "g_y cosine with world +y",
            colorClass: "text-green-300",
          },
          {
            label: "Validation Gain",
            value: "−0.047° error",
            sub: "Improves 14 / 15 users",
            colorClass: "text-emerald-300",
          },
        ],
      };
    }

    case "trajectory_curve": {
      const hasGT = Array.isArray(groundTruthFuture) && groundTruthFuture.length >= 20;
      const errK8 =
        snapshot && hasGT && groundTruthFuture
          ? geodesicAngleDeg(snapshot.trajectories.k8Combined[19], groundTruthFuture[19])
          : null;
      const errPrior =
        snapshot && hasGT && groundTruthFuture
          ? geodesicAngleDeg(snapshot.trajectories.dampedPrior[19], groundTruthFuture[19])
          : null;

      const trajMap = {
        k8: {
          badge: "200 MS FORECAST · k8_combined (LeanTCNN)",
          title: "k8_combined 200 ms Forecast Trajectory & +200 ms Ghost Visor",
          sub: "Damped Prior + 3-Block Mirror TCN Cubic Residual (7,555 params)",
          formula: "q̂_{t+1..t+20} = LayerNorm(q_t ⊗ (2, r_prior(k) + r_cubic(k)))",
          desc: "The green trajectory arc and ghost visor show LeanTCNN's 20-step (10 ms .. 200 ms) predicted head pose, combining the τ=100 ms damped velocity prior with the 9 cubic residual coefficients.",
          border: "border-green-400/90",
          badgeCls: "bg-green-500/20 text-green-200 border-green-400/50",
          hex: 0x4ade80,
        },
        prior: {
          badge: "200 MS BASELINE · DAMPED-VELOCITY PRIOR (0 PARAMS)",
          title: "Damped-Velocity Prior (τ = 100 ms) Trajectory & Ghost Visor",
          sub: "Zero-Parameter Analytical Baseline: r_prior(k) = ω_step · τ(1 − e^(−k/τ))",
          formula: "q̂_prior(t+k) = normalize(q_t ⊗ (2, ω_step · τ(1 − e^{−k/τ})))",
          desc: "The cyan trajectory shows where the head would land under pure exponential velocity decay (τ=100 ms) without the TCN's cubic correction.",
          border: "border-cyan-400/90",
          badgeCls: "bg-cyan-500/20 text-cyan-200 border-cyan-400/50",
          hex: 0x22d3ee,
        },
        const_vel: {
          badge: "200 MS BASELINE · CONSTANT VELOCITY EXTRAPOLATION",
          title: "Undamped Constant-Velocity Baseline Trajectory",
          sub: "Linear Extrapolation r(k) = k · ω_step (Overshoots During Braking)",
          formula: "r_cv(k) = k · ω_step   (τ → ∞, no damping)",
          desc: "The dashed rose curve shows constant-velocity extrapolation. Because human heads decelerate rapidly after a turn, undamped extrapolation badly overshoots at 200 ms.",
          border: "border-rose-400/90",
          badgeCls: "bg-rose-500/20 text-rose-200 border-rose-400/50",
          hex: 0xf43f5e,
        },
        ground_truth: {
          badge: "REPLAY CLIP · GROUND-TRUTH FUTURE TRAJECTORY",
          title: "Actual Future Head Trajectory q_{t+1..t+20} (+200 ms)",
          sub: "Next 200 ms of the Replay Clip (QuestSet Player or Synthetic Head Motion, 100 Hz)",
          formula: "q_true(t+1 … t+20) ∈ ℍ₁^{20}",
          desc: "The yellow trajectory arc and ghost visor show the true future path the head took over the next 200 ms, used to compute the live geodesic angular error.",
          border: "border-yellow-400/90",
          badgeCls: "bg-yellow-500/20 text-yellow-200 border-yellow-400/50",
          hex: 0xfacc15,
        },
        mirror_k8: {
          badge: "200 MS FORECAST · MIRRORED STREAM 1 M(q̂)",
          title: "Mirrored Twin 200 ms Forecast Trajectory M(q̂_{t+1..t+20})",
          sub: "Exact Left–Right Reflection of k8_combined Forecast Across x = 0",
          formula: "f(M(q)) = M(f(q)) = (ŵ, x̂, −ŷ, −ẑ)",
          desc: "The sky-blue trajectory on the mirrored headset proves exact equivariance: running the model on reflected inputs produces the exact reflection of the primary forecast.",
          border: "border-sky-400/90",
          badgeCls: "bg-sky-500/20 text-sky-200 border-sky-400/50",
          hex: 0x38bdf8,
        },
        error_arc: {
          badge: "STEP 20 (+200 MS) · GEODESIC ANGULAR ERROR ARC",
          title: "200 ms Geodesic Error Arc on SO(3)",
          sub: "Shortest Great-Circle Rotation Angle Between Prediction q̂₂₀ and Ground Truth q₂₀",
          formula: "d_geo(q̂, q) = 4 · atan2(||q̂ − ±q||₂, ||q̂ + ±q||₂)",
          desc: "Visualizes the angular gap at t + 200 ms between the k8_combined prediction and ground truth. Colored green (<3°), yellow (3–6°), or orange (>6°).",
          border: "border-orange-400/90",
          badgeCls: "bg-orange-500/20 text-orange-200 border-orange-400/50",
          hex: 0xf97316,
        },
      }[meta.trajKind];

      return {
        categoryBadge: trajMap.badge,
        title: trajMap.title,
        subtitle: trajMap.sub,
        formula: trajMap.formula,
        description: trajMap.desc,
        borderClass: trajMap.border,
        badgeClass: trajMap.badgeCls,
        highlightHex: trajMap.hex,
        metrics: [
          {
            label: "k8_combined @ 200ms",
            value: errK8 !== null ? `${errK8.toFixed(2)}°` : "4.27° Test",
            sub: "Full model geodesic error",
            colorClass: "text-green-300",
          },
          {
            label: "Damped Prior @ 200ms",
            value: errPrior !== null ? `${errPrior.toFixed(2)}°` : "5.11° Test",
            sub: "0-param physical prior",
            colorClass: "text-cyan-300",
          },
          {
            label: "TCN Improvement",
            value:
              errK8 !== null && errPrior !== null
                ? `${(errK8 - errPrior).toFixed(2)}°`
                : "−0.85° avg",
            sub: "Cubic residual gain",
            colorClass: "text-emerald-300",
          },
        ],
      };
    }

    case "floating_badge":
    default: {
      const badgeToMeta: Record<string, HoverTargetMeta> = {
        pose: { kind: "vr_headset", isMirror: false },
        mirror_twin: { kind: "vr_headset", isMirror: true },
        inputs: { kind: "input_trunk", trunkIdx: 0 },
        proj: { kind: "stage_slab", stageIdx: 0, streamIdx: 0 },
        b0: { kind: "stage_slab", stageIdx: 1, streamIdx: 0 },
        b1: { kind: "stage_slab", stageIdx: 2, streamIdx: 0 },
        b2: { kind: "stage_slab", stageIdx: 3, streamIdx: 0 },
        prior_bypass: { kind: "prior_bypass" },
        readout: { kind: "readout_knob", basisIdx: 0, axisIdx: 0 },
        cayley: { kind: "cayley_orb" },
        history: { kind: "timeline_deck" },
      };
      const mapped =
        meta.kind === "floating_badge"
          ? badgeToMeta[meta.badgeId] ?? { kind: "cayley_orb" }
          : { kind: "cayley_orb" as const };
      return buildHoverTooltipContent(mapped, snapshot, groundTruthFuture, contextWindow, tapProfiles);
    }
  }
}

