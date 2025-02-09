"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close mobile menu when screen size increases
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) && 
        !(event.target as Element).closest('button[aria-label="Toggle menu"]')
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { href: '/projects', label: '/projects' },
    { href: '/about', label: '/about' },
    { href: '/contact', label: '/contact' },
  ] as const;

  const mobileMenuVariants = {
    closed: {
      opacity: 0,
      x: "100%",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40
      }
    },
    open: {
      opacity: 1,
      x: "0%",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40
      }
    }
  };

  return (
    <nav className="fixed w-full top-0 z-50 bg-black/80 backdrop-blur-md border-b border-green-500/20">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link 
            href="/" 
            className="text-green-400 font-mono text-xl hover:text-green-300 transition-colors"
          >
            &lt;dev/@DrDrizzle&gt;
          </Link>
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-green-300 font-mono hover:text-green-400 transition-colors ${
                  pathname === item.href ? 'text-green-400 border-b border-green-400' : ''
                }`}
              >
                {item.label}
              </Link>
            ))}
            <ThemeToggle />
          </div>
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-green-400 hover:text-green-300 transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6 opacity-0" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial="closed"
            animate="open"
            exit="closed"
            variants={mobileMenuVariants}
            className="fixed inset-y-0 right-0 w-64 bg-black/0 border-l border-green-500/20 md:hidden rounded-l-xl shadow-xl"
          >
            <div className="px-4 py-6 space-y-6 bg-white dark:bg-black rounded-l-xl">
              {/* Close button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-3 right-3 text-gray-800 dark:text-green-400 hover:text-green-300 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block text-gray-800 dark:text-green-300 font-mono hover:text-green-400 transition-colors ${
                    pathname === item.href ? 'text-green-400 border-l-2 border-green-400 pl-2' : ''
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-green-500/20">
                <ThemeToggle />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}