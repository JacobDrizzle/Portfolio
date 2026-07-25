// app/components/ThemeToggle.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { SunIcon } from "./Icons/SunIcon";
import { MoonIcon } from "./Icons/MoonIcon";
import { useTheme } from "next-themes";
import { MOTION, gsap, useGSAP } from "@/lib/motion";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const iconRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useGSAP(
    () => {
      if (!mounted || !iconRef.current) return;

      const icon = iconRef.current;
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
            gsap.set(icon, {
              clearProps: "transform,opacity,visibility,willChange",
            });
            return;
          }

          gsap.fromTo(
            icon,
            {
              autoAlpha: 0,
              scale: 0.72,
              rotation: -45,
              willChange: "transform,opacity",
            },
            {
              autoAlpha: 1,
              scale: 1,
              rotation: 0,
              duration: 0.3,
              ease: MOTION.ease.emphasized,
              onComplete: () => {
                gsap.set(icon, {
                  clearProps: "transform,opacity,visibility,willChange",
                });
              },
            },
          );
        },
        icon,
      );

      return () => media.revert();
    },
    {
      scope: iconRef,
      dependencies: [mounted, resolvedTheme],
      revertOnUpdate: true,
    },
  );

  if (!mounted) {
    return (
      <span className="mr-6 inline-block w-6 h-6" aria-hidden="true" />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      className="motion-button mr-6 text-emerald-300 hover:text-emerald-400"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
    >
      <span ref={iconRef} className="inline-flex">
        {isDark ? <SunIcon /> : <MoonIcon />}
      </span>
    </button>
  );
}
