"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Cpu,
  ExternalLink,
  Feather,
  Gauge,
  GitBranch,
  Layers,
  ShieldCheck,
  Sparkles,
  Timer,
  Trophy,
} from "lucide-react";
import AbcModelVisualizer from "@/components/abc-challenge/AbcModelVisualizer";
import AbcControlPanel from "@/components/abc-challenge/AbcControlPanel";
import AbcPipelineRail from "@/components/abc-challenge/AbcPipelineRail";
import AbcTransportBar from "@/components/abc-challenge/AbcTransportBar";
import {
  type Pathway,
  type StepIndex,
  TRACE_STEP_MS,
  wrapStep,
} from "@/components/abc-challenge/abc-pipeline";
import {
  type ClipErrors,
  computeClipErrors,
  computeTapProfiles,
  tiltPoses,
} from "@/components/abc-challenge/abc-model-stats";
import {
  LeanTCNNEngine,
  buildInteractiveWindow,
  type K8ModelBundle,
  type Quat,
} from "@/lib/abc-challenge/lean-tcnn-engine";
import { usePageMotion } from "@/lib/motion";

const LEADERBOARD_ROWS = [
  {
    model: "v9 k8_combined (best/)",
    arch: "3× Kernel-8 Sep Mirror TCN (d=1,8,47) + Gravity + Cubic + Native Cayley",
    params: "7,555 (7,552 lean)",
    macs: "16,222 – 22,168",
    val200: "4.2501 ± 0.0041°",
    test200: "4.2666°",
    latency: "47.2 – 56.1 µs",
    highlight: true,
  },
  {
    model: "v9 k5_combined",
    arch: "4× Kernel-5 Sep Mirror TCN (d=1,5,25,68), 48 ch (24/stream)",
    params: "5,595 (5,592 lean)",
    macs: "12,318 – 16,728",
    val200: "4.2717 ± 0.0067°",
    test200: "4.2871°",
    latency: "52.2 – 61.9 µs",
    highlight: false,
  },
  {
    model: "v7 sep + angular",
    arch: "5× Kernel-3 Sep Mirror TCN (dilation base 3, RF=243)",
    params: "6,651",
    macs: "13,863",
    val200: "4.3297 ± 0.0142°",
    test200: "4.3289°",
    latency: "91.0 µs",
    highlight: false,
  },
  {
    model: "v6 control",
    arch: "7× Full MirrorCausalBlock (RF=255) + 60-out head",
    params: "26,012",
    macs: "52,144",
    val200: "4.3423 ± 0.0121°",
    test200: "4.3584°",
    latency: "—",
    highlight: false,
  },
  {
    model: "Stateful GRU (5 seeds)",
    arch: "Recurrent GRU streaming baseline",
    params: "6,192",
    macs: "6,384",
    val200: "—",
    test200: "4.4670 ± 0.0121°",
    latency: "23.6 µs",
    highlight: false,
  },
  {
    model: "GADS-T (5 seeds)",
    arch: "Attention / Transformer baseline",
    params: "10,352",
    macs: "606,320",
    val200: "—",
    test200: "4.5056 ± 0.0375°",
    latency: "172 – 174 µs",
    highlight: false,
  },
  {
    model: "Damped Velocity Prior (τ = 100 ms)",
    arch: "Zero-weight analytical baseline: rate × τ(1 − e^(−k/τ))",
    params: "0",
    macs: "—",
    val200: "5.05°",
    test200: "5.1137°",
    latency: "< 1 µs",
    highlight: false,
  },
  {
    model: "Hold Last Pose",
    arch: "Zero-motion baseline: q̂(t+k) = q(t)",
    params: "0",
    macs: "—",
    val200: "6.08°",
    test200: "6.0373°",
    latency: "0 µs",
    highlight: false,
  },
];

// Final placings from the organisers' results email (November 2026). Seven teams qualified.
const PODIUM = [
  {
    place: "Joint Gold",
    team: "Motion Pending",
    institution: "Munster Technological University, Ireland",
    ours: true,
  },
  {
    place: "Joint Gold",
    team: "Looking Forward",
    institution: "German Research Center for Artificial Intelligence (DFKI), Germany",
    ours: false,
  },
  {
    place: "Silver",
    team: "Headvane",
    institution: "Carnegie Mellon University, USA",
    ours: false,
  },
];

