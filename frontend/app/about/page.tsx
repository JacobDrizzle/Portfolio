"use client";

import { motion } from 'framer-motion';
import { Database, Bot, LineChart, ScanText, Terminal, Brain, Code } from 'lucide-react';
import Link from 'next/link';

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const EASE_IN_OUT = [0.4, 0, 0.2, 1] as const;

export default function About() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: EASE_OUT
      }
    }
  };

  const passionAreas = [
    {
      icon: Database,
      title: "RAG & Retrieval",
      description: "Embeddings, hybrid search, confidence scoring, and citation surfacing. pgvector in Postgres for most cases, LangChain for orchestration, FastAPI for serving. I care more about evaluation harnesses and retrieval quality than the latest framework."
    },
    {
      icon: Bot,
      title: "AI Agents with Tool Access",
      description: "Multi-agent orchestration via CrewAI. MCP servers that give agents real read/write access to SQL databases, internal APIs, and documentation. The hard part is the tools and evaluation — the prompts are the easy bit."
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
      description: "BSc Software Development, MTU Cork — completed. QQI Level 6 Advanced Software Development with distinction prior. Focused throughout on systems, algorithms, and applied ML."
    },
    {
      title: "Current Role",
      description: "Shipping ML features at CompuCal in Cork — a regulated calibration-management platform. Production RAG, OCR pipelines, predictive maintenance models, and MCP servers that give internal agents real database access."
    },
    {
      title: "Focus",
      description: "Focused on production ML — retrieval systems, AI agents, and predictive modelling for tabular and document-heavy problems. Comfortable owning a feature from research spike to deployed endpoint."
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
      <main className="container mx-auto px-4 pt-24 pb-20 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-16"
        >
          {/* Hero Section */}
          <motion.div variants={itemVariants} className="text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-green-400 mb-6">
              About Me
            </h1>
            <div className="max-w-3xl mx-auto">
              <p className="text-xl text-gray-700 dark:text-green-500/80 mb-4 leading-relaxed">
                ML engineer focused on production retrieval systems, AI agents, and predictive
                modelling. Currently shipping ML features at CompuCal in Cork — BSc from MTU
                Cork just wrapped.
              </p>
              <p className="text-base text-gray-600 dark:text-green-500/70 mb-6 leading-relaxed">
                My programming started in 2021 with Python scripts for crypto trading, which got
                me interested in blockchain and, later, robotics on the side. Those are past
                curiosities now — production ML is where the work actually is.
              </p>
              <div className="flex justify-center space-x-4">
                {[Brain, Terminal, Code].map((Icon, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ y: -1, scale: 1.05 }}
                    transition={{ duration: 0.15, ease: EASE_IN_OUT }}
                  >
                    <Icon className="w-6 h-6 text-green-600 dark:text-green-500" />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Journey Section */}
          <motion.div variants={itemVariants}>
            <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-green-400">My Journey</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {journeyCards.map((card, index) => (
                <motion.div
                  key={card.title}
                  className="relative bg-green-50 dark:bg-green-500/10 p-6 rounded-lg border border-green-200 dark:border-green-500/20 hover:border-green-400 dark:hover:border-green-500/40 hover:shadow-lg hover:shadow-green-500/10 transition-all overflow-hidden group"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.55, ease: EASE_OUT, delay: index * 0.08 }
                  }}
                  viewport={{ once: true, margin: "-50px" }}
                  whileHover={{ y: -3, scale: 1.01 }}
                  transition={{ duration: 0.25, ease: EASE_IN_OUT }}
                >
                  <div className="relative z-10">
                    <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-green-400">{card.title}</h3>
                    <p className="text-gray-700 dark:text-green-500/80 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Skills Grid */}
          <motion.div variants={itemVariants}>
            <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-green-400">Technical Arsenal</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {skills.map((category, categoryIndex) => (
                <motion.div
                  key={category.category}
                  className="relative bg-green-50 dark:bg-green-500/5 p-4 rounded-lg border border-green-200 dark:border-green-500/20 hover:border-green-400 dark:hover:border-green-500/40 transition-all overflow-hidden group"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.35, ease: EASE_OUT, delay: categoryIndex * 0.05 }
                  }}
                  viewport={{ once: true }}
                  whileHover={{ y: -3, scale: 1.01 }}
                  transition={{ duration: 0.25, ease: EASE_IN_OUT }}
                >
                  <div className="relative z-10">
                    <h3 className="font-semibold mb-2 text-gray-900 dark:text-green-400">{category.category}</h3>
                    <ul className="text-gray-700 dark:text-green-500/80 text-sm">
                      {category.items.map((item, itemIndex) => (
                        <motion.li
                          key={item}
                          className="mb-1"
                          initial={{ opacity: 0, x: -6 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.3, ease: EASE_OUT, delay: categoryIndex * 0.05 + itemIndex * 0.02 }}
                          whileHover={{ x: 3, color: "#22c55e" }}
                        >
                          • {item}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Passion Areas */}
          <motion.div variants={itemVariants}>
            <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-green-400">Areas of Expertise</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {passionAreas.map(({ icon: Icon, title, description }, index) => (
                <motion.div
                  key={title}
                  className="relative bg-green-50 dark:bg-green-500/5 border border-green-200 dark:border-green-500/30 p-6 rounded-lg hover:border-green-400 dark:hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10 transition-all overflow-hidden group"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.4, ease: EASE_OUT, delay: index * 0.06 }
                  }}
                  viewport={{ once: true }}
                  whileHover={{ y: -3, scale: 1.01 }}
                  transition={{ duration: 0.25, ease: EASE_IN_OUT }}
                >
                  <div className="relative z-10">
                    <motion.div
                      whileHover={{ y: -1, scale: 1.05 }}
                      transition={{ duration: 0.15, ease: EASE_IN_OUT }}
                      className="inline-block"
                    >
                      <Icon className="w-8 h-8 text-green-600 dark:text-green-500 mb-4 group-hover:text-green-500 dark:group-hover:text-green-400 transition-colors" />
                    </motion.div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-green-400">{title}</h3>
                    <p className="text-gray-700 dark:text-green-500/80 leading-relaxed">
                      {description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Call to Action */}
          <motion.div variants={itemVariants} className="text-center">
            <p className="text-xl text-gray-700 dark:text-green-500/80 mb-6">
              Need an ML contractor for RAG, agents, or predictive modelling? Let&apos;s talk.
            </p>
            <Link href="/contact">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15, ease: EASE_IN_OUT }}
                className="bg-green-600 dark:bg-green-500/20 px-8 py-3 rounded-md border border-green-600 dark:border-green-500 text-white dark:text-green-400 hover:bg-green-700 dark:hover:bg-green-500/30 transition-colors font-mono"
              >
                Let&apos;s Connect
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
