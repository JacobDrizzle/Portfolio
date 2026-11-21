"use client";

import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Minus,
  MousePointerClick,
  Plus,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import {
  type InferenceSnapshot,
  type Quat,
  geodesicAngleDeg,
  worldTiltQuaternion,
} from "@/lib/abc-challenge/lean-tcnn-engine";
import {
  type HoverTargetMeta,
  buildHoverTooltipContent,
  stepForHoverMeta,
} from "./abc-hover-tooltips";
import {
  type Pathway,
  type StepIndex,
  type WalkthroughStage,
  PIPELINE_STEPS,
  TRACE_STEP_MS,
  TRACE_TRAVEL_FRACTION,
  focusedBadgeIds,
  stageForStep,
} from "./abc-pipeline";
import {
  type TapProfile,
  buildCoverageColourTables,
  computeHorizonErrors,
} from "./abc-model-stats";
import AbcHorizonChart from "./AbcHorizonChart";

export interface AbcVisualizerProps {
  snapshot: InferenceSnapshot | null;
  contextWindow: Quat[];
  groundTruthFuture: Quat[] | null;
  /** Selected pipeline step, or `null` for the full-graph overview. */
  step: StepIndex | null;
  onSelectStep?: (step: StepIndex | null) => void;
  /** Signal tracing: a beacon walks the selected pathway step by step. */
  tracing: boolean;
  pathway: Pathway;
  onSelectPathway?: (pathway: Pathway) => void;
  cameraLock: boolean;
  /** Called by the header's reset button, after the camera itself is reset. */
  onResetView?: () => void;
  showMirrorTwin: boolean;
  onToggleMirrorTwin?: () => void;
  showConstantVelocity: boolean;
  onToggleConstantVelocity?: () => void;
  showDampedPrior: boolean;
  onToggleDampedPrior?: () => void;
  tiltDeg: number;
  tiltHeadingDeg: number;
  interactiveMode: boolean;
  onHeadDrag?: (deltaYawDeg: number, deltaPitchDeg: number) => void;
  /** Learned weight of each kernel tap per block; sets the height of the comb dots. */
  tapProfiles?: TapProfile[] | null;
  /** Docked panels rendered under the 3D viewport, inside the same frame. */
  children?: ReactNode;
}

interface FloatingBadgeDef {
  id: string;
  title: string;
  subtitle: string;
  targetStage: WalkthroughStage;
  anchorPos: THREE.Vector3; // Exact 3D point on the mesh where the leader line attaches
  worldPos: THREE.Vector3; // Spacious 3D position where the floating badge sits
  screenOffsetY: number; // Vertical screen offset (negative = above, positive = below)
  accentClass: string;
  strokeColor: string;
}

interface PulseTrack {
  curve: THREE.CatmullRomCurve3;
  mesh: THREE.Mesh;
  speed: number;
  phase: number;
  stageGroup: WalkthroughStage;
}

// Kernel combs under each block: the bar sits at COMB_Y and 8 pins rise from it to the slab.
const COMB_Y = -1.62;
const COMB_PIN_HEIGHT = 0.37;

function toThreeQuat(q: Quat): THREE.Quaternion {
  return new THREE.Quaternion(q[1], q[2], q[3], q[0]).normalize();
}

function visorTipPosition(
  q: Quat,
  center: THREE.Vector3,
  radius: number,
  forwardSign = 1,
): THREE.Vector3 {
  const tq = toThreeQuat(q);
  const forward = new THREE.Vector3(0, 0, forwardSign * radius).applyQuaternion(tq);
  return center.clone().add(forward);
}

function createVRHeadsetRig(
  primaryColor: number,
  visorColor: number,
  isMirror = false,
): {
  group: THREE.Group;
  visorMaterial: THREE.MeshStandardMaterial;
} {
  const group = new THREE.Group();
  const opacity = isMirror ? 0.55 : 0.95;

  const headGeo = new THREE.IcosahedronGeometry(0.66, 2);
  const headMat = new THREE.MeshStandardMaterial({
    color: isMirror ? 0x0f292e : 0x0b1f17,
    emissive: primaryColor,
    emissiveIntensity: isMirror ? 0.12 : 0.18,
    roughness: 0.45,
    metalness: 0.3,
    transparent: isMirror,
    opacity,
  });
  group.add(new THREE.Mesh(headGeo, headMat));

  const wireGeo = new THREE.IcosahedronGeometry(0.668, 1);
  const wireMat = new THREE.MeshBasicMaterial({
    color: primaryColor,
    wireframe: true,
    transparent: true,
    opacity: isMirror ? 0.22 : 0.35,
  });
  group.add(new THREE.Mesh(wireGeo, wireMat));

  const visorGeo = new THREE.BoxGeometry(0.96, 0.46, 0.48);
  const visorMaterial = new THREE.MeshStandardMaterial({
    color: isMirror ? 0x083344 : 0x052e16,
    emissive: visorColor,
    emissiveIntensity: isMirror ? 0.35 : 0.55,
    roughness: 0.2,
    metalness: 0.7,
    transparent: isMirror,
    opacity,
  });
  const visorMesh = new THREE.Mesh(visorGeo, visorMaterial);
  visorMesh.position.set(0, 0.06, 0.54);
  group.add(visorMesh);

  const rimEdges = new THREE.EdgesGeometry(visorGeo);
  const rimLine = new THREE.LineSegments(
    rimEdges,
    new THREE.LineBasicMaterial({
      color: visorColor,
      transparent: true,
      opacity: isMirror ? 0.55 : 0.95,
    }),
  );
  rimLine.position.copy(visorMesh.position);
  group.add(rimLine);

  const strapGeo = new THREE.TorusGeometry(0.68, 0.045, 8, 32, Math.PI * 1.15);
  const strapMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    emissive: primaryColor,
    emissiveIntensity: 0.15,
    roughness: 0.5,
  });
  const strapMesh = new THREE.Mesh(strapGeo, strapMat);
  strapMesh.rotation.x = Math.PI / 2;
  strapMesh.rotation.z = -Math.PI * 0.075;
  strapMesh.position.y = 0.06;
  group.add(strapMesh);

  const coneGeo = new THREE.ConeGeometry(0.3, 0.95, 16, 1, true);
  const coneMat = new THREE.MeshBasicMaterial({
    color: visorColor,
    wireframe: true,
    transparent: true,
    opacity: isMirror ? 0.2 : 0.32,
  });
  const coneMesh = new THREE.Mesh(coneGeo, coneMat);
  coneMesh.rotation.x = -Math.PI / 2;
  coneMesh.position.set(0, 0.06, 1.25);
  group.add(coneMesh);

  const axisLen = 1.25;
  const xArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 0),
    axisLen,
    0x22d3ee,
    0.22,
    0.11,
  );
  const yArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, 0),
    axisLen,
    0x22c55e,
    0.22,
    0.11,
  );
  const zArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, 0),
    axisLen * 1.15,
    0xf59e0b,
    0.24,
    0.12,
  );
  group.add(xArrow, yArrow, zArrow);

  return { group, visorMaterial };
}

function createGhostVisor(color: number, scale = 1.0): THREE.Group {
  const g = new THREE.Group();
  const box = new THREE.BoxGeometry(0.78 * scale, 0.36 * scale, 0.36 * scale);
  const edges = new THREE.EdgesGeometry(box);
  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 }),
  );
  const fill = new THREE.Mesh(
    box,
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.16 }),
  );
  g.add(line, fill);
  return g;
}

// Camera framing. The scene is far wider than it is tall (x = -12.3 .. +17.0), so the
// overview distance is fitted to the viewport width rather than fixed, and step
// close-ups back off on narrow viewports.
const CAMERA_FOV_DEG = 42;
const CAMERA_MIN_RADIUS = 2.5;
// Far enough to fit the whole pipeline across a phone-width viewport.
const CAMERA_MAX_RADIUS = 56;
const OVERVIEW_LOOK_AT = new THREE.Vector3(2.0, 0.15, 0);
const OVERVIEW_HALF_WIDTH = 15.8;
const OVERVIEW_MIN_RADIUS = 13;
const OVERVIEW_PHI = 1.3;
const STEP_PHI = 1.18;
const STEP_THETA = 0.08;
// A selected step is framed a little wider than a traced one, so its neighbours stay in view.
const STEP_BROWSE_SCALE = 1.3;

function overviewRadius(aspect: number): number {
  const halfFovTan = Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV_DEG) * 0.5);
  return THREE.MathUtils.clamp(
    OVERVIEW_HALF_WIDTH / (halfFovTan * Math.max(0.2, aspect)),
    OVERVIEW_MIN_RADIUS,
    CAMERA_MAX_RADIUS,
  );
}

function narrowViewportScale(aspect: number): number {
  return THREE.MathUtils.clamp(1.9 / Math.max(0.2, aspect), 1, 1.9);
}

// Staggered Upper/Lower Callout Tiers with 3D Leader Line Anchors (zero overlap over 3D meshes)
const FLOATING_BADGES: FloatingBadgeDef[] = [
  {
    id: "pose",
    title: "0. Head Pose q[t]",
    subtitle: "400 × [w,x,y,z] @ 100Hz",
    targetStage: 1,
    anchorPos: new THREE.Vector3(-10.2, 1.25, 0.3),
    worldPos: new THREE.Vector3(-10.2, 2.75, 0.3),
    screenOffsetY: -18,
    accentClass: "border-green-400/75 text-green-300",
    strokeColor: "#4ade80",
  },
  {
    id: "mirror_twin",
    title: "Mirror Twin M(q)",
    subtitle: "(w, x, −y, −z) Reflection",
    targetStage: 2,
    anchorPos: new THREE.Vector3(-3.8, -0.35, 0.3),
    worldPos: new THREE.Vector3(-3.8, -2.15, 0.8),
    screenOffsetY: 22,
    accentClass: "border-cyan-400/75 text-cyan-300",
    strokeColor: "#22d3ee",
  },
  {
    id: "inputs",
    title: "1. Native Inputs (7 ch)",
    subtitle: "2wv · |ω|₁ · R(q)ᵀy",
    targetStage: 1,
    anchorPos: new THREE.Vector3(-0.4, 1.56, 0.95),
    worldPos: new THREE.Vector3(-0.6, 2.95, 0),
    screenOffsetY: -22,
    accentClass: "border-lime-400/75 text-lime-300",
    strokeColor: "#a3e635",
  },
  {
    id: "proj",
    title: "2. 1×1 Mirror Split",
    subtitle: "7→32×2 streams (256p)",
    targetStage: 2,
    anchorPos: new THREE.Vector3(2.4, -1.15, 0.92),
    worldPos: new THREE.Vector3(1.8, -2.15, 1.1),
    screenOffsetY: 24,
    accentClass: "border-cyan-400/75 text-cyan-300",
    strokeColor: "#22d3ee",
  },
  {
    id: "b0",
    title: "3. Block 0 (k=8, d=1)",
    subtitle: "RF=8 · [[A,B],[B,A]]",
    targetStage: 3,
    anchorPos: new THREE.Vector3(5.2, 0.35, 0),
    worldPos: new THREE.Vector3(4.5, 2.35, 0),
    screenOffsetY: -12,
    accentClass: "border-emerald-400/75 text-emerald-300",
    strokeColor: "#34d399",
  },
  {
    id: "b1",
    title: "4. Block 1 (k=8, d=8)",
    subtitle: "RF=64 · State [32,2,56]",
    targetStage: 3,
    anchorPos: new THREE.Vector3(8.0, -1.15, 0.92),
    worldPos: new THREE.Vector3(8.0, -1.95, 1.1),
    screenOffsetY: 16,
    accentClass: "border-teal-400/75 text-teal-300",
    strokeColor: "#2dd4bf",
  },
  {
    id: "b2",
    title: "5. Block 2 (k=8, d=47)",
    subtitle: "RF=393 · State [32,2,329]",
    targetStage: 3,
    anchorPos: new THREE.Vector3(10.8, 0.35, 0),
    worldPos: new THREE.Vector3(11.3, 2.35, 0),
    screenOffsetY: -12,
    accentClass: "border-purple-400/75 text-purple-300",
    strokeColor: "#c084fc",
  },
  {
    id: "prior_bypass",
    title: "Damped Prior Bypass (0p)",
    subtitle: "rate × τ(1 − e^(−k/τ)), τ=100ms",
    targetStage: 4,
    anchorPos: new THREE.Vector3(8.0, 2.65, 0),
    worldPos: new THREE.Vector3(8.0, 3.65, 0),
    screenOffsetY: -36,
    accentClass: "border-cyan-300/85 text-cyan-200 bg-cyan-950/90",
    strokeColor: "#67e8f9",
  },
  {
    id: "readout",
    title: "6. Cubic Basis (P=3)",
    subtitle: "W·h₀ + S·W·h₁ + bₓ (9 knobs)",
    targetStage: 4,
    anchorPos: new THREE.Vector3(14.0, -0.68, 0),
    worldPos: new THREE.Vector3(14.0, -2.15, 0.6),
    screenOffsetY: 24,
    accentClass: "border-amber-400/75 text-amber-300",
    strokeColor: "#fbbf24",
  },
  {
    id: "cayley",
    title: "7. Cayley + LayerNorm",
    subtitle: "q[t] ⊗ norm(2, r_k) → [20, 4]",
    targetStage: 5,
    anchorPos: new THREE.Vector3(16.6, 0.38, 0),
    worldPos: new THREE.Vector3(16.8, 2.65, 0),
    screenOffsetY: -20,
    accentClass: "border-green-400/85 text-green-200",
    strokeColor: "#4ade80",
  },
  {
    id: "history",
    title: "400-Sample Sliding Context (4.0 s)",
    subtitle: "RF Rails: 8 (80ms) · 64 (640ms) · 393 (3.93s) → k=8 Combs",
    targetStage: 3,
    anchorPos: new THREE.Vector3(6.6, -2.25, -2.27),
    worldPos: new THREE.Vector3(5.4, -3.25, -2.0),
    screenOffsetY: 42,
    accentClass: "border-green-500/65 text-green-300/90",
    strokeColor: "#22c55e",
  },
];

