"use client";

import { motion } from 'framer-motion';
import { Code, Github, Brain, Cpu, Terminal } from 'lucide-react';
import Link from 'next/link';

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

 // Previous imports and code remain the same...

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
            <div className="max-w-3xl mx-auto">
              <p className="text-xl text-green-700/80 dark:text-green-500/80 mb-4">
                Aspiring Software Engineer with a passion for AI, Blockchain, and Robotics. 
                Building innovative solutions at the intersection of cutting-edge technologies.
              </p>
              <div className="flex justify-center space-x-4">
                <Brain className="w-6 h-6 text-green-500" />
                <Terminal className="w-6 h-6 text-green-500" />
                <Code className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </motion.div>

          {/* Journey Section */}
          <motion.div variants={itemVariants}>
            <h2 className="text-2xl font-semibold mb-6">My Journey</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {journeyCards.map((card) => (
                <div key={card.title} className="bg-green-500/10 p-6 rounded-lg border border-green-500/20">
                  <h3 className="text-xl font-semibold mb-2">{card.title}</h3>
                  <p className="text-green-700/80 dark:text-green-500/80">
                    {card.description}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Skills Grid */}
          <motion.div variants={itemVariants}>
            <h2 className="text-2xl font-semibold mb-6">Technical Arsenal</h2>
            <div className="grid md:grid-cols-4 gap-4">
              {skills.map((category) => (
                <div key={category.category} className="bg-green-500/5 p-4 rounded-lg border border-green-500/20">
                  <h3 className="font-semibold mb-2">{category.category}</h3>
                  <ul className="text-green-700/80 dark:text-green-500/80 text-sm">
                    {category.items.map((item) => (
                      <li key={item} className="mb-1">• {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Passion Areas */}
          <motion.div variants={itemVariants}>
            <h2 className="text-2xl font-semibold mb-6">Areas of Expertise</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {passionAreas.map(({ icon: Icon, title, description }) => (
                <div key={title} className="bg-green-500/5 border border-green-500/30 p-6 rounded-lg">
                  <Icon className="w-8 h-8 text-green-500 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{title}</h3>
                  <p className="text-green-700/80 dark:text-green-500/80">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Call to Action */}
          <motion.div variants={itemVariants} className="text-center">
            <p className="text-xl text-green-700/80 dark:text-green-500/80 mb-6">
              Looking to collaborate on innovative projects in AI, Blockchain, or Robotics?
            </p>
            <Link href="/contact">
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="bg-green-500/20 px-8 py-3 rounded-md border border-green-500 hover:bg-green-500/30 transition-colors font-mono"
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