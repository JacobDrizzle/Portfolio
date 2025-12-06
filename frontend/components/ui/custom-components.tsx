"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface JourneyCardProps {
  title: string;
  description: string;
}

interface ActionButtonProps {
  href?: string;
  variant?: 'filled' | 'outlined';
  children: ReactNode;
}

const FeatureCard = ({ icon: Icon, title, description }: FeatureCardProps) => (
  <motion.div
    className="flex items-start space-x-4 p-4 rounded-lg hover:bg-green-500/5 dark:hover:bg-green-500/10 transition-colors group"
    whileHover={{ x: 8 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
  >
    <motion.div
      whileHover={{ rotate: 360, scale: 1.1 }}
      transition={{ duration: 0.5 }}
    >
      <Icon className="w-6 h-6 mt-1 text-green-600 dark:text-green-500 group-hover:text-green-500 dark:group-hover:text-green-400 transition-colors" />
    </motion.div>
    <div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-green-400">{title}</h3>
      <p className="text-gray-600 dark:text-green-500/80 leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

const JourneyCard = ({ title, description }: JourneyCardProps) => (
  <motion.div
    className="bg-green-50 dark:bg-green-500/10 p-4 rounded-lg border border-green-200 dark:border-green-500/20 hover:border-green-400 dark:hover:border-green-500/40 transition-all hover:shadow-lg hover:shadow-green-500/10"
    whileHover={{ y: -4, scale: 1.02 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
  >
    <h4 className="font-semibold mb-2 text-gray-900 dark:text-green-400">{title}</h4>
    <p className="text-gray-600 dark:text-green-500/80 leading-relaxed">{description}</p>
  </motion.div>
);

const ActionButton = ({ href, variant = "outlined", children }: ActionButtonProps) => {
  const baseStyles = "h-fit px-6 py-3 rounded-md font-mono relative overflow-hidden";
  const variants = {
    filled: "bg-green-600 dark:bg-green-500/20 border border-green-600 dark:border-green-500 text-white dark:text-green-400 hover:bg-green-700 dark:hover:bg-green-500/30",
    outlined: "border border-green-600 dark:border-green-500 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10"
  } as const;

  const Button = (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={`${baseStyles} ${variants[variant]} transition-colors`}
    >
      <motion.span
        className="relative z-10 flex items-center gap-2"
        whileHover={{ x: 3 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {children}
      </motion.span>
    </motion.button>
  );

  return href ? <Link href={href}>{Button}</Link> : Button;
};

export { FeatureCard, JourneyCard, ActionButton };