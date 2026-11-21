import type { Metadata } from "next";
import AbcChallengePageContent from "./AbcChallengePageContent";

const title = "9th ABC Challenge Joint Gold — 3D TCNN Head-Pose Visualizer";
const description =
  "Joint Gold at the 9th ABC Challenge (Team Motion Pending, MTU). Interactive Three.js 3D architecture and real-time in-browser inference visualizer for k8_combined (LeanTCNN), a 7,555-parameter mirror-equivariant dilated TCN for 200 ms XR head-pose forecasting, the smallest model of any team.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title: `${title} | Jacob Dorrill — ML Engineer`,
    description,
    url: "https://www.jacobdrizzle.dev/ml/abc-challenge",
    type: "website",
  },
  alternates: {
    canonical: "https://www.jacobdrizzle.dev/ml/abc-challenge",
  },
};

export default function AbcChallengePage() {
  return <AbcChallengePageContent />;
}

