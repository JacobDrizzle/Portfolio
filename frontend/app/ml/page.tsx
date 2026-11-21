import type { Metadata } from "next";
import MLPageContent from "./MLPageContent";

const title = "Jacob Dorrill — AI Safety & ML Engineer";
const description =
  "AI safety and ML engineering: AI agents with scoped tool access, agent evaluation, production ML and software security. Includes the Joint Gold 9th ABC Challenge model.";

export const metadata: Metadata = {
  // Absolute so the root "%s | Jacob Dorrill — ..." template doesn't repeat the name.
  title: { absolute: title },
  description,
  alternates: {
    canonical: "https://www.jacobdrizzle.dev/ml",
  },
  openGraph: {
    title,
    description,
    url: "https://www.jacobdrizzle.dev/ml",
    siteName: title,
    locale: "en_US",
    type: "website",
    // TODO: generate /public/og-ml.png (1200x630) — minimal card with
    // "Jacob Dorrill / AI Safety & ML Engineer" on the existing site's dark
    // background. Once added, uncomment the `images` block and the twitter
    // image entry below.
    // images: [{ url: "/og-ml.png", width: 1200, height: 630, alt: title }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    creator: "@Jacob_Drizzle",
    // images: ["/og-ml.png"],
  },
};

export default function MLPage() {
  return <MLPageContent />;
}
