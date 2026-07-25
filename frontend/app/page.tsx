"use client";

import { useRef } from "react";
import { Database, Bot, LineChart, ScanText } from "lucide-react";
import { ActionButton, FeatureCard, JourneyCard } from "@/components/ui/custom-components";
import { usePageMotion } from "@/lib/motion";

export default function Home() {
  const pageRef = useRef<HTMLElement>(null);
  usePageMotion(pageRef);

  const passionAreas = [
    {
      icon: Database,
      title: "RAG Pipelines",
      description: "Embeddings, retrieval with confidence scoring, and citation surfacing. pgvector, LangChain, FastAPI, served as a REST API or embedded widget."
    },
    {
      icon: Bot,
      title: "AI Agents with Tool Access",
      description: "Multi-agent orchestration via CrewAI. MCP servers connecting agents to SQL databases, internal APIs, and documentation repos, not toy prompt chains."
    },
    {
      icon: LineChart,
      title: "Predictive ML",
      description: "Classification, regression, and anomaly detection with CatBoost, XGBoost, LightGBM, and ensembles. Benchmarked against a real baseline, not just cross-validated in a notebook."
    },
    {
      icon: ScanText,
      title: "OCR & Document Extraction",
      description: "Structured JSON extraction from scanned PDFs. Azure Document Intelligence or in-house GLM-OCR depending on cost and accuracy tradeoffs."
    }
  ];

  const journeyCards = [
    {
      title: "Education",
      description: "Returning to MTU Cork to complete a Level 8 BSc (Hons) in Software Engineering. QQI Level 6 Advanced Software Development with distinction prior."
    },
    {
      title: "Previous Experience",
      description: "Previously shipped ML features at CompuCal (Cork, Ireland), RAG, OCR, predictive maintenance, and MCP-backed agents for a regulated calibration-management platform."
    },
    {
      title: "Focus",
      description: "Production ML for small teams: retrieval systems, AI agents, and predictive modelling for tabular and document-heavy problems."
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-green-400">
      <main ref={pageRef} className="container mx-auto px-4 pt-20 pb-20 relative z-10">
        <div className="space-y-12">
          {/* Hero Section */}
          <div className="flex flex-col lg:flex-row justify-between">
            <div>
              <div
                data-animate="intro"
                className="font-mono text-green-600 dark:text-green-300 lg:text-lg md:text-md mb-4"
              >
                ~/portfolio/guest@terminal:$
                <span className="animate-blink inline-block w-2 h-5 bg-green-500 ml-1" />
              </div>
              <h1
                data-animate="intro"
                className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-green-400 mb-6"
              >
                <span className="motion-button text-green-600 dark:text-green-500 inline-block">
                  {"{Jacob Dorrill}"}
                </span>
              </h1>
              <div
                data-animate="intro"
                className="motion-shift border-l-2 border-green-500 pl-4 mb-8"
              >
                <p className="text-xl text-gray-700 dark:text-green-300">
                  ML Engineer, RAG Systems, AI Agents, and Predictive Models
                </p>
                <p className="text-lg text-gray-700 dark:text-green-500/80 mt-2 leading-relaxed max-w-2xl">
                  I build production ML systems, RAG pipelines with pgvector, AI agents wired to
                  real databases via MCP, gradient-boosting predictive models, and OCR extraction
                  pipelines. I previously shipped ML features at CompuCal (Cork, Ireland) and am
                  returning to MTU Cork to complete a Level 8 BSc (Hons) in Software Engineering.
                </p>
              </div>
            </div>

            {/* Call to Action */}
            <div data-animate="intro" className="flex space-x-4 pt-6">
              <ActionButton href="/ml" variant="filled">
                See ML Work
              </ActionButton>
            </div>
          </div>

          {/* Passion Areas */}
          <section data-animate="section" className="grid md:grid-cols-2 gap-6">
            <div className="space-y-6">
              {passionAreas.slice(0, 2).map((area, index) => (
                <div key={index} data-animate-item>
                  <FeatureCard {...area} />
                </div>
              ))}
            </div>
            <div className="space-y-6">
              {passionAreas.slice(2).map((area, index) => (
                <div key={index + 2} data-animate-item>
                  <FeatureCard {...area} />
                </div>
              ))}
            </div>
          </section>

          {/* Journey Section */}
          <section
            data-animate="section"
            className="border-t border-green-300 dark:border-green-500/30 pt-8"
          >
            <h2 data-animate-item className="text-2xl font-semibold mb-4 text-gray-900 dark:text-green-400">
              My Journey
            </h2>
            <p data-animate-item className="text-gray-700 dark:text-green-500/80 mb-6 leading-relaxed">
              I started with Python scripts in early 2021, automating crypto trades was the
              excuse to learn the language. Five years on, the work has settled: production ML
              for small teams. RAG systems, AI agents with real tool access, and predictive
              models for tabular and document-heavy problems. After shipping ML features at
              CompuCal, I&apos;m returning to MTU Cork to complete a Level 8 BSc (Hons) in Software
              Engineering.
            </p>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              {journeyCards.map((card, index) => (
                <div key={index} data-animate-item>
                  <JourneyCard {...card} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
