"use client";

import { useRef } from "react";
import { ShieldCheck, Bot, Bug, LineChart } from "lucide-react";
import { ActionButton, FeatureCard, JourneyCard } from "@/components/ui/custom-components";
import { usePageMotion } from "@/lib/motion";

export default function Home() {
  const pageRef = useRef<HTMLElement>(null);
  usePageMotion(pageRef);

  const passionAreas = [
    {
      icon: ShieldCheck,
      title: "AI Safety & Evaluation",
      description: "My final-year project is in AI agent safety. I'm interested in how to evaluate agents and keep tool-using agents within the scope they were given."
    },
    {
      icon: Bot,
      title: "AI Agents with Scoped Tool Access",
      description: "MCP servers that gave internal agents real SQL and API access at CompuCal, plus multi-agent orchestration with CrewAI. The permissions, tools and evaluation are the hard part."
    },
    {
      icon: Bug,
      title: "Software Security",
      description: "Memory-safety exploits and their defences: stack overflows and format-string bugs on 32-bit Linux, worked through in GDB, and the mitigations that stop them (ASLR, NX, stack canaries)."
    },
    {
      icon: LineChart,
      title: "Production ML",
      description: "RAG with pgvector and LangChain, CatBoost/XGBoost/LightGBM predictive models, OCR extraction, and the 7,552-parameter TCN that took joint gold at the 9th ABC Challenge."
    }
  ];

  const journeyCards = [
    {
      title: "Education",
      description: "Final year of a BSc (Hons) in Software Development at MTU Cork, with a final-year project in AI agent safety. QQI Level 6 Advanced Software Development with distinction prior. Joint Gold at the 9th ABC Challenge with MTU team Motion Pending."
    },
    {
      title: "Previous Experience",
      description: "Previously shipped ML features at CompuCal (Cork, Ireland), RAG, OCR, predictive maintenance, and MCP-backed agents for a regulated calibration-management platform."
    },
    {
      title: "Focus",
      description: "AI safety, machine learning, software engineering and security. Looking for full-time roles where I can build ML systems and test how they behave."
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
                  AI Safety &amp; ML Engineer
                </p>
                <p className="text-lg text-gray-700 dark:text-green-500/80 mt-2 leading-relaxed max-w-2xl">
                  I build machine-learning systems and test how they behave. I&apos;m in the final
                  year of a BSc (Hons) in Software Development at MTU Cork, with a final-year
                  project in AI agent safety. Before that I shipped RAG, OCR, predictive models and
                  MCP-backed agents at CompuCal in Cork.
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
              excuse to learn the language. Five years on, my focus is AI safety, machine
              learning and security: AI agents with real tool access, the evaluations that check
              what they do, and the software security underneath. After shipping ML features at
              CompuCal, I&apos;m finishing a BSc (Hons) in Software Development at MTU Cork.
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
