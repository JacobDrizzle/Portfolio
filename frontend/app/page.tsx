"use client";

import { motion } from "framer-motion";
import { Github, Code, Brain, Cpu } from "lucide-react";
import { ActionButton, FeatureCard, JourneyCard } from "@/components/ui/custom-components";

// Enhanced animation variants with smoother easing
const animations = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  },
  item: {
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
  },
  fadeInUp: {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1] as const
      }
    }
  }
};

export default function Home() {
  const passionAreas = [
    {
      icon: Brain,
      title: "Artificial Intelligence",
      description: "Passionate about AI technology and its applications. Started my journey with Python scripts and now exploring advanced AI integration possibilities."
    },
    {
      icon: Code,
      title: "Blockchain Development",
      description: "Began programming with cryptocurrency trading automation. Experienced in smart contracts and blockchain technologies with a focus on decentralized systems."
    },
    {
      icon: Cpu,
      title: "Robotics",
      description: "Enthusiastic about robotics and automation. Combining software engineering knowledge with hardware integration for innovative solutions."
    },
    {
      icon: Github,
      title: "Software Engineering",
      description: "Pursuing a Bachelor's in Software Engineering. Experienced in multiple programming languages including JavaScript, TypeScript, Python, Java, C++, Rust, C, and Golang."
    }
  ];

  const journeyCards = [
    {
      title: "Education",
      description: "QQI Level 6 in Advanced Software Development. Currently in second year of Bachelor's degree in Software Engineering."
    },
    {
      title: "Technical Skills",
      description: "Proficient in JavaScript, TypeScript, Python, Java, C++, Rust, C, Golang, SQL. Experience in both front-end and back-end development."
    },
    {
      title: "Career Focus",
      description: "Seeking opportunities in blockchain, AI, or robotics. Started with crypto trading automation and expanded into full-stack development."
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
              <h1 className="lg:text-5xl text-2xl font-bold text-gray-900 dark:text-green-400 mb-6">
                Hi, I&apos;m{" "}
                <motion.span
                  className="text-green-600 dark:text-green-500 inline-block"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {"{Jacob Dorrill}"}
                </motion.span>
              </h1>
              <motion.div
                className="border-l-4 border-green-500 pl-4 mb-8"
                whileHover={{ borderLeftWidth: "6px", paddingLeft: "18px" }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-xl text-gray-700 dark:text-green-300">
                  Software Engineering Student | Full-Stack Developer
                </p>
                <p className="text-lg text-gray-500 dark:text-green-500/80 mt-2">
                  From crypto trading scripts to full-stack applications
                </p>
              </motion.div>
            </motion.div>

            {/* Call to Action */}
            <motion.div
              variants={animations.item}
              className="flex space-x-4 pt-6"
            >
              <ActionButton href="/projects" variant="filled">
                View Projects
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
            <p className="text-gray-600 dark:text-green-500/80 mb-6 leading-relaxed">
              My programming journey began in early 2021 with Python scripts for cryptocurrency trading.
              Over the past 4 years, I&apos;ve expanded my expertise across multiple programming languages
              and technologies. Currently pursuing a Bachelor&apos;s in Software Engineering, I combine
              academic knowledge with practical project experience, focusing on emerging technologies
              in blockchain, AI, and robotics.
            </p>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              {journeyCards.map((card, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
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