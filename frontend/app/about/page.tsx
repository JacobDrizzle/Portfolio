"use client";

import { useRef } from "react";
import { Database, Bot, LineChart, ScanText, Terminal, Brain, Code } from "lucide-react";
import { ActionButton } from "@/components/ui/custom-components";
import { usePageMotion } from "@/lib/motion";

export default function About() {
  const pageRef = useRef<HTMLElement>(null);
  usePageMotion(pageRef);

  const passionAreas = [
    {
      icon: Database,
      title: "RAG & Retrieval",
      description: "Embeddings, hybrid search, confidence scoring, and citation surfacing. pgvector in Postgres for most cases, LangChain for orchestration, FastAPI for serving. I care more about evaluation harnesses and retrieval quality than the latest framework."
    },
    {
      icon: Bot,
      title: "AI Agents with Tool Access",
      description: "Multi-agent orchestration via CrewAI. MCP servers that give agents real read/write access to SQL databases, internal APIs, and documentation. The hard part is the tools and evaluation, the prompts are the easy bit."
    },
    {
      icon: LineChart,
      title: "Predictive ML",
      description: "Classification, regression, anomaly detection, and forecasting on tabular data. CatBoost, XGBoost, LightGBM, and ensembles. I benchmark against real baselines with proper validation splits, not just hold-out on a toy dataset."
    },
    {
      icon: ScanText,
      title: "Document Extraction & OCR",
      description: "Turning scanned PDFs and messy documents into structured JSON. Azure Document Intelligence when accuracy matters, in-house GLM-OCR when cost matters, and a lot of careful post-processing either way."
    }
  ];

  const journeyCards = [
    {
      title: "Education",
      description: "Returning to MTU Cork to complete a Level 8 BSc (Hons) in Software Engineering. QQI Level 6 Advanced Software Development with distinction prior. Focused throughout on systems, algorithms, and applied ML."
    },
    {
      title: "Previous Experience",
      description: "Previously shipped ML features at CompuCal in Cork, a regulated calibration-management platform. Built production RAG, OCR pipelines, predictive maintenance models, and MCP servers that gave internal agents real database access."
    },
    {
      title: "Focus",
      description: "Focused on production ML, retrieval systems, AI agents, and predictive modelling for tabular and document-heavy problems. Comfortable owning a feature from research spike to deployed endpoint."
    }
  ];

  const skills = [
    {
      category: "ML & AI",
      items: ["PyTorch", "scikit-learn", "CatBoost", "XGBoost", "LightGBM", "pandas", "NumPy"]
    },
    {
      category: "GenAI & NLP",
      items: ["LangChain", "CrewAI", "MCP", "FinBERT", "Transformers", "OpenAI API", "Gemini"]
    },
    {
      category: "Backend",
      items: ["Python", "FastAPI", "Node.js", "TypeScript", "Next.js", "Golang", "Rust"]
    },
    {
      category: "Cloud & Data",
      items: ["PostgreSQL", "pgvector", "Azure", "AWS", "Docker", "Redis", "GitHub Actions"]
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-green-400">
      <main ref={pageRef} className="container mx-auto px-4 pt-24 pb-20 relative z-10">
        <div className="space-y-16">
          {/* Hero Section */}
          <section className="text-center">
            <h1
              data-animate="intro"
              className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-green-400 mb-6"
            >
              About Me
            </h1>
            <div className="max-w-3xl mx-auto">
              <p data-animate="intro" className="text-xl text-gray-700 dark:text-green-500/80 mb-4 leading-relaxed">
                ML engineer focused on production retrieval systems, AI agents, and predictive
                modelling. After shipping ML features at CompuCal in Cork, I&apos;m returning to MTU
                Cork to complete a Level 8 BSc (Hons) in Software Engineering.
              </p>
              <p data-animate="intro" className="text-base text-gray-600 dark:text-green-500/70 mb-6 leading-relaxed">
                My programming started in 2021 with Python scripts for crypto trading, which got
                me interested in blockchain and, later, robotics on the side. Those are past
                curiosities now, production ML is where the work actually is.
              </p>
              <div data-animate="intro" className="flex justify-center space-x-4">
                {[Brain, Terminal, Code].map((Icon, index) => (
                  <span key={index} className="motion-icon">
                    <Icon className="w-6 h-6 text-green-600 dark:text-green-500" />
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Journey Section */}
          <section data-animate="section">
            <h2 data-animate-item className="text-2xl font-semibold mb-6 text-gray-900 dark:text-green-400">
              My Journey
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {journeyCards.map((card) => (
                <article
                  key={card.title}
                  data-animate-item
                  className="motion-lift relative bg-green-50 dark:bg-green-500/10 p-6 rounded-lg border border-green-200 dark:border-green-500/20 hover:border-green-400 dark:hover:border-green-500/40 hover:shadow-lg hover:shadow-green-500/10 overflow-hidden group"
                >
                  <div className="relative z-10">
                    <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-green-400">{card.title}</h3>
                    <p className="text-gray-700 dark:text-green-500/80 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Skills Grid */}
          <section data-animate="section">
            <h2 data-animate-item className="text-2xl font-semibold mb-6 text-gray-900 dark:text-green-400">
              Technical Arsenal
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {skills.map((category) => (
                <article
                  key={category.category}
                  data-animate-item
                  className="motion-lift relative bg-green-50 dark:bg-green-500/5 p-4 rounded-lg border border-green-200 dark:border-green-500/20 hover:border-green-400 dark:hover:border-green-500/40 overflow-hidden group"
                >
                  <div className="relative z-10">
                    <h3 className="font-semibold mb-2 text-gray-900 dark:text-green-400">{category.category}</h3>
                    <ul className="text-gray-700 dark:text-green-500/80 text-sm">
                      {category.items.map((item) => (
                        <li key={item} className="motion-link mb-1 hover:text-green-500">
                          - {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Passion Areas */}
          <section data-animate="section">
            <h2 data-animate-item className="text-2xl font-semibold mb-6 text-gray-900 dark:text-green-400">
              Areas of Expertise
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {passionAreas.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  data-animate-item
                  className="motion-lift relative bg-green-50 dark:bg-green-500/5 border border-green-200 dark:border-green-500/30 p-6 rounded-lg hover:border-green-400 dark:hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10 overflow-hidden group"
                >
                  <div className="relative z-10">
                    <span className="motion-icon">
                      <Icon className="w-8 h-8 text-green-600 dark:text-green-500 mb-4 group-hover:text-green-500 dark:group-hover:text-green-400 transition-colors" />
                    </span>
                    <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-green-400">{title}</h3>
                    <p className="text-gray-700 dark:text-green-500/80 leading-relaxed">
                      {description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Call to Action */}
          <section data-animate="section" className="text-center">
            <p data-animate-item className="text-xl text-gray-700 dark:text-green-500/80 mb-6">
              Need an ML contractor for RAG, agents, or predictive modelling? Let&apos;s talk.
            </p>
            <div data-animate-item>
              <ActionButton href="/contact" variant="filled">
                Let&apos;s Connect
              </ActionButton>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
