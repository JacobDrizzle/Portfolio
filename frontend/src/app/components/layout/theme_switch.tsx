"use client";
import { useState, useEffect } from 'react';
import { MoonIcon } from '../Icons/MoonIcon';
import { SunIcon } from '../Icons/SunIcon';
import { useTheme } from "next-themes";


export const DarkModeToggle = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();


  useEffect(() => {
    setMounted(true);
  }, []);


  if (!mounted) {
    return null;
  }


  return (
    <button
      className="mr-6 text-white hover:text-emerald-300"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {/* Render the correct icon based on the theme state */}
      {theme === 'light' ? <MoonIcon /> : <SunIcon />}
    </button>
  );
};

export default DarkModeToggle;