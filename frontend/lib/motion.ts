import type { Variants } from "framer-motion";

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const EASE_IN_OUT = [0.4, 0, 0.2, 1] as const;

export const DUR_FAST = 0.15;
export const DUR_BASE = 0.25;
export const DUR_ENTER = 0.5;

export const pageEnter = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: DUR_ENTER, ease: EASE_OUT },
};

export const sectionReveal = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.4, ease: EASE_OUT },
};

export const staggerContainer: Variants = {
  animate: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: EASE_OUT },
  },
};

export const cardHover = {
  whileHover: { y: -3, scale: 1.01 },
  transition: { duration: DUR_BASE, ease: EASE_IN_OUT },
};

export const buttonHover = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: { duration: DUR_FAST, ease: EASE_IN_OUT },
};

export const iconHover = {
  whileHover: { y: -1, scale: 1.05 },
  transition: { duration: DUR_FAST, ease: EASE_IN_OUT },
};

export const linkHover = {
  whileHover: { x: 2 },
  transition: { duration: DUR_FAST, ease: EASE_IN_OUT },
};
