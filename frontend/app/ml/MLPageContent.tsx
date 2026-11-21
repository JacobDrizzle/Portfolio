"use client";

import { useRef } from "react";
import Link from "next/link";
import { ShieldCheck, Bot, Bug, LineChart, Mail, Github, ExternalLink, Box, ArrowRight, Trophy } from "lucide-react";
import { ActionButton } from "@/components/ui/custom-components";
import { ML_PROJECTS } from "@/lib/featured-repos";
import { usePageMotion } from "@/lib/motion";

const capabilities = [
  {
    icon: ShieldCheck,
    title: "AI Safety & Evaluation",
    description:
      "My final-year project at MTU Cork is in AI agent safety. I'm interested in how to evaluate agents and keep tool-using agents within the scope they were given.",
  },
  {
    icon: Bot,
    title: "AI Agents with Scoped Tool Access",
    description:
      "At CompuCal I built MCP servers that gave internal agents real SQL and API access, alongside multi-agent orchestration with CrewAI. The permissions, tools and evaluation are the hard part.",
  },
  {
    icon: Bug,
    title: "Software Security",
    description:
      "Memory-safety exploits and their defences: stack overflows and format-string bugs on 32-bit Linux, worked through in GDB, and the mitigations that stop them (ASLR, NX, stack canaries).",
  },
  {
    icon: LineChart,
    title: "Production ML",
    description:
      "RAG with pgvector and LangChain, CatBoost/XGBoost/LightGBM predictive models benchmarked against real baselines, OCR extraction from scanned PDFs, and small, fast models for edge devices.",
  },
];

const stackGroups = [
  {
    category: "ML & AI",
    items: ["PyTorch", "scikit-learn", "CatBoost", "XGBoost", "LightGBM", "pandas", "NumPy"],
  },
  {
    category: "GenAI & NLP",
    items: ["LangChain", "CrewAI", "MCP", "FinBERT", "Transformers", "OpenAI API", "Gemini"],
  },
  {
    category: "Backend",
    items: ["Python", "FastAPI", "Node.js", "TypeScript", "Golang"],
  },
  {
    category: "Cloud & DevOps",
    items: ["Azure", "AWS", "Docker", "GitHub Actions", "Linux"],
  },
  {
    category: "Databases",
    items: ["PostgreSQL", "pgvector", "SQL Server", "Redis", "MongoDB"],
  },
  {
    category: "Security",
    items: ["GDB", "C & x86 assembly", "Memory-safety exploits", "ASLR / NX / canaries", "Linux"],
  },
];

