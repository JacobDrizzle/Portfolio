"use client";

import { motion } from "framer-motion";
import { Github, Rocket, Brain, Code } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-green-400">

      <main className="container mx-auto px-4 pt-20 pb-20 relative z-10">
        {/* Hero Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-12"
        >
          {/* Terminal Introduction */}
          <div className="flex flex-col lg:flex-row justify-between">
            <motion.div variants={itemVariants}>
              <div className="font-mono text-green-500 dark:text-green-300 lg:text-lg md:text-md mb-4">
                ~/portfolio/guest@terminal:$
              </div>
              <h1 className="lg:text-5xl text-2xl font-bold text-green-600 dark:text-green-400 mb-6">
                Hi, I&apos;m{" "}
                <span className="text-green-700 dark:text-green-500">
                  {"{Jacob Dorrill}"}
                </span>
              </h1>
              <div className="border-l-4 border-green-500 pl-4 mb-8">
                <p className="text-xl text-green-600 dark:text-green-300">
                  Aspiring Software Engineer | Open Source Enthusiast
                </p>
                <p className="text-lg text-green-700/80 dark:text-green-500/80 mt-2">
                  Building the future through code, one commit at a time
                </p>
              </div>
            </motion.div>
            {/* Call to Action */}
            <motion.div variants={itemVariants} className="flex space-x-4 pt-6">
              <Link href="/projects">
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="bg-green-500/20 h-fit px-6 py-3 rounded-md border border-green-500 hover:bg-green-500/30 transition-colors font-mono"
                >
                View Projects
              </motion.button>
                </Link>
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="border border-green-500 h-fit px-6 py-3 rounded-md hover:bg-green-500/10 transition-colors font-mono"
              >
                Download CV
              </motion.button>
            </motion.div>
          </div>

          {/* Passion Areas */}
          <motion.div
            variants={itemVariants}
            className="grid md:grid-cols-2 gap-6"
          >
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <Github className="w-6 h-6 mt-1 text-green-500" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    Open Source Advocacy
                  </h3>
                  <p className="text-green-700/80 dark:text-green-500/80">
                    Active contributor to open-source projects. Believing in the
                    power of community-driven development and knowledge sharing.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Brain className="w-6 h-6 mt-1 text-green-500" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    AI & Machine Learning
                  </h3>
                  <p className="text-green-700/80 dark:text-green-500/80">
                    Exploring the intersection of AI and software development.
                    Passionate about making AI accessible and ethical.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <Code className="w-6 h-6 mt-1 text-green-500" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    Blockchain Technology
                  </h3>
                  <p className="text-green-700/80 dark:text-green-500/80">
                    Fascinated by decentralized systems and smart contracts.
                    Building for Web3 and exploring blockchain applications.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Rocket className="w-6 h-6 mt-1 text-green-500" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    Space Technology
                  </h3>
                  <p className="text-green-700/80 dark:text-green-500/80">
                    Inspired by space exploration and its technological
                    challenges. Dreaming of contributing to space-tech software
                    solutions.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Journey Section */}
          <motion.div
            variants={itemVariants}
            className="border-t border-green-500/30 pt-8"
          >
            <h2 className="text-2xl font-semibold mb-4">My Journey</h2>
            <p className="text-green-700/80 dark:text-green-500/80 mb-6">
              With 4 years of programming experience, I&apos;ve built a strong
              foundation in modern web technologies. While Im seeking my first
              professional role, I&apos;ve dedicated myself to continuous learning
              and building practical projects that solve real-world problems.
            </p>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
                <h4 className="font-semibold mb-2">Technical Skills</h4>
                <p className="text-green-700/80 dark:text-green-500/80">
                  JavaScript/TypeScript, React, Node.js, Python, C++, Rust, Async Programming, Embedded Systems,
                  Smart Contracts
                </p>
              </div>
              <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
                <h4 className="font-semibold mb-2">Current Focus</h4>
                <p className="text-green-700/80 dark:text-green-500/80">
                  Building a custom blockchain with the goal of funding opensource
                  projects
                </p>
              </div>
              <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
                <h4 className="font-semibold mb-2">Learning Goals</h4>
                <p className="text-green-700/80 dark:text-green-500/80">
                  Advanced AI integration, Blockchain development, Cloud
                  architecture
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
