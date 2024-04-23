"use client";
import React from "react";
import { useTheme } from "next-themes";
import { RiMoonLine, RiSunLine } from "react-icons/ri";
import { MoonIcon } from "../Icons/MoonIcon";
import { SunIcon } from "../Icons/SunIcon";

const DarkModeToggle = () => {
  const { theme, setTheme } = useTheme();
  return (
    <button className="hover:text-emerald-300"
      onClick={() => (theme == "dark" ? setTheme("light") : setTheme("dark"))}>
      {theme === "light" ? (
        <MoonIcon />
      ) : (
        <SunIcon />
      )}
    </button>
  );
};

export default DarkModeToggle;