const SCORING_CRITERIA = [
  {
    weight: "40%",
    label: "Accuracy",
    detail: "Mean geodesic error at the 20th sample (200 ms ahead) on the unreleased test set.",
  },
  {
    weight: "30%",
    label: "Latency",
    detail:
      "Measured by the organisers on an XR edge-AI target: batch size 1, steady state, median of repeated runs after warm-up.",
  },
  {
    weight: "20%",
    label: "Innovation",
    detail:
      "Novelty of the architecture, compression or training technique, ranked by the organising committee.",
  },
  {
    weight: "10%",
    label: "Parameter count",
    detail: "Total trainable parameters, checked against the delivered model.",
  },
];

const RESULT_HIGHLIGHTS = [
  {
    icon: Cpu,
    title: "Ran on the Qualcomm XR device",
    body: "Models from 6 of the 7 teams compiled and ran on the organisers' Qualcomm device, ours among them. The graph uses only standard ONNX operators, with no trigonometric or Clip nodes.",
  },
  {
    icon: Feather,
    title: "Fewest parameters of any team",
    body: "7,552 parameters, counted from the delivered ONNX file (7,555 trainable; 3 head biases are folded into a constant). That is also below the organisers' own baseline model, and they called it “unheard of for this problem”.",
  },
  {
    icon: Sparkles,
    title: "Ranked among the 3 most innovative",
    body: "Judging from the model files, before reading the papers, the committee placed Motion Pending, Looking Forward and Headvane at the top for innovation. The same three entries had the highest accuracy and the lowest latency on the device.",
  },
];

const REPO_URL = "https://github.com/JacobDrizzle/abc-challenge";

// The clip the page opens on: the one real (QuestSet) player. Its errors rank the same
// way as the test set (model < damped prior < hold-last), so the first frames tell the
// headline story.
const DEFAULT_CLIP_ID = "questset_beat_saber";

// Horizontal axis the world-tilt ablation rotates about.
const TILT_HEADING_DEG = 25;

