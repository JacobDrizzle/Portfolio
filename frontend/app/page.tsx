"use client";

import { motion } from "framer-motion";
import { Github, Code, Brain, Cpu, LucideIcon } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

// Animation variants
const animations = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  },
  item: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }
};

// Reusable components
const FeatureCard = ({ icon: Icon, title, description }: FeatureCardProps) => (
  <div className="flex items-start space-x-4">
    <Icon className="w-6 h-6 mt-1 text-green-500" />
    <div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-green-700/80 dark:text-green-500/80">{description}</p>
    </div>
  </div>
);

interface JourneyCardProps {
  title: string;
  description: string;
}

const JourneyCard = ({ title, description }: JourneyCardProps) => (
  <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
    <h4 className="font-semibold mb-2">{title}</h4>
    <p className="text-green-700/80 dark:text-green-500/80">{description}</p>
  </div>
);

interface ActionButtonProps {
  href?: string;
  variant?: 'filled' | 'outlined';
  children: ReactNode;
}

const ActionButton = ({ href, variant = "outlined", children }: ActionButtonProps) => {
  const baseStyles = "h-fit px-6 py-3 rounded-md transition-colors font-mono";
  const variants = {
    filled: "bg-green-500/20 border border-green-500 hover:bg-green-500/30",
    outlined: "border border-green-500 hover:bg-green-500/10"
  } as const;

  const Button = (
    <motion.button
      whileHover={{ scale: 1.05 }}
      className={`${baseStyles} ${variants[variant]}`}
    >
      {children}
    </motion.button>
  );

  return href ? <Link href={href}>{Button}</Link> : Button;
};

export { FeatureCard, JourneyCard, ActionButton };

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
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-green-400">
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
              <div className="font-mono text-green-500 dark:text-green-300 lg:text-lg md:text-md mb-4">
                ~/portfolio/guest@terminal:$
              </div>
              <h1 className="lg:text-5xl text-2xl font-bold text-green-600 dark:text-green-400 mb-6">
                Hi, I&apos;m{" "}
                <span className="text-green-700 dark:text-green-500">
                  {"DrDrizzles"}
                </span>
              </h1>
              <div className="border-l-4 border-green-500 pl-4 mb-8">
                <p className="text-xl text-green-600 dark:text-green-300">
                  Software Engineering Student | Full-Stack Developer
                </p>
                <p className="text-lg text-green-700/80 dark:text-green-500/80 mt-2">
                  From crypto trading scripts to full-stack applications
                </p>
              </div>
            </motion.div>

            {/* Call to Action */}
            <motion.div variants={animations.item} className="flex space-x-4 pt-6">
              <ActionButton href="/projects" variant="filled">
                View Projects
              </ActionButton>
              <ActionButton href="/cv">
                Download CV
              </ActionButton>
            </motion.div>
          </div>

          {/* Passion Areas */}
          <motion.div
            variants={animations.item}
            className="grid md:grid-cols-2 gap-6"
          >
            <div className="space-y-6">
              {passionAreas.slice(0, 2).map((area, index) => (
                <FeatureCard key={index} {...area} />
              ))}
            </div>
            <div className="space-y-6">
              {passionAreas.slice(2).map((area, index) => (
                <FeatureCard key={index + 2} {...area} />
              ))}
            </div>
          </motion.div>

          {/* Journey Section */}
          <motion.div
            variants={animations.item}
            className="border-t border-green-500/30 pt-8"
          >
            <h2 className="text-2xl font-semibold mb-4">My Journey</h2>
            <p className="text-green-700/80 dark:text-green-500/80 mb-6">
              My programming journey began in early 2021 with Python scripts for cryptocurrency trading. 
              Over the past 4 years, I've expanded my expertise across multiple programming languages 
              and technologies. Currently pursuing a Bachelor's in Software Engineering, I combine 
              academic knowledge with practical project experience, focusing on emerging technologies 
              in blockchain, AI, and robotics.
            </p>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              {journeyCards.map((card, index) => (
                <JourneyCard key={index} {...card} />
              ))}
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}