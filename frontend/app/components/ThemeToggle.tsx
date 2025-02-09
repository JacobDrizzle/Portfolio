// app/components/ThemeToggle.tsx
"use client";

import { useState, useEffect } from 'react';
import { SunIcon } from './Icons/SunIcon';
import { MoonIcon } from './Icons/MoonIcon';
import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="mr-6 text-white">
        <div className="w-6 h-6" /> {/* Placeholder to prevent layout shift */}
      </div>
    );
  }

  return (
    <button
      className="mr-6 text-emerald-300 hover:text-emerald-400"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === 'light' ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}