export default function AbcChallengePageContent() {
  const pageRef = useRef<HTMLElement>(null);
  usePageMotion(pageRef);

  const [bundle, setBundle] = useState<K8ModelBundle | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Playback & interaction states
  const [selectedClipId, setSelectedClipId] = useState<string>(DEFAULT_CLIP_ID);
  const [interactiveMode, setInteractiveMode] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(0.5);
  const [frameIndex, setFrameIndex] = useState<number>(0);

  // Pipeline selection: `step` is null on the full-graph overview. While `tracing`, a
  // signal packet is followed step by step along one `pathway`.
  const [step, setStep] = useState<StepIndex | null>(null);
  const [tracing, setTracing] = useState<boolean>(false);
  const [pathway, setPathway] = useState<Pathway>("stream0");
  const [autoWalk, setAutoWalk] = useState<boolean>(true);
  const [cameraLock, setCameraLock] = useState<boolean>(true);

  // Model & physics toggles / sliders
  const [showMirrorTwin, setShowMirrorTwin] = useState<boolean>(true);
  const [showDampedPrior, setShowDampedPrior] = useState<boolean>(true);
  const [showConstantVelocity, setShowConstantVelocity] = useState<boolean>(false);
  const [gravityEnabled, setGravityEnabled] = useState<boolean>(true);
  const [tiltDeg, setTiltDeg] = useState<number>(0);
  const [tauMs, setTauMs] = useState<number>(100);
  const [residualScale, setResidualScale] = useState<number>(1.0);

  // Interactive Head Drag state
  const [manualPose, setManualPose] = useState({
    pitchDeg: -8,
    yawDeg: 22,
    rollDeg: 5,
    velPitch: 15,
    velYaw: 95,
  });
  const [interactiveTick, setInteractiveTick] = useState<number>(0);

  // Load the 7,555 trained k8_combined weights & the replay clips (QuestSet + synthetic)
  useEffect(() => {
    let cancelled = false;
    fetch("/models/abc-challenge/k8-combined-weights.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: K8ModelBundle) => {
        if (!cancelled) {
          setBundle(data);
          const opening = data.clips.find((c) => c.id === DEFAULT_CLIP_ID) ?? data.clips[0];
          if (opening) setSelectedClipId(opening.id);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to load k8_combined bundle:", err);
          setLoadError(String(err));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const engine = useMemo(() => (bundle ? new LeanTCNNEngine(bundle) : null), [bundle]);

  const activeClip = useMemo(
    () => bundle?.clips.find((c) => c.id === selectedClipId) ?? bundle?.clips[0] ?? null,
    [bundle, selectedClipId],
  );

  const maxFrameIndex = activeClip ? activeClip.playbackFrames - 1 : 59;

  // Advance playback frame timer
  useEffect(() => {
    if (interactiveMode) {
      const id = window.setInterval(() => {
        setInteractiveTick((t) => t + 0.04);
      }, 40);
      return () => window.clearInterval(id);
    }
    if (!isPlaying || !activeClip) return;
    const intervalMs = Math.max(20, Math.round(45 / playbackSpeed));
    const id = window.setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % activeClip.playbackFrames);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [interactiveMode, isPlaying, playbackSpeed, activeClip]);

  // Slice current 400-sample context window and 20-sample ground truth future
  const { contextWindow, groundTruthFuture } = useMemo(() => {
    if (interactiveMode) {
      const win = buildInteractiveWindow(
        manualPose.pitchDeg,
        manualPose.yawDeg,
        manualPose.rollDeg,
        manualPose.velPitch,
        manualPose.velYaw,
        0,
        interactiveTick,
      );
      return { contextWindow: win, groundTruthFuture: null };
    }
    if (!activeClip) {
      return { contextWindow: [] as Quat[], groundTruthFuture: null };
    }
    const clampedFrame = Math.max(0, Math.min(activeClip.playbackFrames - 1, frameIndex));
    const ctx = activeClip.quaternions.slice(clampedFrame, clampedFrame + 400);
    // The engine tilts the context it is given, so the recorded future has to be
    // tilted the same way before a forecast can be compared with it.
    const gt = tiltPoses(
      activeClip.quaternions.slice(clampedFrame + 400, clampedFrame + 420),
      tiltDeg,
      TILT_HEADING_DEG,
    );
    return { contextWindow: ctx, groundTruthFuture: gt };
  }, [interactiveMode, manualPose, interactiveTick, activeClip, frameIndex, tiltDeg]);

  // Run real in-browser LeanTCNN inference on current 400-sample context window
  const snapshot = useMemo(() => {
    if (!engine || contextWindow.length < 400) return null;
    return engine.infer(contextWindow, {
      tauMs,
      residualScale,
      tiltDeg,
      tiltHeadingDeg: TILT_HEADING_DEG,
      gravityEnabled,
    });
  }, [engine, contextWindow, tauMs, residualScale, tiltDeg, gravityEnabled]);

  // Score every frame of the clip, so the timeline and the ablation readout show the
  // whole clip instead of one frame. The default-settings pass is the reference.
  const baselineClipErrors = useMemo(
    () => (engine && activeClip ? computeClipErrors(engine, activeClip) : null),
    [engine, activeClip],
  );
  const atDefaults =
    gravityEnabled && tiltDeg === 0 && tauMs === 100 && Math.abs(residualScale - 1) < 1e-6;
  const ablationKey = `${activeClip?.id ?? ""}|${tauMs}|${residualScale}|${tiltDeg}|${gravityEnabled}`;
  const [ablatedClipErrors, setAblatedClipErrors] = useState<{
    key: string;
    errors: ClipErrors;
  } | null>(null);

  // Re-scoring is one forecast per clip frame, so wait for the slider to settle first.
  useEffect(() => {
    if (!engine || !activeClip || atDefaults) return;
    const id = window.setTimeout(() => {
      setAblatedClipErrors({
        key: ablationKey,
        errors: computeClipErrors(engine, activeClip, {
          tauMs,
          residualScale,
          tiltDeg,
          tiltHeadingDeg: TILT_HEADING_DEG,
          gravityEnabled,
        }),
      });
    }, 150);
    return () => window.clearTimeout(id);
  }, [engine, activeClip, atDefaults, ablationKey, tauMs, residualScale, tiltDeg, gravityEnabled]);

  const ablatedForClip =
    ablatedClipErrors && ablatedClipErrors.errors.clipId === activeClip?.id
      ? ablatedClipErrors.errors
      : null;
  const clipErrors = interactiveMode
    ? null
    : atDefaults
      ? baselineClipErrors
      : (ablatedForClip ?? baselineClipErrors);
  // True while the numbers on screen are from the previous slider position.
  const clipErrorsStale = !atDefaults && ablatedClipErrors?.key !== ablationKey;

  const tapProfiles = useMemo(
    () => (bundle ? computeTapProfiles(bundle.weights) : null),
    [bundle],
  );

  const handleHeadDrag = useCallback((deltaYawDeg: number, deltaPitchDeg: number) => {
    setManualPose((prev) => ({
      ...prev,
      yawDeg: Math.max(-75, Math.min(75, prev.yawDeg + deltaYawDeg)),
      pitchDeg: Math.max(-55, Math.min(55, prev.pitchDeg + deltaPitchDeg)),
      velYaw: Math.max(-220, Math.min(220, deltaYawDeg * 18)),
      velPitch: Math.max(-160, Math.min(160, deltaPitchDeg * 15)),
    }));
  }, []);

  const handleResetDefaults = useCallback(() => {
    setGravityEnabled(true);
    setTiltDeg(0);
    setTauMs(100);
    setResidualScale(1.0);
  }, []);

  // While tracing with auto-walk on, advance one pipeline step at a time.
  useEffect(() => {
    if (!tracing || !autoWalk) return;
    const id = window.setInterval(() => {
      setStep((prev) => wrapStep((prev ?? 0) + 1));
    }, TRACE_STEP_MS);
    return () => window.clearInterval(id);
  }, [tracing, autoWalk]);

  // Picking a step by hand (rail, inspector or a click in the 3D scene) pauses the
  // auto-walk; going back to the full graph ends the trace.
  const handleSelectStep = useCallback((next: StepIndex | null) => {
    setStep(next);
    if (next === null) setTracing(false);
    else setAutoWalk(false);
  }, []);

  const handleToggleTracing = useCallback(() => {
    if (tracing) {
      setTracing(false);
      setStep(null);
      return;
    }
    setTracing(true);
    setStep((prev) => prev ?? 0);
    setAutoWalk(true);
    setCameraLock(true);
  }, [tracing]);

  const handleResetView = useCallback(() => {
    setTracing(false);
    setStep(null);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-green-400">
      <main ref={pageRef} className="container mx-auto px-4 pt-24 pb-20 relative z-10">
        <div className="space-y-12 max-w-6xl mx-auto">
          {/* Header & Breadcrumb */}
          <section className="space-y-4">
            <div data-animate="intro" className="flex flex-wrap items-center justify-between gap-4">
              <Link
                href="/ml"
                className="inline-flex items-center gap-2 font-mono text-sm text-green-700 dark:text-green-400 hover:text-green-500 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>cd /ml</span>
              </Link>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="#challenge-result"
                  className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-400/15 border border-amber-300 dark:border-amber-400/40 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-400/25 transition-colors"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  Joint Gold · Team Motion Pending
                </a>
                <span className="font-mono text-xs px-3 py-1 rounded-full bg-green-100 dark:bg-green-500/15 border border-green-300 dark:border-green-500/30 text-green-800 dark:text-green-300">
                  9th ABC Challenge (ABC 2027) · Best Model (`jacob/training/best`)
                </span>
              </div>
            </div>

            <div
              data-animate="intro"
              className="font-mono text-green-600 dark:text-green-300 text-sm md:text-base"
            >
              ~/ml/abc-challenge/k8_combined@terminal:$
              <span className="animate-blink inline-block w-2 h-4 bg-green-500 ml-1" />
            </div>

            <h1
              data-animate="intro"
              className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-green-400"
            >
              Mirror-Equivariant Dilated TCN{" "}
              <span className="text-green-600 dark:text-green-500">
                for 200 ms XR Head-Pose Forecasting
              </span>
            </h1>

            <p
              data-animate="intro"
              className="text-lg text-gray-700 dark:text-green-300/90 max-w-4xl leading-relaxed border-l-2 border-green-500 pl-4"
            >
              Interactive Three.js visualization and live in-browser inference engine for{" "}
              <code className="font-mono text-green-700 dark:text-green-300">k8_combined</code> (
              <code className="font-mono text-green-700 dark:text-green-300">LeanTCNN</code>) — a
              7,555-parameter streaming Temporal Convolutional Network that predicts 200 ms of 6DoF VR
              head orientation from 400 quaternion samples at 100 Hz in{" "}
              <strong>46.9–55.2 µs</strong> on a single CPU thread.
            </p>

            <a
              data-animate="intro"
              href="#challenge-result"
              className="group flex items-start gap-3 max-w-4xl rounded-lg border border-amber-300 dark:border-amber-400/40 bg-amber-50 dark:bg-amber-400/5 p-4 hover:border-amber-400 dark:hover:border-amber-400/70 transition-colors"
            >
              <Trophy className="w-5 h-5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="text-sm leading-relaxed text-gray-800 dark:text-amber-100/90">
                <strong className="text-amber-800 dark:text-amber-300">
                  Joint Gold (1st place) at the 9th ABC Challenge
                </strong>{" "}
                for Team Motion Pending (MTU), shared with DFKI&apos;s Team Looking Forward. Run by
                the organisers on a Qualcomm XR device, our model had the fewest parameters of all 7
                qualified teams, and the committee ranked it among the 3 most innovative entries.{" "}
                <span className="font-mono text-xs text-amber-700 dark:text-amber-400 group-hover:underline">
                  See the result ↓
                </span>
              </span>
            </a>

            {/* Key Metrics Strip */}
            <div
              data-animate="intro"
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2"
            >
              {[
                {
                  icon: Sparkles,
                  label: "Validation @ 200ms",
                  value: "4.2501 ± 0.0041°",
                  sub: "Seeds 42 / 43 / 44",
                },
                {
                  icon: ShieldCheck,
                  label: "Test @ 200ms (Bench)",
                  value: "4.2666°",
                  sub: "20 unseen test users",
                },
                {
                  icon: Cpu,
                  label: "Parameters",
                  value: "7,555",
                  sub: "7,552 in ONNX · fewest of any team",
                },
                {
                  icon: Timer,
                  label: "1-Thread CPU Latency",
                  value: "46.9 – 55.2 µs",
                  sub: "51–60 ONNX safe-list nodes",
                },
                {
                  icon: Gauge,
                  label: "Receptive Field",
                  value: "393 / 400",
                  sub: "k=8, dilations 1 / 8 / 47",
                },
              ].map(({ icon: Icon, label, value, sub }) => (
                <div
                  key={label}
                  className="bg-green-50 dark:bg-green-500/5 border border-green-200 dark:border-green-500/30 rounded-lg p-3.5"
                >
                  <div className="flex items-center gap-1.5 text-xs font-mono text-green-700 dark:text-green-400/80 mb-1">
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </div>
                  <div className="text-lg md:text-xl font-bold font-mono text-gray-900 dark:text-green-300">
                    {value}
                  </div>
                  <div className="text-[11px] font-mono text-gray-600 dark:text-green-500/70">
                    {sub}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Main 3D Visualization + Interactive Control Panel */}
          <section className="space-y-6">
            {loadError ? (
              <div className="p-6 rounded-xl border border-rose-500/40 bg-rose-500/10 font-mono text-sm text-rose-300">
                Failed to load model weights: {loadError}
              </div>
            ) : !bundle ? (
              <div className="h-[820px] md:h-[904px] rounded-xl border border-green-500/30 bg-green-500/5 flex items-center justify-center px-6 text-center font-mono text-green-400 animate-pulse">
                Loading 7,555 k8_combined parameters & replay clips...
              </div>
            ) : (
              <>
                <AbcModelVisualizer
                  snapshot={snapshot}
                  contextWindow={contextWindow}
                  groundTruthFuture={groundTruthFuture}
                  step={step}
                  onSelectStep={handleSelectStep}
                  tracing={tracing}
                  pathway={pathway}
                  onSelectPathway={setPathway}
                  cameraLock={cameraLock}
                  onResetView={handleResetView}
                  showMirrorTwin={showMirrorTwin}
                  onToggleMirrorTwin={() => setShowMirrorTwin((m) => !m)}
                  showConstantVelocity={showConstantVelocity}
                  onToggleConstantVelocity={() => setShowConstantVelocity((c) => !c)}
                  showDampedPrior={showDampedPrior}
                  onToggleDampedPrior={() => setShowDampedPrior((d) => !d)}
                  tiltDeg={tiltDeg}
                  tiltHeadingDeg={TILT_HEADING_DEG}
                  interactiveMode={interactiveMode}
                  onHeadDrag={handleHeadDrag}
                  tapProfiles={tapProfiles}
                >
                  <AbcPipelineRail
                    step={step}
                    onSelectStep={handleSelectStep}
                    tracing={tracing}
                    onToggleTracing={handleToggleTracing}
                    pathway={pathway}
                    onSelectPathway={setPathway}
                    autoWalk={autoWalk}
                    onToggleAutoWalk={() => setAutoWalk((a) => !a)}
                    cameraLock={cameraLock}
                    onToggleCameraLock={() => setCameraLock((c) => !c)}
                    tauMs={tauMs}
                    snapshot={snapshot}
                    groundTruthFuture={groundTruthFuture}
                  />
                  <AbcTransportBar
                    clips={bundle.clips}
                    selectedClipId={selectedClipId}
                    onSelectClip={(id) => {
                      setSelectedClipId(id);
                      setFrameIndex(0);
                    }}
                    interactiveMode={interactiveMode}
                    onToggleInteractiveMode={setInteractiveMode}
                    isPlaying={isPlaying}
                    onTogglePlay={() => setIsPlaying((p) => !p)}
                    playbackSpeed={playbackSpeed}
                    onChangePlaybackSpeed={setPlaybackSpeed}
                    frameIndex={frameIndex}
                    maxFrameIndex={maxFrameIndex}
                    onScrubFrame={(f) => {
                      setIsPlaying(false);
                      setFrameIndex(f);
                    }}
                    manualPose={manualPose}
                    onChangeManualPose={setManualPose}
                    clipErrors={clipErrors}
                    baselineClipErrors={baselineClipErrors}
                    clipErrorsStale={clipErrorsStale}
                  />
                </AbcModelVisualizer>

                <AbcControlPanel
                  step={step}
                  onSelectStep={handleSelectStep}
                  tracing={tracing}
                  pathway={pathway}
                  snapshot={snapshot}
                  groundTruthFuture={groundTruthFuture}
                  gravityEnabled={gravityEnabled}
                  onToggleGravityEnabled={() => setGravityEnabled((g) => !g)}
                  tiltDeg={tiltDeg}
                  onChangeTiltDeg={setTiltDeg}
                  tauMs={tauMs}
                  onChangeTauMs={setTauMs}
                  residualScale={residualScale}
                  onChangeResidualScale={setResidualScale}
                  onResetDefaults={handleResetDefaults}
                  weights={bundle.weights}
                  clipErrors={clipErrors}
                  baselineClipErrors={interactiveMode ? null : baselineClipErrors}
                  clipErrorsStale={clipErrorsStale}
                />

                <p className="text-[11px] font-mono leading-relaxed text-gray-600 dark:text-green-500/70">
                  Replay data: one real Beat Saber player from{" "}
                  <a
                    href="https://researchdata.cab.unipd.it/1239/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-dotted hover:text-green-500"
                  >
                    QuestSet
                  </a>{" "}
                  (Baldoni et al., 2024, Research Data Unipd,{" "}
                  <a
                    href="https://creativecommons.org/licenses/by/4.0/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-dotted hover:text-green-500"
                  >
                    CC BY 4.0
                  </a>
                  ; head orientation only, converted to the model&apos;s frame and resampled to
                  100 Hz), not used in training, and four synthetic head-motion streams set to the
                  25th–97th percentile head speeds of the BOXRR-23 test windows. The BOXRR-23
                  recordings the model was trained and scored on are not shown, because their data
                  use agreement does not allow publishing them.
                </p>
              </>
            )}
          </section>

          {/* Deep-Dive Architecture Cards */}
          <section className="border-t border-green-300 dark:border-green-500/30 pt-10 space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-green-400 flex items-center gap-2">
              <Layers className="w-6 h-6 text-green-500" />
              <span>How k8_combined Works Under the Hood</span>
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <article className="bg-green-50 dark:bg-green-500/5 border border-green-200 dark:border-green-500/30 rounded-xl p-6 space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-green-300 font-mono">
                  1. Damped-Velocity Prior (τ = 100 ms) + Cubic Basis
                </h3>
                <p className="text-sm text-gray-700 dark:text-green-400/85 leading-relaxed">
                  VR head movements occur in quick bursts that smoothly decelerate. Holding the last
                  pose gives <strong>6.08°</strong> validation error; constant velocity overshoots to{" "}
                  <strong>6.71°</strong>; a zero-weight damped prior{" "}
                  <code className="font-mono">rate × τ(1 − e^(−k/τ))</code> with τ = 100 ms drops
                  error to <strong>5.05°</strong>. The TCN readout starts initialized at zero and
                  learns only 3 polynomial residual knobs <code className="font-mono">(c₁, c₂, c₃)</code>{" "}
                  per axis (velocity, acceleration, and jerk corrections), folded into a single{" "}
                  <code className="font-mono">MatMul</code> with the prior at zero extra runtime cost.
                </p>
              </article>

              <article className="bg-green-50 dark:bg-green-500/5 border border-green-200 dark:border-green-500/30 rounded-xl p-6 space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-green-300 font-mono">
                  2. Exact Left-Right Mirror Equivariance
                </h3>
                <p className="text-sm text-gray-700 dark:text-green-400/85 leading-relaxed">
                  Reflecting the world across <code className="font-mono">x = 0</code> maps{" "}
                  <code className="font-mono">q = (w, x, y, z)</code> to{" "}
                  <code className="font-mono">M(q) = (w, x, −y, −z)</code>: nodding stays identical
                  while turning and tilting flip sign. Two 32-channel streams process the direct and
                  sign-flipped inputs using tied block-circulant pointwise weights{" "}
                  <code className="font-mono">[[A, B], [B, A]]</code> stored once as{" "}
                  <code className="font-mono">[A, B]</code>. This guarantees{" "}
                  <code className="font-mono">model(M(h)) == M(model(h))</code> to machine precision,
                  prevents left/right user bias, and halves parameter count from 15,113 to 7,555.
                </p>
              </article>

              <article className="bg-green-50 dark:bg-green-500/5 border border-green-200 dark:border-green-500/30 rounded-xl p-6 space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-green-300 font-mono">
                  3. Head-Frame Gravity & ±15° Tilt Augmentation
                </h3>
                <p className="text-sm text-gray-700 dark:text-green-400/85 leading-relaxed">
                  Body-frame angular rates tell the model how fast the head is turning, but not pitch
                  or roll relative to the room. Adding{" "}
                  <code className="font-mono">R(q)^T y</code> (world-up expressed in the head frame)
                  costs only 96 parameters and improves validation accuracy by{" "}
                  <strong>0.041–0.047°</strong> across 14 of 15 validation users. Because{" "}
                  <code className="font-mono">R(q)^T y</code> is quadratic in{" "}
                  <code className="font-mono">q</code>, it is invariant to{" "}
                  <code className="font-mono">q = −q</code> sign flips and compass yaw. Training with
                  ±15° random horizontal world-tilt augmentation halves sensitivity to unusual player
                  posture.
                </p>
              </article>

              <article className="bg-green-50 dark:bg-green-500/5 border border-green-200 dark:border-green-500/30 rounded-xl p-6 space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-green-300 font-mono">
                  4. Trig-Free Native Maps & Stateful Streaming Graph
                </h3>
                <p className="text-sm text-gray-700 dark:text-green-400/85 leading-relaxed">
                  To run on embedded XR NPUs without trigonometric ops or{" "}
                  <code className="font-mono">Clip</code> nodes,{" "}
                  <code className="font-mono">k8_combined</code> trains directly with{" "}
                  <strong>native maps</strong>: input rate{" "}
                  <code className="font-mono">2wv = sin(θ)n</code> and output{" "}
                  <strong>Cayley map</strong> <code className="font-mono">(2, r_k)</code> normalized
                  via a single <code className="font-mono">LayerNormalization</code> trick. Each call
                  processes only the newest quaternion sample alongside 3 rolling state buffers (
                  <code className="font-mono">[1, 32, 2, 7/56/329]</code>).
                </p>
              </article>
            </div>
          </section>

          {/* Official Challenge Result */}
          <section
            id="challenge-result"
            className="scroll-mt-24 border-t border-green-300 dark:border-green-500/30 pt-10 space-y-6"
          >
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-green-400 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-500" />
                <span>Challenge Result: Joint Gold</span>
              </h2>
              <p className="text-sm text-gray-700 dark:text-green-400/85 leading-relaxed max-w-4xl">
                Seven teams qualified for the 9th ABC Challenge (ABC 2027). The organisers ran each
                submitted model on a Qualcomm XR platform and scored it on accuracy, on-device
                latency, innovation and parameter count. Team Motion Pending from Munster
                Technological University shared first place with Team Looking Forward from DFKI.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="overflow-x-auto rounded-xl border border-green-200 dark:border-green-500/30">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-green-100/80 dark:bg-green-500/15 text-gray-900 dark:text-green-300">
                    <tr>
                      <th className="p-3.5">Place</th>
                      <th className="p-3.5">Team</th>
                      <th className="p-3.5">Institution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-200 dark:divide-green-500/20">
                    {PODIUM.map((row) => (
                      <tr
                        key={row.team}
                        className={
                          row.ours
                            ? "bg-amber-50 dark:bg-amber-400/10 font-semibold text-gray-900 dark:text-amber-200"
                            : "bg-white/60 dark:bg-black/40 text-gray-700 dark:text-green-400/85"
                        }
                      >
                        <td className="p-3.5 whitespace-nowrap">
                          <span
                            className={
                              row.place === "Joint Gold"
                                ? "text-amber-700 dark:text-amber-400"
                                : "text-gray-500 dark:text-gray-300"
                            }
                          >
                            {row.place}
                          </span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">{row.team}</td>
                        <td className="p-3.5">{row.institution}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rounded-xl border border-green-200 dark:border-green-500/30 bg-green-50 dark:bg-green-500/5 p-5 space-y-3">
                <h3 className="font-mono text-sm font-semibold text-gray-900 dark:text-green-300">
                  How entries were scored
                </h3>
                <ul className="space-y-2.5">
                  {SCORING_CRITERIA.map((c) => (
                    <li key={c.label} className="flex gap-3 text-sm">
                      <span className="w-11 shrink-0 font-mono font-bold text-green-700 dark:text-green-300 tabular-nums">
                        {c.weight}
                      </span>
                      <span className="text-gray-700 dark:text-green-400/85 leading-relaxed">
                        <strong className="text-gray-900 dark:text-green-300">{c.label}.</strong>{" "}
                        {c.detail}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {RESULT_HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
                <article
                  key={title}
                  className="bg-green-50 dark:bg-green-500/5 border border-green-200 dark:border-green-500/30 rounded-xl p-5 space-y-2"
                >
                  <div className="flex items-center gap-2 font-mono text-sm font-semibold text-gray-900 dark:text-green-300">
                    <Icon className="w-4 h-4 shrink-0 text-green-600 dark:text-green-400" />
                    <span>{title}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-green-400/85 leading-relaxed">{body}</p>
                </article>
              ))}
            </div>

            <div className="space-y-2 text-xs font-mono leading-relaxed text-gray-600 dark:text-green-500/70 max-w-4xl">
              <p>
                The submitted checkpoint, <code>final_k8_combined_v10_s42</code>, is the k8_combined
                architecture visualised above, retrained on 5,243 players: 4.498° at 200 ms on 1,049
                unseen test players and 4.184° on the 20-player team benchmark. The organisers
                shared the best and worst figure for each criterion rather than every team&apos;s, so
                its on-device accuracy and latency aren&apos;t listed here. The paper is under review.
              </p>
              <p>
                Team Motion Pending: Jacob Dorrill, Nicholas Groenewald, Ray Crowley and Duncan
                O&apos;Regan, supervised by Ruairi O&apos;Reilly and Jing Hua Ye. My part was the TCN
                line, through to the submitted k8_combined model.{" "}
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 underline decoration-dotted hover:text-green-500"
                >
                  Code, models and results on GitHub
                  <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>
          </section>

          {/* Benchmark Leaderboard Table */}
          <section className="border-t border-green-300 dark:border-green-500/30 pt-10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-green-400 flex items-center gap-2">
                <GitBranch className="w-6 h-6 text-green-500" />
                <span>Team Benchmark Leaderboard (group-a-v2-test20, 931,051 Windows)</span>
              </h2>
              <span className="font-mono text-xs text-gray-600 dark:text-green-500/70">
                100 train / 15 val / 20 test users · 100 Hz BOXRR-23 Beat Saber
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-green-200 dark:border-green-500/30">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-green-100/80 dark:bg-green-500/15 text-gray-900 dark:text-green-300">
                  <tr>
                    <th className="p-3.5">Model</th>
                    <th className="p-3.5">Architecture Summary</th>
                    <th className="p-3.5 text-right">Params</th>
                    <th className="p-3.5 text-right">MACs / Call</th>
                    <th className="p-3.5 text-right">Val 200 ms</th>
                    <th className="p-3.5 text-right">Test 200 ms</th>
                    <th className="p-3.5 text-right">CPU 1-Thread</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-green-200 dark:divide-green-500/20">
                  {LEADERBOARD_ROWS.map((row) => (
                    <tr
                      key={row.model}
                      className={
                        row.highlight
                          ? "bg-green-500/15 dark:bg-green-500/20 font-semibold text-gray-900 dark:text-green-200"
                          : "bg-white/60 dark:bg-black/40 text-gray-700 dark:text-green-400/85"
                      }
                    >
                      <td className="p-3.5 whitespace-nowrap">{row.model}</td>
                      <td className="p-3.5">{row.arch}</td>
                      <td className="p-3.5 text-right whitespace-nowrap">{row.params}</td>
                      <td className="p-3.5 text-right whitespace-nowrap">{row.macs}</td>
                      <td className="p-3.5 text-right whitespace-nowrap">{row.val200}</td>
                      <td className="p-3.5 text-right whitespace-nowrap font-bold">{row.test200}</td>
                      <td className="p-3.5 text-right whitespace-nowrap">{row.latency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

