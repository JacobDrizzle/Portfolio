"use client";

import { useRef } from "react";
import { ShieldCheck, Bot, Bug, LineChart, Terminal, Brain, Code } from "lucide-react";
import { ActionButton } from "@/components/ui/custom-components";
import { usePageMotion } from "@/lib/motion";

export default function About() {
  const pageRef = useRef<HTMLElement>(null);
  usePageMotion(pageRef);

  const passionAreas = [
    {
      icon: ShieldCheck,
      title: "AI Safety & Evaluation",
      description: "My final-year project is in AI agent safety. I'm interested in how to evaluate agents and how to keep tool-using agents within the scope they were given. More on the project once it's graded."
    },
    {
      icon: Bot,
      title: "AI Agents with Scoped Tool Access",
      description: "MCP servers that give agents real read/write access to SQL databases, internal APIs and documentation, plus multi-agent orchestration with CrewAI. The hard part is the tools, permissions and evaluation; the prompts are the easy bit."
    },
    {
      icon: Bug,
      title: "Software Security",
      description: "Memory-safety exploits and their defences from my Security for Software Systems module: stack overflows, format-string bugs, heap attacks, ret2libc and ROP, and the mitigations that stop them. Hands-on in C, x86 assembly and GDB on 32-bit Linux."
    },
    {
      icon: LineChart,
      title: "Production ML",
      description: "RAG with pgvector and LangChain, CatBoost/XGBoost/LightGBM predictive models benchmarked against real baselines, OCR extraction from scanned PDFs, and the 7,552-parameter TCN that took joint gold at the 9th ABC Challenge."
    }
  ];

  const journeyCards = [
    {
      title: "Education",
      description: "Final year of a BSc (Hons) in Software Development at MTU Cork, with a final-year project in AI agent safety. QQI Level 6 Advanced Software Development with distinction prior. Joint Gold at the 9th ABC Challenge with MTU team Motion Pending."
    },
    {
      title: "Previous Experience",
      description: "Previously shipped ML features at CompuCal in Cork, a regulated calibration-management platform. Built production RAG, OCR pipelines, predictive maintenance models, and MCP servers that gave internal agents real database access."
    },
    {
      title: "Focus",
      description: "AI safety, machine learning, software engineering and security. Looking for full-time roles where I can build ML systems, test how they behave, and own a feature from research spike to deployed endpoint."
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
    },
    {
      category: "Security",
      items: ["GDB", "C", "x86 assembly", "Memory-safety exploits", "ASLR / NX / canaries", "Linux"]
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
                AI safety and ML engineer in the final year of a BSc (Hons) in Software
                Development at MTU Cork, with a final-year project in AI agent safety. Before
                that I shipped ML features at CompuCal in Cork.
              </p>
              <p data-animate="intro" className="text-base text-gray-600 dark:text-green-500/70 mb-6 leading-relaxed">
                My programming started in 2021 with Python scripts for crypto trading, which got
                me interested in blockchain and, later, robotics on the side. Those are past
                curiosities now. These days I work on AI safety, machine learning and software
                security.
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
              Hiring for AI safety, ML or security roles? Let&apos;s talk.
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