function getFollowStepCurvePoints(
  streamId: Pathway,
  stepIdx: StepIndex,
): THREE.Vector3[] {
  const zStream = streamId === "stream1" ? -0.92 : 0.92;
  switch (stepIdx) {
    case 0:
      if (streamId === "stream1") {
        return [
          new THREE.Vector3(-10.2, 0.45, 0.3),
          new THREE.Vector3(-7.0, 0.65, 0.5),
          new THREE.Vector3(-3.8, 0.45, 0.3),
        ];
      }
      return [
        new THREE.Vector3(-10.2, 0.45, 0.3),
        new THREE.Vector3(-9.1, 0.52, 0.95),
        new THREE.Vector3(-7.5, 0.62, 1.05),
      ];
    case 1:
      if (streamId === "stream1") {
        return [
          new THREE.Vector3(-3.8, 0.45, 0.3),
          new THREE.Vector3(-1.4, 0.85, 0.95),
          new THREE.Vector3(-0.4, 0.52, 0.95),
          new THREE.Vector3(-0.4, 0.0, -0.95),
          new THREE.Vector3(-0.4, -1.04, -0.95),
        ];
      }
      return [
        new THREE.Vector3(-7.5, 0.62, 1.05),
        new THREE.Vector3(-3.5, 0.88, 1.15),
        new THREE.Vector3(-1.05, 1.04, 0.95),
        new THREE.Vector3(-0.4, 1.04, 0.95),
        new THREE.Vector3(-0.4, -1.04, 0.95),
      ];
    case 2:
      if (streamId === "prior") {
        return [
          new THREE.Vector3(-0.4, 1.04, 0.95),
          new THREE.Vector3(0.9, 1.95, 0.6),
          new THREE.Vector3(2.4, 2.45, 0.35),
        ];
      }
      return [
        new THREE.Vector3(-0.4, 0.52, zStream),
        new THREE.Vector3(0.18, -0.52, zStream),
        new THREE.Vector3(1.3, -0.52, zStream),
        new THREE.Vector3(2.4, -0.45, zStream),
      ];
    case 3:
      if (streamId === "prior") {
        return [
          new THREE.Vector3(2.4, 2.45, 0.35),
          new THREE.Vector3(3.8, 2.54, 0.22),
          new THREE.Vector3(5.2, 2.6, 0.12),
        ];
      }
      if (streamId === "stream1") {
        return [
          new THREE.Vector3(2.4, -0.52, 0.92),
          new THREE.Vector3(3.8, -0.52, 0.0),
          new THREE.Vector3(5.2, -0.52, -0.92),
          new THREE.Vector3(5.2, 0.15, -0.92),
        ];
      }
      return [
        new THREE.Vector3(2.4, -0.52, 0.92),
        new THREE.Vector3(3.8, 0.52, 0.92),
        new THREE.Vector3(5.2, -0.45, 0.92),
        new THREE.Vector3(5.2, -1.55, 0.0),
        new THREE.Vector3(5.2, -0.25, 0.92),
      ];
    case 4:
      if (streamId === "prior") {
        return [
          new THREE.Vector3(5.2, 2.6, 0.12),
          new THREE.Vector3(6.6, 2.64, 0.05),
          new THREE.Vector3(8.0, 2.65, 0.0),
        ];
      }
      if (streamId === "stream1") {
        return [
          new THREE.Vector3(5.2, -0.52, -0.92),
          new THREE.Vector3(6.6, -0.52, 0.0),
          new THREE.Vector3(8.0, -0.52, -0.92),
          new THREE.Vector3(8.0, 0.15, -0.92),
        ];
      }
      return [
        new THREE.Vector3(5.2, -0.52, 0.92),
        new THREE.Vector3(6.6, 0.52, 0.92),
        new THREE.Vector3(8.0, -0.45, 0.92),
        new THREE.Vector3(8.0, -1.55, 0.0),
        new THREE.Vector3(8.0, -0.25, 0.92),
      ];
    case 5:
      if (streamId === "prior") {
        return [
          new THREE.Vector3(8.0, 2.65, 0.0),
          new THREE.Vector3(9.4, 2.6, 0.0),
          new THREE.Vector3(10.8, 2.5, 0.0),
        ];
      }
      if (streamId === "stream1") {
        return [
          new THREE.Vector3(8.0, -0.52, -0.92),
          new THREE.Vector3(9.4, -0.52, 0.0),
          new THREE.Vector3(10.8, -0.52, -0.92),
          new THREE.Vector3(10.8, 0.15, -0.92),
        ];
      }
      return [
        new THREE.Vector3(8.0, -0.52, 0.92),
        new THREE.Vector3(9.4, 0.52, 0.92),
        new THREE.Vector3(10.8, -0.45, 0.92),
        new THREE.Vector3(10.8, -1.55, 0.0),
        new THREE.Vector3(10.8, -0.25, 0.92),
      ];
    case 6:
      if (streamId === "prior") {
        return [
          new THREE.Vector3(10.8, 2.5, 0.0),
          new THREE.Vector3(12.8, 2.15, 0.0),
          new THREE.Vector3(14.0, 0.65, 0.0),
          new THREE.Vector3(14.7, 0.0, 0.0),
        ];
      }
      return [
        new THREE.Vector3(10.8, -0.35, zStream),
        new THREE.Vector3(12.05, 0.25, zStream * 0.45),
        new THREE.Vector3(13.3, 0.65, 0.0),
        new THREE.Vector3(14.0, 0.0, 0.0),
        new THREE.Vector3(14.7, -0.65, 0.0),
      ];
    case 7:
    default:
      return [
        new THREE.Vector3(14.7, 0.0, 0.0),
        new THREE.Vector3(16.6, 0.0, 0.0),
        new THREE.Vector3(9.5, -2.1, 2.1),
        new THREE.Vector3(-8.2, -0.2, 2.0),
      ];
  }
}

function getFollowStepCameraTarget(
  streamId: Pathway,
  stepIdx: StepIndex,
): { lookAt: THREE.Vector3; radius: number } {
  switch (stepIdx) {
    case 0:
      return {
        lookAt: new THREE.Vector3(streamId === "stream1" ? -6.8 : -9.2, 0.4, 0.3),
        radius: 8.8,
      };
    case 1:
      return { lookAt: new THREE.Vector3(-1.2, 0.15, 0.2), radius: 8.5 };
    case 2:
      return {
        lookAt: new THREE.Vector3(1.2, streamId === "prior" ? 1.2 : -0.2, 0.0),
        radius: 8.2,
      };
    case 3:
      return {
        lookAt: new THREE.Vector3(4.8, streamId === "prior" ? 1.3 : -0.4, 0.0),
        radius: 8.4,
      };
    case 4:
      return {
        lookAt: new THREE.Vector3(7.8, streamId === "prior" ? 1.3 : -0.4, 0.0),
        radius: 8.4,
      };
    case 5:
      return {
        lookAt: new THREE.Vector3(10.4, streamId === "prior" ? 1.3 : -0.4, 0.0),
        radius: 8.4,
      };
    case 6:
      return { lookAt: new THREE.Vector3(13.4, 0.25, 0.0), radius: 8.0 };
    case 7:
    default:
      return { lookAt: new THREE.Vector3(14.8, 0.0, 0.4), radius: 9.2 };
  }
}

