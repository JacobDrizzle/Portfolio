"use client";
import { useState, useEffect } from 'react';
import { MoonIcon } from '../Icons/MoonIcon';
import { SunIcon } from '../Icons/SunIcon';

const DarkModeToggle = () => {
  // Initialize the theme state to 'light' by default
  const [theme, setTheme] = useState('light');

  // UseEffect hook to set the initial theme state from local storage when the component mounts
  useEffect(() => {
    // Get the stored theme from local storage
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      // Set the theme state to the stored value
      setTheme(storedTheme);
    }
  }, []);

  // UseEffect hook to update the document body class and local storage when the theme changes
  useEffect(() => {
    // Update the document body class based on the theme
    document.body.className = theme === 'dark' ? 'dark' : 'light';
    // Update local storage with the new theme value
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Handle toggle button click
  const handleToggle = () => {
    // Toggle the theme state
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  return (
    <button
      className="mr-6 text-white hover:text-emerald-300"
      onClick={handleToggle}
    >
      {/* Render the correct icon based on the theme state */}
      {theme === 'light' ? <MoonIcon /> : <SunIcon />}
    </button>
  );
};

export default DarkModeToggle;