"use client";

import { Hand, Pause, Play } from "lucide-react";
import type { ValidationClip } from "@/lib/abc-challenge/lean-tcnn-engine";
import AbcErrorTimeline, { ClipErrorReadout } from "./AbcErrorTimeline";
import type { ClipErrors } from "./abc-model-stats";

export interface ManualPose {
  pitchDeg: number;
  yawDeg: number;
  rollDeg: number;
  velPitch: number;
  velYaw: number;
}

export interface AbcTransportBarProps {
  clips: ValidationClip[];
  selectedClipId: string;
  onSelectClip: (id: string) => void;
  interactiveMode: boolean;
  onToggleInteractiveMode: (interactive: boolean) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  playbackSpeed: number;
  onChangePlaybackSpeed: (speed: number) => void;
  frameIndex: number;
  maxFrameIndex: number;
  onScrubFrame: (frame: number) => void;
  manualPose: ManualPose;
  onChangeManualPose: (pose: ManualPose) => void;
  /** Per-frame 200 ms error for the current clip and settings; `null` without ground truth. */
  clipErrors: ClipErrors | null;
  /** The same at default settings, for the "vs default" delta. */
  baselineClipErrors: ClipErrors | null;
  clipErrorsStale: boolean;
}

const PLAYBACK_SPEEDS = [0.25, 0.5, 1];

const POSE_SLIDERS: {
  key: keyof ManualPose;
  label: string;
  unit: string;
  min: number;
  max: number;
  accentClass: string;
  valueClass: string;
}[] = [
  {
    key: "pitchDeg",
    label: "Nod / pitch (x)",
    unit: "°",
    min: -55,
    max: 55,
    accentClass: "accent-cyan-400",
    valueClass: "text-cyan-300",
  },
  {
    key: "yawDeg",
    label: "Turn / yaw (y)",
    unit: "°",
    min: -75,
    max: 75,
    accentClass: "accent-green-400",
    valueClass: "text-green-300",
  },
  {
    key: "rollDeg",
    label: "Tilt / roll (z)",
    unit: "°",
    min: -45,
    max: 45,
    accentClass: "accent-amber-400",
    valueClass: "text-amber-300",
  },
  {
    key: "velYaw",
    label: "Turn speed (ω_y)",
    unit: "°/s",
    min: -220,
    max: 220,
    accentClass: "accent-green-500",
    valueClass: "text-green-300",
  },
];

/** "Synthetic Calm (P25 Speed)" → "Synthetic Calm" */
const shortClipTitle = (title: string) => title.replace(/\s*\([^)]*\)\s*$/, "");

/**
 * Input source and playback, docked at the bottom of the viewport frame so the
 * scrubber sits next to the scene it drives.
 */
