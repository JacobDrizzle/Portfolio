"use client";

import { useEffect, useRef } from "react";

const CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%";
const FONT_SIZE = 14;
const FRAME_DELAY = 4;

const createMatrixEffect = (canvas: HTMLCanvasElement) => {
  const context = canvas.getContext("2d");
  if (!context) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let cssWidth = 0;
  let cssHeight = 0;
  let drops: number[] = [];
  let animationFrame: number | null = null;
  let frameCount = 0;

  const themeColors = () => {
    const isDark = document.documentElement.classList.contains("dark");
    return {
      trail: isDark ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)",
      glyph: isDark ? "#00FF00" : "#166534",
    };
  };

  const prepareContext = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    cssWidth = Math.max(1, rect.width);
    cssHeight = Math.max(1, rect.height);
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.font = `${FONT_SIZE}px monospace`;

    const columnCount = Math.ceil(cssWidth / FONT_SIZE);
    drops = Array.from(
      { length: columnCount },
      () => -Math.floor(Math.random() * Math.max(1, cssHeight / FONT_SIZE)),
    );
  };

  const drawFrame = () => {
    const { trail, glyph } = themeColors();
    context.fillStyle = trail;
    context.fillRect(0, 0, cssWidth, cssHeight);
    context.fillStyle = glyph;
    context.font = `${FONT_SIZE}px monospace`;

    for (let index = 0; index < drops.length; index += 1) {
      const character =
        CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
      const x = index * FONT_SIZE;
      const y = drops[index] * FONT_SIZE;

      context.fillText(character, x, y);
      if (y > cssHeight && Math.random() > 0.975) {
        drops[index] = 0;
      }
      drops[index] += 1;
    }
  };

  const drawStaticFrame = () => {
    const { glyph } = themeColors();
    context.clearRect(0, 0, cssWidth, cssHeight);
    context.fillStyle = glyph;
    context.font = `${FONT_SIZE}px monospace`;

    drops.forEach((drop, index) => {
      const character =
        CHARACTERS[(index * 7 + Math.abs(drop)) % CHARACTERS.length];
      const row = Math.abs(drop) % Math.max(1, Math.floor(cssHeight / FONT_SIZE));
      context.fillText(character, index * FONT_SIZE, row * FONT_SIZE);
    });
  };

  const stop = () => {
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
  };

  const tick = () => {
    frameCount += 1;
    if (frameCount % FRAME_DELAY === 0) drawFrame();
    animationFrame = requestAnimationFrame(tick);
  };

  const syncPlayback = () => {
    stop();
    if (reducedMotion.matches) {
      drawStaticFrame();
      return;
    }
    if (document.visibilityState === "visible") {
      animationFrame = requestAnimationFrame(tick);
    }
  };

  const resize = () => {
    prepareContext();
    if (reducedMotion.matches) {
      drawStaticFrame();
    } else {
      drawFrame();
    }
  };

  const handleVisibilityChange = () => syncPlayback();
  const handleMotionPreferenceChange = () => syncPlayback();
  const handleThemeChange = () => {
    if (reducedMotion.matches) drawStaticFrame();
  };

  const resizeObserver = new ResizeObserver(resize);
  const themeObserver = new MutationObserver(handleThemeChange);
  resizeObserver.observe(canvas);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  document.addEventListener("visibilitychange", handleVisibilityChange);
  reducedMotion.addEventListener("change", handleMotionPreferenceChange);

  resize();
  syncPlayback();

  return () => {
    stop();
    resizeObserver.disconnect();
    themeObserver.disconnect();
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    reducedMotion.removeEventListener("change", handleMotionPreferenceChange);
  };
};

export default function MatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return createMatrixEffect(canvas);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed top-0 left-0 w-full h-full opacity-[0.07] pointer-events-none z-0"
    />
  );
}
