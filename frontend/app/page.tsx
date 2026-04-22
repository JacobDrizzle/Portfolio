"use client";

import { motion } from "framer-motion";
import { Database, Bot, LineChart, ScanText } from "lucide-react";
import { ActionButton, FeatureCard, JourneyCard } from "@/components/ui/custom-components";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const animations = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05
      }
    }
  },
  item: {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: EASE_OUT
      }
    }
  },
  fadeInUp: {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: EASE_OUT
      }
    }
  }
};

export default function Home() {
  const passionAreas = [
    {
      icon: Database,
      title: "RAG Pipelines",
      description: "Embeddings, retrieval with confidence scoring, and citation surfacing. pgvector, LangChain, FastAPI — served as a REST API or embedded widget."
    },
    {
      icon: Bot,
      title: "AI Agents with Tool Access",
      description: "Multi-agent orchestration via CrewAI. MCP servers connecting agents to SQL databases, internal APIs, and documentation repos — not toy prompt chains."
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
      description: "BSc Software Development, MTU Cork (completed). QQI Level 6 Advanced Software Development with distinction prior."
    },
    {
      title: "Current Role",
      description: "Shipping ML features at CompuCal (Cork, Ireland) — RAG, OCR, predictive maintenance, and MCP-backed agents for a regulated calibration-management platform."
    },
    {
      title: "Focus",
      description: "Production ML for small teams: retrieval systems, AI agents, and predictive modelling for tabular and document-heavy problems."
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-green-400">
      <main className="container mx-auto px-4 pt-20 pb-20 relative z-10">
        <motion.div
          variants={animations.container}
          initial="hidden"
          animate="visible"
          className="space-y-12"
        >
          {/* Hero Section */}
          <div className="flex flex-col lg:flex-row justify-between">
            <motion.div variants={animations.item}>
              <motion.div
                className="font-mono text-green-600 dark:text-green-300 lg:text-lg md:text-md mb-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                ~/portfolio/guest@terminal:$
                <motion.span
                  className="inline-block w-2 h-5 bg-green-500 ml-1"
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
                />
              </motion.div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-green-400 mb-6">
                <motion.span
                  className="text-green-600 dark:text-green-500 inline-block"
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.4, ease: EASE_OUT }}
                >
                  {"{Jacob Dorrill}"}
                </motion.span>
              </h1>
              <motion.div
                className="border-l-2 border-green-500 pl-4 mb-8"
                whileHover={{ x: 4 }}
                transition={{ duration: 0.4, ease: EASE_OUT }}
              >
                <p className="text-xl text-gray-700 dark:text-green-300">
                  ML Engineer — RAG Systems, AI Agents, and Predictive Models
                </p>
                <p className="text-lg text-gray-700 dark:text-green-500/80 mt-2 leading-relaxed max-w-2xl">
                  I build production ML systems — RAG pipelines with pgvector, AI agents wired to
                  real databases via MCP, gradient-boosting predictive models, and OCR extraction
                  pipelines. Currently shipping ML features at CompuCal (Cork, Ireland) for a
                  regulated calibration-management platform.
                </p>
              </motion.div>
            </motion.div>

            {/* Call to Action */}
            <motion.div
              variants={animations.item}
              className="flex space-x-4 pt-6"
            >
              <ActionButton href="/ml" variant="filled">
                See ML Work
              </ActionButton>
              <ActionButton
                href="/Jacob_Dorrill_CV.pdf"
              >
                Download CV
              </ActionButton>
            </motion.div>
          </div>

          {/* Passion Areas */}
          <motion.div
            variants={animations.item}
            className="grid md:grid-cols-2 gap-6"
          >
            <motion.div
              className="space-y-6"
              variants={animations.container}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              {passionAreas.slice(0, 2).map((area, index) => (
                <motion.div key={index} variants={animations.item}>
                  <FeatureCard {...area} />
                </motion.div>
              ))}
            </motion.div>
            <motion.div
              className="space-y-6"
              variants={animations.container}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              {passionAreas.slice(2).map((area, index) => (
                <motion.div key={index + 2} variants={animations.item}>
                  <FeatureCard {...area} />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Journey Section */}
          <motion.div
            variants={animations.fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="border-t border-green-300 dark:border-green-500/30 pt-8"
          >
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-green-400">My Journey</h2>
            <p className="text-gray-700 dark:text-green-500/80 mb-6 leading-relaxed">
              I started with Python scripts in early 2021 — automating crypto trades was the
              excuse to learn the language. Five years on, the work has settled: production ML
              for small teams. RAG systems, AI agents with real tool access, and predictive
              models for tabular and document-heavy problems. Currently shipping ML features at
              CompuCal, BSc at MTU Cork just wrapped.
            </p>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              {journeyCards.map((card, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: index * 0.08, duration: 0.55, ease: EASE_OUT }}
                >
                  <JourneyCard {...card} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}