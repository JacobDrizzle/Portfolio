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
  <div className="flex items-start space-x-4">
    <Icon className="w-6 h-6 mt-1 text-green-500" />
    <div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-green-700/80 dark:text-green-500/80">{description}</p>
    </div>
  </div>
);

const JourneyCard = ({ title, description }: JourneyCardProps) => (
  <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
    <h4 className="font-semibold mb-2">{title}</h4>
    <p className="text-green-700/80 dark:text-green-500/80">{description}</p>
  </div>
);

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