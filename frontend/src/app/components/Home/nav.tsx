"use client"
import { useState } from "react";
import DarkModeToggle from "../layout/theme_switch";

const Navbar = () => {
  // State to manage the visibility of the dropdown menu
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Function to toggle the dropdown menu
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <nav className="border-b border-neutral-500 dark:border-[rgba(255,255,255,0.1)] hover:border-emerald-400 dark:hover:border-emerald-400">
      <div className="flex flex-wrap items-center justify-between mx-auto p-4">
        <h1 className="text-2xl left-0 font-mono font-extrabold text-sky-500">{'>'}JacobDrizzle.Dev</h1>
        <div className="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
          <DarkModeToggle />
          <button
            type="button"
            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
            aria-expanded={isDropdownOpen ? "true" : "false"}
            onClick={toggleDropdown} // Toggle the dropdown menu when the button is clicked
          >
            <span className="sr-only">Open main menu</span>
            <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15"/>
            </svg>
          </button>
        </div>
        <div className={`items-center justify-between w-full md:flex md:w-auto md:order-1 ${isDropdownOpen ? '' : 'hidden'}`} id="navbar-cta">
          <ul className="flex flex-col mr-44 font-medium p-4 md:p-0 mt-4 border border-gray-100 rounded-lg md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0">
            <li>
              <a href="/resume" className="block py-2 px-3 md:p-0 text-white bg-blue-700 rounded md:bg-transparent md:text-blue-700 md:dark:text-blue-500" aria-current="page">Resume</a>
            </li>
            <li>
              <a href="/" className="block py-2 px-3 md:p-0 text-gray-200 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:dark:hover:text-blue-500 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700">About</a>
            </li>
            <li>
              <a href="/" className="block py-2 px-3 md:p-0 text-gray-200 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:dark:hover:text-blue-500 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700">Contact</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