export default function AbcModelVisualizer({
  snapshot,
  contextWindow,
  groundTruthFuture,
  step,
  onSelectStep,
  tracing,
  pathway,
  onSelectPathway,
  cameraLock,
  onResetView,
  showMirrorTwin,
  onToggleMirrorTwin,
  showConstantVelocity,
  onToggleConstantVelocity,
  showDampedPrior,
  onToggleDampedPrior,
  tiltDeg,
  tiltHeadingDeg,
  interactiveMode,
  onHeadDrag,
  tapProfiles,
  children,
}: AbcVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Horizon step the error scoreboard reads while the pointer is on its chart.
  const [hoverHorizon, setHoverHorizon] = useState<number | null>(null);
  const badgeRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const leaderLineRefs = useRef<(SVGLineElement | null)[]>([]);
  const leaderDotRefs = useRef<(SVGCircleElement | null)[]>([]);
  const tooltipWrapperRef = useRef<HTMLDivElement | null>(null);
  const hoveredMetaKeyRef = useRef<string>("");
  const [hoveredMeta, setHoveredMeta] = useState<HoverTargetMeta | null>(null);

  // Overlay toggles (hover tooltips, floating 3D callout badges, and HUD info boxes)
  const [showHoverTooltips, setShowHoverTooltips] = useState<boolean>(true);
  const [showFloatingBadges, setShowFloatingBadges] = useState<boolean>(true);
  const [showHudBoxes, setShowHudBoxes] = useState<boolean>(true);
  const [viewMenuOpen, setViewMenuOpen] = useState<boolean>(false);
  const viewMenuRef = useRef<HTMLDivElement>(null);
  const hudLeftRef = useRef<HTMLDivElement>(null);
  const hudRightRef = useRef<HTMLDivElement>(null);
  const hudLegendRef = useRef<HTMLDivElement>(null);
  const zoomHintRef = useRef<HTMLDivElement>(null);
  const [webglUnavailable, setWebglUnavailable] = useState<boolean>(false);
  // The modifier that turns a scroll into a zoom: Ctrl, or ⌘ on Apple keyboards.
  const [zoomKeyLabel, setZoomKeyLabel] = useState<string>("Ctrl");

  // Eleven callout labels bury the scene on a phone-width viewport, so start with them off there.
  useEffect(() => {
    if (window.matchMedia("(max-width: 639px)").matches) {
      setShowFloatingBadges(false);
    }
    if (/Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent)) {
      setZoomKeyLabel("⌘");
    }
  }, []);

  // Close the view menu on an outside press or Escape.
  useEffect(() => {
    if (!viewMenuOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (!viewMenuRef.current?.contains(e.target as Node)) setViewMenuOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewMenuOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [viewMenuOpen]);

  const overlayRef = useRef({
    showHoverTooltips,
    showFloatingBadges,
    showHudBoxes,
  });

  useEffect(() => {
    overlayRef.current = {
      showHoverTooltips,
      showFloatingBadges,
      showHudBoxes,
    };
    if (!showHoverTooltips) {
      hoveredMetaKeyRef.current = "";
      setHoveredMeta(null);
    }
  }, [showHoverTooltips, showFloatingBadges, showHudBoxes]);

  const positionTooltipAtLocalXY = (localX: number, localY: number) => {
    const el = tooltipWrapperRef.current;
    const container = containerRef.current;
    if (!el || !container) return;
    const vpW = container.clientWidth || 960;
    const vpH = container.clientHeight || 640;
    const cardW = el.offsetWidth || 340;
    const cardH = el.offsetHeight || 225;

    let tx = localX + 18;
    if (tx + cardW + 12 > vpW) {
      tx = Math.max(12, localX - cardW - 18);
    }
    let ty = localY - cardH * 0.45;
    const minY = 12;
    const maxY = Math.max(minY + 20, vpH - cardH - 12);
    ty = THREE.MathUtils.clamp(ty, minY, maxY);

    el.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0)`;
  };

  const cameraActionsRef = useRef<{
    zoomBy: (factor: number) => void;
    panBy: (dx: number, dy: number) => void;
    resetCamera: () => void;
  } | null>(null);

  const propsRef = useRef({
    snapshot,
    contextWindow,
    groundTruthFuture,
    step,
    onSelectStep,
    tracing,
    pathway,
    cameraLock,
    showMirrorTwin,
    showConstantVelocity,
    showDampedPrior,
    tiltDeg,
    tiltHeadingDeg,
    interactiveMode,
    onHeadDrag,
    tapProfiles,
  });

  useEffect(() => {
    propsRef.current = {
      snapshot,
      contextWindow,
      groundTruthFuture,
      step,
      onSelectStep,
      tracing,
      pathway,
      cameraLock,
      showMirrorTwin,
      showConstantVelocity,
      showDampedPrior,
      tiltDeg,
      tiltHeadingDeg,
      interactiveMode,
      onHeadDrag,
      tapProfiles,
    };
  }, [
    snapshot,
    contextWindow,
    groundTruthFuture,
    step,
    onSelectStep,
    tracing,
    pathway,
    cameraLock,
    showMirrorTwin,
    showConstantVelocity,
    showDampedPrior,
    tiltDeg,
    tiltHeadingDeg,
    interactiveMode,
    onHeadDrag,
    tapProfiles,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(CAMERA_FOV_DEG, 16 / 9, 0.1, 140);

    const targetSpherical = new THREE.Spherical(overviewRadius(camera.aspect), OVERVIEW_PHI, 0);
    const currentSpherical = targetSpherical.clone();
    const targetLookAt = OVERVIEW_LOOK_AT.clone();
    const currentLookAt = OVERVIEW_LOOK_AT.clone();
    // True once the visitor orbits, pans or zooms; cleared whenever the view is re-framed.
    let userMovedCamera = false;
    let lastViewKey = "";
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Footprints of the HUD overlays, in viewport pixels, used to keep 3D badges off them.
    type HudBox = { left: number; right: number; top: number; bottom: number };
    let hudTopBoxes: (HudBox | null)[] = [];
    let hudLegendBox: HudBox | null = null;
    let hudMeasureCountdown = 0;

    const applySphericalToCamera = () => {
      const offset = new THREE.Vector3().setFromSpherical(currentSpherical);
      camera.position.copy(currentLookAt).add(offset);
      camera.lookAt(currentLookAt);
      camera.updateMatrixWorld();
    };
    applySphericalToCamera();

    // Frames the current selection: the width-fitted overview, or a close-up of one step.
    const frameCurrentView = (snap = false) => {
      const { step: curStep, tracing: isTracing, pathway: curPathway } = propsRef.current;
      if (curStep === null) {
        targetLookAt.copy(OVERVIEW_LOOK_AT);
        targetSpherical.set(overviewRadius(camera.aspect), OVERVIEW_PHI, 0);
      } else {
        const tgt = getFollowStepCameraTarget(isTracing ? curPathway : "stream0", curStep);
        targetLookAt.copy(tgt.lookAt);
        targetSpherical.set(
          Math.min(
            CAMERA_MAX_RADIUS,
            tgt.radius * (isTracing ? 1 : STEP_BROWSE_SCALE) * narrowViewportScale(camera.aspect),
          ),
          STEP_PHI,
          STEP_THETA,
        );
      }
      userMovedCamera = false;
      // Visitors who ask for reduced motion get a cut to the new view instead of a camera flight.
      if (snap || reducedMotionQuery.matches) {
        currentSpherical.copy(targetSpherical);
        currentLookAt.copy(targetLookAt);
      }
    };

    const panCameraInScreenPlane = (pixelDx: number, pixelDy: number) => {
      userMovedCamera = true;
      const panScale = currentSpherical.radius * 0.0015;
      const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
      const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
      targetLookAt.addScaledVector(right, -pixelDx * panScale);
      targetLookAt.addScaledVector(up, pixelDy * panScale);
      targetLookAt.x = THREE.MathUtils.clamp(targetLookAt.x, -14.0, 19.0);
      targetLookAt.y = THREE.MathUtils.clamp(targetLookAt.y, -4.0, 5.0);
      targetLookAt.z = THREE.MathUtils.clamp(targetLookAt.z, -6.5, 6.5);
    };

    const zoomCameraBy = (factor: number) => {
      userMovedCamera = true;
      targetSpherical.radius = THREE.MathUtils.clamp(
        targetSpherical.radius * factor,
        CAMERA_MIN_RADIUS,
        CAMERA_MAX_RADIUS,
      );
    };

    cameraActionsRef.current = {
      zoomBy: zoomCameraBy,
      panBy: panCameraInScreenPlane,
      resetCamera: () => {
        frameCurrentView();
      },
    };

    // Without WebGL (blocked, or no GPU and no software fallback) the frame shows a notice
    // instead of taking the whole page down with an uncaught error.
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch (err) {
      console.warn("k8_combined visualizer: WebGL is unavailable.", err);
      cameraActionsRef.current = null;
      setWebglUnavailable(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    const keyLight = new THREE.DirectionalLight(0x4ade80, 1.45);
    keyLight.position.set(8, 12, 10);
    const rimLight = new THREE.DirectionalLight(0x22d3ee, 1.05);
    rimLight.position.set(-10, 7, -8);
    scene.add(ambientLight, keyLight, rimLight);

    // Floor grid. Same cell size and colours as before under the model (x = -15 .. +22), but it
    // now runs on past it and fades out with distance, so zoomed-out and phone-width views show
    // a floor that dissolves instead of a slab with hard edges.
    const FLOOR_SIZE = 96;
    const FLOOR_DIVISIONS = 144;
    const floorPositions: number[] = [];
    const floorColors: number[] = [];
    const floorCenterColor = new THREE.Color(0x166534);
    const floorLineColor = new THREE.Color(0x052e16);
    const floorHalf = FLOOR_SIZE / 2;
    for (let i = 0; i <= FLOOR_DIVISIONS; i++) {
      const offset = -floorHalf + (i / FLOOR_DIVISIONS) * FLOOR_SIZE;
      const lineColor = i === FLOOR_DIVISIONS / 2 ? floorCenterColor : floorLineColor;
      floorPositions.push(-floorHalf, 0, offset, floorHalf, 0, offset);
      floorPositions.push(offset, 0, -floorHalf, offset, 0, floorHalf);
      for (let v = 0; v < 4; v++) floorColors.push(lineColor.r, lineColor.g, lineColor.b);
    }
    const floorGeometry = new THREE.BufferGeometry();
    floorGeometry.setAttribute("position", new THREE.Float32BufferAttribute(floorPositions, 3));
    floorGeometry.setAttribute("color", new THREE.Float32BufferAttribute(floorColors, 3));
    const floorMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        fadeStart: { value: 19 },
        fadeEnd: { value: 46 },
      },
      vertexShader: `
        attribute vec3 color;
        varying vec3 vColor;
        varying vec2 vPlane;
        void main() {
          vColor = color;
          vPlane = position.xz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float fadeStart;
        uniform float fadeEnd;
        varying vec3 vColor;
        varying vec2 vPlane;
        void main() {
          float fade = 1.0 - smoothstep(fadeStart, fadeEnd, length(vPlane));
          gl_FragColor = vec4(vColor, fade);
          #include <colorspace_fragment>
        }
      `,
    });
    const floorGrid = new THREE.LineSegments(floorGeometry, floorMaterial);
    floorGrid.position.set(3.2, -2.75, 0);
    scene.add(floorGrid);

    // Interactive Raycasting Registry for 3D Hover Tooltips
    const interactiveObjects: THREE.Object3D[] = [];
    const tagHover = <T extends THREE.Object3D>(
      obj: T,
      meta: HoverTargetMeta,
      register = true,
    ): T => {
      obj.userData.hoverMeta = meta;
      if (register) {
        interactiveObjects.push(obj);
      }
      return obj;
    };

    // =========================================================================
    // ZONE 1 (LEFT): VR HEAD-POSE, GRAVITY & MIRROR EQUIVARIANCE ARENA
    // =========================================================================
    const headCenter = new THREE.Vector3(-10.2, 0.45, 0.3);
    const mirrorHeadCenter = new THREE.Vector3(-3.8, 0.45, 0.3);
    const trajectoryRadius = 2.05;

    const { group: observedHead } = createVRHeadsetRig(0x22c55e, 0x4ade80, false);
    observedHead.position.copy(headCenter);
    tagHover(observedHead, { kind: "vr_headset", isMirror: false });
    scene.add(observedHead);

    const { group: mirroredHead } = createVRHeadsetRig(0x06b6d4, 0x22d3ee, true);
    mirroredHead.position.copy(mirrorHeadCenter);
    tagHover(mirroredHead, { kind: "vr_headset", isMirror: true });
    scene.add(mirroredHead);

    // Mirror Plane (x = -7.0 midway between observedHead and mirroredHead)
    const mirrorPlaneGroup = new THREE.Group();
    mirrorPlaneGroup.position.set(-7.0, 0.45, 0.3);
    const planeGeo = new THREE.PlaneGeometry(3.6, 3.8, 8, 8);
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.08,
    });
    const planeWire = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      wireframe: true,
      transparent: true,
      opacity: 0.24,
    });
    const mirrorMesh = new THREE.Mesh(planeGeo, planeMat);
    mirrorMesh.rotation.y = Math.PI / 2;
    const mirrorWireMesh = new THREE.Mesh(planeGeo, planeWire);
    mirrorWireMesh.rotation.y = Math.PI / 2;
    mirrorPlaneGroup.add(mirrorMesh, mirrorWireMesh);
    tagHover(mirrorPlaneGroup, { kind: "mirror_plane" });
    scene.add(mirrorPlaneGroup);

    // World Gravity & Tilt Reference Ring under Observed Head
    const tiltRingGroup = new THREE.Group();
    tiltRingGroup.position.copy(headCenter);
    const ringGeo = new THREE.RingGeometry(1.85, 1.94, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const horizonRing = new THREE.Mesh(ringGeo, ringMat);
    horizonRing.rotation.x = Math.PI / 2;
    tiltRingGroup.add(horizonRing);

    const worldUpArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, -1.55, 0),
      3.25,
      0xa3e635,
      0.3,
      0.15,
    );
    tiltRingGroup.add(worldUpArrow);
    tagHover(tiltRingGroup, { kind: "gravity_ring" });
    scene.add(tiltRingGroup);

    // 20-step Trajectory Lines
    const makeTrajectoryLine = (color: number, dashed = false) => {
      const geo = new THREE.BufferGeometry();
      const positions = new Float32Array(21 * 3);
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const mat = dashed
        ? new THREE.LineDashedMaterial({
            color,
            dashSize: 0.14,
            gapSize: 0.07,
            transparent: true,
            opacity: 0.75,
          })
        : new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95 });
      return new THREE.Line(geo, mat);
    };

    const k8Line = tagHover(makeTrajectoryLine(0x4ade80), {
      kind: "trajectory_curve",
      trajKind: "k8",
    });
    const priorLine = tagHover(makeTrajectoryLine(0x22d3ee), {
      kind: "trajectory_curve",
      trajKind: "prior",
    });
    const constVelLine = tagHover(makeTrajectoryLine(0xf43f5e, true), {
      kind: "trajectory_curve",
      trajKind: "const_vel",
    });
    const gtLine = tagHover(makeTrajectoryLine(0xfacc15), {
      kind: "trajectory_curve",
      trajKind: "ground_truth",
    });
    const mirrorK8Line = tagHover(makeTrajectoryLine(0x38bdf8), {
      kind: "trajectory_curve",
      trajKind: "mirror_k8",
    });
    const errorArcLine = tagHover(makeTrajectoryLine(0xf97316), {
      kind: "trajectory_curve",
      trajKind: "error_arc",
    });
    scene.add(k8Line, priorLine, constVelLine, gtLine, mirrorK8Line, errorArcLine);

    const k8Ghost20 = tagHover(createGhostVisor(0x4ade80, 0.65), {
      kind: "trajectory_curve",
      trajKind: "k8",
    });
    const priorGhost20 = tagHover(createGhostVisor(0x22d3ee, 0.54), {
      kind: "trajectory_curve",
      trajKind: "prior",
    });
    const gtGhost20 = tagHover(createGhostVisor(0xfacc15, 0.6), {
      kind: "trajectory_curve",
      trajKind: "ground_truth",
    });
    const mirrorGhost20 = tagHover(createGhostVisor(0x38bdf8, 0.58), {
      kind: "trajectory_curve",
      trajKind: "mirror_k8",
    });
    scene.add(k8Ghost20, priorGhost20, gtGhost20, mirrorGhost20);

    // =========================================================================
    // ZONE 2 (RIGHT): SPACIOUS 3D LeanTCNN NEURAL ARCHITECTURE GRAPH
    // (archRoot at world origin (0, 0, 0) for clear, uncompressed coordinates)
    // =========================================================================
    const archRoot = new THREE.Group();
    archRoot.position.set(0, 0, 0);
    scene.add(archRoot);

    const pulseTracks: PulseTrack[] = [];
    const stageConnectionMats: {
      mat: THREE.LineBasicMaterial;
      stageGroup: WalkthroughStage;
      baseOpacity: number;
    }[] = [];
    const pulseSphereGeo = new THREE.SphereGeometry(0.065, 10, 10);

    const addConnectionCurve = (
      points: THREE.Vector3[],
      color: number,
      baseOpacity: number,
      stageGroup: WalkthroughStage,
      pulseCount = 1,
      pulseSpeed = 0.42,
      parent: THREE.Object3D = archRoot,
      hoverMeta?: HoverTargetMeta,
    ) => {
      const curve = new THREE.CatmullRomCurve3(points);
      const pts = curve.getPoints(40);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: baseOpacity,
      });
      const line = new THREE.Line(geo, mat);
      if (hoverMeta) {
        tagHover(line, hoverMeta);
      }
      parent.add(line);
      stageConnectionMats.push({ mat, stageGroup, baseOpacity });

      for (let i = 0; i < pulseCount; i++) {
        const pMat = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.95,
        });
        const pMesh = new THREE.Mesh(pulseSphereGeo, pMat);
        if (hoverMeta) {
          tagHover(pMesh, hoverMeta);
        }
        parent.add(pMesh);
        pulseTracks.push({
          curve,
          mesh: pMesh,
          speed: pulseSpeed,
          phase: i / Math.max(1, pulseCount) + Math.random() * 0.2,
          stageGroup,
        });
      }
      return { curve, line, mat };
    };

    // 2A. Sleek 4.0-Second Sliding Context Track (spans x = 1.6 .. 11.6 at y = -2.25, z = -2.35)
    const historyCount = 400;
    const historyStartX = 1.6;
    const historySpanX = 10.0;
    const historyBaseY = -2.25;
    const historyBaseZ = -2.35;

    // Framed Timeline Deck Baseboard
    const deckGeo = new THREE.BoxGeometry(historySpanX + 0.35, 0.035, 0.68);
    const deckMesh = new THREE.Mesh(
      deckGeo,
      new THREE.MeshBasicMaterial({ color: 0x052e16, transparent: true, opacity: 0.55 }),
    );
    deckMesh.position.set(historyStartX + historySpanX * 0.5, historyBaseY - 0.14, historyBaseZ + 0.08);
    tagHover(deckMesh, { kind: "timeline_deck" });
    archRoot.add(deckMesh);

    const deckEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(deckGeo),
      new THREE.LineBasicMaterial({ color: 0x166534, transparent: true, opacity: 0.7 }),
    );
    deckEdges.position.copy(deckMesh.position);
    archRoot.add(deckEdges);

    // 5 Time-Tick Markers (-4.0s, -3.0s, -2.0s, -1.0s, NOW 0.0s)
    for (let tick = 0; tick <= 4; tick++) {
      const tx = historyStartX + (tick / 4) * historySpanX;
      const isNow = tick === 4;
      const tickGeo = new THREE.BoxGeometry(isNow ? 0.05 : 0.025, isNow ? 0.36 : 0.14, 0.66);
      const tickMesh = new THREE.Mesh(
        tickGeo,
        new THREE.MeshBasicMaterial({
          color: isNow ? 0x4ade80 : 0x15803d,
          transparent: true,
          opacity: isNow ? 0.85 : 0.45,
        }),
      );
      tickMesh.position.set(tx, historyBaseY + (isNow ? 0.04 : -0.07), historyBaseZ + 0.08);
      tagHover(tickMesh, { kind: "timeline_deck", tickIdx: tick });
      archRoot.add(tickMesh);
    }

    const historyGeo = new THREE.BufferGeometry();
    const historyPos = new Float32Array(historyCount * 3);
    const historyColors = new Float32Array(historyCount * 3);
    historyGeo.setAttribute("position", new THREE.BufferAttribute(historyPos, 3));
    historyGeo.setAttribute("color", new THREE.BufferAttribute(historyColors, 3));
    const historyLine = new THREE.Line(
      historyGeo,
      new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.95 }),
    );
    tagHover(historyLine, { kind: "timeline_deck" });
    archRoot.add(historyLine);

    // 3 Stepped Receptive-Field Rails on the Timeline Deck, one per block, each banded by
    // the kernel tap that reads those samples (shade alternates tap to tap; samples read
    // through two neighbouring taps are brightest).
    // Block 0: 8 samples, Block 1: 8 × 8 = 64, Block 2: eight 64-sample windows 47 apart = 393.
    const blockColors = [0x4ade80, 0x22d3ee, 0xc084fc];
    const coverageTables = buildCoverageColourTables(historyCount, [8, 8, 8], [1, 8, 47], blockColors);
    const RF_RAIL_HEIGHT = 0.035;
    const RF_RAIL_DEPTH = 0.06;
    const rfRailZOffsets = [0.28, 0.14, 0.0];
    const rfRails: { mesh: THREE.Mesh; material: THREE.MeshBasicMaterial }[] = [];
    const sampleEdgeX = (edge: number) => historyStartX + (edge / (historyCount - 1)) * historySpanX;

    for (let b = 0; b < 3; b++) {
      const table = coverageTables[(3 + b) as StepIndex];
      if (!table) continue;
      const lit = (i: number) => table[i * 3] + table[i * 3 + 1] + table[i * 3 + 2] > 0.5;
      const sameColor = (a: number, c: number) =>
        table[a * 3] === table[c * 3] &&
        table[a * 3 + 1] === table[c * 3 + 1] &&
        table[a * 3 + 2] === table[c * 3 + 2];

      // One box top + front face per run of equally coloured samples.
      const positions: number[] = [];
      const colors: number[] = [];
      const halfD = RF_RAIL_DEPTH / 2;
      const pushQuad = (corners: number[][], i: number) => {
        for (const idx of [0, 1, 2, 0, 2, 3]) {
          positions.push(...corners[idx]);
          colors.push(table[i * 3], table[i * 3 + 1], table[i * 3 + 2]);
        }
      };
      let runStart = -1;
      for (let i = 0; i <= historyCount; i++) {
        const inRun = i < historyCount && lit(i);
        if (runStart >= 0 && (!inRun || !sameColor(i, runStart))) {
          const x0 = sampleEdgeX(runStart - 0.5);
          const x1 = sampleEdgeX(i - 0.5);
          pushQuad(
            [
              [x0, RF_RAIL_HEIGHT, -halfD],
              [x0, RF_RAIL_HEIGHT, halfD],
              [x1, RF_RAIL_HEIGHT, halfD],
              [x1, RF_RAIL_HEIGHT, -halfD],
            ],
            runStart,
          );
          pushQuad(
            [
              [x0, 0, halfD],
              [x1, 0, halfD],
              [x1, RF_RAIL_HEIGHT, halfD],
              [x0, RF_RAIL_HEIGHT, halfD],
            ],
            runStart,
          );
          runStart = -1;
        }
        if (inRun && runStart < 0) runStart = i;
      }

      const railGeo = new THREE.BufferGeometry();
      railGeo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      railGeo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
      const railMat = new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
      });
      const railMesh = new THREE.Mesh(railGeo, railMat);
      railMesh.position.set(
        0,
        historyBaseY - 0.1 - RF_RAIL_HEIGHT / 2,
        historyBaseZ + rfRailZOffsets[b],
      );
      tagHover(railMesh, { kind: "rf_rail", blockIdx: b as 0 | 1 | 2 });
      archRoot.add(railMesh);
      rfRails.push({ mesh: railMesh, material: railMat });
    }

    // 2B. 7 Input Feature Spheres at x = -0.4 (Stream 0 Direct at z = +0.95, Stream 1 Mirror at z = -0.95)
    const inputX = -0.4;
    const inputZ = 0.95;
    const inputSpheres0: THREE.Mesh[] = [];
    const inputSpheres1: THREE.Mesh[] = [];
    const sphereGeo = new THREE.SphereGeometry(0.125, 16, 16);
    const inputSigns = [1, -1, -1, 1, -1, 1, 1];

    for (let f = 0; f < 7; f++) {
      const isGravity = f >= 4;
      const isSpeed = f === 3;
      const baseColor = isGravity ? 0xa3e635 : isSpeed ? 0xf59e0b : 0x4ade80;
      const mat0 = new THREE.MeshStandardMaterial({
        color: baseColor,
        emissive: baseColor,
        emissiveIntensity: 0.55,
      });
      const mat1 = new THREE.MeshStandardMaterial({
        color: isGravity ? 0x38bdf8 : 0x22d3ee,
        emissive: 0x22d3ee,
        emissiveIntensity: 0.5,
      });
      const m0 = new THREE.Mesh(sphereGeo, mat0);
      const m1 = new THREE.Mesh(sphereGeo, mat1);
      const yOffset = (3 - f) * 0.52;
      m0.position.set(inputX, yOffset, inputZ);
      m1.position.set(inputX, yOffset, -inputZ);
      tagHover(m0, { kind: "input_feature", featureIdx: f, streamIdx: 0 });
      tagHover(m1, { kind: "input_feature", featureIdx: f, streamIdx: 1 });
      archRoot.add(m0, m1);
      inputSpheres0.push(m0);
      inputSpheres1.push(m1);

      // Clean straight sign-flip bridge between Stream 0 and Stream 1 input spheres
      const signColor = inputSigns[f] < 0 ? 0xf97316 : 0x22c55e;
      addConnectionCurve(
        [
          new THREE.Vector3(inputX, yOffset, inputZ),
          new THREE.Vector3(inputX, yOffset, -inputZ),
        ],
        signColor,
        0.38,
        2,
        f === 1 || f === 4 ? 1 : 0,
        0.5,
        archRoot,
        { kind: "sign_flip_bridge", featureIdx: f },
      );
    }

    // 2C. Connection Group A: 3 Clean Semantic Trunks from VR Headset (-10.2) -> 7 Native Features (-0.4)
    // Trunk 1: Angular Velocity 2wv (channels 0, 1, 2 around y = +1.04)
    // Trunk 2: L1 Speed |ω|₁ (channel 3 at y = 0.0)
    // Trunk 3: Head-Frame Gravity R(q)ᵀy (channels 4, 5, 6 around y = -1.04)
    const trunkGroups = [
      { yHub: 1.04, channels: [0, 1, 2], color: 0x4ade80, startY: 0.22, trunkIdx: 0 as const },
      { yHub: 0.0, channels: [3], color: 0xf59e0b, startY: 0.0, trunkIdx: 1 as const },
      { yHub: -1.04, channels: [4, 5, 6], color: 0xa3e635, startY: -0.22, trunkIdx: 2 as const },
    ];
    const inputHubX = -1.05;
    for (const tg of trunkGroups) {
      addConnectionCurve(
        [
          headCenter.clone().add(new THREE.Vector3(0.72, tg.startY, 0.1)),
          new THREE.Vector3(-5.4, tg.yHub * 0.85, 1.15),
          new THREE.Vector3(inputHubX, tg.yHub, inputZ),
        ],
        tg.color,
        0.62,
        1,
        1,
        0.4,
        archRoot,
        { kind: "input_trunk", trunkIdx: tg.trunkIdx },
      );
      for (const ch of tg.channels) {
        const yCh = (3 - ch) * 0.52;
        addConnectionCurve(
          [
            new THREE.Vector3(inputHubX, tg.yHub, inputZ),
            new THREE.Vector3(inputX, yCh, inputZ),
          ],
          tg.color,
          0.55,
          1,
          0,
          0.4,
          archRoot,
          { kind: "input_feature", featureIdx: ch, streamIdx: 0 },
        );
      }
    }

    // 2D. 4 Well-Spaced Stage Towers (x = +2.4, +5.2, +8.0, +10.8; spacing = 2.8 units!)
    // Stage 0: 1x1 Projection (32 ch x 2 streams)
    // Stage 1: Block 0 (k=8, d=1, RF=8)
    // Stage 2: Block 1 (k=8, d=8, RF=64)
    // Stage 3: Block 2 (k=8, d=47, RF=393)
    const stageX = [2.4, 5.2, 8.0, 10.8];
    const streamZCenter = 0.92;
    const barGeo = new THREE.BoxGeometry(0.14, 1.0, 0.08);
    const stream0Bars: THREE.Mesh[][] = [];
    const stream1Bars: THREE.Mesh[][] = [];
    const ownConduitMats: THREE.LineBasicMaterial[][] = [];
    const crossConduitMats: THREE.LineBasicMaterial[][] = [];

    // Connection Group B: Vertical Collector Manifolds + 2 Clean Stream Buses into 1x1 Projection (+2.4)
    const collectorX = 0.18;
    // Vertical collector rails for Stream 0 (front) and Stream 1 (back)
    addConnectionCurve(
      [
        new THREE.Vector3(collectorX, 1.56, inputZ),
        new THREE.Vector3(collectorX, -1.56, inputZ),
      ],
      0x4ade80,
      0.55,
      2,
      0,
      0.4,
      archRoot,
      { kind: "collector_bus", streamIdx: 0 },
    );
    addConnectionCurve(
      [
        new THREE.Vector3(collectorX, 1.56, -inputZ),
        new THREE.Vector3(collectorX, -1.56, -inputZ),
      ],
      0x22d3ee,
      0.55,
      2,
      0,
      0.4,
      archRoot,
      { kind: "collector_bus", streamIdx: 1 },
    );
    for (let f = 0; f < 7; f++) {
      const yOffset = (3 - f) * 0.52;
      addConnectionCurve(
        [
          new THREE.Vector3(inputX, yOffset, inputZ),
          new THREE.Vector3(collectorX, yOffset, inputZ),
        ],
        0x4ade80,
        0.5,
        2,
        0,
        0.4,
        archRoot,
        { kind: "input_feature", featureIdx: f, streamIdx: 0 },
      );
      addConnectionCurve(
        [
          new THREE.Vector3(inputX, yOffset, -inputZ),
          new THREE.Vector3(collectorX, yOffset, -inputZ),
        ],
        inputSigns[f] < 0 ? 0xf97316 : 0x22d3ee,
        0.5,
        2,
        0,
        0.4,
        archRoot,
        { kind: "sign_flip_bridge", featureIdx: f },
      );
    }
    // Single clean Stream 0 Direct Bus & Stream 1 Mirror Bus into Stage 0 (1x1 Projection)
    addConnectionCurve(
      [
        new THREE.Vector3(collectorX, -0.52, inputZ),
        new THREE.Vector3(1.25, -0.52, streamZCenter),
        new THREE.Vector3(stageX[0] - 0.32, -0.52, streamZCenter),
      ],
      0x4ade80,
      0.75,
      2,
      2,
      0.48,
      archRoot,
      { kind: "collector_bus", streamIdx: 0 },
    );
    addConnectionCurve(
      [
        new THREE.Vector3(collectorX, -0.52, -inputZ),
        new THREE.Vector3(1.25, -0.52, -streamZCenter),
        new THREE.Vector3(stageX[0] - 0.32, -0.52, -streamZCenter),
      ],
      0x22d3ee,
      0.75,
      2,
      2,
      0.48,
      archRoot,
      { kind: "collector_bus", streamIdx: 1 },
    );

    const xCouplingDotGeo = new THREE.SphereGeometry(0.075, 12, 12);

    for (let s = 0; s < 4; s++) {
      const stageIdxTyped = s as 0 | 1 | 2 | 3;
      const bars0: THREE.Mesh[] = [];
      const bars1: THREE.Mesh[] = [];
      const x = stageX[s];

      // Base slabs for Stream 0 (front, green) and Stream 1 (back, cyan)
      const slabGeo = new THREE.BoxGeometry(0.86, 0.055, 1.12);
      const slab0 = new THREE.Mesh(
        slabGeo,
        new THREE.MeshBasicMaterial({ color: 0x166534, transparent: true, opacity: 0.55 }),
      );
      slab0.position.set(x, -1.22, streamZCenter);
      tagHover(slab0, { kind: "stage_slab", stageIdx: stageIdxTyped, streamIdx: 0 });
      const slab1 = new THREE.Mesh(
        slabGeo,
        new THREE.MeshBasicMaterial({ color: 0x155e75, transparent: true, opacity: 0.55 }),
      );
      slab1.position.set(x, -1.22, -streamZCenter);
      tagHover(slab1, { kind: "stage_slab", stageIdx: stageIdxTyped, streamIdx: 1 });
      archRoot.add(slab0, slab1);

      for (let c = 0; c < 32; c++) {
        const col = Math.floor(c / 16);
        const row = c % 16;
        const localX = x + (col - 0.5) * 0.28;
        const localZ0 = streamZCenter - 0.42 + (row / 15) * 0.84;
        const localZ1 = -streamZCenter + 0.42 - (row / 15) * 0.84;

        const mat0 = new THREE.MeshStandardMaterial({
          color: 0x22c55e,
          emissive: 0x4ade80,
          emissiveIntensity: 0.35,
          roughness: 0.3,
        });
        const mat1 = new THREE.MeshStandardMaterial({
          color: 0x06b6d4,
          emissive: 0x22d3ee,
          emissiveIntensity: 0.35,
          roughness: 0.3,
        });

        const b0 = new THREE.Mesh(barGeo, mat0);
        const b1 = new THREE.Mesh(barGeo, mat1);
        b0.position.set(localX, -0.95, localZ0);
        b1.position.set(localX, -0.95, localZ1);
        tagHover(b0, { kind: "feature_bar", stageIdx: stageIdxTyped, streamIdx: 0, channelIdx: c });
        tagHover(b1, { kind: "feature_bar", stageIdx: stageIdxTyped, streamIdx: 1, channelIdx: c });
        archRoot.add(b0, b1);
        bars0.push(b0);
        bars1.push(b1);
      }

      stream0Bars.push(bars0);
      stream1Bars.push(bars1);

      // Connection Group C: 4 Unmistakable Single-Purpose Conduits per Block Gap
      // 1) Own-Stream A (h0 -> h0, green), 2) Own-Stream A (h1 -> h1, cyan),
      // 3) Single Central Cross-Stream X-Bridge B ([[A,B],[B,A]] h0 <-> h1),
      // 4) Overhead Residual Skip Arch (+ x)
      if (s >= 1) {
        const blockIdxTyped = (s - 1) as 0 | 1 | 2;
        const prevX = stageX[s - 1];
        const midX = (prevX + x) * 0.5;
        const ownMats: THREE.LineBasicMaterial[] = [];
        const crossMats: THREE.LineBasicMaterial[] = [];
        const busY = -0.52;

        // 1 & 2: Single Own-Stream Conduits (A: h0->h0 front, A: h1->h1 back)
        const c0 = addConnectionCurve(
          [
            new THREE.Vector3(prevX + 0.28, busY, streamZCenter),
            new THREE.Vector3(midX, busY, streamZCenter),
            new THREE.Vector3(x - 0.28, busY, streamZCenter),
          ],
          0x4ade80,
          0.78,
          3,
          1,
          0.46,
          archRoot,
          { kind: "own_conduit", blockIdx: blockIdxTyped, streamIdx: 0 },
        );
        const c1 = addConnectionCurve(
          [
            new THREE.Vector3(prevX + 0.28, busY, -streamZCenter),
            new THREE.Vector3(midX, busY, -streamZCenter),
            new THREE.Vector3(x - 0.28, busY, -streamZCenter),
          ],
          0x22d3ee,
          0.78,
          3,
          1,
          0.46,
          archRoot,
          { kind: "own_conduit", blockIdx: blockIdxTyped, streamIdx: 1 },
        );
        ownMats.push(c0.mat, c1.mat);

        // 3: Single Clean X-Bridge for Cross-Stream Coupling B ([[A,B],[B,A]])
        const x01 = addConnectionCurve(
          [
            new THREE.Vector3(prevX + 0.28, busY, streamZCenter - 0.08),
            new THREE.Vector3(midX, busY, 0.0),
            new THREE.Vector3(x - 0.28, busY, -streamZCenter + 0.08),
          ],
          0x38bdf8,
          0.68,
          2,
          1,
          0.42,
          archRoot,
          { kind: "cross_bridge", blockIdx: blockIdxTyped, fromStream: 0 },
        );
        const x10 = addConnectionCurve(
          [
            new THREE.Vector3(prevX + 0.28, busY, -streamZCenter + 0.08),
            new THREE.Vector3(midX, busY, 0.0),
            new THREE.Vector3(x - 0.28, busY, streamZCenter - 0.08),
          ],
          0x34d399,
          0.68,
          2,
          1,
          0.42,
          archRoot,
          { kind: "cross_bridge", blockIdx: blockIdxTyped, fromStream: 1 },
        );
        crossMats.push(x01.mat, x10.mat);

        // Central coupling node at the intersection of the X-Bridge
        const xDot = new THREE.Mesh(
          xCouplingDotGeo,
          new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.85 }),
        );
        xDot.position.set(midX, busY, 0.0);
        tagHover(xDot, { kind: "x_gate_node", blockIdx: blockIdxTyped });
        archRoot.add(xDot);

        // 4: Single Overhead Residual Skip Arch (+ x) per stream
        addConnectionCurve(
          [
            new THREE.Vector3(prevX + 0.14, 0.18, streamZCenter),
            new THREE.Vector3(midX, 0.72, streamZCenter),
            new THREE.Vector3(x - 0.14, 0.18, streamZCenter),
          ],
          0xa3e635,
          0.65,
          3,
          1,
          0.5,
          archRoot,
          { kind: "residual_skip", blockIdx: blockIdxTyped, streamIdx: 0 },
        );
        addConnectionCurve(
          [
            new THREE.Vector3(prevX + 0.14, 0.18, -streamZCenter),
            new THREE.Vector3(midX, 0.72, -streamZCenter),
            new THREE.Vector3(x - 0.14, 0.18, -streamZCenter),
          ],
          0x67e8f9,
          0.65,
          3,
          1,
          0.5,
          archRoot,
          { kind: "residual_skip", blockIdx: blockIdxTyped, streamIdx: 1 },
        );

        ownConduitMats.push(ownMats);
        crossConduitMats.push(crossMats);
      }
    }

    // 2E. Zero-Crossing Causal Tap Architecture:
    // - 3 Parallel Straight Floor Feeder Buses (at x = 5.2, 8.0, 10.8) from Timeline Deck to each Block
    // - Dedicated k=8 Causal Kernel Comb directly under each Block (8 tap LEDs + 8 vertical pins)
    // - 8 Historical Tap Markers on the 400-Sample Waveform (without crossing air-wires)
    const blockTimelineMarkers: THREE.Mesh[][] = [];
    const blockCombMarkers: THREE.Mesh[][] = [];
    const blockCombPinMats: THREE.LineBasicMaterial[] = [];
    const tapColors = blockColors;
    const tapMarkerGeo = new THREE.SphereGeometry(0.055, 8, 8);
    const combBarGeo = new THREE.BoxGeometry(0.84, 0.04, 0.12);

    for (let b = 0; b < 3; b++) {
      const blockIdxTyped = b as 0 | 1 | 2;
      const bx = stageX[b + 1];
      const col = tapColors[b];
      const combY = COMB_Y;
      const combZ = 0.0;

      // Local k=8 Kernel Comb Bar mounted directly under Block b
      const combBar = new THREE.Mesh(
        combBarGeo,
        new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.45 }),
      );
      combBar.position.set(bx, combY, combZ);
      tagHover(combBar, { kind: "kernel_comb_bar", blockIdx: blockIdxTyped });
      archRoot.add(combBar);

      // Single Straight Orthogonal Feeder Bus from Timeline Deck (z = -2.02) to Block b's Comb (z = 0.0)
      addConnectionCurve(
        [
          new THREE.Vector3(bx, historyBaseY - 0.08, historyBaseZ + 0.32),
          new THREE.Vector3(bx, -1.95, -1.05),
          new THREE.Vector3(bx, combY, combZ),
        ],
        col,
        0.75,
        3,
        2,
        0.44,
        archRoot,
        { kind: "feeder_bus", blockIdx: blockIdxTyped },
      );
      // Feed from Comb into Stream 0 (+0.92) and Stream 1 (-0.92) slab bases
      addConnectionCurve(
        [
          new THREE.Vector3(bx, combY, combZ),
          new THREE.Vector3(bx, -1.24, streamZCenter),
        ],
        col,
        0.65,
        3,
        1,
        0.55,
        archRoot,
        { kind: "kernel_comb_bar", blockIdx: blockIdxTyped },
      );
      addConnectionCurve(
        [
          new THREE.Vector3(bx, combY, combZ),
          new THREE.Vector3(bx, -1.24, -streamZCenter),
        ],
        col,
        0.65,
        3,
        1,
        0.55,
        archRoot,
        { kind: "kernel_comb_bar", blockIdx: blockIdxTyped },
      );

      // 8 Short Vertical Pins + 8 Glowing Kernel Tap Nodes on the Local Comb
      const pinGeo = new THREE.BufferGeometry();
      const pinPos = new Float32Array(8 * 2 * 3);
      const combNodes: THREE.Mesh[] = [];
      const waveMarkers: THREE.Mesh[] = [];

      for (let m = 0; m < 8; m++) {
        const tapLocalX = bx - 0.35 + (m / 7) * 0.7;
        pinPos.set([tapLocalX, combY, combZ, tapLocalX, combY + COMB_PIN_HEIGHT, combZ], m * 6);

        const cNode = new THREE.Mesh(
          tapMarkerGeo,
          new THREE.MeshBasicMaterial({ color: col }),
        );
        cNode.position.set(tapLocalX, combY, combZ);
        tagHover(cNode, { kind: "kernel_comb_tap", blockIdx: blockIdxTyped, tapIdx: m });
        archRoot.add(cNode);
        combNodes.push(cNode);

        const wMarker = new THREE.Mesh(
          tapMarkerGeo,
          new THREE.MeshBasicMaterial({ color: col }),
        );
        tagHover(wMarker, { kind: "timeline_tap", blockIdx: blockIdxTyped, tapIdx: m });
        archRoot.add(wMarker);
        waveMarkers.push(wMarker);
      }

      pinGeo.setAttribute("position", new THREE.BufferAttribute(pinPos, 3));
      const pinMat = new THREE.LineBasicMaterial({
        color: col,
        transparent: true,
        opacity: 0.65,
      });
      const pinSegs = new THREE.LineSegments(pinGeo, pinMat);
      tagHover(pinSegs, { kind: "kernel_comb_bar", blockIdx: blockIdxTyped });
      archRoot.add(pinSegs);

      blockCombPinMats.push(pinMat);
      blockCombMarkers.push(combNodes);
      blockTimelineMarkers.push(waveMarkers);
    }

    // 2F. Polynomial Basis Readout Knobs (x = 13.3, 14.0, 14.7) + Cayley Map Orb (x = 16.6)
    const knobSpheres: THREE.Mesh[] = [];
    const knobGeo = new THREE.OctahedronGeometry(0.13, 1);
    const axisColors = [0x22d3ee, 0x4ade80, 0xf59e0b]; // x nod, y turn, z tilt
    const knobStartX = 13.3;
    const knobStepX = 0.7;
    const cayleyX = 16.6;

    for (let j = 0; j < 3; j++) {
      const basisIdxTyped = j as 0 | 1 | 2;
      for (let axis = 0; axis < 3; axis++) {
        const axisIdxTyped = axis as 0 | 1 | 2;
        const knobMeta: HoverTargetMeta = {
          kind: "readout_knob",
          basisIdx: basisIdxTyped,
          axisIdx: axisIdxTyped,
        };
        const mat = new THREE.MeshStandardMaterial({
          color: axisColors[axis],
          emissive: axisColors[axis],
          emissiveIntensity: 0.55,
        });
        const mesh = new THREE.Mesh(knobGeo, mat);
        const kx = knobStartX + j * knobStepX;
        const ky = (1 - axis) * 0.65;
        mesh.position.set(kx, ky, 0);
        tagHover(mesh, knobMeta);
        archRoot.add(mesh);
        knobSpheres.push(mesh);

        // Connection Group E: Block 2 (+10.8) -> Cubic Knobs (+13.3)
        if (j === 0) {
          addConnectionCurve(
            [
              new THREE.Vector3(stageX[3] + 0.25, -0.35, streamZCenter),
              new THREE.Vector3(12.05, ky * 0.65, 0.42),
              new THREE.Vector3(kx, ky, 0),
            ],
            axisColors[axis],
            0.55,
            4,
            1,
            0.5,
            archRoot,
            knobMeta,
          );
          addConnectionCurve(
            [
              new THREE.Vector3(stageX[3] + 0.25, -0.35, -streamZCenter),
              new THREE.Vector3(12.05, ky * 0.65, -0.42),
              new THREE.Vector3(kx, ky, 0),
            ],
            axis === 0 ? 0x22d3ee : 0xf97316,
            0.55,
            4,
            1,
            0.5,
            archRoot,
            knobMeta,
          );
        }

        if (j < 2) {
          addConnectionCurve(
            [
              new THREE.Vector3(kx, ky, 0),
              new THREE.Vector3(kx + knobStepX, ky, 0),
            ],
            axisColors[axis],
            0.5,
            4,
            0,
            0.5,
            archRoot,
            knobMeta,
          );
        } else {
          addConnectionCurve(
            [
              new THREE.Vector3(kx, ky, 0),
              new THREE.Vector3(15.65, ky * 0.45, 0),
              new THREE.Vector3(cayleyX, 0, 0),
            ],
            axisColors[axis],
            0.65,
            5,
            1,
            0.55,
            archRoot,
            knobMeta,
          );
        }
      }
    }

    // Cayley Map Normalize((2, r_k)) Node at x = 16.6
    const cayleyGroup = new THREE.Group();
    cayleyGroup.position.set(cayleyX, 0.0, 0.0);
    const cayleySphere = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.38, 2),
      new THREE.MeshStandardMaterial({
        color: 0x052e16,
        emissive: 0x4ade80,
        emissiveIntensity: 0.7,
        wireframe: true,
      }),
    );
    tagHover(cayleySphere, { kind: "cayley_orb" });
    cayleyGroup.add(cayleySphere);
    archRoot.add(cayleyGroup);

    // 2G. Connection Group F: Damped-Velocity Prior Overhead Bypass Tube
    // Runs from Native Rate Input (-0.4) high above the TCN (y = +2.65) into Cayley/Basis Fused MatMul (16.6)
    addConnectionCurve(
      [
        new THREE.Vector3(inputX, 1.04, inputZ),
        new THREE.Vector3(2.4, 2.45, 0.35),
        new THREE.Vector3(8.0, 2.65, 0.0),
        new THREE.Vector3(13.6, 2.35, 0.0),
        new THREE.Vector3(cayleyX, 0.36, 0.0),
      ],
      0x22d3ee,
      0.82,
      4,
      3,
      0.32,
      archRoot,
      { kind: "prior_bypass" },
    );

    // 2H. Connection Group G: Output Forecast Return Arc from Cayley Node (16.6) back to 200ms Trajectory (-10.2)
    const returnForecastCurve = addConnectionCurve(
      [
        new THREE.Vector3(cayleyX, -0.32, 0.0),
        new THREE.Vector3(9.5, -2.25, 2.2),
        new THREE.Vector3(0.0, -2.35, 2.8),
        new THREE.Vector3(-8.2, -0.45, 2.1),
      ],
      0x4ade80,
      0.55,
      5,
      3,
      0.34,
      archRoot,
      { kind: "return_arc" },
    );

    // 2I. 3D Signal Tracer Beacon + 28-Point Comet Trail for "Follow Signal Stream" Mode
    const tracerGroup = new THREE.Group();
    tracerGroup.visible = false;

    const tracerCoreMat = new THREE.MeshBasicMaterial({ color: 0x4ade80 });
    const tracerCore = new THREE.Mesh(new THREE.SphereGeometry(0.18, 20, 20), tracerCoreMat);
    tracerGroup.add(tracerCore);

    const tracerHaloMat = new THREE.MeshBasicMaterial({
      color: 0x86efac,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const tracerHalo = new THREE.Mesh(new THREE.OctahedronGeometry(0.36, 1), tracerHaloMat);
    tracerGroup.add(tracerHalo);

    const tracerRingMat = new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
    });
    const tracerRing = new THREE.Mesh(new THREE.RingGeometry(0.38, 0.48, 32), tracerRingMat);
    tracerRing.rotation.x = Math.PI / 2;
    tracerGroup.add(tracerRing);

    const tracerBeamGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -1.5, 0),
    ]);
    const tracerBeamMat = new THREE.LineBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.5,
    });
    const tracerBeam = new THREE.Line(tracerBeamGeo, tracerBeamMat);
    tracerGroup.add(tracerBeam);
    scene.add(tracerGroup);

    const trailCount = 28;
    const trailGeo = new THREE.BufferGeometry();
    const trailPos = new Float32Array(trailCount * 3);
    trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPos, 3));
    const trailMat = new THREE.LineBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.9,
    });
    const tracerTrailLine = new THREE.Line(trailGeo, trailMat);
    tracerTrailLine.visible = false;
    scene.add(tracerTrailLine);

    // 2J. 3D Hover Highlight Halo Indicator
    const hoverMarkerGroup = new THREE.Group();
    hoverMarkerGroup.visible = false;
    const hoverHaloMat = new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      wireframe: true,
      transparent: true,
      opacity: 0.9,
    });
    const hoverHaloMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 1), hoverHaloMat);
    const hoverRingMat = new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });
    const hoverRingMesh = new THREE.Mesh(new THREE.RingGeometry(0.24, 0.31, 28), hoverRingMat);
    hoverRingMesh.rotation.x = Math.PI / 2;
    hoverMarkerGroup.add(hoverHaloMesh, hoverRingMesh);
    scene.add(hoverMarkerGroup);

    const raycaster = new THREE.Raycaster();
    raycaster.params.Line.threshold = 0.22;
    const pointerNdc = new THREE.Vector2();
    let activeHoverObject: THREE.Object3D | null = null;
    let activeHoverHitPoint: THREE.Vector3 | null = null;
    let activeHoverMetaLocal: HoverTargetMeta | null = null;

    const findHoverMeta = (
      obj: THREE.Object3D | null,
    ): { meta: HoverTargetMeta; rootObj: THREE.Object3D } | null => {
      let cur: THREE.Object3D | null = obj;
      while (cur) {
        if (cur.userData?.hoverMeta) {
          return { meta: cur.userData.hoverMeta as HoverTargetMeta, rootObj: cur };
        }
        cur = cur.parent;
      }
      return null;
    };

    const isVisibleInHierarchy = (obj: THREE.Object3D | null): boolean => {
      let cur: THREE.Object3D | null = obj;
      while (cur) {
        if (!cur.visible) return false;
        cur = cur.parent;
      }
      return true;
    };

    const getHoverPriority = (meta: HoverTargetMeta, hitObj: THREE.Object3D): number => {
      switch (meta.kind) {
        case "input_feature":
        case "kernel_comb_tap":
        case "timeline_tap":
        case "x_gate_node":
        case "readout_knob":
        case "cayley_orb":
          return 4.0;
        case "feature_bar":
          return 3.5;
        case "sign_flip_bridge":
        case "own_conduit":
        case "cross_bridge":
        case "residual_skip":
        case "prior_bypass":
        case "rf_rail":
        case "kernel_comb_bar":
        case "feeder_bus":
        case "input_trunk":
        case "collector_bus":
        case "return_arc":
        case "vr_headset":
        case "trajectory_curve":
          return hitObj instanceof THREE.Mesh ? 3.0 : 2.2;
        case "stage_slab":
        case "timeline_deck":
          return 1.0;
        case "mirror_plane":
        case "gravity_ring":
        default:
          return 0.5;
      }
    };

    // Pointer, Pan, Scroll-Wheel Zoom & Raycast Hover Interaction
    let isPointerDown = false;
    let pointerButton = 0;
    let prevPointer = { x: 0, y: 0 };
    let pointerDownPos = { x: 0, y: 0 };

    // Touch pinch: two fingers on the canvas zoom the camera.
    const touchPoints = new Map<number, { x: number; y: number }>();
    let pinchSpan = 0;
    // Set once a press becomes a pinch, so lifting the fingers is not read as a tap.
    let pressBecamePinch = false;
    const measurePinchSpan = () => {
      const [a, b] = [...touchPoints.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };

    interface PickCandidate {
      meta: HoverTargetMeta;
      hitObj: THREE.Object3D;
      point: THREE.Vector3;
      distance: number;
      priority: number;
    }

    // The scene element under a viewport-local point, preferring solid parts over thin lines.
    const pickAt = (localX: number, localY: number, rect: DOMRect): PickCandidate | null => {
      pointerNdc.x = (localX / Math.max(1, rect.width)) * 2 - 1;
      pointerNdc.y = -(localY / Math.max(1, rect.height)) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, camera);

      const candidates: PickCandidate[] = [];
      for (const hit of raycaster.intersectObjects(interactiveObjects, true)) {
        if (!isVisibleInHierarchy(hit.object)) continue;
        const found = findHoverMeta(hit.object);
        if (!found) continue;
        candidates.push({
          meta: found.meta,
          hitObj: hit.object,
          point: hit.point.clone(),
          distance: hit.distance,
          priority: getHoverPriority(found.meta, hit.object),
        });
      }
      if (candidates.length === 0) return null;

      const hasSolidHit = candidates.some((c) => c.priority >= 1.0);
      const pool = hasSolidHit ? candidates.filter((c) => c.priority >= 1.0) : candidates;
      const minDist = Math.min(...pool.map((c) => c.distance));
      const nearby = pool.filter((c) => c.distance <= minDist + 1.15);
      nearby.sort((a, b) =>
        b.priority !== a.priority ? b.priority - a.priority : a.distance - b.distance,
      );
      return nearby[0] ?? pool[0];
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") {
        touchPoints.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (touchPoints.size === 1) {
          pressBecamePinch = false;
          // A finger has no hover phase, so pick what it landed on; a tap then selects it.
          const rect = renderer.domElement.getBoundingClientRect();
          const tapped = pickAt(e.clientX - rect.left, e.clientY - rect.top, rect);
          activeHoverMetaLocal = tapped ? tapped.meta : null;
        } else if (touchPoints.size === 2) {
          pressBecamePinch = true;
          pinchSpan = measurePinchSpan();
        }
      } else {
        pressBecamePinch = false;
      }
      isPointerDown = true;
      pointerButton = e.button;
      prevPointer = { x: e.clientX, y: e.clientY };
      pointerDownPos = { x: e.clientX, y: e.clientY };
      renderer.domElement.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch" && touchPoints.has(e.pointerId)) {
        touchPoints.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (touchPoints.size >= 2) {
          const span = measurePinchSpan();
          if (pinchSpan > 0 && span > 0) zoomCameraBy(pinchSpan / span);
          pinchSpan = span;
          return;
        }
      }

      const rect = renderer.domElement.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;

      if (!isPointerDown) {
        const chosen = pickAt(localX, localY, rect);

        if (chosen) {
          renderer.domElement.style.cursor = "pointer";
          activeHoverObject = chosen.hitObj;
          activeHoverHitPoint = chosen.point;
          activeHoverMetaLocal = chosen.meta;

          if (overlayRef.current.showHoverTooltips) {
            positionTooltipAtLocalXY(localX, localY);
            hoverMarkerGroup.visible = true;

            const metaKey = JSON.stringify(chosen.meta);
            if (hoveredMetaKeyRef.current !== metaKey) {
              hoveredMetaKeyRef.current = metaKey;
              const info = buildHoverTooltipContent(
                chosen.meta,
                propsRef.current.snapshot,
                propsRef.current.groundTruthFuture,
                propsRef.current.contextWindow,
              );
              hoverHaloMat.color.setHex(info.highlightHex);
              hoverRingMat.color.setHex(info.highlightHex);
              setHoveredMeta(chosen.meta);
            }
          } else {
            hoverMarkerGroup.visible = false;
            if (hoveredMetaKeyRef.current !== "") {
              hoveredMetaKeyRef.current = "";
              setHoveredMeta(null);
            }
          }
        } else {
          renderer.domElement.style.cursor = "";
          activeHoverObject = null;
          activeHoverHitPoint = null;
          activeHoverMetaLocal = null;
          hoverMarkerGroup.visible = false;
          if (hoveredMetaKeyRef.current !== "") {
            hoveredMetaKeyRef.current = "";
            setHoveredMeta(null);
          }
        }
        return;
      }

      if (hoveredMetaKeyRef.current !== "") {
        hoveredMetaKeyRef.current = "";
        hoverMarkerGroup.visible = false;
        setHoveredMeta(null);
      }

      const dx = e.clientX - prevPointer.x;
      const dy = e.clientY - prevPointer.y;
      prevPointer = { x: e.clientX, y: e.clientY };

      const isPanGesture = pointerButton === 1 || pointerButton === 2 || e.shiftKey;

      if (isPanGesture) {
        panCameraInScreenPlane(dx, dy);
      } else if (propsRef.current.interactiveMode && propsRef.current.onHeadDrag && !e.altKey) {
        propsRef.current.onHeadDrag(dx * 0.45, dy * 0.35);
      } else {
        userMovedCamera = true;
        targetSpherical.theta -= dx * 0.0075;
        targetSpherical.phi = THREE.MathUtils.clamp(
          targetSpherical.phi - dy * 0.0065,
          0.12,
          Math.PI * 0.485,
        );
      }
    };

    // Forget a lifted finger. If one finger is left after a pinch it carries on as an orbit drag,
    // starting from where it is now rather than from where the pinch began.
    const releaseTouch = (e: PointerEvent) => {
      if (!touchPoints.delete(e.pointerId)) return;
      if (touchPoints.size < 2) pinchSpan = 0;
      if (touchPoints.size === 1) {
        const [remaining] = [...touchPoints.values()];
        prevPointer = { x: remaining.x, y: remaining.y };
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      const dragDist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (
        isPointerDown &&
        pointerButton === 0 &&
        dragDist < 5 &&
        !pressBecamePinch &&
        activeHoverMetaLocal
      ) {
        propsRef.current.onSelectStep?.(stepForHoverMeta(activeHoverMetaLocal));
      }
      releaseTouch(e);
      isPointerDown = touchPoints.size > 0;
      if (renderer.domElement.hasPointerCapture(e.pointerId)) {
        renderer.domElement.releasePointerCapture(e.pointerId);
      }
    };

    // A touch drag that the browser claims for page scrolling ends in pointercancel, not pointerup.
    const handlePointerCancel = (e: PointerEvent) => {
      releaseTouch(e);
      isPointerDown = touchPoints.size > 0;
      if (renderer.domElement.hasPointerCapture(e.pointerId)) {
        renderer.domElement.releasePointerCapture(e.pointerId);
      }
    };

    // Two fingers belong to the pinch; stop the browser from also scrolling the page with them.
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length >= 2 && e.cancelable) e.preventDefault();
    };

    const handlePointerLeave = () => {
      if (!isPointerDown) {
        renderer.domElement.style.cursor = "";
        activeHoverObject = null;
        activeHoverHitPoint = null;
        activeHoverMetaLocal = null;
        hoverMarkerGroup.visible = false;
        if (hoveredMetaKeyRef.current !== "") {
          hoveredMetaKeyRef.current = "";
          setHoveredMeta(null);
        }
      }
    };

    let zoomHintTimer: number | null = null;
    const flashZoomHint = () => {
      const hint = zoomHintRef.current;
      if (!hint) return;
      hint.style.opacity = "1";
      if (zoomHintTimer !== null) window.clearTimeout(zoomHintTimer);
      zoomHintTimer = window.setTimeout(() => {
        hint.style.opacity = "0";
        zoomHintTimer = null;
      }, 1400);
    };

    const handleWheel = (e: WheelEvent) => {
      // A plain scroll belongs to the page, so the canvas no longer swallows it. Zooming takes
      // Ctrl/⌘ + scroll, which is also what a trackpad pinch reports.
      if (!e.ctrlKey && !e.metaKey) {
        flashZoomHint();
        return;
      }
      e.preventDefault();
      const clampedDelta = THREE.MathUtils.clamp(e.deltaY, -120, 120);
      // A wheel notch reports about 100; pinches and precision trackpads send many small deltas.
      const sensitivity = Math.abs(clampedDelta) < 40 ? 0.01 : 0.0014;
      zoomCameraBy(Math.exp(clampedDelta * sensitivity));
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const canvasEl = renderer.domElement;
    // The drawing buffer is sized in device pixels (see handleResize), so the element itself
    // must be pinned to the container or it overflows on high-DPI screens.
    canvasEl.style.display = "block";
    canvasEl.style.width = "100%";
    canvasEl.style.height = "100%";
    // Horizontal drags orbit the scene; vertical swipes still scroll the page on touch screens.
    canvasEl.style.touchAction = "pan-y";
    canvasEl.addEventListener("pointerdown", handlePointerDown);
    canvasEl.addEventListener("pointermove", handlePointerMove);
    canvasEl.addEventListener("pointerup", handlePointerUp);
    canvasEl.addEventListener("pointercancel", handlePointerCancel);
    canvasEl.addEventListener("pointerleave", handlePointerLeave);
    canvasEl.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvasEl.addEventListener("wheel", handleWheel, { passive: false });
    canvasEl.addEventListener("contextmenu", handleContextMenu);

    let viewportW = 1;
    let viewportH = 1;
    let hasFramedOnce = false;
    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      viewportW = Math.max(1, rect.width);
      viewportH = Math.max(1, rect.height);
      camera.aspect = viewportW / viewportH;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(viewportW, viewportH, false);
      // Keep the framing fitted to the new aspect unless the visitor has moved the camera.
      if (!userMovedCamera) {
        frameCurrentView(!hasFramedOnce);
        hasFramedOnce = true;
      }
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    handleResize();

    let animId: number | null = null;
    const timer = new THREE.Timer();
    // Stops the clock while the tab is hidden, so nothing lurches forward on return.
    timer.connect(document);
    const projVec = new THREE.Vector3();
    const anchorProjVec = new THREE.Vector3();

    // Signal tracing: the packet makes one pass along the current step's path per step interval.
    let traceKey = "";
    let traceStepStart = 0;
    let traceCurve: THREE.CatmullRomCurve3 | null = null;

    // Rendering stops while the viewport is scrolled out of view and resumes when it returns.
    let isOnScreen = true;

    const animate = () => {
      if (!isOnScreen) {
        animId = null;
        return;
      }
      animId = requestAnimationFrame(animate);
      // Not fed the rAF timestamp: that can predate the timer's creation, and a negative
      // elapsed time would put the pulse animations before the start of their curves.
      timer.update();
      const elapsed = timer.getElapsed();
      // Clamped so the first frame after a pause does not count as one huge step.
      const delta = Math.min(timer.getDelta(), 0.1);
      const {
        snapshot: snap,
        contextWindow: ctxWin,
        groundTruthFuture: gtFuture,
        step: curStep,
        tracing: isFollowing,
        pathway: curFollowStream,
        cameraLock: isCamLocked,
        showMirrorTwin: mirrorOn,
        showConstantVelocity: constVelOn,
        showDampedPrior: priorOn,
        tiltDeg: curTiltDeg,
        tiltHeadingDeg: curTiltHeading,
        tapProfiles: curTapProfiles,
      } = propsRef.current;

      // The scene highlights by stage; a step maps onto exactly one stage (overview = 0).
      const curStage: WalkthroughStage = stageForStep(curStep);
      const curFollowStep: StepIndex = curStep ?? 0;

      // 1. Camera Interpolation (Spherical Orbit + Pan + Scroll Zoom + Selection Framing)
      const viewKey = `${curStep ?? "overview"}|${isFollowing ? curFollowStream : "browse"}|${isCamLocked ? 1 : 0}`;
      if (viewKey !== lastViewKey) {
        lastViewKey = viewKey;
        // While tracing with the camera unlocked, the visitor keeps control of the view.
        if (!isFollowing || isCamLocked) {
          frameCurrentView();
        }
      }
      // Time-based easing (0.12 per frame at 60 Hz), so the camera moves at the same speed on
      // 120 Hz and 30 Hz displays.
      const cameraEase = 1 - Math.exp(-delta * 7.7);
      currentSpherical.radius += (targetSpherical.radius - currentSpherical.radius) * cameraEase;
      currentSpherical.phi += (targetSpherical.phi - currentSpherical.phi) * cameraEase;
      currentSpherical.theta += (targetSpherical.theta - currentSpherical.theta) * cameraEase;
      currentLookAt.lerp(targetLookAt, cameraEase);
      applySphericalToCamera();

      // 1B. Animate 3D Signal Tracer Beacon & Comet Trail when Follow Signal Stream is active
      tracerGroup.visible = isFollowing;
      tracerTrailLine.visible = isFollowing;
      if (isFollowing) {
        const streamHex =
          curFollowStream === "stream1"
            ? 0x22d3ee
            : curFollowStream === "prior"
              ? 0x38bdf8
              : 0x4ade80;
        tracerCoreMat.color.setHex(streamHex);
        tracerHaloMat.color.setHex(streamHex);
        tracerRingMat.color.setHex(streamHex);
        tracerBeamMat.color.setHex(streamHex);
        trailMat.color.setHex(streamHex);

        // The packet enters a step when the step is selected, crosses it once, and rests at the
        // far end until the walk moves on, so consecutive steps read as one continuous journey.
        const nextTraceKey = `${curFollowStream}|${curFollowStep}`;
        if (nextTraceKey !== traceKey || !traceCurve) {
          traceKey = nextTraceKey;
          traceStepStart = elapsed;
          traceCurve = new THREE.CatmullRomCurve3(
            getFollowStepCurvePoints(curFollowStream, curFollowStep),
          );
        }
        const stepCurve = traceCurve;
        const stepSeconds = TRACE_STEP_MS / 1000;
        const stepPhase = ((elapsed - traceStepStart) % stepSeconds) / stepSeconds;
        const travel = Math.min(1, stepPhase / TRACE_TRAVEL_FRACTION);
        const uHead = travel * travel * (3 - 2 * travel);
        const headPt = stepCurve.getPointAt(uHead);

        tracerGroup.position.copy(headPt);
        tracerHalo.rotation.y = elapsed * 2.4;
        tracerHalo.rotation.x = elapsed * 1.6;
        const ringPulse = 0.85 + 0.25 * Math.sin(elapsed * 5.0);
        tracerRing.scale.setScalar(ringPulse);

        // The comet trail is longest mid-flight and closes up as the packet comes to rest.
        const trailLength = 0.38 * Math.min(1, 4 * travel * (1 - travel) + 0.04);
        const tPosAttr = tracerTrailLine.geometry.getAttribute("position") as THREE.BufferAttribute;
        for (let tIdx = 0; tIdx < trailCount; tIdx++) {
          const uTrail = Math.max(0, uHead - (tIdx / (trailCount - 1)) * trailLength);
          const pt = stepCurve.getPointAt(uTrail);
          tPosAttr.setXYZ(tIdx, pt.x, pt.y, pt.z);
        }
        tPosAttr.needsUpdate = true;
      } else {
        traceKey = "";
      }

      // 2. Highlight active stage connections & animate signal pulses along curves
      for (const item of stageConnectionMats) {
        if (curStage === 0 && !isFollowing) {
          item.mat.opacity = item.baseOpacity;
        } else if (item.stageGroup === curStage) {
          item.mat.opacity = Math.min(1.0, item.baseOpacity * 1.65);
        } else {
          item.mat.opacity = item.baseOpacity * 0.28;
        }
      }

      for (const track of pulseTracks) {
        const u = (elapsed * track.speed + track.phase) % 1.0;
        const pt = track.curve.getPointAt(u);
        track.mesh.position.copy(pt);
        const active = (curStage === 0 && !isFollowing) || track.stageGroup === curStage;
        track.mesh.visible = active;
        const pulseScale = active && curStage !== 0 ? 1.35 : 0.95;
        track.mesh.scale.setScalar(pulseScale);
      }

      const mirrorActive =
        mirrorOn || curStage === 2 || (isFollowing && curFollowStream === "stream1");

      if (snap) {
        // 3. Observed & Mirrored VR Headset Orientations
        const qObs = toThreeQuat(snap.lastQ);
        observedHead.quaternion.slerp(qObs, 0.35);

        mirroredHead.visible = mirrorActive;
        mirrorPlaneGroup.visible = mirrorActive;
        mirrorK8Line.visible = mirrorActive;
        mirrorGhost20.visible = mirrorActive;

        if (mirrorActive) {
          const qMir = toThreeQuat(snap.mirroredLastQ);
          mirroredHead.quaternion.slerp(qMir, 0.35);
        }

        const tiltQ = toThreeQuat(worldTiltQuaternion(curTiltDeg, curTiltHeading));
        tiltRingGroup.quaternion.slerp(tiltQ, 0.25);

        // 4. Update 20-step Trajectory Lines & Step-20 Ghost Visors
        const updateCurve = (
          line: THREE.Line,
          startQ: Quat,
          traj: Quat[],
          origin: THREE.Vector3,
          dashed = false,
        ) => {
          const posAttr = line.geometry.getAttribute("position") as THREE.BufferAttribute;
          const p0 = visorTipPosition(startQ, origin, trajectoryRadius);
          posAttr.setXYZ(0, p0.x, p0.y, p0.z);
          for (let i = 0; i < 20; i++) {
            const pt = visorTipPosition(traj[i], origin, trajectoryRadius);
            posAttr.setXYZ(i + 1, pt.x, pt.y, pt.z);
          }
          posAttr.needsUpdate = true;
          if (dashed) line.computeLineDistances();
        };

        updateCurve(k8Line, snap.lastQ, snap.trajectories.k8Combined, headCenter);
        priorLine.visible = priorOn;
        priorGhost20.visible = priorOn;
        if (priorOn) {
          updateCurve(priorLine, snap.lastQ, snap.trajectories.dampedPrior, headCenter);
        }
        constVelLine.visible = constVelOn;
        if (constVelOn) {
          updateCurve(
            constVelLine,
            snap.lastQ,
            snap.trajectories.constantVelocity,
            headCenter,
            true,
          );
        }

        const posK8End = visorTipPosition(
          snap.trajectories.k8Combined[19],
          headCenter,
          trajectoryRadius,
        );
        k8Ghost20.position.copy(posK8End);
        k8Ghost20.quaternion.copy(toThreeQuat(snap.trajectories.k8Combined[19]));

        returnForecastCurve.curve.points[3].copy(posK8End);

        if (priorOn) {
          const posPriorEnd = visorTipPosition(
            snap.trajectories.dampedPrior[19],
            headCenter,
            trajectoryRadius,
          );
          priorGhost20.position.copy(posPriorEnd);
          priorGhost20.quaternion.copy(toThreeQuat(snap.trajectories.dampedPrior[19]));
        }

        if (mirrorActive) {
          updateCurve(
            mirrorK8Line,
            snap.mirroredLastQ,
            snap.trajectories.mirroredK8Combined,
            mirrorHeadCenter,
          );
          const posMirEnd = visorTipPosition(
            snap.trajectories.mirroredK8Combined[19],
            mirrorHeadCenter,
            trajectoryRadius,
          );
          mirrorGhost20.position.copy(posMirEnd);
          mirrorGhost20.quaternion.copy(toThreeQuat(snap.trajectories.mirroredK8Combined[19]));
        }

        // Ground truth trajectory + step-20 geodesic error arc
        const hasGT = Array.isArray(gtFuture) && gtFuture.length >= 20;
        gtLine.visible = hasGT;
        gtGhost20.visible = hasGT;
        errorArcLine.visible = hasGT;
        if (hasGT && gtFuture) {
          updateCurve(gtLine, snap.lastQ, gtFuture, headCenter);
          const posGTEnd = visorTipPosition(gtFuture[19], headCenter, trajectoryRadius);
          gtGhost20.position.copy(posGTEnd);
          gtGhost20.quaternion.copy(toThreeQuat(gtFuture[19]));

          const errAttr = errorArcLine.geometry.getAttribute("position") as THREE.BufferAttribute;
          const qStart = toThreeQuat(snap.trajectories.k8Combined[19]);
          const qEnd = toThreeQuat(gtFuture[19]);
          for (let i = 0; i <= 20; i++) {
            const qInterp = qStart.clone().slerp(qEnd, i / 20);
            const pt = headCenter
              .clone()
              .add(new THREE.Vector3(0, 0, trajectoryRadius * 1.03).applyQuaternion(qInterp));
            errAttr.setXYZ(i, pt.x, pt.y, pt.z);
          }
          errAttr.needsUpdate = true;
          const errDeg = geodesicAngleDeg(snap.trajectories.k8Combined[19], gtFuture[19]);
          (errorArcLine.material as THREE.LineBasicMaterial).color.setHex(
            errDeg < 3.0 ? 0x4ade80 : errDeg < 6.0 ? 0xfacc15 : 0xf97316,
          );
        }

        // 5. Update 400-Sample Sliding Context Track, Waveform Tap Markers & Local k=8 Kernel Combs
        if (ctxWin.length >= 400) {
          const hPos = historyLine.geometry.getAttribute("position") as THREE.BufferAttribute;
          const hCol = historyLine.geometry.getAttribute("color") as THREE.BufferAttribute;
          // With a block selected, colour each sample by whether that block reads it
          // (banded per kernel tap); otherwise mark the model's whole receptive field.
          const coverage = curStep === null ? undefined : coverageTables[curStep];
          for (let i = 0; i < 400; i++) {
            const x = historyStartX + (i / 399) * historySpanX;
            const q = ctxWin[i];
            const y = historyBaseY + q[2] * 0.28 + q[1] * 0.18;
            const z = historyBaseZ + 0.08 + q[3] * 0.16;
            hPos.setXYZ(i, x, y, z);

            if (coverage) {
              hCol.setXYZ(i, coverage[i * 3], coverage[i * 3 + 1], coverage[i * 3 + 2]);
            } else {
              const inRF = i >= 7;
              hCol.setXYZ(i, inRF ? 0.18 : 0.08, inRF ? 0.92 : 0.35, inRF ? 0.48 : 0.2);
            }
          }
          hPos.needsUpdate = true;
          hCol.needsUpdate = true;

          // The selected block's rail stands out: wider, taller and fully opaque.
          for (let b = 0; b < rfRails.length; b++) {
            const selected = curStep === 3 + b;
            const rail = rfRails[b];
            rail.mesh.scale.set(1, selected ? 2.4 : 1, selected ? 2 : 1);
            rail.material.opacity = selected ? 1 : curStage === 0 ? 0.7 : 0.4;
          }

          for (let b = 0; b < 3; b++) {
            const bSnap = snap.blocks[b];
            const waveMarkers = blockTimelineMarkers[b];
            const combNodes = blockCombMarkers[b];

            for (let m = 0; m < 8; m++) {
              const tapIdx = Math.max(0, Math.min(399, bSnap.tapIndices[m]));
              const sx = hPos.getX(tapIdx);
              const sy = hPos.getY(tapIdx);
              const sz = hPos.getZ(tapIdx);
              const eScale = 0.75 + Math.min(1.4, (bSnap.tapEnergies0[m] ?? 0) * 1.35);

              waveMarkers[m].position.set(sx, sy, sz);
              waveMarkers[m].scale.setScalar(eScale);
              // Comb dots: height up the pin is the learned weight of that tap, size is the
              // live energy arriving on it (capped so neighbouring dots stay separate).
              const learned = curTapProfiles?.[b]?.normalised[m];
              combNodes[m].position.y =
                learned === undefined ? COMB_Y : COMB_Y + COMB_PIN_HEIGHT * (0.12 + 0.82 * learned);
              combNodes[m].scale.setScalar(Math.min(eScale, 1.45));
            }
            blockCombPinMats[b].opacity = curStage === 3 ? 0.95 : curStage === 0 ? 0.65 : 0.25;
          }
        }

        // 6. Pulse 7 Input Feature Spheres (clamped so spheres never overlap vertically)
        for (let f = 0; f < 7; f++) {
          const v0 = Math.min(1.55, Math.abs(snap.inputFeatures0[f]) * 0.25 + 0.75);
          const v1 = Math.min(1.55, Math.abs(snap.inputFeatures1[f]) * 0.25 + 0.75);
          inputSpheres0[f].scale.setScalar(v0);
          inputSpheres1[f].scale.setScalar(v1);
        }

        // 7. Update Twin 32-Channel Activation Bars + Modulate [[A,B],[B,A]] Conduits
        const acts0List = [
          snap.projActivations0,
          snap.blocks[0].activations0,
          snap.blocks[1].activations0,
          snap.blocks[2].activations0,
        ];
        const acts1List = [
          snap.projActivations1,
          snap.blocks[0].activations1,
          snap.blocks[1].activations1,
          snap.blocks[2].activations1,
        ];

        for (let s = 0; s < 4; s++) {
          const a0 = acts0List[s];
          const a1 = acts1List[s];
          const bars0 = stream0Bars[s];
          const bars1 = stream1Bars[s];
          for (let c = 0; c < 32; c++) {
            const h0 = Math.max(0.08, Math.min(1.75, a0[c] * 0.44));
            const h1 = Math.max(0.08, Math.min(1.75, a1[c] * 0.44));
            bars0[c].scale.y = h0;
            bars0[c].position.y = -1.18 + h0 * 0.5;
            (bars0[c].material as THREE.MeshStandardMaterial).emissiveIntensity = Math.min(
              1.1,
              0.2 + h0 * 0.5,
            );

            bars1[c].scale.y = h1;
            bars1[c].position.y = -1.18 + h1 * 0.5;
            (bars1[c].material as THREE.MeshStandardMaterial).emissiveIntensity = Math.min(
              1.1,
              0.2 + h1 * 0.5,
            );
          }

          if (s >= 1) {
            const blk = snap.blocks[s - 1];
            const totalNorm = blk.ownStreamNorm0 + blk.crossStreamNorm0 + 1e-6;
            const ownRatio = blk.ownStreamNorm0 / totalNorm;
            const crossRatio = blk.crossStreamNorm0 / totalNorm;
            for (const m of ownConduitMats[s - 1]) {
              if (curStage === 0 || curStage === 3) {
                m.opacity = Math.min(0.95, 0.25 + ownRatio * 0.8);
              }
            }
            for (const m of crossConduitMats[s - 1]) {
              if (curStage === 0 || curStage === 2 || curStage === 3) {
                m.opacity = Math.min(0.95, 0.25 + crossRatio * 1.1);
              }
            }
          }
        }

        // 8. Update 9 Cubic Basis Readout Knobs & Cayley Map Node
        for (let j = 0; j < 3; j++) {
          for (let axis = 0; axis < 3; axis++) {
            const idx = j * 3 + axis;
            const val = Math.abs(snap.readout.coefficients[j][axis]);
            const scale = 0.75 + Math.min(1.4, val * 6.5);
            knobSpheres[idx].scale.setScalar(scale);
            knobSpheres[idx].rotation.y = elapsed * (1.2 + j * 0.4);
          }
        }
        cayleySphere.rotation.y = elapsed * 0.9;
        cayleySphere.rotation.x = elapsed * 0.5;
      }

      // 8B. Animate 3D Hover Highlight Halo around Hovered Network Element
      if (hoverMarkerGroup.visible && activeHoverMetaLocal) {
        const isCompactNode =
          activeHoverMetaLocal.kind === "input_feature" ||
          activeHoverMetaLocal.kind === "kernel_comb_tap" ||
          activeHoverMetaLocal.kind === "timeline_tap" ||
          activeHoverMetaLocal.kind === "x_gate_node" ||
          activeHoverMetaLocal.kind === "readout_knob" ||
          activeHoverMetaLocal.kind === "cayley_orb" ||
          (activeHoverObject instanceof THREE.Mesh &&
            activeHoverObject.geometry === pulseSphereGeo);

        if (isCompactNode && activeHoverObject) {
          activeHoverObject.getWorldPosition(hoverMarkerGroup.position);
        } else if (activeHoverHitPoint) {
          hoverMarkerGroup.position.copy(activeHoverHitPoint);
        }
        hoverHaloMesh.rotation.y = elapsed * 2.2;
        hoverHaloMesh.rotation.x = elapsed * 1.4;
        const pulse = 0.92 + 0.18 * Math.sin(elapsed * 6.0);
        hoverMarkerGroup.scale.setScalar(pulse);
      }

      // 9. Project 3D Layer Badges, Solve Exact DOM Bounding-Box Non-Overlap & Update SVG Leader Lines
      const focusIds = focusedBadgeIds(curStep, isFollowing, curFollowStream);

      const projectedBadges: {
        idx: number;
        sx: number;
        sy: number;
        ax: number;
        ay: number;
        w: number;
        h: number;
        visible: boolean;
        isFocused: boolean;
      }[] = [];

      for (let i = 0; i < FLOATING_BADGES.length; i++) {
        const def = FLOATING_BADGES[i];
        const el = badgeRefs.current[i];
        const w = (el?.offsetWidth || 168) + 18;
        const h = (el?.offsetHeight || 42) + 12;

        if (!overlayRef.current.showFloatingBadges || (def.id === "mirror_twin" && !mirrorActive)) {
          projectedBadges.push({
            idx: i,
            sx: 0,
            sy: 0,
            ax: 0,
            ay: 0,
            w,
            h,
            visible: false,
            isFocused: false,
          });
          continue;
        }
        projVec.copy(def.worldPos).project(camera);
        anchorProjVec.copy(def.anchorPos).project(camera);

        const inView =
          projVec.z >= -1 &&
          projVec.z <= 1 &&
          projVec.x >= -0.97 &&
          projVec.x <= 0.97 &&
          projVec.y >= -0.92 &&
          projVec.y <= 0.92;

        const sx = (projVec.x * 0.5 + 0.5) * viewportW;
        const sy = (-projVec.y * 0.5 + 0.5) * viewportH + def.screenOffsetY;
        const ax = (anchorProjVec.x * 0.5 + 0.5) * viewportW;
        const ay = (-anchorProjVec.y * 0.5 + 0.5) * viewportH;
        const isFocused = focusIds === null || focusIds.has(def.id);
        projectedBadges.push({ idx: i, sx, sy, ax, ay, w, h, visible: inView, isFocused });
      }

      // Exact DOM-dimension pairwise 2D bounding-box repulsion (10 iterations -> zero overlap).
      // Badges are also kept clear of the HUD boxes (top corners) and the legend (bottom edge),
      // whose measured footprints are refreshed a few times a second.
      if (hudMeasureCountdown <= 0) {
        hudMeasureCountdown = 20;
        const base = container.getBoundingClientRect();
        const toBox = (el: HTMLElement | null): HudBox | null => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return null;
          return {
            left: r.left - base.left,
            right: r.right - base.left,
            top: r.top - base.top,
            bottom: r.bottom - base.top,
          };
        };
        hudTopBoxes = [toBox(hudLeftRef.current), toBox(hudRightRef.current)];
        hudLegendBox = toBox(hudLegendRef.current);
      }
      hudMeasureCountdown -= 1;
      const BADGE_HUD_GAP = 8;

      for (let iter = 0; iter < 10; iter++) {
        for (let a = 0; a < projectedBadges.length; a++) {
          const ba = projectedBadges[a];
          if (!ba.visible) continue;
          for (let b = a + 1; b < projectedBadges.length; b++) {
            const bb = projectedBadges[b];
            if (!bb.visible) continue;
            const dx = bb.sx - ba.sx;
            const dy = bb.sy - ba.sy;
            const reqW = (ba.w + bb.w) * 0.5;
            const reqH = (ba.h + bb.h) * 0.5;
            const overlapX = reqW - Math.abs(dx);
            const overlapY = reqH - Math.abs(dy);
            if (overlapX > 0 && overlapY > 0) {
              if (overlapY * 1.4 <= overlapX) {
                const pushY = (overlapY * 0.55 + 1.5) * (dy >= 0 ? 1 : -1);
                ba.sy -= pushY;
                bb.sy += pushY;
              } else {
                const pushX = (overlapX * 0.55 + 1.5) * (dx >= 0 ? 1 : -1);
                ba.sx -= pushX;
                bb.sx += pushX;
              }
            }
          }
          const halfW = ba.w * 0.5;
          ba.sx = THREE.MathUtils.clamp(
            ba.sx,
            halfW + 8,
            Math.max(halfW + 10, viewportW - halfW - 8),
          );
          // `h` carries 12px of repulsion padding; the clamp uses the real half height.
          const halfH = (ba.h - 12) * 0.5;
          let minY = BADGE_HUD_GAP + halfH;
          let maxY = viewportH - BADGE_HUD_GAP - halfH;
          for (const box of hudTopBoxes) {
            if (
              box &&
              ba.sx + halfW > box.left - BADGE_HUD_GAP &&
              ba.sx - halfW < box.right + BADGE_HUD_GAP
            ) {
              minY = Math.max(minY, box.bottom + BADGE_HUD_GAP + halfH);
            }
          }
          if (hudLegendBox) maxY = Math.min(maxY, hudLegendBox.top - BADGE_HUD_GAP - halfH);
          ba.sy = THREE.MathUtils.clamp(ba.sy, minY, Math.max(minY, maxY));
        }
      }

      for (const item of projectedBadges) {
        const el = badgeRefs.current[item.idx];
        const lineEl = leaderLineRefs.current[item.idx];
        const dotEl = leaderDotRefs.current[item.idx];
        if (!el) continue;
        if (!item.visible) {
          el.style.opacity = "0";
          el.style.pointerEvents = "none";
          if (lineEl) lineEl.style.opacity = "0";
          if (dotEl) dotEl.style.opacity = "0";
        } else {
          el.style.opacity = item.isFocused ? "0.98" : "0.35";
          el.style.pointerEvents = "auto";
          el.style.transform = `translate3d(${item.sx.toFixed(1)}px, ${item.sy.toFixed(1)}px, 0) translate(-50%, -50%)`;

          if (lineEl && dotEl) {
            lineEl.setAttribute("x1", item.sx.toFixed(1));
            lineEl.setAttribute("y1", item.sy.toFixed(1));
            lineEl.setAttribute("x2", item.ax.toFixed(1));
            lineEl.setAttribute("y2", item.ay.toFixed(1));
            lineEl.style.opacity = item.isFocused ? "0.75" : "0.18";

            dotEl.setAttribute("cx", item.ax.toFixed(1));
            dotEl.setAttribute("cy", item.ay.toFixed(1));
            dotEl.style.opacity = item.isFocused ? "0.9" : "0.22";
          }
        }
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // Park the render loop while the viewport is off-screen (the page is long, and the scene
    // would otherwise keep drawing 60 frames a second behind the reader's back).
    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        isOnScreen = entries[entries.length - 1].isIntersecting;
        if (isOnScreen && animId === null) {
          animId = requestAnimationFrame(animate);
        }
      },
      { rootMargin: "80px" },
    );
    visibilityObserver.observe(container);

    return () => {
      if (animId !== null) cancelAnimationFrame(animId);
      if (zoomHintTimer !== null) window.clearTimeout(zoomHintTimer);
      visibilityObserver.disconnect();
      resizeObserver.disconnect();
      timer.dispose();
      canvasEl.removeEventListener("pointerdown", handlePointerDown);
      canvasEl.removeEventListener("pointermove", handlePointerMove);
      canvasEl.removeEventListener("pointerup", handlePointerUp);
      canvasEl.removeEventListener("pointercancel", handlePointerCancel);
      canvasEl.removeEventListener("pointerleave", handlePointerLeave);
      canvasEl.removeEventListener("touchmove", handleTouchMove);
      canvasEl.removeEventListener("wheel", handleWheel);
      canvasEl.removeEventListener("contextmenu", handleContextMenu);
      floorGeometry.dispose();
      floorMaterial.dispose();
      renderer.dispose();
      if (canvasEl.parentNode === container) {
        container.removeChild(canvasEl);
      }
    };
  }, []);

  // Error of each forecast at all 20 horizon steps of this frame. The scoreboard reads
  // the 200 ms endpoint unless the pointer is on its chart, which picks another horizon.
  const horizonErrors = useMemo(
    () =>
      snapshot && groundTruthFuture && groundTruthFuture.length >= 20
        ? computeHorizonErrors(snapshot, groundTruthFuture)
        : null,
    [snapshot, groundTruthFuture],
  );
  const readStep = horizonErrors
    ? Math.min(hoverHorizon ?? horizonErrors.k8.length - 1, horizonErrors.k8.length - 1)
    : 19;
  const errorRows = horizonErrors
    ? [
        {
          label: "k8",
          deg: horizonErrors.k8[readStep],
          textClass: "text-green-300 font-bold",
          barClass: "bg-green-400",
        },
        {
          label: "prior",
          deg: horizonErrors.prior[readStep],
          textClass: "text-cyan-300",
          barClass: "bg-cyan-400",
        },
        {
          label: "hold",
          deg: horizonErrors.hold[readStep],
          textClass: "text-gray-400",
          barClass: "bg-gray-500",
        },
      ]
    : null;
  const errorScaleDeg = errorRows ? Math.max(1e-6, ...errorRows.map((r) => r.deg)) : 1;

  const activeHoverTooltip =
    showHoverTooltips && hoveredMeta
      ? buildHoverTooltipContent(hoveredMeta, snapshot, groundTruthFuture, contextWindow, tapProfiles)
      : null;

  // Badges lit for the current selection (null = overview, where every badge is lit).
  const litBadgeIds = focusedBadgeIds(step, tracing, pathway);

  const handleBadgeClick = (badgeId: string) => {
    const matched = PIPELINE_STEPS.find((s) => s.badgeId === badgeId);
    if (matched) {
      onSelectStep?.(matched.index);
    } else if (badgeId === "prior_bypass") {
      // While tracing, jump onto the bypass itself; otherwise show where it lands.
      if (tracing) onSelectPathway?.("prior");
      onSelectStep?.(tracing ? 3 : 6);
    } else if (badgeId === "mirror_twin") {
      if (tracing) onSelectPathway?.("stream1");
      onSelectStep?.(tracing ? 0 : 2);
    } else if (badgeId === "history") {
      onSelectStep?.(5);
    }
  };

  const iconButtonClass =
    "h-7 min-w-7 px-1.5 inline-flex items-center justify-center gap-1 rounded border border-green-500/25 bg-black/60 text-green-300 hover:bg-green-500/20 hover:border-green-400/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400/70";

  const viewMenuGroups: {
    heading: string;
    items: { label: string; dotClass: string; checked: boolean; onToggle: () => void }[];
  }[] = [
    {
      heading: "Overlays",
      items: [
        {
          label: "Hover tooltips",
          dotClass: "bg-green-400",
          checked: showHoverTooltips,
          onToggle: () => setShowHoverTooltips((v) => !v),
        },
        {
          label: "Step labels",
          dotClass: "bg-cyan-400",
          checked: showFloatingBadges,
          onToggle: () => setShowFloatingBadges((v) => !v),
        },
        {
          label: "HUD readouts & legend",
          dotClass: "bg-lime-400",
          checked: showHudBoxes,
          onToggle: () => setShowHudBoxes((v) => !v),
        },
      ],
    },
    {
      heading: "Curves",
      items: [
        {
          label: "Mirror twin M(q)",
          dotClass: "bg-sky-400",
          checked: showMirrorTwin,
          onToggle: () => onToggleMirrorTwin?.(),
        },
        {
          label: "Damped prior forecast",
          dotClass: "bg-cyan-400",
          checked: showDampedPrior,
          onToggle: () => onToggleDampedPrior?.(),
        },
        {
          label: "Constant-velocity forecast",
          dotClass: "bg-rose-400",
          checked: showConstantVelocity,
          onToggle: () => onToggleConstantVelocity?.(),
        },
      ],
    },
  ];

  return (
    <div className="w-full rounded-xl overflow-hidden border border-green-300 dark:border-green-500/40 bg-gray-950 shadow-2xl shadow-green-500/10">
      {/* Title bar: model status, view options and camera controls */}
      <div className="relative z-40 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-3 py-2 border-b border-green-500/25 bg-black/80 font-mono text-xs text-green-300">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
          <span className="font-semibold whitespace-nowrap">k8_combined</span>
          <span className="hidden sm:inline text-green-500/80 truncate">
            LeanTCNN · live in-browser inference
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* On phones the menu spans the frame under the title bar; from sm it hangs off the button */}
          <div ref={viewMenuRef} className="sm:relative">
            <button
              type="button"
              onClick={() => setViewMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={viewMenuOpen}
              aria-label="View options"
              title="View options"
              className={`${iconButtonClass} px-2 ${
                viewMenuOpen ? "bg-green-500/20 border-green-400/60" : ""
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform ${viewMenuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {viewMenuOpen && (
              <div
                role="menu"
                aria-label="View options"
                className="absolute left-3 right-3 sm:left-auto sm:right-0 sm:w-60 top-full mt-1.5 rounded-lg border border-green-500/40 bg-gray-950/95 backdrop-blur-xl shadow-2xl shadow-black/80 p-2 space-y-2"
              >
                {viewMenuGroups.map((group) => (
                  <div key={group.heading}>
                    <div className="px-2 pb-1 text-[10px] uppercase tracking-wider text-green-500/70">
                      {group.heading}
                    </div>
                    {group.items.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        role="menuitemcheckbox"
                        aria-checked={item.checked}
                        onClick={item.onToggle}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-[11px] text-green-200 hover:bg-green-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400/70"
                      >
                        <span
                          className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${
                            item.checked
                              ? "border-green-400 bg-green-500/30"
                              : "border-gray-600 bg-black/60"
                          }`}
                        >
                          {item.checked && <span className="w-1.5 h-1.5 rounded-[1px] bg-green-300" />}
                        </span>
                        <span className={`w-2 h-2 rounded-full shrink-0 ${item.dotClass}`} />
                        <span className={item.checked ? "" : "text-gray-400"}>{item.label}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <span className="hidden sm:block w-px h-5 bg-green-500/25" aria-hidden="true" />

          <button
            type="button"
            onClick={() => cameraActionsRef.current?.zoomBy(1.25)}
            title={`Zoom out (or ${zoomKeyLabel} + scroll, or pinch)`}
            aria-label="Zoom out"
            className={iconButtonClass}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => cameraActionsRef.current?.zoomBy(0.8)}
            title={`Zoom in (or ${zoomKeyLabel} + scroll, or pinch)`}
            aria-label="Zoom in"
            className={iconButtonClass}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => cameraActionsRef.current?.panBy(140, 0)}
            title="Pan left (or Shift-drag / right-drag)"
            aria-label="Pan left"
            className={iconButtonClass}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => cameraActionsRef.current?.panBy(-140, 0)}
            title="Pan right (or Shift-drag / right-drag)"
            aria-label="Pan right"
            className={iconButtonClass}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              cameraActionsRef.current?.resetCamera();
              onResetView?.();
            }}
            title="Reset to the full-graph view"
            className={`${iconButtonClass} px-2`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* 3D viewport */}
      <div
        className={`relative w-full ${
          tracing ? "h-[360px] md:h-[440px]" : "h-[420px] md:h-[560px]"
        } transition-[height] duration-300 overflow-hidden bg-gradient-to-b from-gray-950 via-black to-emerald-950/30`}
      >
        {/* Three.js Canvas Mount */}
        <div
          ref={containerRef}
          className={`w-full h-full ${webglUnavailable ? "" : "cursor-grab active:cursor-grabbing"}`}
          aria-label="Interactive 3D visualization of the ABC Challenge k8_combined LeanTCNN head-pose prediction model"
        />

        {webglUnavailable && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            <div className="max-w-md space-y-2 font-mono text-sm text-green-300">
              <div className="font-semibold">3D view unavailable</div>
              <p className="font-sans text-xs leading-relaxed text-gray-400">
                This browser could not start WebGL, so the scene cannot be drawn. The model is
                still running: the pipeline steps, inspector and live tensors below all work.
              </p>
            </div>
          </div>
        )}

        {/* Shown briefly when a plain scroll passes over the scene (it scrolls the page) */}
        <div
          ref={zoomHintRef}
          aria-hidden="true"
          style={{ opacity: 0 }}
          className="pointer-events-none absolute left-1/2 top-1/2 z-[35] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-green-500/40 bg-black/85 px-3 py-1.5 font-mono text-xs text-green-200 shadow-lg shadow-black/60 transition-opacity duration-200"
        >
          Hold{" "}
          <kbd className="rounded border border-green-500/40 bg-green-500/15 px-1.5 py-0.5 text-green-100">
            {zoomKeyLabel}
          </kbd>{" "}
          and scroll to zoom
        </div>

        {/* SVG Callout Leader Lines Connecting Floating Badges to 3D Layer Nodes */}
        <svg
          className="pointer-events-none absolute inset-0 w-full h-full overflow-hidden"
          aria-hidden="true"
        >
          {FLOATING_BADGES.map((badge, idx) => (
            <g key={`leader-${badge.id}`}>
              <line
                ref={(el) => {
                  leaderLineRefs.current[idx] = el;
                }}
                x1="0"
                y1="0"
                x2="0"
                y2="0"
                stroke={badge.strokeColor}
                strokeWidth="1.25"
                strokeDasharray="3 3"
                style={{ opacity: 0 }}
              />
              <circle
                ref={(el) => {
                  leaderDotRefs.current[idx] = el;
                }}
                cx="0"
                cy="0"
                r="3"
                fill={badge.strokeColor}
                style={{ opacity: 0 }}
              />
            </g>
          ))}
        </svg>

        {/* 3D-Projected Interactive Step Badges Overlay */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {FLOATING_BADGES.map((badge, idx) => {
            // The overview shows one-line labels; a selected step expands its own badge.
            const isBadgeSelected = litBadgeIds !== null && litBadgeIds.has(badge.id);

            return (
              <button
                key={badge.id}
                ref={(el) => {
                  badgeRefs.current[idx] = el;
                }}
                type="button"
                onMouseEnter={(e) => {
                  if (!showHoverTooltips) return;
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (rect) {
                    positionTooltipAtLocalXY(e.clientX - rect.left, e.clientY - rect.top);
                  }
                  const meta: HoverTargetMeta = { kind: "floating_badge", badgeId: badge.id };
                  hoveredMetaKeyRef.current = JSON.stringify(meta);
                  setHoveredMeta(meta);
                }}
                onMouseMove={(e) => {
                  if (!showHoverTooltips) return;
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (rect) {
                    positionTooltipAtLocalXY(e.clientX - rect.left, e.clientY - rect.top);
                  }
                }}
                onMouseLeave={() => {
                  hoveredMetaKeyRef.current = "";
                  setHoveredMeta(null);
                }}
                onClick={() => handleBadgeClick(badge.id)}
                style={{ opacity: 0, left: 0, top: 0 }}
                className={`absolute transition-opacity duration-150 px-2 py-1 rounded-md border backdrop-blur-md font-mono text-left shadow-lg ${
                  isBadgeSelected
                    ? "bg-green-950/95 ring-1 ring-green-400/80 " + badge.accentClass
                    : "bg-black/85 " + badge.accentClass
                }`}
              >
                <div className="text-[11px] font-bold leading-tight whitespace-nowrap">
                  {badge.title}
                </div>
                {isBadgeSelected && (
                  <div className="text-[10px] text-gray-300/90 leading-tight whitespace-nowrap mt-0.5">
                    {badge.subtitle}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Floating 3D Network Element Hover Tooltip Card */}
        <div
          ref={tooltipWrapperRef}
          className={`pointer-events-none absolute top-0 left-0 z-30 w-[300px] sm:w-[360px] transition-opacity duration-150 ${
            activeHoverTooltip ? "opacity-100" : "opacity-0"
          }`}
          aria-live="polite"
        >
          {activeHoverTooltip && (
            <div
              className={`rounded-xl border ${activeHoverTooltip.borderClass} bg-gray-950/95 backdrop-blur-xl p-3.5 shadow-2xl shadow-black/80 font-mono text-xs text-gray-100 space-y-2`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`px-2 py-0.5 rounded border text-[10px] font-bold tracking-wider uppercase truncate ${activeHoverTooltip.badgeClass}`}
                >
                  {activeHoverTooltip.categoryBadge}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-gray-400 whitespace-nowrap">
                  <MousePointerClick className="w-3 h-3" />
                  focus
                </span>
              </div>

              <div>
                <div className="text-[13px] font-bold text-white leading-snug">
                  {activeHoverTooltip.title}
                </div>
                <div className="text-[11px] text-green-300/90 mt-0.5 leading-snug">
                  {activeHoverTooltip.subtitle}
                </div>
              </div>

              <div className="rounded bg-black/80 border border-green-500/25 px-2 py-1 text-[11px] text-cyan-200 overflow-hidden text-ellipsis whitespace-nowrap">
                {activeHoverTooltip.formula}
              </div>

              <p className="font-sans text-xs text-gray-200 leading-relaxed">
                {activeHoverTooltip.description}
              </p>

              {activeHoverTooltip.metrics.length > 0 && (
                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-green-500/20">
                  {activeHoverTooltip.metrics.map((m) => (
                    <div
                      key={m.label}
                      className="rounded bg-black/75 border border-green-500/20 px-2 py-1 min-w-0"
                    >
                      <div className="text-[10px] leading-tight text-gray-400">{m.label}</div>
                      <div
                        className={`mt-0.5 text-[11px] font-bold truncate ${m.colorClass}`}
                        title={m.value}
                      >
                        {m.value}
                      </div>
                      {m.sub && (
                        <div className="text-[10px] leading-tight text-gray-400/90">{m.sub}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* HUD: live telemetry (top left) and the 200 ms error scoreboard (top right) */}
        {showHudBoxes && (
          <div className="pointer-events-none absolute top-3 left-3 right-3 flex justify-between items-start gap-2 font-mono text-[11px]">
            {snapshot ? (
              <div
                ref={hudLeftRef}
                className="bg-black/75 backdrop-blur-md border border-green-500/30 rounded-lg px-2.5 py-2 grid grid-cols-1 sm:grid-cols-[auto_auto] gap-x-4 gap-y-0.5 text-green-300/90"
              >
                <div className="hidden sm:block whitespace-nowrap">
                  <span className="text-green-500/80">q[t]</span>{" "}
                  <span className="text-white tabular-nums">
                    [{snapshot.lastQ.map((v) => v.toFixed(2)).join(", ")}]
                  </span>
                </div>
                <div className="whitespace-nowrap">
                  <span className="text-green-500/80">|ω|₁</span>{" "}
                  <span className="text-amber-300 tabular-nums">
                    {snapshot.l1Speed.toFixed(2)} rad/s
                  </span>
                </div>
                <div className="hidden sm:block whitespace-nowrap">
                  <span className="text-green-500/80">R(q)ᵀy</span>{" "}
                  <span className="text-lime-300 tabular-nums">
                    [{snapshot.gravityHead.map((v) => v.toFixed(2)).join(", ")}]
                  </span>
                </div>
                <div className="whitespace-nowrap">
                  <span className="text-green-500/80">mirror Δ</span>{" "}
                  <span className="text-cyan-300 tabular-nums">
                    {snapshot.mirrorEquivarianceErrorDeg.toFixed(4)}°
                  </span>
                </div>
              </div>
            ) : (
              <span />
            )}

            {errorRows && (
              <div
                ref={hudRightRef}
                className="bg-black/75 backdrop-blur-md border border-green-500/30 rounded-lg px-2.5 py-2 w-[148px] sm:w-[196px] space-y-1"
              >
                <div className="text-green-400 font-semibold whitespace-nowrap">
                  <span className="tabular-nums">{(readStep + 1) * 10}</span> ms error{" "}
                  <span className="hidden sm:inline text-green-500/70">(geodesic)</span>
                </div>
                {errorRows.map((row) => (
                  <div key={row.label} className="flex items-center gap-1.5">
                    <span className={`w-9 shrink-0 ${row.textClass}`}>{row.label}</span>
                    <span className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <span
                        className={`block h-full rounded-full transition-[width] duration-150 ${row.barClass}`}
                        style={{ width: `${Math.max(3, (row.deg / errorScaleDeg) * 100)}%` }}
                      />
                    </span>
                    <span className={`w-12 shrink-0 text-right tabular-nums ${row.textClass}`}>
                      {row.deg.toFixed(2)}°
                    </span>
                  </div>
                ))}
                {horizonErrors && (
                  <div className="hidden sm:block pt-1">
                    <AbcHorizonChart
                      errors={horizonErrors}
                      activeStep={readStep}
                      onHoverStep={setHoverHorizon}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* HUD: colour legend and pointer hints along the bottom edge */}
        {showHudBoxes && (
          <div
            ref={hudLegendRef}
            className="pointer-events-none absolute bottom-3 left-3 right-3 hidden sm:flex items-center justify-between gap-4 bg-black/75 backdrop-blur-md border border-green-500/25 rounded-lg px-3 py-1.5 font-mono text-[11px] text-green-200"
          >
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                Stream 0 · k8 forecast
              </span>
              <span className="flex items-center gap-1.5 text-cyan-300">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                Stream 1 · prior
              </span>
              <span className="flex items-center gap-1.5 text-lime-300">
                <span className="w-2 h-2 rounded-full bg-lime-400" />
                Skip · gravity
              </span>
              <span className="flex items-center gap-1.5 text-orange-300">
                <span className="w-2 h-2 rounded-full bg-orange-400" />
                Mirror sign-flip
              </span>
              {groundTruthFuture && (
                <span className="flex items-center gap-1.5 text-yellow-300">
                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                  Ground truth
                </span>
              )}
            </div>
            <div
              className={`${webglUnavailable ? "hidden" : "hidden lg:block"} text-green-400/70 whitespace-nowrap`}
            >
              {interactiveMode
                ? `Drag: turn head · Alt-drag: orbit · ${zoomKeyLabel}+scroll: zoom`
                : `Drag: orbit · Shift-drag: pan · ${zoomKeyLabel}+scroll: zoom · Click: focus`}
            </div>
          </div>
        )}
      </div>

      {/* Docked panels (pipeline rail, playback) share the frame with the viewport */}
      {children}
    </div>
  );
}
