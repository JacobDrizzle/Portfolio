#!/usr/bin/env node
/**
 * Rebuild the replay clips in public/models/abc-challenge/k8-combined-weights.json from
 * the public abc-challenge repo's visualization traces, so the page shows no BOXRR-23
 * recording (its data use agreement does not allow publishing them).
 *
 * Sources (visualization/tactical/traces/ in the public repo):
 *   test50.js            one QuestSet player (Baldoni et al., 2024, CC BY 4.0)
 *   syn25/75/90/97.js    synthetic head motion from tools/make_synthetic_data.py
 *
 * Each trace holds a contiguous 100 Hz stream: 400 initial-context samples, then one
 * input quaternion per call, then the last call's 20-sample ground truth. A clip is
 * the trace's 300 scored anchors (picked by the public repo on head speed only, never
 * on error) with 400 samples of context before the first and 20 of future after the last.
 *
 * Only the clips are replaced; the k8_combined weights and metrics stay as they are.
 *
 * Usage (from frontend/):
 *   node scripts/build-abc-clips.mjs ../../../abc-challenge-public
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const CONTEXT = 400;
const HORIZON = 20;
const RATE_HZ = 100;

const QUESTSET_CREDIT =
  "QuestSet (Baldoni et al., 2024), Research Data Unipd, CC BY 4.0. Changed: head orientation only, converted to the model's frame and resampled to 100 Hz.";
const SYNTHETIC_CREDIT =
  "Synthetic head motion from the public abc-challenge repo (tools/make_synthetic_data.py). Not a recording of any person.";

// Page order: the real player first, then the synthetic players from calm to fast.
const CLIPS = [
  {
    trace: "test50",
    id: "questset_beat_saber",
    title: "QuestSet Player (Beat Saber)",
    description:
      "Real head motion from one QuestSet player in a fast Beat Saber session, a player the model never trained on. The stretch closest to the session's median head speed.",
  },
  {
    trace: "syn25",
    id: "synthetic_calm",
    title: "Synthetic Calm (P25 Speed)",
    description:
      "Synthetic head turns, dodges and drift at the 25th-percentile head speed of the BOXRR-23 test windows.",
  },
  {
    trace: "syn75",
    id: "synthetic_turning",
    title: "Synthetic Turning (P75 Speed)",
    description:
      "Synthetic head turns, dodges and drift at the 75th-percentile head speed of the BOXRR-23 test windows.",
  },
  {
    trace: "syn90",
    id: "synthetic_fast",
    title: "Synthetic Fast (P90 Speed)",
    description:
      "Synthetic head turns, dodges and drift at the 90th-percentile head speed of the BOXRR-23 test windows.",
  },
  {
    trace: "syn97",
    id: "synthetic_very_fast",
    title: "Synthetic Very Fast (P97 Speed)",
    description:
      "Synthetic head turns, dodges and drift at the 97th-percentile head speed of the BOXRR-23 test windows.",
  },
];

function loadTrace(tracesDir, traceId) {
  const text = readFileSync(join(tracesDir, `${traceId}.js`), "utf8");
  const marker = `window.TRACES['${traceId}'] = `;
  const start = text.indexOf(marker);
  if (start < 0) throw new Error(`${traceId}.js: no ${marker.trim()} assignment`);
  return JSON.parse(text.slice(start + marker.length).trim().replace(/;$/, ""));
}

/** The trace's samples as one stream, with the zero-based segment index of its first sample. */
function traceStream(trace) {
  const { metadata: md, initial_context: initial, steps } = trace;
  const first = steps[0];
  const sameAsFirstCall = initial[CONTEXT - 1].every((v, i) => v === first.input_quaternion[i]);
  if (!sameAsFirstCall) throw new Error(`${md.trace_id}: initial context does not end on the first call`);

  const stream = initial.slice();
  for (let i = 1; i < steps.length; i++) {
    if (steps[i].t !== first.t + i) throw new Error(`${md.trace_id}: gap in calls at ${steps[i].t}`);
    stream.push(steps[i].input_quaternion);
  }
  const lastStep = steps[steps.length - 1];
  if (!lastStep.ground_truth) throw new Error(`${md.trace_id}: last call has no ground truth`);
  stream.push(...lastStep.ground_truth);

  return { stream, startT: first.t - (CONTEXT - 1) };
}

