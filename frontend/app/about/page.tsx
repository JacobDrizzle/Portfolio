"use client";

import { motion } from 'framer-motion';
import { Code, Github, Brain, Rocket, Heart, Terminal, Coffee, Laptop } from 'lucide-react';

export default function About() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const skills = [
    { name: "Frontend", items: ["React", "TypeScript", "Next.js", "Tailwind CSS"] },
    { name: "Backend", items: ["Node.js", "Python", "RESTful APIs", "GraphQL"] },
    { name: "Tools", items: ["Git", "Docker", "VS Codium", "Linux", "Anchor"] },
    { name: "Blockchain", items: ["Solidity", "Web3.js", "Smart Contracts", "DeFi", "Rust"] },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-green-400">
      <main className="container mx-auto px-4 pt-24 pb-20 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-16"
        >
          {/* Hero Section */}
          <motion.div variants={itemVariants} className="text-center">
            <h1 className="text-4xl font-bold text-green-600 dark:text-green-400 mb-6">
              About Me
            </h1>
            <div className="max-w-2xl mx-auto">
              <p className="text-xl text-green-700/80 dark:text-green-500/80 mb-4">
                Passionate developer on a journey to create innovative solutions through code
              </p>
              <div className="flex justify-center space-x-4">
                <Coffee className="w-6 h-6 text-green-500" />
                <Terminal className="w-6 h-6 text-green-500" />
                <Heart className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </motion.div>

          {/* Journey Section */}
          <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <Laptop className="w-6 h-6 text-green-500" />
                My Journey
              </h2>
              <div className="space-y-4 text-green-700/80 dark:text-green-500/80">
                <p>
                  My programming journey began 4 years ago with a simple curiosity about how websites work. 
                  That curiosity quickly evolved into a passion for creating elegant solutions to complex problems.
                </p>
                <p>
                  While I&apos;m yet to land my first professional role, I&apos;ve dedicated myself to continuous learning 
                  and building practical projects that solve real-world problems. Through self-study and hands-on 
                  experience, I&apos;ve developed a strong foundation in modern programming practices
                </p>
                <p>
                  I&apos;m particularly fascinated by the intersection of blockchain, AI, and space technology, 
                  believing these fields will shape our future in profound ways.
                </p>
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <Code className="w-6 h-6 text-green-500" />
                Technical Skills
              </h2>
              <div className="grid lg:grid-cols-2 md:grid-cols-1 gap-4">
                {skills.map((category) => (
                  <div key={category.name} className="bg-green-500/10 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">{category.name}</h3>
                    <ul className="text-green-700/80 dark:text-green-500/80">
                      {category.items.map((item) => (
                        <li key={item} className="mb-1">• {item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Interests Section */}
          <motion.div variants={itemVariants}>
            <h2 className="text-2xl font-semibold mb-6">What Drives Me</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-green-500/5 border border-green-500/30 p-6 rounded-lg">
                <Github className="w-8 h-8 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Open Source</h3>
                <p className="text-green-700/80 dark:text-green-500/80">
                  Contributing to open source projects and learning from the global developer community.
                </p>
              </div>
              
              <div className="bg-green-500/5 border border-green-500/30 p-6 rounded-lg">
                <Brain className="w-8 h-8 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">AI & Innovation</h3>
                <p className="text-green-700/80 dark:text-green-500/80">
                  Exploring the potential of AI to solve complex problems and create intelligent solutions.
                </p>
              </div>
              
              <div className="bg-green-500/5 border border-green-500/30 p-6 rounded-lg">
                <Rocket className="w-8 h-8 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Space Tech</h3>
                <p className="text-green-700/80 dark:text-green-500/80">
                  Fascinated by space exploration and the technology that makes it possible.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Call to Action */}
          <motion.div variants={itemVariants} className="text-center">
            <p className="text-xl text-green-700/80 dark:text-green-500/80 mb-6">
              Interested in collaborating or just want to connect?
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="bg-green-500/20 px-8 py-3 rounded-md border border-green-500 hover:bg-green-500/30 transition-colors font-mono"
            >
              Get in Touch
            </motion.button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}