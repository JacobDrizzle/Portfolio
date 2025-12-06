"use client";

import { motion } from 'framer-motion';
import { Code, Github, Brain, Cpu, Terminal } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function About() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Smooth stagger for on-load animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  // Smooth entrance animations (slower load)
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 12
      }
    }
  };

  const passionAreas = [
    {
      icon: Brain,
      title: "Artificial Intelligence",
      description: "Diving deep into AI technology and its real-world applications. From writing Python scripts for data analysis to exploring neural networks and machine learning models. Currently focusing on integrating AI solutions into practical applications and studying advanced AI concepts."
    },
    {
      icon: Code,
      title: "Blockchain Development",
      description: "My tech journey began with cryptocurrency trading automation, which sparked my passion for blockchain. Experienced in developing smart contracts and DeFi applications. Particularly interested in creating decentralized systems that can make a real impact on financial accessibility."
    },
    {
      icon: Cpu,
      title: "Robotics",
      description: "Combining my love for software with hardware integration. Experienced in working with various microcontrollers and sensors. Currently exploring ROS (Robot Operating System) and developing autonomous systems that can interact with their environment intelligently."
    },
    {
      icon: Github,
      title: "Software Engineering",
      description: "Currently pursuing a Bachelor's in Software Engineering, building a strong foundation in computer science principles. Proficient in multiple programming paradigms and languages. Passionate about clean code, software architecture, and developing scalable solutions."
    }
  ];

  const journeyCards = [
    {
      title: "Educational Journey",
      description: "Started with self-learning programming through online resources. Completed QQI Level 6 in Advanced Software Development with distinction. Currently excelling in the second year of my Bachelor's degree in Software Engineering, focusing on advanced algorithms and system design."
    },
    {
      title: "Technical Expertise",
      description: "Full-stack development with modern technologies. Proficient in JavaScript/TypeScript ecosystem for web development, Python for AI/ML, Rust for systems programming, C++ for robotics, and Golang for backend services. Experienced with SQL databases, RESTful APIs, and cloud platforms."
    },
    {
      title: "Professional Goals",
      description: "Actively seeking opportunities in blockchain, AI, or robotics sectors. Started my journey with crypto trading automation and expanded into full-stack development. Looking to contribute to innovative projects that push the boundaries of technology."
    }
  ];

  const skills = [
    {
      category: "Languages",
      items: ["JavaScript", "TypeScript", "Python", "Java", "C++", "Rust", "C", "Golang"]
    },
    {
      category: "Web Technologies",
      items: ["React", "Next.js", "Node.js", "GraphQL", "REST APIs", "Tailwind CSS", "Vue.js", "Express.js"]
    },
    {
      category: "AI & Data",
      items: ["TensorFlow", "PyTorch", "Scikit-learn", "Pandas", "SQL", "MongoDB", "Redis", "PostgreSQL"]
    },
    {
      category: "Tools & Platforms",
      items: ["Git", "Docker", "Linux", "AWS", "Kubernetes", "CI/CD", "Jenkins", "GitHub Actions"]
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
            <h1 className="text-4xl font-bold text-gray-900 dark:text-green-400 mb-6">
              About Me
            </h1>
            <div className="max-w-3xl mx-auto">
              <p className="text-xl text-gray-600 dark:text-green-500/80 mb-4 leading-relaxed">
                Aspiring Software Engineer with a passion for AI, Blockchain, and Robotics.
                Building innovative solutions at the intersection of cutting-edge technologies.
              </p>
              <div className="flex justify-center space-x-4">
                {[Brain, Terminal, Code].map((Icon, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.5 }}
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
                  className="relative bg-green-50 dark:bg-green-500/10 p-6 rounded-lg border border-green-200 dark:border-green-500/20 transition-all overflow-hidden group"
                  onMouseEnter={() => setHoveredCard(`journey-${index}`)}
                  onMouseLeave={() => setHoveredCard(null)}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                    transition: { type: "spring", stiffness: 100, damping: 12, delay: index * 0.1 }
                  }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 700, damping: 30 }}
                  animate={{
                    scale: hoveredCard === `journey-${index}` ? 1.02 : 1,
                    y: hoveredCard === `journey-${index}` ? -4 : 0,
                  }}
                >
                  <div className="relative z-10">
                    <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-green-400">{card.title}</h3>
                    <p className="text-gray-600 dark:text-green-500/80 leading-relaxed">
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
            <div className="grid md:grid-cols-4 gap-4">
              {skills.map((category, categoryIndex) => (
                <motion.div
                  key={category.category}
                  className="relative bg-green-50 dark:bg-green-500/5 p-4 rounded-lg border border-green-200 dark:border-green-500/20 transition-all overflow-hidden group"
                  onMouseEnter={() => setHoveredCard(`skill-${categoryIndex}`)}
                  onMouseLeave={() => setHoveredCard(null)}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{
                    opacity: 1,
                    scale: 1,
                    transition: { type: "spring", stiffness: 100, damping: 12, delay: categoryIndex * 0.1 }
                  }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 700, damping: 30 }}
                  animate={{
                    scale: hoveredCard === `skill-${categoryIndex}` ? 1.02 : 1,
                    y: hoveredCard === `skill-${categoryIndex}` ? -4 : 0,
                  }}
                >
                  <div className="relative z-10">
                    <h3 className="font-semibold mb-2 text-gray-900 dark:text-green-400">{category.category}</h3>
                    <ul className="text-gray-600 dark:text-green-500/80 text-sm">
                      {category.items.map((item, itemIndex) => (
                        <motion.li
                          key={item}
                          className="mb-1"
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ type: "spring" as const, stiffness: 100, damping: 12, delay: categoryIndex * 0.08 + itemIndex * 0.03 }}
                          whileHover={{ x: 4, color: "#22c55e" }}
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
                  className="relative bg-green-50 dark:bg-green-500/5 border border-green-200 dark:border-green-500/30 p-6 rounded-lg transition-all overflow-hidden group"
                  onMouseEnter={() => setHoveredCard(`passion-${index}`)}
                  onMouseLeave={() => setHoveredCard(null)}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                    transition: { type: "spring", stiffness: 100, damping: 12, delay: index * 0.1 }
                  }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 700, damping: 30 }}
                  animate={{
                    scale: hoveredCard === `passion-${index}` ? 1.02 : 1,
                    y: hoveredCard === `passion-${index}` ? -4 : 0,
                  }}
                >
                  <div className="relative z-10">
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                      className="inline-block"
                    >
                      <Icon className="w-8 h-8 text-green-600 dark:text-green-500 mb-4 group-hover:text-green-500 dark:group-hover:text-green-400 transition-colors" />
                    </motion.div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-green-400">{title}</h3>
                    <p className="text-gray-600 dark:text-green-500/80 leading-relaxed">
                      {description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Call to Action */}
          <motion.div variants={itemVariants} className="text-center">
            <p className="text-xl text-gray-600 dark:text-green-500/80 mb-6">
              Looking to collaborate on innovative projects in AI, Blockchain, or Robotics?
            </p>
            <Link href="/contact">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring" as const, stiffness: 700, damping: 20 }}
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