export default function AbcTransportBar({
  clips,
  selectedClipId,
  onSelectClip,
  interactiveMode,
  onToggleInteractiveMode,
  isPlaying,
  onTogglePlay,
  playbackSpeed,
  onChangePlaybackSpeed,
  frameIndex,
  maxFrameIndex,
  onScrubFrame,
  manualPose,
  onChangeManualPose,
  clipErrors,
  baselineClipErrors,
  clipErrorsStale,
}: AbcTransportBarProps) {
  const timelineErrors =
    !interactiveMode && clipErrors && clipErrors.clipId === selectedClipId ? clipErrors : null;
  const timelineBaseline =
    baselineClipErrors && baselineClipErrors.clipId === selectedClipId ? baselineClipErrors : null;

  const sourceButtonClass = (active: boolean) =>
    `h-7 px-2.5 inline-flex items-center gap-1.5 text-[11px] transition-colors ${
      active
        ? "bg-green-500 text-black font-semibold"
        : "bg-black/60 text-green-300 hover:bg-green-500/15"
    }`;

  return (
    <div className="border-t border-green-500/25 bg-black/85 px-3 py-2.5 font-mono text-xs text-green-200 space-y-2">
      {/* Row 1: which input drives the model */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-[11px] uppercase tracking-wider text-green-400">Input</span>
        <div
          role="group"
          aria-label="Input source"
          className="flex rounded border border-green-500/40 overflow-hidden"
        >
          <button
            type="button"
            onClick={() => onToggleInteractiveMode(false)}
            aria-pressed={!interactiveMode}
            className={sourceButtonClass(!interactiveMode)}
          >
            Replay clips
          </button>
          <button
            type="button"
            onClick={() => onToggleInteractiveMode(true)}
            aria-pressed={interactiveMode}
            className={`${sourceButtonClass(interactiveMode)} border-l border-green-500/40`}
          >
            <Hand className="w-3.5 h-3.5" />
            Drag head
          </button>
        </div>

        {!interactiveMode ? (
          <>
            <div className="flex flex-wrap items-center gap-1.5">
              {clips.map((clip) => {
                const active = clip.id === selectedClipId;
                return (
                  <button
                    key={clip.id}
                    type="button"
                    onClick={() => onSelectClip(clip.id)}
                    aria-pressed={active}
                    title={`${clip.title} · mean ${clip.meanSpeedDegPerSec}°/s\n${clip.description}\n${clip.credit}`}
                    className={`h-7 px-2 inline-flex items-center gap-1.5 rounded border text-[11px] transition-colors ${
                      active
                        ? "border-green-400 bg-green-500/20 text-green-100 font-semibold"
                        : "border-green-500/25 bg-black/60 text-green-300/85 hover:border-green-400/60 hover:text-green-200"
                    }`}
                  >
                    {shortClipTitle(clip.title)}
                    <span className="hidden md:inline text-[10px] font-normal text-green-500/80 tabular-nums">
                      {clip.meanSpeedDegPerSec.toFixed(0)}°/s
                    </span>
                  </button>
                );
              })}
            </div>
            {timelineErrors && (
              <ClipErrorReadout
                errors={timelineErrors}
                baseline={timelineBaseline}
                stale={clipErrorsStale}
                className="lg:ml-auto"
              />
            )}
          </>
        ) : (
          <span className="font-sans text-xs text-gray-400">
            Drag in the viewport to turn the headset, or set the pose below.
          </span>
        )}
      </div>

      {/* Row 2: playback for clips, or pose sliders for the draggable head */}
      {!interactiveMode ? (
        <div className="flex items-end gap-2.5">
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={isPlaying ? "Pause playback" : "Play"}
            title={isPlaying ? "Pause" : "Play"}
            className="h-7 w-9 shrink-0 inline-flex items-center justify-center rounded bg-green-500 text-black hover:bg-green-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <div
            role="group"
            aria-label="Playback speed"
            className="hidden sm:flex shrink-0 rounded border border-green-500/25 overflow-hidden"
          >
            {PLAYBACK_SPEEDS.map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => onChangePlaybackSpeed(speed)}
                aria-pressed={playbackSpeed === speed}
                className={`h-7 px-2 text-[11px] tabular-nums border-r last:border-r-0 border-green-500/25 transition-colors ${
                  playbackSpeed === speed
                    ? "bg-green-500/25 text-green-100 font-semibold"
                    : "bg-black/60 text-green-400/70 hover:text-green-200"
                }`}
              >
                {speed}×
              </button>
            ))}
          </div>

          {/* The error timeline shares the scrubber's x axis: frame f sits over the thumb */}
          <div className="flex-1 min-w-0 space-y-1">
            {timelineErrors && (
              <AbcErrorTimeline
                errors={timelineErrors}
                baseline={timelineBaseline}
                frameIndex={frameIndex}
                onScrubFrame={onScrubFrame}
                stale={clipErrorsStale}
              />
            )}
            <input
              type="range"
              min={0}
              max={maxFrameIndex}
              value={frameIndex}
              onChange={(e) => onScrubFrame(Number(e.target.value))}
              aria-label="Timeline frame scrubber"
              className="block h-7 w-full accent-green-500 cursor-pointer"
            />
          </div>

          <span className="shrink-0 h-7 inline-flex items-center text-[11px] text-green-300 tabular-nums whitespace-nowrap">
            +{frameIndex * 10} ms
            <span className="text-green-500/70">
              {" "}
              · {frameIndex + 1}/{maxFrameIndex + 1}
            </span>
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-2">
          {POSE_SLIDERS.map((slider) => (
            <label key={slider.key} className="block min-w-0">
              <span className="flex justify-between gap-2 text-[11px]">
                <span className="truncate text-green-300/85">{slider.label}</span>
                <span className={`tabular-nums ${slider.valueClass}`}>
                  {manualPose[slider.key].toFixed(0)}
                  {slider.unit}
                </span>
              </span>
              <input
                type="range"
                min={slider.min}
                max={slider.max}
                value={manualPose[slider.key]}
                onChange={(e) =>
                  onChangeManualPose({ ...manualPose, [slider.key]: Number(e.target.value) })
                }
                className={`w-full cursor-pointer ${slider.accentClass}`}
              />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
