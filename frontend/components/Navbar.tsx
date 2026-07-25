"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { MOTION, gsap, useGSAP } from "@/lib/motion";

const menuItems = [
  { href: "/ml", label: "/ml" },
  { href: "/projects", label: "/projects" },
  { href: "/about", label: "/about" },
  { href: "/contact", label: "/contact" },
] as const;

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const desktopMenuRef = useRef<HTMLDivElement>(null);
  const underlineRef = useRef<HTMLSpanElement>(null);
  const mobilePanelRef = useRef<HTMLDivElement>(null);

  // Close mobile menu when route changes.
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close the panel at the desktop breakpoint or with Escape.
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Close when a pointer lands outside the mobile panel and menu button.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (
        isOpen &&
        mobilePanelRef.current &&
        !mobilePanelRef.current.contains(target) &&
        !target.closest('button[aria-controls="mobile-navigation"]')
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Stagger the persistent desktop links on the first client render.
  useGSAP(
    () => {
      const links = Array.from(
        navRef.current?.querySelectorAll<HTMLElement>("[data-desktop-link]") ?? [],
      );
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
          if (reduceMotion) return;

          gsap.fromTo(
            links,
            { autoAlpha: 0, y: -10 },
            {
              autoAlpha: 1,
              y: 0,
              duration: MOTION.duration.base,
              ease: MOTION.ease.enter,
              stagger: MOTION.stagger.items,
              clearProps: "transform,opacity,visibility",
            },
          );
        },
        navRef.current ?? undefined,
      );
      return () => media.revert();
    },
    { scope: navRef },
  );

  // Move one shared underline to the active desktop route.
  useGSAP(
    () => {
      const menu = desktopMenuRef.current;
      const underline = underlineRef.current;
      if (!menu || !underline) return;

      const media = gsap.matchMedia();
      media.add(
        {
          isDesktop: "(min-width: 768px)",
          reduceMotion: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const { isDesktop, reduceMotion } = context.conditions as {
            isDesktop: boolean;
            reduceMotion: boolean;
          };
          if (!isDesktop) return;

          const activeLink = menu.querySelector<HTMLElement>(
            `[data-nav-path="${pathname}"]`,
          );
          if (!activeLink) {
            gsap.set(underline, { autoAlpha: 0 });
            return;
          }

          const positionUnderline = () => {
            const menuRect = menu.getBoundingClientRect();
            const linkRect = activeLink.getBoundingClientRect();
            const x = linkRect.left - menuRect.left;
            gsap.set(underline, { width: linkRect.width });
            const vars = {
              x,
              autoAlpha: 1,
            };

            if (reduceMotion) {
              gsap.set(underline, vars);
            } else {
              gsap.to(underline, {
                ...vars,
                duration: 0.35,
                ease: MOTION.ease.enter,
                overwrite: "auto",
              });
            }
          };

          positionUnderline();
          const observer = new ResizeObserver(positionUnderline);
          observer.observe(menu);
          return () => observer.disconnect();
        },
        menu,
      );

      return () => media.revert();
    },
    {
      scope: navRef,
      dependencies: [pathname],
      revertOnUpdate: true,
    },
  );

  // Keep the mobile panel mounted and drive visibility through one scoped timeline.
  useGSAP(
    () => {
      const panel = mobilePanelRef.current;
      if (!panel) return;

      const links = Array.from(
        panel.querySelectorAll<HTMLElement>("[data-mobile-link]"),
      );
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (reduceMotion) {
        gsap.set(panel, {
          autoAlpha: isOpen ? 1 : 0,
          xPercent: isOpen ? 0 : 100,
        });
        gsap.set(links, { clearProps: "transform,opacity,visibility" });
        return;
      }

      if (isOpen) {
        const timeline = gsap.timeline({
          defaults: { ease: MOTION.ease.enter },
        });
        timeline
          .fromTo(
            panel,
            {
              autoAlpha: 0,
              xPercent: 100,
              willChange: "transform,opacity",
            },
            {
              autoAlpha: 1,
              xPercent: 0,
              duration: 0.35,
            },
          )
          .fromTo(
            links,
            { autoAlpha: 0, x: 20 },
            {
              autoAlpha: 1,
              x: 0,
              duration: MOTION.duration.base,
              stagger: MOTION.stagger.items,
              clearProps: "transform,opacity,visibility",
            },
            "-=0.18",
          )
          .set(panel, { clearProps: "willChange" });
      } else {
        gsap.to(panel, {
          autoAlpha: 0,
          xPercent: 100,
          duration: MOTION.duration.base,
          ease: "power2.in",
          overwrite: true,
        });
      }
    },
    {
      scope: navRef,
      dependencies: [isOpen],
      revertOnUpdate: true,
    },
  );

  return (
    <nav
      ref={navRef}
      className="fixed w-full top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-green-200 dark:border-green-500/20 transition-colors"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link
            href="/"
            className="motion-button text-green-600 dark:text-green-400 font-mono text-xl hover:text-green-500 dark:hover:text-green-300"
          >
            &lt;dev/@DrDrizzle&gt;
          </Link>

          {/* Desktop Menu */}
          <div
            ref={desktopMenuRef}
            className="relative hidden md:flex items-center gap-6"
          >
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                data-desktop-link
                data-nav-path={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                className={`motion-icon relative text-gray-700 dark:text-green-300 font-mono hover:text-green-600 dark:hover:text-green-400 ${
                  pathname === item.href ? "text-green-600 dark:text-green-400" : ""
                }`}
              >
                {item.label}
              </Link>
            ))}
            <span
              ref={underlineRef}
              aria-hidden="true"
              className="absolute -bottom-1 left-0 h-0.5 bg-green-500 invisible"
            />
            <ThemeToggle />
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            className="motion-button md:hidden text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300"
            aria-label="Toggle menu"
            aria-controls="mobile-navigation"
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        id="mobile-navigation"
        ref={mobilePanelRef}
        aria-hidden={!isOpen}
        inert={!isOpen ? true : undefined}
        style={{ visibility: "hidden", opacity: 0 }}
        className="fixed inset-y-0 right-0 w-64 bg-transparent border-l border-green-200 dark:border-green-500/20 md:hidden rounded-l-xl shadow-xl"
      >
        <div className="px-4 py-6 space-y-6 bg-white dark:bg-black rounded-l-xl h-full">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="motion-button absolute top-3 right-3 text-gray-700 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>

          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              data-mobile-link
              aria-current={pathname === item.href ? "page" : undefined}
              className={`motion-link block text-gray-700 dark:text-green-300 font-mono hover:text-green-600 dark:hover:text-green-400 py-2 ${
                pathname === item.href
                  ? "text-green-600 dark:text-green-400 border-l-2 border-green-500 pl-2"
                  : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-4 border-t border-green-200 dark:border-green-500/20">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
