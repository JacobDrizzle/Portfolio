import type { Metadata } from "next";
import MLPageContent from "./MLPageContent";

const description =
  "Production ML for small teams: RAG pipelines, AI agents with MCP tool access, predictive models, and OCR extraction. Shipped to users, not notebooks.";

export const metadata: Metadata = {
  title: "Jacob Dorrill — ML Engineer for RAG, Agents & Predictive Models",
  description,
  alternates: {
    canonical: "https://www.jacobdrizzle.dev/ml",
  },
  openGraph: {
    title: "Jacob Dorrill — ML Engineer for RAG, Agents & Predictive Models",
    description,
    url: "https://www.jacobdrizzle.dev/ml",
    siteName: "Jacob Dorrill — ML Engineer",
    locale: "en_US",
    type: "website",
    // TODO: generate /public/og-ml.png (1200x630) — minimal card with
    // "Jacob Dorrill / ML Engineer / RAG · Agents · Predictive Models" on the
    // existing site's dark background. Once added, uncomment the `images`
    // block and the twitter image entry below.
    // images: [{ url: "/og-ml.png", width: 1200, height: 630, alt: "Jacob Dorrill — ML Engineer" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jacob Dorrill — ML Engineer for RAG, Agents & Predictive Models",
    description,
    creator: "@Jacob_Drizzle",
    // images: ["/og-ml.png"],
  },
};

export default function MLPage() {
  return <MLPageContent />;
}
