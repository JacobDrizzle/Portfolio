"use client";

import { useRef } from "react";
import Link from "next/link";
import { Database, Bot, LineChart, ScanText, Mail, Github, ExternalLink } from "lucide-react";
import { ActionButton } from "@/components/ui/custom-components";
import { ML_PROJECTS } from "@/lib/featured-repos";
import { usePageMotion } from "@/lib/motion";

const capabilities = [
  {
    icon: Database,
    title: "RAG Pipelines",
    description:
      "Embeddings, retrieval with confidence scoring, citation surfacing. pgvector, LangChain, FastAPI. Served as REST API or embedded widget.",
  },
  {
    icon: Bot,
    title: "AI Agents with Real Tool Access",
    description:
      "Multi-agent orchestration via CrewAI. MCP servers connecting agents to SQL databases, internal APIs, and documentation repos, not toy chains.",
  },
  {
    icon: LineChart,
    title: "Predictive ML for Tabular Data",
    description:
      "Classification, regression, and anomaly detection using CatBoost, XGBoost, LightGBM, and ensembles. Benchmarked against your baseline, not just cross-validated in a notebook.",
  },
  {
    icon: ScanText,
    title: "OCR & Document Extraction",
    description:
      "Structured JSON extraction from scanned PDFs. Azure Document Intelligence or in-house GLM-OCR depending on cost/accuracy tradeoffs.",
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
              Production ML,{" "}
              <span className="text-green-600 dark:text-green-500">Not Notebook Demos</span>
            </h1>
            <div
              data-animate="intro"
              className="motion-shift border-l-2 border-green-500 pl-4 mb-8 max-w-3xl"
            >
              <p className="text-xl text-gray-700 dark:text-green-300 leading-relaxed">
                RAG systems, AI agents, and predictive models that ship to real users.
              </p>
            </div>
            <div data-animate="intro" className="flex flex-wrap gap-4">
              <ActionButton href="/contact" variant="filled">
                Get in touch
              </ActionButton>
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
              {ML_PROJECTS.map((project) => (
                <a
                  key={project.title}
                  data-animate-item
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="motion-lift block border border-green-200 dark:border-green-500/30 rounded-lg p-6 bg-green-50 dark:bg-green-500/5 hover:border-green-400 dark:hover:border-green-500/50 hover:shadow-xl hover:shadow-green-500/10 group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-green-400 group-hover:text-green-600 dark:group-hover:text-green-300 transition-colors">
                      {project.title}
                    </h3>
                    <ExternalLink className="motion-icon w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0 ml-3" />
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
                </a>
              ))}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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

          {/* How I work */}
          <section
            data-animate="section"
            className="border-t border-green-300 dark:border-green-500/30 pt-12"
          >
            <h2 data-animate-item className="text-2xl font-semibold mb-6 text-gray-900 dark:text-green-400">
              How I work
            </h2>
            <div data-animate-item className="max-w-3xl border-l-2 border-green-500 pl-6">
              <p className="text-gray-700 dark:text-green-500/80 leading-relaxed text-lg">
                I work async-first and document as I go. Paid 2-hour scoping call before any
                engagement over 20 hours so we both know the scope is real. Fixed-price for
                well-defined deliverables, hourly for open-ended exploration. Based in Cork,
                Ireland, EU business hours with meaningful overlap for US east-coast mornings.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section
            data-animate="section"
            className="border-t border-green-300 dark:border-green-500/30 pt-12"
          >
            <h2 data-animate-item className="text-2xl font-semibold mb-6 text-gray-900 dark:text-green-400">
              Work together?
            </h2>
            <div
              data-animate-item
              className="bg-green-50 dark:bg-green-500/5 border border-green-200 dark:border-green-500/30 p-6 md:p-8 rounded-lg"
            >
              <div className="flex items-center gap-3 mb-6">
                <Mail className="w-5 h-5 text-green-600 dark:text-green-500" />
                <a
                  href="mailto:jacobdorrill@gmail.com"
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
