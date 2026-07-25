"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { RefObject } from "react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

export const MOTION = {
  duration: {
    fast: 0.15,
    base: 0.25,
    enter: 0.45,
  },
  ease: {
    enter: "power3.out",
    interface: "power2.out",
    emphasized: "back.out(1.4)",
  },
  stagger: {
    intro: 0.08,
    items: 0.07,
  },
} as const;

const OWNED_INLINE_PROPS = "transform,opacity,visibility,willChange";

type PageMotionOptions = {
  dependencies?: unknown[];
};

const clearAnimationStyles = (targets: Element[]) => {
  if (targets.length > 0) {
    gsap.set(targets, { clearProps: OWNED_INLINE_PROPS });
  }
};

/**
 * Runs a scoped page entrance and creates one-time ScrollTriggers for every
 * `[data-animate="section"]` group. Children carrying `data-animate-item`
 * stagger together; a section without marked children animates as one unit.
 */
export function usePageMotion(
  scope: RefObject<HTMLElement | null>,
  { dependencies = [] }: PageMotionOptions = {},
) {
  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;

      const introItems = Array.from(
        root.querySelectorAll<HTMLElement>('[data-animate="intro"]'),
      );
      const sections = Array.from(
        root.querySelectorAll<HTMLElement>('[data-animate="section"]'),
      );
      const sectionItems = sections.flatMap((section) => {
        const items = Array.from(
          section.querySelectorAll<HTMLElement>("[data-animate-item]"),
        );
        return items.length > 0 ? items : [section];
      });
      const allTargets = [...introItems, ...sectionItems];
      const media = gsap.matchMedia();

      media.add(
        {
          reduceMotion: "(prefers-reduced-motion: reduce)",
          allowMotion: "(prefers-reduced-motion: no-preference)",
        },
        (context) => {
          const { reduceMotion } = context.conditions as {
            reduceMotion: boolean;
            allowMotion: boolean;
          };

          if (reduceMotion) {
            clearAnimationStyles(allTargets);
            return;
          }

          if (introItems.length > 0) {
            gsap.fromTo(
              introItems,
              {
                autoAlpha: 0,
                y: 16,
                willChange: "transform,opacity",
              },
              {
                autoAlpha: 1,
                y: 0,
                duration: MOTION.duration.enter,
                ease: MOTION.ease.enter,
                stagger: MOTION.stagger.intro,
                onComplete: () => clearAnimationStyles(introItems),
              },
            );
          }

          sections.forEach((section) => {
            const items = Array.from(
              section.querySelectorAll<HTMLElement>("[data-animate-item]"),
            );
            const targets = items.length > 0 ? items : [section];

            gsap.fromTo(
              targets,
              {
                autoAlpha: 0,
                y: 16,
                willChange: "transform,opacity",
              },
              {
                autoAlpha: 1,
                y: 0,
                duration: MOTION.duration.enter,
                ease: MOTION.ease.enter,
                stagger: MOTION.stagger.items,
                onComplete: () => clearAnimationStyles(targets),
                scrollTrigger: {
                  trigger: section,
                  start: "top 85%",
                  once: true,
                },
              },
            );
          });
        },
        root,
      );

      return () => media.revert();
    },
    {
      scope,
      dependencies,
      revertOnUpdate: dependencies.length > 0,
    },
  );
}

export { gsap, ScrollTrigger, useGSAP };