export default function MLPageContent() {
  const pageRef = useRef<HTMLElement>(null);
  usePageMotion(pageRef);

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-green-400">
      <main ref={pageRef} className="container mx-auto px-4 pt-24 pb-20 relative z-10">
        <div className="space-y-20 max-w-6xl mx-auto">
          {/* Hero */}
          <section>
            <div
              data-animate="intro"
              className="font-mono text-green-600 dark:text-green-300 lg:text-lg md:text-md mb-4"
            >
              ~/ml/guest@terminal:$
              <span className="animate-blink inline-block w-2 h-5 bg-green-500 ml-1" />
            </div>
            <h1
              data-animate="intro"
              className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-green-400 mb-6"
            >
              AI Safety &amp;{" "}
              <span className="text-green-600 dark:text-green-500">ML Engineering</span>
            </h1>
            <div
              data-animate="intro"
              className="motion-shift border-l-2 border-green-500 pl-4 mb-8 max-w-3xl"
            >
              <p className="text-xl text-gray-700 dark:text-green-300 leading-relaxed">
                ML systems and AI agents with scoped tool access, plus the evaluation and
                security work that keeps them in bounds.
              </p>
            </div>
            <div data-animate="intro" className="flex flex-wrap gap-4">
              <ActionButton href="/contact" variant="filled">
                Get in touch
              </ActionButton>
              <ActionButton href="/ml/abc-challenge" variant="outlined">
                Interactive 3D ABC Challenge Model
              </ActionButton>
            </div>
          </section>

          {/* Featured Interactive 3D Model Showcase */}
          <section
            data-animate="section"
            className="border-t border-green-300 dark:border-green-500/30 pt-12"
          >
            <div
              data-animate-item
              className="motion-lift relative overflow-hidden rounded-xl border border-green-400 dark:border-green-500/50 bg-gradient-to-br from-green-50 via-emerald-50/60 to-cyan-50/40 dark:from-green-950/25 dark:via-black dark:to-cyan-950/20 p-6 md:p-8 shadow-xl shadow-green-500/10"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-2 font-mono text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-400/15 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-400/40">
                      <Trophy className="w-3.5 h-3.5" />
                      <span>Joint Gold · 9th ABC Challenge</span>
                    </div>
                    <div className="inline-flex items-center gap-2 font-mono text-xs px-3 py-1 rounded-full bg-green-600/15 dark:bg-green-500/20 text-green-800 dark:text-green-300 border border-green-400/40">
                      <Box className="w-3.5 h-3.5" />
                      <span>Live In-Browser 3D Neural Network & Quaternion Sandbox</span>
                    </div>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-green-300">
                    9th ABC Challenge: <code className="font-mono">k8_combined</code> (LeanTCNN)
                  </h2>
                  <p className="text-gray-700 dark:text-green-400/85 leading-relaxed">
                    Team Motion Pending&apos;s entry won joint first place, with the fewest parameters
                    of any team on the organisers&apos; Qualcomm XR device. Explore the
                    7,555-parameter mirror-equivariant dilated TCN built for 200 ms XR
                    head-pose prediction on 100 Hz BOXRR-23 Beat Saber streams. Step through the 7
                    native velocity &amp; head-frame gravity channels, twin{" "}
                    <code className="font-mono">[[A, B], [B, A]]</code> mirror streams, 393-sample
                    dilated causal receptive field, damped-velocity prior, and trig-free Cayley map
                    in real time.
                  </p>
                  <div className="flex flex-wrap gap-3 pt-1 font-mono text-xs text-green-700 dark:text-green-300/90">
                    <span className="px-2.5 py-1 rounded bg-green-500/10 border border-green-500/25">
                      4.2501 ± 0.0041° Val
                    </span>
                    <span className="px-2.5 py-1 rounded bg-green-500/10 border border-green-500/25">
                      4.2666° Test (200 ms)
                    </span>
                    <span className="px-2.5 py-1 rounded bg-green-500/10 border border-green-500/25">
                      7,555 Params
                    </span>
                    <span className="px-2.5 py-1 rounded bg-green-500/10 border border-green-500/25">
                      46.9–55.2 µs ORT CPU
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Link
                    href="/ml/abc-challenge"
                    className="motion-button inline-flex items-center gap-2 px-6 py-3.5 rounded-lg font-mono text-sm font-semibold bg-green-600 dark:bg-green-500 text-white dark:text-black hover:bg-green-500 dark:hover:bg-green-400 shadow-lg shadow-green-500/25 transition-all"
                  >
                    <span>Launch 3D Visualizer</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* What I build */}
          <section
            data-animate="section"
            className="border-t border-green-300 dark:border-green-500/30 pt-12"
          >
            <h2 data-animate-item className="text-2xl font-semibold mb-8 text-gray-900 dark:text-green-400">
              What I build
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {capabilities.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  data-animate-item
                  className="motion-lift bg-green-50 dark:bg-green-500/5 border border-green-200 dark:border-green-500/30 p-6 rounded-lg hover:border-green-400 dark:hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10"
                >
                  <span className="motion-icon">
                    <Icon className="w-8 h-8 text-green-600 dark:text-green-500 mb-4" />
                  </span>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-green-400">
                    {title}
                  </h3>
                  <p className="text-gray-700 dark:text-green-500/80 leading-relaxed">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </section>

          {/* Recent work */}
          <section
            data-animate="section"
            className="border-t border-green-300 dark:border-green-500/30 pt-12"
          >
            <h2 data-animate-item className="text-2xl font-semibold mb-8 text-gray-900 dark:text-green-400">
              Recent work
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {ML_PROJECTS.map((project) => {
                const isInternal = project.url.startsWith("/");
                return (
                <Link
                  key={project.title}
                  data-animate-item
                  href={project.url}
                  target={isInternal ? undefined : "_blank"}
                  rel={isInternal ? undefined : "noopener noreferrer"}
                  className="motion-lift block border border-green-200 dark:border-green-500/30 rounded-lg p-6 bg-green-50 dark:bg-green-500/5 hover:border-green-400 dark:hover:border-green-500/50 hover:shadow-xl hover:shadow-green-500/10 group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-green-400 group-hover:text-green-600 dark:group-hover:text-green-300 transition-colors">
                      {project.title}
                    </h3>
                    {isInternal ? (
                      <ArrowRight className="motion-icon w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0 ml-3" />
                    ) : (
                      <ExternalLink className="motion-icon w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0 ml-3" />
                    )}
                  </div>
                  <p className="text-gray-700 dark:text-green-500/80 mb-4 leading-relaxed">
                    {project.summary}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {project.stack.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </Link>
                );
              })}
            </div>
          </section>

          {/* Stack */}
          <section
            data-animate="section"
            className="border-t border-green-300 dark:border-green-500/30 pt-12"
          >
            <h2 data-animate-item className="text-2xl font-semibold mb-8 text-gray-900 dark:text-green-400">
              Stack
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {stackGroups.map((group) => (
                <article
                  key={group.category}
                  data-animate-item
                  className="bg-green-50 dark:bg-green-500/5 p-4 rounded-lg border border-green-200 dark:border-green-500/20"
                >
                  <h3 className="font-semibold mb-3 text-gray-900 dark:text-green-400">
                    {group.category}
                  </h3>
                  <ul className="space-y-1 text-sm text-gray-700 dark:text-green-500/80">
                    {group.items.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          {/* What I'm looking for */}
          <section
            data-animate="section"
            className="border-t border-green-300 dark:border-green-500/30 pt-12"
          >
            <h2 data-animate-item className="text-2xl font-semibold mb-6 text-gray-900 dark:text-green-400">
              What I&apos;m looking for
            </h2>
            <div data-animate-item className="max-w-3xl border-l-2 border-green-500 pl-6">
              <p className="text-gray-700 dark:text-green-500/80 leading-relaxed text-lg">
                Full-time roles in AI safety, ML engineering, software engineering or security.
                I&apos;m most at home where models meet real systems: agents that act on real
                data, the evaluations that check what they did, and the security around them.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section
            data-animate="section"
            className="border-t border-green-300 dark:border-green-500/30 pt-12"
          >
            <h2 data-animate-item className="text-2xl font-semibold mb-6 text-gray-900 dark:text-green-400">
              Hiring?
            </h2>
            <div
              data-animate-item
              className="bg-green-50 dark:bg-green-500/5 border border-green-200 dark:border-green-500/30 p-6 md:p-8 rounded-lg"
            >
              <div className="flex items-center gap-3 mb-6">
                <Mail className="w-5 h-5 text-green-600 dark:text-green-500" />
                <a
                  href="mailto:jd_git@protonmail.com"
                  className="text-lg text-gray-700 dark:text-green-300 hover:text-green-600 dark:hover:text-green-400 transition-colors font-mono"
                >
                  jd_git@protonmail.com
                </a>
              </div>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="https://github.com/JacobDrizzle"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="motion-button h-fit px-6 py-3 rounded-md font-mono border border-green-600 dark:border-green-500 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 flex items-center gap-2"
                >
                  <Github className="w-5 h-5" />
                  GitHub
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