/** Angular speed between consecutive samples, in deg/s. */
function speedsDegPerSec(quats) {
  const out = [];
  for (let i = 1; i < quats.length; i++) {
    const a = quats[i - 1];
    const b = quats[i];
    const na = Math.hypot(...a);
    const nb = Math.hypot(...b);
    const dot = Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]) / (na * nb);
    out.push(((2 * Math.acos(Math.min(1, dot)) * 180) / Math.PI) * RATE_HZ);
  }
  return out;
}

function buildClip(spec, trace) {
  const md = trace.metadata;
  const { stream, startT } = traceStream(trace);

  const firstAnchor = md.first_recorded_t;
  const lastAnchor = md.last_recorded_t;
  const playbackFrames = lastAnchor - firstAnchor + 1;
  const from = firstAnchor - (CONTEXT - 1) - startT;
  const to = lastAnchor + HORIZON - startT + 1;
  if (from < 0 || to > stream.length) throw new Error(`${spec.trace}: scored window outside the stream`);
  const quaternions = stream.slice(from, to);

  // Check the slice against the trace's own scored calls: same anchor pose, same truth.
  // Inputs went through float32 and the truth stayed float64, so the 7th decimal can differ.
  const close = (a, b) => a.every((v, i) => Math.abs(v - b[i]) <= 2e-7);
  const scored = trace.steps.filter((s) => !s.warmup);
  if (scored.length !== playbackFrames) throw new Error(`${spec.trace}: expected ${playbackFrames} scored calls`);
  scored.forEach((s, f) => {
    const anchor = quaternions[f + CONTEXT - 1];
    if (!close(anchor, s.input_quaternion)) {
      throw new Error(`${spec.trace}: anchor mismatch at frame ${f}`);
    }
    s.ground_truth.forEach((q, k) => {
      if (!close(q, quaternions[f + CONTEXT + k])) {
        throw new Error(`${spec.trace}: ground-truth mismatch at frame ${f}, step ${k + 1}`);
      }
    });
  });

  // Head speed over the stretch the page plays: first anchor through the last forecast target.
  const played = speedsDegPerSec(quaternions.slice(CONTEXT - 1));
  const mean = played.reduce((sum, v) => sum + v, 0) / played.length;
  const max = Math.max(...played);

  return {
    id: spec.id,
    title: spec.title,
    description: spec.description,
    source: md.source === "questset" ? "questset" : "synthetic",
    credit: md.source === "questset" ? QUESTSET_CREDIT : SYNTHETIC_CREDIT,
    meanSpeedDegPerSec: Math.round(mean * 10) / 10,
    maxSpeedDegPerSec: Math.round(max * 10) / 10,
    totalFrames: quaternions.length,
    contextLength: CONTEXT,
    playbackFrames,
    horizon: HORIZON,
    quaternions,
  };
}

const repoArg = process.argv[2];
if (!repoArg) {
  console.error("usage: node scripts/build-abc-clips.mjs <path to abc-challenge-public>");
  process.exit(1);
}
const tracesDir = join(resolve(repoArg), "visualization", "tactical", "traces");
const bundlePath = resolve("public/models/abc-challenge/k8-combined-weights.json");

const bundle = JSON.parse(readFileSync(bundlePath, "utf8"));
bundle.clips = CLIPS.map((spec) => buildClip(spec, loadTrace(tracesDir, spec.trace)));
bundle.clipSources = {
  questset: {
    name: "QuestSet",
    citation:
      "Baldoni, S., Battisti, F., Chiariotti, F., Mistrorigo, F., Shofi, A. B., Testolina, P., Traspadini, A., Zanella, A. and Zorzi, M. (2024). Questset. Research Data Unipd.",
    url: "https://researchdata.cab.unipd.it/1239/",
    licence: "CC BY 4.0",
    changes: "Head orientation only, converted to the model's frame and resampled to 100 Hz.",
  },
  synthetic: {
    name: "Synthetic head motion",
    note: "Made by visualization/tactical/tools/make_synthetic_data.py in the public abc-challenge repo. Not fitted to anyone's recordings.",
  },
};
writeFileSync(bundlePath, JSON.stringify(bundle));

for (const clip of bundle.clips) {
  console.log(
    `${clip.id.padEnd(22)} ${String(clip.playbackFrames).padStart(4)} frames  ` +
      `mean ${clip.meanSpeedDegPerSec} deg/s  max ${clip.maxSpeedDegPerSec} deg/s`,
  );
}
